
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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AppSidebarProps {
  isDarkMode: boolean;
}

const AppSidebar = ({ isDarkMode }: AppSidebarProps) => {
  const recentChats = [
    { id: 1, title: "AI and Machine Learning", date: "Today" },
    { id: 2, title: "Quantum Computing Basics", date: "Yesterday" },
    { id: 3, title: "Web Development Tips", date: "2 days ago" },
    { id: 4, title: "Data Science Projects", date: "1 week ago" },
  ];

  return (
    <Sidebar className={`${isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
      <SidebarHeader className="p-4">
        <Button 
          className="w-full justify-start gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </SidebarHeader>

      <SidebarContent>
        {/* Search */}
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="relative px-2">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Search chats..."
                className={`w-full pl-10 pr-4 py-2 rounded-md text-sm ${isDarkMode 
                  ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' 
                  : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
                } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Recent Chats */}
        <SidebarGroup>
          <SidebarGroupLabel className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Recent Chats
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {recentChats.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton className={`group w-full justify-between ${isDarkMode ? 'hover:bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-700'}`}>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <MessageSquare className="w-4 h-4 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{chat.title}</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{chat.date}</div>
                      </div>
                    </div>
                    <Trash2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className={`${isDarkMode ? 'hover:bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-700'}`}>
                  <History className="w-4 h-4" />
                  <span>Chat History</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className={`${isDarkMode ? 'hover:bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-700'}`}>
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
        <div className={`flex items-center gap-3 p-3 rounded-lg ${isDarkMode ? 'bg-gray-900 hover:bg-gray-800' : 'bg-gray-100 hover:bg-gray-200'} transition-colors cursor-pointer`}>
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm">
              JD
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>John Doe</div>
            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>john@example.com</div>
          </div>
          <User className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
