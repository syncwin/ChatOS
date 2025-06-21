
import { Sun, Moon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import ChatOsIcon from "./icons/ChatOsIcon";
import FolderDropdown from "./FolderDropdown";
import TagDropdown from "./TagDropdown";
import ProviderIconSelector from "./ProviderIconSelector";
import MobileSelectionModal from "./MobileSelectionModal";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Folder, Chat, Tag } from "@/services/chatService";
import type { ModelInfo } from '@/services/modelProviderService';

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
  onOpenSettings
}: HeaderProps) => {
  const isMobile = useIsMobile();

  const handleThemeToggle = () => {
    toggleDarkMode();
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
