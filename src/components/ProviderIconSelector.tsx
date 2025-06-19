
import { useState } from "react";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ModelSelector from "./ModelSelector";
import type { ModelInfo } from '@/services/modelProviderService';
import { useAuth } from "@/hooks/useAuth";

interface ProviderIconSelectorProps {
  availableProviders: string[];
  selectedProvider: string;
  onSelectProvider: (provider: string) => void;
  availableModels: ModelInfo[];
  isLoadingModels: boolean;
  modelError: string | null;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  isLoadingProviders: boolean;
}

// Custom SVG icons for providers
const AnthropicIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" fillRule="evenodd" height="1em" style={{flex: 'none', lineHeight: 1}} viewBox="0 0 24 24" width="1em" className={className}>
    <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z" />
  </svg>
);

const GeminiIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" fillRule="evenodd" height="1em" style={{flex: 'none', lineHeight: 1}} viewBox="0 0 24 24" width="1em" className={className}>
    <path d="M12 24A14.304 14.304 0 000 12 14.304 14.304 0 0012 0a14.305 14.305 0 0012 12 14.305 14.305 0 00-12 12" />
  </svg>
);

const MistralIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" fillRule="evenodd" height="1em" style={{flex: 'none', lineHeight: 1}} viewBox="0 0 24 24" width="1em" className={className}>
    <path clipRule="evenodd" d="M3.428 3.4h3.429v3.428h3.429v3.429h-.002 3.431V6.828h3.427V3.4h3.43v13.714H24v3.429H13.714v-3.428h-3.428v-3.429h-3.43v3.428h3.43v3.429H0v-3.429h3.428V3.4zm10.286 13.715h3.428v-3.429h-3.427v3.429z" />
  </svg>
);

const OpenAIIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" fillRule="evenodd" height="1em" style={{flex: 'none', lineHeight: 1}} viewBox="0 0 24 24" width="1em" className={className}>
    <path d="M21.55 10.004a5.416 5.416 0 00-.478-4.501c-1.217-2.09-3.662-3.166-6.05-2.66A5.59 5.59 0 0010.831 1C8.39.995 6.224 2.546 5.473 4.838A5.553 5.553 0 001.76 7.496a5.487 5.487 0 00.691 6.5 5.416 5.416 0 00.477 4.502c1.217 2.09 3.662 3.165 6.05 2.66A5.586 5.586 0 0013.168 23c2.443.006 4.61-1.546 5.361-3.84a5.553 5.553 0 003.715-2.66 5.488 5.488 0 00-.693-6.497v.001zm-8.381 11.558a4.199 4.199 0 01-2.675-.954c.034-.018.093-.05.132-.074l4.44-2.53a.71.71 0 00.364-.623v-6.176l1.877 1.069c.02.01.033.029.036.05v5.115c-.003 2.274-1.87 4.118-4.174 4.123zM4.192 17.78a4.059 4.059 0 01-.498-2.763c.032.02.09.055.131.078l4.44 2.53c.225.13.504.13.73 0l5.42-3.088v2.138a.068.068 0 01-.027.057L9.9 19.288c-1.999 1.136-4.552.46-5.707-1.51h-.001zM3.023 8.216A4.15 4.15 0 015.198 6.41l-.002.151v5.06a.711.711 0 00.364.624l5.42 3.087-1.876 1.07a.067.067 0 01-.063.005l-4.489-2.559c-1.995-1.14-2.679-3.658-1.53-5.63h.001zm15.417 3.54l-5.42-3.088L14.896 7.6a.067.067 0 01.063-.006l4.489 2.557c1.998 1.14 2.683 3.662 1.529 5.633a4.163 4.163 0 01-2.174 1.807V12.38a.71.71 0 00-.363-.623zm1.867-2.773a6.04 6.04 0 00-.132-.078l-4.44-2.53a.731.731 0 00-.729 0l-5.42 3.088V7.325a.068.068 0 01.027-.057L14.1 4.713c2-1.137 4.555-.46 5.707 1.513.487.833.664 1.809.499 2.757h.001zm-11.741 3.81l-1.877-1.068a.065.065 0 01-.036-.051V6.559c.001-2.277 1.873-4.122 4.181-4.12.976 0 1.92.338 2.671.954-.034.018-.092.05-.131.073l-4.44 2.53a.71.71 0 00-.365.623l-.003 6.173v.002zm1.02-2.168L12 9.25l2.414 1.375v2.75L12 14.75l-2.415-1.375v-2.75z" />
  </svg>
);

const OpenRouterIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" fillRule="evenodd" height="1em" style={{flex: 'none', lineHeight: 1}} viewBox="0 0 24 24" width="1em" className={className}>
    <path d="M16.804 1.957l7.22 4.105v.087L16.73 10.21l.017-2.117-.821-.03c-1.059-.028-1.611.002-2.268.11-1.064.175-2.038.577-3.147 1.352L8.345 11.03c-.284.195-.495.336-.68.455l-.515.322-.397.234.385.23.53.338c.476.314 1.17.796 2.701 1.866 1.11.775 2.083 1.177 3.147 1.352l.3.045c.694.091 1.375.094 2.825.033l.022-2.159 7.22 4.105v.087L16.589 22l.014-1.862-.635.022c-1.386.042-2.137.002-3.138-.162-1.694-.28-3.26-.926-4.881-2.059l-2.158-1.5a21.997 21.997 0 00-.755-.498l-.467-.28a55.927 55.927 0 00-.76-.43C2.908 14.73.563 14.116 0 14.116V9.888l.14.004c.564-.007 2.91-.622 3.809-1.124l1.016-.58.438-.274c.428-.28 1.072-.726 2.686-1.853 1.621-1.133 3.186-1.78 4.881-2.059 1.152-.19 1.974-.213 3.814-.138l.02-1.907z" />
  </svg>
);

// Map providers to icons
const providerIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'OpenAI': OpenAIIcon,
  'Anthropic': AnthropicIcon,
  'Google': GeminiIcon,
  'Gemini': GeminiIcon,
  'Google Gemini': GeminiIcon,
  'Mistral': MistralIcon,
  'OpenRouter': OpenRouterIcon,
};

const ProviderIconSelector = ({
  availableProviders,
  selectedProvider,
  onSelectProvider,
  availableModels,
  selectedModel,
  onSelectModel,
  isLoadingModels,
  modelError,
  isLoadingProviders,
}: ProviderIconSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isGuest, guestApiKeys } = useAuth();

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

  const handleProviderSelect = (provider: string) => {
    console.log(`User selected provider: ${provider}`);
    onSelectProvider(provider);
    // Don't auto-close when selecting provider, let user select model too
  };

  const handleModelSelect = (model: string) => {
    console.log(`User selected model: ${model} for provider: ${selectedProvider}`);
    onSelectModel(model);
    setIsOpen(false); // Close popover after model selection
  };

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
              {selectedProvider && selectedModel && (
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>{selectedProvider && selectedModel ? `${selectedProvider} - ${selectedModel}` : selectedProvider ? `${selectedProvider} - Select model` : 'Select AI Provider'}</p>
        </TooltipContent>
      </Tooltip>
      
      <PopoverContent className="w-80 bg-popover border shadow-md" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">AI Provider & Model</span>
          </div>

          {selectedProvider && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Current Selection</span>
              <div className="mt-1 space-y-1">
                <Badge variant="secondary" className="text-xs">
                  {selectedProvider}
                </Badge>
                {selectedModel && (
                  <Badge variant="default" className="text-xs ml-1 bg-primary text-primary-foreground">
                    {selectedModel}
                  </Badge>
                )}
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-3">
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
                    onClick={() => handleProviderSelect(provider)}
                  >
                    <ProviderIcon className="w-4 h-4" />
                    <span className="truncate">{provider}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {selectedProvider && (
            <>
              <Separator />
              <div className="space-y-3">
                <span className="text-xs font-medium text-muted-foreground">Select Model</span>
                <ModelSelector
                  provider={selectedProvider}
                  models={availableModels}
                  selectedModel={selectedModel}
                  isLoading={isLoadingModels}
                  error={modelError}
                  onSelectModel={handleModelSelect}
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ProviderIconSelector;
