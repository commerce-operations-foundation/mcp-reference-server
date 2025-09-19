/**
 * Data sanitization utilities
 */

import { ServerConfig } from '../types/config.js';

export class Sanitizer {
  private static config: ServerConfig['security']['sanitization'] | null = null;
  
  /**
   * Set the sanitization configuration from server config
   */
  static setConfig(sanitizationConfig: ServerConfig['security']['sanitization']): void {
    this.config = sanitizationConfig;
  }
  /**
   * Sanitize email address
   */
  static email(email: string): string | null {
    if (!email || typeof email !== 'string') {
      return null;
    }

    const trimmed = email.trim().toLowerCase();
    
    // Check for double dots
    if (trimmed.includes('..')) {
      return null;
    }
    
    // Basic email regex validation (requires TLD)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(trimmed)) {
      return null;
    }

    return trimmed;
  }

  /**
   * Sanitize phone number
   */
  static phone(phone: string): string | null {
    if (!phone || typeof phone !== 'string') {
      return null;
    }

    // Remove all non-digit characters except + at the start
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // If it starts with +, keep it, otherwise remove any + signs
    if (!cleaned.startsWith('+')) {
      cleaned = cleaned.replace(/\+/g, '');
    }

    // Must have at least 10 digits
    const digits = cleaned.replace(/[^\d]/g, '');
    if (digits.length < 10) {
      return null;
    }

    return cleaned;
  }

  /**
   * Sanitize currency code
   */
  static currency(currency: string): string {
    if (!currency || typeof currency !== 'string') {
      return 'USD';
    }

    const cleaned = currency.trim().toUpperCase();
    
    // Basic currency code validation (3 letters)
    if (!/^[A-Z]{3}$/.test(cleaned)) {
      return 'USD';
    }

    return cleaned;
  }

  /**
   * Sanitize SKU
   */
  static sku(sku: string): string | null {
    if (!sku || typeof sku !== 'string') {
      return null;
    }

    const trimmed = sku.trim();
    
    // Allow alphanumeric, hyphens, and underscores
    if (!/^[A-Za-z0-9\-_]+$/.test(trimmed)) {
      return null;
    }

    return trimmed;
  }

  /**
   * Sanitize numeric value
   */
  static number(value: any): number {
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }

    return 0;
  }

  /**
   * Sanitize string
   */
  static string(value: any): string {
    if (typeof value === 'string') {
      return value.trim();
    }

    if (value === null || value === undefined) {
      return '';
    }

    return String(value).trim();
  }

  /**
   * Sanitize HTML to prevent XSS
   */
  static html(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Remove empty values from object recursively
   */
  static removeEmpty(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj
        .map(item => this.removeEmpty(item))
        .filter(item => item !== undefined && item !== null);
    }
    
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const cleaned = this.removeEmpty(value);
      if (cleaned !== undefined && cleaned !== null) {
        result[key] = cleaned;
      }
    }
    
    return result;
  }

  /**
   * Truncate string to specified length
   */
  static truncate(str: string, maxLength: number): string {
    if (!str) {
      return '';
    }
    if (maxLength <= 0) {
      return '...';
    }
    if (str.length <= maxLength) {
      return str;
    }
    if (maxLength <= 3) {
      return '...';
    }
    return str.substring(0, maxLength - 3) + '...';
  }
  
  /**
   * Validate request size against configuration
   */
  static validateRequestSize(data: any): void {
    if (!this.config || !this.config.enabled) {
      return;
    }
    
    const dataSize = Buffer.byteLength(JSON.stringify(data), 'utf8');
    if (dataSize > this.config.maxRequestSize) {
      throw new Error(`Request size ${dataSize} exceeds maximum allowed ${this.config.maxRequestSize} bytes`);
    }
  }
  
  /**
   * Sanitize data if sanitization is enabled in config
   */
  static sanitizeIfEnabled(data: any): any {
    if (!this.config || !this.config.enabled) {
      return data;
    }
    
    return this.sanitizeForLogging(data);
  }

  /**
   * Sanitize data for logging - remove sensitive information
   */
  static sanitizeForLogging(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeForLogging(item));
    }
    
    const result: any = {};
    const sensitiveFields = [
      'password', 'apikey', 'token', 'secret', 'creditcard', 
      'ssn', 'taxid', 'cvv', 'dbpassword'
    ];
    
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveFields.some(field => lowerKey.includes(field));
      
      if (isSensitive) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.sanitizeForLogging(value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }
}