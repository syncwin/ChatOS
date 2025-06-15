
import { useApiKeys } from "@/hooks/useApiKeys";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import ApiKeyList from "./ApiKeyList";
import AddApiKeyForm from "./AddApiKeyForm";

const ApiKeyManager = () => {
  const { savedKeys, isLoadingKeys, saveMutation, deleteMutation } = useApiKeys();
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage API Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your API keys are stored securely and are not readable from the client-side.
          </p>
          <ApiKeyList 
            isLoading={isLoadingKeys}
            savedKeys={savedKeys}
            deleteMutation={deleteMutation}
          />
        </CardContent>
      </Card>

      <Separator />

      <AddApiKeyForm saveMutation={saveMutation} />
    </div>
  );
};

export default ApiKeyManager;

