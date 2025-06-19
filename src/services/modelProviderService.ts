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

/**
 * Service for fetching and managing AI model information from various providers
 */
class ModelProviderService {
  /**
   * Make authenticated requests to provider APIs
   */
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
      } else if (url.includes('generativelanguage.googleapis.com')) {
        requestHeaders['Authorization'] = `Bearer ${apiKey}`;
      }
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: requestHeaders,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    return response;
  }

  /**
   * Fetch available models from OpenRouter
   */
  async fetchOpenRouterModels(apiKey?: string): Promise<ModelResponse> {
    const cacheKey = `openrouter_${apiKey ? 'with_key' : 'no_key'}`;
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
      if (!apiKey) {
        return { 
          models: this.getFallbackModels('OpenRouter'),
          error: 'API key required for OpenRouter models'
        };
      }
      return { 
        models: this.getFallbackModels('OpenRouter'),
        error: `Failed to fetch OpenRouter models: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Fetch available models from Google Gemini using OpenAI-compatible endpoint
   */
  async fetchGeminiModels(apiKey?: string): Promise<ModelResponse> {
    const cacheKey = `gemini_${apiKey ? 'with_key' : 'no_key'}`;
    const cached = modelCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < MODEL_CACHE_DURATION) {
      return { models: cached.data };
    }

    if (!apiKey) {
      return { 
        models: this.getFallbackModels('Google Gemini'),
        error: 'API key required for Gemini models'
      };
    }

    try {
      // Use the OpenAI-compatible endpoint for Gemini
      const response = await this.fetchWithAuth(
        'https://generativelanguage.googleapis.com/v1beta/openai/models',
        apiKey
      );
      
      const data = await response.json();
      const models: ModelInfo[] = data.data?.map((model: any) => ({
        id: model.id,
        name: this.getGeminiDisplayName(model.id),
        provider: 'Google Gemini',
        description: this.getGeminiModelDescription(model.id),
        context_length: this.getGeminiContextLength(model.id),
        created: model.created
      })) || [];

      if (models.length === 0) {
        throw new Error('No models returned from Gemini API');
      }

      modelCache.set(cacheKey, { data: models, timestamp: Date.now() });
      return { models };
    } catch (error) {
      console.error('Failed to fetch Gemini models:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { 
        models: this.getFallbackModels('Google Gemini'),
        error: `Failed to get response from Google Gemini: Gemini API error - ${errorMessage}`
      };
    }
  }

  /**
   * Fetch available models from OpenAI
   */
  async fetchOpenAIModels(apiKey?: string): Promise<ModelResponse> {
    const cacheKey = `openai_${apiKey ? 'with_key' : 'no_key'}`;
    const cached = modelCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < MODEL_CACHE_DURATION) {
      return { models: cached.data };
    }

    if (!apiKey) {
      return { 
        models: this.getFallbackModels('OpenAI'),
        error: 'API key required for OpenAI models'
      };
    }

    try {
      const response = await this.fetchWithAuth(
        'https://api.openai.com/v1/models',
        apiKey
      );
      
      const data = await response.json();
      
      // Filter to only include chat completion models and exclude unsupported ones
      const models: ModelInfo[] = data.data
        ?.filter((model: any) => {
          const modelId = model.id.toLowerCase();
          // Include GPT models and o1 models, exclude image generation and other specialized models
          return (modelId.includes('gpt') || modelId.includes('o1')) && 
                 !modelId.includes('instruct') && 
                 !modelId.includes('edit') &&
                 !modelId.includes('embedding') &&
                 !modelId.includes('davinci') &&
                 !modelId.includes('curie') &&
                 !modelId.includes('babbage') &&
                 !modelId.includes('ada');
        })
        ?.map((model: any) => ({
          id: model.id,
          name: this.getOpenAIDisplayName(model.id),
          provider: 'OpenAI',
          description: this.getOpenAIModelDescription(model.id),
          context_length: this.getOpenAIContextLength(model.id),
          created: model.created
        })) || [];

      if (models.length === 0) {
        throw new Error('No compatible models found for chat completion');
      }

      modelCache.set(cacheKey, { data: models, timestamp: Date.now() });
      return { models };
    } catch (error) {
      console.error('Failed to fetch OpenAI models:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { 
        models: this.getFallbackModels('OpenAI'),
        error: `Failed to fetch OpenAI models: ${errorMessage}`
      };
    }
  }

  /**
   * Get display name for Gemini models
   */
  private getGeminiDisplayName(modelId: string): string {
    const displayNames: Record<string, string> = {
      'gemini-1.5-flash': 'Gemini 1.5 Flash',
      'gemini-1.5-pro': 'Gemini 1.5 Pro',
      'gemini-pro': 'Gemini Pro',
      'gemini-pro-vision': 'Gemini Pro Vision'
    };
    return displayNames[modelId] || modelId;
  }

  /**
   * Get display name for OpenAI models
   */
  private getOpenAIDisplayName(modelId: string): string {
    const displayNames: Record<string, string> = {
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o Mini',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'o1-preview': 'o1 Preview',
      'o1-mini': 'o1 Mini'
    };
    return displayNames[modelId] || modelId;
  }

  /**
   * Get model description for Gemini models
   */
  private getGeminiModelDescription(modelId: string): string {
    const descriptions: Record<string, string> = {
      'gemini-1.5-flash': 'Fast and efficient model for most tasks',
      'gemini-1.5-pro': 'Most capable Gemini model with advanced reasoning',
      'gemini-pro': 'Balanced performance model for general use',
      'gemini-pro-vision': 'Gemini model with vision capabilities'
    };
    return descriptions[modelId] || 'Google Gemini language model';
  }

  /**
   * Get context length for Gemini models
   */
  private getGeminiContextLength(modelId: string): number {
    const contextLengths: Record<string, number> = {
      'gemini-1.5-flash': 1000000,
      'gemini-1.5-pro': 2000000,
      'gemini-pro': 30720,
      'gemini-pro-vision': 30720
    };
    return contextLengths[modelId] || 128000;
  }

  /**
   * Get model description for OpenAI models
   */
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

  /**
   * Get context length for OpenAI models
   */
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

  /**
   * Get fallback models when API calls fail
   */
  private getFallbackModels(provider: string): ModelInfo[] {
    const fallbackModels: Record<string, ModelInfo[]> = {
      'OpenAI': [
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', description: 'Fast and affordable GPT-4 model', context_length: 128000 },
        { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Most capable GPT-4 model', context_length: 128000 },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', description: 'Fast and cost-effective', context_length: 16385 }
      ],
      'Google Gemini': [
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google Gemini', description: 'Fast and efficient model', context_length: 1000000 },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google Gemini', description: 'Most capable Gemini model', context_length: 2000000 },
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

  /**
   * Clear the model cache
   */
  clearCache(): void {
    modelCache.clear();
  }
}

export const modelProviderService = new ModelProviderService();
