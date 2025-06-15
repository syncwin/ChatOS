
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sun, Moon, User, KeyRound } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onOpenProfile: () => void;
}

const SettingsDialog = ({ isOpen, onOpenChange, isDarkMode, toggleDarkMode, onOpenProfile }: SettingsDialogProps) => {
  const [apiKey, setApiKey] = useState("");

  const handleManageProfile = () => {
    onOpenChange(false);
    onOpenProfile();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={isDarkMode ? "dark" : ""}>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your application settings.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
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

          <div>
            <Label htmlFor="api-key" className="flex flex-col gap-1 mb-2">
              <span>API Key</span>
              <span className="text-xs font-normal text-muted-foreground">
                Enter your OpenAI API key.
              </span>
            </Label>
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-muted-foreground" />
              <Input
                id="api-key"
                type="password"
                placeholder="••••••••••••••••••••"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <Button size="sm">Save</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
