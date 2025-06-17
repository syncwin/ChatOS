
import { handleOpenAI } from './openai.ts';
import { handleAnthropic } from './anthropic.ts';
import { handleGemini } from './gemini.ts';
import { handleMistral } from './mistral.ts';
import { handleOpenRouter } from './openrouter.ts';
import { handleStraico } from './straico.ts';
import { handleCustomAzureOpenAI } from './customAzureOpenAI.ts';
import type { ChatMessage, NormalizedResponse } from '../_shared/types.ts';

type ProviderHandler = (
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  temperature: number,
  max_tokens: number,
  stream?: boolean,
  // Adding providerParams to the type to match handleCustomAzureOpenAI and future needs
  providerParams?: Record<string, string | undefined>
) => Promise<NormalizedResponse | ReadableStream>;

export const providerHandlers: Record<string, ProviderHandler> = {
  'OpenAI': handleOpenAI,
  'Anthropic': handleAnthropic as ProviderHandler,
  'Google Gemini': handleGemini as ProviderHandler,
  'Mistral': handleMistral as ProviderHandler,
  'OpenRouter': handleOpenRouter as ProviderHandler,
  'Straico': handleStraico as ProviderHandler,
  'Azure OpenAI (Custom)': handleCustomAzureOpenAI as ProviderHandler,
};

export const defaultModels: Record<string, string> = {
  'OpenAI': 'gpt-4o-mini',
  'Anthropic': 'claude-3-5-haiku-20241022',
  'Google Gemini': 'gemini-1.5-flash',
  'Mistral': 'mistral-small-latest',
  'OpenRouter': 'anthropic/claude-3.5-sonnet',
  'Straico': 'straico/latest',
  'Azure OpenAI (Custom)': 'user-defined',
};
