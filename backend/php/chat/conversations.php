<?php
ob_start();
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../models/Conversation.php';
require_once __DIR__ . '/../../utils/JWTHandler.php';
require_once __DIR__ . '/../../utils/Response.php';


$payload = JWT::verifyRequest();
if (!$payload) {
    Response::unauthorized();
}

$userId = $payload['user_id'];
$conversationModel = new Conversation();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $conversations = $conversationModel->getUserConversations($userId);
        ob_clean();
        Response::success($conversations);
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        $title = $input['title'] ?? 'Nouvelle conversation';

        $conversation = $conversationModel->create($userId, $title);
        ob_clean();
        Response::success($conversation, 'Conversation créée', 201);
        break;

    case 'DELETE':

        $id = $_GET['id'] ?? null;

        if (!$id) {
            Response::error('ID de conversation requis');
        }

        $success = $conversationModel->delete($id, $userId);

        if ($success) {
            Response::success(null, 'Conversation supprimée');
        } else {
            Response::notFound('Conversation non trouvée');
        }
        break;

    default:
        Response::error('Method not allowed', 405);
}