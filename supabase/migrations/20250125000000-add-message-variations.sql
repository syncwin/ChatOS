-- Add support for message variations (rewrites)
-- This allows storing multiple versions of assistant responses for the same user input

ALTER TABLE public.chat_messages 
ADD COLUMN parent_message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
ADD COLUMN variation_index INTEGER DEFAULT 0,
ADD COLUMN is_active_variation BOOLEAN DEFAULT true;

-- Add index for performance when querying variations
CREATE INDEX idx_chat_messages_parent_id ON public.chat_messages(parent_message_id);
CREATE INDEX idx_chat_messages_variation ON public.chat_messages(parent_message_id, variation_index);

-- Add a constraint to ensure only one active variation per parent message
CREATE UNIQUE INDEX idx_chat_messages_active_variation 
ON public.chat_messages(parent_message_id) 
WHERE is_active_variation = true AND parent_message_id IS NOT NULL;

-- Function to create a new message variation
CREATE OR REPLACE FUNCTION public.create_message_variation(
  p_parent_message_id UUID,
  p_content TEXT,
  p_model TEXT DEFAULT NULL,
  p_provider TEXT DEFAULT NULL,
  p_usage JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_chat_id UUID;
  v_user_id UUID;
  v_next_variation_index INTEGER;
  v_new_message_id UUID;
BEGIN
  -- Get chat_id and user_id from parent message
  SELECT chat_id, user_id INTO v_chat_id, v_user_id
  FROM public.chat_messages
  WHERE id = p_parent_message_id;
  
  IF v_chat_id IS NULL THEN
    RAISE EXCEPTION 'Parent message not found';
  END IF;
  
  -- Check if this is the first variation (no existing variations)
  SELECT COUNT(*) INTO v_next_variation_index
  FROM public.chat_messages
  WHERE parent_message_id = p_parent_message_id;
  
  -- If this is the first variation, convert the original message to variation 0
  IF v_next_variation_index = 0 THEN
    UPDATE public.chat_messages
    SET parent_message_id = p_parent_message_id,
        variation_index = 0,
        is_active_variation = false
    WHERE id = p_parent_message_id;
    
    v_next_variation_index := 1;
  ELSE
    -- Get the next variation index
    SELECT COALESCE(MAX(variation_index), 0) + 1 INTO v_next_variation_index
    FROM public.chat_messages
    WHERE parent_message_id = p_parent_message_id;
  END IF;
  
  -- Set all existing variations as inactive
  UPDATE public.chat_messages
  SET is_active_variation = false
  WHERE parent_message_id = p_parent_message_id;
  
  -- Create new variation
  INSERT INTO public.chat_messages (
    chat_id,
    user_id,
    role,
    content,
    model,
    provider,
    usage,
    parent_message_id,
    variation_index,
    is_active_variation
  ) VALUES (
    v_chat_id,
    v_user_id,
    'assistant',
    p_content,
    p_model,
    p_provider,
    p_usage,
    p_parent_message_id,
    v_next_variation_index,
    true
  ) RETURNING id INTO v_new_message_id;
  
  RETURN v_new_message_id;
END;
$$;

-- Function to switch active variation
CREATE OR REPLACE FUNCTION public.set_active_variation(
  p_parent_message_id UUID,
  p_variation_index INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set all variations as inactive
  UPDATE public.chat_messages
  SET is_active_variation = false
  WHERE parent_message_id = p_parent_message_id;
  
  -- Set the specified variation as active
  UPDATE public.chat_messages
  SET is_active_variation = true
  WHERE parent_message_id = p_parent_message_id
    AND variation_index = p_variation_index;
  
  -- Return true if a row was updated
  RETURN FOUND;
END;
$$;

-- Function to get all variations for a message
CREATE OR REPLACE FUNCTION public.get_message_variations(p_parent_message_id UUID)
RETURNS TABLE (
  id UUID,
  content TEXT,
  model TEXT,
  provider TEXT,
  usage JSONB,
  variation_index INTEGER,
  is_active_variation BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.id,
    cm.content,
    cm.model,
    cm.provider,
    cm.usage,
    cm.variation_index,
    cm.is_active_variation,
    cm.created_at
  FROM public.chat_messages cm
  WHERE cm.parent_message_id = p_parent_message_id
  ORDER BY cm.variation_index;
END;
$$;

-- Add RLS policies for the new functionality
CREATE POLICY "Users can view variations of their own messages"
  ON public.chat_messages
  FOR SELECT
  USING (
    auth.uid() = user_id AND 
    (parent_message_id IS NULL OR 
     EXISTS (SELECT 1 FROM public.chat_messages pm WHERE pm.id = parent_message_id AND pm.user_id = auth.uid()))
  );

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION public.create_message_variation TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_active_variation TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_message_variations TO authenticated;