
import * as React from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const SettingsDialog = ({
  isOpen,
  onOpenChange,
  isDarkMode,
  toggleDarkMode,
}: SettingsDialogProps) => {
  const [apiKey, setApiKey] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      const storedApiKey = localStorage.getItem("gemini_api_key") || "";
      setApiKey(storedApiKey);
    }
  }, [isOpen]);

  const handleSaveApiKey = () => {
    localStorage.setItem("gemini_api_key", apiKey);
    toast.success("Google Gemini API Key saved!");
    onOpenChange(false);
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
              <Sun
                className={`h-5 w-5 ${
                  !isDarkMode ? "text-amber-500" : "text-muted-foreground"
                }`}
              />
              <Switch
                id="dark-mode"
                checked={isDarkMode}
                onCheckedChange={toggleDarkMode}
              />
              <Moon
                className={`h-5 w-5 ${
                  isDarkMode ? "text-blue-400" : "text-muted-foreground"
                }`}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="api-key">Google Gemini API Key</Label>
            <p className="text-sm text-muted-foreground">
              Needed for AI responses. Get one from Google AI Studio. Your key is stored only in your browser.
            </p>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Google Gemini API key"
            />
          </div>
          <Button onClick={handleSaveApiKey}>Save API Key</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
