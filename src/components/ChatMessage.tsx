
import { User, Copy, Check } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ReactMarkdown from 'react-markdown';
import type { Tables } from "@/integrations/supabase/types";
import OsIcon from "./icons/OsIcon";

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
            <OsIcon className="w-4 h-4 text-primary-foreground" />
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
        <div className="text-sm leading-relaxed">
          {message.role === "assistant" ? (
            <ReactMarkdown
              components={{
                code(props) {
                  const { children, className, node, ...rest } = props;
                  const match = /language-(\w+)/.exec(className || '');
                  return match ? (
                    <pre className="bg-muted/50 dark:bg-muted/20 text-foreground rounded-md p-4 my-2 overflow-x-auto">
                      <code className="text-sm font-mono">
                        {String(children).replace(/\n$/, '')}
                      </code>
                    </pre>
                  ) : (
                    <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono" {...rest}>
                      {children}
                    </code>
                  );
                },
                h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-semibold mt-3 mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-medium mt-2 mb-1">{children}</h3>,
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="ml-2">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-muted-foreground pl-4 italic my-2">
                    {children}
                  </blockquote>
                ),
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                a: ({ children, href }) => (
                  <a href={href} className="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-2">
                    <table className="min-w-full border border-border rounded-lg">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-border px-3 py-2 bg-muted font-medium text-left">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-border px-3 py-2">
                    {children}
                  </td>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            <span className="whitespace-pre-wrap break-all">
              {message.content}
            </span>
          )}
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
          )}
        </div>
        <div className="flex justify-between items-end text-xs mt-2">
          <div className="opacity-50">
            {message.role === 'assistant' && !message.isStreaming && message.provider && (
              <span>{message.provider}/{message.model}</span>
            )}
          </div>
          <div className="opacity-70">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        {message.role === 'assistant' && !message.isStreaming && message.content && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleCopy}
            aria-label={copied ? "Message copied" : "Copy message"}
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
