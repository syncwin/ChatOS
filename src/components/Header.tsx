
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import ChatOsIcon from "./icons/ChatOsIcon";

interface HeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  availableProviders: string[];
  selectedProvider: string;
  onSelectProvider: (provider: string) => void;
  availableModels: string[];
  selectedModel: string;
  onSelectModel: (model: string) => void;
  isLoadingProviders: boolean;
}

const Header = ({
  isDarkMode,
  toggleDarkMode,
  availableProviders,
  selectedProvider,
  onSelectProvider,
  availableModels,
  selectedModel,
  onSelectModel,
  isLoadingProviders,
}: HeaderProps) => {
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex items-center gap-2 select-none">
        <span className="text-xl font-semibold tracking-tight">Chat</span>
        <ChatOsIcon className="w-8 h-8 text-primary" />
      </div>
      <div className="flex-1 flex justify-end gap-3 items-center">
        {availableProviders.length > 1 && (
          <Select value={selectedProvider} onValueChange={onSelectProvider} disabled={isLoadingProviders}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select AI Provider" />
            </SelectTrigger>
            <SelectContent>
              {availableProviders.map((provider) => (
                <SelectItem key={provider} value={provider}>
                  {provider}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {availableModels.length > 1 && (
          <Select value={selectedModel} onValueChange={onSelectModel}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select AI Model" />
            </SelectTrigger>
            <SelectContent>
              {availableModels.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Separator orientation="vertical" />
        <div className="flex items-center space-x-2">
          <Switch id="dark-mode" checked={isDarkMode} onCheckedChange={toggleDarkMode} />
          <Label htmlFor="dark-mode">Dark Mode</Label>
        </div>
      </div>
    </div>
  );
};

export default Header;
