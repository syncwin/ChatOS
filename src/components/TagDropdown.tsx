
import { useState } from "react";
import { Tag, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { Tag as TagType } from "@/services/chatService";

interface TagDropdownProps {
  tags: TagType[];
  chatTags: TagType[];
  activeChat: { id: string } | undefined;
  onAssignTagToChat: (tagId: string) => void;
  onRemoveTagFromChat: (tagId: string) => void;
  onCreateTag: (name: string, color?: string) => void;
  isLoading?: boolean;
}

const TagDropdown = ({
  tags = [],
  chatTags = [],
  activeChat,
  onAssignTagToChat,
  onRemoveTagFromChat,
  onCreateTag,
  isLoading = false,
}: TagDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const handleCreateTag = () => {
    if (newTagName.trim()) {
      onCreateTag(newTagName.trim());
      setNewTagName("");
      setIsCreating(false);
    }
  };

  const handleTagToggle = (tagId: string) => {
    const isAssigned = chatTags.some(tag => tag.id === tagId);
    if (isAssigned) {
      onRemoveTagFromChat(tagId);
    } else {
      onAssignTagToChat(tagId);
    }
  };

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show assigned tags as tooltip content if there are any
  const hasAssignedTags = chatTags.length > 0;
  const tooltipContent = hasAssignedTags 
    ? `Tags: ${chatTags.map(tag => tag.name).join(', ')}`
    : 'Manage tags';

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 relative"
              disabled={!activeChat || isLoading}
            >
              <Tag className="w-4 h-4" />
              {hasAssignedTags && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-xs text-primary-foreground font-bold">
                    {chatTags.length}
                  </span>
                </div>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Manage tags</span>
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
                placeholder="Tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                className="h-8 text-sm"
                autoFocus
              />
              <Button size="sm" onClick={handleCreateTag}>
                Add
              </Button>
            </div>
          )}
          
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 text-sm pl-8"
            />
          </div>
          
          {chatTags.length > 0 && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Current tags</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {chatTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="text-xs flex items-center gap-1 cursor-pointer hover:bg-destructive/10"
                    style={{ backgroundColor: tag.color || undefined }}
                    onClick={() => handleTagToggle(tag.id)}
                  >
                    {tag.name}
                    <X className="w-3 h-3" />
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <Separator />
          
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {filteredTags.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-2">
                No tags found
              </div>
            ) : (
              filteredTags.map((tag) => {
                const isAssigned = chatTags.some(chatTag => chatTag.id === tag.id);
                return (
                  <Button
                    key={tag.id}
                    variant={isAssigned ? "default" : "ghost"}
                    className="w-full justify-start h-8 text-sm"
                    onClick={() => handleTagToggle(tag.id)}
                  >
                    <Tag className="w-4 h-4 mr-2" />
                    <Badge
                      variant="outline"
                      className="text-xs mr-2"
                      style={{ borderColor: tag.color || undefined }}
                    >
                      {tag.name}
                    </Badge>
                    {isAssigned && <span className="ml-auto text-xs">✓</span>}
                  </Button>
                );
              })
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TagDropdown;
