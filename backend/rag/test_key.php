<?php
require_once __DIR__ . '/config.php';

echo "Testing OpenRouter Key: " . substr(OPENROUTER_API_KEY, 0, 10) . "...\n";

try {
    $result = callEmbeddingAPI("Hello world");
    echo "SUCCESS! Received embedding. First 3 values: " . implode(", ", array_slice($result, 0, 3)) . "\n";
} catch (Exception $e) {
    echo "FAILED: " . $e->getMessage() . "\n";
}
?>