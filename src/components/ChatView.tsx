
import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatMessage from "./ChatMessage";
import InputArea from "./InputArea";
import WelcomeScreen from "./WelcomeScreen";
import type { Message } from "@/pages/Index";

export interface ChatViewRef {
  scrollToInput: () => void;
}

interface ChatViewProps {
  messages: Message[];
  isLoading: boolean;
  isAiResponding: boolean;
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onNewChat: () => void;
  suggestedQuestions: string[];
  activeChatId: string | null;
  editingMessageId: string | null;
  editingContent: string;
  setEditingContent: (value: string) => void;
  onEditMessage: (messageId: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDeleteMessage: (messageId: string) => void;
}

const ChatView = forwardRef<ChatViewRef, ChatViewProps>(({ 
  messages,
  isLoading,
  isAiResponding,
  input,
  setInput,
  onSubmit,
  onNewChat,
  suggestedQuestions,
  activeChatId,
  editingMessageId,
  editingContent,
  setEditingContent,
  onEditMessage,
  onSaveEdit,
  onCancelEdit,
  onDeleteMessage
}, ref) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToInput = () => {
    inputAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  useImperativeHandle(ref, () => ({
    scrollToInput
  }));

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
    <main className="flex-1 flex flex-col h-full w-full overflow-hidden">
      {showWelcomeScreen ? (
        <div className="flex-1 flex w-full px-2 sm:px-4 overflow-hidden">
          <WelcomeScreen 
            suggestedQuestions={suggestedQuestions}
            onQuestionSelect={onQuestionSelect}
          />
        </div>
      ) : (
        <ScrollArea className="flex-1 w-full overflow-hidden">
          <div className="w-full max-w-4xl mx-auto py-2 sm:py-4 px-2 sm:px-4">
            <div className="space-y-4 sm:space-y-6 w-full">
              {messages.map((message) => (
                <div key={message.id} className="w-full max-w-full overflow-hidden">
                  <ChatMessage 
                    message={message}
                    isEditing={editingMessageId === message.id}
                    editingContent={editingContent}
                    setEditingContent={setEditingContent}
                    onEditMessage={onEditMessage}
                    onSaveEdit={onSaveEdit}
                    onCancelEdit={onCancelEdit}
                    onDeleteMessage={onDeleteMessage}
                  />
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </ScrollArea>
      )}

      <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 flex-shrink-0">
        <InputArea 
          ref={inputAreaRef}
          input={input}
          setInput={setInput}
          onSubmit={onSubmit}
          isLoading={isInputLoading}
        />
      </div>
    </main>
  );
});

ChatView.displayName = 'ChatView';

export default ChatView;
