
-- Add model_selection column to profiles table to store user's preferred AI model
ALTER TABLE public.profiles 
ADD COLUMN model_selection JSONB;

-- Add a comment to describe the column
COMMENT ON COLUMN public.profiles.model_selection IS 'Stores user selected AI model provider and model ID as JSON';
