
import { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Zap, Brain, Sparkles, Bot, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { modelProviderService, type ModelInfo } from '@/services/modelProviderService';
import { toast } from 'sonner';

interface ModelSelectorProps {
  provider: string;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  apiKey?: string;
  className?: string;
}

const providerIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'OpenAI': Sparkles,
  'Google Gemini': Zap,
  'OpenRouter': Bot,
  'Anthropic': Brain,
  'Mistral': Cpu,
};

const ModelSelector = ({ 
  provider, 
  selectedModel, 
  onSelectModel, 
  apiKey,
  className = ""
}: ModelSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let response;
      switch (provider) {
        case 'OpenAI':
          response = await modelProviderService.fetchOpenAIModels(apiKey);
          break;
        case 'Google Gemini':
          response = await modelProviderService.fetchGeminiModels(apiKey);
          break;
        case 'OpenRouter':
          response = await modelProviderService.fetchOpenRouterModels(apiKey);
          break;
        default:
          response = { models: [], error: 'Unsupported provider' };
      }

      if (response.error) {
        setError(response.error);
        toast.warning(`Using fallback models for ${provider}: ${response.error}`);
      }

      setModels(response.models);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch models';
      setError(errorMessage);
      toast.error(`Failed to load ${provider} models: ${errorMessage}`);
      setModels([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (provider && (apiKey || provider === 'OpenRouter')) {
      fetchModels();
    }
  }, [provider, apiKey]);

  const filteredModels = useMemo(() => {
    if (!searchQuery) return models;
    
    const query = searchQuery.toLowerCase();
    return models.filter(model => 
      model.name.toLowerCase().includes(query) ||
      model.id.toLowerCase().includes(query) ||
      model.description?.toLowerCase().includes(query)
    );
  }, [models, searchQuery]);

  const selectedModelInfo = models.find(m => m.id === selectedModel);
  const ProviderIcon = providerIcons[provider] || Bot;

  const formatContextLength = (length?: number) => {
    if (!length) return '';
    if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M`;
    if (length >= 1000) return `${(length / 1000).toFixed(0)}K`;
    return length.toString();
  };

  const formatPrice = (price?: number) => {
    if (!price) return '';
    return `$${price.toFixed(6)}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className={`justify-between min-w-[200px] ${className}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <ProviderIcon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              {selectedModelInfo?.name || selectedModel || 'Select model...'}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 opacity-50 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <div className="flex flex-col h-[400px]">
          <div className="p-3 pb-0">
            <div className="flex items-center gap-2 mb-3">
              <ProviderIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{provider} Models</span>
              {error && (
                <Badge variant="secondary" className="text-xs">
                  Fallback
                </Badge>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <Separator className="my-2" />

          <ScrollArea className="flex-1 px-1">
            {isLoading ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredModels.length === 0 ? (
              <div className="p-3 text-center text-sm text-muted-foreground">
                {searchQuery ? 'No models found matching your search' : 'No models available'}
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredModels.map((model) => (
                  <Button
                    key={model.id}
                    variant={model.id === selectedModel ? "secondary" : "ghost"}
                    className="w-full justify-start h-auto p-3 text-left"
                    onClick={() => {
                      onSelectModel(model.id);
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex flex-col gap-1 min-w-0 w-full">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">{model.name}</span>
                        {model.id === selectedModel && (
                          <Badge variant="default" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      
                      {model.description && (
                        <span className="text-xs text-muted-foreground line-clamp-2">
                          {model.description}
                        </span>
                      )}
                      
                      <div className="flex items-center gap-2 mt-1">
                        {model.context_length && (
                          <Badge variant="outline" className="text-xs">
                            {formatContextLength(model.context_length)} ctx
                          </Badge>
                        )}
                        {model.pricing?.prompt && (
                          <Badge variant="outline" className="text-xs">
                            {formatPrice(model.pricing.prompt)}/1K
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </ScrollArea>

          {error && (
            <>
              <Separator />
              <div className="p-3 text-xs text-muted-foreground">
                <p className="text-orange-600 dark:text-orange-400">
                  {error}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 h-7 text-xs"
                  onClick={fetchModels}
                >
                  Retry
                </Button>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ModelSelector;
