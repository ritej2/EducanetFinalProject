<?php
/**
 * Verify Token API Endpoint
 */

// Prevent PHP from outputting errors as HTML/Text
error_reporting(0);
ini_set('display_errors', 0);

// Clear any previous output (whitespace, notices)
if (ob_get_length())
    ob_clean();
ob_start();

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../models/UserModel.php';
require_once __DIR__ . '/../../utils/JWTHandler.php';
require_once __DIR__ . '/../../utils/Response.php';

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

// Verify JWT token
$payload = JWT::verifyRequest();

if (!$payload) {
    Response::unauthorized('Token invalide ou expiré');
}

// Get user data
$userModel = new User();
$user = $userModel->findById($payload['user_id']);

if (!$user) {
    Response::unauthorized('Utilisateur non trouvé');
}

// Return user data
Response::success([
    'user' => $userModel->sanitize($user)
], 'Token valide');
?>