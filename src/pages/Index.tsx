import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { AppSidebar, SidebarInset, SidebarTrigger } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/AppSidebar";
import { Separator } from "@/components/ui/separator";
import ChatView, { ChatViewRef } from "@/components/ChatView";
import ApiKeyManager from "@/components/ApiKeyManager";
import UserProfileDialog from "@/components/UserProfileDialog";
import SettingsDialog from "@/components/SettingsDialog";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { createChat, getChats, getChat, updateChat, deleteChat, assignChatToFolder, getFolders, createFolder, getTags, createTag, assignTagToChat, removeTagFromChat } from "@/services/chatService";
import { createMessage, getMessages, updateMessage, deleteMessage } from "@/services/messageService";
import { getProviders, getModels } from '@/services/modelProviderService';
import type { Folder, Chat, Tag } from "@/services/chatService";

export interface Message {
  id: string;
  chat_id: string;
  user_id: string;
  created_at: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  model?: string;
  usage?: { prompt_tokens: number; completion_tokens: number };
  isStreaming?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "Explain the theory of relativity.",
  "What are the main differences between JavaScript and Python?",
  "How does blockchain technology work?",
  "Describe the plot of Hamlet.",
  "What are the benefits of meditation?",
];

const Index = () => {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showApiKeyManager, setShowApiKeyManager] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  const [chats, setChats] = useState<Chat[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [chatTags, setChatTags] = useState<Tag[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
	const [selectedProvider, setSelectedProvider] = useState<string>('');
	const [availableModels, setAvailableModels] = useState<any[]>([]);
	const [selectedModel, setSelectedModel] = useState<string>('');
	const [isLoadingProviders, setIsLoadingProviders] = useState(false);
	const [isLoadingModels, setIsLoadingModels] = useState(false);
	const [modelError, setModelError] = useState<string | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useProfile();
  const chatViewRef = useRef<ChatViewRef>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const initialChatId = searchParams.get('chatId');
    if (initialChatId) {
      setActiveChatId(initialChatId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;

    const loadInitialData = async () => {
      await loadChats();
      await loadFolders();
      await loadTags();
      await loadProviders();
    };

    loadInitialData();
  }, [user]);

  useEffect(() => {
		if (!selectedProvider) return;

		const loadModels = async () => {
			setIsLoadingModels(true);
			setModelError(null);
			try {
				const models = await getModels(selectedProvider);
				setAvailableModels(models);
				if (models && models.length > 0) {
					setSelectedModel(models[0].id);
				} else {
					setSelectedModel('');
				}
			} catch (error: any) {
				console.error("Error fetching models:", error);
				setModelError(error.message || "Failed to load models.");
				setAvailableModels([]);
				setSelectedModel('');
			} finally {
				setIsLoadingModels(false);
			}
		};

		loadModels();
	}, [selectedProvider]);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const loadedMessages = await getMessages(activeChatId);
        setMessages(loadedMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error",
          description: "Failed to load messages. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [activeChatId, toast]);

  useEffect(() => {
    if (!activeChatId) {
      setChatTags([]);
      return;
    }

    const loadChatTags = async () => {
      setIsLoadingTags(true);
      try {
        const chat = await getChat(activeChatId);
        setChatTags(chat?.tags || []);
      } catch (error) {
        console.error("Error fetching chat tags:", error);
        toast({
          title: "Error",
          description: "Failed to load chat tags. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingTags(false);
      }
    };

    loadChatTags();
  }, [activeChatId, toast]);

  const loadChats = async () => {
    setIsLoadingChats(true);
    try {
      const loadedChats = await getChats();
      setChats(loadedChats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      toast({
        title: "Error",
        description: "Failed to load chats. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingChats(false);
    }
  };

  const loadFolders = async () => {
    setIsLoadingFolders(true);
    try {
      const loadedFolders = await getFolders();
      setFolders(loadedFolders);
    } catch (error) {
      console.error("Error fetching folders:", error);
      toast({
        title: "Error",
        description: "Failed to load folders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingFolders(false);
    }
  };

  const loadTags = async () => {
    setIsLoadingTags(true);
    try {
      const loadedTags = await getTags();
      setTags(loadedTags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      toast({
        title: "Error",
        description: "Failed to load tags. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingTags(false);
    }
  };

  const loadProviders = async () => {
		setIsLoadingProviders(true);
		try {
			const providers = await getProviders();
			setAvailableProviders(providers);
			if (providers && providers.length > 0) {
				setSelectedProvider(providers[0]);
			}
		} catch (error: any) {
			console.error("Error fetching providers:", error);
			toast({
				title: "Error",
				description: error.message || "Failed to load providers.",
				variant: "destructive"
			});
		} finally {
			setIsLoadingProviders(false);
		}
	};

  const createNewChat = async () => {
    setIsLoading(true);
    try {
      const newChat = await createChat();
      setActiveChatId(newChat.id);
      setChats(prevChats => [...prevChats, newChat]);
      setInput("");
      setMessages([]);
    } catch (error) {
      console.error("Error creating chat:", error);
      toast({
        title: "Error",
        description: "Failed to create new chat. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeChatId) return;

    const userMessage = {
      chat_id: activeChatId,
      user_id: user?.id,
      role: 'user',
      content: input.trim(),
    } as Omit<Message, 'id' | 'created_at'>;

    setInput("");
    setIsAiResponding(true);

    try {
      const newMessage = await createMessage(userMessage);
      setMessages(prevMessages => [...prevMessages, newMessage]);
      await handleAIResponse([newMessage], newMessage.content);
    } catch (error) {
      console.error("Error creating message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
      setIsAiResponding(false);
    }
  };

  const handleAIResponse = async (userMessages: Message[], userContent: string) => {
    if (!activeChatId) return;

    setIsAiResponding(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: activeChatId,
          message: userContent,
          userMessages: userMessages,
          provider: selectedProvider,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate response');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const aiMessage = {
        chat_id: activeChatId,
        user_id: 'ai',
        role: 'assistant',
        content: data.content,
        provider: selectedProvider,
        model: selectedModel,
        usage: data.usage,
      } as Omit<Message, 'id' | 'created_at'>;

      const newAiMessage = await createMessage(aiMessage);
      setMessages(prevMessages => [...prevMessages, newAiMessage]);
    } catch (error: any) {
      console.error("Error processing AI response:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAiResponding(false);
    }
  };

  const handleSelectChat = async (chatId: string) => {
    setActiveChatId(chatId);
  };

  const handleUpdateChatTitle = async (chatId: string, title: string) => {
    try {
      await updateChat(chatId, { title });
      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === chatId ? { ...chat, title } : chat
        )
      );
    } catch (error) {
      console.error("Error updating chat title:", error);
      toast({
        title: "Error",
        description: "Failed to update chat title. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteChat(chatId);
      setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
      if (activeChatId === chatId) {
        setActiveChatId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast({
        title: "Error",
        description: "Failed to delete chat. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAssignChatToFolder = async (folderId: string) => {
    if (!activeChatId) return;

    try {
      await assignChatToFolder(activeChatId, folderId);
      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === activeChatId ? { ...chat, folder_id: folderId } : chat
        )
      );
    } catch (error) {
      console.error("Error assigning chat to folder:", error);
      toast({
        title: "Error",
        description: "Failed to assign chat to folder. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCreateFolder = async (name: string) => {
    try {
      const newFolder = await createFolder(name);
      setFolders(prevFolders => [...prevFolders, newFolder]);
    } catch (error) {
      console.error("Error creating folder:", error);
      toast({
        title: "Error",
        description: "Failed to create folder. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAssignTagToChat = async (tagId: string) => {
    if (!activeChatId) return;

    try {
      await assignTagToChat(activeChatId, tagId);
      setChatTags(prevChatTags => [...prevChatTags, tags.find(tag => tag.id === tagId)!]);
    } catch (error) {
      console.error("Error assigning tag to chat:", error);
      toast({
        title: "Error",
        description: "Failed to assign tag to chat. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveTagFromChat = async (tagId: string) => {
    if (!activeChatId) return;

    try {
      await removeTagFromChat(activeChatId, tagId);
      setChatTags(prevChatTags => prevChatTags.filter(tag => tag.id !== tagId));
    } catch (error) {
      console.error("Error removing tag from chat:", error);
      toast({
        title: "Error",
        description: "Failed to remove tag from chat. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCreateTag = async (name: string, color?: string) => {
    try {
      const newTag = await createTag(name, color);
      setTags(prevTags => [...prevTags, newTag]);
    } catch (error) {
      console.error("Error creating tag:", error);
      toast({
        title: "Error",
        description: "Failed to create tag. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSelectProvider = (provider: string) => {
		setSelectedProvider(provider);
	};

	const handleSelectModel = (model: string) => {
		setSelectedModel(model);
	};

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!activeChatId) return;

    try {
      const messageToDelete = messages.find(m => m.id === messageId);
      if (!messageToDelete) return;

      // Find all messages after this one (including potential assistant response)
      const messageIndex = messages.findIndex(m => m.id === messageId);
      const messagesToDelete = [messageToDelete];
      
      // If deleting a user message, also delete the following assistant message if it exists
      if (messageToDelete.role === 'user' && messageIndex + 1 < messages.length) {
        const nextMessage = messages[messageIndex + 1];
        if (nextMessage.role === 'assistant') {
          messagesToDelete.push(nextMessage);
        }
      }
      // If deleting an assistant message, also delete the preceding user message if it exists
      else if (messageToDelete.role === 'assistant' && messageIndex - 1 >= 0) {
        const prevMessage = messages[messageIndex - 1];
        if (prevMessage.role === 'user') {
          messagesToDelete.unshift(prevMessage);
        }
      }

      // Delete from backend
      for (const msg of messagesToDelete) {
        await deleteMessage(msg.id);
      }

      // Update local state
      setMessages(prev => prev.filter(m => !messagesToDelete.some(del => del.id === m.id)));

      // Clear editing state if we're deleting the message being edited
      if (editingMessageId && messagesToDelete.some(m => m.id === editingMessageId)) {
        setEditingMessageId(null);
        setEditingContent("");
      }

    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditMessage = (messageId: string) => {
    // Prevent editing if another edit is in progress
    if (editingMessageId && editingMessageId !== messageId) {
      toast({
        title: "Edit in progress",
        description: "Please finish or cancel the current edit before starting a new one.",
      });
      return;
    }

    const messageToEdit = messages.find(m => m.id === messageId);
    if (!messageToEdit) return;

    // For assistant messages, find and edit the previous user message instead
    if (messageToEdit.role === 'assistant') {
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex > 0) {
        const previousMessage = messages[messageIndex - 1];
        if (previousMessage.role === 'user') {
          setEditingMessageId(previousMessage.id);
          setEditingContent(previousMessage.content);
        }
      }
    } else {
      setEditingMessageId(messageId);
      setEditingContent(messageToEdit.content);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editingContent.trim() || !activeChatId) return;

    try {
      // Update the message content
      await updateMessage(editingMessageId, editingContent.trim());
      
      // Find the message index
      const messageIndex = messages.findIndex(m => m.id === editingMessageId);
      if (messageIndex === -1) return;

      // Update local state
      const updatedMessages = [...messages];
      updatedMessages[messageIndex].content = editingContent.trim();
      
      // Remove any assistant messages that come after this user message
      const messagesToKeep = updatedMessages.slice(0, messageIndex + 1);
      setMessages(messagesToKeep);

      // Clear editing state
      setEditingMessageId(null);
      setEditingContent("");

      // Auto-generate new response
      const newUserMessage = updatedMessages[messageIndex];
      await handleAIResponse([newUserMessage], newUserMessage.content);

    } catch (error) {
      console.error('Error updating message:', error);
      toast({
        title: "Error",
        description: "Failed to update message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent("");
  };

  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const [darkMode, setDarkMode] = useState(isDarkMode);

  useEffect(() => {
    // Check initial state on mount
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);

    // Listen for changes
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.attributeName === 'class') {
          const isDark = (mutation.target as HTMLElement).classList.contains('dark');
          setDarkMode(isDark);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const toggleDarkMode = () => {
    const html = document.documentElement;
    const newMode = !darkMode;

    if (newMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    setDarkMode(newMode);
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="chat-container">
        <AppSidebar 
          chats={chats}
          activeChatId={activeChatId}
          isLoading={isLoadingChats}
          onSelectChat={handleSelectChat}
          onCreateNewChat={createNewChat}
          onUpdateChatTitle={handleUpdateChatTitle}
          onDeleteChat={handleDeleteChat}
          folders={folders}
          isLoadingFolders={isLoadingFolders}
        />
        
        <SidebarInset className="flex flex-col w-full overflow-hidden">
          <header className="flex h-12 sm:h-14 shrink-0 items-center gap-1 sm:gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-2 sm:px-4">
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <SidebarTrigger 
                className="-ml-1 h-6 w-6 sm:h-8 sm:w-8 hover:bg-muted rounded-sm transition-colors" 
                onClick={() => setShowSidebar(!showSidebar)}
              />
              <Separator orientation="vertical" className="mr-1 sm:mr-2 h-4" />
            </div>
            
            <Header 
              isDarkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
              availableProviders={availableProviders}
              selectedProvider={selectedProvider}
              onSelectProvider={handleSelectProvider}
              availableModels={availableModels}
              selectedModel={selectedModel}
              onSelectModel={handleSelectModel}
              isLoadingProviders={isLoadingProviders}
              isLoadingModels={isLoadingModels}
              modelError={modelError}
              folders={folders}
              isLoadingFolders={isLoadingFolders}
              onAssignChatToFolder={handleAssignChatToFolder}
              activeChat={chats.find(chat => chat.id === activeChatId)}
              tags={tags}
              chatTags={chatTags}
              isLoadingTags={isLoadingTags}
              onAssignTagToChat={handleAssignTagToChat}
              onRemoveTagFromChat={handleRemoveTagFromChat}
              onCreateFolder={handleCreateFolder}
              onCreateTag={handleCreateTag}
              onOpenSettings={handleOpenSettings}
            />
          </header>

          <ChatView
            ref={chatViewRef}
            messages={messages}
            isLoading={isLoading}
            isAiResponding={isAiResponding}
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            onNewChat={createNewChat}
            suggestedQuestions={SUGGESTED_QUESTIONS}
            activeChatId={activeChatId}
            editingMessageId={editingMessageId}
            editingContent={editingContent}
            setEditingContent={setEditingContent}
            onEditMessage={handleEditMessage}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onDeleteMessage={handleDeleteMessage}
          />
        </SidebarInset>

        <ApiKeyManager 
          isOpen={showApiKeyManager} 
          onClose={() => setShowApiKeyManager(false)} 
        />
        
        <UserProfileDialog 
          isOpen={showUserProfile} 
          onClose={() => setShowUserProfile(false)} 
        />
        
        <SettingsDialog 
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      </div>
    </SidebarProvider>
  );
};

export default Index;
