<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Récupération des paramètres GET
$levelId = isset($_GET['levelId']) ? $_GET['levelId'] : 5;
$idrole = isset($_GET['idrole']) ? $_GET['idrole'] : 3;
$count = isset($_GET['count']) ? $_GET['count'] : 10;

// URL API 1 (sans token)
$url = "https://mon-compte.rafi9ni.pro/api/external/mobile/AI/SearchHomeWork/Rafi9ni/$levelId/$idrole/$count";

// Initialisation CURL
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true, // suivre les redirections
    CURLOPT_SSL_VERIFYPEER => false, // pour dev local si SSL bloque
    CURLOPT_SSL_VERIFYHOST => false,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Vérifier que la réponse est bien un JSON
$json = json_decode($response, true);
if ($json === null) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Invalid JSON from API 1',
        'raw_response' => $response
    ]);
    exit;
}

// ✅ Retourner le JSON pur à Angular
echo json_encode($json);
