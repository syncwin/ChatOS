
import { useState } from "react";
import { Settings, Plus } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader, SidebarFooter, SidebarSeparator, useSidebar } from "@/components/ui/sidebar";
import SettingsDialog from "./SettingsDialog";
import UserProfileDialog from "./UserProfileDialog";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import ChatHistory from "./ChatHistory";
import TagList from "./TagList";
import UserFooter from "./UserFooter";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import ChatOsIcon from "@/components/icons/ChatOsIcon";
import { Search } from "lucide-react";
import CollapsibleSidebarSection from "./CollapsibleSidebarSection";
import { useSidebarSections } from "@/hooks/useSidebarSections";
import FolderSection from "./FolderSection";
import type { Folder, Tag, Chat as DatabaseChat } from "@/services/chatService";

// UI Chat interface that extends the database Chat
interface Chat extends Omit<DatabaseChat, 'created_at' | 'updated_at'> {
  date: string;
  messages: unknown[];
}

interface AppSidebarProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  chats: DatabaseChat[];
  folders: Folder[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (chat: Chat) => void;
  createFolder: (name: string) => void;
  updateFolder: (args: {
    folderId: string;
    name: string;
  }) => void;
  deleteFolder: (folderId: string) => void;
  tags: Tag[];
  createTag: (name: string, color?: string) => void;
  updateTag: (args: { tagId: string; name: string; color?: string }) => void;
  deleteTag: (tagId: string) => void;
  onOpenSettings: () => void;
}

