import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
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

  const handleStreamingResponse = async (userMessage: string) => {
    const apiKey = localStorage.getItem("perplexity_api_key");

    if (!apiKey) {
      toast.error("API Key not found", {
        description: "Please add your Perplexity API key in the settings.",
      });
      const assistantMessageId = generateUniqueId();
      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === activeChatId) {
            return {
              ...chat,
              messages: [
                ...chat.messages,
                {
                  id: assistantMessageId,
                  content:
                    "Error: Perplexity API key not set. Please add it in the settings menu.",
                  role: "assistant",
                  timestamp: new Date(),
                  isStreaming: false,
                },
              ],
            };
          }
          return chat;
        })
      );
      return;
    }

    const assistantMessageId = generateUniqueId();

    // Add initial empty message for streaming
    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            messages: [
              ...chat.messages,
              {
                id: assistantMessageId,
                content: "",
                role: "assistant",
                timestamp: new Date(),
                isStreaming: true,
              },
            ],
          };
        }
        return chat;
      })
    );

    try {
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [
            { role: "system", content: "Be precise and concise." },
            { role: "user", content: userMessage },
          ],
          stream: true,
        }),
      });

      if (!response.ok || !response.body) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || `HTTP error! Status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep partial line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonString = line.substring(6);
            if (jsonString === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonString);
              const token = parsed.choices[0]?.delta?.content;

              if (token) {
                setChats((prevChats) =>
                  prevChats.map((chat) => {
                    if (chat.id === activeChatId) {
                      return {
                        ...chat,
                        messages: chat.messages.map((msg) =>
                          msg.id === assistantMessageId
                            ? { ...msg, content: msg.content + token }
                            : msg
                        ),
                      };
                    }
                    return chat;
                  })
                );
              }
            } catch (error) {
              console.error("Error parsing stream chunk:", error, jsonString);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error calling Perplexity API:", error);
      const errorContent = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error("Failed to get response from Perplexity.");
       setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === activeChatId) {
            return {
              ...chat,
              messages: chat.messages.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: `Error: ${errorContent}`, isStreaming: false }
                  : msg
              ),
            };
          }
          return chat;
        })
      );
    } finally {
        setChats((prevChats) =>
            prevChats.map((chat) => {
            if (chat.id === activeChatId) {
                return {
                ...chat,
                messages: chat.messages.map((msg) =>
                    msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
                ),
                };
            }
            return chat;
            })
        );
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
      await handleStreamingResponse(input.trim());
    } catch (error) {
      console.error("Error:", error);
      toast.error("An unexpected error occurred.");
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
        <div className={`min-h-screen ${isDarkMode 
          ? 'bg-black' 
          : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'
        }`}>
          <div className="container mx-auto max-w-4xl h-screen flex flex-col">
            <div className="flex items-center gap-2 p-4">
              <SidebarTrigger className={`${isDarkMode ? 'text-white hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}`} />
              <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              {messages.length === 0 ? (
                <WelcomeScreen 
                  isDarkMode={isDarkMode} 
                  suggestedQuestions={suggestedQuestions}
                  onQuestionSelect={(question) => {
                    if (!activeChat) {
                       const newChatId = chats.length > 0 ? Math.max(...chats.map(c => c.id)) + 1 : 1;
                        const newChat: Chat = {
                          id: newChatId,
                          title: "New Chat",
                          date: "Today",
                          messages: []
                        };
                        setChats(prev => [newChat, ...prev]);
                        setActiveChatId(newChatId);
                    }
                    setInput(question);
                  }}
                />
              ) : (
                <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <ChatMessage 
                        key={message.id} 
                        message={message} 
                        isDarkMode={isDarkMode} 
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
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
};

export default Index;
