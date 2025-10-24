/**
 * Log Sanitizer - Redacts sensitive data from logs and provides data validation
 *
 * This utility is designed for:
 * 1. Redacting sensitive information from log output (passwords, tokens, etc.)
 * 2. Providing format validation helpers for data quality
 *
 * Note: This MCP reference implementation does NOT perform input sanitization
 * for SQL injection, XSS, etc. because:
 * - MCP servers communicate with Fulfillment APIs, not databases
 * - The Fulfillment backend is responsible for its own input validation
 * - Order data requires legitimate PII and special characters
 * - Removing SQL keywords would break legitimate customer names/addresses
 */

export class LogSanitizer {
  // Fields that should be redacted in logs
  private static sensitiveFields = [
    'password',
    'token',
    'apikey',
    'api_key',
    'secret',
    'creditcard',
    'credit_card',
    'ssn',
    'social_security',
    'cvv',
    'authorization',
    'x-api-key',
    'taxId',
    'key', // Matches apiKey, secretKey, etc.
  ];

  /**
   * Redact sensitive data from objects for logging
   * This prevents passwords, tokens, and other secrets from appearing in logs
   */
  static redactSensitive(data: any): any {
    if (typeof data === 'string') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.redactSensitive(item));
    }

    if (data && typeof data === 'object') {
      const redacted: any = {};

      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        if (this.sensitiveFields.some((field) => lowerKey.includes(field))) {
          redacted[key] = '[REDACTED]';
        } else {
          redacted[key] = this.redactSensitive(value);
        }
      }
      return redacted;
    }

    return data;
  }

  /**
   * Check if a string contains sensitive field names
   * Useful for warning about potential exposure
   */
  static containsSensitiveData(str: string): boolean {
    const lowerStr = str.toLowerCase();

    // Check sensitive field names
    if (this.sensitiveFields.some((field) => lowerStr.includes(field))) {
      return true;
    }

    // Check for common sensitive patterns in content
    const sensitivePatterns = ['credit card', 'social security', 'password:', 'api key:', 'token:'];

    return sensitivePatterns.some((pattern) => lowerStr.includes(pattern));
  }
}
