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
import type { Database } from '@/integrations/supabase/types';

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens?: number;
}

interface ProfileUpdates {
  full_name?: string;
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
    .select(`id, full_name, avatar_url, theme`)
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    email: user.email || '',
    name: profile.full_name || undefined,
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
  if (updates.name !== undefined) profileUpdates.full_name = updates.name;
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
    .order('created_at', { ascending: true });

  if (error) throw error;
  
  // Transform the data to ensure proper typing
  return (data || []).map(msg => ({
    ...msg,
    usage: (msg.usage as any) || { prompt_tokens: 0, completion_tokens: 0 }
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

  const { error } = await supabase.from('chat_messages').insert({
    id: newMessageId,
    chat_id: message.chat_id,
    user_id: user.id,
    role: message.role,
    content: sanitizedContent,
    provider: message.provider,
    model: message.model,
    usage: message.usage as any,
  });

  if (error) throw error;

  // Update the chat's updated_at timestamp
  await supabase
    .from('chats')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', message.chat_id);

  return {
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
