import React, { useState } from 'react';
import html2pdf from 'html2pdf.js';
import {
  Share2,
  Download,
  RotateCcw,
  Edit3,
  Trash2,
  Clock,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileDown,
  Bot,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { decodeHtmlEntities } from '@/lib/utils';

// Provider icon components
const AnthropicIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" fillRule="evenodd" height="1em" style={{flex: 'none', lineHeight: 1}} viewBox="0 0 24 24" width="1em" className={className}>
    <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z" />
  </svg>
);

const GeminiIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" fillRule="evenodd" height="1em" style={{flex: 'none', lineHeight: 1}} viewBox="0 0 24 24" width="1em" className={className}>
    <path d="M12 24A14.304 14.304 0 000 12 14.304 14.304 0 0012 0a14.305 14.305 0 0012 12 14.305 14.305 0 00-12 12" />
  </svg>
);

const MistralIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" fillRule="evenodd" height="1em" style={{flex: 'none', lineHeight: 1}} viewBox="0 0 24 24" width="1em" className={className}>
    <path clipRule="evenodd" d="M3.428 3.4h3.429v3.428h3.429v3.429h-.002 3.431V6.828h3.427V3.4h3.43v13.714H24v3.429H13.714v-3.428h-3.428v-3.429h-3.43v3.428h3.43v3.429H0v-3.429h3.428V3.4zm10.286 13.715h3.428v-3.429h-3.427v3.429z" />
  </svg>
);

const OpenAIIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" fillRule="evenodd" height="1em" style={{flex: 'none', lineHeight: 1}} viewBox="0 0 24 24" width="1em" className={className}>
    <path d="M21.55 10.004a5.416 5.416 0 00-.478-4.501c-1.217-2.09-3.662-3.166-6.05-2.66A5.59 5.59 0 0010.831 1C8.39.995 6.224 2.546 5.473 4.838A5.553 5.553 0 001.76 7.496a5.487 5.487 0 00.691 6.5 5.416 5.416 0 00.477 4.502c1.217 2.09 3.662 3.165 6.05 2.66A5.586 5.586 0 0013.168 23c2.443.006 4.61-1.546 5.361-3.84a5.553 5.553 0 003.715-2.66 5.488 5.488 0 00-.693-6.497v.001zm-8.381 11.558a4.199 4.199 0 01-2.675-.954c.034-.018.093-.05.132-.074l4.44-2.53a.71.71 0 00.364-.623v-6.176l1.877 1.069c.02.01.033.029.036.05v5.115c-.003 2.274-1.87 4.118-4.174 4.123zM4.192 17.78a4.059 4.059 0 01-.498-2.763c.032.02.09.055.131.078l4.44 2.53c.225.13.504.13.73 0l5.42-3.088v2.138a.068.068 0 01-.027.057L9.9 19.288c-1.999 1.136-4.552.46-5.707-1.51h-.001zM3.023 8.216A4.15 4.15 0 015.198 6.41l-.002.151v5.06a.711.711 0 00.364.624l5.42 3.087-1.876 1.07a.067.067 0 01-.063.005l-4.489-2.559c-1.995-1.14-2.679-3.658-1.53-5.63h.001zm15.417 3.54l-5.42-3.088L14.896 7.6a.067.067 0 01.063-.006l4.489 2.557c1.998 1.14 2.683 3.662 1.529 5.633a4.163 4.163 0 01-2.174 1.807V12.38a.71.71 0 00-.363-.623zm1.867-2.773a6.04 6.04 0 00-.132-.078l-4.44-2.53a.731.731 0 00-.729 0l-5.42 3.088V7.325a.068.068 0 01.027-.057L14.1 4.713c2-1.137 4.555-.46 5.707 1.513.487.833.664 1.809.499 2.757h.001zm-11.741 3.81l-1.877-1.068a.065.065 0 01-.036-.051V6.559c.001-2.277 1.873-4.122 4.181-4.12.976 0 1.92.338 2.671.954-.034.018-.092.05-.131.073l-4.44 2.53a.71.71 0 00-.365.623l-.003 6.173v.002zm1.02-2.168L12 9.25l2.414 1.375v2.75L12 14.75l-2.415-1.375v-2.75z" />
  </svg>
);

const OpenRouterIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" fillRule="evenodd" height="1em" style={{flex: 'none', lineHeight: 1}} viewBox="0 0 24 24" width="1em" className={className}>
    <path d="M16.804 1.957l7.22 4.105v.087L16.73 10.21l.017-2.117-.821-.03c-1.059-.028-1.611.002-2.268.11-1.064.175-2.038.577-3.147 1.352L8.345 11.03c-.284.195-.495.336-.68.455l-.515.322-.397.234.385.23.53.338c.476.314 1.17.796 2.701 1.866 1.11.775 2.083 1.177 3.147 1.352l.3.045c.694.091 1.375.094 2.825.033l.022-2.159 7.22 4.105v.087L16.589 22l.014-1.862-.635.022c-1.386.042-2.137.002-3.138-.162-1.694-.28-3.26-.926-4.881-2.059l-2.158-1.5a21.997 21.997 0 00-.755-.498l-.467-.28a55.927 55.927 0 00-.76-.43C2.908 14.73.563 14.116 0 14.116V9.888l.14.004c.564-.007 2.91-.622 3.809-1.124l1.016-.58.438-.274c.428-.28 1.072-.726 2.686-1.853 1.621-1.133 3.186-1.78 4.881-2.059 1.152-.19 1.974-.213 3.814-.138l.02-1.907z" />
  </svg>
);

// Map providers to icons
const providerIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'OpenAI': OpenAIIcon,
  'Anthropic': AnthropicIcon,
  'Google': GeminiIcon,
  'Gemini': GeminiIcon,
  'Google Gemini': GeminiIcon,
  'Mistral': MistralIcon,
  'OpenRouter': OpenRouterIcon,
};

interface Message {
  id: string;
  chat_id: string;
  user_id: string;
  created_at: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  model?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
  isStreaming?: boolean;
}

interface ChatActionIconsProps {
  message: Message;
  onCopy?: () => void;
  copied?: boolean;
  onRewrite?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onExport?: (messageId: string, format: 'pdf' | 'markdown') => void;
  rewriteVariations?: string[];
  currentVariationIndex?: number;
  onVariationChange?: (index: number) => void;
  variant?: 'info' | 'actions';
}

