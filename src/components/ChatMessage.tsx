import { Bot, User, Copy, Check } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { Tables } from "@/integrations/supabase/types";

type Message = Tables<'chat_messages'> & {
  isStreaming?: boolean;
};

interface ChatMessageProps {
  message: Message;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className={`flex gap-3 w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}>
      {message.role === "assistant" && (
        <Avatar className="w-8 h-8 mt-1">
          <div className="w-full h-full bg-primary rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}
      <div className={`max-w-[85%] p-4 rounded-lg relative group ${
          message.role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-card border"
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
          )}
        </p>
        <div className="text-xs opacity-70 mt-2">
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        {message.role === 'assistant' && !message.isStreaming && message.content && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleCopy}
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </Button>
        )}
      </div>
      {message.role === "user" && (
        <Avatar className="w-8 h-8 mt-1">
          <div className="w-full h-full rounded-full flex items-center justify-center bg-muted">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
          <AvatarFallback>You</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default ChatMessage;
