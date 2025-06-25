import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { 
  chatTitleSchema, 
  folderNameSchema, 
  tagNameSchema, 
  messageContentSchema, 
  profileNameSchema, 
  profileWebsiteSchema, 
  validateInput, 
  sanitizeHtml 
} from '@/lib/validation';
import { secureGuestStorage } from '@/lib/secureStorage';
import type { Database, Json } from '@/integrations/supabase/types';

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens?: number;
}

interface ProfileUpdates {
  nickname?: string;
  avatar_url?: string;
  theme?: 'light' | 'dark';
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  theme?: 'light' | 'dark';
}

export interface Chat {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  folder_id: string | null;
}

export interface Message {
  id: string;
  chat_id: string;
  user_id: string;
  created_at: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  model?: string;
  usage: Usage;
  error?: string;
  isStreaming?: boolean;
}

export interface NewMessage {
  chat_id: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  model?: string;
  usage?: Usage;
}

export interface Folder {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
}

export const getProfile = async (): Promise<UserProfile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select(`id, nickname, avatar_url, theme`)
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    email: user.email || '',
    name: profile.nickname || undefined,
    avatar_url: profile.avatar_url || undefined,
    theme: profile.theme as 'light' | 'dark' || 'dark'
  };
};

export const updateProfile = async (updates: { name?: string; avatar_url?: string; theme?: 'light' | 'dark' }) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Validate inputs
  if (updates.name !== undefined) {
    const validation = validateInput(profileNameSchema, updates.name);
    if (!validation.success) {
      throw new Error(validation.error || 'Invalid name');
    }
    updates.name = validation.data;
  }

  const profileUpdates: ProfileUpdates = {};
  if (updates.name !== undefined) profileUpdates.nickname = updates.name;
  if (updates.avatar_url !== undefined) profileUpdates.avatar_url = updates.avatar_url;
  if (updates.theme !== undefined) profileUpdates.theme = updates.theme;

  const { error } = await supabase.from('profiles').update(profileUpdates).eq('id', user.id);

  if (error) {
    throw error;
  }
};

export const getChats = async (): Promise<Chat[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('chats')
    .select(`id, title, user_id, created_at, updated_at, is_pinned, folder_id`)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getMessages = async (chatId: string): Promise<Message[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('chat_messages')
    .select(`id, chat_id, user_id, created_at, role, content, provider, model, usage`)
    .eq('chat_id', chatId)
    .is('parent_message_id', null) // Only load main messages, not variations
    .order('created_at', { ascending: true });

  if (error) throw error;
  
  // Transform the data to ensure proper typing
  return (data || []).map(msg => ({
    ...msg,
    usage: (msg.usage as unknown as Usage) || { prompt_tokens: 0, completion_tokens: 0 }
  }));
};

export const createChat = async (title: string): Promise<Chat> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Validate and sanitize title
  const validation = validateInput(chatTitleSchema, title);
  if (!validation.success) {
    throw new Error(validation.error || 'Invalid chat title');
  }
  const sanitizedTitle = sanitizeHtml(validation.data);

  const newChatId = uuidv4();

  const { error } = await supabase.from('chats').insert([
    {
      id: newChatId,
      title: sanitizedTitle,
      user_id: user.id,
    },
  ]);

  if (error) throw error;

  return {
    id: newChatId,
    title: sanitizedTitle,
    user_id: user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_pinned: false,
    folder_id: null,
  };
};

// Alias for addMessage to match useRewrite.ts import
export const saveMessage = async (message: NewMessage): Promise<Message> => {
  return addMessage(message);
};

