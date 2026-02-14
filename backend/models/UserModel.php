<?php
/**
 * PURPOSE: Handles user-related database operations.
 * CONTENT: Methods for user registration, login validation, and fetching user profiles.
 */
/**
 * User Model
 * Handles user-related database operations
 */

require_once __DIR__ . '/../config/database.php';

class User
{
    private $db;

    public function __construct()
    {
        $this->db = getDBConnection();
    }

    /**
     * Create a new user
     * @param string $name
     * @param string $email
     * @param string $password
     * @param string $role
     * @param string|null $phone
     * @return array|false
     */
    public function create($name, $email, $password,$phone, $role = 'user')
    {
        // Check if email already exists
        if ($this->findByEmail($email)) {
            return false;
        }

        $passwordHash = password_hash($password, PASSWORD_BCRYPT);

        $stmt = $this->db->prepare("
            INSERT INTO users (name, email, password_hash, phone , role) 
            VALUES (:name, :email, :password_hash, :phone, :role)
        ");

        $stmt->execute([
            'name' => $name,
            'email' => $email,
            'password_hash' => $passwordHash,
            'phone' => $phone,
            'role' => $role
        ]);

        $userId = $this->db->lastInsertId();
        return $this->findById($userId);
    }

    /**
     * Find user by email
     * @param string $email
     * @return array|false
     */
    public function findByEmail($email)
    {
        $stmt = $this->db->prepare("SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = :email");
        $stmt->execute(['email' => $email]);
        return $stmt->fetch();
    }

    /**
     * Find user by ID
     * @param int $id
     * @return array|false
     */
    /**
     * Find user by ID
     * @param int $id
     * @return array|false
     */
    public function findById($id)
    {
        $stmt = $this->db->prepare("SELECT id, name, email, phone, role, created_at FROM users WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return $stmt->fetch();
    }

    /**
     * Verify user password
     * @param string $email
     * @param string $password
     * @return array|false
     */
    public function verify($email, $password)
    {
        $user = $this->findByEmail($email);

        if (!$user) {
            return false;
        }

        if (!password_verify($password, $user['password_hash'])) {
            return false;
        }

        // Return user without password hash
        unset($user['password_hash']);
        return $user;
    }

    /**
     * Update user profile
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update($id, $data)
    {
        $sql = "UPDATE users SET name = :name, email = :email, phone = :phone WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            'id' => $id,
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null
        ]);
    }

    /**
     * Delete user
     * @param int $id
     * @return bool
     */
    public function delete($id)
    {
        $stmt = $this->db->prepare("DELETE FROM users WHERE id = :id");
        return $stmt->execute(['id' => $id]);
    }

    /**
     * Get user data without sensitive information
     * @param array $user
     * @return array
     */
    public function sanitize($user)
    {
        return [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'phone' => $user['phone'] ?? null,
            'role' => $user['role'] ?? 'user', // Default to user if not set
            'created_at' => $user['created_at']
        ];
    }

    /**
     * Change user password
     * @param int $id
     * @param string $newPassword
     * @return bool
     */
    public function changePassword($id, $newPassword)
    {
        $passwordHash = password_hash($newPassword, PASSWORD_BCRYPT);
        $stmt = $this->db->prepare("UPDATE users SET password_hash = :password_hash WHERE id = :id");
        return $stmt->execute([
            'id' => $id,
            'password_hash' => $passwordHash
        ]);
    }
}
?>