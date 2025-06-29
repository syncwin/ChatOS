/**
 * Authentication configuration utilities
 * Provides consistent domain resolution for auth redirects
 */

/**
 * Get the base URL for authentication redirects
 * Uses environment variable in production, falls back to window.location.origin
 */
export function getAuthBaseUrl(): string {
  // In production, prefer environment variable if set
  const envBaseUrl = import.meta.env.VITE_BASE_URL;
  
  if (envBaseUrl) {
    // Remove trailing slash for consistency
    return envBaseUrl.replace(/\/$/, '');
  }
  
  // Fallback to current origin (for development)
  return window.location.origin;
}

/**
 * Get the redirect URL for authentication flows
 * @param path - Optional path to append (e.g., '/update-password')
 */
export function getAuthRedirectUrl(path: string = '/'): string {
  const baseUrl = getAuthBaseUrl();
  
  // Ensure path starts with '/'
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${normalizedPath}`;
}

/**
 * Authentication redirect URLs used throughout the app
 */
export const AUTH_REDIRECTS = {
  // Default redirect after successful auth
  DEFAULT: () => getAuthRedirectUrl('/'),
  
  // Password reset redirect
  PASSWORD_RESET: () => getAuthRedirectUrl('/update-password'),
  
  // Email confirmation redirect
  EMAIL_CONFIRMATION: () => getAuthRedirectUrl('/'),
  
  // Google OAuth redirect
  GOOGLE_OAUTH: () => getAuthRedirectUrl('/'),
} as const;

/**
 * Validate that the current domain is properly configured
 * Logs warnings if potential issues are detected
 */
export function validateAuthConfig(): void {
  const baseUrl = getAuthBaseUrl();
  const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
  const isProduction = import.meta.env.PROD;
  
  if (isProduction && isLocalhost) {
    console.warn(
      '⚠️ Auth Config Warning: Using localhost URL in production. ' +
      'Set VITE_BASE_URL environment variable to your production domain.'
    );
  }
  
  if (!isProduction && !isLocalhost && !import.meta.env.VITE_BASE_URL) {
    console.info(
      '💡 Auth Config Info: Using custom domain in development. ' +
      'Ensure this domain is configured in Supabase dashboard.'
    );
  }
  
  console.log(`🔐 Auth Base URL: ${baseUrl}`);
}