
import { useState } from "react";
import { Folder, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [searchTerm, setSearchTerm] = useState("");

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName("");
      setIsCreating(false);
    }
  };

  const handleStartCreating = () => {
    setIsCreating(true);
    setNewFolderName("");
  };

  const handleCancelCreating = () => {
    setIsCreating(false);
    setNewFolderName("");
  };

  const handleFolderSelect = (folderId: string) => {
    onAssignChatToFolder(folderId);
    setIsOpen(false);
  };

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if the active chat has a folder assigned
  const assignedFolder = activeChat?.folder_id ? folders.find(f => f.id === activeChat.folder_id) : null;
  const hasAssignedFolder = !!assignedFolder;

  // Show assigned folder name in tooltip if there is one
  const tooltipContent = hasAssignedFolder 
    ? `Folder: ${assignedFolder.name}`
    : 'Move to folder';

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 relative hover:opacity-80 transition-opacity duration-200"
              disabled={!activeChat || isLoading}
            >
              <Folder className="w-4 h-4" />
              {hasAssignedFolder && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-64 bg-popover border shadow-md" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Move to folder</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-muted"
              onClick={handleStartCreating}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {isCreating && (
            <div className="space-y-2">
              <Input
                placeholder="Enter folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder();
                  if (e.key === 'Escape') handleCancelCreating();
                }}
                className="h-8 text-sm"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                  Create
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelCreating}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search folders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 text-sm pl-8"
            />
          </div>
          
          {hasAssignedFolder && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Current folder</span>
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge
                  variant="secondary"
                  className="text-xs flex items-center gap-1 cursor-pointer hover:bg-destructive/10"
                  onClick={() => handleFolderSelect('none')}
                >
                  {assignedFolder.name}
                  <X className="w-3 h-3" />
                </Badge>
              </div>
            </div>
          )}
          
          <Separator />
          
          <ScrollArea className="max-h-40">
            <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start h-8 text-sm"
              onClick={() => handleFolderSelect('none')}
            >
              <em>No folder</em>
            </Button>
            {filteredFolders.length === 0 && searchTerm ? (
              <div className="text-sm text-muted-foreground text-center py-2">
                No folders found
              </div>
            ) : (
              filteredFolders.map((folder) => {
                const isAssigned = activeChat?.folder_id === folder.id;
                return (
                  <Button
                    key={folder.id}
                    variant={isAssigned ? "default" : "ghost"}
                    className="w-full justify-start h-8 text-sm"
                    onClick={() => handleFolderSelect(folder.id)}
                  >
                    <Folder className="w-4 h-4 mr-2" />
                    {folder.name}
                    {isAssigned && <span className="ml-auto text-xs">✓</span>}
                  </Button>
                );
              })
            )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FolderDropdown;
