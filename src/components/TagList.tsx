
import { useState } from "react";
import { Tag as TagIcon, Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu } from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import TagItem from "./TagItem";
import type { Tag } from "@/services/chatService";

interface Chat {
  id: string;
  title: string;
  date: string;
  messages: unknown[];
  is_pinned: boolean;
  folder_id: string | null;
}

interface TagListProps {
  tags: Tag[];
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chat: Chat) => void;
  onCreateTag: (name: string, color?: string) => void;
  onUpdateTag: (args: { tagId: string; name: string; color?: string }) => void;
  onDeleteTag: (tagId: string) => void;
}

const TagList = ({
  tags = [],
  chats = [],
  activeChatId,
  onSelectChat,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
}: TagListProps) => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState("");
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);

  const handleCreateTag = () => {
    if (newTagName.trim()) {
      onCreateTag(newTagName.trim());
      setNewTagName("");
      setIsCreatingTag(false);
    }
  };

  const handleUpdateTag = (tagId: string) => {
    if (editingTagName.trim()) {
      onUpdateTag({ tagId, name: editingTagName.trim() });
    }
    setEditingTagId(null);
    setEditingTagName("");
  };

  if (isCollapsed) {
    return null; // Don't show tags in collapsed mode for simplicity
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel className="flex justify-between items-center text-xs font-medium text-muted-foreground px-2">
          <span>Tags</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsCreatingTag(!isCreatingTag)}>
            <Plus className="w-4 h-4" />
          </Button>
        </SidebarGroupLabel>
        <SidebarGroupContent>
          {isCreatingTag && (
            <div className="flex items-center gap-2 p-2">
              <Input
                placeholder="New tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                className="h-8 text-sm"
                autoFocus
              />
              <Button size="sm" onClick={handleCreateTag}>Create</Button>
            </div>
          )}
          
          <div className="space-y-2 px-2">
            {tags.map(tag => {
              const tagChats = chats.filter(chat => {
                // For now, we'll assume no tags are assigned to chats yet
                // This will be handled when we implement the tag assignment functionality
                return false;
              });

              return (
                <div key={tag.id} className="space-y-1">
                  <div className="flex items-center justify-between group/tag hover:bg-muted/50 rounded-md p-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <TagIcon className="w-4 h-4 flex-shrink-0" />
                      {editingTagId === tag.id ? (
                        <Input
                          value={editingTagName}
                          onChange={(e) => setEditingTagName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateTag(tag.id);
                            if (e.key === 'Escape') setEditingTagId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="h-7 text-sm"
                          autoFocus
                          onBlur={() => handleUpdateTag(tag.id)}
                        />
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs truncate"
                          style={{ borderColor: tag.color || undefined }}
                        >
                          {tag.name}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">({tagChats.length})</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover/tag:opacity-100">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="start">
                        <DropdownMenuItem onClick={() => { setEditingTagId(tag.id); setEditingTagName(tag.name); }}>
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Rename</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeletingTag(tag)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {tagChats.length > 0 && (
                    <SidebarMenu className="ml-6">
                      {tagChats.map(chat => (
                        <TagItem
                          key={chat.id}
                          chat={chat}
                          isActive={chat.id === activeChatId}
                          onSelectChat={onSelectChat}
                        />
                      ))}
                    </SidebarMenu>
                  )}
                </div>
              );
            })}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>

      <AlertDialog open={!!deletingTag} onOpenChange={(isOpen) => !isOpen && setDeletingTag(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the tag "{deletingTag?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingTag) {
                  onDeleteTag(deletingTag.id);
                  setDeletingTag(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TagList;
