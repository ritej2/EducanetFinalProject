<?php
/**
 * RAG Configuration
 */

// Database connection (reuse existing)
require_once __DIR__ . '/../config/database.php';

// OpenRouter API Configuration (Chat)
define('OPENROUTER_API_KEY', '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');
define('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1');
// OpenAI GPT-4o-mini (Stable and Cheap)
define('OPENROUTER_MODEL', 'openai/gpt-4o-mini');

// OpenAI/OpenRouter Embedding Model
define('EMBEDDING_MODEL', 'openai/text-embedding-3-small');
define('OPENROUTER_EMBED_URL', 'https://openrouter.ai/api/v1/embeddings');

/**
 * Call OpenRouter API (OpenAI Compatible)
 */
function callOpenRouter($messages, $stream = false)
{
    $ch = curl_init(OPENROUTER_BASE_URL . '/chat/completions');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Fix for Windows local cert issues
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . OPENROUTER_API_KEY,
        'Content-Type: application/json',
        'HTTP-Referer: http://localhost:4200', // Required by OpenRouter
        'X-Title: Rafi9ni' // Optional title
    ]);

    $data = [
        'model' => OPENROUTER_MODEL,
        'messages' => $messages,
        'stream' => $stream
    ];

    if ($stream) {
        return $ch; // Return the handle for streaming
    }

    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    $response = curl_exec($ch);

    if (curl_errno($ch)) {
        throw new Exception('OpenRouter Curl error: ' . curl_error($ch));
    }
    curl_close($ch);
    return json_decode($response, true);
}

/**
 * Call Hugging Face API for Embeddings
 */
/**
 * Call OpenRouter API for Embeddings
 */
function callEmbeddingAPI($text)
{
    $ch = curl_init(OPENROUTER_EMBED_URL);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . OPENROUTER_API_KEY,
        'Content-Type: application/json',
        'HTTP-Referer: http://localhost:4200'
    ]);

    $data = [
        'model' => EMBEDDING_MODEL,
        'input' => $text
    ];

    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    $response = curl_exec($ch);

    if (curl_errno($ch)) {
        throw new Exception('OpenRouter Embed Curl error: ' . curl_error($ch));
    }
    curl_close($ch);

    $result = json_decode($response, true);

    if (isset($result['error'])) {
        $msg = is_array($result['error']) ? json_encode($result['error']) : $result['error']['message'] ?? $result['error'];
        file_put_contents(__DIR__ . '/embed_debug.log', "Error: $msg\n", FILE_APPEND);
        throw new Exception("Embedding Error: $msg");
    }

    if (isset($result['data'][0]['embedding'])) {
        return $result['data'][0]['embedding'];
    }

    throw new Exception("Invalid embedding response structure: " . substr($response, 0, 100));
}
