
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as z from "zod";
import { Constants } from "@/integrations/supabase/types";

export const apiKeySchema = z.object({
  provider: z.enum(Constants.public.Enums.api_provider, {
    required_error: "You need to select a provider.",
  }),
  api_key: z.string().min(1, "API key cannot be empty."),
});

export type ApiKeyFormValues = z.infer<typeof apiKeySchema>;

export const useApiKeys = () => {
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

  const saveMutation = useMutation({
    mutationFn: async (values: ApiKeyFormValues) => {
      if (!user) throw new Error("User not authenticated");
      const { error } = await supabase.from("api_keys").upsert({
        user_id: user.id,
        provider: values.provider,
        api_key: values.api_key,
      }, { onConflict: 'user_id, provider' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["availableProviders", user?.id] });
    },
    onError: (error) => {
      toast.error("Failed to save API key: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (provider: ApiKeyFormValues['provider']) => {
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
      queryClient.invalidateQueries({ queryKey: ["availableProviders", user?.id] });
    },
    onError: (error) => {
      toast.error("Failed to delete API key: " + error.message);
    },
  });

  return {
    savedKeys,
    isLoadingKeys,
    saveMutation,
    deleteMutation,
  };
};
