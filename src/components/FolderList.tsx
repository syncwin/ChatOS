
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from "@/components/ui/sidebar";
import { FolderItem } from './FolderItem';
import { DeleteFolderDialog } from './DeleteFolderDialog';
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

interface FolderListProps {
    foldersWithChats: FolderWithChats[];
    createFolder: (name: string) => void;
    updateFolder: (args: { folderId: string; name: string }) => void;
    deleteFolder: (folderId: string) => void;
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

export const FolderList = ({ foldersWithChats, createFolder, deleteFolder, ...props }: FolderListProps) => {
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);
    const allFolderIds = foldersWithChats.map(f => f.id);
    const [openFolders, setOpenFolders] = useState<string[]>(allFolderIds);

    const handleCreateFolder = () => {
        if (newFolderName.trim()) {
            createFolder(newFolderName.trim());
            setNewFolderName("");
            setIsCreatingFolder(false);
        }
    };

    const handleDeleteFolderConfirm = () => {
        if (deletingFolder) {
            deleteFolder(deletingFolder.id);
            setDeletingFolder(null);
        }
    };

    return (
        <>
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
                    <Accordion type="multiple" className="w-full px-2" value={openFolders} onValueChange={setOpenFolders} defaultValue={allFolderIds}>
                        {foldersWithChats.map(folder => {
                            const isOpen = openFolders.includes(folder.id);
                            return (
                                <FolderItem
                                    key={folder.id}
                                    folder={folder}
                                    isOpen={isOpen}
                                    onDeleteRequest={setDeletingFolder}
                                    {...props}
                                />
                            )
                        })}
                    </Accordion>
                </SidebarGroupContent>
            </SidebarGroup>

            <DeleteFolderDialog
                open={!!deletingFolder}
                onOpenChange={(isOpen) => !isOpen && setDeletingFolder(null)}
                folder={deletingFolder}
                onConfirm={handleDeleteFolderConfirm}
            />
        </>
    );
};
