import { useState, useCallback } from 'react';

// Message state types for better type safety
export type MessageState = 
  | { type: 'idle' }
  | { type: 'streaming'; content: string; progress?: number }
  | { type: 'completed'; content: string; usage?: { prompt_tokens: number; completion_tokens: number; total_tokens?: number } }
  | { type: 'error'; error: string; retryable: boolean }
  | { type: 'cancelled'; partialContent?: string };

export type MessageStateMap = Map<string, MessageState>;

/**
 * Centralized message state machine for managing message lifecycle
 * Provides type-safe state transitions and prevents invalid state changes
 */
export const useMessageStateMachine = () => {
  const [messageStates, setMessageStates] = useState<MessageStateMap>(new Map());

  const setMessageState = useCallback((messageId: string, state: MessageState) => {
    setMessageStates(prev => {
      const newMap = new Map(prev);
      const currentState = newMap.get(messageId);
      
      // Validate state transitions to prevent invalid changes
      if (currentState && !isValidTransition(currentState, state)) {
        console.warn(`Invalid state transition for message ${messageId}:`, {
          from: currentState.type,
          to: state.type
        });
        return prev;
      }
      
      newMap.set(messageId, state);
      return newMap;
    });
  }, []);

  const getMessageState = useCallback((messageId: string): MessageState => {
    return messageStates.get(messageId) || { type: 'idle' };
  }, [messageStates]);

  const removeMessageState = useCallback((messageId: string) => {
    setMessageStates(prev => {
      const newMap = new Map(prev);
      newMap.delete(messageId);
      return newMap;
    });
  }, []);

  const isMessageInState = useCallback((messageId: string, stateType: MessageState['type']): boolean => {
    const state = messageStates.get(messageId);
    return state?.type === stateType;
  }, [messageStates]);

  const getActiveStreamingMessages = useCallback((): string[] => {
    const streamingMessages: string[] = [];
    messageStates.forEach((state, messageId) => {
      if (state.type === 'streaming') {
        streamingMessages.push(messageId);
      }
    });
    return streamingMessages;
  }, [messageStates]);

  return {
    messageStates,
    setMessageState,
    getMessageState,
    removeMessageState,
    isMessageInState,
    getActiveStreamingMessages
  };
};

/**
 * Validates if a state transition is allowed
 * Prevents invalid state changes that could cause bugs
 */
function isValidTransition(from: MessageState, to: MessageState): boolean {
  const transitions: Record<MessageState['type'], MessageState['type'][]> = {
    idle: ['streaming', 'error'],
    streaming: ['completed', 'error', 'cancelled'],
    completed: ['error'], // Allow reprocessing on error
    error: ['streaming', 'idle'], // Allow retry
    cancelled: ['streaming', 'idle'] // Allow retry after cancellation
  };

  return transitions[from.type]?.includes(to.type) ?? false;
}