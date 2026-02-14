# Backend Setup Guide

## Prerequisites
- XAMPP, WAMP, or MAMP installed
- PHP 7.4 or higher
- MySQL/phpMyAdmin accessible

## Installation Steps

### 1. Place Backend Files
Copy the `backend` folder to your web server directory:
- **XAMPP**: `C:\xampp\htdocs\angular-project-backend\`
- **WAMP**: `C:\wamp64\www\angular-project-backend\`
- **MAMP**: `/Applications/MAMP/htdocs/angular-project-backend/`

### 2. Configure Database
1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Select the `bdStage` database
3. Go to SQL tab
4. Copy and paste the contents of `backend/database/schema.sql`
5. Click "Go" to execute

### 3. Update Database Configuration
Edit `backend/config/database.php` if needed:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'bdStage');
define('DB_USER', 'root');
define('DB_PASS', ''); // Change if you have a password
```

### 4. Test the Backend
Open your browser and test these endpoints:

**Test Database Connection:**
Create a test file `backend/test.php`:
```php
<?php
require_once 'config/database.php';
$db = getDBConnection();
echo "Database connected successfully!";
?>
```
Visit: `http://localhost/angular-project-backend/test.php`

## API Endpoints

### Authentication
- **POST** `/api/auth/signup` - Create account
- **POST** `/api/auth/login` - Login
- **POST** `/api/auth/verify` - Verify token

### Chat
- **GET** `/api/chat/conversations` - Get user conversations
- **POST** `/api/chat/conversations` - Create conversation
- **DELETE** `/api/chat/conversations?id=X` - Delete conversation
- **GET** `/api/chat/messages?conversation_id=X` - Get messages
- **POST** `/api/chat/messages` - Save message

## Testing with cURL

### Signup
```bash
curl -X POST http://localhost/angular-project-backend/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"password123\"}"
```

### Login
```bash
curl -X POST http://localhost/angular-project-backend/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
```

## Troubleshooting

### CORS Errors
Make sure `backend/config/cors.php` has the correct Angular URL:
```php
header('Access-Control-Allow-Origin: http://localhost:4200');
```

### 404 Errors
- Check that files are in the correct directory
- Verify your web server is running
- Check file permissions

### Database Connection Errors
- Verify MySQL is running
- Check database credentials in `config/database.php`
- Ensure `bdStage` database exists

## Security Notes
⚠️ **Before deploying to production:**
1. Change `JWT_SECRET` in `config/jwt.php`
2. Use environment variables for sensitive data
3. Enable HTTPS
4. Add rate limiting
5. Implement proper logging
