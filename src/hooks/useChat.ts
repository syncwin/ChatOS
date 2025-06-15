
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import {
  getChats,
  getMessages,
  createChat,
  addMessage,
  updateChatTitle,
  deleteChat,
  type Chat,
  type Message,
  type NewMessage,
} from '@/services/chatService';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

type GuestMessage = Message;
type GuestChat = Chat & { messages: GuestMessage[] };

const getGuestData = (): { chats: GuestChat[]; activeChatId: string | null } => {
  const data = sessionStorage.getItem('guestChatData');
  return data ? JSON.parse(data) : { chats: [], activeChatId: null };
};

const setGuestData = (data: { chats: GuestChat[]; activeChatId: string | null }) => {
  sessionStorage.setItem('guestChatData', JSON.stringify(data));
};


export const useChat = () => {
  const queryClient = useQueryClient();
  const { user, isGuest } = useAuth();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // --- Guest Mode Logic ---
  const [guestChats, setGuestChats] = useState<GuestChat[]>([]);
  
  useEffect(() => {
    if (isGuest) {
      const { chats: savedChats, activeChatId: savedActiveId } = getGuestData();
      setGuestChats(savedChats);
      const validActiveId = savedChats.find(c => c.id === savedActiveId)?.id;
      setActiveChatId(validActiveId || (savedChats.length > 0 ? savedChats[0].id : null));

      // Clear guest data if user logs in
      return () => {
        if (user) sessionStorage.removeItem('guestChatData');
      }
    }
  }, [isGuest, user]);

  useEffect(() => {
    if (isGuest) {
      setGuestData({ chats: guestChats, activeChatId });
    }
  }, [guestChats, activeChatId, isGuest]);

  if (isGuest) {
    const activeGuestChat = guestChats.find(c => c.id === activeChatId);
    
    const createGuestChatAsync = async (title: string): Promise<GuestChat> => {
      const newChat: GuestChat = {
        id: uuidv4(),
        title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user?.id || '',
        messages: [],
      };
      setGuestChats(prev => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      return newChat;
    };

    const addGuestMessage = (message: NewMessage) => {
      setGuestChats(prev =>
        prev.map(chat =>
          chat.id === message.chat_id
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  { ...message, id: uuidv4(), created_at: new Date().toISOString() } as GuestMessage,
                ],
                updated_at: new Date().toISOString(),
              }
            : chat
        ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      );
    };

    const updateGuestChatTitle = ({ chatId, title }: { chatId: string, title: string }) => {
        setGuestChats(prev => prev.map(c => c.id === chatId ? {...c, title} : c));
    };

    const deleteGuestChat = (chatId: string) => {
        const remaining = guestChats.filter(c => c.id !== chatId);
        setGuestChats(remaining);
        if(activeChatId === chatId) {
            setActiveChatId(remaining.length > 0 ? remaining[0].id : null);
        }
        toast.success("Chat deleted for this session.");
    };

    return {
      chats: guestChats,
      isLoadingChats: false,
      activeChatId,
      setActiveChatId,
      messages: activeGuestChat?.messages || [],
      isLoadingMessages: false,
      createChat: (title: string) => createGuestChatAsync(title),
      createChatAsync: createGuestChatAsync,
      addMessage: addGuestMessage,
      updateChatTitle: updateGuestChatTitle,
      deleteChat: deleteGuestChat,
    };
  }

  // --- Authenticated User Logic ---
  const { data: chats = [], isLoading: isLoadingChats } = useQuery<Chat[]>({
    queryKey: ['chats', user?.id],
    queryFn: getChats,
    enabled: !!user,
  });

  useEffect(() => {
    if (!activeChatId && chats.length > 0) {
      setActiveChatId(chats[0].id);
    }
  }, [chats, activeChatId]);

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ['messages', activeChatId],
    queryFn: () => getMessages(activeChatId!),
    enabled: !!activeChatId,
  });

  const createChatMutation = useMutation({
    mutationFn: (title: string) => createChat(title),
    onSuccess: (newChat) => {
      queryClient.invalidateQueries({ queryKey: ['chats', user?.id] });
      setActiveChatId(newChat.id);
      toast.success('New chat created.');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const addMessageMutation = useMutation({
    mutationFn: addMessage,
    onSuccess: (newMessage) => {
      queryClient.invalidateQueries({ queryKey: ['messages', newMessage.chat_id] });
      queryClient.invalidateQueries({ queryKey: ['chats', user?.id] });
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const updateChatTitleMutation = useMutation({
    mutationFn: ({ chatId, title }: { chatId: string, title: string }) => updateChatTitle(chatId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats', user?.id] });
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const deleteChatMutation = useMutation({
    mutationFn: deleteChat,
    onSuccess: (_, deletedChatId) => {
      queryClient.invalidateQueries({ queryKey: ['chats', user?.id] });
      if (activeChatId === deletedChatId) {
        const remainingChats = chats.filter(c => c.id !== deletedChatId);
        setActiveChatId(remainingChats.length > 0 ? remainingChats[0].id : null);
      }
      toast.success('Chat deleted.');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

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
  };
};
