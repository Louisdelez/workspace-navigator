/**
 * IPC Validator - T055
 * Validates all IPC messages to prevent injection and malicious inputs
 */

import { logger } from '../logging/logger';

// UUID regex pattern (RFC 4122)
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Safe string pattern (alphanumeric, spaces, basic punctuation)
const SAFE_STRING_PATTERN = /^[a-zA-Z0-9\s\-_.,!?()'"À-ÿ]+$/;

// URL pattern (http/https only)
const URL_PATTERN = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export class ValidationException extends Error {
  constructor(
    public errors: ValidationError[],
    message: string = 'Validation failed'
  ) {
    super(message);
    this.name = 'ValidationException';
  }
}

/**
 * IPC Parameter Validator
 * Validates and sanitizes IPC parameters to prevent injection attacks
 */
export class IPCValidator {
  /**
   * Validate UUID format
   */
  static validateUUID(value: any, fieldName: string): string {
    if (typeof value !== 'string') {
      throw new ValidationException([{
        field: fieldName,
        message: `${fieldName} must be a string`,
        value
      }]);
    }

    if (!UUID_PATTERN.test(value)) {
      throw new ValidationException([{
        field: fieldName,
        message: `${fieldName} must be a valid UUID`,
        value: value.substring(0, 50) // Truncate for logging
      }]);
    }

    return value;
  }

  /**
   * Validate string (prevents injection)
   */
  static validateString(
    value: any,
    fieldName: string,
    options: {
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      allowEmpty?: boolean;
    } = {}
  ): string {
    const {
      required = true,
      minLength = 0,
      maxLength = 1000,
      allowEmpty = false
    } = options;

    // Check type
    if (typeof value !== 'string') {
      if (!required && value == null) {
        return '';
      }
      throw new ValidationException([{
        field: fieldName,
        message: `${fieldName} must be a string`,
        value
      }]);
    }

    // Check empty
    if (!allowEmpty && value.trim().length === 0) {
      if (!required) {
        return '';
      }
      throw new ValidationException([{
        field: fieldName,
        message: `${fieldName} cannot be empty`
      }]);
    }

    // Check length
    if (value.length < minLength) {
      throw new ValidationException([{
        field: fieldName,
        message: `${fieldName} must be at least ${minLength} characters`,
        value: value.substring(0, 50)
      }]);
    }

    if (value.length > maxLength) {
      throw new ValidationException([{
        field: fieldName,
        message: `${fieldName} must be at most ${maxLength} characters`,
        value: value.substring(0, 50)
      }]);
    }

    return value;
  }

  /**
   * Validate and sanitize URL (prevents XSS and malicious URLs)
   */
  static validateURL(value: any, fieldName: string): string {
    if (typeof value !== 'string') {
      throw new ValidationException([{
        field: fieldName,
        message: `${fieldName} must be a string`,
        value
      }]);
    }

    // Check URL format
    if (!URL_PATTERN.test(value)) {
      throw new ValidationException([{
        field: fieldName,
        message: `${fieldName} must be a valid HTTP/HTTPS URL`,
        value: value.substring(0, 100)
      }]);
    }

    // Block localhost and internal IPs in production (security)
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    // Allow localhost only in development
    if (process.env.NODE_ENV === 'production') {
      if (
        hostname === 'localhost' ||
        hostname.startsWith('127.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.16.') ||
        hostname === '0.0.0.0'
      ) {
        throw new ValidationException([{
          field: fieldName,
          message: `${fieldName} cannot be a local/internal address in production`,
          value: value.substring(0, 100)
        }]);
      }
    }

    return value;
  }

  /**
   * Validate number
   */
  static validateNumber(
    value: any,
    fieldName: string,
    options: {
      required?: boolean;
      min?: number;
      max?: number;
      integer?: boolean;
    } = {}
  ): number {
    const {
      required = true,
      min = -Infinity,
      max = Infinity,
      integer = false
    } = options;

    // Check null/undefined
    if (value == null) {
      if (!required) {
        return 0;
      }
      throw new ValidationException([{
        field: fieldName,
        message: `${fieldName} is required`
      }]);
    }

    // Check type
    const num = Number(value);
    if (isNaN(num)) {
      throw new ValidationException([{
        field: fieldName,
        message: `${fieldName} must be a number`,
        value
      }]);
    }

    // Check integer
    if (integer && !Number.isInteger(num)) {
      throw new ValidationException([{
        field: fieldName,
        message: `${fieldName} must be an integer`,
        value: num
      }]);
    }

    // Check range
    if (num < min) {
      throw new ValidationException([{
        field: fieldName,
        message: `${fieldName} must be at least ${min}`,
        value: num
      }]);
    }

    if (num > max) {
      throw new ValidationException([{
        field: fieldName,
        message: `${fieldName} must be at most ${max}`,
        value: num
      }]);
    }

    return num;
  }

  /**
   * Validate boolean
   */
  static validateBoolean(value: any, fieldName: string, required: boolean = true): boolean {
    if (value == null) {
      if (!required) {
        return false;
      }
      throw new ValidationException([{
        field: fieldName,
        message: `${fieldName} is required`
      }]);
    }

    if (typeof value !== 'boolean') {
      throw new ValidationException([{
        field: fieldName,
        message: `${fieldName} must be a boolean`,
        value
      }]);
    }

    return value;
  }

  /**
   * Validate array
   */
  static validateArray(
    value: any,
    fieldName: string,
    options: {
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      itemValidator?: (item: any, index: number) => any;
    } = {}
  ): any[] {
    const {
      required = true,
      minLength = 0,
      maxLength = 1000,
      itemValidator
    } = options;

    // Check null/undefined
    if (value == null) {
      if (!required) {
        return [];
      }
      throw new ValidationException([{
        field: fieldName,
        message: `${fieldName} is required`
      }]);
    }

    // Check type
    if (!Array.isArray(value)) {
      throw new ValidationException([{
        field: fieldName,
        message: `${fieldName} must be an array`,
        value
      }]);
    }

    // Check length
    if (value.length < minLength) {
      throw new ValidationException([{
        field: fieldName,
        message: `${fieldName} must have at least ${minLength} items`
      }]);
    }

    if (value.length > maxLength) {
      throw new ValidationException([{
        field: fieldName,
        message: `${fieldName} must have at most ${maxLength} items`
      }]);
    }

    // Validate items
    if (itemValidator) {
      return value.map((item, index) => itemValidator(item, index));
    }

    return value;
  }

  /**
   * Validate object structure
   */
  static validateObject(
    value: any,
    fieldName: string,
    required: boolean = true
  ): object {
    if (value == null) {
      if (!required) {
        return {};
      }
      throw new ValidationException([{
        field: fieldName,
        message: `${fieldName} is required`
      }]);
    }

    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new ValidationException([{
        field: fieldName,
        message: `${fieldName} must be an object`,
        value
      }]);
    }

    return value;
  }

  /**
   * Sanitize HTML (removes all HTML tags)
   */
  static sanitizeHTML(value: string): string {
    return value
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Sanitize SQL (basic escaping)
   */
  static sanitizeSQL(value: string): string {
    return value
      .replace(/'/g, "''") // Escape single quotes
      .replace(/;/g, '') // Remove semicolons
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\/\*/g, '') // Remove multi-line comments
      .replace(/\*\//g, '');
  }

  /**
   * Log validation error
   */
  static logValidationError(channel: string, error: ValidationException): void {
    logger.warn(`IPC validation failed for ${channel}`, {
      errors: error.errors,
      channel
    });
  }
}
