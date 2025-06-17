
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './_shared/cors.ts';
import type { ChatRequest, NormalizedResponse, ProviderHandlerParams } from './_shared/types.ts';
import { createOpenAINormalizer } from './streaming/openaiNormalizer.ts';
import { getApiKey, type ApiKeyDetails } from './auth/apiKeyHandler.ts';
import { providerHandlers, defaultModels } from './providers/_registry.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      provider, 
      model, 
      messages, 
      temperature = 0.7, 
      max_tokens = 1000, 
      apiKey: guestApiKey,
      stream = false
    } = await req.json() as ChatRequest;

    console.log(`[ai-chat] Provider: ${provider} | Model: ${model} | Guest?: ${!!guestApiKey} | Stream?: ${stream}`);

    const apiKeyDetails: ApiKeyDetails = await getApiKey(req, guestApiKey, provider);
    const resolvedModel = model || defaultModels[provider];
    const handler = providerHandlers[provider];

    const providerParams: ProviderHandlerParams = {
      endpoint_url: apiKeyDetails.endpointUrl,
      deployment_id: apiKeyDetails.deploymentId,
    };

    if (!handler) {
      console.error(`[ai-chat] Unsupported provider: ${provider}`);
      throw new Error(`Unsupported AI provider: ${provider}`);
    }

    // Handle streaming
    if (stream) {
      // TODO: Streaming for Azure OpenAI (Custom) would need its own normalizer if different from OpenAI
      if (provider === 'OpenAI' || provider === 'Azure OpenAI (Custom)') {
        const streamResponse = await handler(
          apiKeyDetails.apiKey,
          resolvedModel,
          messages,
          temperature,
          max_tokens,
          true,
          providerParams
        ) as ReadableStream;

        // Assuming Azure OpenAI (Custom) stream is compatible with OpenAI normalizer for now
        const normalizedStream = streamResponse.pipeThrough(createOpenAINormalizer());

        return new Response(normalizedStream, {
          headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' },
        });
      } else {
        // For other providers that might not support streaming or providerParams yet
        if (providerHandlers[provider].length < 7 && (providerParams.endpoint_url || providerParams.deployment_id)) {
           console.warn(`[ai-chat] Provider ${provider} does not support custom params but they were provided.`);
        }
        const streamResponse = await handler(apiKeyDetails.apiKey, resolvedModel, messages, temperature, max_tokens, true) as ReadableStream;
        // Potentially use a generic normalizer or handle based on provider if normalizers differ
        const normalizedStream = streamResponse.pipeThrough(createOpenAINormalizer());
         return new Response(normalizedStream, {
          headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
       return new Response(JSON.stringify({ error: `Streaming is not supported for ${provider} yet (or misconfigured).` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Handle non-streaming requests
    try {
      const response = await handler(
        apiKeyDetails.apiKey,
        resolvedModel,
        messages,
        temperature,
        max_tokens,
        false,
        providerParams
      ) as NormalizedResponse;
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (providerError) {
      console.error(`[ai-chat] Error calling AI provider ${provider}:`, providerError);
      const message = providerError instanceof Error ? providerError.message : String(providerError);
      // Check if the error message indicates missing params for Azure
      if (provider === 'Azure OpenAI (Custom)' && message.includes('endpoint URL or deployment ID is not configured')) {
         return new Response(JSON.stringify({ error: `Configuration error for Azure OpenAI (Custom): ${message}. Please check your API key settings.` }), {
          status: 400, // Bad Request, as it's a configuration issue on the user's side
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(
        `Failed to get response from ${provider}: ${message}`
      );
    }
  } catch (error) {
    const errMsg = (error && typeof error === "object" && "message" in error) ? (error as Error).message : String(error);
    console.error('[ai-chat] Error:', errMsg);

    const status = errMsg?.includes("add your API key") ? 400 : 500;

    return new Response(JSON.stringify({ error: errMsg }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
