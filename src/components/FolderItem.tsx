
import { useState } from "react";
import { Folder as FolderIcon, FolderOpen, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarMenu } from "@/components/ui/sidebar";
import ChatItem from "./ChatItem";
import type { Folder, Tag } from "@/services/chatService";

interface Chat {
  id: string;
  title: string;
  date: string;
  is_pinned: boolean;
  folder_id: string | null;
  tags: Tag[];
}

interface FolderWithChats extends Folder {
    chats: Chat[];
}

interface FolderItemProps {
    folder: FolderWithChats;
    isOpen: boolean;
    onDeleteRequest: (folder: Folder) => void;
    updateFolder: (args: { folderId: string; name: string }) => void;
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
    searchTerm: string;
}

export const FolderItem = ({ 
    folder, 
    isOpen,
    onDeleteRequest,
    updateFolder,
    searchTerm,
    ...chatItemProps
}: FolderItemProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(folder.name);

    const handleUpdate = () => {
        if (name.trim() && name.trim() !== folder.name) {
            updateFolder({ folderId: folder.id, name: name.trim() });
        }
        setIsEditing(false);
    }
    
    return (
        <AccordionItem value={folder.id} className="border-none">
            <div className="flex items-center group/folder hover:bg-muted rounded-md">
                <AccordionTrigger className="flex-1 p-2 text-sm font-medium text-sidebar-foreground hover:no-underline">
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {isOpen ? <FolderOpen className="w-4 h-4" /> : <FolderIcon className="w-4 h-4" />}
                        {isEditing ? (
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(); if (e.key === 'Escape') setIsEditing(false); }}
                                onClick={(e) => e.stopPropagation()}
                                className="h-7 text-sm"
                                autoFocus
                                onBlur={handleUpdate}
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
                        <DropdownMenuItem onClick={() => { setIsEditing(true); setName(folder.name); }}>
                            <Pencil className="mr-2 h-4 w-4" />
                            <span>Rename</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDeleteRequest(folder)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <AccordionContent className="pb-0 pl-2">
                <SidebarMenu>
                    {folder.chats.map(chat => (
                        <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === chatItemProps.activeChatId}
                            isEditing={chat.id === chatItemProps.editingChatId}
                            newChatTitle={chatItemProps.newChatTitle}
                            onSelectChat={chatItemProps.onSelectChat}
                            onStartEdit={chatItemProps.onStartEdit}
                            onPinChat={chatItemProps.onPinChat}
                            onDeleteChat={chatItemProps.onDeleteChat}
                            onTitleChange={chatItemProps.onTitleChange}
                            onUpdateTitle={chatItemProps.onUpdateTitle}
                            onTitleKeyDown={chatItemProps.onTitleKeyDown}
                        />
                    ))}
                    {folder.chats.length === 0 && searchTerm === '' && <div className="text-xs text-muted-foreground p-2 text-center">Empty folder.</div>}
                </SidebarMenu>
            </AccordionContent>
        </AccordionItem>
    );
};
