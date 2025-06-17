
import { useState } from "react";
import { Bot, Sparkles, Zap, Brain, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ProviderIconSelectorProps {
  availableProviders: string[];
  selectedProvider: string;
  onSelectProvider: (provider: string) => void;
  availableModels: string[];
  selectedModel: string;
  onSelectModel: (model: string) => void;
  isLoadingProviders: boolean;
}

// Map providers to icons
const providerIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'OpenAI': Sparkles,
  'Anthropic': Brain,
  'Google': Zap,
  'Gemini': Zap,
  'Mistral': Cpu,
  'OpenRouter': Bot,
};

const ProviderIconSelector = ({
  availableProviders,
  selectedProvider,
  onSelectProvider,
  availableModels,
  selectedModel,
  onSelectModel,
  isLoadingProviders,
}: ProviderIconSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (isLoadingProviders || availableProviders.length === 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-muted"
            disabled
          >
            <Bot className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isLoadingProviders ? 'Loading providers...' : 'No providers available'}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  const SelectedIcon = providerIcons[selectedProvider] || Bot;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-muted relative"
            >
              <SelectedIcon className="w-4 h-4" />
              {selectedProvider && (
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>{selectedProvider ? `${selectedProvider} - ${selectedModel}` : 'Select AI Provider'}</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-72 bg-popover border shadow-md" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">AI Provider & Model</span>
          </div>

          {selectedProvider && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Current Selection</span>
              <div className="mt-1">
                <Badge variant="secondary" className="text-xs">
                  {selectedProvider} - {selectedModel}
                </Badge>
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Available Providers</span>
            <div className="grid grid-cols-2 gap-2">
              {availableProviders.map((provider) => {
                const ProviderIcon = providerIcons[provider] || Bot;
                const isSelected = provider === selectedProvider;
                
                return (
                  <Button
                    key={provider}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className="h-12 flex flex-col gap-1 text-xs"
                    onClick={() => {
                      onSelectProvider(provider);
                      setIsOpen(false);
                    }}
                  >
                    <ProviderIcon className="w-4 h-4" />
                    <span className="truncate">{provider}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {selectedProvider && availableModels.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Available Models</span>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {availableModels.map((model) => (
                    <Button
                      key={model}
                      variant={model === selectedModel ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start h-8 text-xs"
                      onClick={() => {
                        onSelectModel(model);
                        setIsOpen(false);
                      }}
                    >
                      <span className="truncate">{model}</span>
                      {model === selectedModel && <span className="ml-auto text-xs">✓</span>}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ProviderIconSelector;
