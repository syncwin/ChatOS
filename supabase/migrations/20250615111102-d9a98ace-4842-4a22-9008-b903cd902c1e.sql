
-- Create a table for public user profiles
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  updated_at TIMESTAMPTZ
);

-- Set up Row Level Security (RLS) for the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone."
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- This trigger automatically creates a profile for new users.
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create an enum type for the supported API providers
CREATE TYPE public.api_provider AS ENUM ('OpenAI', 'Anthropic', 'Google Gemini', 'Mistral', 'OpenRouter');

-- Create the table to store encrypted API keys
CREATE TABLE public.api_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  provider api_provider NOT NULL,
  encrypted_api_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Set up Row Level Security (RLS) for the api_keys table
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Define RLS policies for the api_keys table
CREATE POLICY "Users can insert their own API keys."
ON public.api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys."
ON public.api_keys FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys."
ON public.api_keys FOR DELETE USING (auth.uid() = user_id);

-- Note: No SELECT policy is created for users. This prevents API keys from being read from the client.
-- Only backend processes with the service_role key can access them.

