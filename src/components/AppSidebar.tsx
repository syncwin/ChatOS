import { useState } from "react";
import { User, MessageSquare, Settings, Plus, Search, Trash2, LogIn, Pin, PinOff, Pencil } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, SidebarSeparator } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import SettingsDialog from "./SettingsDialog";
import UserProfileDialog from "./UserProfileDialog";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { Input } from "@/components/ui/input";

interface Chat {
  id: string;
  title: string;
  date: string;
  messages: unknown[];
  is_pinned: boolean;
}

interface AppSidebarProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  chats: Chat[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (chat: Chat) => void;
  onDeleteChat: (chatId: string) => void;
  onPinChat: (chatId: string, is_pinned: boolean) => void;
}

const AppSidebar = ({
  isDarkMode,
  toggleDarkMode,
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
}: AppSidebarProps) => {
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  const { updateChatTitle, deleteChat, updateChatPinStatus } = useChat();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [newChatTitle, setNewChatTitle] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    deleteChat(chatId);
  };

  const handlePinChat = (e: React.MouseEvent, chatId: string, isPinned: boolean) => {
    e.stopPropagation();
    updateChatPinStatus({ chatId, is_pinned: !isPinned });
  };
  
  const handleEditClick = (e: React.MouseEvent, chatId: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingChatId(chatId);
    setNewChatTitle(currentTitle);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewChatTitle(e.target.value);
  };

  const handleTitleUpdate = (chatId: string) => {
    if (newChatTitle.trim() && newChatTitle.trim() !== chats.find(c => c.id === chatId)?.title) {
      updateChatTitle({ chatId, title: newChatTitle.trim() });
    }
    setEditingChatId(null);
    setNewChatTitle("");
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, chatId: string) => {
    if (e.key === 'Enter') {
      handleTitleUpdate(chatId);
    } else if (e.key === 'Escape') {
      setEditingChatId(null);
      setNewChatTitle("");
    }
  };

  const filteredChats = chats.filter(chat => chat.title.toLowerCase().includes(searchTerm.toLowerCase()));
  
  const handleOpenProfile = () => {
    setIsProfileOpen(true);
  };

  const getInitials = () => {
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "G";
  };

  return (
    <>
      <Sidebar className={`${isDarkMode ? 'dark bg-black' : 'bg-sidebar'} border-sidebar-border`}>
        <SidebarHeader className="p-4">
          <Button onClick={onNewChat} className="w-full justify-start gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </SidebarHeader>

        <SidebarContent>
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

          <SidebarSeparator />

          {/* Recent Chats */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
              Chat History
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredChats.map(chat => (
                  <SidebarMenuItem key={chat.id} className="group/item relative" data-active={chat.id === activeChatId}>
                    <SidebarMenuButton 
                      onClick={() => editingChatId !== chat.id && onSelectChat(chat)} 
                      data-active={chat.id === activeChatId} 
                      className="group/button w-full justify-start h-auto p-2.5 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground px-[5px] py-[5px] pr-24"
                    >
                      {chat.is_pinned && <Pin className="w-3 h-3 mr-2 flex-shrink-0 text-amber-500" />}
                      <MessageSquare className="w-4 h-4 mr-2 flex-shrink-0" />
                      {editingChatId === chat.id ? (
                        <Input
                          value={newChatTitle}
                          onChange={handleTitleChange}
                          onBlur={() => handleTitleUpdate(chat.id)}
                          onKeyDown={(e) => handleTitleKeyDown(e, chat.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-7 text-sm flex-1"
                          autoFocus
                        />
                      ) : (
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-sm font-medium">{chat.title}</div>
                          <div className="text-xs text-muted-foreground group-data-[active=true]/button:text-primary-foreground/70">{chat.date}</div>
                        </div>
                      )}
                    </SidebarMenuButton>
                    <div className="absolute top-1/2 right-1.5 -translate-y-1/2 flex items-center gap-0.5 opacity-0 transition-opacity group-hover/item:opacity-100 group-data-[active=true]/item:opacity-100">
                       <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground group-data-[active=true]/item:text-primary-foreground group-data-[active=true]/item:hover:bg-primary/80"
                        onClick={e => handleEditClick(e, chat.id, chat.title)}
                        aria-label={`Edit chat title: ${chat.title}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground group-data-[active=true]/item:text-primary-foreground group-data-[active=true]/item:hover:bg-primary/80"
                        onClick={e => handlePinChat(e, chat.id, chat.is_pinned)}
                        aria-label={chat.is_pinned ? `Unpin chat: ${chat.title}` : `Pin chat: ${chat.title}`}
                      >
                        {chat.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground group-data-[active=true]/item:text-primary-foreground group-data-[active=true]/item:hover:bg-primary/80"
                        onClick={e => handleDeleteChat(e, chat.id)} 
                        aria-label={`Delete chat: ${chat.title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          {/* Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => setIsSettingsOpen(true)} 
                    className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    aria-label="Open settings"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4">
          {/* User Account or Sign In Prompt */}
          {isGuest ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800">
                <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Sign in for more features
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                  Save your chats, sync across devices, and access advanced settings
                </div>
                <Button 
                  onClick={() => navigate('/auth')} 
                  size="sm" 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsProfileOpen(true)} 
              aria-label="Open user profile"
              className="flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-accent-foreground w-full text-left"
            >
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{user?.email}</div>
                <div className="text-xs text-muted-foreground">Signed in</div>
              </div>
              <User className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </SidebarFooter>
      </Sidebar>
      
      <SettingsDialog 
        isOpen={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen} 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode} 
        onOpenProfile={handleOpenProfile}
      />
      <UserProfileDialog 
        isOpen={isProfileOpen} 
        onOpenChange={setIsProfileOpen} 
        isDarkMode={isDarkMode} 
      />
    </>
  );
};

export default AppSidebar;
