import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/supabase';

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
  usage: any;
}

export interface NewMessage {
  chat_id: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  model?: string;
  usage?: any;
}

export interface Folder {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const getProfile = async (): Promise<UserProfile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select(`id, email, name, avatar_url, theme`)
    .eq('id', user.id)
    .single();

  return profile;
};

export const updateProfile = async (updates: { name?: string; avatar_url?: string; theme?: 'light' | 'dark' }) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);

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
    .from('messages')
    .select(`id, chat_id, user_id, created_at, role, content, provider, model, usage`)
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const createChat = async (title: string): Promise<Chat> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const newChatId = uuidv4();

  const { error } = await supabase.from('chats').insert([
    {
      id: newChatId,
      title: title,
      user_id: user.id,
    },
  ]);

  if (error) throw error;

  return {
    id: newChatId,
    title: title,
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

  const newMessageId = uuidv4();

  const { error } = await supabase.from('messages').insert([
    {
      id: newMessageId,
      chat_id: message.chat_id,
      user_id: user.id,
      role: message.role,
      content: message.content,
      provider: message.provider,
      model: message.model,
      usage: message.usage,
    },
  ]);

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
    content: message.content,
    provider: message.provider,
    model: message.model,
    usage: message.usage,
  };
};

export const updateChatTitle = async (chatId: string, title: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('chats')
    .update({ title })
    .eq('id', chatId)
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
    .select(`id, name, user_id, created_at, updated_at`)
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const createFolder = async (name: string): Promise<Folder> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const newFolderId = uuidv4();

  const { error } = await supabase.from('folders').insert([
    {
      id: newFolderId,
      name: name,
      user_id: user.id,
    },
  ]);

  if (error) throw error;

  return {
    id: newFolderId,
    name: name,
    user_id: user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

export const updateFolder = async (folderId: string, name: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('folders')
    .update({ name })
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
    .select(`id, name, color, user_id, created_at, updated_at`)
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const createTag = async (name: string, color?: string): Promise<Tag> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const newTagId = uuidv4();

  const { error } = await supabase.from('tags').insert([
    {
      id: newTagId,
      name: name,
      color: color,
      user_id: user.id,
    },
  ]);

  if (error) throw error;

  return {
    id: newTagId,
    name: name,
    color: color,
    user_id: user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

export const updateTag = async (tagId: string, name: string, color?: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('tags')
    .update({ name, color })
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
        created_at,
        updated_at
      )
    `)
    .eq('chat_id', chatId)
    .eq('user_id', user.id);

  if (error) throw error;
  return data?.map(item => item.tags) || [];
};
