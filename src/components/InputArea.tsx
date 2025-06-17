import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import TextareaAutosize from 'react-textarea-autosize';
interface InputAreaProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}
const InputArea = ({
  input,
  setInput,
  onSubmit,
  isLoading
}: InputAreaProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e as any);
    }
  };
  return <div className="py-4 border-t border-border bg-background/90 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="flex gap-4 items-end">
        <div className="flex-1 flex items-center p-2 bg-input border border-input focus-within:ring-2 focus-within:ring-primary transition-all px-[4px] py-[4px] rounded">
            <label htmlFor="chat-input" className="sr-only">Type your message</label>
            <TextareaAutosize id="chat-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask me anything..." disabled={isLoading} maxRows={5} minRows={1} className="flex-1 w-full resize-none p-2 bg-transparent text-base focus:outline-none rounded-none py-0 px-0" />
            <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="h-9 w-9 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all flex-shrink-0 disabled:bg-muted" aria-label="Send message">
                <Send className="w-4 h-4" />
            </Button>
        </div>
      </form>
      <p className="text-xs mt-2 text-center text-muted-foreground" aria-live="polite">
        OS Chat can make mistakes. Please verify important information.
      </p>
    </div>;
};
export default InputArea;