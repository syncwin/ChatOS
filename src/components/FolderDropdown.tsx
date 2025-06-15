
import { useState } from "react";
import { Folder, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Folder as FolderType, Chat } from "@/services/chatService";

interface FolderDropdownProps {
  folders: FolderType[];
  activeChat: Chat | undefined;
  onAssignChatToFolder: (folderId: string) => void;
  onCreateFolder: (name: string) => void;
  isLoading?: boolean;
}

const FolderDropdown = ({
  folders,
  activeChat,
  onAssignChatToFolder,
  onCreateFolder,
  isLoading = false,
}: FolderDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName("");
      setIsCreating(false);
    }
  };

  const handleFolderSelect = (folderId: string) => {
    onAssignChatToFolder(folderId);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={!activeChat || isLoading}
            >
              <Folder className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Move to folder</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-56" align="end">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Move to folder</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {isCreating && (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                className="h-8 text-sm"
                autoFocus
              />
              <Button size="sm" onClick={handleCreateFolder}>
                Add
              </Button>
            </div>
          )}
          
          <Separator />
          
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start h-8 text-sm"
              onClick={() => handleFolderSelect('none')}
            >
              <em>No folder</em>
            </Button>
            {folders.map((folder) => (
              <Button
                key={folder.id}
                variant="ghost"
                className="w-full justify-start h-8 text-sm"
                onClick={() => handleFolderSelect(folder.id)}
              >
                <Folder className="w-4 h-4 mr-2" />
                {folder.name}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FolderDropdown;
