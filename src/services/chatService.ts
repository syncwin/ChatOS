
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type Chat = Tables<'chats'>;
export type Message = Tables<'chat_messages'>;
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