export const addMessage = async (message: NewMessage): Promise<Message> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Validate and sanitize message content
  const validation = validateInput(messageContentSchema, message.content);
  if (!validation.success) {
    throw new Error(validation.error || 'Invalid message content');
  }
  const sanitizedContent = sanitizeHtml(validation.data);

  const newMessageId = uuidv4();
  const newMessage: Message = {
    id: newMessageId,
    chat_id: message.chat_id,
    user_id: user.id,
    created_at: new Date().toISOString(),
    role: message.role,
    content: sanitizedContent,
    provider: message.provider,
    model: message.model,
    usage: message.usage || { prompt_tokens: 0, completion_tokens: 0 },
  };

  try {
    const { error } = await supabase.from('chat_messages').insert({
      id: newMessageId,
      chat_id: message.chat_id,
      user_id: user.id,
      role: message.role,
      content: sanitizedContent,
      provider: message.provider,
      model: message.model,
      usage: message.usage as unknown as Json,
    });

    if (error) throw error;

    // Update the chat's updated_at timestamp
    await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', message.chat_id);

    return newMessage;
  } catch (error) {
    console.warn('Failed to save message to Supabase, using localStorage fallback:', error);
    
    // Fallback to localStorage
    try {
      const pendingMessages = JSON.parse(localStorage.getItem('pending_messages') || '[]');
      pendingMessages.push({
        ...newMessage,
        _pending: true,
        _timestamp: Date.now()
      });
      localStorage.setItem('pending_messages', JSON.stringify(pendingMessages));
      
      // Also save to local messages cache
      const localMessages = JSON.parse(localStorage.getItem(`messages_${message.chat_id}`) || '[]');
      localMessages.push(newMessage);
      localStorage.setItem(`messages_${message.chat_id}`, JSON.stringify(localMessages));
      
      return newMessage;
    } catch (storageError) {
      console.error('Failed to save to localStorage:', storageError);
      throw error; // Re-throw original error
    }
  }
};

export const updateChatTitle = async (chatId: string, title: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Validate and sanitize title
  const validation = validateInput(chatTitleSchema, title);
  if (!validation.success) {
    throw new Error(validation.error || 'Invalid chat title');
  }
  const sanitizedTitle = sanitizeHtml(validation.data);

  const { error } = await supabase
    .from('chats')
    .update({ title: sanitizedTitle })
    .eq('id', chatId)
    .eq('user_id', user.id);

  if (error) throw error;
};

export const updateMessage = async (messageId: string, updates: { content?: string; error?: string }): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Validate and sanitize content if provided
  const updateData: any = {};
  if (updates.content !== undefined) {
    const validation = validateInput(messageContentSchema, updates.content);
    if (!validation.success) {
      throw new Error(validation.error || 'Invalid message content');
    }
    updateData.content = sanitizeHtml(validation.data);
  }
  if (updates.error !== undefined) {
    updateData.error = updates.error;
  }

  try {
    const { error } = await supabase
      .from('chat_messages')
      .update(updateData)
      .eq('id', messageId)
      .eq('user_id', user.id);

    if (error) throw error;
  } catch (error) {
    console.warn('Failed to update message in Supabase, using localStorage fallback:', error);
    
    // Fallback to localStorage
    try {
      const pendingUpdates = JSON.parse(localStorage.getItem('pending_updates') || '[]');
      pendingUpdates.push({
        messageId,
        updates: updateData,
        _timestamp: Date.now(),
        userId: user.id
      });
      localStorage.setItem('pending_updates', JSON.stringify(pendingUpdates));
      
      // Also update local messages cache if it exists
      const chatId = await getChatIdForMessage(messageId);
      if (chatId) {
        const localMessages = JSON.parse(localStorage.getItem(`messages_${chatId}`) || '[]');
        const messageIndex = localMessages.findIndex((msg: any) => msg.id === messageId);
        if (messageIndex !== -1) {
          localMessages[messageIndex] = { ...localMessages[messageIndex], ...updateData };
          localStorage.setItem(`messages_${chatId}`, JSON.stringify(localMessages));
        }
      }
    } catch (storageError) {
      console.error('Failed to save update to localStorage:', storageError);
      throw error; // Re-throw original error
    }
  }
};

