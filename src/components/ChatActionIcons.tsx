
import React, { useState } from "react";
import { Copy, Check, Edit3, Trash2, Share, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import html2pdf from 'html2pdf.js';

interface Message {
  id: string;
  chat_id: string;
  user_id: string;
  created_at: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  model?: string;
  usage?: { prompt_tokens: number; completion_tokens: number };
  isStreaming?: boolean;
}

interface ChatActionIconsProps {
  message: Message;
  onCopy: () => void;
  copied: boolean;
  onRewrite: (messageId: string) => void;
  onEdit: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onExport: (messageId: string, format: string) => void;
}

const ChatActionIcons = ({
  message,
  onCopy,
  copied,
  onRewrite,
  onEdit,
  onDelete,
  onExport
}: ChatActionIconsProps) => {
  const { toast } = useToast();

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Chat Message',
          text: message.content,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(message.content);
        toast({
          title: "Shared!",
          description: "Message copied to clipboard for sharing.",
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
      toast({
        title: "Share failed",
        description: "Unable to share the message.",
        variant: "destructive",
      });
    }
  };

  const exportAsPDF = async () => {
    try {
      const element = document.createElement('div');
      element.innerHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">Chat Message</h2>
          <div style="margin-top: 20px;">
            <p style="color: #666; font-size: 12px; margin-bottom: 10px;">
              ${message.model ? `Model: ${message.model} | ` : ''}
              ${new Date(message.created_at).toLocaleString()}
            </p>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; white-space: pre-wrap; line-height: 1.6;">
              ${message.content}
            </div>
          </div>
        </div>
      `;

      const opt = {
        margin: 1,
        filename: `chat-message-${message.id.slice(0, 8)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
      
      toast({
        title: "PDF Downloaded",
        description: "Chat message exported successfully.",
      });
    } catch (error) {
      console.error('PDF export failed:', error);
      toast({
        title: "Export failed",
        description: "Unable to export as PDF.",
        variant: "destructive",
      });
    }
  };

  const exportAsMarkdown = () => {
    try {
      const markdownContent = `# Chat Message

**Model:** ${message.model || 'Unknown'}  
**Date:** ${new Date(message.created_at).toLocaleString()}

---

${message.content}
`;

      const blob = new Blob([markdownContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-message-${message.id.slice(0, 8)}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Markdown Downloaded",
        description: "Chat message exported successfully.",
      });
    } catch (error) {
      console.error('Markdown export failed:', error);
      toast({
        title: "Export failed",
        description: "Unable to export as Markdown.",
        variant: "destructive",
      });
    }
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {/* Copy button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-muted/80 hover:text-foreground transition-colors"
              onClick={onCopy}
              aria-label="Copy message"
            >
              {copied ? (
                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-600" />
              ) : (
                <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{copied ? "Copied!" : "Copy message"}</p>
          </TooltipContent>
        </Tooltip>

        {/* Edit button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-muted/80 hover:text-foreground transition-colors"
              onClick={() => onEdit(message.id)}
              aria-label="Edit previous message"
            >
              <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Edit previous message</p>
          </TooltipContent>
        </Tooltip>

        {/* Delete button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-muted/80 hover:text-destructive transition-colors"
              onClick={() => onDelete(message.id)}
              aria-label="Delete message"
            >
              <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Delete message</p>
          </TooltipContent>
        </Tooltip>

        {/* Share button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-muted/80 hover:text-foreground transition-colors"
              onClick={handleShare}
              aria-label="Share message"
            >
              <Share className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Share message</p>
          </TooltipContent>
        </Tooltip>

        {/* Export dropdown */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-muted/80 hover:text-foreground transition-colors"
                  aria-label="Export message"
                >
                  <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Export message</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuItem onClick={exportAsPDF} className="text-xs">
              Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportAsMarkdown} className="text-xs">
              Export as Markdown
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
};

export default ChatActionIcons;
