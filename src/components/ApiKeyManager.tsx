
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Constants } from "@/integrations/supabase/types";
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
import { KeyRound, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";

const apiKeySchema = z.object({
  provider: z.enum(Constants.public.Enums.api_provider, {
    required_error: "You need to select a provider.",
  }),
  api_key: z.string().min(1, "API key cannot be empty."),
});

type ApiKeyFormValues = z.infer<typeof apiKeySchema>;

const ApiKeyManager = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: savedKeys, isLoading: isLoadingKeys } = useQuery({
    queryKey: ["apiKeys", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("api_keys")
        .select("provider")
        .eq("user_id", user.id);
      if (error) {
        toast.error("Failed to fetch API keys: " + error.message);
        return [];
      }
      return data;
    },
    enabled: !!user,
  });

  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
  });

  const saveMutation = useMutation({
    mutationFn: async (values: ApiKeyFormValues) => {
      if (!user) throw new Error("User not authenticated");
      const { error } = await supabase.from("api_keys").upsert({
        user_id: user.id,
        provider: values.provider,
        encrypted_api_key: values.api_key,
      }, { onConflict: 'user_id, provider' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("API key saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["apiKeys", user?.id] });
      form.reset({ provider: form.getValues('provider'), api_key: "" });
    },
    onError: (error) => {
      toast.error("Failed to save API key: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (provider: z.infer<typeof apiKeySchema.shape.provider>) => {
      if (!user) throw new Error("User not authenticated");
      const { error } = await supabase
        .from("api_keys")
        .delete()
        .match({ user_id: user.id, provider: provider });
      if (error) throw error;
    },
    onSuccess: (_, provider) => {
      toast.success(`API key for ${provider} deleted successfully!`);
      queryClient.invalidateQueries({ queryKey: ["apiKeys", user?.id] });
    },
    onError: (error) => {
      toast.error("Failed to delete API key: " + error.message);
    },
  });

  const onSubmit = (data: ApiKeyFormValues) => {
    saveMutation.mutate(data);
  };
  
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
          {isLoadingKeys ? (
             <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin"/>
                <span>Loading saved keys...</span>
             </div>
          ) : savedKeys && savedKeys.length > 0 ? (
            <div className="space-y-2">
                <h4 className="text-sm font-medium">Saved Providers</h4>
                <ul className="rounded-md border p-2 space-y-2">
                    {savedKeys.map(({ provider }) => (
                        <li key={provider} className="flex items-center justify-between text-sm">
                            <span>{provider}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMutation.mutate(provider)} disabled={deleteMutation.isPending}>
                                <Trash2 className="h-4 w-4 text-destructive"/>
                            </Button>
                        </li>
                    ))}
                </ul>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No API keys saved yet.</p>
          )}
        </CardContent>
      </Card>

      <Separator />

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
          <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save API Key
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ApiKeyManager;
