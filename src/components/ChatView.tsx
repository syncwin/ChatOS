
import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import WelcomeScreen from "@/components/WelcomeScreen";
import ChatMessage from "@/components/ChatMessage";
import InputArea from "@/components/InputArea";
import type { Message as MessageType } from "@/pages/Index";

interface ChatViewProps {
  messages: MessageType[];
  isLoading: boolean;
  isAiResponding: boolean;
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onNewChat: () => void;
  activeChatId: string | null;
}

const suggestedQuestions = [
  "What is artificial intelligence?",
  "How do large language models work?",
  "Explain quantum computing",
  "What are the latest trends in AI?"
];

const ChatView = ({ 
  messages, 
  isLoading, 
  isAiResponding, 
  input, 
  setInput, 
  onSubmit,
  onNewChat,
  activeChatId,
}: ChatViewProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiResponding]);

  const onQuestionSelect = (question: string) => {
    if (!activeChatId) {
      onNewChat();
    }
    setInput(question);
  };
  
  const showWelcomeScreen = messages.length === 0 && !isLoading && !isAiResponding;
  const isInputLoading = isLoading || isAiResponding;

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {showWelcomeScreen ? (
        <div className="container mx-auto max-w-4xl flex-1 flex">
          <WelcomeScreen 
            suggestedQuestions={suggestedQuestions}
            onQuestionSelect={onQuestionSelect}
          />
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="container mx-auto max-w-4xl py-4">
            <div className="space-y-6">
              {messages.map((message) => (
                <ChatMessage 
                  key={message.id} 
                  message={message} 
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </ScrollArea>
      )}

      <div className="container mx-auto max-w-4xl">
        <InputArea 
          input={input}
          setInput={setInput}
          onSubmit={onSubmit}
          isLoading={isInputLoading}
        />
      </div>
    </main>
  );
};

export default ChatView;
