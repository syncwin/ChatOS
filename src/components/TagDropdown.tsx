
import { useState } from "react";
import { Tag, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { Tag as TagType, Chat } from "@/services/chatService";

interface TagDropdownProps {
  tags: TagType[];
  activeChat: Chat | undefined;
  onAssignTagToChat: (tagId: string) => void;
  onCreateTag: (name: string, color?: string) => void;
  isLoading?: boolean;
}

const TagDropdown = ({
  tags,
  activeChat,
  onAssignTagToChat,
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

  const handleTagSelect = (tagId: string) => {
    onAssignTagToChat(tagId);
    setIsOpen(false);
  };

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const chatTags = activeChat?.tags || [];

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
              <Tag className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Manage tags</p>
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
                    className="text-xs"
                    style={{ backgroundColor: tag.color || undefined }}
                  >
                    {tag.name}
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
              filteredTags.map((tag) => (
                <Button
                  key={tag.id}
                  variant="ghost"
                  className="w-full justify-start h-8 text-sm"
                  onClick={() => handleTagSelect(tag.id)}
                >
                  <Tag className="w-4 h-4 mr-2" />
                  <Badge
                    variant="outline"
                    className="text-xs mr-2"
                    style={{ borderColor: tag.color || undefined }}
                  >
                    {tag.name}
                  </Badge>
                </Button>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TagDropdown;
