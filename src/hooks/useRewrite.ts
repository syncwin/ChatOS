import { useState, useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { generateAIResponse } from '@/services/aiProviderService';
import { saveMessage, updateMessage, createMessageVariation } from '@/services/chatService';
import type { Message } from '@/pages/Index';

interface UseRewriteProps {
  activeChatId: string | null;
  messages: Message[];
  selectedProvider: string;
  selectedModel: string;
  isGuest: boolean;
  user: any;
}

interface RewriteState {
  isRewriting: boolean;
  rewriteError: string | null;
  rewritingMessageId: string | null;
  timeoutError: boolean;
  canCancel: boolean;
}

export const useRewrite = ({
  activeChatId,
  messages,
  selectedProvider,
  selectedModel,
  isGuest,
  user
}: UseRewriteProps) => {
  const queryClient = useQueryClient();
  const [rewriteState, setRewriteState] = useState<RewriteState>({
    isRewriting: false,
    rewriteError: null,
    rewritingMessageId: null,
    timeoutError: false,
    canCancel: false
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount or when activeChatId changes
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [activeChatId]);

  const handleRewrite = useCallback(async (messageId: string) => {
    // Guard against concurrent rewrites or missing chat ID
    if (!activeChatId || rewriteState.isRewriting) {
      console.log('Rewrite blocked: Already rewriting or missing chat ID');
      return;
    }

    const targetMessage = messages.find(msg => msg.id === messageId);
    if (!targetMessage || targetMessage.role !== 'assistant') {
      toast.error('Can only rewrite assistant messages');
      return;
    }

    // Check authentication for non-guest users
    if (!isGuest && !user) {
      toast.error('Please sign in to use the rewrite feature');
      return;
    }

    // Clear any existing timeout and abort controller
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    // Update state to show we're rewriting
    setRewriteState({
      isRewriting: true,
      rewriteError: null,
      rewritingMessageId: messageId,
      timeoutError: false,
      canCancel: false
    });
    
    // Set timeout for long-running requests (30 seconds)
    timeoutRef.current = setTimeout(() => {
      setRewriteState(prev => ({
        ...prev,
        timeoutError: true,
        canCancel: true
      }));
    }, 30000); // 30 seconds timeout

    try {
      // Check if request was cancelled
      if (signal.aborted) {
        throw new Error('Request was cancelled');
      }
      
      // Find the conversation context up to this message
      const messageIndex = messages.findIndex(msg => msg.id === messageId);
      const contextMessages = messages.slice(0, messageIndex);
      
      // Find the user message that corresponds to this assistant message
      // Instead of assuming position, we filter for user messages and sort chronologically
      // This ensures we find the correct user message even after deduplication/reordering
      const userMessages = contextMessages
        .filter(msg => msg.role === 'user')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      // Take the most recent user message before this assistant message
      const userMessage = userMessages[userMessages.length - 1];
      
      if (!userMessage) {
        throw new Error('Could not find the user message for this response');
      }

      // Log request details in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Rewrite request:', {
          messageId,
          provider: selectedProvider,
          model: selectedModel,
          contextLength: contextMessages.length,
          userMessage: userMessage.content.substring(0, 100) + '...'
        });
      }

      // Generate new response with timeout handling
      const newContent = await generateAIResponse(
        contextMessages,
        selectedProvider,
        selectedModel
      );
      
      // Check if request was cancelled during generation
      if (signal.aborted) {
        throw new Error('Request was cancelled');
      }
      
      // Log response in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Rewrite response:', {
          messageId,
          contentLength: newContent?.length || 0,
          preview: newContent?.substring(0, 100) + '...'
        });
      }

      if (!newContent.trim()) {
        throw new Error('Generated response is empty');
      }

      // Create variation data
      const variationData = {
        message_id: messageId,
        content: newContent,
        model: selectedModel,
        provider: selectedProvider,
        created_at: new Date().toISOString()
      };

      let savedVariation;
      if (!isGuest) {
        // Save variation to database for authenticated users
        savedVariation = await createMessageVariation(
          messageId,
          newContent,
          selectedModel,
          selectedProvider
        );
      } else {
        // For guest users, create a temporary variation
        savedVariation = {
          id: `temp-variation-${Date.now()}`,
          ...variationData
        };
      }

      // Update the message content optimistically with duplicate prevention
      queryClient.setQueryData<Message[]>(['messages', activeChatId], (oldData: Message[] = []) => {
        // Ensure no duplicates exist before updating
        const uniqueMessages = oldData.filter((msg, index, arr) => 
          arr.findIndex(m => m.id === msg.id) === index
        );
        
        return uniqueMessages.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: newContent }
            : msg
        );
      });

      // Update message variations in the UI
      queryClient.setQueryData(['messageVariations', messageId], (oldVariations: any[] = []) => {
        return [...oldVariations, savedVariation];
      });

      // If not guest, update the message in the database
      if (!isGuest && savedVariation) {
        await updateMessage(messageId, { content: newContent });
      }

      toast.success('Message rewritten successfully');
      
    } catch (error) {
      console.error('Rewrite error:', error);
      
      // Don't show error if request was cancelled
      if (signal.aborted || (error instanceof Error && error.message === 'Request was cancelled')) {
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to rewrite message';
      
      // Try to save error state to localStorage as fallback
      try {
        const errorData = {
          messageId,
          error: errorMessage,
          timestamp: new Date().toISOString(),
          chatId: activeChatId
        };
        const existingErrors = JSON.parse(localStorage.getItem('rewrite_errors') || '[]');
        existingErrors.push(errorData);
        // Keep only last 10 errors
        if (existingErrors.length > 10) {
          existingErrors.splice(0, existingErrors.length - 10);
        }
        localStorage.setItem('rewrite_errors', JSON.stringify(existingErrors));
      } catch (storageError) {
        console.warn('Failed to save error to localStorage:', storageError);
      }
      
      setRewriteState(prev => ({
        ...prev,
        rewriteError: errorMessage,
        timeoutError: false
      }));
      
      toast.error(errorMessage);
    } finally {
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Clear abort controller
      if (abortControllerRef.current) {
        abortControllerRef.current = null;
      }
      
      setRewriteState(prev => ({
        ...prev,
        isRewriting: false,
        rewritingMessageId: null,
        canCancel: false
      }));
    }
  }, [
    activeChatId,
    messages,
    selectedProvider,
    selectedModel,
    isGuest,
    user,
    rewriteState.isRewriting,
    queryClient
  ]);

  const clearRewriteError = useCallback(() => {
    setRewriteState(prev => ({
      ...prev,
      rewriteError: null,
      timeoutError: false
    }));
  }, []);

  const cancelRewrite = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setRewriteState(prev => ({
      ...prev,
      isRewriting: false,
      rewritingMessageId: null,
      canCancel: false,
      timeoutError: false
    }));
    
    toast.info('Rewrite cancelled');
  }, []);

  const retryRewrite = useCallback((messageId: string) => {
    clearRewriteError();
    handleRewrite(messageId);
  }, [clearRewriteError, handleRewrite]);

  return {
    ...rewriteState,
    handleRewrite,
    clearRewriteError,
    cancelRewrite,
    retryRewrite
  };
};