import { useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { useRef, useState, useEffect } from 'react';
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import Header from "@/components/Header";
import AppSidebar from "@/components/AppSidebar";
import ChatView, { ChatViewRef } from "@/components/ChatView";
import { useChat } from "@/hooks/useChat";
import { useAIProvider } from "@/hooks/useAIProvider";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import type { ChatMessage } from "@/services/aiProviderService";
import type { NewMessage, Message as DbMessage, MessageVariation } from "@/services/chatService";
import { createMessageVariation, getMessageVariations, setActiveVariation } from "@/services/chatService";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

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

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Enhanced mobile reload handling
  useEffect(() => {
    const handleReloadState = () => {
      const savedChatId = sessionStorage.getItem('activeChatId');
      const isMobile = window.innerWidth < 768;
      
      if (savedChatId && !activeChatId && chats.length > 0) {
        const chatExists = chats.find(chat => chat.id === savedChatId);
        if (chatExists) {
          // Force set active chat on mobile after reload
          if (isMobile) {
            setTimeout(() => {
              setActiveChatId(savedChatId);
            }, 100);
          } else {
            setActiveChatId(savedChatId);
          }
        }
      }
    };

    handleReloadState();
  }, [chats, activeChatId, setActiveChatId]);

  // Enhanced sessionStorage persistence
  useEffect(() => {
    if (activeChatId) {
      sessionStorage.setItem('activeChatId', activeChatId);
      // Also store timestamp for mobile reload detection
      sessionStorage.setItem('activeChatTimestamp', Date.now().toString());
    } else {
      sessionStorage.removeItem('activeChatId');
      sessionStorage.removeItem('activeChatTimestamp');
    }
  }, [activeChatId]);

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

    let currentChatId = activeChatId;

    if (!currentChatId) {
      try {
        const newChat = await createChatAsync(message);
        currentChatId = newChat.id;
      } catch (error) {
        toast.error("Could not start a new chat. Please try again.");
        setInput(message);
        return;
      }
    } else if (messages.length === 0) {
      const title = message.length > 30 ? message.substring(0, 27) + "..." : message;
      updateChatTitle({ chatId: currentChatId, title: title });
    }

    if (!currentChatId) return;

    const userMessage: NewMessage = {
      chat_id: currentChatId,
      content: message,
      role: 'user',
    };
    addMessageMutation(userMessage);

    const historyForAI: ChatMessage[] = [
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    const assistantId = uuidv4();
    const assistantPlaceholder: Message = {
      id: assistantId,
      chat_id: currentChatId,
      content: '',
      role: 'assistant',
      created_at: new Date().toISOString(),
      isStreaming: true,
      user_id: user?.id || '',
      model: selectedModel,
      provider: selectedProvider,
      usage: null,
    };
    
    // Optimistically add placeholder
    queryClient.setQueryData<Message[]>(['messages', currentChatId], (oldData: Message[] = []) => [
      ...oldData,
      assistantPlaceholder
    ]);

    let finalContent = "";
    const controller = new AbortController();
    setAbortController(controller);

    try {
      await streamMessage(
        historyForAI,
        (delta) => { // onDelta
          finalContent += delta;
          queryClient.setQueryData<Message[]>(['messages', currentChatId], (oldData: Message[] = []) =>
            oldData.map(msg => 
              msg.id === assistantId ? { ...msg, content: finalContent } : msg
            )
          );
        },
        (usage) => { // onComplete
          console.log('Creating final assistant message with:', {
            provider: selectedProvider,
            model: selectedModel,
            usage: usage
          });
          const finalAssistantMessage: NewMessage = {
            chat_id: currentChatId!,
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
          // Replace placeholder with final message from DB
          addMessageMutation(finalAssistantMessage, {
            onSuccess: (savedMessage) => {
              // Update UI with the saved message, replacing the placeholder
              queryClient.setQueryData<Message[]>(['messages', currentChatId], (oldData: Message[] = []) =>
                oldData.map(msg => 
                  msg.id === assistantId ? { ...savedMessage, isStreaming: false } : msg
                )
              );
            }
          });
          setAbortController(null);
        },
        (error) => { // onError
          if (error.name === 'AbortError') {
            // Handle user cancellation - save interrupted message to database
            const interruptedMessage: NewMessage = {
              chat_id: currentChatId!,
              content: finalContent || '', // Save whatever content was generated before interruption
              role: 'assistant',
              provider: selectedProvider,
              model: selectedModel,
              usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
            };
            
            // Save to database so it can be used as parent for rewrite
            addMessageMutation(interruptedMessage, {
              onSuccess: (savedMessage) => {
                // Update UI with the saved message ID and error state
                queryClient.setQueryData<Message[]>(['messages', currentChatId], (oldData: Message[] = []) =>
                  oldData.map(msg => 
                    msg.id === assistantId 
                      ? { 
                          ...savedMessage,
                          error: 'Generation was stopped by user.',
                          isStreaming: false 
                        }
                      : msg
                  )
                );
              },
              onError: () => {
                // Fallback to UI-only update if database save fails
                queryClient.setQueryData<Message[]>(['messages', currentChatId], (oldData: Message[] = []) =>
                  oldData.map(msg => 
                    msg.id === assistantId 
                      ? { 
                          ...msg, 
                          content: finalContent || '', 
                          error: 'Generation was stopped by user.',
                          isStreaming: false 
                        }
                      : msg
                  )
                );
              }
            });
          } else {
            toast.error(`Error from AI: ${error.message}`);
            // Save error message to database so it can be used as parent for rewrite
            const errorMessage: NewMessage = {
              chat_id: currentChatId!,
              content: finalContent || '', // Save whatever content was generated before error
              role: 'assistant',
              provider: selectedProvider,
              model: selectedModel,
              usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
            };
            
            addMessageMutation(errorMessage, {
              onSuccess: (savedMessage) => {
                // Update UI with the saved message ID and error state
                queryClient.setQueryData<Message[]>(['messages', currentChatId], (oldData: Message[] = []) =>
                  oldData.map(msg => 
                    msg.id === assistantId 
                      ? { 
                          ...savedMessage,
                          error: `Failed to generate response: ${error.message}`,
                          isStreaming: false 
                        }
                      : msg
                  )
                );
              },
              onError: () => {
                // Fallback to UI-only update if database save fails
                queryClient.setQueryData<Message[]>(['messages', currentChatId], (oldData: Message[] = []) =>
                  oldData.map(msg => 
                    msg.id === assistantId 
                      ? { 
                          ...msg, 
                          content: finalContent || '', 
                          error: `Failed to generate response: ${error.message}`,
                          isStreaming: false 
                        }
                      : msg
                  )
                );
              }
            });
          }
          setAbortController(null);
        },
        controller.signal
      );
    } catch (error) {
      setAbortController(null);
      throw error;
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
      queryClient.setQueryData<Message[]>(['messages', activeChatId], (oldData: Message[] = []) => [
        ...oldData,
        assistantPlaceholder
      ]);
      
      let finalContent = "";
      
      await streamMessage(
        historyForAI,
        (delta) => {
          finalContent += delta;
          queryClient.setQueryData<Message[]>(['messages', activeChatId], (oldData: Message[] = []) =>
            oldData.map(msg => 
              msg.id === assistantId ? { ...msg, content: finalContent } : msg
            )
          );
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
              queryClient.setQueryData<Message[]>(['messages', activeChatId], (oldData: Message[] = []) =>
                oldData.map(msg => 
                  msg.id === assistantId ? { ...savedMessage, isStreaming: false } : msg
                )
              );
            }
          });
        },
        (error) => {
          toast.error(`Error from AI: ${error.message}`);
          queryClient.setQueryData<Message[]>(['messages', activeChatId], (oldData: Message[] = []) =>
            oldData.filter(msg => msg.id !== assistantId)
          );
        }
      );
    }
  };

  // Rewrite functionality handlers
  const handleRewrite = async (messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (!message || message.role !== 'assistant' || !activeChatId) return;

    // Check if user is in guest mode
    if (isGuest) {
      toast.error('Rewrite functionality is not available in guest mode. Please sign in to use this feature.');
      return;
    }

    // Check if user is authenticated
    if (!user) {
      toast.error('You must be signed in to use the rewrite feature.');
      return;
    }

    // Find the conversation history up to this message
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    const historyForAI: ChatMessage[] = messages
      .slice(0, messageIndex)
      .map(m => ({ role: m.role, content: m.content }));

    // Add the user message that prompted this assistant response
    const userMessage = messages[messageIndex - 1];
    if (userMessage && userMessage.role === 'user') {
      historyForAI.push({ role: 'user', content: userMessage.content });
    }

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

    // Add placeholder for the new variation
    queryClient.setQueryData<Message[]>(['messages', activeChatId], (oldData: Message[] = []) => [
      ...oldData,
      assistantPlaceholder
    ]);

    let finalContent = "";

    await streamMessage(
      historyForAI,
      (delta) => {
        finalContent += delta;
        queryClient.setQueryData<Message[]>(['messages', activeChatId], (oldData: Message[] = []) =>
          oldData.map(msg => 
            msg.id === assistantId ? { ...msg, content: finalContent } : msg
          )
        );
      },
      async (usage) => {
        try {
          // Create the message variation in the database
          const variationId = await createMessageVariation(
            messageId,
            finalContent,
            selectedModel,
            selectedProvider,
            usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
          );

          if (variationId) {
            // Load all variations for this message
            const variations = await getMessageVariations(messageId);
            setMessageVariations(prev => ({
              ...prev,
              [messageId]: variations
            }));

            // Set the new variation as active
            const newVariationIndex = variations.length - 1;
            setCurrentVariationIndex(prev => ({
              ...prev,
              [messageId]: newVariationIndex
            }));

            // Update the message content to show the new variation with provider/model info
            const newVariation = variations[newVariationIndex];
            queryClient.setQueryData<Message[]>(['messages', activeChatId], (oldData: Message[] = []) =>
              oldData.map(msg => 
                msg.id === messageId ? { 
                  ...msg, 
                  content: finalContent,
                  provider: newVariation?.provider || selectedProvider,
                  model: newVariation?.model || selectedModel,
                  usage: newVariation?.usage || usage
                } : msg
              ).filter(msg => msg.id !== assistantId) // Remove placeholder
            );

            toast.success('New variation created successfully!');
          }
        } catch (error) {
          // Remove placeholder on error
          queryClient.setQueryData<Message[]>(['messages', activeChatId], (oldData: Message[] = []) =>
            oldData.filter(msg => msg.id !== assistantId)
          );
          
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('Failed to create message variation for message:', {
            messageId,
            selectedModel,
            selectedProvider,
            contentLength: finalContent?.length,
            usage,
            error: errorMessage
          });
          
          toast.error(`Failed to create message variation: ${errorMessage}`);
        }
      },
      (error) => {
        toast.error(`Error generating rewrite: ${error.message}`);
        // Remove placeholder on error
        queryClient.setQueryData<Message[]>(['messages', activeChatId], (oldData: Message[] = []) =>
          oldData.filter(msg => msg.id !== assistantId)
        );
      }
    );
  };

  const handleVariationChange = async (messageId: string, newIndex: number) => {
    const variations = messageVariations[messageId];
    if (!variations || newIndex < 0 || newIndex >= variations.length) return;

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

    // Update the active variation in the database
    const success = await setActiveVariation(messageId, newIndex);
    if (success) {
      // Update local state
      setCurrentVariationIndex(prev => ({
        ...prev,
        [messageId]: newIndex
      }));

      // Update the message with all variation data in the UI
      const selectedVariation = variations[newIndex];
      queryClient.setQueryData<Message[]>(['messages', activeChatId], (oldData: Message[] = []) =>
        oldData.map(msg => 
          msg.id === messageId ? { 
            ...msg, 
            content: selectedVariation.content,
            provider: selectedVariation.provider || msg.provider,
            model: selectedVariation.model || msg.model,
            usage: selectedVariation.usage || msg.usage,
            created_at: selectedVariation.created_at || msg.created_at
          } : msg
        )
      );
    } else {
      console.error('Failed to switch variation:', {
        messageId,
        newIndex,
        variationsLength: variations.length,
        hasVariations: !!variations
      });
      toast.error('Failed to switch variation. Check console for details.');
    }
  };

  // Load message variations when messages change
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

      const assistantMessages = messages.filter(msg => msg.role === 'assistant');
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
                  indexData[message.id] = activeVariation ? activeVariation.variation_index : 0;
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

    if (messages.length > 0) {
      loadVariations();
    }
  }, [messages, isGuest, user]);

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
    <>
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
          <div className="w-full max-w-4xl mx-auto flex items-center gap-1 xs:gap-2 px-1 xs:px-2 sm:px-4 py-1 xs:py-2 sm:py-4">
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
                messages={messages}
                onCreateFolder={createFolder}
                onCreateTag={createTag}
                onOpenSettings={handleOpenSettings}
              />
            </div>
          </header>

          <ChatView
          ref={chatViewRef}
          messages={messages}
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
          messageVariations={messageVariations}
          currentVariationIndex={currentVariationIndex}
          onVariationChange={handleVariationChange}
        />
        </div>
      </SidebarInset>
    </>
  );
};

export default Index;
