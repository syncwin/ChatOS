
import { z } from 'zod';

// Input validation schemas
export const chatTitleSchema = z.string()
  .min(1, 'Chat title cannot be empty')
  .max(500, 'Chat title cannot exceed 500 characters')
  .trim();

export const folderNameSchema = z.string()
  .min(1, 'Folder name cannot be empty')
  .max(100, 'Folder name cannot exceed 100 characters')
  .trim();

export const tagNameSchema = z.string()
  .min(1, 'Tag name cannot be empty')
  .max(50, 'Tag name cannot exceed 50 characters')
  .trim();

export const messageContentSchema = z.string()
  .min(1, 'Message cannot be empty')
  .max(50000, 'Message cannot exceed 50,000 characters');

export const profileNameSchema = z.string()
  .max(100, 'Name cannot exceed 100 characters')
  .optional();

export const profileWebsiteSchema = z.string()
  .url('Please enter a valid URL')
  .max(255, 'Website URL cannot exceed 255 characters')
  .optional()
  .or(z.literal(''));

// Validation helper functions
export const validateInput = <T>(schema: z.ZodSchema<T>, value: unknown): { success: boolean; data?: T; error?: string } => {
  try {
    const result = schema.parse(value);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Validation failed' };
    }
    return { success: false, error: 'Unknown validation error' };
  }
};

// HTML sanitization for any rich text content
export const sanitizeHtml = (input: string): string => {
  // Basic HTML entity encoding to prevent XSS
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Rate limiting helper for client-side
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  constructor(private maxAttempts: number = 10, private windowMs: number = 60000) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = userAttempts.filter(attempt => now - attempt < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    return true;
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
}
