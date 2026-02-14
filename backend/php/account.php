<?php




if (ob_get_length())
    ob_clean();
ob_start();

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../utils/JWTHandler.php';
require_once __DIR__ . '/../utils/Response.php';

// Set header correctly
header('Content-Type: application/json');

// Verify authentication
$payload = JWT::verifyRequest();
if (!$payload) {
    Response::unauthorized();
}

$userId = $payload['user_id'];
$userModel = new User();

// Handle different HTTP methods
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $user = $userModel->findById($userId);
        if ($user) {
            Response::success($userModel->sanitize($user));
        } else {
            Response::notFound('Utilisateur non trouvé');
        }
        break;

    case 'POST':
    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            Response::error('Données invalides');
        }

        $success = $userModel->update($userId, $input);

        // Handle password change if provided
        if ($success && !empty($input['newPassword'])) {
            $userModel->changePassword($userId, $input['newPassword']);
        }

        if ($success) {
            $updatedUser = $userModel->findById($userId);
            Response::success($userModel->sanitize($updatedUser), 'Profil mis à jour');
        } else {
            Response::error('Erreur lors de la mise à jour');
        }
        break;

    case 'DELETE':
        $success = $userModel->delete($userId);
        if ($success) {
            Response::success(null, 'Compte supprimé');
        } else {
            Response::error('Erreur lors de la suppression');
        }
        break;

    default:
        Response::error('Method not allowed', 405);
}
?>