
import { Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import TextareaAutosize from 'react-textarea-autosize';
import { useState, useEffect, forwardRef } from 'react';
import { messageContentSchema, validateInput, RateLimiter } from '@/lib/validation';
import { toast } from 'sonner';
import { useDeviceType, useIsTablet } from '@/hooks/use-mobile';

interface InputAreaProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onStop?: () => void;
  isLoading: boolean;
  isAiResponding?: boolean;
}

// Rate limiter for message sending (10 messages per minute)
const messageRateLimiter = new RateLimiter(10, 60000);

const InputArea = forwardRef<HTMLDivElement, InputAreaProps>(({ 
  input,
  setInput,
  onSubmit,
  onStop,
  isLoading,
  isAiResponding = false
}, ref) => {
  const [validationError, setValidationError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const deviceType = useDeviceType();
  const isTablet = useIsTablet();

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
    
    // Prevent double submissions
    if (isSubmitting) {
      return;
    }
    
    // If AI is responding, handle stop action
    if (isAiResponding && onStop) {
      onStop();
      return;
    }
    
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
    
    // Set submitting flag
    setIsSubmitting(true);
    
    // Proceed with submission
    onSubmit(e);
    
    // Reset submitting flag after a short delay
    setTimeout(() => setIsSubmitting(false), 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Trigger form submission programmatically to avoid double submission
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  // Responsive sizing based on device type (no horizontal padding - handled by parent gutter-responsive)
  const getResponsiveClasses = () => {
    if (deviceType === 'mobile') {
      return {
        container: 'py-2', // Only vertical padding, horizontal handled by parent
        form: 'flex gap-2 items-end w-full',
        inputWrapper: 'flex-1 flex items-center p-2 bg-input border border-input focus-within:ring-2 focus-within:ring-primary transition-all rounded min-w-0 w-full',
        textarea: 'flex-1 w-full resize-none p-2 bg-transparent text-sm focus:outline-none rounded-none min-w-0 overflow-hidden',
        button: 'h-9 w-9 rounded-md transition-all flex-shrink-0 ml-2',
        icon: 'w-4 h-4'
      };
    } else if (deviceType === 'tablet') {
      return {
        container: 'py-3', // Only vertical padding, horizontal handled by parent
        form: 'flex gap-3 items-end w-full',
        inputWrapper: 'flex-1 flex items-center p-2.5 bg-input border border-input focus-within:ring-2 focus-within:ring-primary transition-all rounded min-w-0 w-full',
        textarea: 'flex-1 w-full resize-none p-2.5 bg-transparent text-base focus:outline-none rounded-none min-w-0 overflow-hidden',
        button: 'h-10 w-10 rounded-md transition-all flex-shrink-0 ml-2',
        icon: 'w-4 h-4'
      };
    } else {
      return {
        container: 'py-2 sm:py-4', // Only vertical padding, horizontal handled by parent
        form: 'flex gap-2 sm:gap-4 items-end w-full',
        inputWrapper: 'flex-1 flex items-center p-1 sm:p-2 bg-input border border-input focus-within:ring-2 focus-within:ring-primary transition-all rounded min-w-0 w-full',
        textarea: 'flex-1 w-full resize-none p-2 bg-transparent text-sm sm:text-base focus:outline-none rounded-none min-w-0 overflow-hidden',
        button: 'h-8 w-8 sm:h-9 sm:w-9 rounded-md transition-all flex-shrink-0 ml-1 sm:ml-2',
        icon: 'w-3 h-3 sm:w-4 sm:h-4'
      };
    }
  };

  const classes = getResponsiveClasses();

  return (
    <div ref={ref} className={`${classes.container} w-full input-area`}>
      <form onSubmit={handleSubmit} className={classes.form}>
        <div className={classes.inputWrapper}>
          <label htmlFor="chat-input" className="sr-only">Type your message</label>
          <TextareaAutosize 
            id="chat-input" 
            value={input} 
            onChange={handleInputChange} 
            onKeyDown={handleKeyDown} 
            placeholder="Ask me anything..." 
            disabled={isLoading} 
            maxRows={deviceType === 'mobile' ? 4 : 5} 
            minRows={1} 
            className={classes.textarea} 
            aria-describedby={validationError ? "input-error" : undefined}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={isAiResponding ? false : (!input.trim() || isLoading || !!validationError)} 
            className={`${classes.button} ${
              isAiResponding 
                ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' 
                : input.trim() && !isLoading && !validationError 
                ? 'bg-accent hover:bg-accent/90 text-accent-foreground' 
                : 'bg-muted hover:bg-muted/90 text-muted-foreground'
            }`} 
            aria-label={isAiResponding ? "Stop generation" : "Send message"}
          >
            {isAiResponding ? (
              <Square className={classes.icon} />
            ) : (
              <Send className={`${classes.icon} text-primary-foreground dark:text-foreground`} />
            )}
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
});

InputArea.displayName = 'InputArea';

export default InputArea;
