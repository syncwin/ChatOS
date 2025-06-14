import { useState } from "react";
import { User, MessageSquare, Settings, Plus, Search, History, Trash2 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import SettingsDialog from "./SettingsDialog";
import UserProfileDialog from "./UserProfileDialog";

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
  onDeleteChat,
}: AppSidebarProps) => {
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

  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Sidebar className={`${isDarkMode ? 'dark' : ''} bg-sidebar border-r border-sidebar-border`}>
        <SidebarHeader className="p-4">
          <Button 
            onClick={onNewChat}
            className="w-full justify-start gap-2"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </SidebarHeader>

        <SidebarContent className="px-2">
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
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-2">
              Chat History
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredChats.map((chat) => (
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton 
                      onClick={() => onSelectChat(chat)}
                      className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-semibold"
                      data-active={chat.id === activeChatId}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <MessageSquare className="w-4 h-4 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{chat.title}</div>
                          <div className="text-xs text-muted-foreground">{chat.date}</div>
                        </div>
                      </div>
                    </SidebarMenuButton>
                    <SidebarMenuAction
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                      showOnHover
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
                    onClick={() => alert("Chat History clicked! This feature is not yet implemented.")} 
                    className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <History className="w-4 h-4" />
                    <span>Chat History</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
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
          {/* User Account */}
          <div 
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer hover:bg-sidebar-accent"
          >
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                JD
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-sidebar-foreground">John Doe</div>
              <div className="text-xs text-muted-foreground">john@example.com</div>
            </div>
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
        </SidebarFooter>
      </Sidebar>
      <SettingsDialog 
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
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
