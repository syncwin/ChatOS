
import { supabase } from '@/integrations/supabase/client';

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

export const sendChatMessage = async (request: ChatRequest): Promise<NormalizedResponse> => {
  const { data, error } = await supabase.functions.invoke('ai-chat', {
    body: request,
  });

  if (error) {
    throw new Error(error.message || 'Failed to send chat message');
  }

  return data;
};

export const getAvailableProviders = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('api_keys')
    .select('provider');

  if (error) {
    throw new Error('Failed to fetch available providers');
  }

  // Ensure unique providers are returned
  const providers = data.map(item => item.provider);
  return [...new Set(providers)];
};

// Default models for each provider
export const getDefaultModel = (provider: string): string => {
  const defaultModels: Record<string, string> = {
    'OpenAI': 'gpt-4o-mini',
    'Anthropic': 'claude-3-5-haiku-20241022',
    'Google Gemini': 'gemini-1.5-flash',
    'Mistral': 'mistral-small-latest',
    'OpenRouter': 'anthropic/claude-3.5-sonnet'
  };

  return defaultModels[provider] || 'gpt-4o-mini';
};

// Available models for each provider
export const getAvailableModels = (provider:string): string[] => {
  const models: Record<string, string[]> = {
    'OpenAI': ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
    'Anthropic': [
      'claude-opus-4-20250514',
      'claude-sonnet-4-20250514',
      'claude-3-5-haiku-20241022'
    ],
    'Google Gemini': [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro'
    ],
    'Mistral': [
      'mistral-small-latest',
      'mistral-medium-latest',
      'mistral-large-latest'
    ],
    'OpenRouter': [
      'anthropic/claude-3.5-sonnet',
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'google/gemini-1.5-pro-latest',
      'deepseek/deepseek-chat',
      'mistralai/mistral-large-latest',
      'meta-llama/llama-3-70b-instruct',
      'meta-llama/llama-3-8b-instruct',
    ]
  };

  return models[provider] || ['gpt-4o-mini'];
};
