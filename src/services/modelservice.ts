import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ejjmwhkjnkxtmzvpqnig.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqam13aGtqbmt4dG16dnBxbmlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5ODUyNDYsImV4cCI6MjA2NTU2MTI0Nn0.EiOR2sXfGi_YnUcm_hEsyG0yRF6vqhWGH3KFrV0stl8';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing required Supabase environment variables for model service.');
}

export async function getAvailableModels(provider: string, guestApiKey?: string): Promise<string[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
  };
  
  // Always provide Authorization header - use user token if available, otherwise use anon key
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/get-models`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ provider, guestApiKey }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch available models');
  }

  const { models } = await response.json();
  return models;
}