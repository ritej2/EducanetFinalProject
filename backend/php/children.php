<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../models/Child.php';
require_once __DIR__ . '/../utils/JWTHandler.php';
require_once __DIR__ . '/../utils/Response.php';

// Verify authentication
$payload = JWT::verifyRequest();
if (!$payload) {
    Response::unauthorized(JWT::$lastError);
}

$userId = $payload['user_id'];
$childModel = new Child();

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $id = $_GET['id'] ?? null;
            if ($id) {
                $child = $childModel->findById($id, $userId);
                if ($child) {
                    Response::success($child);
                } else {
                    Response::notFound('Enfant non trouvé');
                }
            } else {
                $children = $childModel->getAllByUserId($userId);
                Response::success($children);
            }
            break;

        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            if (empty($input['first_name']) || empty($input['birth_date']) || empty($input['gender'])) {
                Response::error('Données incomplètes');
            }

            $id = $input['id'] ?? null;
            if ($id) {
                // Update
                $child = $childModel->update($id, $userId, $input);
                Response::success($child, 'Enfant mis à jour');
            } else {
                // Create
                $child = $childModel->create($userId, $input);
                Response::success($child, 'Enfant ajouté', 201);
            }
            break;

        case 'DELETE':
            $id = $_GET['id'] ?? null;
            if (!$id) {
                Response::error('ID requis');
            }
            $success = $childModel->delete($id, $userId);
            if ($success) {
                Response::success(null, 'Enfant supprimé');
            } else {
                Response::error('Erreur lors de la suppression');
            }
            break;

        default:
            Response::error('Method not allowed', 405);
    }
} catch (Exception $e) {
    Response::error('Erreur serveur : ' . $e->getMessage(), 500);
}
