import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../ai-chat/_shared/cors.ts';
import { getApiKey } from '../ai-chat/auth/apiKeyHandler.ts';
import { getAvailableGeminiModels } from '../ai-chat/providers/gemini.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, guestApiKey } = await req.json();
    const apiKey = await getApiKey(req, guestApiKey, provider);

    let models: string[] = [];

    switch (provider) {
      case 'Google Gemini':
        models = await getAvailableGeminiModels(apiKey);
        break;
      // Add cases for other providers here
      default:
        return new Response(JSON.stringify({ error: 'Provider not supported for model fetching' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ models }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});