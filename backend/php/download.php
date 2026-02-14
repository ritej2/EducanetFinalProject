<?php
// api/download.php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

$fileName = $_GET['fileName'] ?? null;
$filePath = $_GET['path'] ?? null;

// Base directory (to be adjusted by the user for local vs production)
$baseDir = "/root/zenhosting/files/plateformeEcole/apache-tomcat-7.0.57/webapps/HwFile/Rafi9niServiceRAFI9NI/";

if ($filePath) {
    // Normaliser les slashs pour Windows/Linux
    $path = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $filePath);
} else if ($fileName) {
    $path = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $baseDir . $fileName);
} else {
    http_response_code(400);
    error_log("download.php: Missing params");
    exit('Missing fileName or path');
}

// Log for debugging
error_log("download.php: Trying to access $path");

// --- LOGIQUE DE PONT (PROXIFY) ---
// Si le chemin ressemble à une URL ou pointe vers /root/ (serveur distant)
// On essaie de le récupérer directement via HTTP si localement il n'existe pas
if (!file_exists($path)) {
    // --- LOGIQUE DE PONT (PROXIFY) ---
    $remoteUrl = "https://staff.rafi9ni.pro";

    // 1. Normaliser le chemin (nettoyer les /bin/../)
    $cleanPath = str_replace(DIRECTORY_SEPARATOR, '/', $path);

    // 2. Extraire la partie après 'HwFile/'
    $hwFilePos = strpos($cleanPath, 'HwFile/');
    if ($hwFilePos !== false) {
        $suffix = substr($cleanPath, $hwFilePos); // ex: HwFile/Rafi9niAmani 2025Laataoui/file.pdf

        // 3. Encoder SEULEMENT les segments du chemin (pas les /)
        $segments = explode('/', $suffix);
        $encodedSegments = array_map('rawurlencode', $segments);
        $targetUrl = $remoteUrl . '/' . implode('/', $encodedSegments);

        error_log("download.php: Local file not found. Proxifying: $targetUrl");

        $fileData = false;

        // Tentative 1: file_get_contents (si activé)
        if (ini_get('allow_url_fopen')) {
            $fileData = @file_get_contents($targetUrl);
        }

        // Tentative 2: cURL (si file_get_contents a échoué ou est désactivé)
        if ($fileData === false && function_exists('curl_init')) {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $targetUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_USERAGENT, 'Rafi9ni-Bridge');
            $fileData = curl_exec($ch);
            curl_close($ch);
        }

        if ($fileData !== false) {
            // Détecter le mime type à partir du suffixe original (non encodé) ou du contenu
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mime = $finfo->buffer($fileData);

            header('Content-Type: ' . ($mime ?: 'application/octet-stream'));
            header('Content-Disposition: attachment; filename="' . basename($suffix) . '"');
            echo $fileData;
            exit;
        } else {
            http_response_code(404);
            error_log("download.php: Remote fetch failed for $targetUrl");
            exit("Fichier introuvable localement et impossible de le récupérer à distance.\nURL: $targetUrl");
        }
    }

    http_response_code(404);
    error_log("download.php: Path mismatch - No HwFile segment found in $path");
    exit("Fichier introuvable localement et chemin non reconnu pour le serveur distant.\nChemin: $path");
}

// Déterminer le type MIME
$ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
$contentType = 'application/octet-stream';
if ($ext === 'pdf')
    $contentType = 'application/pdf';
elseif ($ext === 'doc' || $ext === 'docx')
    $contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

header('Content-Type: ' . $contentType);
header('Content-Disposition: attachment; filename="' . basename($fileName) . '"');
readfile($path);
exit;
