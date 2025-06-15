
import type { ChatMessage, NormalizedResponse } from '../_shared/types.ts';

export async function handleOpenAI(apiKey: string, model: string, messages: ChatMessage[], temperature: number, max_tokens: number, stream: boolean = false): Promise<NormalizedResponse | ReadableStream> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
      stream,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  if (stream) {
    return response.body!;
  }

  const data = await response.json();
  
  return {
    content: data.choices[0].message.content,
    usage: data.usage,
    model: data.model,
    provider: 'OpenAI'
  };
}
