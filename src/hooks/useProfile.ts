
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Tables, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export const useProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        toast.error('Failed to fetch profile.');
        return null;
      }
      return data;
    },
    enabled: !!user,
  });

  const { mutate: updateProfile, isPending: isUpdatingProfile } = useMutation({
    mutationFn: async (updates: TablesUpdate<'profiles'>) => {
      if (!user) throw new Error("User not found");
      
      const updateData = {
        ...updates,
        id: user.id,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(updateData);
      if (error) throw error;
      return updateData;
    },
    onSuccess: (data) => {
      toast.success('Profile updated successfully!');
      queryClient.setQueryData(['profile', user?.id], (old: any) => ({ ...old, ...data }));
    },
    onError: (error: any) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });

  return { profile, isLoadingProfile, updateProfile, isUpdatingProfile };
};
