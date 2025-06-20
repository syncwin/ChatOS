
import { useState } from "react";
import { Folder as FolderIcon, MoreHorizontal, Pencil, Trash2, Check, X } from "lucide-react";
import ChatItem from "./ChatItem";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
} from "@/components/ui/alert-dialog"
import { SidebarMenu } from "@/components/ui/sidebar";
import type { Folder } from "@/services/chatService";

interface Chat {
  id: string;
  title: string;
  date: string;
  messages: unknown[];
  is_pinned: boolean;
  folder_id: string | null;
}

interface FolderSectionProps {
  folders: Folder[];
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chat: Chat) => void;
  createFolder: (name: string) => void;
  updateFolder: (args: { folderId: string; name: string }) => void;
  deleteFolder: (folderId: string) => void;
  searchTerm: string;
}

const FolderSection = ({
  folders,
  chats,
  activeChatId,
  onSelectChat,
  createFolder,
  updateFolder,
  deleteFolder,
  searchTerm,
}: FolderSectionProps) => {
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);

  const handleUpdateFolder = (folderId: string) => {
    if (editingFolderName.trim()) {
      updateFolder({ folderId, name: editingFolderName.trim() });
    }
    setEditingFolderId(null);
    setEditingFolderName("");
  };

  const handleCancelEdit = () => {
    setEditingFolderId(null);
    setEditingFolderName("");
  };

  const filteredChats = chats.filter(chat => chat.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const chatsByFolder = folders.map(folder => ({
    ...folder,
    chats: filteredChats.filter(chat => chat.folder_id === folder.id)
  }));

  return (
    <div className="px-2">
      <Accordion type="multiple" className="w-full" defaultValue={folders.map(f => f.id)}>
        {chatsByFolder.map(folder => (
          <AccordionItem key={folder.id} value={folder.id} className="border-none">
            <div className="flex items-center group/folder hover:bg-muted/50 rounded-md">
              <AccordionTrigger className="flex-1 p-2 text-sm font-medium text-sidebar-foreground hover:no-underline">
                <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                  <FolderIcon className="w-4 h-4" />
                  {editingFolderId === folder.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editingFolderName}
                        onChange={(e) => setEditingFolderName(e.target.value)}
                        onKeyDown={(e) => { 
                          if (e.key === 'Enter') handleUpdateFolder(folder.id); 
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-7 text-sm flex-1"
                        autoFocus
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" onClick={() => handleUpdateFolder(folder.id)} disabled={!editingFolderName.trim()} className="h-7 w-7 p-0">
                            <Check className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Save</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-7 w-7 p-0">
                            <X className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Cancel</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  ) : (
                    <span className="truncate">{folder.name}</span>
                  )}
                </div>
              </AccordionTrigger>
              {editingFolderId !== folder.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover/folder:opacity-100">
                          <MoreHorizontal className="w-4 h-4" />
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start">
                      <DropdownMenuItem onClick={() => { setEditingFolderId(folder.id); setEditingFolderName(folder.name); }}>
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Rename</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeletingFolder(folder)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                      </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <AccordionContent className="pb-0 pl-2">
              <SidebarMenu>
                {folder.chats.map(chat => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === activeChatId}
                    isEditing={false}
                    newChatTitle=""
                    onSelectChat={onSelectChat}
                    onStartEdit={() => {}}
                    onPinChat={() => {}}
                    onDeleteChat={() => {}}
                    onTitleChange={() => {}}
                    onUpdateTitle={() => {}}
                    onTitleKeyDown={() => {}}
                  />
                ))}
                {folder.chats.length === 0 && searchTerm === '' && (
                  <div className="text-xs text-muted-foreground p-2 text-center">Empty folder.</div>
                )}
              </SidebarMenu>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <AlertDialog open={!!deletingFolder} onOpenChange={(isOpen) => !isOpen && setDeletingFolder(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will delete the folder "{deletingFolder?.name}". Chats within this folder will not be deleted but moved out of the folder.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    onClick={() => {
                        if (deletingFolder) {
                            deleteFolder(deletingFolder.id);
                            setDeletingFolder(null);
                        }
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FolderSection;
