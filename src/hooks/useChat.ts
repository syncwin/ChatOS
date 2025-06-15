import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import {
  getChats,
  getMessages,
  createChat,
  addMessage,
  updateChatTitle,
  deleteChat,
  updateChatPinStatus,
  type Chat,
  type Message,
  type NewMessage,
} from '@/services/chatService';
import { useAuth } from './useAuth';
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

export const useChat = () => {
  const queryClient = useQueryClient();
  const { user, isGuest } = useAuth();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // --- Guest State ---
  const [guestChats, setGuestChats] = useState<GuestChat[]>([]);

  // --- Authenticated State (from react-query) ---
  const { data: chats = [], isLoading: isLoadingChats } = useQuery<Chat[]>({
    queryKey: ['chats', user?.id],
    queryFn: getChats,
    enabled: !!user && !isGuest,
  });

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ['messages', activeChatId],
    queryFn: () => getMessages(activeChatId!),
    enabled: !!activeChatId && !isGuest,
  });

  const createChatMutation = useMutation({
    mutationFn: (title: string) => createChat(title),
    onSuccess: (newChat) => {
      queryClient.invalidateQueries({ queryKey: ['chats', user?.id] });
      setActiveChatId(newChat.id);
      toast.success('New chat created.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const addMessageMutation = useMutation({
    mutationFn: addMessage,
    onSuccess: (newMessage) => {
      queryClient.invalidateQueries({ queryKey: ['messages', newMessage.chat_id] });
      queryClient.invalidateQueries({ queryKey: ['chats', user?.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const updateChatTitleMutation = useMutation({
    mutationFn: ({ chatId, title }: { chatId: string, title: string }) => updateChatTitle(chatId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats', user?.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const deleteChatMutation = useMutation({
    mutationFn: deleteChat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats', user?.id] });
      toast.success('Chat deleted.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const updateChatPinStatusMutation = useMutation({
    mutationFn: ({ chatId, is_pinned }: { chatId: string; is_pinned: boolean }) =>
      updateChatPinStatus(chatId, is_pinned),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats', user?.id] });
      toast.success('Chat pin status updated.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Effect to manage activeChatId for authenticated user
  useEffect(() => {
    if (isGuest || isLoadingChats) return;

    if (chats.length > 0) {
      // If there's no active chat, or the active chat is no longer in the list (e.g. deleted),
      // set the first chat in the list as active.
      // This runs on initial load and when the chats list changes.
      if (!activeChatId || !chats.find((c) => c.id === activeChatId)) {
        setActiveChatId(chats[0].id);
      }
    } else {
      // If there are no chats, there's no active chat.
      setActiveChatId(null);
    }
    // We've intentionally removed `activeChatId` from the dependency array.
    // This effect should only run when the list of chats changes, not when the
    // user manually changes the active chat (e.g., by clicking "New Chat").
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chats, isGuest, isLoadingChats, setActiveChatId]);

  // Effect to load guest data from session storage
  useEffect(() => {
    if (!isGuest) return;
    const { chats: savedChats, activeChatId: savedActiveId } = getGuestData();
    setGuestChats(savedChats);
    const validActiveId = savedChats.find(c => c.id === savedActiveId)?.id;
    setActiveChatId(validActiveId || (savedChats.length > 0 ? savedChats[0].id : null));
  }, [isGuest]);

  // Effect to save guest data to session storage
  useEffect(() => {
    if (!isGuest) return;
    setGuestData({ chats: guestChats, activeChatId });
  }, [guestChats, activeChatId, isGuest]);

  if (isGuest) {
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
      updateChatTitle: (args: { chatId: string, title: string }) => updateGuestChatTitleLogic(args, setGuestChats),
      deleteChat: (chatId: string) => deleteGuestChatLogic(chatId, guestChats, setGuestChats, activeChatId, setActiveChatId),
      updateChatPinStatus: () => { toast.info("Sign in to pin chats."); },
    };
  }

  return {
    chats,
    isLoadingChats,
    activeChatId,
    setActiveChatId,
    messages,
    isLoadingMessages,
    createChat: createChatMutation.mutate,
    createChatAsync: createChatMutation.mutateAsync,
    addMessage: addMessageMutation.mutate,
    updateChatTitle: updateChatTitleMutation.mutate,
    deleteChat: deleteChatMutation.mutate,
    updateChatPinStatus: updateChatPinStatusMutation.mutate,
  };
};
