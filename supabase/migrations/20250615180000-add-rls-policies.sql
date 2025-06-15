
-- Enable RLS on all chat-related tables
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- RLS policies for chats table
CREATE POLICY "Users can view their own chats" 
  ON public.chats 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chats" 
  ON public.chats 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chats" 
  ON public.chats 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chats" 
  ON public.chats 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS policies for chat_messages table
CREATE POLICY "Users can view their own chat messages" 
  ON public.chat_messages 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat messages" 
  ON public.chat_messages 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat messages" 
  ON public.chat_messages 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages" 
  ON public.chat_messages 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS policies for api_keys table
CREATE POLICY "Users can view their own API keys" 
  ON public.api_keys 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API keys" 
  ON public.api_keys 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys" 
  ON public.api_keys 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys" 
  ON public.api_keys 
  FOR DELETE 
  USING (auth.uid() = user_id);
