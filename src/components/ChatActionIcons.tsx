import React, { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
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
  messages?: Message[]; // Full conversation context for export
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
  messages = [],
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
  const { profile } = useProfile();
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
      
      // Get conversation context - find related messages
      const conversationMessages = messages.length > 0 ? messages : [message];
      
      // Find the current message index to get context
      const currentIndex = conversationMessages.findIndex(msg => msg.id === message.id);
      
      // Get conversation pairs (user input + AI response)
      const getConversationPairs = () => {
        const pairs = [];
        
        // Single message export - only export the specific message pair
        if (message.role === 'assistant') {
          // Find the preceding user message
          let userMsg = null;
          for (let i = currentIndex - 1; i >= 0; i--) {
            if (conversationMessages[i].role === 'user') {
              userMsg = conversationMessages[i];
              break;
            }
          }
          pairs.push({ user: userMsg, assistant: message });
        } else if (message.role === 'user') {
          // Find the following assistant message
          let aiMsg = null;
          for (let i = currentIndex + 1; i < conversationMessages.length; i++) {
            if (conversationMessages[i].role === 'assistant') {
              aiMsg = conversationMessages[i];
              break;
            }
          }
          pairs.push({ user: message, assistant: aiMsg });
        }
        
        return pairs;
      };
      
      const conversationPairs = getConversationPairs();
      
      // Get user name for proper labeling
      const userName = profile?.username || profile?.full_name || 'User';
      
      if (format === 'markdown') {
        // Generate comprehensive markdown content
        let markdownContent = `# ChatOS - Single Message Export\n\n`;
        markdownContent += `**Export Date:** ${new Date().toLocaleString()}\n\n`;
        markdownContent += `**Export Type:** Single Message Pair\n\n`;
        markdownContent += `---\n\n`;
        
        conversationPairs.forEach((pair, index) => {
          
          if (pair.user) {
            markdownContent += `### 👤 ${userName}\n\n`;
            markdownContent += `${decodeHtmlEntities(pair.user.content)}\n\n`;
          }
          
          if (pair.assistant) {
            markdownContent += `### 🤖 ChatOS\n\n`;
            markdownContent += `${decodeHtmlEntities(pair.assistant.content)}\n\n`;
            
            if (pair.assistant.provider || pair.assistant.model) {
              markdownContent += `**Model Info:**\n`;
              if (pair.assistant.provider) markdownContent += `- Provider: ${pair.assistant.provider}\n`;
              if (pair.assistant.model) markdownContent += `- Model: ${pair.assistant.model}\n`;
              markdownContent += `\n`;
            }
          }
          
          if (index < conversationPairs.length - 1) {
            markdownContent += `---\n\n`;
          }
        });
        
        markdownContent += `\n---\n\n*Generated by ChatOS*`;
        
        // Create and download markdown file
        const blob = new Blob([markdownContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chatOS-single-message-${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: 'Export successful',
          description: `Single message pair exported as Markdown file.`,
        });
      } else if (format === 'pdf') {
        // Create comprehensive PDF with conversation pairs
        if (conversationPairs.length === 0) {
          throw new Error('No conversation content to export');
        }
        
        // Create a temporary container for PDF content
        const pdfContainer = document.createElement('div');
        pdfContainer.style.position = 'fixed';
        pdfContainer.style.top = '-9999px';
        pdfContainer.style.left = '0';
        pdfContainer.style.width = '800px';
        pdfContainer.style.backgroundColor = '#ffffff';
        pdfContainer.style.padding = '40px';
        pdfContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        pdfContainer.style.fontSize = '14px';
        pdfContainer.style.lineHeight = '1.6';
        pdfContainer.style.color = '#333333';
        
        // Create improved PDF content with proper ChatOS branding
        let pdfContent = `
          <header style="margin-bottom: 40px; padding-bottom: 30px; border-bottom: 3px solid #3f00ff;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
              <div style="display: flex; align-items: center;">
                <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #3f00ff 0%, #8b5cf6 50%, #ff8000 100%); border-radius: 12px; margin-right: 20px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 24px; box-shadow: 0 4px 12px rgba(63, 0, 255, 0.3);">C</div>
                <div>
                  <h1 style="margin: 0; color: #3f00ff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">ChatOS</h1>
                  <p style="margin: 0; color: #64748b; font-size: 14px; font-weight: 500;">Single Message Export</p>
                </div>
              </div>
              <div style="text-align: right; color: #64748b; font-size: 12px;">
                <p style="margin: 0;"><strong>Export Date:</strong> ${new Date().toLocaleString()}</p>
                <p style="margin: 0;"><strong>Export Type:</strong> Single Message Pair</p>
              </div>
            </div>
          </header>
          
          <main>
        `;
        
        // Add conversation pairs
        conversationPairs.forEach((pair, index) => {
          pdfContent += `<section style="margin-bottom: 40px;">`;
          
          // User Input
          if (pair.user) {
            const userHtmlContent = markdownToHtml(decodeHtmlEntities(pair.user.content));
            pdfContent += `
              <article style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #0ea5e9; border-radius: 16px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(14, 165, 233, 0.1);">
                <header style="display: flex; align-items: center; margin-bottom: 16px;">
                  <span style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 6px 16px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-right: 12px; box-shadow: 0 2px 4px rgba(14, 165, 233, 0.3);">👤 Question</span>
                  <span style="color: #0369a1; font-weight: 600; font-size: 14px;">${userName}</span>
                </header>
                <div style="font-size: 14px; line-height: 1.7; color: #1e293b;">
                  ${userHtmlContent}
                </div>
              </article>
            `;
          }
          
          // AI Response
          if (pair.assistant) {
            const assistantHtmlContent = markdownToHtml(decodeHtmlEntities(pair.assistant.content));
            pdfContent += `
              <article style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px solid #64748b; border-radius: 16px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(100, 116, 139, 0.1);">
                <header style="display: flex; align-items: center; margin-bottom: 16px;">
                  <span style="background: linear-gradient(135deg, #64748b 0%, #475569 100%); color: white; padding: 6px 16px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-right: 12px; box-shadow: 0 2px 4px rgba(100, 116, 139, 0.3);">🤖 Answer</span>
                  <span style="color: #475569; font-weight: 600; font-size: 14px;">ChatOS</span>
                </header>
                <div style="font-size: 14px; line-height: 1.7; color: #1e293b;">
                  ${assistantHtmlContent}
                </div>
            `;
            
            // Add model information if available
            if (pair.assistant.provider || pair.assistant.model) {
              pdfContent += `
                <footer style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
                  <div style="display: flex; gap: 20px;">
                    ${pair.assistant.provider ? `<span><strong>Provider:</strong> ${pair.assistant.provider}</span>` : ''}
                    ${pair.assistant.model ? `<span><strong>Model:</strong> ${pair.assistant.model}</span>` : ''}
                  </div>
                </footer>
              `;
            }
            
            pdfContent += `</article>`;
          }
          
          pdfContent += `</section>`;
          
          // Add separator between pairs
          if (index < conversationPairs.length - 1) {
            pdfContent += `<hr style="border: none; border-top: 2px solid #e2e8f0; margin: 40px 0;">`;
          }
        });
        
        pdfContent += `
          </main>
          
          <footer style="margin-top: 50px; padding-top: 30px; border-top: 3px solid #3f00ff; text-align: center; color: #64748b; font-size: 12px;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
              <div style="width: 24px; height: 24px; background: linear-gradient(135deg, #3f00ff 0%, #8b5cf6 50%, #ff8000 100%); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">C</div>
              <span style="font-weight: 600;">Generated by ChatOS</span>
            </div>
            <p style="margin: 8px 0 0 0; opacity: 0.7;">Exported on ${new Date().toLocaleString()}</p>
          </footer>
        `;
        
        pdfContainer.innerHTML = pdfContent;
        
        document.body.appendChild(pdfContainer);
        
        try {
          // Wait for content to render
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Capture the content as canvas
          const canvas = await html2canvas(pdfContainer, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: 800,
            height: pdfContainer.scrollHeight,
            scrollX: 0,
            scrollY: 0
          });
          
          // Create PDF
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 210; // A4 width in mm
          const pageHeight = 295; // A4 height in mm
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          let heightLeft = imgHeight;
          
          let position = 0;
          
          // Add first page
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
          
          // Add additional pages if needed
          while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }
          
          // Save the PDF
          pdf.save(`chatOS-single-message-${new Date().toISOString().split('T')[0]}.pdf`);
          
          toast({
            title: 'Single message exported successfully',
            description: 'Message pair exported as PDF file.',
          });
        } finally {
          // Clean up
          if (document.body.contains(pdfContainer)) {
            document.body.removeChild(pdfContainer);
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