
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InputAreaProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  isDarkMode: boolean;
}

const InputArea = ({ input, setInput, onSubmit, isLoading, isDarkMode }: InputAreaProps) => {
  return (
    <div className={`p-4 border-t ${isDarkMode 
      ? 'bg-gray-800/80 backdrop-blur-sm border-gray-700' 
      : 'bg-white/80 backdrop-blur-sm border-gray-200'
    }`}>
      <form onSubmit={onSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className={`pr-12 h-12 focus:ring-blue-500 ${isDarkMode 
              ? 'bg-gray-700 border-gray-600 focus:border-blue-500 text-white placeholder-gray-400' 
              : 'bg-white border-gray-300 focus:border-blue-500 text-gray-900 placeholder-gray-500'
            }`}
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || isLoading}
            className="absolute right-1 top-1 h-10 w-10 p-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
      <p className={`text-xs mt-2 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        InsightSeeker AI can make mistakes. Please verify important information.
      </p>
    </div>
  );
};

export default InputArea;
