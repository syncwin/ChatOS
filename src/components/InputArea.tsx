
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import React from "react";

interface InputAreaProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const InputArea = ({ input, setInput, onSubmit, isLoading }: InputAreaProps) => {
  const textAreaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      const scrollHeight = textAreaRef.current.scrollHeight;
      textAreaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e as any);
    }
  };

  return (
    <div className="p-4 border-t border-border bg-background/95 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="relative">
        <Textarea
          ref={textAreaRef}
          rows={1}
          value={input}
          onKeyDown={handleKeyDown}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          className="w-full resize-none pr-14 py-3 text-base bg-input border-input rounded-xl focus-visible:ring-1 focus-visible:ring-ring"
          disabled={isLoading}
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="h-9 w-9"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
      <p className="text-xs mt-2 text-center text-muted-foreground">
        InsightSeeker AI can make mistakes. Press Shift+Enter for a new line.
      </p>
    </div>
  );
};

export default InputArea;
