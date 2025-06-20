
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAIProvider } from "@/hooks/useAIProvider";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Bot } from "lucide-react";

const ProviderSelector = () => {
  const { user } = useAuth();
  const {
    isLoadingProviders,
    selectedProvider,
    selectedModel,
    availableProviders,
    availableModels,
    switchProvider,
    switchModel,
  } = useAIProvider();

  if (!user) {
    return (
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Bot className="h-4 w-4" />
            <span className="text-sm">Sign in to select AI providers</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoadingProviders) {
    return (
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading available providers...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (availableProviders.length === 0) {
    return (
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="text-center">
            <Bot className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              No AI providers configured
            </p>
            <p className="text-xs text-muted-foreground">
              Add API keys in Settings to start chatting with AI
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bot className="h-4 w-4" />
          AI Provider Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="provider-select" className="text-xs font-medium">
              Provider
            </Label>
            <Select value={selectedProvider} onValueChange={switchProvider}>
              <SelectTrigger id="provider-select">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {availableProviders.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model-select" className="text-xs font-medium">
              Model
            </Label>
            <Select value={selectedModel} onValueChange={switchModel}>
              <SelectTrigger id="model-select">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedProvider && (
          <div className="pt-2">
            <Badge variant="secondary" className="text-xs">
              Ready to chat with {selectedProvider}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProviderSelector;
