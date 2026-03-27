<?php
/**
 * RAG Chatbot Script
 * Optimized for Angular integration and DB persistence.
 */

// Permettre à l'erreur de s'afficher pour le debug
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/config.php';
$pdo = getDBConnection();

// STEP 1 & 2: Prove key is loaded
$currentKey = defined('OPENROUTER_API_KEY') ? OPENROUTER_API_KEY : 'NOT_DEFINED';
$masked = (strlen($currentKey) > 10) ? substr($currentKey, 0, 8) . "..." : $currentKey;
ragLog("SYSTEM START - API Key Status: " . $masked);

if ($currentKey === 'NOT_DEFINED' || empty($currentKey)) {
    ragLog("CRITICAL ERROR: OPENROUTER_API_KEY is missing or empty in web context.");
}

// Disable output buffering
if (ob_get_level())
    ob_end_clean();
header('Content-Type: application/x-ndjson');
header('Cache-Control: no-cache');
header('X-Accel-Buffering: no'); // For Nginx
header('Connection: keep-alive');

/**
 * Log debug information
 */
function ragLog($msg)
{
    file_put_contents(__DIR__ . '/rag_debug.log', "[" . date('Y-m-d H:i:s') . "] " . $msg . PHP_EOL, FILE_APPEND);
}

/**
 * Cosine Similarity
 */
function cosineSimilarity($vec1, $vec2)
{
    if (count($vec1) !== count($vec2))
        return 0;
    $dotProduct = 0;
    $norm1 = 0;
    $norm2 = 0;
    for ($i = 0; $i < count($vec1); $i++) {
        $dotProduct += $vec1[$i] * $vec2[$i];
        $norm1 += $vec1[$i] ** 2;
        $norm2 += $vec2[$i] ** 2;
    }
    return ($norm1 == 0 || $norm2 == 0) ? 0 : $dotProduct / (sqrt($norm1) * sqrt($norm2));
}

/**
 * Save AI Response to DB
 */
function saveAIMessage($pdo, $conversationId, $content)
{
    if (!$conversationId || empty($content))
        return;
    try {
        $stmt = $pdo->prepare("INSERT INTO chat_messages (conversation_id, sender, message) VALUES (?, 'ai', ?)");
        $stmt->execute([$conversationId, $content]);
    } catch (Exception $e) {
        ragLog("DB Error: " . $e->getMessage());
    }
}

// 1. Get Input
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);
ragLog("Received: " . $rawInput);

$question = '';
$history = [];
$conversationId = null;

if ($input) {
    $conversationId = $input['conversation_id'] ?? null;
    $history = $input['messages'] ?? [];

    // STRENGTHENED FILTERING: Filter history to ensure all messages are valid objects with role and content
    $history = array_filter($history, function ($msg) {
        return is_array($msg) &&
            !empty($msg) &&
            isset($msg['role'], $msg['content']) &&
            trim((string) $msg['content']) !== '';
    });
    // Re-index array
    $history = array_values($history);

    // Find last user message
    foreach (array_reverse($history) as $msg) {
        if (isset($msg['role']) && $msg['role'] === 'user') {
            $question = $msg['content'] ?? '';
            break;
        }
    }
} else {
    $question = $_GET['question'] ?? '';
}

if (empty($question)) {
    ragLog("Error: Question manquante");
    http_response_code(400);
    die(json_encode(['error' => 'Question manquante']));
}

