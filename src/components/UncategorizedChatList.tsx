
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu } from "@/components/ui/sidebar";
import ChatItem from "./ChatItem";
import type { Tag } from "@/services/chatService";

interface Chat {
  id: string;
  title: string;
  date: string;
  is_pinned: boolean;
  folder_id: string | null;
  tags: Tag[];
}

interface UncategorizedChatListProps {
  chats: Chat[];
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

export const UncategorizedChatList = (props: UncategorizedChatListProps) => {
  if (props.chats.length === 0) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-2">
        Chats
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="px-2">
          {props.chats.map(chat => (
            <ChatItem
              key={chat.id}
              chat={chat}
              isActive={chat.id === props.activeChatId}
              isEditing={chat.id === props.editingChatId}
              newChatTitle={props.newChatTitle}
              onSelectChat={props.onSelectChat}
              onStartEdit={props.onStartEdit}
              onPinChat={props.onPinChat}
              onDeleteChat={props.onDeleteChat}
              onTitleChange={props.onTitleChange}
              onUpdateTitle={props.onUpdateTitle}
              onTitleKeyDown={props.onTitleKeyDown}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
