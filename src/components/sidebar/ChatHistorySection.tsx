
import React from "react";
import { SidebarGroup } from "@/components/ui/sidebar";
import CollapsibleSidebarSection from "../CollapsibleSidebarSection";
import ChatHistory from "../ChatHistory";
import type { Folder } from "@/services/chatService";

interface Chat {
  id: string;
  title: string;
  date: string;
  messages: unknown[];
  is_pinned: boolean;
  folder_id: string | null;
}

interface ChatHistorySectionProps {
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
  isCollapsed: boolean;
  isPinned: boolean;
  onToggle: () => void;
  onTogglePin: () => void;
}

const ChatHistorySection = ({
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
  isCollapsed,
  isPinned,
  onToggle,
  onTogglePin,
}: ChatHistorySectionProps) => {
  return (
    <SidebarGroup>
      <CollapsibleSidebarSection
        title="Chat History"
        isCollapsed={isCollapsed}
        isPinned={isPinned}
        onToggle={onToggle}
        onTogglePin={onTogglePin}
      >
        <ChatHistory 
          chats={chats} 
          folders={folders} 
          activeChatId={activeChatId} 
          editingChatId={editingChatId} 
          newChatTitle={newChatTitle} 
          onSelectChat={onSelectChat} 
          onStartEdit={onStartEdit} 
          onPinChat={onPinChat} 
          onDeleteChat={onDeleteChat} 
          onTitleChange={onTitleChange} 
          onUpdateTitle={onUpdateTitle} 
          onTitleKeyDown={onTitleKeyDown} 
          createFolder={createFolder} 
          updateFolder={updateFolder} 
          deleteFolder={deleteFolder}
          searchTerm={searchTerm}
        />
      </CollapsibleSidebarSection>
    </SidebarGroup>
  );
};

export default ChatHistorySection;
