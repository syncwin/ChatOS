/**
 * Enhanced type definitions for better type safety
 * Includes discriminated unions, strict typing, and improved interfaces
 */

// Base types
export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageStatus = 'pending' | 'streaming' | 'completed' | 'error' | 'cancelled';
export type AIProvider = 'OpenAI' | 'Google Gemini' | 'OpenRouter';
export type ExportFormat = 'json' | 'txt' | 'md';

// Discriminated union for message states
export type MessageState = 
  | { status: 'pending'; progress?: never; error?: never; }
  | { status: 'streaming'; progress: number; error?: never; }
  | { status: 'completed'; progress?: never; error?: never; }
  | { status: 'error'; progress?: never; error: string; }
  | { status: 'cancelled'; progress?: never; error?: never; };

// Enhanced message interface with discriminated unions
export interface EnhancedMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  state: MessageState;
  metadata?: {
    model?: string;
    provider?: AIProvider;
    tokens?: {
      input: number;
      output: number;
      total: number;
    };
    duration?: number;
    retryCount?: number;
    parentMessageId?: string;
    variations?: string[];
  };
}

// Chat state with strict typing
export interface ChatState {
  id: string;
  title: string;
  messages: EnhancedMessage[];
  isActive: boolean;
  lastActivity: Date;
  metadata: {
    messageCount: number;
    totalTokens: number;
    averageResponseTime: number;
    model: string;
    provider: AIProvider;
    folderId?: string;
    tags: string[];
    isPinned: boolean;
    isArchived: boolean;
  };
}

// API response types with discriminated unions
export type APIResponse<T> = 
  | { success: true; data: T; error?: never; }
  | { success: false; data?: never; error: APIError; };

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  retryable: boolean;
}

// Streaming response types
export type StreamingResponse = 
  | { type: 'start'; messageId: string; }
  | { type: 'chunk'; messageId: string; content: string; }
  | { type: 'complete'; messageId: string; finalContent: string; metadata?: any; }
  | { type: 'error'; messageId: string; error: APIError; };

// User preferences with strict typing
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  aiProvider: AIProvider;
  defaultModel: string;
  streamingEnabled: boolean;
  autoSave: boolean;
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
  };
  ui: {
    sidebarCollapsed: boolean;
    messageGrouping: boolean;
    showTimestamps: boolean;
    fontSize: 'small' | 'medium' | 'large';
  };
  privacy: {
    saveConversations: boolean;
    shareAnalytics: boolean;
    clearOnExit: boolean;
  };
}

// Model configuration with provider-specific settings
export interface ModelConfig {
  id: string;
  name: string;
  provider: AIProvider;
  capabilities: {
    streaming: boolean;
    functionCalling: boolean;
    vision: boolean;
    maxTokens: number;
    contextWindow: number;
  };
  pricing?: {
    inputTokens: number; // per 1k tokens
    outputTokens: number; // per 1k tokens
    currency: string;
  };
  limits: {
    requestsPerMinute: number;
    requestsPerDay: number;
    tokensPerMinute: number;
  };
}

// Cache entry with TTL and metadata
export interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: Date;
  ttl: number; // Time to live in milliseconds
  accessCount: number;
  lastAccessed: Date;
  metadata?: Record<string, any>;
}

// Performance metrics
export interface PerformanceMetrics {
  renderTime: number;
  apiResponseTime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cacheHitRate: number;
  errorRate: number;
  timestamp: Date;
}

// Event types for better event handling
export type AppEvent = 
  | { type: 'MESSAGE_SENT'; payload: { messageId: string; content: string; } }
  | { type: 'MESSAGE_RECEIVED'; payload: { messageId: string; content: string; } }
  | { type: 'CHAT_CREATED'; payload: { chatId: string; title: string; } }
  | { type: 'CHAT_DELETED'; payload: { chatId: string; } }
  | { type: 'ERROR_OCCURRED'; payload: { error: APIError; context: string; } }
  | { type: 'SETTINGS_CHANGED'; payload: { key: string; value: any; } }
  | { type: 'PROVIDER_CHANGED'; payload: { provider: AIProvider; model: string; } };

// Form validation types
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings?: Record<string, string[]>;
}

