
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
  stream?: boolean;
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

const createOpenAINormalizer = () => {
  const decoder = new TextDecoder();
  let buffer = '';
  return new TransformStream({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.substring(6).trim();
          if (jsonStr === '[DONE]') {
            controller.terminate();
            return;
          }
          try {
            const data = JSON.parse(jsonStr);
            const content = data.choices?.[0]?.delta?.content;
            if (content) {
              controller.enqueue(new TextEncoder().encode(content));
            }
          } catch (e) {
            // Ignore parsing errors for now
          }
        }
      }
    },
  });
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
      apiKey: guestApiKey,
      stream = false
    } = await req.json() as ChatRequest;

    console.log(`[ai-chat] Provider: ${provider} | Model: ${model} | Guest?: ${!!guestApiKey} | Stream?: ${stream}`);

    let apiKey: string | undefined;

    // Get authorization header for authenticated users
    const authHeader = req.headers.get('Authorization');
    
    if (guestApiKey) {
      // Guest user path - use provided API key
      apiKey = guestApiKey;
      console.log(`[ai-chat] Using guest API key for provider: ${provider}`);
    } else if (authHeader) {
      // Authenticated user path - get API key from database
      console.log('[ai-chat] Getting API key for authenticated user');
      
      // Create service client for database operations
      const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      // Create a stateless user client to get user info from token
      const userClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      
      const token = authHeader.replace('Bearer ', '');

      // Get user ID from the provided token
      const { data: { user }, error: userError } = await userClient.auth.getUser(token);
      
      if (userError || !user) {
        console.error('[ai-chat] Failed to get user from session:', userError);
        throw new Error('Authentication failed. Please sign in again.');
      }

      console.log(`[ai-chat] Getting API key for user ${user.id} and provider ${provider}`);

      // Query for API key using service client
      const { data: apiKeyData, error: apiKeyError } = await serviceClient
        .from('api_keys')
        .select('api_key')
        .eq('provider', provider)
        .eq('user_id', user.id)
        .maybeSingle();

      if (apiKeyError) {
        console.error(`[ai-chat] Database error getting API key:`, apiKeyError);
        throw new Error(`Failed to retrieve API key for ${provider}. Please try again.`);
      }

      if (!apiKeyData || !apiKeyData.api_key) {
        console.warn(`[ai-chat] No API key found for user ${user.id} and provider ${provider}`);
        throw new Error(`No API key found for ${provider}. Please add your API key for this provider in the Settings page.`);
      }

      apiKey = apiKeyData.api_key;
      console.log('[ai-chat] Successfully retrieved API key for authenticated user');
    } else {
      console.error('[ai-chat] No authentication found (no user session or API key)');
      throw new Error('You must be logged in or provide an API key to chat.');
    }

    if (!apiKey) {
      console.error('[ai-chat] No API key available after all checks');
      throw new Error('Could not retrieve API key for the selected provider.');
    }

    // Handle streaming case for supported providers
    if (stream) {
      if (provider === 'OpenAI') {
        const streamResponse = await handleOpenAI(apiKey, model || 'gpt-4o-mini', messages, temperature, max_tokens, true);
        if (streamResponse instanceof ReadableStream) {
          const normalizedStream = streamResponse.pipeThrough(createOpenAINormalizer());
          return new Response(normalizedStream, {
            headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' },
          });
        }
      } else {
        return new Response(JSON.stringify({ error: `Streaming is not supported for ${provider} yet.` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Handle non-streaming requests
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
      console.error('[ai-chat] Error calling AI provider:', providerError);
      throw new Error(
        `Failed to get response from ${provider}: ${providerError instanceof Error ? providerError.message : String(providerError)}`
      );
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errMsg = (error && typeof error === "object" && "message" in error) ? (error as Error).message : String(error);
    console.error('[ai-chat] Error:', errMsg);

    const status = errMsg && errMsg.includes("add your API key") ? 400 : 500;

    return new Response(JSON.stringify({ error: errMsg }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleOpenAI(apiKey: string, model: string, messages: ChatMessage[], temperature: number, max_tokens: number, stream: boolean = false): Promise<NormalizedResponse | ReadableStream> {
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
