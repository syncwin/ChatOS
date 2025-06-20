
import React, { useState } from "react";
import { Plus, X, Check } from "lucide-react";
import { SidebarGroup } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import CollapsibleSidebarSection from "../CollapsibleSidebarSection";
import FolderSection from "../FolderSection";
import type { Folder } from "@/services/chatService";

interface Chat {
  id: string;
  title: string;
  date: string;
  messages: unknown[];
  is_pinned: boolean;
  folder_id: string | null;
}

interface FolderSectionWrapperProps {
  folders: Folder[];
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chat: Chat) => void;
  createFolder: (name: string) => void;
  updateFolder: (args: { folderId: string; name: string }) => void;
  deleteFolder: (folderId: string) => void;
  searchTerm: string;
  isCollapsed: boolean;
  isPinned: boolean;
  onToggle: () => void;
  onTogglePin: () => void;
}

const FolderSectionWrapper = ({
  folders,
  chats,
  activeChatId,
  onSelectChat,
  createFolder,
  updateFolder,
  deleteFolder,
  searchTerm,
  isCollapsed,
  isPinned,
  onToggle,
  onTogglePin,
}: FolderSectionWrapperProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      // Auto-expand the section if it's collapsed when creating a new folder
      if (isCollapsed) {
        onToggle();
      }
      createFolder(newFolderName.trim());
      setNewFolderName("");
      setIsCreating(false);
    }
  };

  const handleStartCreating = () => {
    // Auto-expand the section if it's collapsed when starting to create
    if (isCollapsed) {
      onToggle();
    }
    setIsCreating(true);
    setNewFolderName("");
  };

  const handleCancelCreating = () => {
    setIsCreating(false);
    setNewFolderName("");
  };

  return (
    <SidebarGroup>
      <CollapsibleSidebarSection
        title="Folders"
        isCollapsed={isCollapsed}
        isPinned={isPinned}
        onToggle={onToggle}
        onTogglePin={onTogglePin}
        rightElement={
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 hover:bg-muted"
                onClick={handleStartCreating}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create folder</p>
            </TooltipContent>
          </Tooltip>
        }
      >
        {isCreating && (
          <div className="space-y-2 px-2 mb-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Enter folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder();
                  if (e.key === 'Escape') handleCancelCreating();
                }}
                className="h-8 text-sm flex-1 min-w-0"
                autoFocus
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" onClick={handleCreateFolder} disabled={!newFolderName.trim()} className="h-8 w-8 p-0 bg-primary hover:bg-primary/90">
                    <Check className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={handleCancelCreating} className="h-8 w-8 p-0">
                    <X className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cancel</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}
        <FolderSection
          folders={folders}
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={onSelectChat}
          createFolder={createFolder}
          updateFolder={updateFolder}
          deleteFolder={deleteFolder}
          searchTerm={searchTerm}
        />
      </CollapsibleSidebarSection>
    </SidebarGroup>
  );
};

export default FolderSectionWrapper;
