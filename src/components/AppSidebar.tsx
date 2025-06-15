
import { useState } from "react";
import { Settings, Plus } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader, SidebarFooter, SidebarSeparator } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import SettingsDialog from "./SettingsDialog";
import UserProfileDialog from "./UserProfileDialog";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import ChatHistory from "./ChatHistory";
import UserFooter from "./UserFooter";

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
}

const AppSidebar = ({
  isDarkMode,
  toggleDarkMode,
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
}: AppSidebarProps) => {
  const { user, isGuest } = useAuth();
  const { updateChatTitle, deleteChat, updateChatPinStatus } = useChat();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [newChatTitle, setNewChatTitle] = useState("");

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    deleteChat(chatId);
  };

  const handlePinChat = (e: React.MouseEvent, chatId: string, isPinned: boolean) => {
    e.stopPropagation();
    updateChatPinStatus({ chatId, is_pinned: !isPinned });
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
      updateChatTitle({ chatId, title: newChatTitle.trim() });
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
          <ChatHistory
            chats={chats}
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
          />
          
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
          <UserFooter
            isGuest={isGuest}
            user={user}
            onOpenProfile={handleOpenProfile}
          />
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
