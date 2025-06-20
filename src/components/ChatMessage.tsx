
import { User, Copy, Check, Send, X, Edit3 } from "lucide-react";
import TextareaAutosize from 'react-textarea-autosize';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ReactMarkdown from 'react-markdown';
import ChatOsIcon from "./icons/ChatOsIcon";
import ChatActionIcons from "./ChatActionIcons";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { decodeHtmlEntities } from "@/lib/utils";

interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
}

interface Message {
  id: string;
  chat_id: string;
  user_id: string;
  created_at: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  model?: string;
  usage?: Usage;
  isStreaming?: boolean;
}

interface ChatMessageProps {
  message: Message;
  isEditing?: boolean;
  editingContent?: string;
  setEditingContent?: (value: string) => void;
  onEditMessage?: (messageId: string) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  onDeleteMessage?: (messageId: string) => void;
}

const ChatMessage = ({ 
  message, 
  isEditing = false, 
  editingContent = '', 
  setEditingContent, 
  onEditMessage, 
  onSaveEdit, 
  onCancelEdit,
  onDeleteMessage 
}: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const { profile } = useProfile();
  const { user } = useAuth();
  const { toast } = useToast();

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const handleCopy = async () => {
    try {
      // Decode HTML entities and normalize special characters for clean markdown output
      const contentToCopy = decodeHtmlEntities(message.content);
      
      await navigator.clipboard.writeText(contentToCopy);
       setCopied(true);
       toast({
         title: "Copied!",
         description: "Message copied to clipboard in Markdown format.",
       });
       setTimeout(() => {
         setCopied(false);
       }, 2000);
    } catch (error) {
      console.error('Failed to copy content:', error);
      // Fallback for older browsers
      try {
        // Apply same decoding logic to fallback
        const fallbackContent = decodeHtmlEntities(message.content);
          
        const textArea = document.createElement('textarea');
        textArea.value = fallbackContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
         document.body.removeChild(textArea);
         setCopied(true);
         toast({
           title: "Copied!",
           description: "Message copied to clipboard in Markdown format.",
         });
         setTimeout(() => {
           setCopied(false);
         }, 2000);
      } catch (fallbackError) {
        console.error('Fallback copy also failed:', fallbackError);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className={`flex gap-3 group ${message.role === "user" ? "justify-end" : "flex-row"} ${isEditing ? 'ring-2 ring-primary/20 rounded-lg p-3 bg-primary/5' : ''}`}>
      {message.role === "assistant" && (
        <Avatar className="w-8 h-8 mt-1 flex-shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground flex items-center justify-center">
            <ChatOsIcon className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      )}
      <div className={`chat-bubble p-3 sm:p-4 rounded-lg shadow-md relative group break-words overflow-wrap-anywhere max-w-[85%] ${
          message.role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-card border"
        }`}
      >
        <div className="text-sm leading-relaxed">
          {isEditing && message.role === "user" ? (
            <div className="space-y-3" role="region" aria-label="Edit message">
              <div className="flex items-center p-1 sm:p-2 bg-input border border-input focus-within:ring-2 focus-within:ring-primary transition-all rounded min-w-0">
                <TextareaAutosize
                  value={editingContent}
                  onChange={(e) => setEditingContent?.(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      onSaveEdit?.();
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      onCancelEdit?.();
                    }
                  }}
                  className="flex-1 w-full resize-none p-2 bg-transparent text-sm sm:text-base focus:outline-none rounded-none min-w-0"
                  placeholder="Edit your message... (Ctrl+Enter to send, Escape to cancel)"
                  minRows={2}
                  maxRows={10}
                  autoFocus
                  aria-label="Edit message content"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCancelEdit}
                  className="flex items-center gap-1 hover:bg-muted/80 transition-colors"
                  aria-label="Cancel editing"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={onSaveEdit}
                  className={`flex items-center gap-1 transition-all ${
                    editingContent.trim() 
                      ? 'bg-accent hover:bg-accent/90 text-accent-foreground' 
                      : 'bg-muted hover:bg-muted/90 text-muted-foreground'
                  }`}
                  disabled={!editingContent.trim()}
                  aria-label="Save edited message and regenerate response"
                >
                  <Send className="w-3 h-3" />
                  Send
                </Button>
              </div>
            </div>
          ) : (
            <>
              {message.role === "assistant" ? (
                <ReactMarkdown
                  components={{
                    code(props) {
                      const { children, className, node, ...rest } = props;
                      const match = /language-(\w+)/.exec(className || '');
                      return match ? (
                        <pre className="bg-muted/50 dark:bg-muted/20 text-foreground rounded-md p-2 sm:p-4 my-2 overflow-x-auto break-words whitespace-pre-wrap">
                          <code className="text-xs sm:text-sm font-mono break-words">
                            {String(children).replace(/\n$/, '')}
                          </code>
                        </pre>
                      ) : (
                        <code className="bg-muted px-1 py-0.5 rounded text-xs sm:text-sm font-mono break-words" {...rest}>
                          {children}
                        </code>
                      );
                    },
                    h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-semibold mt-3 mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base font-medium mt-2 mb-1">{children}</h3>,
                    p: ({ children }) => <p className="mb-2 last:mb-0 break-words overflow-wrap-anywhere">{children}</p>,
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
                      <a href={href} className="text-primary underline hover:no-underline break-all" target="_blank" rel="noopener noreferrer">
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
                <span className="whitespace-pre-wrap break-words overflow-wrap-anywhere">
                  {message.content}
                </span>
              )}
              {message.isStreaming && (
                <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
              )}
            </>
          )}
        </div>


      </div>
      {message.role === "user" && (
        <Avatar className="w-8 h-8 mt-1 flex-shrink-0">
          <AvatarImage src={profile?.avatar_url || undefined} alt="User avatar" />
          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center">
            {profile?.avatar_url ? null : <User className="w-4 h-4" />}
            {!profile?.avatar_url && getInitials()}
          </AvatarFallback>
        </Avatar>
      )}
      </div>
      
      {/* Action bar below the chat bubble - confined to chat bubble width */}
      {message.role === "assistant" && (
        <div className="flex flex-row">
          <div className="w-8 flex-shrink-0" /> {/* Spacer for avatar alignment */}
          <div className="max-w-[90%]">
            <ChatActionIcons 
              message={message}
              onCopy={handleCopy}
              copied={copied}
              onRewrite={(messageId) => {
                // TODO: Implement rewrite functionality
                console.log('Rewrite message:', messageId);
              }}
              onEdit={(messageId) => {
                // For assistant messages, edit the previous user message for UX consistency
                onEditMessage?.(messageId);
              }}
              onDelete={(messageId) => {
                onDeleteMessage?.(messageId);
              }}
              onExport={(messageId, format) => {
                // TODO: Implement export functionality
                console.log('Export message:', messageId, 'as', format);
              }}
            />
          </div>
        </div>
      )}
      
      {/* Edit button for user messages - positioned on the left side */}
      {message.role === "user" && !isEditing && (
        <div className="flex justify-end">
          <div className="flex items-start gap-2 max-w-[85%]">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-muted/80 hover:text-foreground transition-colors opacity-60 hover:opacity-100 mt-1 flex-shrink-0"
              onClick={() => onEditMessage?.(message.id)}
              aria-label="Edit this message"
            >
              <Edit3 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
