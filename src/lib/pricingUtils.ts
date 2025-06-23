export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
}

export interface PricingRate {
  input: number;
  output: number;
}

// Pricing data for different AI models (per 1K tokens)
export const pricing: Record<string, PricingRate> = {
  // OpenAI Models
  'gpt-4o': { input: 0.0025, output: 0.01 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'gpt-3.5-turbo-instruct': { input: 0.0015, output: 0.002 },
  
  // Anthropic Models
  'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
  'claude-3-5-sonnet-20240620': { input: 0.003, output: 0.015 },
  'claude-3-5-haiku-20241022': { input: 0.001, output: 0.005 },
  'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
  'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
  'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
  
  // Google Models
  'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
  'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },
  'gemini-1.0-pro': { input: 0.0005, output: 0.0015 },
  
  // Mistral Models
  'mistral-large-latest': { input: 0.002, output: 0.006 },
  'mistral-medium-latest': { input: 0.00275, output: 0.0081 },
  'mistral-small-latest': { input: 0.001, output: 0.003 },
  'open-mistral-7b': { input: 0.00025, output: 0.00025 },
  'open-mixtral-8x7b': { input: 0.0007, output: 0.0007 },
  'open-mixtral-8x22b': { input: 0.002, output: 0.006 },
  
  // Groq Models (often free or very low cost)
  'llama-3.1-405b-reasoning': { input: 0.0, output: 0.0 },
  'llama-3.1-70b-versatile': { input: 0.0, output: 0.0 },
  'llama-3.1-8b-instant': { input: 0.0, output: 0.0 },
  'llama3-groq-70b-8192-tool-use-preview': { input: 0.0, output: 0.0 },
  'llama3-groq-8b-8192-tool-use-preview': { input: 0.0, output: 0.0 },
  'llama-3.2-1b-preview': { input: 0.0, output: 0.0 },
  'llama-3.2-3b-preview': { input: 0.0, output: 0.0 },
  'llama-3.2-11b-vision-preview': { input: 0.0, output: 0.0 },
  'llama-3.2-90b-vision-preview': { input: 0.0, output: 0.0 },
  'mixtral-8x7b-32768': { input: 0.0, output: 0.0 },
  'gemma-7b-it': { input: 0.0, output: 0.0 },
  'gemma2-9b-it': { input: 0.0, output: 0.0 },
  
  // XAI Models
  'grok-beta': { input: 0.005, output: 0.015 },
  'grok-vision-beta': { input: 0.005, output: 0.015 },
  
  // DeepSeek Models
  'deepseek-chat': { input: 0.00014, output: 0.00028 },
  'deepseek-reasoner': { input: 0.00055, output: 0.0022 },
};

// Free providers that don't charge for usage
export const freeProviders = ['groq'];

// Free models that don't charge regardless of provider
export const freeModels = [
  'llama-3.1-405b-reasoning',
  'llama-3.1-70b-versatile', 
  'llama-3.1-8b-instant',
  'llama3-groq-70b-8192-tool-use-preview',
  'llama3-groq-8b-8192-tool-use-preview',
  'llama-3.2-1b-preview',
  'llama-3.2-3b-preview',
  'llama-3.2-11b-vision-preview',
  'llama-3.2-90b-vision-preview',
  'mixtral-8x7b-32768',
  'gemma-7b-it',
  'gemma2-9b-it'
];

/**
 * Calculates the cost of AI model usage based on token consumption
 * @param usage - Token usage information
 * @param provider - AI provider name
 * @param model - Model name
 * @returns Total cost in USD
 */
export const calculateCost = (
  usage: Usage,
  provider?: string,
  model?: string
): number => {
  if (!usage || !usage.prompt_tokens || !usage.completion_tokens) {
    return 0;
  }
  
  // Check if provider or model is free
  if (provider && freeProviders.includes(provider.toLowerCase())) {
    return 0;
  }
  
  if (model && freeModels.includes(model.toLowerCase())) {
    return 0;
  }
  
  // Get model key for pricing lookup
  const modelKey = model?.toLowerCase() || 'unknown';
  
  // Get pricing rates, fallback to default if not found
  const rates = pricing[modelKey] || { input: 0.001, output: 0.002 }; // Default rates
  
  const inputCost = (usage.prompt_tokens / 1000) * rates.input;
  const outputCost = (usage.completion_tokens / 1000) * rates.output;
  const totalCost = inputCost + outputCost;
  
  return totalCost;
};

/**
 * Formats cost as a currency string
 * @param cost - Cost in USD
 * @returns Formatted cost string
 */
export const formatCost = (cost: number): string => {
  if (cost === 0) {
    return 'Free';
  }
  
  if (cost < 0.001) {
    return '<$0.001';
  }
  
  return `$${cost.toFixed(4)}`;
};

/**
 * Gets pricing information for a specific model
 * @param model - Model name
 * @returns Pricing rate information
 */
export const getModelPricing = (model?: string): PricingRate | null => {
  if (!model) return null;
  
  const modelKey = model.toLowerCase();
  return pricing[modelKey] || null;
};

/**
 * Checks if a provider/model combination is free
 * @param provider - AI provider name
 * @param model - Model name
 * @returns True if free, false otherwise
 */
export const isFreeModel = (provider?: string, model?: string): boolean => {
  if (provider && freeProviders.includes(provider.toLowerCase())) {
    return true;
  }
  
  if (model && freeModels.includes(model.toLowerCase())) {
    return true;
  }
  
  return false;
};