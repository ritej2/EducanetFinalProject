<?php
/**
 * PURPOSE: Handles conversation-related database operations.
 * CONTENT: Methods for creating, fetching, and deleting chat conversations for users.
 */
/**
 * Conversation Model
 * Handles conversation-related database operations
 */

require_once __DIR__ . '/../config/database.php';

class Conversation
{
    private $db;

    public function __construct()
    {
        $this->db = getDBConnection();
    }

    /**
     * Create a new conversation
     * @param int $userId
     * @param string $title
     * @return array
     */
    public function create($userId, $title = 'Nouvelle conversation')
    {
        $stmt = $this->db->prepare("
            INSERT INTO chat_conversations (user_id, title) 
            VALUES (:user_id, :title)
        ");

        $stmt->execute([
            'user_id' => $userId,
            'title' => $title
        ]);

        $conversationId = $this->db->lastInsertId();
        return $this->findById($conversationId);
    }

    /**
     * Get all conversations for a user
     * @param int $userId
     * @return array
     */
    public function getUserConversations($userId)
    {
        $stmt = $this->db->prepare("
            SELECT c.*, 
                   (SELECT message FROM chat_messages 
                    WHERE conversation_id = c.id 
                    ORDER BY sent_at ASC LIMIT 1) as first_message
            FROM chat_conversations c
            WHERE c.user_id = :user_id
            ORDER BY c.updated_at DESC
        ");

        $stmt->execute(['user_id' => $userId]);
        return $stmt->fetchAll();
    }

    /**
     * Find conversation by ID
     * @param int $id
     * @return array|false
     */
    public function findById($id)
    {
        $stmt = $this->db->prepare("SELECT * FROM chat_conversations WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return $stmt->fetch();
    }

    /**
     * Update conversation title
     * @param int $id
     * @param string $title
     * @return bool
     */
    public function updateTitle($id, $title)
    {
        $stmt = $this->db->prepare("
            UPDATE chat_conversations 
            SET title = :title 
            WHERE id = :id
        ");

        return $stmt->execute([
            'id' => $id,
            'title' => $title
        ]);
    }

    /**
     * Delete conversation
     * @param int $id
     * @param int $userId
     * @return bool
     */
    public function delete($id, $userId)
    {
        $stmt = $this->db->prepare("
            DELETE FROM chat_conversations 
            WHERE id = :id AND user_id = :user_id
        ");

        return $stmt->execute([
            'id' => $id,
            'user_id' => $userId
        ]);
    }

    /**
     * Touch conversation (update updated_at)
     * @param int $id
     */
    public function touch($id)
    {
        $stmt = $this->db->prepare("
            UPDATE chat_conversations 
            SET updated_at = CURRENT_TIMESTAMP 
            WHERE id = :id
        ");

        $stmt->execute(['id' => $id]);
    }
    /**
     * Get total count of conversations
     */
    public function getTotalCount()
    {
        return (int) $this->db->query("SELECT COUNT(*) FROM chat_conversations")->fetchColumn();
    }
}