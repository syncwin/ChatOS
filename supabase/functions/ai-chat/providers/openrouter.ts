
import type { ChatMessage, NormalizedResponse } from '../_shared/types.ts';

export async function handleOpenRouter(apiKey: string, model: string, messages: ChatMessage[], temperature: number, max_tokens: number): Promise<NormalizedResponse> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://insightseeker.ai',
      'X-Title': 'InsightSeeker'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data = await response.json();
  
  return {
    content: data.choices[0].message.content,
    usage: data.usage,
    model: data.model,
    provider: 'OpenRouter'
  };
}
