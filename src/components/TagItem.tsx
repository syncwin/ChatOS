
import { Tag as TagIcon } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SidebarMenu } from "@/components/ui/sidebar";
import ChatItem from "./ChatItem";
import type { Tag, Chat as DbChat } from "@/services/chatService";

interface Chat extends DbChat {
    tags: Tag[];
    date: string;
}

interface TagWithChats extends Tag {
    chats: Chat[];
}

interface TagItemProps {
    tag: TagWithChats;
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

export const TagItem = ({ 
    tag,
    searchTerm,
    ...chatItemProps
}: TagItemProps) => {
    return (
        <AccordionItem value={tag.id} className="border-none">
            <div className="flex items-center group/tag hover:bg-muted rounded-md">
                <AccordionTrigger className="flex-1 p-2 text-sm font-medium text-sidebar-foreground hover:no-underline">
                    <div className="flex items-center gap-2">
                        <TagIcon className="w-4 h-4" />
                        <span className="truncate">{tag.name}</span>
                    </div>
                </AccordionTrigger>
            </div>
            <AccordionContent className="pb-0 pl-2">
                <SidebarMenu>
                    {tag.chats.map(chat => (
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
                    {tag.chats.length === 0 && searchTerm === '' && <div className="text-xs text-muted-foreground p-2 text-center">No chats with this tag.</div>}
                </SidebarMenu>
            </AccordionContent>
        </AccordionItem>
    );
};
