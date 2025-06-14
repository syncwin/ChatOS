import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import Header from "@/components/Header";
import ChatMessage from "@/components/ChatMessage";
import WelcomeScreen from "@/components/WelcomeScreen";
import InputArea from "@/components/InputArea";
import AppSidebar from "@/components/AppSidebar";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isStreaming?: boolean;
}

interface Chat {
  id: number;
  title: string;
  date: string;
  messages: Message[];
}

const initialChats: Chat[] = [
  { id: 1, title: "AI and Machine Learning", date: "Today", messages: [] },
  { id: 2, title: "Quantum Computing Basics", date: "Yesterday", messages: [] },
  { id: 3, title: "Web Development Tips", date: "2 days ago", messages: [] },
  { id: 4, title: "Data Science Projects", date: "1 week ago", messages: [] },
];

const Index = () => {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [activeChatId, setActiveChatId] = useState<number | null>(
    initialChats.length > 0 ? initialChats[0].id : null
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdCounter = useRef(0);

  const activeChat = chats.find((chat) => chat.id === activeChatId);
  const messages = activeChat ? activeChat.messages : [];

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const generateUniqueId = () => {
    messageIdCounter.current += 1;
    return `msg-${Date.now()}-${messageIdCounter.current}`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateStreamingResponse = async (userMessage: string) => {
    const responses = [
      "I'm an AI assistant designed to help you with various tasks and answer your questions. I can provide information, assist with analysis, help with creative tasks, and much more.",
      "Based on your question about AI chatbots, I can explain that modern AI systems like myself use large language models trained on diverse datasets to understand and generate human-like text responses.",
      "Perplexity AI is known for its search-augmented responses, combining real-time web search with AI-generated answers. This allows for more current and factual information compared to traditional chatbots.",
      "I can help you with research, writing, coding, analysis, creative projects, and answering questions across a wide range of topics. What would you like to explore today?"
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    const words = randomResponse.split(" ");
    
    const assistantMessageId = generateUniqueId();
    
    // Add initial empty message
    setChats(prevChats => prevChats.map(chat => {
      if (chat.id === activeChatId) {
        return {
          ...chat,
          messages: [...chat.messages, {
            id: assistantMessageId,
            content: "",
            role: "assistant",
            timestamp: new Date(),
            isStreaming: true
          }]
        };
      }
      return chat;
    }));

    // Simulate streaming by adding words progressively
    for (let i = 0; i <= words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
      
      setChats(prevChats => prevChats.map(chat => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            messages: chat.messages.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: words.slice(0, i).join(" "), isStreaming: i < words.length }
                : msg
            )
          };
        }
        return chat;
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !activeChatId) return;

    const userMessage: Message = {
      id: generateUniqueId(),
      content: input.trim(),
      role: "user",
      timestamp: new Date()
    };
    
    const isNewChat = activeChat && activeChat.messages.length === 0;

    setChats(prevChats => prevChats.map(chat => {
      if (chat.id === activeChatId) {
        const newTitle = isNewChat ? input.trim() : chat.title;
        return {
          ...chat,
          title: newTitle.length > 30 ? newTitle.substring(0, 27) + "..." : newTitle,
          messages: [...chat.messages, userMessage]
        };
      }
      return chat;
    }));

    setInput("");
    setIsLoading(true);

    try {
      await simulateStreamingResponse(input.trim());
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    const newChatId = chats.length > 0 ? Math.max(...chats.map(c => c.id)) + 1 : 1;
    const newChat: Chat = {
      id: newChatId,
      title: "New Chat",
      date: "Today",
      messages: []
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChatId);
  };

  const handleSelectChat = (chatToSelect: Chat) => {
    setActiveChatId(chatToSelect.id);
  };
  
  const handleDeleteChat = (chatIdToDelete: number) => {
    const remainingChats = chats.filter(c => c.id !== chatIdToDelete);
    setChats(remainingChats);
    if (activeChatId === chatIdToDelete) {
      setActiveChatId(remainingChats.length > 0 ? remainingChats[0].id : null);
    }
  };

  const suggestedQuestions = [
    "What is artificial intelligence?",
    "How do large language models work?",
    "Explain quantum computing",
    "What are the latest trends in AI?"
  ];

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <>
      <AppSidebar 
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        chats={chats}
        activeChatId={activeChatId}
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
              {messages.length === 0 ? (
                <WelcomeScreen 
                  suggestedQuestions={suggestedQuestions}
                  onQuestionSelect={(question) => {
                    if (!activeChat) {
                      handleNewChat();
                    }
                    setInput(question);
                  }}
                />
              ) : (
                <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
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