// Helper function to get chat ID for a message
const getChatIdForMessage = async (messageId: string): Promise<string | null> => {
  try {
    // First try to find in localStorage caches
    const allKeys = Object.keys(localStorage);
    for (const key of allKeys) {
      if (key.startsWith('messages_')) {
        const messages = JSON.parse(localStorage.getItem(key) || '[]');
        const message = messages.find((msg: any) => msg.id === messageId);
        if (message) {
          return message.chat_id;
        }
      }
    }
    
    // Fallback to Supabase query
    const { data, error } = await supabase
      .from('chat_messages')
      .select('chat_id')
      .eq('id', messageId)
      .single();
    
    if (error) throw error;
    return data?.chat_id || null;
  } catch (error) {
    console.warn('Failed to get chat ID for message:', error);
    return null;
  }
};

// Function to sync pending messages and updates when connection is restored
export const syncPendingData = async (): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Sync pending messages
    const pendingMessages = JSON.parse(localStorage.getItem('pending_messages') || '[]');
    for (const pendingMessage of pendingMessages) {
      if (pendingMessage._pending && pendingMessage.user_id === user.id) {
        try {
          const { error } = await supabase.from('chat_messages').insert({
            id: pendingMessage.id,
            chat_id: pendingMessage.chat_id,
            user_id: pendingMessage.user_id,
            role: pendingMessage.role,
            content: pendingMessage.content,
            provider: pendingMessage.provider,
            model: pendingMessage.model,
            usage: pendingMessage.usage as unknown as Json,
          });
          
          if (!error) {
            // Remove from pending list
            const updatedPending = pendingMessages.filter((msg: any) => msg.id !== pendingMessage.id);
            localStorage.setItem('pending_messages', JSON.stringify(updatedPending));
          }
        } catch (syncError) {
          console.warn('Failed to sync pending message:', syncError);
        }
      }
    }

    // Sync pending updates
    const pendingUpdates = JSON.parse(localStorage.getItem('pending_updates') || '[]');
    for (const pendingUpdate of pendingUpdates) {
      if (pendingUpdate.userId === user.id) {
        try {
          const { error } = await supabase
            .from('chat_messages')
            .update(pendingUpdate.updates)
            .eq('id', pendingUpdate.messageId)
            .eq('user_id', user.id);
          
          if (!error) {
            // Remove from pending list
            const updatedPending = pendingUpdates.filter((update: any) => 
              !(update.messageId === pendingUpdate.messageId && update._timestamp === pendingUpdate._timestamp)
            );
            localStorage.setItem('pending_updates', JSON.stringify(updatedPending));
          }
        } catch (syncError) {
          console.warn('Failed to sync pending update:', syncError);
        }
      }
    }
  } catch (error) {
    console.warn('Failed to sync pending data:', error);
  }
};

export const deleteMessage = async (messageId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('id', messageId)
    .eq('user_id', user.id);

  if (error) throw error;
};

export const deleteMessagePair = async (messageIds: string[]): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .in('id', messageIds)
    .eq('user_id', user.id);

  if (error) throw error;
};

export const deleteChat = async (chatId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase.from('chats').delete().eq('id', chatId).eq('user_id', user.id);

  if (error) throw error;
};

export const updateChatPinStatus = async (chatId: string, is_pinned: boolean): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('chats')
    .update({ is_pinned })
    .eq('id', chatId)
    .eq('user_id', user.id);

  if (error) throw error;
};

export const getFolders = async (): Promise<Folder[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('folders')
    .select(`id, name, user_id, created_at`)
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const createFolder = async (name: string): Promise<Folder> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Validate and sanitize folder name
  const validation = validateInput(folderNameSchema, name);
  if (!validation.success) {
    throw new Error(validation.error || 'Invalid folder name');
  }
  const sanitizedName = sanitizeHtml(validation.data);

  const newFolderId = uuidv4();

  const { error } = await supabase.from('folders').insert([
    {
      id: newFolderId,
      name: sanitizedName,
      user_id: user.id,
    },
  ]);

  if (error) throw error;

  return {
    id: newFolderId,
    name: sanitizedName,
    user_id: user.id,
    created_at: new Date().toISOString(),
  };
};

export const updateFolder = async (folderId: string, name: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Validate and sanitize folder name
  const validation = validateInput(folderNameSchema, name);
  if (!validation.success) {
    throw new Error(validation.error || 'Invalid folder name');
  }
  const sanitizedName = sanitizeHtml(validation.data);

  const { error } = await supabase
    .from('folders')
    .update({ name: sanitizedName })
    .eq('id', folderId)
    .eq('user_id', user.id);

  if (error) throw error;
};

