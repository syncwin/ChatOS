
import { Sun, Moon, Download } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ChatOsIcon from "./icons/ChatOsIcon";
import FolderDropdown from "./FolderDropdown";
import TagDropdown from "./TagDropdown";
import ProviderIconSelector from "./ProviderIconSelector";
import MobileSelectionModal from "./MobileSelectionModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import type { Folder, Chat, Tag } from "@/services/chatService";
import type { ModelInfo } from '@/services/modelProviderService';

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

interface HeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  availableProviders: string[];
  selectedProvider: string;
  onSelectProvider: (provider: string) => void;
  availableModels: ModelInfo[];
  isLoadingModels: boolean;
  modelError: string | null;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  isLoadingProviders: boolean;
  folders: Folder[];
  isLoadingFolders: boolean;
  onAssignChatToFolder: (folderId: string) => void;
  activeChat: Chat | undefined;
  tags: Tag[];
  chatTags: Tag[];
  isLoadingTags: boolean;
  onAssignTagToChat: (tagId: string) => void;
  onRemoveTagFromChat: (tagId: string) => void;
  onCreateFolder: (name: string) => void;
  onCreateTag: (name: string, color?: string) => void;
  onOpenSettings: () => void;
  messages?: Message[];
}

const Header = ({
  isDarkMode,
  toggleDarkMode,
  availableProviders,
  selectedProvider,
  onSelectProvider,
  availableModels,
  selectedModel,
  onSelectModel,
  isLoadingModels,
  modelError,
  isLoadingProviders,
  folders,
  isLoadingFolders,
  onAssignChatToFolder,
  activeChat,
  tags,
  chatTags,
  isLoadingTags,
  onAssignTagToChat,
  onRemoveTagFromChat,
  onCreateFolder,
  onCreateTag,
  onOpenSettings,
  messages
}: HeaderProps) => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { profile } = useProfile();

  const handleThemeToggle = () => {
    toggleDarkMode();
  };

  // Helper function to decode HTML entities
  const decodeHtmlEntities = (text: string): string => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  // Helper function to convert markdown to HTML
  const markdownToHtml = (markdown: string): string => {
    let html = markdown;
    
    // Convert code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Convert headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Convert bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Convert links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    
    // Convert line breaks
    html = html.replace(/\n/g, '<br>');
    
    return html;
  };

  const handleFullChatExport = async (format: 'pdf' | 'markdown') => {
    try {
      if (!messages || messages.length === 0) {
        toast({
          title: "No Content",
          description: "No chat messages to export.",
          variant: "destructive"
        });
        return;
      }

      // Get user name for proper labeling
      const userName = profile?.username || profile?.nickname || 'User';
      
      // Get conversation pairs (user input + AI response)
      const getConversationPairs = () => {
        const pairs = [];
        
        for (let i = 0; i < messages.length; i++) {
          const msg = messages[i];
          if (msg.role === 'user') {
            const userMsg = msg;
            const aiMsg = messages[i + 1];
            
            pairs.push({
              user: userMsg,
              assistant: aiMsg && aiMsg.role === 'assistant' ? aiMsg : null
            });
          }
        }
        
        return pairs;
      };
      
      const conversationPairs = getConversationPairs();
      
      if (format === 'markdown') {
        // Generate comprehensive markdown content
        let markdownContent = `# ChatOS - Full Chat Export\n\n`;
        markdownContent += `**Export Date:** ${new Date().toLocaleString()}\n\n`;
        markdownContent += `**Conversation Summary:** ${conversationPairs.length} message pairs\n\n`;
        markdownContent += `---\n\n`;
        
        conversationPairs.forEach((pair, index) => {
          if (conversationPairs.length > 1) {
            markdownContent += `## Message Pair ${index + 1}\n\n`;
          }
          
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
        a.download = `chatOS-full-conversation-${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Export Complete",
          description: "Full chat exported as Markdown successfully."
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
                  <p style="margin: 0; color: #64748b; font-size: 14px; font-weight: 500;">Full Chat Export</p>
                </div>
              </div>
              <div style="text-align: right; color: #64748b; font-size: 12px;">
                <p style="margin: 0;"><strong>Export Date:</strong> ${new Date().toLocaleString()}</p>
                <p style="margin: 0;"><strong>Messages:</strong> ${conversationPairs.length} pair(s)</p>
              </div>
            </div>
          </header>
          
          <main>
        `;
        
        // Add conversation pairs
        conversationPairs.forEach((pair, index) => {
          if (conversationPairs.length > 1) {
            pdfContent += `
              <section style="margin-bottom: 40px;">
                <h2 style="color: #3f00ff; font-size: 18px; font-weight: 600; margin-bottom: 20px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;">Message Pair ${index + 1}</h2>
            `;
          } else {
            pdfContent += `<section style="margin-bottom: 40px;">`;
          }
          
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
        
        // Use html2canvas and jsPDF for PDF generation
        const html2canvas = (await import('html2canvas')).default;
        const jsPDF = (await import('jspdf')).default;
        
        const canvas = await html2canvas(pdfContainer, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        pdf.save(`chatOS-full-conversation-${new Date().toISOString().split('T')[0]}.pdf`);
        
        // Clean up
        document.body.removeChild(pdfContainer);
        
        toast({
          title: "Export Complete",
          description: "Full chat exported as PDF successfully."
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export chat. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="header-main flex items-center w-full gap-1 xs:gap-2 sm:gap-4 px-1 xs:px-2 sm:px-0">
      {/* Mobile Logo - only show on mobile */}
      <div className="flex items-center gap-1 xs:gap-2 md:hidden flex-shrink-0">
        <ChatOsIcon className="header-icon-hover mobile-logo w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-primary" />
      </div>
      
      {/* Main controls - conditional based on screen size */}
      <div className="header-controls flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-2 flex-1 min-w-0">
        {isMobile ? (
          /* Mobile: Empty center space */
          <div className="flex-1"></div>
        ) : (
          /* Desktop: Individual selectors with responsive layout */
          <div className="flex items-center justify-center gap-1 xs:gap-2 sm:gap-3 md:gap-4 flex-wrap">
            <div className="flex-shrink-0">
              <ProviderIconSelector
                availableProviders={availableProviders}
                selectedProvider={selectedProvider}
                onSelectProvider={onSelectProvider}
                availableModels={availableModels}
                selectedModel={selectedModel}
                onSelectModel={onSelectModel}
                isLoadingProviders={isLoadingProviders}
                isLoadingModels={isLoadingModels}
                modelError={modelError}
              />
            </div>

            <div className="flex-shrink-0">
              <FolderDropdown 
                folders={folders} 
                activeChat={activeChat} 
                onAssignChatToFolder={onAssignChatToFolder} 
                onCreateFolder={onCreateFolder} 
                isLoading={isLoadingFolders} 
              />
            </div>

            <div className="flex-shrink-0">
              <TagDropdown 
                tags={tags} 
                chatTags={chatTags} 
                activeChat={activeChat} 
                onAssignTagToChat={onAssignTagToChat} 
                onRemoveTagFromChat={onRemoveTagFromChat} 
                onCreateTag={onCreateTag} 
                isLoading={isLoadingTags} 
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Right side controls */}
      <div className="flex items-center gap-2 xs:gap-3 sm:gap-4 flex-shrink-0">
        {/* Mobile modal - positioned on the right */}
        {isMobile && (
          <MobileSelectionModal
            availableProviders={availableProviders}
            selectedProvider={selectedProvider}
            onSelectProvider={onSelectProvider}
            availableModels={availableModels}
            selectedModel={selectedModel}
            onSelectModel={onSelectModel}
            isLoadingProviders={isLoadingProviders}
            isLoadingModels={isLoadingModels}
            modelError={modelError}
            folders={folders}
            isLoadingFolders={isLoadingFolders}
            onAssignChatToFolder={onAssignChatToFolder}
            activeChat={activeChat}
            tags={tags}
            chatTags={chatTags}
            isLoadingTags={isLoadingTags}
            onAssignTagToChat={onAssignTagToChat}
            onRemoveTagFromChat={onRemoveTagFromChat}
            onCreateFolder={onCreateFolder}
            onCreateTag={onCreateTag}
          />
        )}
        
        {/* Export Chat Button */}
        {messages && messages.length > 0 && (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="header-icon-hover h-8 w-8 relative"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export full chat</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleFullChatExport('markdown')}>
                Export as Markdown
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFullChatExport('pdf')}>
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Theme toggle with improved spacing and consistent styling */}
        <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 px-1.5 xs:px-2 py-1 xs:py-1.5 rounded-md bg-muted/20 hover:bg-muted/40 transition-all duration-200">
          <Sun className={`w-3.5 h-3.5 xs:w-4 xs:h-4 transition-colors duration-200 ${!isDarkMode ? "text-primary" : "text-muted-foreground hover:text-foreground"}`} />
          <Switch 
            checked={isDarkMode} 
            onCheckedChange={handleThemeToggle}
            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input scale-90 xs:scale-100" 
          />
          <Moon className={`w-3.5 h-3.5 xs:w-4 xs:h-4 transition-colors duration-200 ${isDarkMode ? "text-primary" : "text-muted-foreground hover:text-foreground"}`} />
        </div>
      </div>
    </div>
  );
};

export default Header;
