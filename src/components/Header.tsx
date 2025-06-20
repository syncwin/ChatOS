
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

  return (
    <div className="header-main flex items-center justify-between w-full gap-2 sm:gap-4 px-2 sm:px-0">
      {/* Mobile Logo - only show on mobile */}
      <div className="flex items-center gap-2 md:hidden">
        <ChatOsIcon className="header-icon-hover w-6 h-6 sm:w-8 sm:h-8 text-primary" />
      </div>
      
      {/* Main controls - conditional based on screen size */}
      <div className="header-controls flex items-center justify-center gap-1 sm:gap-2 flex-1 overflow-hidden min-w-0">
        {isMobile ? (
          /* Mobile: Empty center space */
          <div className="flex-1"></div>
        ) : (
          /* Desktop: Individual selectors */
          <>
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

            <FolderDropdown 
              folders={folders} 
              activeChat={activeChat} 
              onAssignChatToFolder={onAssignChatToFolder} 
              onCreateFolder={onCreateFolder} 
              isLoading={isLoadingFolders} 
            />

            <TagDropdown 
              tags={tags} 
              chatTags={chatTags} 
              activeChat={activeChat} 
              onAssignTagToChat={onAssignTagToChat} 
              onRemoveTagFromChat={onRemoveTagFromChat} 
              onCreateTag={onCreateTag} 
              isLoading={isLoadingTags} 
            />
          </>
        )}
      </div>
      
      {/* Right side controls */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
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
        
        {/* Theme toggle */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Sun className={`header-icon-hover w-3 h-3 sm:w-4 sm:h-4 ${!isDarkMode ? "text-primary" : "text-muted-foreground"}`} />
          <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} className="scale-75 sm:scale-100" />
          <Moon className={`header-icon-hover w-3 h-3 sm:w-4 sm:h-4 ${isDarkMode ? "text-primary" : "text-muted-foreground"}`} />
        </div>
      </div>
    </div>
  );
};

export default Header;
