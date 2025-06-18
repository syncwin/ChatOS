
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

const SUPABASE_URL = 'https://ejjmwhkjnkxtmzvpqnig.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqam13aGtqbmt4dG16dnBxbmlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5ODUyNDYsImV4cCI6MjA2NTU2MTI0Nn0.EiOR2sXfGi_YnUcm_hEsyG0yRF6vqhWGH3KFrV0stl8';

async function invokeAiChat(request: ChatRequest): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Edge Function returned an error: ${response.status}`;
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response;
}

export const sendChatMessage = async (request: ChatRequest): Promise<NormalizedResponse> => {
  const response = await invokeAiChat({ ...request, stream: false });
  return await response.json();
};

export const streamChatMessage = async (
  request: ChatRequest,
  onDelta: (chunk: string) => void,
  onError: (error: Error) => void
): Promise<void> => {
  try {
    const response = await invokeAiChat({ ...request, stream: true });

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      const chunk = decoder.decode(value, { stream: true });
      onDelta(chunk);
    }
  } catch (error) {
    console.error('Streaming error:', error);
    onError(error as Error);
  }
};

export const getAvailableProviders = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('api_keys')
    .select('provider');

  if (error) {
    console.error('Error fetching providers:', error);
    return [];
  }

  // Ensure unique providers are returned
  const providers = data.map(item => item.provider);
  return [...new Set(providers)];
};

// Default models for each provider (fallback)
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

// Fallback models for each provider (used when dynamic fetching fails)
export const getAvailableModels = (provider: string): string[] => {
  const models: Record<string, string[]> = {
    'OpenAI': ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo', 'o1-preview', 'o1-mini'],
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
