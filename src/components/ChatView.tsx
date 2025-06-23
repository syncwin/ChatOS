
import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatMessage from "./ChatMessage";
import InputArea from "./InputArea";
import WelcomeScreen from "./WelcomeScreen";
import type { Message } from "@/pages/Index";
import type { MessageVariation } from "@/services/chatService";

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
  onRewrite: (messageId: string) => void;
  messageVariations: Record<string, MessageVariation[]>;
  currentVariationIndex: Record<string, number>;
  onVariationChange: (messageId: string, index: number) => void;
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
  onDeleteMessage,
  onRewrite,
  messageVariations,
  currentVariationIndex,
  onVariationChange
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
    <>
      {/* Chat Content Area */}
      <main className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
        {showWelcomeScreen ? (
          <div className="flex-1 flex w-full max-w-4xl mx-auto px-1 xs:px-2 sm:px-4 overflow-hidden">
            <WelcomeScreen 
              suggestedQuestions={suggestedQuestions}
              onQuestionSelect={onQuestionSelect}
            />
          </div>
        ) : (
          <ScrollArea className="flex-1 w-full">
            <div className="w-full max-w-4xl mx-auto py-1 xs:py-2 sm:py-4 px-1 xs:px-2 sm:px-4">
              <div className="space-y-2 xs:space-y-3 sm:space-y-4 lg:space-y-6 w-full">
                {messages.map((message) => (
                  <div key={message.id} className="w-full">
                    <ChatMessage 
                      message={message}
                      messages={messages}
                      isEditing={editingMessageId === message.id}
                      editingContent={editingContent}
                      setEditingContent={setEditingContent}
                      onEditMessage={onEditMessage}
                      onSaveEdit={onSaveEdit}
                      onCancelEdit={onCancelEdit}
                      onDeleteMessage={onDeleteMessage}
                      onRewrite={onRewrite}
                      messageVariations={messageVariations[message.id] || []}
                      currentVariationIndex={currentVariationIndex[message.id] || 0}
                      onVariationChange={(index) => onVariationChange(message.id, index)}
                    />
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </ScrollArea>
        )}
      </main>

      {/* Sticky Footer Input Area */}
      <footer className="flex-shrink-0 sticky bottom-0 bg-background/90 backdrop-blur-sm border-t border-border/50">
        <div className="w-full max-w-4xl mx-auto px-1 xs:px-2 sm:px-4">
          <InputArea 
            ref={inputAreaRef}
            input={input}
            setInput={setInput}
            onSubmit={onSubmit}
            isLoading={isInputLoading}
          />
        </div>
      </footer>
    </>
  );
});

ChatView.displayName = 'ChatView';

export default ChatView;
