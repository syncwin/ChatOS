
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import TextareaAutosize from 'react-textarea-autosize';
import { useState, useEffect } from 'react';
import { messageContentSchema, validateInput, RateLimiter } from '@/lib/validation';
import { toast } from 'sonner';

interface InputAreaProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

// Rate limiter for message sending (10 messages per minute)
const messageRateLimiter = new RateLimiter(10, 60000);

const InputArea = ({
  input,
  setInput,
  onSubmit,
  isLoading
}: InputAreaProps) => {
  const [validationError, setValidationError] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const validation = validateInput(messageContentSchema, input);
    if (!validation.success) {
      setValidationError(validation.error || 'Invalid input');
      toast.error(validation.error || 'Invalid input');
      return;
    }

    // Check rate limiting
    if (!messageRateLimiter.isAllowed('user_messages')) {
      toast.error('Too many messages. Please wait a moment before sending another message.');
      return;
    }

    // Clear any validation errors
    setValidationError('');
    
    // Proceed with submission
    onSubmit(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Create a proper form event
      const form = e.currentTarget.form;
      if (form) {
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true }) as any;
        handleSubmit(submitEvent);
      }
    }
  };

  return (
    <div className="py-4 bg-background/90 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="flex gap-4 items-end">
        <div className="flex-1 flex items-center p-2 bg-input border border-input focus-within:ring-2 focus-within:ring-primary transition-all px-[4px] py-[4px] rounded">
          <label htmlFor="chat-input" className="sr-only">Type your message</label>
          <TextareaAutosize 
            id="chat-input" 
            value={input} 
            onChange={handleInputChange} 
            onKeyDown={handleKeyDown} 
            placeholder="Ask me anything..." 
            disabled={isLoading} 
            maxRows={5} 
            minRows={1} 
            className="flex-1 w-full resize-none p-2 bg-transparent text-base focus:outline-none rounded-none px-[4px] py-0" 
            aria-describedby={validationError ? "input-error" : undefined}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!input.trim() || isLoading || !!validationError} 
            className="h-9 w-9 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all flex-shrink-0 disabled:bg-muted" 
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
      {validationError && (
        <p id="input-error" className="text-xs mt-2 text-center text-red-500" role="alert">
          {validationError}
        </p>
      )}
      <p aria-live="polite" className="text-xs mt-2 text-center text-muted-foreground hidden">
      </p>
    </div>
  );
};

export default InputArea;
