<?php
ob_start(); // Buffer output to prevent whitespace/warnings before JSON
ini_set('display_errors', 0); // Disable HTML error output
ini_set('log_errors', 1); // Ensure errors are logged instead


require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../models/Message.php';
require_once __DIR__ . '/../../models/Conversation.php';
require_once __DIR__ . '/../../utils/JWTHandler.php';
require_once __DIR__ . '/../../utils/Response.php';


$payload = JWT::verifyRequest();
if (!$payload) {
    Response::unauthorized();
}

$userId = $payload['user_id'];
$messageModel = new Message();
$conversationModel = new Conversation();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':

        $conversationId = $_GET['conversation_id'] ?? null;

        if (!$conversationId) {
            Response::error('ID de conversation requis');
        }

        $conversation = $conversationModel->findById($conversationId);
        if (!$conversation || $conversation['user_id'] != $userId) {
            Response::unauthorized('Accès non autorisé à cette conversation');
        }

        $messages = $messageModel->getConversationMessages($conversationId);
        ob_clean(); // Discard any previous output
        Response::success($messages);
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);


        $conversationId = $input['conversation_id'] ?? null;
        $sender = $input['sender'] ?? $input['role'] ?? null;
        $message_text = $input['message'] ?? $input['content'] ?? null;

        if (!$conversationId || !$sender || !$message_text) {
            $missing = [];
            if (!$conversationId)
                $missing[] = 'conversation_id';
            if (!$sender)
                $missing[] = 'sender/role';
            if (!$message_text)
                $missing[] = 'message/content';
            Response::error('Données manquantes : ' . implode(', ', $missing));
        }
        try {
            $role = $sender;
            if ($role === 'assistant')
                $role = 'ai';

            $conversation = $conversationModel->findById($conversationId);
            if (!$conversation || $conversation['user_id'] != $userId) {
                Response::unauthorized('Accès non autorisé à cette conversation');
            }

            // Save the message
            $message = $messageModel->create($conversationId, $role, $message_text);

            // Update conversation timestamp
            $conversationModel->touch($conversationId);

            ob_clean(); // Discard any previous output
            Response::success($message, 'Message enregistré', 201);
        } catch (Exception $e) {
            ob_clean();
            Response::error('Erreur lors de l\'enregistrement: ' . $e->getMessage(), 500);
        }
        break;

    default:
        Response::error('Method not allowed', 405);
}