const AppSidebar = ({
  isDarkMode,
  toggleDarkMode,
  chats: dbChats,
  folders,
  activeChatId,
  onNewChat,
  onSelectChat,
  createFolder,
  updateFolder,
  deleteFolder,
  tags,
  createTag,
  updateTag,
  deleteTag,
  onOpenSettings,
}: AppSidebarProps) => {
  // Transform database chats to UI chats
  const chats: Chat[] = dbChats.map(chat => ({
    ...chat,
    date: new Date(chat.updated_at).toLocaleDateString(),
    messages: []
  }));

  const {
    user,
    isGuest
  } = useAuth();
  const {
    updateChatTitle,
    deleteChat,
    updateChatPinStatus
  } = useChat();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [newChatTitle, setNewChatTitle] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const {
    state
  } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const { sections, toggleSection, togglePin } = useSidebarSections();

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    deleteChat(chatId);
  };
  const handlePinChat = (e: React.MouseEvent, chatId: string, isPinned: boolean) => {
    e.stopPropagation();
    updateChatPinStatus({
      chatId,
      is_pinned: !isPinned
    });
  };
  const handleStartEdit = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId);
    setNewChatTitle(currentTitle);
  };
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewChatTitle(e.target.value);
  };
  const handleUpdateTitle = (chatId: string) => {
    if (newChatTitle.trim() && newChatTitle.trim() !== chats.find(c => c.id === chatId)?.title) {
      updateChatTitle({
        chatId,
        title: newChatTitle.trim()
      });
    }
    setEditingChatId(null);
    setNewChatTitle("");
  };
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, chatId: string) => {
    if (e.key === 'Enter') {
      handleUpdateTitle(chatId);
    } else if (e.key === 'Escape') {
      setEditingChatId(null);
      setNewChatTitle("");
    }
  };
  const handleOpenProfile = () => {
    setIsProfileOpen(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
    onOpenSettings();
  };

  const newChatButton = <Button onClick={onNewChat} size={isCollapsed ? "icon" : "default"} className={cn("bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white", !isCollapsed && "w-full")}>
      <Plus className="w-4 h-4" />
      {!isCollapsed && <span>New Chat</span>}
    </Button>;
  const logo = <a href="/" className={cn("flex items-center gap-2", isCollapsed && "justify-center")}>
      <ChatOsIcon className="w-8 h-8 text-primary" />
      {!isCollapsed && <span className="whitespace-nowrap font-semibold text-2xl">ChatOS</span>}
    </a>;
  return <>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader className={cn("p-4", isCollapsed && "p-2")}>
          {isCollapsed ? <Tooltip>
              <TooltipTrigger asChild>{logo}</TooltipTrigger>
              <TooltipContent side="right"><p>ChatOS</p></TooltipContent>
            </Tooltip> : logo}
          {isCollapsed ? <Tooltip>
              <TooltipTrigger asChild>{newChatButton}</TooltipTrigger>
              <TooltipContent side="right">
                <p>New Chat</p>
              </TooltipContent>
            </Tooltip> : newChatButton}
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent>
          {/* Search Bar */}
          {!isCollapsed && (
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
          )}

          <SidebarSeparator />

          {/* Chat History */}
          {!isCollapsed && (
            <SidebarGroup>
              <CollapsibleSidebarSection
                title="Chat History"
                isCollapsed={sections.chatHistory.isCollapsed}
                isPinned={sections.chatHistory.isPinned}
                onToggle={() => toggleSection('chatHistory')}
                onTogglePin={() => togglePin('chatHistory')}
              >
                <ChatHistory 
                  chats={chats} 
                  folders={folders} 
                  activeChatId={activeChatId} 
                  editingChatId={editingChatId} 
                  newChatTitle={newChatTitle} 
                  onSelectChat={onSelectChat} 
                  onStartEdit={handleStartEdit} 
                  onPinChat={handlePinChat} 
                  onDeleteChat={handleDeleteChat} 
                  onTitleChange={handleTitleChange} 
                  onUpdateTitle={handleUpdateTitle} 
                  onTitleKeyDown={handleTitleKeyDown} 
                  createFolder={createFolder} 
                  updateFolder={updateFolder} 
                  deleteFolder={deleteFolder}
                  searchTerm={searchTerm}
                />
              </CollapsibleSidebarSection>
            </SidebarGroup>
          )}

          {/* Folders */}
          {!isCollapsed && (
            <SidebarGroup>
              <CollapsibleSidebarSection
                title="Folders"
                isCollapsed={sections.folders.isCollapsed}
                isPinned={sections.folders.isPinned}
                onToggle={() => toggleSection('folders')}
                onTogglePin={() => togglePin('folders')}
                rightElement={
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => createFolder("New Folder")}>
                    <Plus className="w-4 h-4" />
                  </Button>
                }
              >
                <FolderSection
                  folders={folders}
                  chats={chats}
                  activeChatId={activeChatId}
                  onSelectChat={onSelectChat}
                  createFolder={createFolder}
                  updateFolder={updateFolder}
                  deleteFolder={deleteFolder}
                  searchTerm={searchTerm}
                />
              </CollapsibleSidebarSection>
            </SidebarGroup>
          )}
          
          <SidebarSeparator />

          {/* Tags */}
          {!isCollapsed && (
            <SidebarGroup>
              <CollapsibleSidebarSection
                title="Tags"
                isCollapsed={sections.tags.isCollapsed}
                isPinned={sections.tags.isPinned}
                onToggle={() => toggleSection('tags')}
                onTogglePin={() => togglePin('tags')}
              >
                <TagList
                  tags={tags}
                  chats={chats}
                  activeChatId={activeChatId}
                  onSelectChat={onSelectChat}
                  onCreateTag={createTag}
                  onUpdateTag={updateTag}
                  onDeleteTag={deleteTag}
                  searchTerm={searchTerm}
                />
              </CollapsibleSidebarSection>
            </SidebarGroup>
          )}

          {/* Show regular sections when collapsed */}
          {isCollapsed && (
            <>
              <ChatHistory 
                chats={chats} 
                folders={folders} 
                activeChatId={activeChatId} 
                editingChatId={editingChatId} 
                newChatTitle={newChatTitle} 
                onSelectChat={onSelectChat} 
                onStartEdit={handleStartEdit} 
                onPinChat={handlePinChat} 
                onDeleteChat={handleDeleteChat} 
                onTitleChange={handleTitleChange} 
                onUpdateTitle={handleUpdateTitle} 
                onTitleKeyDown={handleTitleKeyDown} 
                createFolder={createFolder} 
                updateFolder={updateFolder} 
                deleteFolder={deleteFolder}
                searchTerm={searchTerm}
              />
              
              <SidebarSeparator />

              <TagList
                tags={tags}
                chats={chats}
                activeChatId={activeChatId}
                onSelectChat={onSelectChat}
                onCreateTag={createTag}
                onUpdateTag={updateTag}
                onDeleteTag={deleteTag}
                searchTerm={searchTerm}
              />
            </>
          )}
          
          <SidebarSeparator />

          {/* Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleOpenSettings} tooltip="Settings" className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" aria-label="Open settings">
                    <Settings className="w-4 h-4" />
                    {!isCollapsed && <span>Settings</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className={cn("p-4", isCollapsed && "p-1")}>
          <UserFooter isGuest={isGuest} user={user} onOpenProfile={handleOpenProfile} />
        </SidebarFooter>
      </Sidebar>
      
      <SettingsDialog isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} onOpenProfile={handleOpenProfile} />
      <UserProfileDialog isOpen={isProfileOpen} onOpenChange={setIsProfileOpen} isDarkMode={isDarkMode} />
    </>;
};

export default AppSidebar;
