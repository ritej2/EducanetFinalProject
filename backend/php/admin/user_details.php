<?php
/**
 * User Details API
 * GET /api/admin/user_details.php?id=X
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../utils/JWTHandler.php';
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../models/UserModel.php';
require_once __DIR__ . '/../../models/Child.php';
require_once __DIR__ . '/../../models/Conversation.php';

$payload = JWT::verifyRequest();
if (!$payload || $payload['role'] !== 'admin') {
    Response::unauthorized('Accès réservé aux administrateurs');
}

$userId = $_GET['id'] ?? null;
if (!$userId) {
    Response::error('ID utilisateur requis');
}

try {
    $userModel = new User();
    $childModel = new Child();
    $conversationModel = new Conversation();

    $user = $userModel->findById($userId);
    if (!$user) {
        Response::notFound('Utilisateur non trouvé');
    }

    $children = $childModel->getAllByUserId($userId);
    $conversations = $conversationModel->getUserConversations($userId);

    Response::success([
        'profile' => $userModel->sanitize($user),
        'children' => $children,
        'stats' => [
            'conversations_count' => count($conversations),
            'messages_sent_count' => 0 // put real value if you have it
        ]
    ]);

} catch (Exception $e) {
    Response::error($e->getMessage());
}
