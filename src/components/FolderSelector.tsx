
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, PlusCircle, Folder as FolderIcon } from "lucide-react";
import type { Chat, Folder } from "@/services/chatService";

interface FolderSelectorProps {
  activeChat: (Chat & { tags: any[] }) | undefined;
  folders: Folder[];
  createFolder: (name: string) => void;
  onAssignChatToFolder: (folderId: string) => void;
}

const FolderSelector = ({ activeChat, folders, createFolder, onAssignChatToFolder }: FolderSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  if (!activeChat) return null;

  const handleSelect = (folderId: string | null) => {
    onAssignChatToFolder(folderId === null ? 'none' : folderId);
    setOpen(false);
  };

  const handleCreate = () => {
    if (inputValue.trim() && !folders.some(f => f.name.toLowerCase() === inputValue.trim().toLowerCase())) {
      createFolder(inputValue.trim());
      setInputValue("");
    }
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 w-[180px] justify-start text-left">
          <FolderIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">
            {activeChat.folder_id ? folders.find(f => f.id === activeChat.folder_id)?.name : "Move to folder..."}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="end">
        <Command>
          <CommandInput 
            placeholder="Search or create folder..."
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
              <CommandItem onSelect={() => handleSelect(null)} className="flex justify-between items-center">
                <span>No folder</span>
                 {!activeChat.folder_id && (
                    <Check className="h-4 w-4" />
                  )}
              </CommandItem>
              {folders.map((folder) => (
                <CommandItem
                  key={folder.id}
                  onSelect={() => handleSelect(folder.id)}
                  className="flex justify-between items-center"
                >
                  <span className="truncate">{folder.name}</span>
                  {activeChat.folder_id === folder.id && (
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

export default FolderSelector;