try {
    // 2. Embed
    // 2. Embed
    $startEmbed = microtime(true);
    // Use OpenRouter for embeddings
    $embedding = callEmbeddingAPI($question);

    // Normalize format if needed. HF returns simple array for single input: [0.1, 0.2, ...]
    if (!is_array($embedding) || empty($embedding)) {
        throw new Exception("Échec de la génération d'embedding (Réponse vide ou invalide)");
    }
    // Handle case where it returns [[0.1, ...]] (batch format)
    if (isset($embedding[0]) && is_array($embedding[0])) {
        $embedding = $embedding[0];
    }

    $embedTime = microtime(true) - $startEmbed;
    ragLog("Embedding time: " . round($embedTime, 4) . "s");

    $queryVector = $embedding;

    // 3. Search Chunks
    $startSearch = microtime(true);
    $stmt = $pdo->query("SELECT content, embedding, source_file FROM document_chunks");
    $allChunks = $stmt->fetchAll();

    $contextText = "Aucun document source disponible.";
    if (!empty($allChunks)) {
        $results = [];
        foreach ($allChunks as $chunk) {
            $vec = json_decode($chunk['embedding'], true);
            if ($vec) {
                $sim = cosineSimilarity($queryVector, $vec);
                $results[] = ['content' => $chunk['content'], 'similarity' => $sim, 'source' => $chunk['source_file']];
            }
        }
        usort($results, function ($a, $b) {
            return $b['similarity'] <=> $a['similarity'];
        });

        $contextStrings = [];
        $searchTime = microtime(true) - $startSearch;
        ragLog("Search/Similarity time (" . count($allChunks) . " chunks): " . round($searchTime, 4) . "s");

        foreach (array_slice($results, 0, 5) as $c) {
            ragLog("Score: " . round($c['similarity'], 4) . " | Source: " . $c['source']);
            // Lower threshold to 0.18 for better inclusivity
            if ($c['similarity'] > 0.18) {
                $contextStrings[] = "[Source: " . $c['source'] . "]: " . $c['content'];
            }
        }
        if (!empty($contextStrings))
            $contextText = implode("\n", $contextStrings);
    }

    // 4. Prepare Chat
    $ragInstructions = "### CONTEXTE ISSU DES DOCUMENTS (RAG) :\n" . $contextText . "\n\n" .
        "INSTRUCTION CRITIQUE : Ce contexte est-il utile pour la question ? " .
        "OUI -> Utilise-le. " .
        "NON (sujet différent) -> IGNORE-LE complètement et réponds avec ton expertise pédagogique.";

    if (count($history) > 0 && $history[0]['role'] === 'system') {
        $history[0]['content'] .= "\n\n" . $ragInstructions;
    } else {
        array_unshift($history, ['role' => 'system', 'content' => $ragInstructions]);
    }

    $stream = isset($input['stream']) ? $input['stream'] : false;

    // Use OpenRouter (OpenAI Compatible)
    $ch = callOpenRouter($history, $stream);

    if ($stream) {
        // ch is already configured for streaming in callOpenRouter, 
        // but we need to ensure the body is set correctly for this specific call.
        $data = [
            'model' => OPENROUTER_MODEL,
            'messages' => $history,
            'stream' => true
        ];
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

        // Output headers for SSE
        header('Content-Type: text/event-stream');
        header('Cache-Control: no-cache');

        $fullAIResponse = "";
        // On utilise un tampon pour reconstruire la réponse complète pour la DB
        $streamBuffer = "";
        curl_setopt($ch, CURLOPT_WRITEFUNCTION, function ($ch, $data) use (&$fullAIResponse, &$streamBuffer) {
            file_put_contents(__DIR__ . '/chatbot_debug.log', "Chunk: " . $data . "\n", FILE_APPEND); // Log each chunk
            // Echo raw chunk for debug/client
            // OpenRouter/OpenAI sends: data: {"id":..., "choices":[{"delta":{"content":"..."}}]}
            echo $data;
            $streamBuffer .= $data;

            // Parse for DB accumulation
            $lines = explode("\n", $data); // Use $data here, not $chunk
            foreach ($lines as $line) {
                $line = trim($line);
                if (strpos($line, 'data: ') === 0) {
                    $jsonStr = substr($line, 6);
                    if ($jsonStr === '[DONE]')
                        continue;

                    $d = json_decode($jsonStr, true);
                    if (isset($d['choices'][0]['delta']['content'])) {
                        $fullAIResponse .= $d['choices'][0]['delta']['content'];
                    }
                }
            }

            if (ob_get_level() > 0)
                ob_flush();
            flush();
            return strlen($data);
        });

        curl_exec($ch);
        curl_close($ch);

        if (!empty($fullAIResponse)) {
            saveAIMessage($pdo, $conversationId, $fullAIResponse);
        }

    } else {
        // Non-streaming via curl_exec in default helper? 
        // We need to customize because helper does setup only.
        // Actually helper handles non-stream fully? 
        // No, helper returns decoded array for non-stream.

        // Let's re-call helper properly for non-stream
        $response = callOpenRouter($history, false);

        if (isset($response['choices'][0]['message']['content'])) {
            $content = $response['choices'][0]['message']['content'];
            echo json_encode(['message' => ['content' => $content]]);
            saveAIMessage($pdo, $conversationId, $content);
        } else {
            ragLog("API Error: " . json_encode($response));
            echo json_encode(['error' => 'API Error', 'details' => $response]);
        }
    }

} catch (Exception $e) {
    ragLog("Fatal Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}