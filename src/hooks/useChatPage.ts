
import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from 'uuid';
import { useChat } from "@/hooks/useChat";
import { useAIProvider } from "@/hooks/useAIProvider";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import type { ChatMessage } from "@/services/aiProviderService";
import type { NewMessage, Message as DbMessage, Chat } from "@/services/chatService";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export type Message = DbMessage & { isStreaming?: boolean };

export const useChatPage = () => {
    const { user, isGuest } = useAuth();
    const { profile, updateProfile } = useProfile();
    const queryClient = useQueryClient();
    const {
        chats,
        isLoadingChats,
        folders,
        isLoadingFolders,
        activeChatId,
        setActiveChatId,
        messages: dbMessages,
        isLoadingMessages,
        createChatAsync,
        addMessage: addMessageMutation,
        updateChatTitle,
        createFolder,
        updateFolder,
        deleteFolder,
        assignChatToFolder,
        tags,
        isLoadingTags,
        createTag,
        assignTagToChat,
        removeTagFromChat,
    } = useChat();

    const messages: Message[] = dbMessages;

    const {
        streamMessage,
        isAiResponding,
        selectedProvider,
        selectedModel,
        availableProviders,
        availableModels,
        switchProvider,
        switchModel,
        isLoadingProviders,
    } = useAIProvider();

    const [input, setInput] = useState("");
    const isDarkMode = profile?.theme !== 'light';

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedInput = input.trim();
        if (!trimmedInput || isAiResponding) return;
        if (!user && !isGuest) return;

        setInput("");

        let currentChatId = activeChatId;

        if (!currentChatId) {
            try {
                const newChat = await createChatAsync(trimmedInput);
                currentChatId = newChat.id;
            } catch (error) {
                toast.error("Could not start a new chat. Please try again.");
                setInput(trimmedInput);
                return;
            }
        } else if (messages.length === 0) {
            const title = trimmedInput.length > 30 ? trimmedInput.substring(0, 27) + "..." : trimmedInput;
            updateChatTitle({ chatId: currentChatId, title: title });
        }

        if (!currentChatId) return;

        const userMessage: NewMessage = {
            chat_id: currentChatId,
            content: trimmedInput,
            role: 'user',
        };
        addMessageMutation(userMessage);

        const historyForAI: ChatMessage[] = [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: trimmedInput }
        ];

        const assistantId = uuidv4();
        const assistantPlaceholder: Message = {
            id: assistantId,
            chat_id: currentChatId,
            content: '',
            role: 'assistant',
            created_at: new Date().toISOString(),
            isStreaming: true,
            user_id: user?.id || '',
            model: selectedModel,
            provider: selectedProvider,
            usage: null,
        };
        
        queryClient.setQueryData<Message[]>(['messages', currentChatId], (oldData: Message[] = []) => [
            ...oldData,
            assistantPlaceholder
        ]);

        let finalContent = "";

        await streamMessage(
            historyForAI,
            (delta) => {
                finalContent += delta;
                queryClient.setQueryData<Message[]>(['messages', currentChatId], (oldData: Message[] = []) =>
                    oldData.map(msg => 
                        msg.id === assistantId ? { ...msg, content: finalContent } : msg
                    )
                );
            },
            () => {
                const finalAssistantMessage: NewMessage = {
                    chat_id: currentChatId!,
                    content: finalContent,
                    role: 'assistant',
                    provider: selectedProvider,
                };
                addMessageMutation(finalAssistantMessage, {
                    onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ['messages', currentChatId] });
                    }
                });
            },
            (error) => {
                toast.error(`Error from AI: ${error.message}`);
                queryClient.setQueryData<Message[]>(['messages', currentChatId], (oldData: Message[] = []) =>
                    oldData.filter(msg => msg.id !== assistantId)
                );
            }
        );
    };
    
    const handleNewChat = () => {
        setActiveChatId(null);
    };

    const sidebarChats = useMemo(() => chats.map((chat) => ({
        ...chat,
        date: formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true }),
    })), [chats]);

    const handleSelectChat = (chat: { id: string }) => {
        setActiveChatId(chat.id);
    };

    const activeChat = useMemo(() => chats.find(c => c.id === activeChatId), [chats, activeChatId]);

    const handleAssignChatToFolder = (folderId: string) => {
        if (activeChatId) {
            assignChatToFolder({ chatId: activeChatId, folderId: folderId === 'none' ? null : folderId });
        }
    };

    const isLoading = isLoadingChats || isLoadingMessages || isLoadingFolders;

    const toggleDarkMode = () => {
        if (profile) {
            updateProfile({ theme: isDarkMode ? 'light' : 'dark' });
        }
    };

    return {
        isDarkMode,
        toggleDarkMode,
        sidebarChats,
        folders,
        isLoadingFolders,
        activeChatId,
        handleNewChat,
        handleSelectChat,
        createFolder,
        updateFolder,
        deleteFolder,
        availableProviders,
        selectedProvider,
        switchProvider,
        availableModels,
        selectedModel,
        switchModel,
        isLoadingProviders,
        activeChat,
        handleAssignChatToFolder,
        tags,
        createTag,
        assignTagToChat,
        removeTagFromChat,
        messages,
        isLoading,
        isAiResponding,
        input,
        setInput,
        handleSubmit,
    };
};
