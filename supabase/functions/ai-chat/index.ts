import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  provider: string;
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  apiKey?: string; // For guest users
}

interface NormalizedResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  provider: string;
}

const getSupabaseClient = (req: Request): SupabaseClient => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    // Return a client without auth for guest or non-authed operations
    return createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
  }
  // Return a client with the user's auth context
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );
};

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
      apiKey: guestApiKey 
    } = await req.json() as ChatRequest;

    console.log(`[ai-chat] Provider: ${provider} | Model: ${model} | Guest?: ${!!guestApiKey}`);

    let apiKey: string | undefined;
    const supabaseClient = getSupabaseClient(req);

    // 1. Try to get logged-in user (should be present for non-guest)
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError) {
      console.error('[ai-chat] Error fetching user:', userError);
    }
    console.log(`[ai-chat] User status: ${user ? user.id : 'unauthenticated'}`);

    // 2. Authenticated user path (DB lookup): use service key and log issues
    if (user) {
      console.log(`[ai-chat] Getting provider API key for user ${user.id}`);
      const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      // Defensive: If provider is undefined, throw error here
      if (!provider) {
        console.error('[ai-chat] Provider missing in request (user auth).');
        throw new Error('No provider specified.');
      }

      const { data: apiKeyData, error: apiKeyError } = await serviceClient
        .from('api_keys')
        .select('api_key')
        .eq('provider', provider)
        .eq('user_id', user.id)
        .maybeSingle();

      if (apiKeyError) {
        console.error(`[ai-chat] Supabase DB error for user ${user.id}:`, apiKeyError);
        throw new Error(`[INTERNAL] Failed to look up your API key for ${provider}. Please try again or check your settings.`);
      }
      if (!apiKeyData || !apiKeyData.api_key) {
        console.warn(`[ai-chat] No API key found in DB for user ${user.id} and provider ${provider}`);
        throw new Error(
          `No API key found for ${provider}. Please add your API key for this provider in the Settings page.`
        );
      }
      apiKey = apiKeyData.api_key;
      console.log('[ai-chat] Found provider API key for logged-in user.');
    } 
    // 3. Guest path: get key from payload
    else if (guestApiKey) {
      apiKey = guestApiKey;
      if (!provider) {
        console.error('[ai-chat] Provider missing in request (guest).');
        throw new Error('No provider specified.');
      }
      console.log(`[ai-chat] Using guest API key for provider: ${provider}`);
    } 
    // 4. No auth found: error
    else {
      console.error('[ai-chat] No authentication found (no user or API key)');
      throw new Error('You must be logged in or provide an API key to chat.');
    }

    // 5. Final check: make sure we have an apiKey
    if (!apiKey) {
      console.error('[ai-chat] apiKey variable still undefined after all checks.');
      throw new Error('Internal error: Could not resolve an API key to use.');
    }

    // 6. Proceed to provider-specific handler
    let response: NormalizedResponse;
    try {
      switch (provider) {
        case 'OpenAI':
          response = await handleOpenAI(apiKey, model || 'gpt-4o-mini', messages, temperature, max_tokens);
          break;
        case 'Anthropic':
          response = await handleAnthropic(apiKey, model || 'claude-3-5-haiku-20241022', messages, temperature, max_tokens);
          break;
        case 'Google Gemini':
          response = await handleGemini(apiKey, model || 'gemini-1.5-flash', messages, temperature, max_tokens);
          break;
        case 'Mistral':
          response = await handleMistral(apiKey, model || 'mistral-small-latest', messages, temperature, max_tokens);
          break;
        case 'OpenRouter':
          response = await handleOpenRouter(apiKey, model || 'anthropic/claude-3.5-sonnet', messages, temperature, max_tokens);
          break;
        default:
          console.error(`[ai-chat] Unsupported provider: ${provider}`);
          throw new Error(`Unsupported AI provider: ${provider}`);
      }
    } catch (providerError) {
      // Pass through downstream provider errors
      console.error('[ai-chat] Error calling AI provider API:', providerError);
      throw new Error(
        `Failed to fetch response from ${provider}: ${providerError instanceof Error ? providerError.message : String(providerError)}`
      );
    }

    // 7. All good, return
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // Main error handler
    const errMsg = (error && typeof error === "object" && "message" in error) ? (error as Error).message : String(error);
    console.error('[ai-chat] Error:', errMsg);

    // Respond with error, 400 for user mistakes, 500 otherwise
    // If error message hints at "Please add your API key", consider it a 400
    const status = errMsg && errMsg.includes("add your API key") ? 400 : 500;

    return new Response(JSON.stringify({ error: errMsg }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleOpenAI(apiKey: string, model: string, messages: ChatMessage[], temperature: number, max_tokens: number): Promise<NormalizedResponse> {
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
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  
  return {
    content: data.choices[0].message.content,
    usage: data.usage,
    model: data.model,
    provider: 'OpenAI'
  };
}

async function handleAnthropic(apiKey: string, model: string, messages: ChatMessage[], temperature: number, max_tokens: number): Promise<NormalizedResponse> {
  // Convert messages format for Anthropic
  const systemMessage = messages.find(m => m.role === 'system');
  const conversationMessages = messages.filter(m => m.role !== 'system');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens,
      temperature,
      system: systemMessage?.content,
      messages: conversationMessages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  
  return {
    content: data.content[0].text,
    usage: {
      prompt_tokens: data.usage.input_tokens,
      completion_tokens: data.usage.output_tokens,
      total_tokens: data.usage.input_tokens + data.usage.output_tokens
    },
    model: data.model,
    provider: 'Anthropic'
  };
}

async function handleGemini(apiKey: string, model: string, messages: ChatMessage[], temperature: number, max_tokens: number): Promise<NormalizedResponse> {
  // Convert messages format for Gemini
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
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  
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

async function handleMistral(apiKey: string, model: string, messages: ChatMessage[], temperature: number, max_tokens: number): Promise<NormalizedResponse> {
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
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
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Mistral API error: ${error}`);
  }

  const data = await response.json();
  
  return {
    content: data.choices[0].message.content,
    usage: data.usage,
    model: data.model,
    provider: 'Mistral'
  };
}

async function handleOpenRouter(apiKey: string, model: string, messages: ChatMessage[], temperature: number, max_tokens: number): Promise<NormalizedResponse> {
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
