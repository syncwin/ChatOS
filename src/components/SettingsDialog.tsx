
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sun, Moon, User } from "lucide-react";
import { Button } from "./ui/button";
import ApiKeyManager from "./ApiKeyManager";
import { Separator } from "./ui/separator";

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onOpenProfile: () => void;
}

const SettingsDialog = ({ isOpen, onOpenChange, isDarkMode, toggleDarkMode, onOpenProfile }: SettingsDialogProps) => {

  const handleManageProfile = () => {
    onOpenChange(false);
    onOpenProfile();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={`${isDarkMode ? "dark" : ""} max-h-[80vh]`}>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your application settings and API keys.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="py-4 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode" className="flex flex-col gap-1">
                  <span>Dark Mode</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Enable or disable dark theme.
                  </span>
                </Label>
                <div className="flex items-center gap-2">
                  <Sun className={`h-5 w-5 ${!isDarkMode ? 'text-accent' : 'text-muted-foreground'}`} />
                  <Switch
                    id="dark-mode"
                    checked={isDarkMode}
                    onCheckedChange={toggleDarkMode}
                  />
                  <Moon className={`h-5 w-5 ${isDarkMode ? 'text-accent' : 'text-muted-foreground'}`} />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="flex flex-col gap-1">
                  <span>Manage Profile</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    View or edit your profile details.
                  </span>
                </Label>
                <Button variant="outline" size="sm" onClick={handleManageProfile}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>
              </div>
            </div>
            
            <Separator />

            <ApiKeyManager />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
