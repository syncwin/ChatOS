
import { Bot, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatMessageProps {
  message: Message;
  isDarkMode: boolean;
}

const ChatMessage = ({ message, isDarkMode }: ChatMessageProps) => {
  return (
    <div
      className={`flex gap-3 ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      {message.role === "assistant" && (
        <Avatar className="w-8 h-8 mt-1">
          <div className="w-full h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}
      <Card
        className={`max-w-[80%] p-4 ${
          message.role === "user"
            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0"
            : isDarkMode 
              ? "bg-gray-800 border-gray-700 shadow-sm text-gray-100"
              : "bg-white border-gray-200 shadow-sm text-gray-900"
        }`}
      >
        <p className="text-sm leading-relaxed">
          {message.content}
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
          )}
        </p>
        <div className="text-xs opacity-70 mt-2">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </Card>
      {message.role === "user" && (
        <Avatar className="w-8 h-8 mt-1">
          <div className={`w-full h-full rounded-full flex items-center justify-center ${isDarkMode 
            ? 'bg-gray-600' 
            : 'bg-gray-200'
          }`}>
            <User className={`w-4 h-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`} />
          </div>
          <AvatarFallback>You</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default ChatMessage;
