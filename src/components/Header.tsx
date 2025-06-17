
import { Sun, Moon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import ChatOsIcon from "./icons/ChatOsIcon";
import FolderDropdown from "./FolderDropdown";
import TagDropdown from "./TagDropdown";
import ProviderIconSelector from "./ProviderIconSelector";
import type { Folder, Chat, Tag } from "@/services/chatService";

interface HeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  availableProviders: string[];
  selectedProvider: string;
  onSelectProvider: (provider: string) => void;
  availableModels: string[];
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
  return (
    <div className="flex items-center justify-between w-full gap-4">
      <div className="flex items-center gap-2 md:hidden">
        <ChatOsIcon className="w-8 h-8 text-primary" />
        <h1 className="text-xl font-semibold shrink-0">ChatOS</h1>
      </div>
      
      <div className="hidden sm:flex items-center justify-center gap-2">
        <ProviderIconSelector
          availableProviders={availableProviders}
          selectedProvider={selectedProvider}
          onSelectProvider={onSelectProvider}
          availableModels={availableModels}
          selectedModel={selectedModel}
          onSelectModel={onSelectModel}
          isLoadingProviders={isLoadingProviders}
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
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Sun className={`w-4 h-4 ${!isDarkMode ? "text-yellow-500" : "text-muted-foreground"}`} />
          <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
          <Moon className={`w-4 h-4 ${isDarkMode ? "text-blue-400" : "text-muted-foreground"}`} />
        </div>
      </div>
    </div>
  );
};

export default Header;
