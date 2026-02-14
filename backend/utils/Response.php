<?php
/**
 * PURPOSE: Standardizes API output format.
 * CONTENT: Ensures every API response has a consistent JSON format (success, message, data).
 */
/**
 * Standardized API Response Helper
 */

class Response
{

    /**
     * Send success response
     * @param mixed $data
     * @param string $message
     * @param int $statusCode
     */
    public static function success($data = null, $message = 'Success', $statusCode = 200)
    {
        http_response_code($statusCode);
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data
        ]);
        exit;
    }

    /**
     * Send error response
     * @param string $message
     * @param int $statusCode
     * @param mixed $errors
     */
    public static function error($message = 'An error occurred', $statusCode = 400, $errors = null)
    {
        http_response_code($statusCode);
        $response = [
            'success' => false,
            'message' => $message
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        echo json_encode($response);
        exit;
    }

    /**
     * Send unauthorized response
     * @param string $message
     */
    public static function unauthorized($message = 'Unauthorized')
    {
        self::error($message, 401);
    }

    /**
     * Send not found response
     * @param string $message
     */
    public static function notFound($message = 'Resource not found')
    {
        self::error($message, 404);
    }

    /**
     * Send validation error response
     * @param array $errors
     */
    public static function validationError($errors)
    {
        self::error('Validation failed', 422, $errors);
    }
}