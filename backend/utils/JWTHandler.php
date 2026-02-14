<?php
/**
 * JWT Helper Functions
 * Simple JWT implementation without external dependencies
 */

require_once __DIR__ . '/../config/jwt.php';

class JWT
{
    public static $lastError = 'No token found';

    /**
     * Generate JWT token
     * @param array $payload
     * @return string
     */
    public static function encode($payload)
    {
        $header = json_encode([
            'typ' => 'JWT',
            'alg' => 'HS256'
        ]);

        // Add issued at and expiration
        $payload['iat'] = time();
        $payload['exp'] = time() + JWT_EXPIRATION;
        $payload['iss'] = JWT_ISSUER;

        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode(json_encode($payload));

        $signature = hash_hmac(
            'sha256',
            $base64UrlHeader . "." . $base64UrlPayload,
            JWT_SECRET,
            true
        );

        $base64UrlSignature = self::base64UrlEncode($signature);

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    /**
     * Decode and verify JWT token
     * @param string $token
     * @return array|false
     */
    public static function decode($token)
    {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            self::$lastError = "Token non valide (structure incorrecte)";
            error_log("JWT Decode Failed: Token does not have 3 parts");
            return false;
        }

        list($base64UrlHeader, $base64UrlPayload, $base64UrlSignature) = $parts;

        // Verify signature
        $signature = self::base64UrlDecode($base64UrlSignature);
        $expectedSignature = hash_hmac(
            'sha256',
            $base64UrlHeader . "." . $base64UrlPayload,
            JWT_SECRET,
            true
        );

        if (!hash_equals($signature, $expectedSignature)) {
            self::$lastError = "Signature du token invalide";
            error_log("JWT Decode Failed: Signature mismatch");
            return false;
        }

        // Decode payload
        $payload = json_decode(self::base64UrlDecode($base64UrlPayload), true);

        // Check expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            self::$lastError = "Token expiré";
            error_log("JWT Decode Failed: Token expired");
            return false;
        }

        return $payload;
    }

    /**
     * Get token from Authorization header
     * @return string|null
     */
    public static function getTokenFromHeader()
    {
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $authHeader = null;

        // Debug logging
        error_log("JWT Debug - All Headers: " . json_encode($headers));

        // 1. Try standard Authorization header (all cases)
        foreach ($headers as $key => $value) {
            $lowKey = strtolower($key);
            if ($lowKey === 'authorization' || $lowKey === 'x-authorization' || $lowKey === 'x-token') {
                $authHeader = $value;
                break;
            }
        }

        // 2. Try SERVER variables (standard and fallbacks)
        $serverKeys = [
            'HTTP_AUTHORIZATION',
            'REDIRECT_HTTP_AUTHORIZATION',
            'HTTP_X_AUTHORIZATION',
            'REDIRECT_HTTP_X_AUTHORIZATION',
            'HTTP_X_TOKEN'
        ];
        foreach ($serverKeys as $key) {
            if (!$authHeader && isset($_SERVER[$key])) {
                $authHeader = $_SERVER[$key];
                error_log("JWT Debug - Found in SERVER[$key]");
            }
        }

        // 3. Try apache_request_headers() explicitly
        if (!$authHeader && function_exists('apache_request_headers')) {
            $apacheHeaders = apache_request_headers();
            foreach ($apacheHeaders as $key => $value) {
                $lowKey = strtolower($key);
                if ($lowKey === 'authorization' || $lowKey === 'x-authorization' || $lowKey === 'x-token') {
                    $authHeader = $value;
                    break;
                }
            }
        }

        if ($authHeader) {
            error_log("JWT Debug - Found Auth Header: " . $authHeader);
            // If it's x-token, it might not have "Bearer " prefix
            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                return $matches[1];
            }
            // If it's directly the token (X-Token case)
            if (count(explode('.', $authHeader)) === 3) {
                return $authHeader;
            }

            self::$lastError = "Format d'en-tête Authorization invalide";
            error_log("JWT Handler: Auth header found but format invalid: " . $authHeader);
        } else {
            self::$lastError = "En-tête Authorization manquant (Header non reçu par le serveur)";
            error_log("JWT Handler: No Authorization header found in request.");
        }

        return null;
    }

    /**
     * Verify token and return payload
     * @return array|false
     */
    public static function verifyRequest()
    {
        $token = self::getTokenFromHeader();

        if (!$token) {
            // lastError already set in getTokenFromHeader
            error_log("JWT verifyRequest: No token found in header");
            return false;
        }

        $decoded = self::decode($token);
        if (!$decoded) {
            // lastError already set in decode
            error_log("JWT verifyRequest: Token decoding failed");
        }
        return $decoded;
    }

    /**
     * Base64 URL encode
     */
    private static function base64UrlEncode($data)
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Base64 URL decode
     */
    private static function base64UrlDecode($data)
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}