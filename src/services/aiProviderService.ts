
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

// Get Supabase configuration from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ejjmwhkjnkxtmzvpqnig.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqam13aGtqbmt4dG16dnBxbmlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5ODUyNDYsImV4cCI6MjA2NTU2MTI0Nn0.EiOR2sXfGi_YnUcm_hEsyG0yRF6vqhWGH3KFrV0stl8';

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing required Supabase environment variables for AI provider service.');
}

async function invokeAiChatWithRetry(request: ChatRequest, retries = 3, delay = 1000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      return await invokeAiChat(request);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
    }
  }
  throw new Error('Failed to invoke AI chat after multiple retries');
}

async function invokeAiChat(request: ChatRequest): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
  };
  
  // Always provide Authorization header - use user token if available, otherwise use anon key
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let errorMessage = `Edge Function returned an error: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = `Error from ${request.provider}: ${errorData.error}`;
      } else {
        errorMessage = `An unknown error occurred in the Edge Function.`
      }
    } catch (e) {
      // If parsing JSON fails, use the raw text
      const errorText = await response.text();
      errorMessage = errorText || errorMessage;
    }
    console.error(`[aiProviderService] ${errorMessage}`);
    throw new Error(errorMessage);
  }

  return response;
}

export const sendChatMessage = async (request: ChatRequest): Promise<NormalizedResponse> => {
  const response = await invokeAiChatWithRetry({ ...request, stream: false });
  return await response.json();
};

export const streamChatMessage = async (
  request: ChatRequest,
  onDelta: (chunk: string) => void,
  onError: (error: Error) => void
): Promise<void> => {
  try {
    const response = await invokeAiChatWithRetry({ ...request, stream: true });

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
