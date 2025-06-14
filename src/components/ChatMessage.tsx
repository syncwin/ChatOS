
import { Bot, User, Copy, Check } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = () => {
    if (!message.content) return;
    navigator.clipboard.writeText(message.content);
    setHasCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div
      className={`group flex gap-4 ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      {message.role === "assistant" && (
        <Avatar className="w-8 h-8 mt-1">
          <div className="w-full h-full bg-primary rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}
      <div className="flex items-center max-w-[80%]">
        <Card
          className={`p-4 rounded-2xl ${
            message.role === "user"
              ? "bg-primary text-primary-foreground"
              : "bg-card border"
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
            )}
          </p>
        </Card>
         {message.role === "assistant" && !message.isStreaming && message.content && (
           <Button
            onClick={handleCopy}
            size="icon"
            variant="ghost"
            className="ml-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0"
          >
            {hasCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        )}
      </div>
      {message.role === "user" && (
        <Avatar className="w-8 h-8 mt-1">
          <div className="w-full h-full rounded-full flex items-center justify-center bg-muted">
            <User className="w-5 h-5 text-muted-foreground" />
          </div>
          <AvatarFallback>You</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default ChatMessage;
