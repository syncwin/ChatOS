
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
  onStop?: () => void;
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
  onCancelRewrite: () => void;
  onRetryRewrite: (messageId: string) => void;
  onClearRewriteError: () => void;
  isRewriting: boolean;
  rewriteError: string | null;
  rewritingMessageId: string | null;
  timeoutError: boolean;
  canCancel: boolean;
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
  onStop,
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
  onCancelRewrite,
  onRetryRewrite,
  onClearRewriteError,
  isRewriting,
  rewriteError,
  rewritingMessageId,
  timeoutError,
  canCancel,
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
  
  // Remove duplicates and sort by creation time to ensure proper chronological order
  // This prevents React key warnings and ensures user messages appear before AI responses
  // even when state updates occur out of order due to race conditions
  const uniqueMessages = messages
    .filter((msg, index, arr) => arr.findIndex(m => m.id === msg.id) === index)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  
  const showWelcomeScreen = uniqueMessages.length === 0 && !isLoading && !isAiResponding;
  const isInputLoading = isLoading || isAiResponding;

  return (
    <>
      {/* Chat Content Area */}
      <main className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
        {showWelcomeScreen ? (
          <div className="flex-1 flex w-full max-w-4xl mx-auto px-4 sm:px-5 md:px-6 overflow-hidden">
            <WelcomeScreen 
              suggestedQuestions={suggestedQuestions}
              onQuestionSelect={onQuestionSelect}
            />
          </div>
        ) : (
          <ScrollArea className="flex-1 w-full">
            <div className="w-full max-w-4xl mx-auto py-1 xs:py-2 sm:py-4 px-4 sm:px-5 md:px-6">
              <div className="space-y-2 xs:space-y-3 sm:space-y-4 lg:space-y-6 w-full">

                {(() => {
                  // Group messages into user-assistant pairs to prevent jumping
                  // This ensures user messages always appear first, followed by their responses
                  const messageGroups: Array<{ user: typeof uniqueMessages[0]; assistant?: typeof uniqueMessages[0] }> = [];
                  const processedAssistantIds = new Set<string>();
                  
                  for (let i = 0; i < uniqueMessages.length; i++) {
                    const message = uniqueMessages[i];
                    
                    if (message.role === 'user') {
                      // Find the corresponding assistant message (next assistant message after this user message)
                      const assistantMessage = uniqueMessages.find((msg, idx) => 
                        idx > i && msg.role === 'assistant' && 
                        new Date(msg.created_at).getTime() > new Date(message.created_at).getTime() &&
                        !processedAssistantIds.has(msg.id)
                      );
                      
                      if (assistantMessage) {
                        processedAssistantIds.add(assistantMessage.id);
                      }
                      
                      messageGroups.push({
                        user: message,
                        assistant: assistantMessage
                      });
                    }
                  }
                  
                  // Handle any standalone assistant messages that weren't paired
                  const standaloneAssistants = uniqueMessages.filter(msg => 
                    msg.role === 'assistant' && !processedAssistantIds.has(msg.id)
                  );
                  
                  // Add standalone assistant messages as separate groups (shouldn't happen in normal flow)
                  standaloneAssistants.forEach(assistantMsg => {
                    messageGroups.push({
                      user: null as any, // This shouldn't happen in normal chat flow
                      assistant: assistantMsg
                    });
                  });
                  
                  return messageGroups.map((group) => (
                    <React.Fragment key={group.user?.id || group.assistant?.id}>
                      {/* User Message - Always rendered first (if exists) */}
                      {group.user && (
                        <div className="w-full">
                          <ChatMessage 
                            message={group.user}
                            messages={uniqueMessages}
                            isEditing={editingMessageId === group.user.id}
                            editingContent={editingContent}
                            setEditingContent={setEditingContent}
                            onEditMessage={onEditMessage}
                            onSaveEdit={onSaveEdit}
                            onCancelEdit={onCancelEdit}
                            onDeleteMessage={onDeleteMessage}
                            onRewrite={onRewrite}
                            onCancelRewrite={onCancelRewrite}
                            onRetryRewrite={onRetryRewrite}
                            onClearRewriteError={onClearRewriteError}
                            isRewriting={isRewriting}
                            rewriteError={rewriteError}
                            rewritingMessageId={rewritingMessageId}
                            timeoutError={timeoutError}
                            canCancel={canCancel}
                            messageVariations={messageVariations[group.user.id] || []}
                            currentVariationIndex={currentVariationIndex[group.user.id] || 0}
                            onVariationChange={(index) => onVariationChange(group.user.id, index)}
                          />
                        </div>
                      )}
                      
                      {/* Assistant Message or Streaming Indicator - Always rendered below user message */}
                      {group.assistant && (
                        <div className="w-full">
                          <ChatMessage 
                            message={group.assistant}
                            messages={uniqueMessages}
                            isEditing={editingMessageId === group.assistant.id}
                            editingContent={editingContent}
                            setEditingContent={setEditingContent}
                            onEditMessage={onEditMessage}
                            onSaveEdit={onSaveEdit}
                            onCancelEdit={onCancelEdit}
                            onDeleteMessage={onDeleteMessage}
                            onRewrite={onRewrite}
                            onCancelRewrite={onCancelRewrite}
                            onRetryRewrite={onRetryRewrite}
                            onClearRewriteError={onClearRewriteError}
                            isRewriting={isRewriting}
                            rewriteError={rewriteError}
                            rewritingMessageId={rewritingMessageId}
                            timeoutError={timeoutError}
                            canCancel={canCancel}
                            messageVariations={messageVariations[group.assistant.id] || []}
                            currentVariationIndex={currentVariationIndex[group.assistant.id] || 0}
                            onVariationChange={(index) => onVariationChange(group.assistant.id, index)}
                          />
                        </div>
                      )}
                    </React.Fragment>
                  ));
                })()}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </ScrollArea>
        )}
      </main>

      {/* Sticky Footer Input Area */}
      <footer className="flex-shrink-0 sticky bottom-0 backdrop-blur-sm">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-5 md:px-6">
          <InputArea 
            ref={inputAreaRef}
            input={input}
            setInput={setInput}
            onSubmit={onSubmit}
            onStop={onStop}
            isLoading={isInputLoading}
            isAiResponding={isAiResponding}
          />
        </div>
      </footer>
    </>
  );
});

ChatView.displayName = 'ChatView';

export default ChatView;
