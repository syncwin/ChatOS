import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type Chat = Tables<'chats'>;
export type Message = Tables<'chat_messages'>;
export type Folder = Tables<'folders'>;
export type Tag = Tables<'tags'>;
export type NewMessage = Omit<TablesInsert<'chat_messages'>, 'id' | 'created_at' | 'user_id'>;

export const getChats = async (): Promise<Chat[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching chats:', error);
    throw new Error('Failed to fetch chats');
  }

  return data || [];
};

export const getFolders = async (): Promise<Folder[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching folders:', error);
    throw new Error('Failed to fetch folders');
  }

  return data || [];
};

export const getMessages = async (chatId: string): Promise<Message[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('chat_id', chatId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    throw new Error('Failed to fetch messages');
  }

  return data || [];
};

export const getTags = async (): Promise<Tag[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching tags:', error);
    throw new Error('Failed to fetch tags');
  }

  return data || [];
};

export const createChat = async (title: string): Promise<Chat> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('chats')
    .insert({
      title,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating chat:', error);
    throw new Error('Failed to create chat');
  }

  return data;
};

export const createFolder = async (name: string): Promise<Folder> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('folders')
        .insert({ name, user_id: user.id })
        .select()
        .single();

    if (error) {
        console.error('Error creating folder:', error);
        throw new Error('Failed to create folder');
    }

    return data;
};

export const createTag = async (name: string, color?: string): Promise<Tag> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('tags')
    .insert({ name, color, user_id: user.id })
    .select()
    .single();

  if (error) {
    console.error('Error creating tag:', error);
    throw new Error('Failed to create tag');
  }

  return data;
};

export const addMessage = async (message: NewMessage): Promise<Message> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      ...message,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding message:', error);
    throw new Error('Failed to add message');
  }

  // Update chat's updated_at timestamp
  await supabase
    .from('chats')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', message.chat_id)
    .eq('user_id', user.id);

  return data;
};

export const assignChatToFolder = async (chatId: string, folderId: string | null): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
        .from('chats')
        .update({ folder_id: folderId })
        .eq('id', chatId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error assigning chat to folder:', error);
        throw new Error('Failed to assign chat to folder');
    }
};

export const updateChatTitle = async (chatId: string, title: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('chats')
    .update({ title })
    .eq('id', chatId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating chat title:', error);
    throw new Error('Failed to update chat title');
  }
};

export const updateFolder = async (folderId: string, name: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
        .from('folders')
        .update({ name })
        .eq('id', folderId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error updating folder name:', error);
        throw new Error('Failed to update folder name');
    }
};

export const updateTag = async (tagId: string, name: string, color?: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('tags')
    .update({ name, color })
    .eq('id', tagId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating tag:', error);
    throw new Error('Failed to update tag');
  }
};

export const assignTagToChat = async (chatId: string, tagId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Check if the relationship already exists
  const { data: existing } = await supabase
    .from('chat_tags')
    .select('*')
    .eq('chat_id', chatId)
    .eq('tag_id', tagId)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    // If it exists, remove it (toggle behavior)
    const { error } = await supabase
      .from('chat_tags')
      .delete()
      .eq('chat_id', chatId)
      .eq('tag_id', tagId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error removing tag from chat:', error);
      throw new Error('Failed to remove tag from chat');
    }
  } else {
    // If it doesn't exist, add it
    const { error } = await supabase
      .from('chat_tags')
      .insert({
        chat_id: chatId,
        tag_id: tagId,
        user_id: user.id,
      });

    if (error) {
      console.error('Error assigning tag to chat:', error);
      throw new Error('Failed to assign tag to chat');
    }
  }
};

export const deleteChat = async (chatId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Delete messages first
  const { error: messagesError } = await supabase
    .from('chat_messages')
    .delete()
    .eq('chat_id', chatId)
    .eq('user_id', user.id);

  if (messagesError) {
    console.error('Error deleting messages:', messagesError);
    throw new Error('Failed to delete chat messages');
  }

  // Then delete the chat
  const { error: chatError } = await supabase
    .from('chats')
    .delete()
    .eq('id', chatId)
    .eq('user_id', user.id);

  if (chatError) {
    console.error('Error deleting chat:', chatError);
    throw new Error('Failed to delete chat');
  }
};

export const updateChatPinStatus = async (chatId: string, is_pinned: boolean): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('chats')
    .update({ is_pinned })
    .eq('id', chatId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating chat pin status:', error);
    throw new Error('Failed to update chat pin status');
  }
};

export const deleteFolder = async (folderId: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error deleting folder:', error);
        throw new Error('Failed to delete folder');
    }
};

export const deleteTag = async (tagId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // First delete all chat_tags relationships
  const { error: chatTagsError } = await supabase
    .from('chat_tags')
    .delete()
    .eq('tag_id', tagId)
    .eq('user_id', user.id);

  if (chatTagsError) {
    console.error('Error deleting chat tags:', chatTagsError);
    throw new Error('Failed to delete chat tags');
  }

  // Then delete the tag
  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', tagId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting tag:', error);
    throw new Error('Failed to delete tag');
  }
};
