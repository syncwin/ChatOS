import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import * as he from "he"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Decodes HTML entities and normalizes special characters for clean, readable text output.
 * This function handles:
 * - All HTML entities using the 'he' library
 * - Unicode escape sequences (\uXXXX)
 * - Hex character codes (&#xXX; or &#XXX;)
 * - Decimal character codes (&#XXX;)
 * - Line ending normalization
 * - Non-breaking spaces
 * 
 * @param text - The text containing HTML entities and special characters
 * @returns Clean, human-readable text suitable for markdown export
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return text;
  
  // Use 'he' library to decode all standard HTML entities
  let decodedText = he.decode(text);
  
  // Handle additional Unicode escape sequences and normalize
  decodedText = decodedText
    // Handle Unicode escape sequences (\uXXXX)
    .replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => String.fromCharCode(parseInt(code, 16)))
    // Handle hex character codes (&#xXX; or &#XXX;) - in case 'he' missed any
    .replace(/&#x([0-9a-fA-F]+);/gi, (match, code) => String.fromCharCode(parseInt(code, 16)))
    // Handle decimal character codes (&#XXX;) - in case 'he' missed any
    .replace(/&#(\d+);/g, (match, code) => String.fromCharCode(parseInt(code, 10)))
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Clean up any remaining encoded spaces
    .replace(/\u00A0/g, ' ') // Non-breaking space
    .replace(/\u2009/g, ' ') // Thin space
    .replace(/\u200A/g, ' ') // Hair space
    .replace(/\u2028/g, '\n') // Line separator
    .replace(/\u2029/g, '\n\n'); // Paragraph separator
  
  return decodedText;
}
