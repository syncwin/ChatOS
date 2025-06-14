
import { Sparkles, Search, Sun, Moon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface HeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Header = ({ isDarkMode, toggleDarkMode }: HeaderProps) => {
  return (
    <div className={`flex items-center justify-between p-4 border-b ${isDarkMode 
      ? 'border-gray-700 bg-gray-800/80 backdrop-blur-sm' 
      : 'bg-white/80 backdrop-blur-sm border-gray-200'
    }`}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          InsightSeeker AI
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className={`flex items-center gap-1 ${isDarkMode 
          ? 'bg-gray-700 text-gray-200 border-gray-600' 
          : 'bg-gray-100 text-gray-700 border-gray-300'
        }`}>
          <Search className="w-3 h-3" />
          AI-Powered
        </Badge>
        <div className="flex items-center gap-2">
          <Sun className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-yellow-500'}`} />
          <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
          <Moon className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-gray-400'}`} />
        </div>
      </div>
    </div>
  );
};

export default Header;
