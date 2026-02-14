<?php
// api/getHomeworkDetail.php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// 🔐 TOKEN TECHNIQUE EDUCAnet
$token = 'EDUCANET_TECH_TOKEN';

// Récupération des paramètres
$homeworkId = isset($_GET['homeworkId']) ? $_GET['homeworkId'] : 0;

if (!$homeworkId) {
    echo json_encode(['error' => 'Missing homeworkId']);
    exit;
}

// URL Upstream
// Based on user request: /api/direct/mobile/homeWork/getDetail
// We assume it takes 'id' as query param given the typical pattern, or we append it.
// Experimenting with 'id' parameter.
$url = "https://mon-compte.rafi9ni.pro/api/direct/mobile/homeWork/getDetail?id=$homeworkId";

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer $token"
    ]
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo json_encode([
        'error' => 'Error fetching details',
        'status' => $httpCode,
        'upstream_response' => $response
    ]);
    exit;
}

echo $response;
