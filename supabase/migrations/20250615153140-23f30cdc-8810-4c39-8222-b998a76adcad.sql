
ALTER TABLE public.chats
ADD COLUMN is_pinned boolean DEFAULT false NOT NULL;
