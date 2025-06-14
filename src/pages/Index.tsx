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

const mockStreamingResponse = async (updateFn: (chunk: string) => void) => {
  const mockResponse = "This is a mock response from the AI. Since no API key is provided, this is a placeholder to demonstrate the streaming functionality. Please add your Google Gemini API key in the settings to get real responses.";
  const chunks = mockResponse.split(" ");
  for (const chunk of chunks) {
    await new Promise(resolve => setTimeout(resolve, 50));
    updateFn(chunk + " ");
  }
};

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

  const handleStreamingResponse = async (messagesForApi: Message[]) => {
    const apiKey = localStorage.getItem("gemini_api_key");
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

    if (!apiKey) {
      toast.info("Using mock response", {
        description: "No API key found. Add one in settings for real AI responses.",
      });

      const updateFn = (token: string) => {
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
      };
      
      await mockStreamingResponse(updateFn);
      
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
      setIsLoading(false);
      return;
    }

    const geminiMessages = messagesForApi.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:streamGenerateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: geminiMessages,
          safetySettings: [
            { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE" },
            { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE" },
            { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE" },
            { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE" }
          ]
        }),
      });

      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || `HTTP error! Status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        // Attempt to process line-by-line. This is speculative for Gemini's stream format.
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim().length < 2) continue; // Skip empty lines or brackets

          try {
            // Clean up chunk before parsing
            let cleanedLine = line.trim();
            if (cleanedLine.startsWith(',')) cleanedLine = cleanedLine.substring(1);
            if (cleanedLine.endsWith(',')) cleanedLine = cleanedLine.slice(0, -1);

            const parsed = JSON.parse(cleanedLine);
            const token = parsed.candidates?.[0]?.content?.parts?.[0]?.text;

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
            console.error("Error parsing stream chunk:", error, `LINE: "${line}"`);
          }
        }
      }
    } catch (error) {
      console.error("Error calling Google Gemini API:", error);
      const errorContent = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error("Failed to get response from Gemini.");
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
        setIsLoading(false);
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
    const messagesForApi = [...(activeChat?.messages || []), userMessage];

    setChats(prevChats => prevChats.map(chat => {
      if (chat.id === activeChatId) {
        const newTitle = isNewChat ? input.trim() : chat.title;
        return {
          ...chat,
          title: newTitle.length > 30 ? newTitle.substring(0, 27) + "..." : newTitle,
          messages: messagesForApi
        };
      }
      return chat;
    }));

    setInput("");
    setIsLoading(true);

    try {
      await handleStreamingResponse(messagesForApi);
    } catch (error) {
      console.error("Error:", error);
      toast.error("An unexpected error occurred.");
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
      <SidebarInset className={isDarkMode ? "dark" : ""}>
        <div className="min-h-screen bg-background text-foreground">
          <div className="container mx-auto max-w-4xl h-screen flex flex-col">
            <div className="flex items-center gap-2 p-4 border-b border-border">
              <SidebarTrigger className="text-foreground/80 hover:text-foreground" />
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
                    // This is a bit of a hack to make sure the state updates before we submit
                    setTimeout(() => {
                        const form = document.querySelector('form');
                        if (form) {
                            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                        }
                    }, 0);
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
