
import { useState } from "react";
import { User, MessageSquare, Settings, Plus, Search, Trash2, LogIn } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, SidebarSeparator, SidebarMenuAction } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import SettingsDialog from "./SettingsDialog";
import UserProfileDialog from "./UserProfileDialog";
import { useAuth } from "@/hooks/useAuth";

interface Chat {
  id: number;
  title: string;
  date: string;
  messages: unknown[];
}

interface AppSidebarProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  chats: Chat[];
  activeChatId: number | null;
  onNewChat: () => void;
  onSelectChat: (chat: Chat) => void;
  onDeleteChat: (chatId: number) => void;
}

const AppSidebar = ({
  isDarkMode,
  toggleDarkMode,
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat
}: AppSidebarProps) => {
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: number) => {
    e.stopPropagation();
    onDeleteChat(chatId);
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
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
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
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton 
                      onClick={() => onSelectChat(chat)} 
                      data-active={chat.id === activeChatId} 
                      className="group w-full justify-start h-auto p-2.5 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground px-[5px] py-[5px]"
                    >
                      <MessageSquare className="w-4 h-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-medium">{chat.title}</div>
                        <div className="text-xs text-muted-foreground group-data-[active=true]:text-primary-foreground/70">{chat.date}</div>
                      </div>
                    </SidebarMenuButton>
                    <SidebarMenuAction 
                      onClick={e => handleDeleteChat(e, chat.id)} 
                      showOnHover 
                      className="text-muted-foreground peer-hover/menu-button:text-primary-foreground peer-data-[active=true]/menu-button:text-primary-foreground"
                    >
                      <Trash2 />
                    </SidebarMenuAction>
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
            <div 
              onClick={() => setIsProfileOpen(true)} 
              className="flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-accent-foreground"
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
            </div>
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
