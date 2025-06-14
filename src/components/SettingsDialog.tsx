
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sun, Moon } from "lucide-react";

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const SettingsDialog = ({ isOpen, onOpenChange, isDarkMode, toggleDarkMode }: SettingsDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={isDarkMode ? "dark" : ""}>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your application settings.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode" className="flex flex-col gap-1">
              <span>Dark Mode</span>
              <span className="text-xs font-normal text-muted-foreground">
                Enable or disable dark theme.
              </span>
            </Label>
            <div className="flex items-center gap-2">
              <Sun className={`h-5 w-5 ${!isDarkMode ? 'text-amber-500' : 'text-muted-foreground'}`} />
              <Switch
                id="dark-mode"
                checked={isDarkMode}
                onCheckedChange={toggleDarkMode}
              />
              <Moon className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-muted-foreground'}`} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
