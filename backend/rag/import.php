<?php
/**
 * Import Documents Script
 * Reads .txt files, chunks them, gets embeddings, and saves to DB.
 */

require_once __DIR__ . '/config.php';

$pdo = getDBConnection();
$docsDir = __DIR__ . '/../documents/';

// 1. Clear existing chunks to avoid duplicates and dimension mismatches
echo "Nettoyage de la base de données...\n";
$pdo->exec("TRUNCATE TABLE document_chunks");

// 2. Scan the documents folder
$files = glob($docsDir . '*.txt');

echo "Démarrage de l'importation...\n";

foreach ($files as $file) {
    $filename = basename($file);
    echo "Traitement de : $filename\n";

    $content = file_get_contents($file);

    // 2. Simple chunking (by paragraphs or fixed length)
    // Here we split by new lines for simplicity, but you could use a fixed size
    $chunks = explode("\n", $content);

    foreach ($chunks as $chunk) {
        $chunk = trim($chunk);
        if (empty($chunk))
            continue;

        echo " - Génération de l'embedding pour un morceau...\n";

        try {
            // 3. Call Embedding API (OpenRouter)
            $embedding = callEmbeddingAPI($chunk);

            // Normalize
            if (isset($embedding[0]) && is_array($embedding[0])) {
                $embedding = $embedding[0];
            }

            if (!empty($embedding) && is_array($embedding)) {

                // 4. Store in database
                $stmt = $pdo->prepare("INSERT INTO document_chunks (content, embedding, source_file) VALUES (?, ?, ?)");
                $stmt->execute([
                    $chunk,
                    json_encode($embedding),
                    $filename
                ]);
            } else {
                echo " [ERREUR] Impossible de générer l'embedding pour : " . substr($chunk, 0, 30) . "...\n";
                echo "          Réponse invalide ou vide.\n";
            }
        } catch (Exception $e) {
            echo " [ERREUR] System: " . $e->getMessage() . "\n";
        }
    }
}

echo "Importation terminée !\n";
