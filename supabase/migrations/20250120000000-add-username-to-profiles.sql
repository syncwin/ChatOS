-- Add username column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN username TEXT UNIQUE;

-- Add a comment to describe the column
COMMENT ON COLUMN public.profiles.username IS 'Unique username for the user, used in chat exports and display';

-- Create an index on username for better performance
CREATE INDEX idx_profiles_username ON public.profiles(username);