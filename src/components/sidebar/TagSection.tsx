
import React, { useState } from "react";
import { Plus } from "lucide-react";
import { SidebarGroup } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      createTag(newTagName.trim());
      setNewTagName("");
      setIsCreating(false);
    }
  };

  const handleStartCreating = () => {
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
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 hover:bg-muted"
            onClick={handleStartCreating}
          >
            <Plus className="w-4 h-4" />
          </Button>
        }
      >
        {isCreating && (
          <div className="space-y-2 px-2 mb-4">
            <Input
              placeholder="Enter tag name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateTag();
                if (e.key === 'Escape') handleCancelCreating();
              }}
              className="h-8 text-sm"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleCreateTag} disabled={!newTagName.trim()}>
                Create
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelCreating}>
                Cancel
              </Button>
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
