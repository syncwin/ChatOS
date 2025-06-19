
import type { ChatMessage, NormalizedResponse } from '../_shared/types.ts';

interface GeminiModel {
  name: string;
  displayName?: string;
  description?: string;
}

interface GeminiModelsResponse {
  models: GeminiModel[];
}

export async function getAvailableGeminiModels(apiKey: string): Promise<string[]> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  if (!response.ok) {
    console.error('[ai-chat:gemini] Failed to fetch available models');
    return [];
  }
  const data: GeminiModelsResponse = await response.json();
  return data.models.map((model: GeminiModel) => model.name.replace('models/', ''));
}

export async function handleGemini(apiKey: string, model: string, messages: ChatMessage[], temperature: number, max_tokens: number): Promise<NormalizedResponse> {
  const contents = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: max_tokens,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    const errorMessage = errorBody.error?.message || JSON.stringify(errorBody);
    console.error(`[ai-chat:gemini] Gemini API error: ${response.status} ${errorMessage}`);
    throw new Error(`Gemini API error: ${errorMessage}`);
  }

  const data = await response.json();

  if (!data.candidates || data.candidates.length === 0) {
    console.error('[ai-chat:gemini] Gemini API returned no candidates');
    throw new Error('Gemini API returned no candidates.');
  }

  return {
    content: data.candidates[0].content.parts[0].text,
    usage: {
      prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
      completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
      total_tokens: data.usageMetadata?.totalTokenCount || 0
    },
    model,
    provider: 'Google Gemini'
  };

}