export interface FormField<T> {
  value: T;
  error?: string;
  touched: boolean;
  dirty: boolean;
  validators: Array<(value: T) => string | null>;
}

// Database operation types
export type DatabaseOperation = 
  | { type: 'CREATE'; table: string; data: Record<string, any>; }
  | { type: 'READ'; table: string; id: string; }
  | { type: 'UPDATE'; table: string; id: string; data: Partial<Record<string, any>>; }
  | { type: 'DELETE'; table: string; id: string; }
  | { type: 'QUERY'; table: string; filters: Record<string, any>; };

// Export/Import types
export interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  chatIds?: string[];
  compression: boolean;
}

export interface ImportResult {
  success: boolean;
  importedChats: number;
  importedMessages: number;
  errors: string[];
  warnings: string[];
  duplicatesSkipped: number;
}

// Folder and organization types
export interface ChatFolder {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  parentId?: string;
  chatIds: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    chatCount: number;
    totalMessages: number;
    lastActivity: Date;
  };
}

export interface ChatTag {
  id: string;
  name: string;
  color: string;
  description?: string;
  chatIds: string[];
  createdAt: Date;
  usageCount: number;
}

// Search and filtering types
export interface SearchFilters {
  query?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  providers?: AIProvider[];
  models?: string[];
  folders?: string[];
  tags?: string[];
  messageRole?: MessageRole;
  hasErrors?: boolean;
}

export interface SearchResult {
  chatId: string;
  messageId?: string;
  relevanceScore: number;
  snippet: string;
  highlightedContent: string;
  metadata: {
    chatTitle: string;
    messageRole?: MessageRole;
    timestamp: Date;
    provider?: AIProvider;
    model?: string;
  };
}

// Utility types for better type inference
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Type guards for runtime type checking
export const isMessageState = (state: any): state is MessageState => {
  if (!state || typeof state !== 'object') return false;
  
  const validStatuses: MessageStatus[] = ['pending', 'streaming', 'completed', 'error', 'cancelled'];
  if (!validStatuses.includes(state.status)) return false;
  
  switch (state.status) {
    case 'streaming':
      return typeof state.progress === 'number' && state.progress >= 0 && state.progress <= 100;
    case 'error':
      return typeof state.error === 'string' && state.error.length > 0;
    case 'pending':
    case 'completed':
    case 'cancelled':
      return state.progress === undefined && state.error === undefined;
    default:
      return false;
  }
};

export const isAPIResponse = <T>(response: any): response is APIResponse<T> => {
  if (!response || typeof response !== 'object') return false;
  
  if (response.success === true) {
    return response.data !== undefined && response.error === undefined;
  } else if (response.success === false) {
    return response.data === undefined && 
           response.error && 
           typeof response.error.code === 'string' &&
           typeof response.error.message === 'string';
  }
  
  return false;
};

export const isEnhancedMessage = (message: any): message is EnhancedMessage => {
  return message &&
         typeof message.id === 'string' &&
         typeof message.content === 'string' &&
         ['user', 'assistant', 'system'].includes(message.role) &&
         message.timestamp instanceof Date &&
         isMessageState(message.state);
};

// Helper functions for type-safe operations
export const createMessageState = (status: MessageStatus, options?: {
  progress?: number;
  error?: string;
}): MessageState => {
  switch (status) {
    case 'pending':
    case 'completed':
    case 'cancelled':
      return { status };
    case 'streaming':
      return { status, progress: options?.progress ?? 0 };
    case 'error':
      return { status, error: options?.error ?? 'Unknown error' };
    default:
      throw new Error(`Invalid message status: ${status}`);
  }
};

export const createAPIResponse = <T>(
  success: boolean,
  data?: T,
  error?: Partial<APIError>
): APIResponse<T> => {
  if (success && data !== undefined) {
    return { success: true, data };
  } else if (!success && error) {
    return {
      success: false,
      error: {
        code: error.code ?? 'UNKNOWN_ERROR',
        message: error.message ?? 'An unknown error occurred',
        details: error.details,
        timestamp: error.timestamp ?? new Date(),
        retryable: error.retryable ?? false,
      },
    };
  } else {
    throw new Error('Invalid API response parameters');
  }
};