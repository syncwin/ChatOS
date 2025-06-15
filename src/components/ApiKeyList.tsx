
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";
import { ApiKeyFormValues } from "@/hooks/useApiKeys";

interface ApiKeyListProps {
  isLoading: boolean;
  savedKeys: { provider: string }[] | undefined;
  deleteMutation: UseMutationResult<void, Error, ApiKeyFormValues['provider'], unknown>;
}

const ApiKeyList = ({ isLoading, savedKeys, deleteMutation }: ApiKeyListProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading saved keys...</span>
      </div>
    );
  }

  if (!savedKeys || savedKeys.length === 0) {
    return <p className="text-sm text-muted-foreground">No API keys saved yet.</p>;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Saved Providers</h4>
      <ul className="rounded-md border p-2 space-y-2">
        {savedKeys.map(({ provider }) => (
          <li key={provider} className="flex items-center justify-between text-sm">
            <span>{provider}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => deleteMutation.mutate(provider)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ApiKeyList;

