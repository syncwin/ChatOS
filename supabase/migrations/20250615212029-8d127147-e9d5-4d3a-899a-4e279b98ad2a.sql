
-- Create a table for folders
CREATE TABLE public.folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add comments for clarity
COMMENT ON TABLE public.folders IS 'Stores user-created folders for organizing chats.';
COMMENT ON COLUMN public.folders.name IS 'The name of the folder.';

-- Add Row Level Security (RLS) to the folders table
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own folders
CREATE POLICY "Users can view their own folders"
  ON public.folders FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own folders
CREATE POLICY "Users can insert their own folders"
  ON public.folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own folders
CREATE POLICY "Users can update their own folders"
  ON public.folders FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own folders
CREATE POLICY "Users can delete their own folders"
  ON public.folders FOR DELETE
  USING (auth.uid() = user_id);

-- Add a folder_id column to the chats table to link a chat to a folder
ALTER TABLE public.chats
ADD COLUMN folder_id UUID NULL,
ADD CONSTRAINT fk_folder FOREIGN KEY (folder_id) REFERENCES public.folders(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.chats.folder_id IS 'Foreign key to the folder this chat belongs to.';
