import { QueryClient } from '@tanstack/react-query';
import { logger } from '../lib/logger';
import { performanceMonitor } from '../lib/performance';
import { NewMessage, Message, Chat, createChat } from './chatService';
import { messageQueue } from './messageQueueService';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

// Global lock to prevent duplicate message creation
const messageCreationLocks = new Set<string>();

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface MessageOperationContext {
  queryClient: QueryClient;
  user: { id: string } | null;
  selectedProvider: string;
  selectedModel: string;
  activeChatId: string | null;
  messages: Message[];
  setActiveChatId: (id: string | null) => void;
  setAbortController: (controller: AbortController | null) => void;
  updateChatTitle: (params: { chatId: string; title: string }) => void;
  addMessageMutation: (message: NewMessage, options?: { onSuccess?: (message: Message) => void; onError?: (error: Error) => void }) => void;
  streamMessage: (
    history: ChatMessage[],
    onDelta: (delta: string) => void,
    onComplete: (usage: any) => void,
    onError: (error: Error) => void,
    signal: AbortSignal
  ) => Promise<void>;
}

/**
 * Create or get existing chat for message
 */
export async function ensureChatExists(
  message: string,
  activeChatId: string | null,
  context: MessageOperationContext
): Promise<string> {
  let currentChatId = activeChatId;

  if (!currentChatId) {
    try {
      logger.messageFlow('Creating new chat', '', { messagePreview: message.substring(0, 50) });
      const newChat = await performanceMonitor.measureAsync<Chat>(
        'create_new_chat',
        async () => {
          return await createChat(message);
        },
        'api'
      );
      currentChatId = newChat.id;
      context.setActiveChatId(currentChatId);
      logger.messageFlow('New chat created', currentChatId, { chatId: currentChatId });
    } catch (error) {
      logger.error('Failed to create new chat', error as Error, {
        messageLength: message.length,
        provider: context.selectedProvider
      });
      throw new Error('Could not start a new chat. Please try again.');
    }
  } else if (context.messages.length === 0) {
    const title = message.length > 30 ? message.substring(0, 27) + "..." : message;
    logger.messageFlow('Updating chat title', currentChatId, { newTitle: title });
    context.updateChatTitle({ chatId: currentChatId, title: title });
  }

  if (!currentChatId) {
    throw new Error('Failed to establish chat context');
  }

  return currentChatId;
}

/**
 * Add user message to chat
 */
export function addUserMessage(
  message: string,
  chatId: string,
  context: MessageOperationContext
): void {
  // Create a lock key based on chat and message content hash
  const messageHash = message.substring(0, 100); // Use first 100 chars as identifier
  const lockKey = `user-${chatId}-${messageHash}`;
  
  // Check if this message is already being processed
  if (messageCreationLocks.has(lockKey)) {
    logger.warn('Duplicate user message creation attempt blocked', {
      chatId,
      messageContent: message.substring(0, 50)
    });
    return;
  }
  
  // Add lock
  messageCreationLocks.add(lockKey);
  
  // Remove lock after 5 seconds
  setTimeout(() => messageCreationLocks.delete(lockKey), 5000);
  
  const userMessageId = uuidv4();
  const userMessage: Message = {
    id: userMessageId,
    chat_id: chatId,
    content: message,
    role: 'user',
    created_at: new Date().toISOString(),
    user_id: context.user?.id || '',
    model: null,
    provider: null,
    usage: null,
    isStreaming: false
  };
  
  logger.messageFlow('Adding user message', userMessageId, {
    messageLength: message.length,
    chatId: chatId
  });
  
  // Optimistically add user message first
  context.queryClient.setQueryData<Message[]>(['messages', chatId], (oldData: Message[] = []) => {
    // Ensure we don't create duplicates by filtering out any existing duplicates first
    const uniqueMessages = oldData.filter((msg, index, arr) => 
      arr.findIndex(m => m.id === msg.id) === index
    );
    
    // Only add user message if it doesn't already exist
    const messageExists = uniqueMessages.some(msg => msg.id === userMessage.id);
    if (messageExists) {
      return uniqueMessages;
    }
    
    return [
      ...uniqueMessages,
      userMessage
    ];
  });
  
  // Also save to database asynchronously
  const newMessage: NewMessage = {
    chat_id: chatId,
    content: message,
    role: 'user',
  };
  
  context.addMessageMutation(newMessage);
}

/**
 * Create assistant placeholder message
 */
