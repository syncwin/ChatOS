import { useRef, useState, useEffect, useMemo } from 'react';
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import Header from "@/components/Header";
import AppSidebar from "@/components/AppSidebar";
import ChatView, { ChatViewRef } from "@/components/ChatView";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useChat } from "@/hooks/useChat";
import { useAIProvider } from "@/hooks/useAIProvider";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useChatPersistence } from "@/hooks/useChatPersistence";
import { useRewrite } from "@/hooks/useRewrite";
import type { ChatMessage } from "@/services/aiProviderService";
import type { NewMessage, Message as DbMessage, MessageVariation } from "@/services/chatService";
import { createMessageVariation, getMessageVariations, setActiveVariation } from "@/services/chatService";
import { 
  ensureChatExists,
  addUserMessage,
  createAssistantPlaceholder,
  prepareChatHistory,
  validateMessageSending,
  createDeltaHandler,
  createCompletionHandler,
  createErrorHandler,
  type MessageOperationContext
} from "@/services/messageOperationsService";
import { MessageQueueService } from "@/services/messageQueueService";
import { RetryService } from "@/services/retryService";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { logger, measurePerformance } from "@/lib/logger";
import { performanceMonitor } from "@/lib/performance";
import { useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';

export type Message = DbMessage & { isStreaming?: boolean };

const Index = () => {
  const { user, isGuest } = useAuth();
  const { profile, updateProfile } = useProfile();
  const queryClient = useQueryClient();
  const chatViewRef = useRef<ChatViewRef>(null);
  const isLoadingVariationsRef = useRef(false);
  const {
    chats,
    isLoadingChats,
    folders,
    isLoadingFolders,
    tags,
    isLoadingTags,
    chatTags,
    activeChatId,
    setActiveChatId,
    messages: dbMessages,
    isLoadingMessages,
    createChatAsync,
    addMessage: addMessageMutation,
    updateChatTitle,
    deleteMessage,
    deleteMessagePair,
    updateChatPinStatus,
    createFolder,
    updateFolder,
    deleteFolder,
    assignChatToFolder,
    createTag,
    updateTag,
    deleteTag,
    assignTagToChat,
    removeTagFromChat,
    deleteChat,
    checkAndAddErrorBubbleForGuest,
  } = useChat();

  const messages: Message[] = dbMessages;
  
  // Suggested questions for welcome screen
  const suggestedQuestions = [
    "What is artificial intelligence?",
    "How do large language models work?",
    "Compare AI agents and agentic AI",
    "What are the latest trends in AI?"
  ];
  
  // Edit functionality state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  
  // Message variations state
  const [messageVariations, setMessageVariations] = useState<Record<string, MessageVariation[]>>({});
  const [currentVariationIndex, setCurrentVariationIndex] = useState<Record<string, number>>({});

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
    isLoadingModels,
    modelError,
  } = useAIProvider();

  const [input, setInput] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const isDarkMode = profile?.theme !== 'light'; // Default to dark theme

  // Chat persistence hook
  const { isHydrated } = useChatPersistence({
    activeChatId,
    messages,
    setActiveChatId,
    chats
  });



  // Create sorted messages for consistent state across components
  // This ensures proper chronological order and prevents rewrite association issues
  // by providing the same deduplicated and sorted message array to all components
  const sortedMessages = useMemo(() => {
    return messages
      .filter((msg, index, arr) => arr.findIndex(m => m.id === msg.id) === index) // Remove duplicates
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); // Sort chronologically
  }, [messages]);

  // Rewrite functionality hook
  const {
    isRewriting,
    rewriteError,
    rewritingMessageId,
    timeoutError,
    canCancel,
    handleRewrite,
    clearRewriteError,
    cancelRewrite,
    retryRewrite
  } = useRewrite({
    activeChatId,
    messages: sortedMessages,
    selectedProvider,
    selectedModel,
    isGuest,
    user
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Restore active chat ID on component mount
  useEffect(() => {
    const savedChatId = sessionStorage.getItem('activeChatId');
    if (savedChatId && !activeChatId && chats.length > 0) {
      const chatExists = chats.find(chat => chat.id === savedChatId);
      if (chatExists) {
        setActiveChatId(savedChatId);
      }
    }
  }, [chats, activeChatId, setActiveChatId]);

  // Removed problematic automatic error bubble creation that was causing conflicts
  // Error handling is now properly managed in the sendMessage function

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isAiResponding) return;
    if (!user && !isGuest) return;

    setInput("");
    await sendMessage(trimmedInput);
  };

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  };

  const sendMessage = async (message: string) => {
    try {
      // Get current messages for validation
      const currentMessages = queryClient.getQueryData<Message[]>(['messages', activeChatId]) || [];
      
      // Validate message sending conditions
      validateMessageSending(
        message,
        isAiResponding,
        activeChatId,
        selectedProvider,
        selectedModel,
        currentMessages
      );

      logger.messageFlow('Message send initiated', '', {
        messageLength: message.length,
        activeChatId,
        provider: selectedProvider,
        model: selectedModel
      });

      // Create operation context
      const context: MessageOperationContext = {
        queryClient,
        user,
        selectedProvider,
        selectedModel,
        activeChatId,
        messages,
        setActiveChatId,
        setAbortController,
        updateChatTitle,
        addMessageMutation,
        streamMessage
      };

      // Ensure chat exists (create new or use existing)
      const chatId = await ensureChatExists(message, activeChatId, context);
      
      // Add user message
      addUserMessage(message, chatId, context);
      
      // Create assistant placeholder
      const { assistantId, placeholder } = createAssistantPlaceholder(chatId, context);
      
      // Prepare chat history for AI
      const historyForAI = prepareChatHistory(messages, message);
      
      // Set up abort controller
      const controller = new AbortController();
      setAbortController(controller);
      
      // Create handlers for streaming
      const { onDelta, getFinalContent } = createDeltaHandler(assistantId, chatId, context);
      const onComplete = createCompletionHandler(assistantId, chatId, context, getFinalContent);
      const onError = createErrorHandler(assistantId, chatId, context, getFinalContent);
      
      logger.apiCall('Starting AI stream', selectedProvider, selectedModel, {
        messageId: assistantId,
        chatId,
        historyLength: historyForAI.length
      });
      
      // Stream AI response with retry logic
      await RetryService.retryNetworkOperation(async () => {
        await performanceMonitor.measureAsync(
          'ai_stream_response',
          async () => {
            await streamMessage(
              historyForAI,
              onDelta,
              onComplete,
              onError,
              controller.signal
            );
          }
        );
      });
      
    } catch (error) {
      setAbortController(null);
      
      if (error instanceof Error) {
        logger.error('Message sending failed', error, {
          messageLength: message.length,
          activeChatId,
          provider: selectedProvider,
          model: selectedModel
        });
        
        // Show user-friendly error message
        if (error.message.includes('AI is currently responding')) {
          // Don't show toast for this case, it's expected behavior
          return;
        }
        
        toast.error(error.message);
        
        // Restore input if message failed to send
        if (error.message.includes('Could not start a new chat') || 
            error.message.includes('Message cannot be empty') ||
            error.message.includes('Please select a provider')) {
          setInput(message);
        }
      } else {
        logger.error('Unknown error during message sending', new Error(String(error)));
        toast.error('An unexpected error occurred. Please try again.');
        setInput(message);
      }
    }
  };
  
  const handleNewChat = () => {
    setActiveChatId(null);
    sessionStorage.removeItem('activeChatId');
  };

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
  };

  // Format chats for the sidebar - include tag information
  const sidebarChats = chats.map((chat) => ({
    ...chat,
    date: formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true }),
    messages: [], // Not needed for sidebar
    tags: [], // Tags will be loaded separately per chat when needed
  }));

  const handleSelectChat = (chat: { id: string }) => {
    setActiveChatId(chat.id);
  };

  // Edit functionality handlers
  const handleEditMessage = (messageId: string) => {
    const clickedMessage = messages.find(msg => msg.id === messageId);
    
    if (!clickedMessage) return;
    
    let messageToEdit;
    
    if (clickedMessage.role === 'user') {
      // Direct edit of user message
      messageToEdit = clickedMessage;
    } else if (clickedMessage.role === 'assistant') {
      // For assistant messages, find the previous user message
      const messageIndex = messages.findIndex(msg => msg.id === messageId);
      const previousUserMessage = messages.slice(0, messageIndex).reverse().find(msg => msg.role === 'user');
      messageToEdit = previousUserMessage;
    }
    
    if (messageToEdit) {
      setEditingMessageId(messageToEdit.id);
      setEditingContent(messageToEdit.content);
      // Scroll to input area after a short delay to ensure the edit UI is rendered
      setTimeout(() => {
        chatViewRef.current?.scrollToInput();
      }, 100);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editingContent.trim()) return;
    
    const trimmedContent = editingContent.trim();
    const messageIndex = messages.findIndex(msg => msg.id === editingMessageId);
    
    if (messageIndex === -1) return;
    
    // Find the assistant message that follows this user message
    const assistantMessageIndex = messageIndex + 1;
    const hasAssistantResponse = assistantMessageIndex < messages.length && 
                                messages[assistantMessageIndex].role === 'assistant';
    
    // Update the user message content
    const updatedUserMessage = { ...messages[messageIndex], content: trimmedContent };
    
    // Update messages in the query cache
    const updatedMessages = [...messages];
    updatedMessages[messageIndex] = updatedUserMessage;
    
    // If there's an assistant response, remove it as we'll regenerate
    if (hasAssistantResponse) {
      updatedMessages.splice(assistantMessageIndex, 1);
    }
    
    queryClient.setQueryData<Message[]>(['messages', activeChatId], updatedMessages);
    
    // Clear edit state
    setEditingMessageId(null);
    setEditingContent('');
    
    // Regenerate AI response with the edited message
    if (activeChatId) {
      const historyForAI: ChatMessage[] = updatedMessages
        .slice(0, messageIndex + 1)
        .map(m => ({ role: m.role, content: m.content }));
      
      const assistantId = uuidv4();
      const assistantPlaceholder: Message = {
        id: assistantId,
        chat_id: activeChatId,
        content: '',
        role: 'assistant',
        created_at: new Date().toISOString(),
        isStreaming: true,
        user_id: user?.id || '',
        model: selectedModel,
        provider: selectedProvider,
        usage: null,
      };
      
      // Add placeholder
      queryClient.setQueryData<Message[]>(['messages', activeChatId], (oldData: Message[] = []) => {
        // Ensure we don't create duplicates by filtering out any existing duplicates first
        const uniqueMessages = oldData.filter((msg, index, arr) => 
          arr.findIndex(m => m.id === msg.id) === index
        );
        
        // Only add placeholder if it doesn't already exist
        const placeholderExists = uniqueMessages.some(msg => msg.id === assistantPlaceholder.id);
        if (placeholderExists) {
          return uniqueMessages;
        }
        
        return [
          ...uniqueMessages,
          assistantPlaceholder
        ];
      });
      
      let finalContent = "";
      
      await streamMessage(
        historyForAI,
        (delta) => {
          finalContent += delta;
          queryClient.setQueryData<Message[]>(['messages', activeChatId], (oldData: Message[] = []) => {
            // Ensure we don't create duplicates by filtering out any existing duplicates first
            const uniqueMessages = oldData.filter((msg, index, arr) => 
              arr.findIndex(m => m.id === msg.id) === index
            );
            
            return uniqueMessages.map(msg => 
              msg.id === assistantId ? { ...msg, content: finalContent } : msg
            );
          });
        },
        (usage) => {
          const finalAssistantMessage: NewMessage = {
            chat_id: activeChatId!,
            content: finalContent,
            role: 'assistant',
            provider: selectedProvider,
            model: selectedModel,
            usage: usage || {
              prompt_tokens: 0,
              completion_tokens: 0,
              total_tokens: 0
            }
          };
          addMessageMutation(finalAssistantMessage, {
            onSuccess: (savedMessage) => {
              // Update UI with the saved message, replacing the placeholder
              queryClient.setQueryData<Message[]>(['messages', activeChatId], (oldData: Message[] = []) => {
                // Ensure we don't create duplicates by filtering out any existing duplicates first
                const uniqueMessages = oldData.filter((msg, index, arr) => 
                  arr.findIndex(m => m.id === msg.id) === index
                );
                
                return uniqueMessages.map(msg => 
                  msg.id === assistantId ? { ...savedMessage, isStreaming: false } : msg
                );
              });
            }
          });
        },
        (error) => {
          toast.error(`Error from AI: ${error.message}`);
          queryClient.setQueryData<Message[]>(['messages', activeChatId], (oldData: Message[] = []) => {
            // Ensure we don't create duplicates by filtering out any existing duplicates first
            const uniqueMessages = oldData.filter((msg, index, arr) => 
              arr.findIndex(m => m.id === msg.id) === index
            );
            
            return uniqueMessages.filter(msg => msg.id !== assistantId);
          });
        },
        undefined // signal parameter - no abort controller for rewrite
      );
    }
  };

  // Duplicate useRewrite hook removed - using the one defined earlier

  // Variation change handler - this could be moved to the rewrite hook in the future
  const handleVariationChange = async (messageId: string, newIndex: number) => {
    const variations = messageVariations[messageId];
    if (!variations || newIndex < 0 || newIndex >= variations.length) {
      console.warn('handleVariationChange: Invalid variation index or no variations found', {
        messageId,
        newIndex,
        variationsLength: variations?.length || 0
      });
      return;
    }

    // Check if user is in guest mode
    if (isGuest) {
      toast.error('Variation navigation is not available in guest mode. Please sign in to use this feature.');
      return;
    }

    // Check if user is authenticated
    if (!user) {
      toast.error('You must be signed in to use variation navigation.');
      return;
    }

    // Optimistically update local state first for immediate UI feedback
    setCurrentVariationIndex(prev => ({
      ...prev,
      [messageId]: newIndex
    }));

    const selectedVariation = variations[newIndex];
    
    // Optimistically update the message content in the UI with duplicate prevention
    queryClient.setQueryData<Message[]>(['messages', activeChatId], (oldData: Message[] = []) => {
      // Ensure no duplicates exist before updating
      const uniqueMessages = oldData.filter((msg, index, arr) => 
        arr.findIndex(m => m.id === msg.id) === index
      );
      
      return uniqueMessages.map(msg => 
        msg.id === messageId ? { 
          ...msg, 
          content: selectedVariation.content,
          provider: selectedVariation.provider || msg.provider,
          model: selectedVariation.model || msg.model,
          usage: selectedVariation.usage || msg.usage,
          created_at: selectedVariation.created_at || msg.created_at
        } : msg
      );
    });

    // Update the active variation in the database
    try {
      const success = await setActiveVariation(messageId, newIndex);
      if (!success) {
        // Revert optimistic update on failure
        const previousIndex = Object.keys(currentVariationIndex).includes(messageId) 
          ? currentVariationIndex[messageId] 
          : 0;
        
        setCurrentVariationIndex(prev => ({
          ...prev,
          [messageId]: previousIndex
        }));
        
        const previousVariation = variations[previousIndex];
        queryClient.setQueryData<Message[]>(['messages', activeChatId], (oldData: Message[] = []) => {
          // Ensure no duplicates exist before reverting
          const uniqueMessages = oldData.filter((msg, index, arr) => 
            arr.findIndex(m => m.id === msg.id) === index
          );
          
          return uniqueMessages.map(msg => 
            msg.id === messageId ? { 
              ...msg, 
              content: previousVariation.content,
              provider: previousVariation.provider || msg.provider,
              model: previousVariation.model || msg.model,
              usage: previousVariation.usage || msg.usage
            } : msg
          );
        });
        
        console.error('Failed to switch variation:', {
          messageId,
          newIndex,
          variationsLength: variations.length,
          hasVariations: !!variations
        });
        toast.error('Failed to switch variation. Please try again.');
      }
    } catch (error) {
      console.error('Error switching variation:', error);
      toast.error('An error occurred while switching variations.');
    }
  };

  // Load message variations when messages change - TODO: Move to variations hook
  useEffect(() => {
    const loadVariations = async () => {
      // Prevent repeated calls
      if (isLoadingVariationsRef.current) {
        return;
      }
      
      // Only load variations for authenticated users
      if (isGuest || !user) {
        setMessageVariations({});
        setCurrentVariationIndex({});
        return;
      }
      
      isLoadingVariationsRef.current = true;

      const assistantMessages = messages.filter(msg => msg.role === 'assistant' && msg.id);
      const variationsData: Record<string, MessageVariation[]> = {};
      const indexData: Record<string, number> = {};
      let hasErrors = false;

      try {
        // Process messages in batches to avoid overwhelming the API
        const batchSize = 5;
        for (let i = 0; i < assistantMessages.length; i += batchSize) {
          const batch = assistantMessages.slice(i, i + batchSize);
          
          await Promise.allSettled(
            batch.map(async (message) => {
              try {
                if (!message.id) {
                  console.warn('loadVariations: Message missing ID:', message);
                  return;
                }
                
                const variations = await getMessageVariations(message.id);
                if (variations.length > 0) {
                  variationsData[message.id] = variations;
                  const activeVariation = variations.find(v => v.is_active_variation);
                  const activeIndex = activeVariation ? activeVariation.variation_index : 0;
                  indexData[message.id] = activeIndex;
                  
                  // Update message content with active variation to ensure persistence after reload
                  if (activeVariation && activeVariation.content !== message.content) {
                    queryClient.setQueryData<Message[]>(['messages', activeChatId], (oldData: Message[] = []) => {
                      // Ensure we don't create duplicates by filtering out any existing duplicates first
                      const uniqueMessages = oldData.filter((msg, index, arr) => 
                        arr.findIndex(m => m.id === msg.id) === index
                      );
                      
                      return uniqueMessages.map(msg => 
                        msg.id === message.id ? { 
                          ...msg, 
                          content: activeVariation.content,
                          provider: activeVariation.provider || msg.provider,
                          model: activeVariation.model || msg.model,
                          usage: activeVariation.usage || msg.usage
                        } : msg
                      );
                    });
                  }
                }
              } catch (error) {
                console.error(`Failed to load variations for message ${message.id}:`, error);
                hasErrors = true;
              }
            })
          );
        }

        setMessageVariations(variationsData);
        setCurrentVariationIndex(indexData);
        
        if (hasErrors) {
          console.warn('Some message variations failed to load. Check console for details.');
        }
      } catch (error) {
         console.error('Critical error in loadVariations:', error);
         // Reset state on critical error
         setMessageVariations({});
         setCurrentVariationIndex({});
       } finally {
         isLoadingVariationsRef.current = false;
       }
     };

    if (messages.length > 0 && isHydrated) {
      loadVariations();
    }
  }, [messages, isGuest, user, isHydrated, activeChatId, queryClient]);

  // Helper function to find message pairs (user input + assistant output)
  const findMessagePair = (messages: Message[], targetMessageId: string): string[] => {
    const targetIndex = messages.findIndex(msg => msg.id === targetMessageId);
    if (targetIndex === -1) return [targetMessageId];
    
    const targetMessage = messages[targetIndex];
    const messagesToDelete: string[] = [];
    
    if (targetMessage.role === 'user') {
      // If user message, find the next assistant message
      messagesToDelete.push(targetMessage.id);
      if (targetIndex + 1 < messages.length && messages[targetIndex + 1].role === 'assistant') {
        messagesToDelete.push(messages[targetIndex + 1].id);
      }
    } else if (targetMessage.role === 'assistant') {
      // If assistant message, find the previous user message
      if (targetIndex > 0 && messages[targetIndex - 1].role === 'user') {
        messagesToDelete.push(messages[targetIndex - 1].id);
      }
      messagesToDelete.push(targetMessage.id);
    }
    
    return messagesToDelete;
  };

  const handleDeleteMessage = async (messageId: string) => {
    // Store the original messages for potential rollback
    const originalMessages = queryClient.getQueryData<Message[]>(['messages', activeChatId]);
    
    if (!originalMessages) return;
    
    // Find all messages in the pair to delete
    const messageIdsToDelete = findMessagePair(originalMessages, messageId);
    
    try {
      // Optimistically remove the message pair from the UI
      const updatedMessages = originalMessages.filter(msg => !messageIdsToDelete.includes(msg.id));
      queryClient.setQueryData<Message[]>(['messages', activeChatId], updatedMessages);
      
      // Delete all messages in the pair using the efficient batch delete
        if (messageIdsToDelete.length > 1) {
          await deleteMessagePair(messageIdsToDelete);
        } else {
          await deleteMessage(messageIdsToDelete[0]);
        }
    } catch (error) {
      // If deletion fails, restore the original messages
      queryClient.setQueryData<Message[]>(['messages', activeChatId], originalMessages);
      toast.error('Failed to delete message pair');
    }
  };

  const activeChat = chats.find(c => c.id === activeChatId);

  const handleAssignChatToFolder = (folderId: string) => {
    if (activeChatId) {
      assignChatToFolder({ chatId: activeChatId, folderId: folderId === 'none' ? null : folderId });
    }
  };

  const handleAssignTagToChat = (tagId: string) => {
    if (activeChatId) {
      assignTagToChat({ chatId: activeChatId, tagId });
    }
  };

  const handleRemoveTagFromChat = (tagId: string) => {
    if (activeChatId) {
      removeTagFromChat({ chatId: activeChatId, tagId });
    }
  };

  const isLoading = isLoadingChats || isLoadingMessages || isLoadingFolders;

  const toggleDarkMode = () => {
    if (profile) {
      updateProfile({ theme: isDarkMode ? 'light' : 'dark' });
    }
  };

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        logger.error('React Error Boundary caught error in Index component', error, {
          componentStack: errorInfo.componentStack,
          activeChatId,
          messagesCount: messages.length,
          isAiResponding,
          selectedProvider,
          selectedModel
        });
      }}
    >
      <AppSidebar 
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        chats={sidebarChats}
        folders={folders}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        createFolder={createFolder}
        updateFolder={updateFolder}
        deleteFolder={deleteFolder}
        tags={tags}
        createTag={createTag}
        updateTag={updateTag}
        deleteTag={deleteTag}
        onOpenSettings={handleOpenSettings}
      />
      <SidebarInset>
        <div className="h-screen flex flex-col w-full overflow-hidden bg-background text-foreground rounded-lg">
          <header className="flex-shrink-0 sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border/50 z-10 rounded-t-lg">
          <div className="w-full max-w-4xl mx-auto flex items-center gap-1 xs:gap-2 gutter-responsive py-1 xs:py-2 sm:py-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md p-1.5 transition-colors flex-shrink-0" aria-label="Toggle sidebar" />
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
                isLoadingModels={isLoadingModels}
                modelError={modelError}
                folders={folders}
                isLoadingFolders={isLoadingFolders}
                activeChat={activeChat}
                onAssignChatToFolder={handleAssignChatToFolder}
                tags={tags}
                chatTags={chatTags}
                isLoadingTags={isLoadingTags}
                onAssignTagToChat={handleAssignTagToChat}
                onRemoveTagFromChat={handleRemoveTagFromChat}
                messages={sortedMessages}
                onCreateFolder={createFolder}
                onCreateTag={createTag}
                onOpenSettings={handleOpenSettings}
              />
            </div>
          </header>



          <ChatView
          ref={chatViewRef}
          messages={sortedMessages}
          isLoading={isLoadingMessages}
          isAiResponding={isAiResponding}
          input={input}
          setInput={setInput}
          onSubmit={handleSubmit}
          onStop={handleStop}
          onNewChat={handleNewChat}
          suggestedQuestions={suggestedQuestions}
          activeChatId={activeChatId}
          editingMessageId={editingMessageId}
          editingContent={editingContent}
          setEditingContent={setEditingContent}
          onEditMessage={handleEditMessage}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={handleCancelEdit}
          onDeleteMessage={handleDeleteMessage}
          onRewrite={handleRewrite}
          onCancelRewrite={cancelRewrite}
          onRetryRewrite={retryRewrite}
          onClearRewriteError={clearRewriteError}
          isRewriting={isRewriting}
          rewriteError={rewriteError}
          rewritingMessageId={rewritingMessageId}
          timeoutError={timeoutError}
          canCancel={canCancel}
          messageVariations={messageVariations}
          currentVariationIndex={currentVariationIndex}
          onVariationChange={handleVariationChange}
        />
        </div>
      </SidebarInset>
    </ErrorBoundary>
  );
};

export default Index;
