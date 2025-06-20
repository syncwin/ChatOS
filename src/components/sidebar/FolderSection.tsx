import React, { useState } from "react";
import { Plus } from "lucide-react";
import { SidebarGroup } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import CollapsibleSidebarSection from "../CollapsibleSidebarSection";
import FolderSection from "../FolderSection";
import SidebarEditInput from "@/components/ui/SidebarEditInput";
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
  editingChatId?: string | null;
  newChatTitle?: string;
  onStartEdit?: (chatId: string, currentTitle: string) => void;
  onPinChat?: (e: React.MouseEvent, chatId: string, isPinned: boolean) => void;
  onDeleteChat?: (e: React.MouseEvent, chatId: string) => void;
  onTitleChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpdateTitle?: (chatId: string) => void;
  onTitleKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>, chatId: string) => void;
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
  editingChatId,
  newChatTitle,
  onStartEdit,
  onPinChat,
  onDeleteChat,
  onTitleChange,
  onUpdateTitle,
  onTitleKeyDown,
}: FolderSectionWrapperProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      if (isCollapsed) {
        onToggle();
      }
      createFolder(newFolderName.trim());
      setNewFolderName("");
      setIsCreating(false);
    }
  };

  const handleStartCreating = () => {
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleCreateFolder();
    if (e.key === 'Escape') handleCancelCreating();
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
          <div className="sidebar-input-container px-2 mb-4">
            <SidebarEditInput
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onSave={handleCreateFolder}
              onCancel={handleCancelCreating}
              onKeyDown={handleKeyDown}
              placeholder="Enter folder name"
            />
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
          editingChatId={editingChatId}
          newChatTitle={newChatTitle}
          onStartEdit={onStartEdit}
          onPinChat={onPinChat}
          onDeleteChat={onDeleteChat}
          onTitleChange={onTitleChange}
          onUpdateTitle={onUpdateTitle}
          onTitleKeyDown={onTitleKeyDown}
        />
      </CollapsibleSidebarSection>
    </SidebarGroup>
  );
};

export default FolderSectionWrapper;
