
import { useState, useRef, useEffect } from "react";
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
import type { NewMessage } from "@/services/chatService";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const Index = () => {
  const { user } = useAuth();
  const {
    chats,
    isLoadingChats,
    activeChatId,
    setActiveChatId,
    messages,
    isLoadingMessages,
    createChatAsync,
    addMessage,
    updateChatTitle,
    deleteChat,
  } = useChat();

  const { sendMessage, isLoading: isAiResponding } = useAIProvider();

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
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isAiResponding || !user) return;

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
      updateChatTitle({ chatId: currentChatId, title: trimmedInput.length > 30 ? trimmedInput.substring(0, 27) + "..." : trimmedInput });
    }

    if (!currentChatId) return;

    const userMessage: NewMessage = {
      chat_id: currentChatId,
      content: trimmedInput,
      role: 'user',
    };
    addMessage(userMessage);

    const historyForAI: CoreChatMessage[] = [
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: trimmedInput }
    ];

    const aiResponse = await sendMessage(historyForAI);

    if (aiResponse && currentChatId) {
      const assistantMessage: NewMessage = {
        chat_id: currentChatId,
        content: aiResponse.content,
        role: 'assistant',
        provider: aiResponse.provider,
        model: aiResponse.model,
        usage: aiResponse.usage,
      };
      addMessage(assistantMessage);
    }
  };
  
  const handleNewChat = () => {
    setActiveChatId(null);
  };

  // The AppSidebar expects numeric IDs, but our DB uses string UUIDs.
  // We'll map string IDs to numeric indices for the sidebar and back.
  const sidebarChats = chats.map((chat, index) => ({
    ...chat,
    id: index, // Use index as the numeric ID
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
            <div className="flex items-center gap-2 p-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
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
                <ScrollArea className="flex-1 p-4">
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
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
};

export default Index;
