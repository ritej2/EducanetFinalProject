<?php
/**
 * Signup API Endpoint
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

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate input
$errors = [];

if (empty($input['name'])) {
    $errors['name'] = 'Le nom est requis';
}

if (empty($input['email'])) {
    $errors['email'] = 'L\'email est requis';
} elseif (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Email invalide';
}

if (empty($input['password'])) {
    $errors['password'] = 'Le mot de passe est requis';
} elseif (strlen($input['password']) < 6) {
    $errors['password'] = 'Le mot de passe doit contenir au moins 6 caractères';
}

if (!empty($errors)) {
    Response::validationError($errors);
}

// Create user
try {
    $userModel = new User();
    $user = $userModel->create(
        $input['name'],
        $input['email'],
        $input['password'],
        $input['phone']
    );

    if (!$user) {
        Response::error('Cet email est déjà utilisé', 409);
    }

    // Generate JWT token
    $token = JWT::encode([
        'user_id' => $user['id'],
        'email' => $user['email']
    ]);

    // Return success response
    Response::success([
        'token' => $token,
        'user' => $userModel->sanitize($user)
    ], 'Compte créé avec succès', 201);
} catch (PDOException $e) {
    Response::error('Erreur de base de données : ' . $e->getMessage(), 500);
} catch (Exception $e) {
    Response::error('Une erreur inattendue est survenue : ' . $e->getMessage(), 500);
}
?>
