import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from 'uuid';
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import Header from "@/components/Header";
import ChatMessage from "@/components/ChatMessage";
import WelcomeScreen from "@/components/WelcomeScreen";
import InputArea from "@/components/InputArea";
import AppSidebar from "@/components/AppSidebar";
import { useChat } from "@/hooks/useChat";
import { useAIProvider } from "@/hooks/useAIProvider";
import { useAuth } from "@/hooks/useAuth";
import type { ChatMessage as CoreChatMessage } from "@/services/aiProviderService";
import type { NewMessage, Message as DbMessage } from "@/services/chatService";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

type Message = DbMessage & { isStreaming?: boolean };

const Index = () => {
  const { user, isGuest } = useAuth();
  const queryClient = useQueryClient();
  const {
    chats,
    isLoadingChats,
    activeChatId,
    setActiveChatId,
    messages: dbMessages,
    isLoadingMessages,
    createChatAsync,
    addMessage: addMessageMutation,
    updateChatTitle,
    deleteChat,
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
  const [isDarkMode, setIsDarkMode] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiResponding]);

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

    const historyForAI: CoreChatMessage[] = [
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
    scrollToBottom();

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
        scrollToBottom();
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

  // The AppSidebar expects numeric IDs. We map string IDs to numeric indices.
  const sidebarChats = chats.map((chat, index) => ({
    ...chat,
    id: index,
    date: formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true }),
    messages: [], // Not needed for sidebar
  }));

  const activeSidebarChatIndex = activeChatId
    ? chats.findIndex((c) => c.id === activeChatId)
    : -1;

  const handleSelectChat = (chat: { id: number }) => {
    const realChat = chats[chat.id];
    if (realChat) {
      setActiveChatId(realChat.id);
    }
  };

  const handleDeleteChat = (chatId: number) => {
    const realChat = chats[chatId];
    if (realChat) {
      deleteChat(realChat.id);
    }
  };

  const isLoading = isLoadingChats || isLoadingMessages || isAiResponding;

  const suggestedQuestions = [
    "What is artificial intelligence?",
    "How do large language models work?",
    "Explain quantum computing",
    "What are the latest trends in AI?"
  ];

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  return (
    <>
      <AppSidebar 
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        chats={sidebarChats}
        activeChatId={activeSidebarChatIndex > -1 ? activeSidebarChatIndex : null}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
      />
      <SidebarInset>
        <div className="min-h-screen bg-background text-foreground">
          <div className="container mx-auto max-w-4xl h-screen flex flex-col">
            <header className="flex items-center gap-2 py-4">
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
              />
            </header>

            <main className="flex-1 flex flex-col overflow-hidden">
              {messages.length === 0 && !isLoading ? (
                <WelcomeScreen 
                  suggestedQuestions={suggestedQuestions}
                  onQuestionSelect={(question) => {
                    if (!activeChatId) {
                      handleNewChat();
                    }
                    setInput(question);
                  }}
                />
              ) : (
                <ScrollArea className="flex-1 py-4">
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <ChatMessage 
                        key={message.id} 
                        message={message} 
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              )}

              <InputArea 
                input={input}
                setInput={setInput}
                onSubmit={handleSubmit}
                isLoading={isLoading}
              />
            </main>
          </div>
        </div>
      </SidebarInset>
    </>
  );
};

export default Index;
