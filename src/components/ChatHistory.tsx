
import { useState } from "react";
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu } from "@/components/ui/sidebar";
import ChatItem from "./ChatItem";
import { useSidebar } from "@/components/ui/sidebar";
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
  searchTerm: string;
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
  searchTerm,
}: ChatHistoryProps) => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchTerm.toLowerCase()) && !chat.folder_id
  );

  if (isCollapsed) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {chats.filter(chat => chat.title.toLowerCase().includes(searchTerm.toLowerCase())).map(chat => (
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
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu className="px-2">
          {filteredChats.map(chat => (
            <ChatItem
              key={chat.id}
              chat={chat}
              isActive={chat.id === activeChatId}
              isEditing={chat.id === editingChatId}
              newChatTitle={newChatTitle}
              onSelectChat={onSelectChat}
              onStartEdit={onStartEdit}
              onPinChat={onPinChat}
              onDeleteChat={onDeleteChat}
              onTitleChange={onTitleChange}
              onUpdateTitle={onUpdateTitle}
              onTitleKeyDown={onTitleKeyDown}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default ChatHistory;
