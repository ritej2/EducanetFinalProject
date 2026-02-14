<?php
/**
 * JWT Configuration
 */

// Secret key for signing JWT tokens
// IMPORTANT: Change this to a random string in production!
define('JWT_SECRET', 'your-secret-key-change-this-in-production-2026');

// Token expiration time (in seconds)
// 86400 = 24 hours
// 604800 = 7 days
define('JWT_EXPIRATION', 604800); // 7 days

// Token issuer
define('JWT_ISSUER', 'angular-chat-app');