
import { Sun, Moon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import OsIcon from "./icons/OsIcon";

interface HeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Header = ({ isDarkMode, toggleDarkMode }: HeaderProps) => {
  return (
    <div className="flex items-center justify-between flex-1 px-4 py-2 text-foreground">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <OsIcon className="w-5 h-5 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-semibold">
          Chat
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Sun className={`w-4 h-4 ${!isDarkMode ? 'text-yellow-500' : 'text-muted-foreground'}`} />
          <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
          <Moon className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-muted-foreground'}`} />
        </div>
      </div>
    </div>
  );
};

export default Header;
