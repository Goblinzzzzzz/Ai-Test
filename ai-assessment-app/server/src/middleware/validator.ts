import { Request, Response, NextFunction } from 'express';
import { json } from 'express';

/**
 * Input validation and sanitization middleware
 * 
 * Validates: Requirements 10.2, 10.4
 */

/**
 * Request body size limiter middleware
 * Limits request body size to prevent payload attacks
 * 
 * Validates: Requirement 10.4
 */
export const requestSizeLimiter = json({
  limit: '100kb', // Maximum request body size
  strict: true,   // Only accept arrays and objects
});

/**
 * Sanitizes a string by removing potentially dangerous characters
 * while preserving valid content
 * 
 * @param input - String to sanitize
 * @returns Sanitized string
 */
function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return input;
  }
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  return sanitized;
}

/**
 * Sanitizes an object recursively
 * 
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Sanitize the key as well
        const sanitizedKey = sanitizeString(key);
        sanitized[sanitizedKey] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Input sanitization middleware
 * Sanitizes all user input in request body, query params, and route params
 * 
 * Validates: Requirement 10.2
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction): void {
  try {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      const sanitizedQuery: any = {};
      for (const key in req.query) {
        if (req.query.hasOwnProperty(key)) {
          const value = req.query[key];
          if (typeof value === 'string') {
            sanitizedQuery[key] = sanitizeString(value);
          } else {
            sanitizedQuery[key] = sanitizeObject(value);
          }
        }
      }
      req.query = sanitizedQuery;
    }
    
    // Sanitize route parameters
    if (req.params && typeof req.params === 'object') {
      const sanitizedParams: any = {};
      for (const key in req.params) {
        if (req.params.hasOwnProperty(key)) {
          const value = req.params[key];
          if (typeof value === 'string') {
            sanitizedParams[key] = sanitizeString(value);
          } else {
            sanitizedParams[key] = value;
          }
        }
      }
      req.params = sanitizedParams;
    }
    
    next();
  } catch (error) {
    // If sanitization fails, reject the request
    res.status(400).json({
      success: false,
      error: {
        message: '输入数据格式错误',
      },
    });
  }
}

/**
 * Combined validation middleware that applies both size limiting and sanitization
 * Use this as a single middleware for convenience
 */
export const validateAndSanitize = [requestSizeLimiter, sanitizeInput];
