import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from 'uuid';
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import Header from "@/components/Header";
import AppSidebar from "@/components/AppSidebar";
import ChatView from "@/components/ChatView";
import { useChat } from "@/hooks/useChat";
import { useAIProvider } from "@/hooks/useAIProvider";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import type { ChatMessage } from "@/services/aiProviderService";
import type { NewMessage, Message as DbMessage, Chat } from "@/services/chatService";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export type Message = DbMessage & { isStreaming?: boolean };

const Index = () => {
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
  const isDarkMode = profile?.theme !== 'light'; // Default to dark theme

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
    
    // Optimistically add placeholder
    queryClient.setQueryData<Message[]>(['messages', currentChatId], (oldData: Message[] = []) => [
      ...oldData,
      assistantPlaceholder
    ]);

    let finalContent = "";

    await streamMessage(
      historyForAI,
      (delta) => { // onDelta
        finalContent += delta;
        queryClient.setQueryData<Message[]>(['messages', currentChatId], (oldData: Message[] = []) =>
          oldData.map(msg => 
            msg.id === assistantId ? { ...msg, content: finalContent } : msg
          )
        );
      },
      () => { // onComplete
        const finalAssistantMessage: NewMessage = {
          chat_id: currentChatId!,
          content: finalContent,
          role: 'assistant',
          provider: selectedProvider,
        };
        // Replace placeholder with final message from DB
        addMessageMutation(finalAssistantMessage, {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages', currentChatId] });
          }
        });
      },
      (error) => { // onError
        toast.error(`Error from AI: ${error.message}`);
        // Remove placeholder on error
        queryClient.setQueryData<Message[]>(['messages', currentChatId], (oldData: Message[] = []) =>
          oldData.filter(msg => msg.id !== assistantId)
        );
      }
    );
  };
  
  const handleNewChat = () => {
    setActiveChatId(null);
  };

  // Format chats for the sidebar
  const sidebarChats = chats.map((chat) => ({
    ...chat,
    date: formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true }),
  }));

  const handleSelectChat = (chat: { id: string }) => {
    setActiveChatId(chat.id);
  };

  const activeChat = chats.find(c => c.id === activeChatId);

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

  return (
    <>
      <AppSidebar 
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        chats={sidebarChats}
        folders={folders}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        createFolder={createFolder}
        updateFolder={updateFolder}
        deleteFolder={deleteFolder}
      />
      <SidebarInset>
        <div className="min-h-screen bg-background text-foreground h-screen flex flex-col">
          <header className="py-4">
            <div className="container mx-auto max-w-4xl flex items-center gap-2">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" aria-label="Toggle sidebar" />
              <Header
                isDarkMode={isDarkMode}
                toggleDarkMode={toggleDarkMode}
                availableProviders={availableProviders}
                selectedProvider={selectedProvider}
                onSelectProvider={switchProvider}
                availableModels={availableModels}
                selectedModel={selectedModel}
                onSelectModel={switchModel}
                isLoadingProviders={isLoadingProviders}
                folders={folders}
                isLoadingFolders={isLoadingFolders}
                activeChat={activeChat}
                onAssignChatToFolder={handleAssignChatToFolder}
                tags={tags}
                createTag={createTag}
                assignTagToChat={assignTagToChat}
                removeTagFromChat={removeTagFromChat}
              />
            </div>
          </header>

          <ChatView
            messages={messages}
            isLoading={isLoading}
            isAiResponding={isAiResponding}
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            onNewChat={handleNewChat}
            activeChatId={activeChatId}
          />
        </div>
      </SidebarInset>
    </>
  );
};

export default Index;
