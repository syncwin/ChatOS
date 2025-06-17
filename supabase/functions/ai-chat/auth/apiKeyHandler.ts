
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

export interface ApiKeyDetails {
  apiKey: string;
  endpointUrl?: string;
  deploymentId?: string;
}

async function getApiKeyForUser(authHeader: string, provider: string): Promise<ApiKeyDetails> {
    console.log('[ai-chat] Getting API key for authenticated user');
    
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    
    const token = authHeader.replace('Bearer ', '');

    const { data: { user }, error: userError } = await userClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error('[ai-chat] Failed to get user from session:', userError);
      throw new Error('Authentication failed. Please sign in again.');
    }

    console.log(`[ai-chat] Getting API key for user ${user.id} and provider ${provider}`);

    const { data: apiKeyData, error: apiKeyError } = await serviceClient
      .from('api_keys')
      .select('api_key, endpoint_url, deployment_id')
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

    console.log('[ai-chat] Successfully retrieved API key details for authenticated user');
    return {
      apiKey: apiKeyData.api_key,
      endpointUrl: apiKeyData.endpoint_url,
      deploymentId: apiKeyData.deployment_id,
    };
}

export async function getApiKey(req: Request, guestApiKey: string | undefined, provider: string): Promise<ApiKeyDetails> {
  let apiKeyDetails: ApiKeyDetails | undefined;
  const authHeader = req.headers.get('Authorization');
  
  if (guestApiKey) {
    apiKeyDetails = { apiKey: guestApiKey };
    console.log(`[ai-chat] Using guest API key for provider: ${provider}`);
  } else if (authHeader) {
    apiKeyDetails = await getApiKeyForUser(authHeader, provider);
  } else {
    console.error('[ai-chat] No authentication found (no user session or API key)');
    throw new Error('You must be logged in or provide an API key to chat.');
  }

  if (!apiKeyDetails || !apiKeyDetails.apiKey) {
    console.error('[ai-chat] No API key available after all checks');
    throw new Error('Could not retrieve API key for the selected provider.');
  }
  
  return apiKeyDetails;
}
