
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import TextareaAutosize from 'react-textarea-autosize';

interface InputAreaProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const InputArea = ({ input, setInput, onSubmit, isLoading }: InputAreaProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e as any);
    }
  };

  return (
    <div className="p-4 border-t border-border bg-background/90 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <TextareaAutosize
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            className="w-full resize-none p-3 pr-12 text-sm bg-input border border-input rounded-lg focus:ring-1 focus:ring-ring focus:outline-none transition-shadow"
            disabled={isLoading}
            maxRows={5}
            minRows={1}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 h-8 w-8 bg-primary hover:bg-primary/90 transition-all"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
      <p className="text-xs mt-2 text-center text-muted-foreground">
        InsightSeeker can make mistakes. Please verify important information.
      </p>
    </div>
  );
};

export default InputArea;
