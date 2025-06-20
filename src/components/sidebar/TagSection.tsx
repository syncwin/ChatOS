
import React, { useState } from "react";
import { Plus, X, Check } from "lucide-react";
import { SidebarGroup } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import CollapsibleSidebarSection from "../CollapsibleSidebarSection";
import TagList from "../TagList";
import type { Tag } from "@/services/chatService";

interface Chat {
  id: string;
  title: string;
  date: string;
  messages: unknown[];
  is_pinned: boolean;
  folder_id: string | null;
  tags?: Tag[];
}

interface TagSectionProps {
  tags: Tag[];
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chat: Chat) => void;
  createTag: (name: string, color?: string) => void;
  updateTag: (args: { tagId: string; name: string; color?: string }) => void;
  deleteTag: (tagId: string) => void;
  searchTerm: string;
  isCollapsed: boolean;
  isPinned: boolean;
  onToggle: () => void;
  onTogglePin: () => void;
}

const TagSection = ({
  tags,
  chats,
  activeChatId,
  onSelectChat,
  createTag,
  updateTag,
  deleteTag,
  searchTerm,
  isCollapsed,
  isPinned,
  onToggle,
  onTogglePin,
}: TagSectionProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  const handleCreateTag = () => {
    if (newTagName.trim()) {
      // Auto-expand the section if it's collapsed when creating a new tag
      if (isCollapsed) {
        onToggle();
      }
      createTag(newTagName.trim());
      setNewTagName("");
      setIsCreating(false);
    }
  };

  const handleStartCreating = () => {
    // Auto-expand the section if it's collapsed when starting to create
    if (isCollapsed) {
      onToggle();
    }
    setIsCreating(true);
    setNewTagName("");
  };

  const handleCancelCreating = () => {
    setIsCreating(false);
    setNewTagName("");
  };

  return (
    <SidebarGroup>
      <CollapsibleSidebarSection
        title="Tags"
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
              <p>Create tag</p>
            </TooltipContent>
          </Tooltip>
        }
      >
        {isCreating && (
          <div className="space-y-2 px-2 mb-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Enter tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateTag();
                  if (e.key === 'Escape') handleCancelCreating();
                }}
                className="h-8 text-sm flex-1 min-w-[200px] max-w-none"
                style={{ width: `${Math.max(200, newTagName.length * 8 + 40)}px` }}
                autoFocus
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" onClick={handleCreateTag} disabled={!newTagName.trim()} className="h-8 w-8 p-0 bg-primary hover:bg-primary/90">
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
        <TagList
          tags={tags}
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={onSelectChat}
          onCreateTag={createTag}
          onUpdateTag={updateTag}
          onDeleteTag={deleteTag}
          searchTerm={searchTerm}
        />
      </CollapsibleSidebarSection>
    </SidebarGroup>
  );
};

export default TagSection;
