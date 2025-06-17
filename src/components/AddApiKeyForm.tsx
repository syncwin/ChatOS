
import { useForm } from "react-hook-form";
import { useEffect } from "react"; // Added for watching provider, though direct watch is often enough
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";
import { apiKeySchema, ApiKeyFormValues } from "@/hooks/useApiKeys";
import { Constants } from "@/integrations/supabase/types";
import { UseMutationResult } from "@tanstack/react-query";

interface AddApiKeyFormProps {
  saveMutation: UseMutationResult<void, Error, ApiKeyFormValues, unknown>;
}

const AddApiKeyForm = ({ saveMutation }: AddApiKeyFormProps) => {
  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      api_key: "",
      provider: undefined,
      endpoint_url: "",
      deployment_id: "",
    },
  });

  const watchedProvider = form.watch('provider');

  // Optional: Reset dependent fields when provider changes
  useEffect(() => {
    if (watchedProvider !== 'Azure OpenAI (Custom)') {
      form.setValue('endpoint_url', undefined);
      form.setValue('deployment_id', undefined);
    }
  }, [watchedProvider, form]);

  const onSubmit = (data: ApiKeyFormValues) => {
    saveMutation.mutate(data, {
      onSuccess: () => {
        toast.success("API key saved successfully!");
        form.reset({ provider: form.getValues('provider'), api_key: "" });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="provider"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provider</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Constants.public.Enums.api_provider.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="api_key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Key</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Enter your API key"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchedProvider === 'Azure OpenAI (Custom)' && (
          <>
            <FormField
              control={form.control}
              name="endpoint_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endpoint URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="e.g., https://your-resource.openai.azure.com/"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deployment_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deployment ID</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="e.g., gpt-4o-mini"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
          {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save API Key
        </Button>
      </form>
    </Form>
  );
};

export default AddApiKeyForm;