export const deleteFolder = async (folderId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase.from('folders').delete().eq('id', folderId).eq('user_id', user.id);

  if (error) throw error;

  // Also set all chats in this folder to folder_id = null
  await supabase
    .from('chats')
    .update({ folder_id: null })
    .eq('folder_id', folderId)
    .eq('user_id', user.id);
};

export const assignChatToFolder = async (chatId: string, folderId: string | null): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('chats')
    .update({ folder_id: folderId })
    .eq('id', chatId)
    .eq('user_id', user.id);

  if (error) throw error;
};

export const getTags = async (): Promise<Tag[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('tags')
    .select(`id, name, color, user_id, created_at`)
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const createTag = async (name: string, color?: string): Promise<Tag> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Validate and sanitize tag name
  const validation = validateInput(tagNameSchema, name);
  if (!validation.success) {
    throw new Error(validation.error || 'Invalid tag name');
  }
  const sanitizedName = sanitizeHtml(validation.data);

  const newTagId = uuidv4();

  const { error } = await supabase.from('tags').insert([
    {
      id: newTagId,
      name: sanitizedName,
      color: color,
      user_id: user.id,
    },
  ]);

  if (error) throw error;

  return {
    id: newTagId,
    name: sanitizedName,
    color: color,
    user_id: user.id,
    created_at: new Date().toISOString(),
  };
};

export const updateTag = async (tagId: string, name: string, color?: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Validate and sanitize tag name
  const validation = validateInput(tagNameSchema, name);
  if (!validation.success) {
    throw new Error(validation.error || 'Invalid tag name');
  }
  const sanitizedName = sanitizeHtml(validation.data);

  const { error } = await supabase
    .from('tags')
    .update({ name: sanitizedName, color })
    .eq('id', tagId)
    .eq('user_id', user.id);

  if (error) throw error;
};

export const deleteTag = async (tagId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase.from('tags').delete().eq('id', tagId).eq('user_id', user.id);

  if (error) throw error;

  // Also remove all chat_tags with this tag_id
  await supabase
    .from('chat_tags')
    .delete()
    .eq('tag_id', tagId)
    .eq('user_id', user.id);
};

export const assignTagToChat = async (chatId: string, tagId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Check if the tag assignment already exists
  const { data: existing } = await supabase
    .from('chat_tags')
    .select('*')
    .eq('chat_id', chatId)
    .eq('tag_id', tagId)
    .single();

  if (!existing) {
    const { error } = await supabase
      .from('chat_tags')
      .insert([{
        chat_id: chatId,
        tag_id: tagId,
        user_id: user.id
      }]);

    if (error) throw error;
  }
};

export const removeTagFromChat = async (chatId: string, tagId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('chat_tags')
    .delete()
    .eq('chat_id', chatId)
    .eq('tag_id', tagId)
    .eq('user_id', user.id);

  if (error) throw error;
};

export const getChatTags = async (chatId: string): Promise<Tag[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('chat_tags')
    .select(`
      tags!inner (
        id,
        name,
        color,
        user_id,
        created_at
      )
    `)
    .eq('chat_id', chatId)
    .eq('user_id', user.id);

  if (error) throw error;
  return data?.map(item => item.tags) || [];
};

// Security utility functions for guest storage
export const storeGuestApiKey = async (provider: string, apiKey: string): Promise<void> => {
  await secureGuestStorage.storeApiKey(provider, apiKey);
};

export const getGuestApiKey = async (provider: string): Promise<string | null> => {
  return await secureGuestStorage.getApiKey(provider);
};

export const removeGuestApiKey = (provider: string): void => {
  secureGuestStorage.removeApiKey(provider);
};

export const getGuestSecurityWarning = (): string => {
  return secureGuestStorage.getSecurityWarning();
};

/**
 * Get API key for authenticated user from database
 */
