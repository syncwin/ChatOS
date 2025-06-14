
import { Sparkles, Search, Sun, Moon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface HeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Header = ({ isDarkMode, toggleDarkMode }: HeaderProps) => {
  return (
    <div className="flex items-center justify-between flex-1">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">
          InsightSeeker AI
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <Badge variant="outline" className="flex items-center gap-1 text-muted-foreground border-dashed">
          <Search className="w-3 h-3" />
          AI-Powered
        </Badge>
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4 text-muted-foreground" />
          <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
          <Moon className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
};

export default Header;
