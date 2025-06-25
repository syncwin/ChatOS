import { logger } from '../lib/logger';
import { NewMessage, Message } from './chatService';
import { addMessage } from './chatService';

interface QueuedMessage {
  id: string;
  message: NewMessage;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface MessageQueueConfig {
  maxRetries: number;
  retryDelay: number;
  maxQueueSize: number;
}

class MessageQueueService {
  private queue: QueuedMessage[] = [];
  private isProcessing = false;
  private config: MessageQueueConfig;
  private storageKey = 'messageQueue';

  constructor(config: Partial<MessageQueueConfig> = {}) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      maxQueueSize: 100,
      ...config
    };
    
    this.loadQueueFromStorage();
    this.startProcessing();
  }

  /**
   * Add a message to the queue for processing
   */
  async enqueue(message: NewMessage): Promise<string> {
    const queuedMessage: QueuedMessage = {
      id: crypto.randomUUID(),
      message,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.config.maxRetries
    };

    // Check queue size limit
    if (this.queue.length >= this.config.maxQueueSize) {
      logger.warn('Message queue is full, removing oldest message', {
        queueSize: this.queue.length,
        maxSize: this.config.maxQueueSize
      });
      this.queue.shift();
    }

    this.queue.push(queuedMessage);
    this.saveQueueToStorage();
    
    logger.messageFlow('Message queued', queuedMessage.id, {
      queueSize: this.queue.length,
      messageContent: message.content.substring(0, 50)
    });

    // Try to process immediately if online
    if (navigator.onLine && !this.isProcessing) {
      this.processQueue();
    }

    return queuedMessage.id;
  }

  /**
   * Process all messages in the queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    logger.messageFlow('Starting queue processing', '', {
      queueSize: this.queue.length
    });

    while (this.queue.length > 0) {
      const queuedMessage = this.queue[0];
      
      try {
        await this.processMessage(queuedMessage);
        // Remove successfully processed message
        this.queue.shift();
        this.saveQueueToStorage();
        
        logger.messageFlow('Message processed successfully', queuedMessage.id, {
          remainingInQueue: this.queue.length
        });
      } catch (error) {
        logger.error('Failed to process queued message', error as Error, {
          messageId: queuedMessage.id,
          retryCount: queuedMessage.retryCount,
          maxRetries: queuedMessage.maxRetries
        });

        queuedMessage.retryCount++;
        
        if (queuedMessage.retryCount >= queuedMessage.maxRetries) {
          logger.error('Message exceeded max retries, removing from queue', error as Error, {
            messageId: queuedMessage.id,
            finalRetryCount: queuedMessage.retryCount
          });
          this.queue.shift();
        } else {
          // Wait before retrying
          await this.delay(this.config.retryDelay * Math.pow(2, queuedMessage.retryCount));
        }
        
        this.saveQueueToStorage();
      }
    }

    this.isProcessing = false;
    logger.messageFlow('Queue processing completed', '', {
      remainingMessages: this.queue.length
    });
  }

  /**
   * Process a single message
   */
  private async processMessage(queuedMessage: QueuedMessage): Promise<Message> {
    logger.messageFlow('Processing queued message', queuedMessage.id, {
      retryCount: queuedMessage.retryCount,
      messageAge: Date.now() - queuedMessage.timestamp
    });

    return await addMessage(queuedMessage.message);
  }

  /**
   * Start automatic queue processing
   */
  private startProcessing(): void {
    // Process queue when coming online
    window.addEventListener('online', () => {
      logger.messageFlow('Network came online, processing queue', '', {
        queueSize: this.queue.length
      });
      this.processQueue();
    });

    // Periodic processing (every 30 seconds)
    setInterval(() => {
      if (navigator.onLine) {
        this.processQueue();
      }
    }, 30000);
  }

  /**
   * Get current queue status
   */
  getQueueStatus(): {
    size: number;
    isProcessing: boolean;
    oldestMessage?: number;
  } {
    return {
      size: this.queue.length,
      isProcessing: this.isProcessing,
      oldestMessage: this.queue.length > 0 ? this.queue[0].timestamp : undefined
    };
  }

  /**
   * Clear all messages from queue
   */
  clearQueue(): void {
    this.queue = [];
    this.saveQueueToStorage();
    logger.messageFlow('Message queue cleared', '', {});
  }

  /**
   * Save queue to localStorage
   */
  private saveQueueToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      logger.error('Failed to save message queue to storage', error as Error, {
        queueSize: this.queue.length
      });
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadQueueFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.queue = JSON.parse(stored);
        logger.messageFlow('Message queue loaded from storage', '', {
          queueSize: this.queue.length
        });
      }
    } catch (error) {
      logger.error('Failed to load message queue from storage', error as Error);
      this.queue = [];
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance and class
export const messageQueue = new MessageQueueService();
export { MessageQueueService };
export type { QueuedMessage, MessageQueueConfig };