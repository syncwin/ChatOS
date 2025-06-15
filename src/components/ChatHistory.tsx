
import { useState } from "react";
import { Search } from "lucide-react";
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu } from "@/components/ui/sidebar";
import ChatItem from "./ChatItem";

interface Chat {
  id: string;
  title: string;
  date: string;
  messages: unknown[];
  is_pinned: boolean;
}

interface ChatHistoryProps {
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

const ChatHistory = ({
  chats,
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
}: ChatHistoryProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredChats = chats.filter(chat => chat.title.toLowerCase().includes(searchTerm.toLowerCase()));

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

      {/* Recent Chats */}
      <SidebarGroup>
        <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
          Chat History
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
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
    </>
  );
};

export default ChatHistory;
