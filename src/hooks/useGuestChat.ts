
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  getGuestData,
  setGuestData,
  createGuestChat,
  addGuestMessage,
  updateGuestChatTitle as updateGuestChatTitleLogic,
  deleteGuestChat as deleteGuestChatLogic,
  type GuestChat,
} from '@/features/chat/guestChat';
import type { NewMessage } from '@/services/chatService';
import type { UseChatReturn } from './useChat';

export const useGuestChat = (): UseChatReturn => {
  const [guestChats, setGuestChats] = useState<GuestChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  useEffect(() => {
    const { chats: savedChats, activeChatId: savedActiveId } = getGuestData();
    setGuestChats(savedChats);
    const validActiveId = savedChats.find(c => c.id === savedActiveId)?.id;
    setActiveChatId(validActiveId || (savedChats.length > 0 ? savedChats[0].id : null));
  }, []);

  useEffect(() => {
    setGuestData({ chats: guestChats, activeChatId });
  }, [guestChats, activeChatId]);

  const activeGuestChat = guestChats.find(c => c.id === activeChatId);

  const createGuestChatAsync = async (title: string): Promise<GuestChat> => {
    return createGuestChat(title, setGuestChats, setActiveChatId);
  };

  return {
    chats: guestChats,
    isLoadingChats: false,
    activeChatId,
    setActiveChatId,
    messages: activeGuestChat?.messages || [],
    isLoadingMessages: false,
    createChat: (title: string) => { createGuestChatAsync(title); },
    createChatAsync: createGuestChatAsync,
    addMessage: (message: NewMessage) => addGuestMessage(message, setGuestChats),
    updateChatTitle: (args) => updateGuestChatTitleLogic(args, setGuestChats),
    deleteChat: (chatId) => deleteGuestChatLogic(chatId, guestChats, setGuestChats, activeChatId, setActiveChatId),
    updateChatPinStatus: () => { toast.info("Sign in to pin chats."); },
    folders: [],
    isLoadingFolders: false,
    createFolder: () => toast.info('Sign in to use folders.'),
    updateFolder: () => toast.info('Sign in to use folders.'),
    deleteFolder: () => toast.info('Sign in to use folders.'),
    assignChatToFolder: () => toast.info('Sign in to use folders.'),
    tags: [],
    isLoadingTags: false,
    createTag: () => toast.info('Sign in to use tags.'),
    assignTagToChat: () => toast.info('Sign in to use tags.'),
    removeTagFromChat: () => toast.info('Sign in to use tags.'),
  };
};
