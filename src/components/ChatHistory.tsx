import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { SidebarGroup, SidebarGroupContent, SidebarMenu } from "@/components/ui/sidebar";
import ChatItem from "./ChatItem";
import { useSidebar } from "@/components/ui/sidebar";
import { FolderList } from "./FolderList";
import { UncategorizedChatList } from "./UncategorizedChatList";
import { TagList } from "./TagList";
import type { Folder, Tag, Chat as DbChat } from "@/services/chatService";

interface Chat extends DbChat {
  tags: Tag[];
  date: string;
}

interface ChatHistoryProps {
  chats: Chat[];
  folders: Folder[];
  tags: Tag[];
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
  createTag: (name: string) => void;
  assignTagToChat: (args: { chatId: string; tagId: string }) => void;
  removeTagFromChat: (args: { chatId: string; tagId: string }) => void;
}

const ChatHistory = (props: ChatHistoryProps) => {
  const { chats, folders, tags, ...restProps } = props;
  const [searchTerm, setSearchTerm] = useState("");
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredChats = useMemo(() => 
    chats.filter(chat => chat.title.toLowerCase().includes(searchTerm.toLowerCase())),
    [chats, searchTerm]
  );
  
  const chatsByFolder = useMemo(() => folders.map(folder => ({
    ...folder,
    chats: filteredChats.filter(chat => chat.folder_id === folder.id)
  })), [folders, filteredChats]);

  const chatsByTag = useMemo(() => tags.map(tag => ({
    ...tag,
    chats: filteredChats.filter(chat => chat.tags.some(t => t.id === tag.id))
  })), [tags, filteredChats]);

  const chatsWithoutFolder = useMemo(() => 
    filteredChats.filter(chat => !chat.folder_id),
    [filteredChats]
  );

  if (isCollapsed) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {filteredChats.map(chat => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === props.activeChatId}
                isEditing={false}
                newChatTitle=""
                onSelectChat={props.onSelectChat}
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

      <FolderList
        foldersWithChats={chatsByFolder}
        createFolder={props.createFolder}
        updateFolder={props.updateFolder}
        deleteFolder={props.deleteFolder}
        searchTerm={searchTerm}
        {...restProps}
      />

      <TagList
        tagsWithChats={chatsByTag}
        createTag={props.createTag}
        searchTerm={searchTerm}
        {...restProps}
      />

      <UncategorizedChatList chats={chatsWithoutFolder} {...restProps} />
    </>
  );
};

export default ChatHistory;
