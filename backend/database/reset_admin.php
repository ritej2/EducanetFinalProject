<?php
require_once __DIR__ . '/../config/database.php';

try {
    $pdo = getDBConnection();

    $email = 'admin@gmail.com';
    $newPassword = 'admin123';
    $hash = password_hash($newPassword, PASSWORD_BCRYPT);

    $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE email = ? AND role = 'admin'");
    $stmt->execute([$hash, $email]);

    if ($stmt->rowCount() > 0) {
        echo "Password for $email has been reset to: $newPassword\n";
    } else {
        // Try creating the admin if it doesn't exist
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, role) VALUES ('Administrator', ?, ?, 'admin')");
        $stmt->execute([$email, $hash]);
        echo "Admin user created with email $email and password: $newPassword\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>