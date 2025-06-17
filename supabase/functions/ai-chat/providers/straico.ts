import type { ChatMessage, NormalizedResponse } from '../_shared/types.ts';

export async function handleStraico(apiKey: string, model: string, messages: ChatMessage[], temperature: number, max_tokens: number, stream: boolean = false): Promise<NormalizedResponse | ReadableStream> {
  const requestBody = {
    model,
    messages,
    temperature,
    max_tokens,
    stream,
  };

  // Log the request body for debugging (optional, can be removed later)
  console.log("Straico Request Body:", JSON.stringify(requestBody, null, 2));

  const response = await fetch('https://api.straico.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    // Log the error for debugging (optional, can be removed later)
    console.error("Straico API Error:", errorText);
    throw new Error(`Straico API error: ${response.status} ${errorText}`);
  }

  if (stream) {
    // TODO: Implement streaming logic if Straico supports it and it's different from OpenAI's
    // For now, assuming it's similar to OpenAI and the main function handles SSE parsing.
    // If Straico uses a different streaming format, this will need adjustment.
    if (!response.body) {
      throw new Error('Straico API response body is null for stream.');
    }
    return response.body;
  }

  const data = await response.json();

  // Log the response data for debugging (optional, can be removed later)
  console.log("Straico Response Data:", JSON.stringify(data, null, 2));

  // Normalize the response based on typical Straico response structure.
  // This assumes Straico's response structure is similar to OpenAI:
  // { choices: [{ message: { content: "..." } }], usage: { ... } }
  // Adjust if Straico's actual response structure is different.
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    console.error("Unexpected Straico response structure:", data);
    throw new Error('Unexpected Straico API response structure');
  }

  return {
    content: data.choices[0].message.content,
    usage: data.usage, // Assuming 'usage' object is present and has the same structure
    model: data.model || model, // Assuming 'model' is present in response, otherwise use requested model
    provider: 'Straico'
  };
}
