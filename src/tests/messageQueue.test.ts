import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { messageQueue, MessageQueueService } from '../services/messageQueueService';
import { addMessage } from '../services/chatService';
import { NewMessage } from '../services/chatService';

// Create mock for addMessage
const mockAddMessage = vi.mocked(addMessage);

// Mock dependencies
vi.mock('../services/chatService', () => ({
  addMessage: vi.fn()
}));

vi.mock('../lib/logger', () => ({
  logger: {
    messageFlow: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock navigator.onLine
let mockOnLine = true;
Object.defineProperty(navigator, 'onLine', {
  get: () => mockOnLine,
  configurable: true
});

// Helper function to set online status
const setOnlineStatus = (status: boolean) => {
  mockOnLine = status;
};

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123')
  }
});

describe('MessageQueueService', () => {
  let queueService: MessageQueueService;
  const mockAddMessage = addMessage as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    setOnlineStatus(true);
    
    // Create a new instance for each test
    queueService = new MessageQueueService({
      maxRetries: 2,
      retryDelay: 100,
      maxQueueSize: 5
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('enqueue', () => {
    it('should add message to queue', async () => {
      const message: NewMessage = {
        chat_id: 'chat-1',
        content: 'Test message',
        role: 'user'
      };

      const queueId = await queueService.enqueue(message);
      
      expect(queueId).toBe('test-uuid-123');
      expect(queueService.getQueueStatus().size).toBe(1);
    });

    it('should process message immediately when online', async () => {
      mockAddMessage.mockResolvedValue({ id: 'msg-1', content: 'Test' });
      
      const message: NewMessage = {
        chat_id: 'chat-1',
        content: 'Test message',
        role: 'user'
      };

      await queueService.enqueue(message);
      
      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(mockAddMessage).toHaveBeenCalledWith(message);
    });

    it('should respect max queue size', async () => {
      // Fill queue to max size
      for (let i = 0; i < 6; i++) {
        await queueService.enqueue({
          chat_id: 'chat-1',
          content: `Message ${i}`,
          role: 'user'
        });
      }
      
      expect(queueService.getQueueStatus().size).toBe(5);
    });
  });

  describe('retry logic', () => {
    it('should retry failed messages', async () => {
      mockAddMessage
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ id: 'msg-1', content: 'Test' });
      
      const message: NewMessage = {
        chat_id: 'chat-1',
        content: 'Test message',
        role: 'user'
      };

      await queueService.enqueue(message);
      
      // Wait for retry
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(mockAddMessage).toHaveBeenCalledTimes(2);
    });

    it('should remove message after max retries', async () => {
      mockAddMessage.mockRejectedValue(new Error('Persistent error'));
      
      const message: NewMessage = {
        chat_id: 'chat-1',
        content: 'Test message',
        role: 'user'
      };

      await queueService.enqueue(message);
      
      // Wait for all retries
      await new Promise(resolve => setTimeout(resolve, 500));
      
      expect(mockAddMessage).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(queueService.getQueueStatus().size).toBe(0);
    });
  });

  describe('offline handling', () => {
    it('should not process queue when offline', async () => {
      setOnlineStatus(false);
      
      const message: NewMessage = {
        chat_id: 'chat-1',
        content: 'Test message',
        role: 'user'
      };

      await queueService.enqueue(message);
      
      expect(mockAddMessage).not.toHaveBeenCalled();
      expect(queueService.getQueueStatus().size).toBe(1);
    });

    it('should process queue when coming back online', async () => {
      setOnlineStatus(false);
      mockAddMessage.mockResolvedValue({ id: 'msg-1', content: 'Test' });
      
      const message: NewMessage = {
        chat_id: 'chat-1',
        content: 'Test message',
        role: 'user'
      };

      await queueService.enqueue(message);
      expect(queueService.getQueueStatus().size).toBe(1);
      
      // Simulate coming back online
      setOnlineStatus(true);
      window.dispatchEvent(new Event('online'));
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(mockAddMessage).toHaveBeenCalledWith(message);
    });
  });

  describe('persistence', () => {
    it('should save queue to localStorage', async () => {
      const message: NewMessage = {
        chat_id: 'chat-1',
        content: 'Test message',
        role: 'user'
      };

      await queueService.enqueue(message);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'messageQueue',
        expect.stringContaining('Test message')
      );
    });

    it('should load queue from localStorage on initialization', () => {
      const savedQueue = JSON.stringify([{
        id: 'saved-1',
        message: { chat_id: 'chat-1', content: 'Saved message', role: 'user' },
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3
      }]);
      
      localStorageMock.getItem.mockReturnValue(savedQueue);
      
      const newService = new MessageQueueService();
      
      expect(newService.getQueueStatus().size).toBe(1);
    });
  });

  describe('queue management', () => {
    it('should clear queue', async () => {
      const message: NewMessage = {
        chat_id: 'chat-1',
        content: 'Test message',
        role: 'user'
      };

      await queueService.enqueue(message);
      expect(queueService.getQueueStatus().size).toBe(1);
      
      queueService.clearQueue();
      expect(queueService.getQueueStatus().size).toBe(0);
    });

    it('should provide accurate queue status', async () => {
      const status = queueService.getQueueStatus();
      
      expect(status).toHaveProperty('size');
      expect(status).toHaveProperty('isProcessing');
      expect(typeof status.size).toBe('number');
      expect(typeof status.isProcessing).toBe('boolean');
    });
  });
});