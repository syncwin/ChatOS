
import { User, Copy, Check, Send, X, Edit3, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
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
import type { MessageVariation } from "@/services/chatService";

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
  error?: string;
}

interface ChatMessageProps {
  message: Message;
  messages?: Message[];
  isEditing?: boolean;
  editingContent?: string;
  setEditingContent?: (value: string) => void;
  onEditMessage?: (messageId: string) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  onDeleteMessage?: (messageId: string) => void;
  onRewrite?: (messageId: string) => void;
  messageVariations?: MessageVariation[];
  currentVariationIndex?: number;
  onVariationChange?: (index: number) => void;
}

const ChatMessage = ({ 
  message, 
  messages,
  isEditing = false, 
  editingContent = '', 
  setEditingContent, 
  onEditMessage, 
  onSaveEdit, 
  onCancelEdit,
  onDeleteMessage,
  onRewrite,
  messageVariations = [],
  currentVariationIndex = 0,
  onVariationChange
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

  // Helper function to get the current variation content
  const getCurrentVariationContent = () => {
    if (messageVariations && messageVariations.length > 0 && currentVariationIndex !== undefined) {
      const variation = messageVariations[currentVariationIndex];
      return variation ? variation.content : message.content;
    }
    return message.content;
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
    <div className="flex flex-col gap-1 sm:gap-2 w-full">
      <div className={`flex gap-2 sm:gap-3 group w-full ${message.role === "user" ? "justify-end" : "flex-row"}`}>
      {message.role === "assistant" && (
        <Avatar className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mt-1 flex-shrink-0">
          <AvatarFallback className="bg-muted/50 text-foreground flex items-center justify-center">
            <ChatOsIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
          </AvatarFallback>
        </Avatar>
      )}
      <div className={`chat-bubble p-2 sm:p-3 lg:p-4 rounded-lg shadow-md relative group break-words overflow-wrap-anywhere ${
          message.role === "user"
            ? "max-w-[85%] bg-muted text-foreground"
            : message.error
            ? "max-w-[90%] bg-destructive/10 border border-destructive/20"
            : "max-w-[90%] bg-card border"
        }`}
      >
        <div className="text-xs sm:text-sm lg:text-base leading-relaxed">
          {isEditing && message.role === "user" ? (
            <div className="space-y-2 sm:space-y-3" role="region" aria-label="Edit message">
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
                  className="flex-1 w-full resize-none p-1 sm:p-2 bg-transparent text-xs sm:text-sm focus:outline-none rounded-none min-w-0"
                  placeholder="Edit your message... (Ctrl+Enter to send, Escape to cancel)"
                  minRows={2}
                  maxRows={8}
                  autoFocus
                  aria-label="Edit message content"
                />
              </div>
              <div className="flex gap-1 sm:gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCancelEdit}
                  className="flex items-center gap-1 hover:bg-muted hover:text-muted-foreground border-muted-foreground/30 hover:border-muted-foreground/50 transition-all text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                  aria-label="Cancel editing"
                >
                  <X className="w-3 h-3" />
                  <span className="hidden xs:inline">Cancel</span>
                </Button>
                <Button
                  size="sm"
                  onClick={onSaveEdit}
                  className={`flex items-center gap-1 transition-all text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 ${
                    editingContent.trim() 
                      ? 'bg-accent hover:bg-accent/90 text-accent-foreground' 
                      : 'bg-muted hover:bg-muted/90 text-muted-foreground'
                  }`}
                  disabled={!editingContent.trim()}
                  aria-label="Save edited message and regenerate response"
                >
                  <Send className="w-3 h-3" />
                  <span className="hidden xs:inline">Send</span>
                </Button>
              </div>
            </div>
          ) : (
            <>
              {message.error ? (
                <div className="flex items-start gap-2 text-destructive">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-1">Error occurred</p>
                    <p className="text-xs opacity-90">{message.error}</p>
                  </div>
                </div>
              ) : message.role === "assistant" ? (
                <ReactMarkdown
                  components={{
                    code(props) {
                      const { children, className, node, ...rest } = props;
                      const match = /language-(\w+)/.exec(className || '');
                      return match ? (
                        <pre className="bg-muted/50 dark:bg-muted/20 text-foreground rounded-md p-1 sm:p-2 lg:p-4 my-1 sm:my-2 overflow-x-auto break-words whitespace-pre-wrap max-w-full">
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
                    h1: ({ children }) => <h1 className="text-sm sm:text-lg lg:text-xl font-bold mt-2 sm:mt-4 mb-1 sm:mb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-sm sm:text-base lg:text-lg font-semibold mt-2 sm:mt-3 mb-1 sm:mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-xs sm:text-sm lg:text-base font-medium mt-1 sm:mt-2 mb-1">{children}</h3>,
                    p: ({ children }) => <p className="mb-1 sm:mb-2 last:mb-0 break-words overflow-wrap-anywhere">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-1 sm:mb-2 space-y-0.5 sm:space-y-1 pl-2 sm:pl-4">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-1 sm:mb-2 space-y-0.5 sm:space-y-1 pl-2 sm:pl-4">{children}</ol>,
                    li: ({ children }) => <li className="ml-1 sm:ml-2">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 sm:border-l-4 border-muted-foreground pl-2 sm:pl-4 italic my-1 sm:my-2">
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
                      <div className="overflow-x-auto my-1 sm:my-2 max-w-full">
                        <table className="min-w-full border border-border rounded-lg text-xs sm:text-sm">
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="border border-border px-1 sm:px-2 lg:px-3 py-1 sm:py-2 bg-muted font-medium text-left text-xs sm:text-sm">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-border px-1 sm:px-2 lg:px-3 py-1 sm:py-2 text-xs sm:text-sm">
                        {children}
                      </td>
                    ),
                  }}
                >
                  {getCurrentVariationContent()}
                </ReactMarkdown>
              ) : (
                <span className="whitespace-pre-wrap break-words overflow-wrap-anywhere">
                  {getCurrentVariationContent()}
                </span>
              )}
              {message.isStreaming && (
                <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-sm italic">Generating response...</span>
                </div>
              )}
            </>
          )}
          {/* Variation controls and info icons inside assistant message bubble */}
          {message.role === "assistant" && !message.isStreaming && (
            <div className="flex justify-between items-center mt-2">
              {/* Variation Controls - positioned on the left */}
              {!message.error && messageVariations && messageVariations.length > 1 && (
                <div className="flex items-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => onVariationChange?.(Math.max(0, (currentVariationIndex || 0) - 1))}
                    disabled={(currentVariationIndex || 0) === 0}
                    aria-label="Previous variation"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </Button>
                  <span className="text-xs text-muted-foreground px-1 min-w-[2rem] text-center">
                    {(currentVariationIndex || 0) + 1}/{messageVariations.length}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => onVariationChange?.(Math.min(messageVariations.length - 1, (currentVariationIndex || 0) + 1))}
                    disabled={(currentVariationIndex || 0) === messageVariations.length - 1}
                    aria-label="Next variation"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              )}
              
              {/* Info icons - positioned on the right */}
              <div className="flex justify-end">
                <ChatActionIcons 
                  message={message}
                  messages={messages}
                  onCopy={handleCopy}
                  copied={copied}
                  onRewrite={onRewrite}
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
                  rewriteVariations={[]}
                  currentVariationIndex={0}
                  onVariationChange={undefined}
                  variant="info"
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {message.role === "user" && (
        <Avatar className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mt-1 flex-shrink-0">
          <AvatarImage src={profile?.avatar_url || undefined} alt="User avatar" />
          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center text-sm sm:text-base lg:text-lg font-medium">
            {profile?.avatar_url ? null : <User className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />}
            {!profile?.avatar_url && getInitials()}
          </AvatarFallback>
        </Avatar>
      )}
      </div>
      
      {/* Action icons below the chat bubble - with proper mobile constraints */}
      {message.role === "assistant" && !message.isStreaming && (
        <div className="flex flex-row w-full">
          <div className="w-8 sm:w-10 lg:w-12 flex-shrink-0" /> {/* Spacer for avatar alignment */}
          <div className="flex-1 min-w-0">
            <div className="max-w-[90%]">
              <ChatActionIcons 
                message={message}
                messages={messages}
                onCopy={handleCopy}
                copied={copied}
                onRewrite={onRewrite}
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
                rewriteVariations={messageVariations?.map(v => v.content) || []}
                currentVariationIndex={currentVariationIndex || 0}
                onVariationChange={onVariationChange}
                variant="actions"
              />
            </div>
          </div>
        </div>
      )}
      

    </div>
  );
};

export default ChatMessage;
