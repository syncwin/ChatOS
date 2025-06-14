
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

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdCounter = useRef(0);

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
    setMessages(prev => [...prev, {
      id: assistantMessageId,
      content: "",
      role: "assistant",
      timestamp: new Date(),
      isStreaming: true
    }]);

    // Simulate streaming by adding words progressively
    for (let i = 0; i <= words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
      
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: words.slice(0, i).join(" "), isStreaming: i < words.length }
          : msg
      ));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateUniqueId(),
      content: input.trim(),
      role: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
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
      <AppSidebar isDarkMode={isDarkMode} />
      <SidebarInset>
        <div className={`min-h-screen ${isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900' 
          : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'
        }`}>
          <div className="container mx-auto max-w-4xl h-screen flex flex-col">
            <div className="flex items-center gap-2 p-4">
              <SidebarTrigger className={`${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`} />
              <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              {messages.length === 0 ? (
                <WelcomeScreen 
                  isDarkMode={isDarkMode} 
                  suggestedQuestions={suggestedQuestions}
                  onQuestionSelect={setInput}
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