export const getAuthenticatedUserApiKey = async (provider: string, userId: string): Promise<string | null> => {
  try {
    // Type guard for provider
    const validProviders = ["OpenAI", "Anthropic", "Google Gemini", "Mistral", "OpenRouter"];
    if (!validProviders.includes(provider)) {
      console.error(`Invalid provider: ${provider}`);
      return null;
    }

    const { data, error } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('provider', provider as Database['public']['Enums']['api_provider'])
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error(`Failed to get API key for ${provider}:`, error);
      return null;
    }

    return data?.api_key || null;
  } catch (error) {
    console.error(`Error fetching API key for ${provider}:`, error);
    return null;
  }
};

// Message Variation Functions
export interface MessageVariation {
  id: string;
  content: string;
  model?: string;
  provider?: string;
  usage?: Usage;
  variation_index: number;
  is_active_variation: boolean;
  created_at: string;
}

/**
 * Create a new variation of an assistant message
 */
export const createMessageVariation = async (
  parentMessageId: string,
  content: string,
  model?: string,
  provider?: string,
  usage?: Usage
): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Validate required parameters
  if (!parentMessageId || !content) {
    console.error('createMessageVariation: Missing required parameters', {
      parentMessageId: !!parentMessageId,
      content: !!content
    });
    throw new Error('Parent message ID and content are required');
  }

  // Verify parent message exists before creating variation
  const { data: parentMessage, error: parentError } = await supabase
    .from('chat_messages')
    .select('id')
    .eq('id', parentMessageId)
    .eq('user_id', user.id)
    .single();

  if (parentError || !parentMessage) {
    console.error('createMessageVariation: Parent message not found', {
      parentMessageId,
      parentError: parentError?.message,
      userId: user.id
    });
    throw new Error(`Parent message not found: ${parentMessageId}`);
  }

  try {
    const { data, error } = await supabase.rpc('create_message_variation', {
      p_parent_message_id: parentMessageId,
      p_content: content,
      p_model: model || null,
      p_provider: provider || null,
      p_usage: usage ? JSON.stringify(usage) : null
    });

    if (error) {
      console.error('Failed to create message variation:', {
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        },
        parentMessageId,
        contentLength: content?.length,
        model,
        provider,
        usage,
        userId: user.id
      });
      throw new Error(`Database error: ${error.message || 'Unknown error'}`);
    }

    if (!data) {
      console.error('createMessageVariation: No data returned from RPC');
      throw new Error('No variation ID returned');
    }

    return data;
  } catch (error) {
    console.error('Error creating message variation:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      parentMessageId,
      contentLength: content?.length
    });
    throw error;
  }
};

/**
 * Set the active variation for a message
 */
export const setActiveVariation = async (
  parentMessageId: string,
  variationIndex: number
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('set_active_variation', {
      p_parent_message_id: parentMessageId,
      p_variation_index: variationIndex
    });

    if (error) {
      console.error('Failed to set active variation:', {
        error,
        parentMessageId,
        variationIndex,
        errorMessage: error.message,
        errorCode: error.code,
        errorDetails: error.details
      });
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error setting active variation:', error);
    return false;
  }
};

/**
 * Get all variations for a message
 */
export const getMessageVariations = async (
  parentMessageId: string
): Promise<MessageVariation[]> => {
  try {
    // Validate input parameter
    if (!parentMessageId || typeof parentMessageId !== 'string') {
      console.warn('getMessageVariations: Invalid parentMessageId provided:', parentMessageId);
      return [];
    }

    const { data, error } = await supabase.rpc('get_message_variations', {
      p_parent_message_id: parentMessageId
    });

    if (error) {
      console.error('Failed to get message variations:', {
        parentMessageId,
        error: error.message || error,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return [];
    }

    // Transform the data to ensure proper typing, especially for usage property
    return (data || []).map(variation => ({
      ...variation,
      usage: variation.usage ? 
        (typeof variation.usage === 'string' ? 
          JSON.parse(variation.usage) : 
          variation.usage as unknown as Usage
        ) : 
        { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    }));
  } catch (error) {
    console.error('Error getting message variations:', {
      parentMessageId,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    return [];
  }
};
