import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Message } from '@/pages/Index';
import type { Chat } from '@/services/chatService';

interface ChatPersistenceState {
  activeChatId: string | null;
  messages: Message[];
  timestamp: number;
}

interface UseChatPersistenceProps {
  activeChatId: string | null;
  messages: Message[];
  setActiveChatId: (chatId: string | null) => void;
  chats: Chat[];
}

export const useChatPersistence = ({
  activeChatId,
  messages,
  setActiveChatId,
  chats
}: UseChatPersistenceProps) => {
  const queryClient = useQueryClient();
  const [isHydrated, setIsHydrated] = useState(false);

  // Save chat state to sessionStorage
  useEffect(() => {
    if (!isHydrated) return; // Don't save during initial hydration

    const state: ChatPersistenceState = {
      activeChatId,
      messages,
      timestamp: Date.now()
    };

    if (activeChatId) {
      sessionStorage.setItem('activeChatId', activeChatId);
      sessionStorage.setItem('chatState', JSON.stringify(state));
      sessionStorage.setItem('activeChatTimestamp', Date.now().toString());
    } else {
      sessionStorage.removeItem('activeChatId');
      sessionStorage.removeItem('chatState');
      sessionStorage.removeItem('activeChatTimestamp');
    }
  }, [activeChatId, messages, isHydrated]);

  // Restore chat state on component mount
  useEffect(() => {
    const restoreChatState = () => {
      const savedChatId = sessionStorage.getItem('activeChatId');
      const savedState = sessionStorage.getItem('chatState');
      const isMobile = window.innerWidth < 768;
      
      if (savedChatId && !activeChatId && chats.length > 0) {
        const chatExists = chats.find(chat => chat.id === savedChatId);
        if (chatExists) {
          // Restore messages if available
          if (savedState) {
            try {
              const parsedState: ChatPersistenceState = JSON.parse(savedState);
              const isRecentState = Date.now() - parsedState.timestamp < 5 * 60 * 1000; // 5 minutes
              
              if (isRecentState && parsedState.messages.length > 0) {
                // Hydrate messages in query cache
                queryClient.setQueryData<Message[]>(['messages', savedChatId], parsedState.messages);
                
                // Also invalidate to ensure fresh data including variations
                queryClient.invalidateQueries({ queryKey: ['messages', savedChatId] });
              } else {
                // If state is stale or empty, ensure messages will be fetched from Supabase
                queryClient.removeQueries({ queryKey: ['messages', savedChatId] });
                queryClient.invalidateQueries({ queryKey: ['messages', savedChatId] });
              }
            } catch (error) {
              console.warn('Failed to parse saved chat state:', error);
            }
          }
          
          // Set active chat with mobile-specific timing
          if (isMobile) {
            setTimeout(() => {
              setActiveChatId(savedChatId);
              setIsHydrated(true);
            }, 100);
          } else {
            setActiveChatId(savedChatId);
            setIsHydrated(true);
          }
        } else {
          setIsHydrated(true);
        }
      } else {
        setIsHydrated(true);
      }
    };

    restoreChatState();
  }, [chats, activeChatId, setActiveChatId, queryClient]);

  // Enhanced mobile reload handling
  useEffect(() => {
    const handleReloadState = () => {
      const savedChatId = sessionStorage.getItem('activeChatId');
      const isMobile = window.innerWidth < 768;
      
      if (savedChatId && !activeChatId && chats.length > 0) {
        const chatExists = chats.find(chat => chat.id === savedChatId);
        if (chatExists) {
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

    if (isHydrated) {
      handleReloadState();
    }
  }, [chats, activeChatId, setActiveChatId, isHydrated]);

  return {
    isHydrated
  };
};