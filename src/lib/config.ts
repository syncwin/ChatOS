/**
 * Centralized configuration management for ChatOS
 * Contains all application constants and settings
 */

// Chat configuration
export const CHAT_CONFIG = {
  // Streaming and timeout settings
  STREAMING_TIMEOUT: 30000, // 30 seconds
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_BASE: 1000, // Base delay for exponential backoff
  
  // Message and pagination settings
  MESSAGES_PER_PAGE: 50,
  MAX_MESSAGE_LENGTH: 10000,
  MAX_CONVERSATION_HISTORY: 100, // Max messages to send to AI
  
  // Cache settings
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  CACHE_STALE_TIME: 2 * 60 * 1000, // 2 minutes
  
  // UI settings
  TYPING_INDICATOR_DELAY: 100, // ms between typing updates
  DEBOUNCE_DELAY: 300, // ms for input debouncing
  TOAST_DURATION: 5000, // ms for toast notifications
  
  // Performance settings
  VIRTUAL_SCROLL_THRESHOLD: 100, // Enable virtual scrolling after N messages
  LAZY_LOAD_THRESHOLD: 20, // Load more messages when N from bottom
  
  // Security settings
  MAX_API_KEY_LENGTH: 512,
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  
  // File and export settings
  MAX_EXPORT_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_EXPORT_FORMATS: ['json', 'txt', 'md'] as const,
} as const;

// AI Provider configuration
export const AI_PROVIDER_CONFIG = {
  // Default models for each provider
  DEFAULT_MODELS: {
    'OpenAI': 'gpt-4o-mini',
    'Google Gemini': 'gemini-1.5-flash',
    'OpenRouter': 'meta-llama/llama-3.1-8b-instruct:free',
  } as const,
  
  // Provider-specific settings
  PROVIDERS: {
    'OpenAI': {
      supportsStreaming: true,
      maxTokens: 4096,
      defaultTemperature: 0.7,
      rateLimitRpm: 3500, // requests per minute
    },
    'Google Gemini': {
      supportsStreaming: false,
      maxTokens: 8192,
      defaultTemperature: 0.7,
      rateLimitRpm: 60,
    },
    'OpenRouter': {
      supportsStreaming: true,
      maxTokens: 4096,
      defaultTemperature: 0.7,
      rateLimitRpm: 200,
    },
  } as const,
  
  // Model refresh intervals
  MODEL_REFRESH_INTERVAL: 60 * 60 * 1000, // 1 hour
  MODEL_CACHE_DURATION: 30 * 60 * 1000, // 30 minutes
} as const;

// Database configuration
export const DB_CONFIG = {
  // Query settings
  MAX_QUERY_RETRIES: 3,
  QUERY_TIMEOUT: 10000, // 10 seconds
  
  // Batch operations
  BATCH_SIZE: 100,
  MAX_BATCH_OPERATIONS: 10,
  
  // Connection settings
  CONNECTION_POOL_SIZE: 10,
  IDLE_TIMEOUT: 30000, // 30 seconds
} as const;

// Storage configuration
export const STORAGE_CONFIG = {
  // Local storage keys
  KEYS: {
    CHAT_STATE: 'chatos_chat_state',
    USER_PREFERENCES: 'chatos_user_preferences',
    API_KEYS: 'chatos_api_keys',
    MODEL_SELECTION: 'chatos_model_selection',
    THEME: 'chatos_theme',
    SIDEBAR_STATE: 'chatos_sidebar_state',
  } as const,
  
  // Storage limits
  MAX_STORAGE_SIZE: 50 * 1024 * 1024, // 50MB
  CLEANUP_THRESHOLD: 0.8, // Clean up when 80% full
  
  // Persistence settings
  PERSIST_DEBOUNCE: 1000, // ms to debounce persistence
  MAX_PERSIST_RETRIES: 3,
} as const;

// UI/UX configuration
export const UI_CONFIG = {
  // Breakpoints (matching Tailwind)
  BREAKPOINTS: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  } as const,
  
  // Animation durations
  ANIMATIONS: {
    fast: 150,
    normal: 300,
    slow: 500,
  } as const,
  
  // Z-index layers
  Z_INDEX: {
    dropdown: 1000,
    modal: 1050,
    toast: 1100,
    tooltip: 1200,
  } as const,
  
  // Sidebar settings
  SIDEBAR: {
    DEFAULT_WIDTH: 280,
    MIN_WIDTH: 240,
    MAX_WIDTH: 400,
    COLLAPSED_WIDTH: 60,
  } as const,
} as const;

// Development configuration
export const DEV_CONFIG = {
  // Logging settings
  ENABLE_VERBOSE_LOGGING: process.env.NODE_ENV === 'development',
  LOG_LEVEL: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
  
  // Debug features
  ENABLE_PERFORMANCE_MONITORING: process.env.NODE_ENV === 'development',
  ENABLE_STATE_DEBUGGING: process.env.NODE_ENV === 'development',
  
  // Mock settings for development
  USE_MOCK_API: false,
  MOCK_DELAY: 1000, // ms for simulated API delays
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  // Experimental features
  ENABLE_MESSAGE_VARIATIONS: true,
  ENABLE_CHAT_FOLDERS: true,
  ENABLE_CHAT_TAGS: true,
  ENABLE_EXPORT_FEATURES: true,
  
  // Performance features
  ENABLE_VIRTUAL_SCROLLING: true,
  ENABLE_LAZY_LOADING: true,
  ENABLE_OPTIMISTIC_UPDATES: true,
  
  // UI features
  ENABLE_DARK_MODE: true,
  ENABLE_CUSTOM_THEMES: false,
  ENABLE_KEYBOARD_SHORTCUTS: true,
} as const;

// Type exports for better TypeScript support
export type ChatConfig = typeof CHAT_CONFIG;
export type AIProviderConfig = typeof AI_PROVIDER_CONFIG;
export type DBConfig = typeof DB_CONFIG;
export type StorageConfig = typeof STORAGE_CONFIG;
export type UIConfig = typeof UI_CONFIG;
export type DevConfig = typeof DEV_CONFIG;
export type FeatureFlags = typeof FEATURE_FLAGS;

// Helper functions
export const getConfig = () => ({
  chat: CHAT_CONFIG,
  aiProvider: AI_PROVIDER_CONFIG,
  db: DB_CONFIG,
  storage: STORAGE_CONFIG,
  ui: UI_CONFIG,
  dev: DEV_CONFIG,
  features: FEATURE_FLAGS,
});

// Environment-specific overrides
export const getEnvironmentConfig = () => {
  const baseConfig = getConfig();
  
  // Override settings based on environment
  if (process.env.NODE_ENV === 'production') {
    return {
      ...baseConfig,
      dev: {
        ...baseConfig.dev,
        ENABLE_VERBOSE_LOGGING: false,
        ENABLE_PERFORMANCE_MONITORING: false,
        ENABLE_STATE_DEBUGGING: false,
      },
    };
  }
  
  return baseConfig;
};