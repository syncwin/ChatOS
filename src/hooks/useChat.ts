import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import {
  getChats,
  getMessages,
  createChat,
  addMessage,
  updateChatTitle,
  deleteChat,
  deleteMessage,
  deleteMessagePair,
  updateChatPinStatus,
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  assignChatToFolder,
  getTags,
  createTag,
  updateTag,
  deleteTag,
  assignTagToChat,
  removeTagFromChat,
  getChatTags,
  type Chat,
  type Message,
  type Folder,
  type Tag,
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
  checkAndAddErrorBubbleForGuest,
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

  const { data: folders = [], isLoading: isLoadingFolders } = useQuery<Folder[]>({
    queryKey: ['folders', user?.id],
    queryFn: getFolders,
    enabled: !!user && !isGuest,
  });

  const { data: tags = [], isLoading: isLoadingTags } = useQuery<Tag[]>({
    queryKey: ['tags', user?.id],
    queryFn: getTags,
    enabled: !!user && !isGuest,
  });

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ['messages', activeChatId],
    queryFn: () => getMessages(activeChatId!),
    enabled: !!activeChatId && !isGuest,
  });

  const { data: chatTags = [] } = useQuery<Tag[]>({
    queryKey: ['chatTags', activeChatId],
    queryFn: () => getChatTags(activeChatId!),
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
      // Don't automatically invalidate messages query to preserve UI state
      // Manual invalidation should be done where needed
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

  const deleteMessageMutation = useMutation({
    mutationFn: deleteMessage,
    onSuccess: (_, messageId) => {
      // Don't invalidate here - optimistic updates are handled in the component
      toast.success('Message deleted.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const deleteMessagePairMutation = useMutation({
    mutationFn: deleteMessagePair,
    onSuccess: (_, messageIds) => {
      // Don't invalidate here - optimistic updates are handled in the component
      toast.success(`Deleted ${messageIds.length > 1 ? 'conversation pair' : 'message'}.`);
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

  const createFolderMutation = useMutation({
    mutationFn: (name: string) => createFolder(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', user?.id] });
      toast.success('Folder created.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const updateFolderMutation = useMutation({
    mutationFn: ({ folderId, name }: { folderId: string; name: string }) => updateFolder(folderId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', user?.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (folderId: string) => deleteFolder(folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['chats', user?.id] });
      toast.success('Folder deleted.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const assignChatToFolderMutation = useMutation({
    mutationFn: ({ chatId, folderId }: { chatId: string; folderId: string | null }) => assignChatToFolder(chatId, folderId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chats', user?.id] });
      toast.success('Chat moved.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const createTagMutation = useMutation({
    mutationFn: ({ name, color }: { name: string; color?: string }) => createTag(name, color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', user?.id] });
      toast.success('Tag created.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const updateTagMutation = useMutation({
    mutationFn: ({ tagId, name, color }: { tagId: string; name: string; color?: string }) => updateTag(tagId, name, color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', user?.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const deleteTagMutation = useMutation({
    mutationFn: (tagId: string) => deleteTag(tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', user?.id] });
      toast.success('Tag deleted.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const assignTagToChatMutation = useMutation({
    mutationFn: ({ chatId, tagId }: { chatId: string; tagId: string }) => assignTagToChat(chatId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatTags', activeChatId] });
      queryClient.invalidateQueries({ queryKey: ['chats', user?.id] });
      toast.success('Tag assigned.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const removeTagFromChatMutation = useMutation({
    mutationFn: ({ chatId, tagId }: { chatId: string; tagId: string }) => removeTagFromChat(chatId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatTags', activeChatId] });
      queryClient.invalidateQueries({ queryKey: ['chats', user?.id] });
      toast.success('Tag removed.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Effect to load persisted activeChatId for authenticated users
  useEffect(() => {
    if (isGuest || isLoadingChats) return;
    
    try {
      const savedActiveChatId = localStorage.getItem('activeChatId');
      if (savedActiveChatId && chats.find(c => c.id === savedActiveChatId)) {
        setActiveChatId(savedActiveChatId);
        return;
      }
    } catch (error) {
      console.error('Failed to load active chat ID from localStorage:', error);
    }

    if (chats.length > 0) {
      // If there's no saved active chat, or the saved chat is no longer in the list (e.g. deleted),
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

  // Effect to persist activeChatId for authenticated users
  useEffect(() => {
    if (isGuest || !activeChatId) return;
    
    try {
      localStorage.setItem('activeChatId', activeChatId);
    } catch (error) {
      console.error('Failed to save active chat ID to localStorage:', error);
    }
  }, [activeChatId, isGuest]);

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
      deleteMessage: () => toast.info('Sign in to delete messages.'),
      updateChatPinStatus: () => { toast.info("Sign in to pin chats."); },
      folders: [],
      isLoadingFolders: false,
      createFolder: () => toast.info('Sign in to use folders.'),
      updateFolder: () => toast.info('Sign in to use folders.'),
      deleteFolder: () => toast.info('Sign in to use folders.'),
      assignChatToFolder: () => toast.info('Sign in to use folders.'),
      tags: [],
      isLoadingTags: false,
      chatTags: [],
      createTag: () => toast.info('Sign in to use tags.'),
      updateTag: () => toast.info('Sign in to use tags.'),
      deleteTag: () => toast.info('Sign in to use tags.'),
      assignTagToChat: () => toast.info('Sign in to use tags.'),
      removeTagFromChat: () => toast.info('Sign in to use tags.'),
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
    deleteMessage: deleteMessageMutation.mutate,
    deleteMessagePair: deleteMessagePairMutation.mutate,
    updateChatPinStatus: updateChatPinStatusMutation.mutate,
    folders,
    isLoadingFolders,
    createFolder: createFolderMutation.mutate,
    updateFolder: updateFolderMutation.mutate,
    deleteFolder: deleteFolderMutation.mutate,
    assignChatToFolder: assignChatToFolderMutation.mutate,
    tags,
    isLoadingTags,
    chatTags,
    createTag: (name: string, color?: string) => createTagMutation.mutate({ name, color }),
    updateTag: updateTagMutation.mutate,
    deleteTag: deleteTagMutation.mutate,
    assignTagToChat: assignTagToChatMutation.mutate,
    removeTagFromChat: removeTagFromChatMutation.mutate,
    checkAndAddErrorBubbleForGuest: isGuest ? (chatId: string) => checkAndAddErrorBubbleForGuest(chatId, guestChats, setGuestChats) : () => {},
  };
};
