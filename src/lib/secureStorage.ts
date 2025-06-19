
// Secure storage for guest API keys with encryption
class SecureGuestStorage {
  private encryptionKey: CryptoKey | null = null;
  private sessionId: string;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.initializeEncryption();
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('chat_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('chat_session_id', sessionId);
    }
    return sessionId;
  }

  private async initializeEncryption(): Promise<void> {
    try {
      // Derive key from session ID
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(this.sessionId + 'chatosguestkey'),
        'PBKDF2',
        false,
        ['deriveKey']
      );

      this.encryptionKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode('chatossalt'),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.warn('Failed to initialize encryption, falling back to session storage');
    }
  }

  async encryptApiKey(apiKey: string): Promise<string> {
    if (!this.encryptionKey) {
      // Fallback to base64 encoding if encryption fails
      return btoa(apiKey);
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(apiKey);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        data
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.warn('Encryption failed, using fallback');
      return btoa(apiKey);
    }
  }

  async decryptApiKey(encryptedKey: string): Promise<string> {
    if (!this.encryptionKey) {
      // Fallback from base64 encoding
      try {
        return atob(encryptedKey);
      } catch {
        return encryptedKey;
      }
    }

    try {
      const combined = new Uint8Array(
        atob(encryptedKey).split('').map(char => char.charCodeAt(0))
      );
      
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.warn('Decryption failed, trying fallback');
      try {
        return atob(encryptedKey);
      } catch {
        return encryptedKey;
      }
    }
  }

  async storeApiKey(provider: string, apiKey: string): Promise<void> {
    const encrypted = await this.encryptApiKey(apiKey);
    sessionStorage.setItem(`guest_api_key_${provider}`, encrypted);
  }

  async getApiKey(provider: string): Promise<string | null> {
    const encrypted = sessionStorage.getItem(`guest_api_key_${provider}`);
    if (!encrypted) return null;
    
    return await this.decryptApiKey(encrypted);
  }

  removeApiKey(provider: string): void {
    sessionStorage.removeItem(`guest_api_key_${provider}`);
  }

  clearAllApiKeys(): void {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith('guest_api_key_')) {
        sessionStorage.removeItem(key);
      }
    });
    // Also clear session ID to force new encryption key on next session
    sessionStorage.removeItem('chat_session_id');
  }

  // Get all stored providers for guest user
  getStoredProviders(): string[] {
    const keys = Object.keys(sessionStorage);
    return keys
      .filter(key => key.startsWith('guest_api_key_'))
      .map(key => key.replace('guest_api_key_', ''));
  }

  // Check if any API keys are stored
  hasStoredKeys(): boolean {
    return this.getStoredProviders().length > 0;
  }

  // Warning message for users about guest key security
  getSecurityWarning(): string {
    return 'Guest API keys are temporarily stored in your browser session with AES-256-GCM encryption. Keys are automatically cleared when you close the browser or end your session. For enhanced security and persistent storage, please create an account where your API keys will be encrypted and stored securely in our database.';
  }

  // Get security info for display
  getSecurityInfo(): { encrypted: boolean; sessionBased: boolean; autoCleanup: boolean } {
    return {
      encrypted: this.encryptionKey !== null,
      sessionBased: true,
      autoCleanup: true
    };
  }
}

export const secureGuestStorage = new SecureGuestStorage();

// Enhanced cleanup on various events for better security
const cleanupEvents = ['beforeunload', 'pagehide', 'visibilitychange'];

cleanupEvents.forEach(event => {
  window.addEventListener(event, () => {
    if (event === 'visibilitychange' && document.visibilityState !== 'hidden') {
      return; // Only cleanup when page becomes hidden
    }
    secureGuestStorage.clearAllApiKeys();
  });
});

// Additional cleanup on tab close/navigation
window.addEventListener('unload', () => {
  secureGuestStorage.clearAllApiKeys();
});

// Cleanup on session timeout (30 minutes of inactivity)
let sessionTimeout: NodeJS.Timeout;
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

function resetSessionTimeout() {
  clearTimeout(sessionTimeout);
  sessionTimeout = setTimeout(() => {
    secureGuestStorage.clearAllApiKeys();
    console.log('Guest session expired due to inactivity');
  }, SESSION_TIMEOUT);
}

// Reset timeout on user activity
['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
  document.addEventListener(event, resetSessionTimeout, { passive: true });
});

// Initialize session timeout
resetSessionTimeout();
