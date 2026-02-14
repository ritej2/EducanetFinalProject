<?php
/**
 * PURPOSE: Handles message-related database operations.
 * CONTENT: Methods for storing and retrieving individual chat messages.
 */
/**
 * Message Model
 * Handles message-related database operations
 */

require_once __DIR__ . '/../config/database.php';

class Message
{
    private $db;

    public function __construct()
    {
        $this->db = getDBConnection();
    }

    /**
     * Create a new message
     * @param int $conversationId
     * @param string $role (user, ai, system)
     * @param string $content
     * @return array
     */
    public function create($conversationId, $role, $content)
    {
        $stmt = $this->db->prepare("
            INSERT INTO chat_messages (conversation_id, sender, message) 
            VALUES (:conversation_id, :sender, :message)
        ");
        $stmt->execute([
            'conversation_id' => $conversationId,
            'sender' => $role,
            'message' => $content
        ]);

        $messageId = $this->db->lastInsertId();
        return $this->findById($messageId);
    }

    /**
     * Get all messages for a conversation
     * @param int $conversationId
     * @return array
     */
    public function getConversationMessages($conversationId)
    {
        $stmt = $this->db->prepare("
            SELECT * FROM chat_messages 
            WHERE conversation_id = :conversation_id 
            ORDER BY sent_at ASC
        ");

        $stmt->execute(['conversation_id' => $conversationId]);
        return $stmt->fetchAll();
    }

    /**
     * Find message by ID
     * @param int $id
     * @return array|false
     */
    public function findById($id)
    {
        $stmt = $this->db->prepare("SELECT * FROM chat_messages WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return $stmt->fetch();
    }

    /**
     * Delete all messages in a conversation
     * @param int $conversationId
     * @return bool
     */
    public function deleteByConversation($conversationId)
    {
        $stmt = $this->db->prepare("DELETE FROM chat_messages WHERE conversation_id = :conversation_id");
        return $stmt->execute(['conversation_id' => $conversationId]);
    }
}