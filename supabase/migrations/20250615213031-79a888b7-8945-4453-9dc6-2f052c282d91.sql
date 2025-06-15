
-- Create a table for tags
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

COMMENT ON TABLE public.tags IS 'Stores user-created tags for labeling chats.';
COMMENT ON COLUMN public.tags.name IS 'The name of the tag.';
COMMENT ON COLUMN public.tags.color IS 'A color associated with the tag for UI display.';

-- Add Row Level Security (RLS) for the tags table
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tags"
  ON public.tags FOR ALL
  USING (auth.uid() = user_id);

-- Create a join table for chats and tags (many-to-many relationship)
CREATE TABLE public.chat_tags (
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  PRIMARY KEY (chat_id, tag_id)
);

COMMENT ON TABLE public.chat_tags IS 'Join table to associate multiple tags with multiple chats.';

-- Add Row Level Security (RLS) for the chat_tags join table
ALTER TABLE public.chat_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own chat-tag associations"
  ON public.chat_tags FOR ALL
  USING (auth.uid() = user_id);

-- Function to ensure user_id in chat_tags is consistent
CREATE OR REPLACE FUNCTION public.sync_chat_tags_user_id()
RETURNS TRIGGER AS $$
DECLARE
    chat_user_id UUID;
    tag_user_id UUID;
BEGIN
    SELECT user_id INTO chat_user_id FROM public.chats WHERE id = NEW.chat_id;
    SELECT user_id INTO tag_user_id FROM public.tags WHERE id = NEW.tag_id;

    IF NEW.user_id <> auth.uid() OR chat_user_id <> auth.uid() OR tag_user_id <> auth.uid() THEN
        RAISE EXCEPTION 'User ID mismatch or unauthorized operation in chat_tags.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set and verify the user_id on insert
CREATE TRIGGER trigger_set_chat_tags_user_id
BEFORE INSERT ON public.chat_tags
FOR EACH ROW EXECUTE FUNCTION public.sync_chat_tags_user_id();

-- Add a foreign key constraint to the user_id in chat_tags
-- This was deferred to add the trigger first
ALTER TABLE public.chat_tags 
ADD CONSTRAINT fk_user 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

