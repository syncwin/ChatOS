
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

export const useChat = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

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
