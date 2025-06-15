
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type Chat = Tables<'chats'>;
export type Message = Tables<'chat_messages'>;
export type NewMessage = Omit<TablesInsert<'chat_messages'>, 'user_id' | 'id' | 'created_at'>;

export const getChats = async (): Promise<Chat[]> => {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching chats:', error);
    throw new Error('Failed to fetch chats.');
  }
  return data || [];
};

export const getMessages = async (chatId: string): Promise<Message[]> => {
  if (!chatId) return [];
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error(`Error fetching messages for chat ${chatId}:`, error);
    throw new Error('Failed to fetch messages.');
  }
  return data || [];
};

export const createChat = async (title: string): Promise<Chat> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from('chats')
    .insert({ title, user_id: user.id })
    .select()
    .single();

  if (error) {
    console.error('Error creating chat:', error);
    throw new Error('Failed to create chat.');
  }
  return data;
};

export const addMessage = async (message: NewMessage): Promise<Message> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const messageWithUserId = { ...message, user_id: user.id };

  const { data, error } = await supabase
    .from('chat_messages')
    .insert(messageWithUserId)
    .select()
    .single();

  if (error) {
    console.error('Error adding message:', error);
    throw new Error('Failed to add message.');
  }
  return data;
};

export const updateChatTitle = async (chatId: string, title: string): Promise<Chat> => {
  const { data, error } = await supabase
    .from('chats')
    .update({ title })
    .eq('id', chatId)
    .select()
    .single();

  if (error) {
    console.error('Error updating chat title:', error);
    throw new Error('Failed to update chat title.');
  }
  return data;
};

export const updateChatPinStatus = async (chatId: string, is_pinned: boolean): Promise<Chat> => {
  const { data, error } = await supabase
    .from('chats')
    .update({ is_pinned })
    .eq('id', chatId)
    .select()
    .single();

  if (error) {
    console.error('Error updating chat pin status:', error);
    throw new Error('Failed to update chat pin status.');
  }
  return data;
};

export const deleteChat = async (chatId: string) => {
  const { error } = await supabase
    .from('chats')
    .delete()
    .eq('id', chatId);

  if (error) {
    console.error('Error deleting chat:', error);
    throw new Error('Failed to delete chat.');
  }
};
