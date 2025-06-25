import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  ensureChatExists,
  addUserMessage,
  createAssistantPlaceholder,
  prepareChatHistory,
  validateMessageSending,
  MessageOperationContext,
  ChatMessage
} from '../services/messageOperationsService';
import { createChat, Message } from '../services/chatService';
import { performanceMonitor } from '../lib/performance';

// Mock dependencies
vi.mock('../services/chatService', () => ({
  createChat: vi.fn()
}));

vi.mock('../lib/performance', () => ({
  performanceMonitor: {
    measureAsync: vi.fn()
  }
}));

vi.mock('../lib/logger', () => ({
  logger: {
    messageFlow: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

// Mock UUID
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-uuid-123')
}));

describe('MessageOperationsService', () => {
  let mockContext: MessageOperationContext;
  const mockCreateChat = createChat as Mock;
  const mockMeasureAsync = performanceMonitor.measureAsync as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockContext = {
      queryClient: {
        setQueryData: vi.fn(),
        getQueryData: vi.fn()
      } as Partial<QueryClient>,
      user: { id: 'user-123' },
      selectedProvider: 'openai',
      selectedModel: 'gpt-4',
      activeChatId: null,
      messages: [],
      setActiveChatId: vi.fn(),
      setAbortController: vi.fn(),
      updateChatTitle: vi.fn(),
      addMessageMutation: vi.fn(),
      streamMessage: vi.fn()
    };
  });

  describe('ensureChatExists', () => {
    it('should return existing chat ID when provided', async () => {
      mockContext.activeChatId = 'existing-chat-123';
      mockContext.messages = [{ id: '1', content: 'existing', role: 'user' } as Message];
      
      const result = await ensureChatExists('New message', 'existing-chat-123', mockContext);
      
      expect(result).toBe('existing-chat-123');
      expect(mockCreateChat).not.toHaveBeenCalled();
    });

    it('should create new chat when no active chat', async () => {
      const newChat = { id: 'new-chat-123', title: 'New Chat' };
      mockCreateChat.mockResolvedValue(newChat);
      mockMeasureAsync.mockImplementation((name, fn) => fn());
      
      const result = await ensureChatExists('New message', null, mockContext);
      
      expect(result).toBe('new-chat-123');
      expect(mockCreateChat).toHaveBeenCalledWith('New message');
      expect(mockContext.setActiveChatId).toHaveBeenCalledWith('new-chat-123');
    });

    it('should update chat title for empty existing chat', async () => {
      mockContext.activeChatId = 'existing-chat-123';
      mockContext.messages = [];
      
      const result = await ensureChatExists('This is a long message that should be truncated', 'existing-chat-123', mockContext);
      
      expect(result).toBe('existing-chat-123');
      expect(mockContext.updateChatTitle).toHaveBeenCalledWith({
        chatId: 'existing-chat-123',
        title: 'This is a long message that...'
      });
    });

    it('should handle chat creation failure', async () => {
      mockCreateChat.mockRejectedValue(new Error('Network error'));
      mockMeasureAsync.mockImplementation((name, fn) => fn());
      
      await expect(ensureChatExists('New message', null, mockContext))
        .rejects.toThrow('Could not start a new chat. Please try again.');
    });
  });

  describe('addUserMessage', () => {
    it('should add user message with correct structure', () => {
      addUserMessage('Test message', 'chat-123', mockContext);
      
      expect(mockContext.addMessageMutation).toHaveBeenCalledWith({
        chat_id: 'chat-123',
        content: 'Test message',
        role: 'user'
      });
    });
  });

  describe('createAssistantPlaceholder', () => {
    it('should create assistant placeholder with correct structure', () => {
      const result = createAssistantPlaceholder('chat-123', mockContext);
      
      expect(result.assistantId).toBe('test-uuid-123');
      expect(result.placeholder).toMatchObject({
        id: 'test-uuid-123',
        chat_id: 'chat-123',
        content: '',
        role: 'assistant',
        isStreaming: true,
        user_id: 'user-123',
        model: 'gpt-4',
        provider: 'openai',
        usage: null
      });
      
      expect(mockContext.queryClient.setQueryData).toHaveBeenCalledWith(
        ['messages', 'chat-123'],
        expect.any(Function)
      );
    });
  });

  describe('prepareChatHistory', () => {
    it('should prepare chat history correctly', () => {
      const messages = [
        { id: '1', role: 'user', content: 'Hello' },
        { id: '2', role: 'assistant', content: 'Hi there' }
      ] as ChatMessage[];
      
      const result = prepareChatHistory(messages, 'New message');
      
      expect(result).toEqual([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
        { role: 'user', content: 'New message' }
      ]);
    });

    it('should handle empty message history', () => {
      const result = prepareChatHistory([], 'First message');
      
      expect(result).toEqual([
        { role: 'user', content: 'First message' }
      ]);
    });
  });

  describe('validateMessageSending', () => {
    it('should pass validation for valid inputs', () => {
      expect(() => {
        validateMessageSending(
          'Valid message',
          false,
          'chat-123',
          'openai',
          'gpt-4'
        );
      }).not.toThrow();
    });

    it('should throw error when AI is responding', () => {
      expect(() => {
        validateMessageSending(
          'Valid message',
          true,
          'chat-123',
          'openai',
          'gpt-4'
        );
      }).toThrow('AI is currently responding. Please wait.');
    });

    it('should throw error for empty message', () => {
      expect(() => {
        validateMessageSending(
          '   ',
          false,
          'chat-123',
          'openai',
          'gpt-4'
        );
      }).toThrow('Message cannot be empty.');
    });

    it('should throw error when provider is missing', () => {
      expect(() => {
        validateMessageSending(
          'Valid message',
          false,
          'chat-123',
          '',
          'gpt-4'
        );
      }).toThrow('Please select a provider and model.');
    });

    it('should throw error when model is missing', () => {
      expect(() => {
        validateMessageSending(
          'Valid message',
          false,
          'chat-123',
          'openai',
          ''
        );
      }).toThrow('Please select a provider and model.');
    });
  });
});

