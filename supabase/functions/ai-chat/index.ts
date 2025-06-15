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

    console.log(`Processing request for provider: ${provider}`);
    
    let apiKey: string;
    const supabaseClient = getSupabaseClient(req);
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError) {
      console.error('Error getting user:', userError);
    }

    console.log('User authentication status:', user ? 'authenticated' : 'not authenticated');
    console.log('Guest API key provided:', !!guestApiKey);

    if (user) {
      // Authenticated user path
      console.log('Fetching API key for authenticated user:', user.id);
      
      // Use the service role key to bypass RLS and read the API key.
      // This is safe because this is a trusted server-side environment.
      const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      const { data: apiKeyData, error: apiKeyError } = await serviceClient
        .from('api_keys')
        .select('api_key')
        .eq('provider', provider)
        .eq('user_id', user.id)
        .single();

      console.log('API key query result:', { data: !!apiKeyData, error: apiKeyError });

      if (apiKeyError) {
        console.error('API key error for user:', user.id, apiKeyError);
        if (apiKeyError.code === 'PGRST116') {
          throw new Error(`No API key found for provider: ${provider}. Please add your API key in the settings.`);
        }
        throw new Error(`Failed to fetch API key: ${apiKeyError.message}`);
      }
      
      if (!apiKeyData) {
        throw new Error(`No API key found for provider: ${provider}. Please add your API key in the settings.`);
      }
      
      apiKey = apiKeyData.api_key;
      console.log('Successfully retrieved API key for user');
    } else if (guestApiKey) {
      // Guest user path
      console.log('Using guest API key');
      apiKey = guestApiKey;
    } else {
      console.error('Authentication failed: No user session and no guest API key provided');
      throw new Error('Authentication error: Please sign in or provide an API key to use this feature.');
    }
    
    console.log(`Sending request to ${provider} with model: ${model || 'default'}`);
    let response: NormalizedResponse;

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
        throw new Error(`Unsupported provider: ${provider}`);
    }

    console.log(`Successfully processed request for ${provider}`);
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred' 
    }), {
      status: 500,
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
