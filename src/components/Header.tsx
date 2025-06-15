
import { Sun, Moon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import ChatOsIcon from "./icons/ChatOsIcon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Folder, Chat, Tag } from "@/services/chatService";
import FolderSelector from "./FolderSelector";

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
  activeChat: (Chat & { tags: Tag[] }) | undefined;
  createFolder: (name: string) => void;
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
  createFolder,
}: HeaderProps) => {
  return (
    <div className="flex items-center justify-between w-full gap-4">
      <div className="flex items-center gap-2 md:hidden">
        <ChatOsIcon className="w-8 h-8 text-primary" />
        <h1 className="text-xl font-semibold shrink-0">ChatOS</h1>
      </div>
      <div className="hidden sm:flex items-center justify-center gap-2">
        <Select
          onValueChange={onSelectProvider}
          value={selectedProvider}
          disabled={isLoadingProviders || availableProviders.length === 0}
        >
          <SelectTrigger className="w-[120px] truncate h-9">
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent>
            {availableProviders.map((provider) => (
              <SelectItem key={provider} value={provider}>
                {provider}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          onValueChange={onSelectModel}
          value={selectedModel}
          disabled={!selectedProvider || availableModels.length === 0}
        >
          <SelectTrigger className="w-[200px] truncate h-9">
            <SelectValue placeholder="Model" />
          </SelectTrigger>
          <SelectContent>
            {availableModels.map((model) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <FolderSelector
          activeChat={activeChat}
          folders={folders}
          createFolder={createFolder}
          onAssignChatToFolder={onAssignChatToFolder}
        />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Sun
            className={`w-4 h-4 ${
              !isDarkMode ? "text-yellow-500" : "text-muted-foreground"
            }`}
          />
          <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
          <Moon
            className={`w-4 h-4 ${
              isDarkMode ? "text-blue-400" : "text-muted-foreground"
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default Header;
