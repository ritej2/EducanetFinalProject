<?php
/**
 * Tip Model
 * Handles database operations for tips
 */

require_once __DIR__ . '/../config/database.php';

class Tip
{
    private $db;

    public function __construct()
    {
        $this->db = getDBConnection();
    }

    /**
     * Get all tips
     */
    public function getAll()
    {
        $stmt = $this->db->query("SELECT * FROM tips ORDER BY category ASC, id ASC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get tips by category
     */
    public function getByCategory($category)
    {
        $stmt = $this->db->prepare("SELECT * FROM tips WHERE category = :category ORDER BY id ASC");
        $stmt->execute(['category' => $category]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Find tip by ID
     */
    public function findById($id)
    {
        $stmt = $this->db->prepare("SELECT * FROM tips WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Create a new tip
     */
    public function create($category, $title, $description, $icon, $color)
    {
        $stmt = $this->db->prepare("
            INSERT INTO tips (category, title, description, icon, color) 
            VALUES (:category, :title, :description, :icon, :color)
        ");

        $stmt->execute([
            'category' => $category,
            'title' => $title,
            'description' => $description,
            'icon' => $icon,
            'color' => $color
        ]);

        return $this->findById($this->db->lastInsertId());
    }

    /**
     * Update an existing tip
     */
    public function update($id, $category, $title, $description, $icon, $color)
    {
        $stmt = $this->db->prepare("
            UPDATE tips 
            SET category = :category, 
                title = :title, 
                description = :description, 
                icon = :icon, 
                color = :color,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
        ");

        $success = $stmt->execute([
            'id' => $id,
            'category' => $category,
            'title' => $title,
            'description' => $description,
            'icon' => $icon,
            'color' => $color
        ]);

        return $success ? $this->findById($id) : false;
    }

    /**
     * Delete a tip
     */
    public function delete($id)
    {
        $stmt = $this->db->prepare("DELETE FROM tips WHERE id = :id");
        return $stmt->execute(['id' => $id]);
    }
}
?>