const ChatActionIcons: React.FC<ChatActionIconsProps> = ({
  message,
  onCopy,
  copied = false,
  onRewrite,
  onEdit,
  onDelete,
  onExport,
  rewriteVariations = [],
  currentVariationIndex = 0,
  onVariationChange,
  variant = 'actions',
}) => {
  // Debug logging to check message data
  console.log('ChatActionIcons received message:', {
    id: message.id,
    provider: message.provider,
    model: message.model,
    usage: message.usage
  });
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isExportPopoverOpen, setIsExportPopoverOpen] = useState(false);

  const handleShare = async () => {
    try {
      // Copy the chat URL to clipboard
      const shareUrl = `${window.location.origin}/#/chat/${message.chat_id}`;
      await navigator.clipboard.writeText(shareUrl);
      
      toast({
        title: 'Link copied!',
        description: 'Chat link has been copied to clipboard.',
      });
      console.log('Chat link copied to clipboard:', shareUrl);
    } catch (error) {
      console.error('Failed to copy chat link:', error);
      toast({
        title: 'Failed to copy link',
        description: 'Could not copy chat link to clipboard.',
        variant: 'destructive',
      });
    }
  };

  // Helper function to convert markdown to HTML
  const markdownToHtml = (markdown: string): string => {
    if (!markdown || typeof markdown !== 'string') {
      return '';
    }
    
    // Enhanced markdown to HTML conversion
    let html = markdown
      // Code blocks (must be processed before inline code)
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      // Headers (process from most specific to least specific)
      .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold (process before italic to avoid conflicts)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*((?!\*)[^*]+)\*/g, '<em>$1</em>')
      .replace(/_((?!_)[^_]+)_/g, '<em>$1</em>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      // Lists
      .replace(/^\* (.+)$/gm, '<li>$1</li>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^\+ (.+)$/gm, '<li>$1</li>')
      // Numbered lists
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      // Blockquotes
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      // Horizontal rules
      .replace(/^---$/gm, '<hr>')
      .replace(/^\*\*\*$/gm, '<hr>')
      // Paragraphs and line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    
    // Wrap lists in ul/ol tags
    html = html.replace(/(<li>.*<\/li>)/gs, (match) => {
      if (match.includes('<li>')) {
        return `<ul>${match}</ul>`;
      }
      return match;
    });
    
    // Wrap content in paragraphs if not already wrapped
    if (html && !html.startsWith('<')) {
      html = `<p>${html}</p>`;
    }
    
    return html;
  };

  const handleExport = async (format: 'pdf' | 'markdown') => {
    try {
      setIsExportPopoverOpen(false);
      
      if (format === 'markdown') {
        // Generate markdown content with decoded HTML entities
        const decodedContent = decodeHtmlEntities(message.content);
        const markdownContent = `# Chat Message\n\n## Content\n\n${decodedContent}`;
        
        // Create and download markdown file
        const blob = new Blob([markdownContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-message-${message.id}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: 'Export successful',
          description: 'Message exported as Markdown file.',
        });
      } else if (format === 'pdf') {
        // For PDF, create proper HTML with ChatOS logo and styling
        const decodedContent = decodeHtmlEntities(message.content);
        const htmlContent = markdownToHtml(decodedContent);
        
        // ChatOS logo as base64 SVG
        const logoSvg = `data:image/svg+xml;base64,${btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="url(#chatOsGradient)">
            <defs>
              <linearGradient id="chatOsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#3f00ff" />
                <stop offset="100%" stop-color="#ff8000" />
              </linearGradient>
            </defs>
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9.5 13.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
          </svg>
        `)}`;
        
        const pdfHtml = `
          <html>
            <head>
              <title>ChatOS - Chat Message</title>
              <style>
                body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  margin: 0;
                  padding: 20px;
                  line-height: 1.6;
                  color: #333;
                }
                .header {
                  display: flex;
                  align-items: center;
                  margin-bottom: 30px;
                  padding-bottom: 20px;
                  border-bottom: 2px solid #e0e0e0;
                }
                .logo {
                  width: 40px;
                  height: 40px;
                  margin-right: 15px;
                }
                .header-text {
                  flex: 1;
                }
                .header h1 {
                  margin: 0;
                  color: #3f00ff;
                  font-size: 24px;
                  font-weight: 600;
                }
                .message-container {
                  background: ${message.role === 'user' ? '#f0f9ff' : '#f8fafc'};
                  border: 1px solid ${message.role === 'user' ? '#0ea5e9' : '#64748b'};
                  border-radius: 12px;
                  padding: 20px;
                  margin: 20px 0;
                }
                .message-header {
                  display: flex;
                  align-items: center;
                  margin-bottom: 15px;
                  font-weight: 600;
                  color: ${message.role === 'user' ? '#0369a1' : '#475569'};
                }
                .message-role {
                  background: ${message.role === 'user' ? '#0ea5e9' : '#64748b'};
                  color: white;
                  padding: 4px 12px;
                  border-radius: 20px;
                  font-size: 12px;
                  text-transform: uppercase;
                  margin-right: 10px;
                }
                .message-content {
                  font-size: 14px;
                  line-height: 1.7;
                }
                .message-content h1, .message-content h2, .message-content h3 {
                  margin-top: 20px;
                  margin-bottom: 10px;
                }
                .message-content h1 { font-size: 20px; }
                .message-content h2 { font-size: 18px; }
                .message-content h3 { font-size: 16px; }
                .message-content pre {
                  background: #f1f5f9;
                  border: 1px solid #e2e8f0;
                  border-radius: 6px;
                  padding: 12px;
                  overflow-x: auto;
                  font-family: 'Courier New', monospace;
                  font-size: 12px;
                }
                .message-content code {
                  background: #f1f5f9;
                  padding: 2px 4px;
                  border-radius: 3px;
                  font-family: 'Courier New', monospace;
                  font-size: 12px;
                }
                .message-content strong {
                  font-weight: 600;
                }
                .message-content em {
                  font-style: italic;
                }
                .message-content a {
                  color: #3f00ff;
                  text-decoration: none;
                }
                .message-content a:hover {
                  text-decoration: underline;
                }
                .message-content ul, .message-content ol {
                  margin: 10px 0;
                  padding-left: 20px;
                }
                .message-content li {
                  margin: 5px 0;
                }
                .message-content blockquote {
                  border-left: 4px solid #e2e8f0;
                  margin: 15px 0;
                  padding: 10px 15px;
                  background: #f8fafc;
                  font-style: italic;
                }
                .message-content hr {
                  border: none;
                  border-top: 1px solid #e2e8f0;
                  margin: 20px 0;
                }
                .message-content p {
                  margin: 10px 0;
                }
                .message-content h1:first-child,
                .message-content h2:first-child,
                .message-content h3:first-child,
                .message-content h4:first-child {
                  margin-top: 0;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <img src="${logoSvg}" alt="ChatOS Logo" class="logo" />
                <div class="header-text">
                  <h1>ChatOS</h1>
                </div>
              </div>
              
              <div class="message-container">
                <div class="message-header">
                  <span class="message-role">${message.role === 'user' ? 'Question' : 'Answer'}</span>
                  ${message.role === 'user' ? 'User Input' : 'AI Response'}
                </div>
                <div class="message-content">
                  ${htmlContent}
                </div>
              </div>
            </body>
          </html>
        `;
        
        // Use html2pdf.js for better PDF generation
        const opt = {
          margin: [10, 10, 10, 10],
          filename: `chatOS-message-${message.id}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            width: 800,
            height: 1000
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        // Validate content before proceeding
        if (!htmlContent || htmlContent.trim() === '') {
          throw new Error('No content to export');
        }
        
        // Create a temporary div to hold the HTML content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = pdfHtml;
        
        // Make sure the content is visible and properly sized
        tempDiv.style.position = 'fixed';
        tempDiv.style.top = '-9999px'; // Move off-screen instead of using opacity
        tempDiv.style.left = '0';
        tempDiv.style.width = '800px';
        tempDiv.style.minHeight = '1000px';
        tempDiv.style.backgroundColor = '#ffffff';
        tempDiv.style.zIndex = '9999';
        tempDiv.style.visibility = 'hidden'; // Hidden but still rendered
        tempDiv.style.pointerEvents = 'none';
        
        document.body.appendChild(tempDiv);
        
        // Wait longer for content to render and images to load
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify the content was properly added
        const contentElement = tempDiv.querySelector('.message-content');
        if (!contentElement || !contentElement.innerHTML.trim()) {
          throw new Error('Content not properly rendered');
        }
        
        try {
          await html2pdf().set(opt).from(tempDiv).save();
          
          toast({
            title: 'PDF exported successfully',
            description: 'Message exported as PDF file.',
          });
        } finally {
          // Ensure cleanup happens
          if (document.body.contains(tempDiv)) {
            document.body.removeChild(tempDiv);
          }
        }
      }
      
      onExport?.(message.id, format);
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export failed',
        description: 'Could not export the message.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = () => {
    onDelete?.(message.id);
    setIsDeleteDialogOpen(false);
    toast({
      title: 'Message deleted',
      description: 'The message has been removed from the chat.',
    });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Simple cost calculation based on common pricing (approximate)
  const calculateCost = (usage: { prompt_tokens: number; completion_tokens: number }, model?: string, provider?: string) => {
    if (!usage || (!usage.prompt_tokens && !usage.completion_tokens)) return null;
    
    // List of free models and providers
    const freeModels = [
      // OpenAI free tier models
      'gpt-3.5-turbo-free',
      'gpt-4o-mini-free',
      // Google/Gemini free models
      'gemini-1.5-flash-free',
      'gemini-pro-free',
      'gemini-flash-free',
      // Anthropic free tier
      'claude-3-haiku-free',
      // OpenRouter free models
      'openrouter/free',
      'free/gpt-3.5-turbo',
      // Other common free model patterns
      'free-gpt',
      'free-claude',
      'free-gemini',
      // Models that are typically free in development/testing
      'test-model',
      'demo-model',
      'playground-model'
    ];
    
    // Free providers (some providers offer free tiers)
    const freeProviders = [
      'free',
      'demo',
      'playground',
      'test'
    ];
    
    const modelKey = model?.toLowerCase() || '';
    const providerKey = provider?.toLowerCase() || '';
    
    // Check if model or provider is free
    const isFreeModel = freeModels.some(freeModel => 
      modelKey.includes(freeModel.toLowerCase()) || 
      modelKey === freeModel.toLowerCase()
    );
    
    const isFreeProvider = freeProviders.some(freeProvider => 
      providerKey.includes(freeProvider.toLowerCase()) || 
      providerKey === freeProvider.toLowerCase()
    );
    
    // Return $0 for free models/providers
    if (isFreeModel || isFreeProvider) {
      return 0;
    }
    
    // Approximate pricing per 1K tokens (in USD)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 0.0025, output: 0.01 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
      'claude-3-5-sonnet': { input: 0.003, output: 0.015 },
      'claude-3-5-haiku': { input: 0.00025, output: 0.00125 },
      'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },
      'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
    };
    
    const rates = pricing[modelKey] || { input: 0.001, output: 0.002 }; // Default rates
    
    const inputCost = (usage.prompt_tokens / 1000) * rates.input;
    const outputCost = (usage.completion_tokens / 1000) * rates.output;
    const totalCost = inputCost + outputCost;
    
    return totalCost;
  };

  const ActionIcon: React.FC<{
    icon: React.ReactNode;
    tooltip: string;
    onClick?: () => void;
    disabled?: boolean;
    variant?: 'default' | 'destructive';
  }> = ({ icon, tooltip, onClick, disabled = false, variant = 'default' }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className={`h-8 w-8 p-0 transition-colors opacity-60 hover:opacity-100 ${
            variant === 'destructive' 
              ? 'hover:bg-destructive/20 hover:text-destructive' 
              : 'hover:bg-muted/80 hover:text-foreground'
          }`}
          onClick={onClick}
          disabled={disabled}
          aria-label={tooltip}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );

  // Only show action icons for assistant messages that are not streaming
  if (message.role !== 'assistant' || message.isStreaming) {
    return null;
  }

  // Get provider icon
  const ProviderIcon = providerIcons[message.provider] || Bot;

  // Return info icons for inside chat bubble
  if (variant === 'info') {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-2 mt-2">
          {/* Provider Icon */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-muted/80 hover:text-foreground transition-colors opacity-60 hover:opacity-100"
                aria-label="Provider and model information"
              >
                <ProviderIcon className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <p className="font-medium">{message.provider || 'Unknown Provider'}</p>
                <p className="text-muted-foreground">{message.model || 'Unknown Model'}</p>
                {message.usage && (
                  <div className="mt-1 text-xs text-muted-foreground space-y-1">
                    <p>Input: {message.usage.prompt_tokens} tokens</p>
                    <p>Output: {message.usage.completion_tokens} tokens</p>
                    <p>Total: {message.usage.prompt_tokens + message.usage.completion_tokens} tokens</p>
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Timestamp */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-muted/80 hover:text-foreground transition-colors opacity-60 hover:opacity-100"
                aria-label="Message timestamp"
              >
                <Clock className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <p className="font-medium">Date & Time</p>
                <p>{formatTimestamp(message.created_at)}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  // Return action icons for outside chat bubble
  return (
      <TooltipProvider>
        <div className="flex items-center gap-1 mt-2">
          {/* Copy - only for assistant messages */}
          {message.role === 'assistant' && !message.isStreaming && message.content && (
            <ActionIcon
              icon={copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              tooltip={copied ? "Copied!" : "Copy"}
              onClick={onCopy}
            />
          )}

          {/* Share */}
          <ActionIcon
            icon={<Share2 className="w-4 h-4" />}
            tooltip="Share"
            onClick={handleShare}
          />

          {/* Export */}
          <Popover open={isExportPopoverOpen} onOpenChange={setIsExportPopoverOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-muted/80 hover:text-foreground transition-colors opacity-60 hover:opacity-100"
                    aria-label="Export options"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export</p>
              </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-48 p-2">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => handleExport('pdf')}
                >
                  <FileDown className="w-4 h-4" />
                  Export as PDF
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => handleExport('markdown')}
                >
                  <FileText className="w-4 h-4" />
                  Export as Markdown
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Rewrite with pagination */}
          <div className="flex items-center">
            <ActionIcon
              icon={<RotateCcw className="w-4 h-4" />}
              tooltip="Rewrite"
              onClick={() => onRewrite?.(message.id)}
            />
            {rewriteVariations.length > 1 && (
              <div className="flex items-center ml-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => onVariationChange?.(Math.max(0, currentVariationIndex - 1))}
                  disabled={currentVariationIndex === 0}
                  aria-label="Previous variation"
                >
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                <span className="text-xs text-muted-foreground px-1">
                  {currentVariationIndex + 1}/{rewriteVariations.length}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => onVariationChange?.(Math.min(rewriteVariations.length - 1, currentVariationIndex + 1))}
                  disabled={currentVariationIndex === rewriteVariations.length - 1}
                  aria-label="Next variation"
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Edit */}
          <ActionIcon
            icon={<Edit3 className="w-4 h-4" />}
            tooltip="Edit"
            onClick={() => onEdit?.(message.id)}
          />

          {/* Delete */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive transition-colors opacity-60 hover:opacity-100"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete</p>
              </TooltipContent>
            </Tooltip>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete the Input & Output Message</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this message? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </TooltipProvider>
    );
};

export default ChatActionIcons;