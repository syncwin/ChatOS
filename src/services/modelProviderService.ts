
export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt?: number;
    completion?: number;
  };
  capabilities?: string[];
  created?: number;
}

export interface ModelResponse {
  models: ModelInfo[];
  error?: string;
}

const MODEL_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const modelCache = new Map<string, { data: ModelInfo[]; timestamp: number }>();

class ModelProviderService {
  private async fetchWithAuth(url: string, apiKey?: string, headers: Record<string, string> = {}): Promise<Response> {
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (apiKey) {
      if (url.includes('openrouter.ai')) {
        requestHeaders['Authorization'] = `Bearer ${apiKey}`;
        requestHeaders['HTTP-Referer'] = window.location.origin;
        requestHeaders['X-Title'] = 'ChatOS';
      } else if (url.includes('openai.com')) {
        requestHeaders['Authorization'] = `Bearer ${apiKey}`;
      }
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: requestHeaders,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }

  async fetchOpenRouterModels(apiKey?: string): Promise<ModelResponse> {
    const cacheKey = 'openrouter';
    const cached = modelCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < MODEL_CACHE_DURATION) {
      return { models: cached.data };
    }

    try {
      const response = await this.fetchWithAuth(
        'https://openrouter.ai/api/v1/models',
        apiKey
      );
      
      const data = await response.json();
      const models: ModelInfo[] = data.data?.map((model: any) => ({
        id: model.id,
        name: model.name || model.id,
        provider: 'OpenRouter',
        description: model.description,
        context_length: model.context_length,
        pricing: {
          prompt: parseFloat(model.pricing?.prompt || '0'),
          completion: parseFloat(model.pricing?.completion || '0'),
        },
        capabilities: []
      })) || [];

      modelCache.set(cacheKey, { data: models, timestamp: Date.now() });
      return { models };
    } catch (error) {
      console.error('Failed to fetch OpenRouter models:', error);
      return { 
        models: this.getFallbackModels('OpenRouter'),
        error: `Failed to fetch OpenRouter models: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async fetchGeminiModels(apiKey?: string): Promise<ModelResponse> {
    const cacheKey = 'gemini';
    const cached = modelCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < MODEL_CACHE_DURATION) {
      return { models: cached.data };
    }

    try {
      if (!apiKey) {
        return { 
          models: this.getFallbackModels('Google Gemini'),
          error: 'API key required for Gemini models'
        };
      }

      const response = await this.fetchWithAuth(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      
      const data = await response.json();
      const models: ModelInfo[] = data.models?.map((model: any) => ({
        id: model.name.replace('models/', ''),
        name: model.displayName || model.name,
        provider: 'Google Gemini',
        description: model.description,
        context_length: 128000, // Default for Gemini models
        capabilities: model.supportedGenerationMethods || []
      })) || [];

      modelCache.set(cacheKey, { data: models, timestamp: Date.now() });
      return { models };
    } catch (error) {
      console.error('Failed to fetch Gemini models:', error);
      return { 
        models: this.getFallbackModels('Google Gemini'),
        error: `Failed to fetch Gemini models: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async fetchOpenAIModels(apiKey?: string): Promise<ModelResponse> {
    const cacheKey = 'openai';
    const cached = modelCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < MODEL_CACHE_DURATION) {
      return { models: cached.data };
    }

    try {
      if (!apiKey) {
        return { 
          models: this.getFallbackModels('OpenAI'),
          error: 'API key required for OpenAI models'
        };
      }

      const response = await this.fetchWithAuth(
        'https://api.openai.com/v1/models',
        apiKey
      );
      
      const data = await response.json();
      const models: ModelInfo[] = data.data
        ?.filter((model: any) => model.id.includes('gpt') || model.id.includes('o1'))
        ?.map((model: any) => ({
          id: model.id,
          name: model.id,
          provider: 'OpenAI',
          description: this.getOpenAIModelDescription(model.id),
          context_length: this.getOpenAIContextLength(model.id),
          created: model.created
        })) || [];

      modelCache.set(cacheKey, { data: models, timestamp: Date.now() });
      return { models };
    } catch (error) {
      console.error('Failed to fetch OpenAI models:', error);
      return { 
        models: this.getFallbackModels('OpenAI'),
        error: `Failed to fetch OpenAI models: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private getOpenAIModelDescription(modelId: string): string {
    const descriptions: Record<string, string> = {
      'gpt-4o': 'Most capable GPT-4 model with vision capabilities',
      'gpt-4o-mini': 'Fast and affordable GPT-4 model with vision',
      'gpt-4-turbo': 'Latest GPT-4 Turbo with improved performance',
      'gpt-3.5-turbo': 'Fast and cost-effective model for most tasks',
      'o1-preview': 'Reasoning model optimized for complex problems',
      'o1-mini': 'Faster reasoning model for coding and math'
    };
    return descriptions[modelId] || 'OpenAI language model';
  }

  private getOpenAIContextLength(modelId: string): number {
    const contextLengths: Record<string, number> = {
      'gpt-4o': 128000,
      'gpt-4o-mini': 128000,
      'gpt-4-turbo': 128000,
      'gpt-3.5-turbo': 16385,
      'o1-preview': 128000,
      'o1-mini': 128000
    };
    return contextLengths[modelId] || 4096;
  }

  private getFallbackModels(provider: string): ModelInfo[] {
    const fallbackModels: Record<string, ModelInfo[]> = {
      'OpenAI': [
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', description: 'Fast and affordable GPT-4 model', context_length: 128000 },
        { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Most capable GPT-4 model', context_length: 128000 },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', description: 'Fast and cost-effective', context_length: 16385 }
      ],
      'Google Gemini': [
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google Gemini', description: 'Fast and efficient model', context_length: 128000 },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google Gemini', description: 'Most capable Gemini model', context_length: 128000 },
        { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google Gemini', description: 'Balanced performance model', context_length: 30720 }
      ],
      'OpenRouter': [
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'OpenRouter', description: 'Anthropic Claude via OpenRouter', context_length: 200000 },
        { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenRouter', description: 'OpenAI GPT-4o via OpenRouter', context_length: 128000 },
        { id: 'google/gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro', provider: 'OpenRouter', description: 'Google Gemini via OpenRouter', context_length: 128000 }
      ]
    };

    return fallbackModels[provider] || [];
  }

  clearCache(): void {
    modelCache.clear();
  }
}

export const modelProviderService = new ModelProviderService();
