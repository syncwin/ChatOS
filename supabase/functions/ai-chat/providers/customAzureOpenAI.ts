import type { ChatMessage, NormalizedResponse, ProviderHandlerParams } from '../_shared/types.ts';

const DEFAULT_AZURE_API_VERSION = '2025-01-01-preview'; // Or another suitable default

export async function handleCustomAzureOpenAI(
  apiKey: string,
  model: string, // This might be the deployment_id or a generic model name passed from the client
  messages: ChatMessage[],
  temperature: number,
  max_tokens: number,
  stream: boolean = false,
  providerParams?: ProviderHandlerParams
): Promise<NormalizedResponse | ReadableStream> {
  const endpointUrl = providerParams?.endpoint_url;
  const deploymentId = providerParams?.deployment_id;

  if (!endpointUrl || !deploymentId) {
    throw new Error('Azure OpenAI endpoint URL or deployment ID is not configured for this API key.');
  }

  // Ensure endpointUrl ends with a slash if it doesn't already
  const normalizedEndpointUrl = endpointUrl.endsWith('/') ? endpointUrl : `${endpointUrl}/`;

  const fullUrl = `${normalizedEndpointUrl}openai/deployments/${deploymentId}/chat/completions?api-version=${DEFAULT_AZURE_API_VERSION}`;

  const requestBody = {
    messages,
    temperature,
    max_tokens,
    stream,
    // Azure OpenAI might not use the 'model' field in the body if the deployment ID in URL specifies the model.
    // If it's needed, 'model' (which could be the deploymentId or another value) can be added here.
    // model: model,
  };

  // Log the request body and URL for debugging (optional)
  console.log("Custom Azure OpenAI Request URL:", fullUrl);
  console.log("Custom Azure OpenAI Request Body:", JSON.stringify(requestBody, null, 2));

  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: {
      'api-key': apiKey, // Azure OpenAI typically uses 'api-key' header
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Custom Azure OpenAI API Error:", errorText);
    throw new Error(`Custom Azure OpenAI API error: ${response.status} ${errorText}`);
  }

  if (stream) {
    if (!response.body) {
      throw new Error('Custom Azure OpenAI API response body is null for stream.');
    }
    // Assuming Azure OpenAI streaming is compatible with the standard SSE parsing in the main function.
    return response.body;
  }

  const data = await response.json();
  console.log("Custom Azure OpenAI Response Data:", JSON.stringify(data, null, 2));

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    console.error("Unexpected Custom Azure OpenAI response structure:", data);
    throw new Error('Unexpected Custom Azure OpenAI API response structure');
  }

  return {
    content: data.choices[0].message.content,
    usage: data.usage,
    model: data.model || deploymentId, // Use model from response, or fallback to deploymentId
    provider: 'Azure OpenAI (Custom)'
  };
}