// Integration tests for message flow
describe('Message Flow Integration', () => {
  let mockContext: MessageOperationContext;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockContext = {
      queryClient: {
        setQueryData: vi.fn(),
        getQueryData: vi.fn().mockReturnValue([])
      } as Partial<QueryClient>,
      user: { id: 'user-123' },
      selectedProvider: 'openai',
      selectedModel: 'gpt-4',
      activeChatId: null,
      messages: [],
      setActiveChatId: vi.fn(),
      setAbortController: vi.fn(),
      updateChatTitle: vi.fn(),
      addMessageMutation: vi.fn(),
      streamMessage: vi.fn()
    };
  });

  it('should handle complete message flow for new chat', async () => {
    const newChat = { id: 'new-chat-123', title: 'New Chat' };
    mockCreateChat.mockResolvedValue(newChat);
    mockMeasureAsync.mockImplementation((name, fn) => fn());
    
    // Validate message
    validateMessageSending('Test message', false, null, 'openai', 'gpt-4');
    
    // Ensure chat exists
    const chatId = await ensureChatExists('Test message', null, mockContext);
    expect(chatId).toBe('new-chat-123');
    
    // Add user message
    addUserMessage('Test message', chatId, mockContext);
    expect(mockContext.addMessageMutation).toHaveBeenCalledWith({
      chat_id: 'new-chat-123',
      content: 'Test message',
      role: 'user'
    });
    
    // Create assistant placeholder
    const { assistantId, placeholder } = createAssistantPlaceholder(chatId, mockContext);
    expect(assistantId).toBe('test-uuid-123');
    expect(placeholder.chat_id).toBe('new-chat-123');
    
    // Prepare history
    const history = prepareChatHistory([], 'Test message');
    expect(history).toEqual([{ role: 'user', content: 'Test message' }]);
  });

  it('should handle rapid message sending prevention', () => {
    expect(() => {
      validateMessageSending('Message 1', false, 'chat-123', 'openai', 'gpt-4');
      validateMessageSending('Message 2', true, 'chat-123', 'openai', 'gpt-4');
    }).toThrow('AI is currently responding. Please wait.');
  });
});