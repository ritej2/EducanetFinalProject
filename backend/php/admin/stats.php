<?php
/**
 * Admin Stats API
 * GET /api/admin/stats.php
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../utils/JWTHandler.php';
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../models/UserModel.php';
require_once __DIR__ . '/../../models/Child.php';
require_once __DIR__ . '/../../models/Conversation.php';

// Verify admin authentication
$payload = JWT::verifyRequest();
if (!$payload || ($payload['role'] ?? '') !== 'admin') {
    Response::unauthorized('Accès réservé aux administrateurs');
}

try {
    // We can use the models if they are set up correctly, or direct SQL if models are missing.
    // Assuming models exist since we saw the folder.

    // Total Users
    // Check if we can use User model or need direct DB
    $db = getDBConnection();
    $totalUsers = (int) $db->query("SELECT COUNT(*) FROM users")->fetchColumn();

    // Total Children
    $childModel = new Child();
    $totalChildren = $childModel->getTotalCount();

    // Total Conversations
    $conversationModel = new Conversation();
    $totalConversations = $conversationModel->getTotalCount();

    Response::success([
        'users' => $totalUsers,
        'children' => $totalChildren,
        'conversations' => $totalConversations
    ]);

} catch (Exception $e) {
    Response::error($e->getMessage());
}
?>