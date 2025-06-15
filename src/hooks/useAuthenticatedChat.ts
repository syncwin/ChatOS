
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import {
  getChats,
  getMessages,
  createChat,
  addMessage,
  updateChatTitle,
  deleteChat,
  updateChatPinStatus,
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  assignChatToFolder,
  getTags,
  createTag,
  assignTagToChat,
  removeTagFromChat,
  getChatTags,
  type Chat,
  type Message,
  type Folder,
  type NewMessage,
  type Tag,
  type ChatTag,
} from '@/services/chatService';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { UseChatReturn } from './useChat';

export const useAuthenticatedChat = (): UseChatReturn => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [activeChatId, setActiveChatId] = useState<string | null>(null);

    const { data: chats = [], isLoading: isLoadingChats } = useQuery<Chat[]>({
        queryKey: ['chats', user?.id],
        queryFn: getChats,
        enabled: !!user,
    });

    const { data: folders = [], isLoading: isLoadingFolders } = useQuery<Folder[]>({
        queryKey: ['folders', user?.id],
        queryFn: getFolders,
        enabled: !!user,
    });

    const { data: tags = [], isLoading: isLoadingTags } = useQuery<Tag[]>({
        queryKey: ['tags', user?.id],
        queryFn: getTags,
        enabled: !!user,
    });

    const { data: chatTags = [], isLoading: isLoadingChatTags } = useQuery<ChatTag[]>({
        queryKey: ['chat_tags', user?.id],
        queryFn: getChatTags,
        enabled: !!user,
    });

    const { data: messages = [], isLoading: isLoadingMessages } = useQuery<Message[]>({
        queryKey: ['messages', activeChatId],
        queryFn: () => getMessages(activeChatId!),
        enabled: !!activeChatId && !!user,
    });

    const chatsWithData = useMemo(() => {
        if (isLoadingChats || isLoadingTags || isLoadingChatTags) return [];
        return chats.map(chat => ({
            ...chat,
            tags: chatTags
                .filter(ct => ct.chat_id === chat.id)
                .map(ct => tags.find(t => t.id === ct.tag_id))
                .filter((t): t is Tag => !!t)
        }));
    }, [chats, tags, chatTags, isLoadingChats, isLoadingTags, isLoadingChatTags]);

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
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['chats', user?.id] });
          toast.success('Chat moved.');
        },
        onError: (error: Error) => {
          toast.error(error.message);
        }
    });

    const createTagMutation = useMutation({
        mutationFn: (name: string) => createTag(name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags', user?.id] });
            toast.success('Tag created.');
        },
        onError: (error: Error) => toast.error(error.message),
    });

    const assignTagToChatMutation = useMutation({
        mutationFn: ({ chatId, tagId }: { chatId: string; tagId: string }) => assignTagToChat({ chatId, tagId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chat_tags', user?.id] });
        },
        onError: (error: Error) => toast.error(error.message),
    });
    
    const removeTagFromChatMutation = useMutation({
        mutationFn: ({ chatId, tagId }: { chatId: string; tagId: string }) => removeTagFromChat({ chatId, tagId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chat_tags', user?.id] });
        },
        onError: (error: Error) => toast.error(error.message),
    });

    useEffect(() => {
        if (isLoadingChats) return;

        if (chats.length > 0) {
          if (!activeChatId || !chats.find((c) => c.id === activeChatId)) {
            setActiveChatId(chats[0].id);
          }
        } else {
          setActiveChatId(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chats, isLoadingChats]);

    return {
        chats: chatsWithData,
        isLoadingChats: isLoadingChats || isLoadingTags || isLoadingChatTags,
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
        folders,
        isLoadingFolders,
        createFolder: createFolderMutation.mutate,
        updateFolder: updateFolderMutation.mutate,
        deleteFolder: deleteFolderMutation.mutate,
        assignChatToFolder: assignChatToFolderMutation.mutate,
        tags,
        isLoadingTags: isLoadingTags || isLoadingChatTags,
        createTag: createTagMutation.mutate,
        assignTagToChat: assignTagToChatMutation.mutate,
        removeTagFromChat: removeTagFromChatMutation.mutate,
    };
};
