<?php
//**Allow an administrator to view the admin activity logs, and block everyone else. */
/**
 * Admin: Logs API
 * GET /api/admin/logs.php - View admin logs
 */

require_once __DIR__ . '/../../config/cors.php';//Allows frontend (Angular) to call the API
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/UserModel.php';//User-related logic (DB access)
require_once __DIR__ . '/../../utils/JWTHandler.php';//Verifies the login token
require_once __DIR__ . '/../../utils/Response.php';//Sends clean JSON responses

// Verify Admin Token
$payload = JWT::verifyRequest();
if (!$payload || ($payload['role'] ?? 'user') !== 'admin') {
    Response::error('Accès refusé.', 403);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $db = getDBConnection();
    $stmt = $db->prepare("
        SELECT l.*, u.name as admin_name 
        FROM admin_logs l 
        JOIN users u ON l.admin_id = u.id 
        ORDER BY l.created_at DESC 
        LIMIT 100
    ");
    $stmt->execute();
    Response::success($stmt->fetchAll(PDO::FETCH_ASSOC));
}
?>