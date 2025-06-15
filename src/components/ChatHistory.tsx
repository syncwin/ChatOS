
import { useState } from "react";
import { Search, Folder as FolderIcon, Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu } from "@/components/ui/sidebar";
import ChatItem from "./ChatItem";
import { useSidebar } from "@/components/ui/sidebar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { Folder } from "@/services/chatService";

interface Chat {
  id: string;
  title: string;
  date: string;
  messages: unknown[];
  is_pinned: boolean;
  folder_id: string | null;
}

interface ChatHistoryProps {
  chats: Chat[];
  folders: Folder[];
  activeChatId: string | null;
  editingChatId: string | null;
  newChatTitle: string;
  onSelectChat: (chat: Chat) => void;
  onStartEdit: (chatId: string, currentTitle: string) => void;
  onPinChat: (e: React.MouseEvent, chatId: string, isPinned: boolean) => void;
  onDeleteChat: (e: React.MouseEvent, chatId: string) => void;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpdateTitle: (chatId: string) => void;
  onTitleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, chatId: string) => void;
  createFolder: (name: string) => void;
  updateFolder: (args: { folderId: string; name: string }) => void;
  deleteFolder: (folderId: string) => void;
}

const ChatHistory = ({
  chats,
  folders,
  activeChatId,
  editingChatId,
  newChatTitle,
  onSelectChat,
  onStartEdit,
  onPinChat,
  onDeleteChat,
  onTitleChange,
  onUpdateTitle,
  onTitleKeyDown,
  createFolder,
  updateFolder,
  deleteFolder,
}: ChatHistoryProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setNewFolderName("");
      setIsCreatingFolder(false);
    }
  };
  
  const handleUpdateFolder = (folderId: string) => {
    if (editingFolderName.trim()) {
      updateFolder({ folderId, name: editingFolderName.trim() });
    }
    setEditingFolderId(null);
    setEditingFolderName("");
  };

  const filteredChats = chats.filter(chat => chat.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const chatsByFolder = folders.map(folder => ({
    ...folder,
    chats: filteredChats.filter(chat => chat.folder_id === folder.id)
  }));
  const chatsWithoutFolder = filteredChats.filter(chat => !chat.folder_id);

  if (isCollapsed) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {filteredChats.map(chat => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === activeChatId}
                isEditing={false} // No editing in collapsed mode
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
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  return (
    <>
      {/* Search */}
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="relative px-2">
              <label htmlFor="search-chats" className="sr-only">Search chats</label>
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <input 
                id="search-chats"
                type="text" 
                placeholder="Search chats..." 
                value={searchTerm} 
                onChange={handleSearchChange} 
                className="w-full pl-10 pr-4 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-input border border-border text-foreground placeholder:text-muted-foreground" 
              />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

      {/* Folders */}
      <SidebarGroup>
        <SidebarGroupLabel className="flex justify-between items-center text-xs font-medium text-muted-foreground px-2">
          <span>Folders</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsCreatingFolder(!isCreatingFolder)}>
            <Plus className="w-4 h-4" />
          </Button>
        </SidebarGroupLabel>
        <SidebarGroupContent>
          {isCreatingFolder && (
            <div className="flex items-center gap-2 p-2">
              <Input
                placeholder="New folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                className="h-8 text-sm"
                autoFocus
              />
              <Button size="sm" onClick={handleCreateFolder}>Create</Button>
            </div>
          )}
          <Accordion type="multiple" className="w-full px-2" defaultValue={folders.map(f => f.id)}>
            {chatsByFolder.map(folder => (
              <AccordionItem key={folder.id} value={folder.id} className="border-none">
                <div className="flex items-center group/folder hover:bg-muted/50 rounded-md">
                    <AccordionTrigger className="flex-1 p-2 text-sm font-medium text-sidebar-foreground hover:no-underline">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <FolderIcon className="w-4 h-4" />
                        {editingFolderId === folder.id ? (
                           <Input
                           value={editingFolderName}
                           onChange={(e) => setEditingFolderName(e.target.value)}
                           onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateFolder(folder.id); if (e.key === 'Escape') setEditingFolderId(null);}}
                           onClick={(e) => e.stopPropagation()}
                           className="h-7 text-sm"
                           autoFocus
                           onBlur={() => handleUpdateFolder(folder.id)}
                         />
                        ) : (
                          <span className="truncate">{folder.name}</span>
                        )}
                      </div>
                    </AccordionTrigger>
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
                </div>
                <AccordionContent className="pb-0 pl-2">
                  <SidebarMenu>
                    {folder.chats.map(chat => (
                      <ChatItem key={chat.id} {...{chat, activeChatId, editingChatId, newChatTitle, onSelectChat, onStartEdit, onPinChat, onDeleteChat, onTitleChange, onUpdateTitle, onTitleKeyDown}} />
                    ))}
                    {folder.chats.length === 0 && searchTerm === '' && <div className="text-xs text-muted-foreground p-2 text-center">Empty folder.</div>}
                  </SidebarMenu>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Uncategorized Chats */}
      <SidebarGroup>
        <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-2">
          Chats
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="px-2">
            {chatsWithoutFolder.map(chat => (
              <ChatItem key={chat.id} {...{chat, activeChatId, editingChatId, newChatTitle, onSelectChat, onStartEdit, onPinChat, onDeleteChat, onTitleChange, onUpdateTitle, onTitleKeyDown}} />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

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
    </>
  );
};

export default ChatHistory;
