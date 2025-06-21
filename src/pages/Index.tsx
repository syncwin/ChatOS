import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from 'uuid';
import { useRef } from 'react';
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import Header from "@/components/Header";
import AppSidebar from "@/components/AppSidebar";
import ChatView, { ChatViewRef } from "@/components/ChatView";
import { useChat } from "@/hooks/useChat";
import { useAIProvider } from "@/hooks/useAIProvider";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import type { ChatMessage } from "@/services/aiProviderService";
import type { NewMessage, Message as DbMessage } from "@/services/chatService";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export type Message = DbMessage & { isStreaming?: boolean };

const Index = () => {
  const { user, isGuest } = useAuth();
  const { profile, updateProfile } = useProfile();
  const queryClient = useQueryClient();
  const chatViewRef = useRef<ChatViewRef>(null);
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
    createFolder,
    updateFolder,
    deleteFolder,
    assignChatToFolder,
    createTag,
    updateTag,
    deleteTag,
    assignTagToChat,
    removeTagFromChat,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isAiResponding) return;
    if (!user && !isGuest) return;

    setInput("");

    let currentChatId = activeChatId;

    if (!currentChatId) {
      try {
        const newChat = await createChatAsync(trimmedInput);
        currentChatId = newChat.id;
      } catch (error) {
        toast.error("Could not start a new chat. Please try again.");
        setInput(trimmedInput);
        return;
      }
    } else if (messages.length === 0) {
      const title = trimmedInput.length > 30 ? trimmedInput.substring(0, 27) + "..." : trimmedInput;
      updateChatTitle({ chatId: currentChatId, title: title });
    }

    if (!currentChatId) return;

    const userMessage: NewMessage = {
      chat_id: currentChatId,
      content: trimmedInput,
      role: 'user',
    };
    addMessageMutation(userMessage);

    const historyForAI: ChatMessage[] = [
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: trimmedInput }
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
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages', currentChatId] });
          }
        });
      },
      (error) => { // onError
        toast.error(`Error from AI: ${error.message}`);
        // Remove placeholder on error
        queryClient.setQueryData<Message[]>(['messages', currentChatId], (oldData: Message[] = []) =>
          oldData.filter(msg => msg.id !== assistantId)
        );
      }
    );
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
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ['messages', activeChatId] });
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
        <div className="min-h-screen min-h-[100dvh] bg-background text-foreground h-screen h-[100dvh] flex flex-col w-full overflow-hidden">
          <header className="py-1 xs:py-2 sm:py-4 flex-shrink-0 sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b">
            <div className="w-full max-w-4xl mx-auto flex items-center gap-1 xs:gap-2 px-1 xs:px-2 sm:px-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground flex-shrink-0" aria-label="Toggle sidebar" />
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
        />
        </div>
      </SidebarInset>
    </>
  );
};

export default Index;
