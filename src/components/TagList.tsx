
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from "@/components/ui/sidebar";
import { TagItem } from './TagItem';
import type { Tag, Chat as DbChat } from "@/services/chatService";

interface Chat extends DbChat {
    tags: Tag[];
    date: string;
}

interface TagWithChats extends Tag {
    chats: Chat[];
}

interface TagListProps {
    tagsWithChats: TagWithChats[];
    createTag: (name: string) => void;
    searchTerm: string;
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
}

export const TagList = ({ tagsWithChats, createTag, ...props }: TagListProps) => {
    const [isCreatingTag, setIsCreatingTag] = useState(false);
    const [newTagName, setNewTagName] = useState("");
    const allTagIds = tagsWithChats.map(t => t.id);
    const [openTags, setOpenTags] = useState<string[]>(allTagIds);

    const handleCreateTag = () => {
        if (newTagName.trim()) {
            createTag(newTagName.trim());
            setNewTagName("");
            setIsCreatingTag(false);
        }
    };

    return (
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
                {tagsWithChats.length > 0 && (
                    <Accordion type="multiple" className="w-full px-2" value={openTags} onValueChange={setOpenTags} defaultValue={allTagIds}>
                        {tagsWithChats.map(tag => {
                            return (
                                <TagItem
                                    key={tag.id}
                                    tag={tag}
                                    {...props}
                                />
                            )
                        })}
                    </Accordion>
                )}
            </SidebarGroupContent>
        </SidebarGroup>
    );
};
