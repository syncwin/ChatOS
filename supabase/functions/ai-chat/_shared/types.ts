
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  provider: string;
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  apiKey?: string; // For guest users
  stream?: boolean;
}

export interface NormalizedResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  provider: string;
}