export function createAssistantPlaceholder(
  chatId: string,
  context: MessageOperationContext
): { assistantId: string; placeholder: Message } {
  // Create a lock key for assistant messages in this chat
  const lockKey = `assistant-${chatId}`;
  
  // Check if an assistant message is already being created for this chat
  if (messageCreationLocks.has(lockKey)) {
    logger.warn('Duplicate assistant message creation attempt blocked', {
      chatId
    });
    // Return existing placeholder if found
    const existingMessages = context.queryClient.getQueryData<Message[]>(['messages', chatId]) || [];
    const existingPlaceholder = existingMessages.find(msg => msg.role === 'assistant' && msg.isStreaming);
    if (existingPlaceholder) {
      return { assistantId: existingPlaceholder.id, placeholder: existingPlaceholder };
    }
  }
  
  // Add lock
  messageCreationLocks.add(lockKey);
  
  // Remove lock after 5 seconds
  setTimeout(() => messageCreationLocks.delete(lockKey), 5000);
  
  const assistantId = uuidv4();
  
  logger.messageFlow('Creating assistant placeholder', assistantId, {
    chatId: chatId,
    provider: context.selectedProvider,
    model: context.selectedModel
  });
  
  const assistantPlaceholder: Message = {
    id: assistantId,
    chat_id: chatId,
    content: '',
    role: 'assistant',
    created_at: new Date().toISOString(),
    isStreaming: true,
    user_id: context.user?.id || '',
    model: context.selectedModel,
    provider: context.selectedProvider,
    usage: null,
  };
  
  // Optimistically add placeholder
  context.queryClient.setQueryData<Message[]>(['messages', chatId], (oldData: Message[] = []) => {
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

  return { assistantId, placeholder: assistantPlaceholder };
}

/**
 * Prepare chat history for AI
 */
export function prepareChatHistory(
  messages: Message[],
  newMessage: string
): ChatMessage[] {
  return [
    ...messages.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: newMessage }
  ];
}

/**
 * Handle streaming delta updates
 */
export function createDeltaHandler(
  assistantId: string,
  chatId: string,
  context: MessageOperationContext
): { onDelta: (delta: string) => void; getFinalContent: () => string } {
  let finalContent = "";
  
  const onDelta = (delta: string) => {
    finalContent += delta;
    context.queryClient.setQueryData<Message[]>(['messages', chatId], (oldData: Message[] = []) => {
      // Ensure we don't create duplicates by filtering out any existing duplicates first
      const uniqueMessages = oldData.filter((msg, index, arr) => 
        arr.findIndex(m => m.id === msg.id) === index
      );
      
      return uniqueMessages.map(msg => 
        msg.id === assistantId ? { ...msg, content: finalContent } : msg
      );
    });
  };
  
  const getFinalContent = () => finalContent;
  
  return { onDelta, getFinalContent };
}

/**
 * Handle successful completion of AI response
 */
export function createCompletionHandler(
  assistantId: string,
  chatId: string,
  context: MessageOperationContext,
  getFinalContent: () => string
): (usage: any) => void {
  return (usage) => {
    const finalContent = getFinalContent();
    
    logger.messageFlow('AI response completed', assistantId, {
      provider: context.selectedProvider,
      model: context.selectedModel,
      usage: usage,
      contentLength: finalContent.length
    });
    
    // Prevent duplicate message creation if already completed
    const currentMessages = context.queryClient.getQueryData<Message[]>(['messages', chatId]);
    const placeholderExists = currentMessages?.some(msg => msg.id === assistantId && msg.isStreaming);
    
    if (!placeholderExists) {
      logger.warn('Streaming completion called but placeholder no longer exists, skipping duplicate creation', {
        messageId: assistantId,
        chatId: chatId
      });
      context.setAbortController(null);
      return;
    }
    
    const finalAssistantMessage: NewMessage = {
      chat_id: chatId,
      content: finalContent,
      role: 'assistant',
      provider: context.selectedProvider,
      model: context.selectedModel,
      usage: usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };
    
    // Replace placeholder with final message from DB
    context.addMessageMutation(finalAssistantMessage, {
      onSuccess: (savedMessage) => {
        // Update UI with the saved message, replacing the placeholder
        context.queryClient.setQueryData<Message[]>(['messages', chatId], (oldData: Message[] = []) => {
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
    
    context.setAbortController(null);
  };
}

/**
 * Handle AI streaming errors
 */
export function createErrorHandler(
  assistantId: string,
  chatId: string,
  context: MessageOperationContext,
  getFinalContent: () => string
): (error: Error) => void {
  return (error) => {
    const finalContent = getFinalContent();
    
    logger.error('AI streaming error', error, {
      messageId: assistantId,
      chatId: chatId,
      provider: context.selectedProvider,
      model: context.selectedModel,
      contentLength: finalContent.length
    });
    
    if (error.name === 'AbortError') {
      handleUserCancellation(assistantId, chatId, context, finalContent);
    } else {
      handleStreamingErrorInternal(assistantId, chatId, context, finalContent, error);
    }
    
    context.setAbortController(null);
  };
}

/**
 * Handle user cancellation of AI response
 */
function handleUserCancellation(
  assistantId: string,
  chatId: string,
  context: MessageOperationContext,
  finalContent: string
): void {
  logger.messageFlow('User cancelled AI response', assistantId, {
    chatId: chatId,
    contentLength: finalContent.length
  });
  
  const interruptedMessage: NewMessage = {
    chat_id: chatId,
    content: finalContent || '',
    role: 'assistant',
    provider: context.selectedProvider,
    model: context.selectedModel,
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
  };
  
  // Save to database with retry logic
  saveMessageWithRetry(interruptedMessage, assistantId, chatId, context, 'Generation was stopped by user.');
}

/**
 * Handle streaming errors (internal function)
 */
function handleStreamingErrorInternal(
  assistantId: string,
  chatId: string,
  context: MessageOperationContext,
  finalContent: string,
  error: Error
): void {
  logger.error('AI streaming failed', error, {
    messageId: assistantId,
    chatId: chatId,
    provider: context.selectedProvider,
    model: context.selectedModel
  });
  
  toast.error('Failed to generate response. Please try again.');
  
  const errorMessage: NewMessage = {
    chat_id: chatId,
    content: finalContent || '',
    role: 'assistant',
    provider: context.selectedProvider,
    model: context.selectedModel,
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
  };
  
  saveMessageWithRetry(errorMessage, assistantId, chatId, context, `Failed to generate response: ${error.message}`);
}

/**
 * Save message with retry logic using message queue
 */
function saveMessageWithRetry(
  message: NewMessage,
  assistantId: string,
  chatId: string,
  context: MessageOperationContext,
  errorText: string
): void {
  context.addMessageMutation(message, {
    onSuccess: (savedMessage) => {
      logger.messageFlow('Message saved successfully', savedMessage.id, {
        chatId: chatId,
        contentLength: message.content.length
      });
      
      // Update UI with the saved message ID and error state
      context.queryClient.setQueryData<Message[]>(['messages', chatId], (oldData: Message[] = []) => {
        // Ensure we don't create duplicates by filtering out any existing duplicates first
        const uniqueMessages = oldData.filter((msg, index, arr) => 
          arr.findIndex(m => m.id === msg.id) === index
        );
        
        return uniqueMessages.map(msg => 
          msg.id === assistantId 
            ? { 
                ...savedMessage,
                error: errorText,
                isStreaming: false 
              }
            : msg
        );
      });
    },
    onError: async (dbError) => {
      logger.error('Failed to save message to database, adding to queue', dbError as Error, {
        messageId: assistantId,
        chatId: chatId
      });
      
      // Add to message queue for retry
      try {
        await messageQueue.enqueue(message);
        logger.messageFlow('Message added to retry queue', assistantId, {
          chatId: chatId
        });
      } catch (queueError) {
        logger.error('Failed to add message to queue', queueError as Error, {
          messageId: assistantId,
          chatId: chatId
        });
      }
      
      // Fallback to UI-only update
      context.queryClient.setQueryData<Message[]>(['messages', chatId], (oldData: Message[] = []) => {
        // Ensure we don't create duplicates by filtering out any existing duplicates first
        const uniqueMessages = oldData.filter((msg, index, arr) => 
          arr.findIndex(m => m.id === msg.id) === index
        );
        
        return uniqueMessages.map(msg => 
          msg.id === assistantId 
            ? { 
                ...msg, 
                content: message.content, 
                error: errorText,
                isStreaming: false 
              }
            : msg
        );
     });
    }
  });
}

/**
 * Validate message sending preconditions
 */
export function validateMessageSending(
  message: string,
  isAiResponding: boolean,
  activeChatId: string | null,
  selectedProvider: string,
  selectedModel: string,
  existingMessages?: Message[]
): void {
  if (isAiResponding) {
    logger.warn('sendMessage: Already generating AI response, ignoring duplicate call', {
      messageLength: message.length,
      activeChatId,
      isAiResponding,
      existingStreamingMessages: existingMessages?.filter(msg => msg.isStreaming).length || 0
    });
    throw new Error('AI is currently responding. Please wait.');
  }
  
  // Check for existing streaming messages to prevent duplicate responses
  if (existingMessages?.some(msg => msg.isStreaming && msg.role === 'assistant')) {
    throw new Error('AI response already in progress');
  }
  
  if (!message.trim()) {
    throw new Error('Message cannot be empty.');
  }
  
  if (!selectedProvider || !selectedModel) {
    throw new Error('Please select a provider and model.');
  }
}

// Export aliases for backward compatibility
export const handleStreamingUpdate = createDeltaHandler;
export const handleStreamingCompletion = createCompletionHandler;
export const handleStreamingError = createErrorHandler;