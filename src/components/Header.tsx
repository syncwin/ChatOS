
import { useState } from "react";
import { Sun, Moon, Tags } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
  tags: Tag[];
  assignTagToChat: (args: { chatId: string; tagId: string }) => void;
  removeTagFromChat: (args: { chatId: string; tagId: string }) => void;
  createTag: (name: string) => void;
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
  tags,
  assignTagToChat,
  removeTagFromChat,
  createTag,
}: HeaderProps) => {
  const [newTagName, setNewTagName] = useState("");

  const handleCreateTag = () => {
    if (newTagName.trim()) {
      createTag(newTagName.trim());
      setNewTagName("");
    }
  };

  const handleTagToggle = (tagId: string, isChecked: boolean) => {
    if (!activeChat) return;
    if (isChecked) {
      assignTagToChat({ chatId: activeChat.id, tagId });
    } else {
      removeTagFromChat({ chatId: activeChat.id, tagId });
    }
  };

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

        <Popover>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" disabled={!activeChat} className="h-9 w-9">
                    <Tags className="w-4 h-4" />
                    <span className="sr-only">Tags</span>
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Manage Tags</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <PopoverContent className="w-64">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Tags</h4>
                <p className="text-sm text-muted-foreground">
                  Assign tags to this chat.
                </p>
              </div>
              <div className="grid gap-2">
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto p-1">
                  {tags.map(tag => {
                    const isAssigned = activeChat?.tags.some(t => t.id === tag.id);
                    return (
                      <div key={tag.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tag-${tag.id}`}
                          checked={isAssigned}
                          onCheckedChange={(checked) => handleTagToggle(tag.id, !!checked)}
                        />
                        <Label htmlFor={`tag-${tag.id}`} className="font-normal truncate">{tag.name}</Label>
                      </div>
                    )
                  })}
                  {tags.length === 0 && <p className="text-sm text-muted-foreground text-center">No tags created yet.</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="New tag name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                  className="h-8"
                />
                <Button size="sm" onClick={handleCreateTag}>Create</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

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
