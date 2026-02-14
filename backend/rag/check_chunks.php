<?php
require_once __DIR__ . '/config.php';
$pdo = getDBConnection();
$stmt = $pdo->query("SELECT count(*) as count FROM document_chunks");
$row = $stmt->fetch();
echo "Document chunks count: " . $row['count'] . "\n";

$stmt = $pdo->query("SELECT source_file, count(*) as count FROM document_chunks GROUP BY source_file");
$rows = $stmt->fetchAll();
foreach ($rows as $r) {
    echo " - " . $r['source_file'] . ": " . $r['count'] . " chunks\n";
}
