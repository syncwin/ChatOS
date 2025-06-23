import React, { useState } from 'react';
import {
  Share2,
  Download,
  RotateCcw,
  Edit3,
  Trash2,
  Clock,
  FileText,
  FileDown,
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
import { 
  exportAsMarkdown, 
  exportAsPdf, 
  getConversationPairs,
  type Message as ExportMessage,
  type ConversationPair 
} from '@/lib/exportUtils';
import { getProviderIcon } from '@/lib/providerIcons';
import { calculateCost, formatCost, type Usage } from '@/lib/pricingUtils';

// Component interfaces

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

  // Export handler using utility functions

  const handleExport = async (format: 'pdf' | 'markdown') => {
    try {
      setIsExportPopoverOpen(false);
      
      // Get conversation context - find related messages
      const conversationMessages = messages.length > 0 ? messages : [message];
      
      // Find the current message index to get context
      const currentIndex = conversationMessages.findIndex(msg => msg.id === message.id);
      
      // Get conversation pairs using utility function
      const conversationPairs = getConversationPairs(conversationMessages, message);
      
      if (format === 'markdown') {
        await exportAsMarkdown(conversationPairs, profile);
        toast({
          title: 'Export successful',
          description: 'Message exported as Markdown file.',
        });
      } else if (format === 'pdf') {
        await exportAsPdf(conversationPairs, profile);
        toast({
          title: 'Export successful',
          description: 'Message exported as PDF file.',
        });
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
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '-';
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
          className={`h-8 w-8 p-0 transition-colors opacity-80 hover:opacity-100 ${
            variant === 'destructive' 
              ? 'hover:bg-destructive/40 hover:text-destructive-foreground' 
              : 'hover:bg-accent hover:text-accent-foreground'
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

  // Helper function to get current variation data
  const getCurrentVariationData = () => {
    if (rewriteVariations.length > 1 && currentVariationIndex < rewriteVariations.length) {
      // For variations, we need to get the full variation object from the parent
      // This assumes the parent component passes the full variation data
      return {
        provider: message.provider, // Will be updated by parent when variation changes
        model: message.model,       // Will be updated by parent when variation changes
        usage: message.usage        // Will be updated by parent when variation changes
      };
    }
    return {
      provider: message.provider,
      model: message.model,
      usage: message.usage
    };
  };

  const currentData = getCurrentVariationData();
  
  // Get provider icon
  const ProviderIcon = getProviderIcon(currentData.provider);

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
                className="h-6 w-6 p-0 hover:bg-accent hover:text-accent-foreground transition-colors opacity-80 hover:opacity-100"
                aria-label="Provider and model information"
              >
                <ProviderIcon className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <ProviderIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm break-words">{currentData.provider || 'Unknown Provider'}</p>
                    <p className="text-xs text-muted-foreground break-words">{currentData.model || 'Unknown Model'}</p>
                  </div>
                </div>
                {currentData.usage && (
                  <div className="border-t pt-2">
                    <p className="text-xs font-medium mb-2">Token Usage</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-muted/50 rounded px-2 py-1">
                        <p className="text-muted-foreground">Input</p>
                        <p className="font-medium">{currentData.usage?.prompt_tokens?.toLocaleString() || '-'}</p>
                      </div>
                      <div className="bg-muted/50 rounded px-2 py-1">
                        <p className="text-muted-foreground">Output</p>
                        <p className="font-medium">{currentData.usage?.completion_tokens?.toLocaleString() || '-'}</p>
                      </div>
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-xs text-muted-foreground">Total: <span className="font-medium">{((currentData.usage?.prompt_tokens || 0) + (currentData.usage?.completion_tokens || 0)).toLocaleString()}</span> tokens</p>
                    </div>
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
                className="h-6 w-6 p-0 hover:bg-accent hover:text-accent-foreground transition-colors opacity-80 hover:opacity-100"
                aria-label="Message timestamp"
              >
                <Clock className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium">Message Time</p>
                </div>
                <p className="text-muted-foreground">{formatTimestamp(message.created_at)}</p>
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
                    className="h-8 w-8 p-0 hover:bg-accent hover:text-accent-foreground transition-colors opacity-80 hover:opacity-100"
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

          {/* Rewrite */}
          <ActionIcon
            icon={<RotateCcw className="w-4 h-4" />}
            tooltip="Rewrite"
            onClick={() => onRewrite?.(message.id)}
          />

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
                    className="h-8 w-8 p-0 hover:bg-destructive/40 hover:text-destructive-foreground transition-colors opacity-80 hover:opacity-100"
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