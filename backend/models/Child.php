<?php
/**
 * Child Model
 * Handles database operations for children
 */

require_once __DIR__ . '/../config/database.php';

class Child
{
    private $db;

    public function __construct()
    {
        $this->db = getDBConnection();
    }

    public function getAllByUserId($userId)
    {
        $stmt = $this->db->prepare("SELECT * FROM children WHERE user_id = :user_id ORDER BY first_name ASC");
        $stmt->execute(['user_id' => $userId]);
        return $stmt->fetchAll();
    }

    public function findById($id, $userId)
    {
        $stmt = $this->db->prepare("SELECT * FROM children WHERE id = :id AND user_id = :user_id");
        $stmt->execute(['id' => $id, 'user_id' => $userId]);
        return $stmt->fetch();
    }

    public function create($userId, $data)
    {
        $stmt = $this->db->prepare("
            INSERT INTO children (user_id, first_name, last_name, birth_date, gender, school_year, school_name, address) 
            VALUES (:user_id, :first_name, :last_name, :birth_date, :gender, :school_year, :school_name, :address)
        ");

        $stmt->execute([
            'user_id' => $userId,
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'] ?? null,
            'birth_date' => $data['birth_date'],
            'gender' => $data['gender'],
            'school_year' => $data['school_year'] ?? null,
            'school_name' => $data['school_name'] ?? null,
            'address' => $data['address'] ?? null
        ]);

        return $this->findById($this->db->lastInsertId(), $userId);
    }

    public function update($id, $userId, $data)
    {
        $stmt = $this->db->prepare("
            UPDATE children 
            SET first_name = :first_name, 
                last_name = :last_name, 
                birth_date = :birth_date, 
                gender = :gender, 
                school_year = :school_year, 
                school_name = :school_name, 
                address = :address
            WHERE id = :id AND user_id = :user_id
        ");

        $stmt->execute([
            'id' => $id,
            'user_id' => $userId,
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'] ?? null,
            'birth_date' => $data['birth_date'],
            'gender' => $data['gender'],
            'school_year' => $data['school_year'] ?? null,
            'school_name' => $data['school_name'] ?? null,
            'address' => $data['address'] ?? null
        ]);

        return $this->findById($id, $userId);
    }

    public function delete($id, $userId)
    {
        $stmt = $this->db->prepare("DELETE FROM children WHERE id = :id AND user_id = :user_id");
        return $stmt->execute(['id' => $id, 'user_id' => $userId]);
    }

    /**
     * Get total count of children
     */
    public function getTotalCount()
    {
        return (int) $this->db->query("SELECT COUNT(*) FROM children")->fetchColumn();
    }
}
