
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './_shared/cors.ts';
import type { ChatRequest, NormalizedResponse } from './_shared/types.ts';
import { createOpenAINormalizer } from './streaming/openaiNormalizer.ts';
import { getApiKey } from './auth/apiKeyHandler.ts';
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

    if (!guestApiKey && !req.headers.get('Authorization')) {
      console.warn('[ai-chat] No API key or Authorization header found.');
    }

    const apiKey = await getApiKey(req, guestApiKey, provider);
    const resolvedModel = model || defaultModels[provider];
    const handler = providerHandlers[provider];

    if (!handler) {
      console.error(`[ai-chat] Unsupported provider: ${provider}`);
      throw new Error(`Unsupported AI provider: ${provider}`);
    }

    // Handle streaming
    if (stream) {
      if (provider === 'OpenAI') { // Currently only OpenAI supports streaming
        const streamResponse = await handler(apiKey, resolvedModel, messages, temperature, max_tokens, true) as ReadableStream;
        const normalizedStream = streamResponse.pipeThrough(createOpenAINormalizer());
        return new Response(normalizedStream, {
          headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' },
        });
      } else {
        return new Response(JSON.stringify({ error: `Streaming is not supported for ${provider} yet.` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Handle non-streaming requests
    try {
      const response = await handler(apiKey, resolvedModel, messages, temperature, max_tokens, false) as NormalizedResponse;
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (providerError) {
      console.error(`[ai-chat] Error calling AI provider ${provider}:`, providerError);
      throw new Error(
        `Failed to get response from ${provider}: ${providerError instanceof Error ? providerError.message : String(providerError)}`
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
