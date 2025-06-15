
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, PlusCircle, Tags as TagsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Chat, Tag } from "@/services/chatService";
import { Badge } from "./ui/badge";

interface TagSelectorProps {
  activeChat: (Chat & { tags: Tag[] }) | undefined;
  tags: Tag[];
  createTag: (name: string) => void;
  assignTagToChat: (args: { chatId: string; tagId: string }) => void;
  removeTagFromChat: (args: { chatId: string; tagId: string }) => void;
}

const TagSelector = ({ activeChat, tags, createTag, assignTagToChat, removeTagFromChat }: TagSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  if (!activeChat) return null;

  const chatTagIds = new Set(activeChat.tags.map(t => t.id));

  const handleSelect = (tag: Tag) => {
    if (chatTagIds.has(tag.id)) {
      removeTagFromChat({ chatId: activeChat.id, tagId: tag.id });
    } else {
      assignTagToChat({ chatId: activeChat.id, tagId: tag.id });
    }
  };

  const handleCreate = () => {
    if (inputValue.trim() && !tags.some(t => t.name.toLowerCase() === inputValue.trim().toLowerCase())) {
      createTag(inputValue.trim());
      setInputValue("");
    }
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <TagsIcon className="mr-2 h-4 w-4" />
          Tags
          {activeChat.tags.length > 0 && (
            <Badge variant="secondary" className="ml-2 rounded-full px-1.5 py-0.5 text-xs">
              {activeChat.tags.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="end">
        <Command>
          <CommandInput 
            placeholder="Add or create a tag..."
            value={inputValue}
            onValueChange={setInputValue}
            onKeyDown={(e) => {
                if(e.key === 'Enter') {
                    handleCreate();
                }
            }}
          />
          <CommandList>
            <CommandEmpty>
                <Button variant="ghost" className="w-full justify-start" onClick={handleCreate}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create "{inputValue}"
                </Button>
            </CommandEmpty>
            <CommandGroup>
              {tags.map((tag) => (
                <CommandItem
                  key={tag.id}
                  onSelect={() => handleSelect(tag)}
                  className="flex justify-between items-center"
                >
                  <span>{tag.name}</span>
                  {chatTagIds.has(tag.id) && (
                    <Check className="h-4 w-4" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default TagSelector;
