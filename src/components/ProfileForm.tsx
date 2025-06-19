import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Tables, TablesUpdate } from '@/integrations/supabase/types';
import { useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Pencil } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

const profileFormSchema = z.object({
  full_name: z.string().min(2, { message: "Full name must be at least 2 characters." }).max(50).or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  profile: Tables<'profiles'>;
  onSuccess?: () => void;
}

const ProfileForm = ({ profile, onSuccess }: ProfileFormProps) => {
  const { user } = useAuth();
  const { updateProfile, isUpdatingProfile } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: profile.full_name || '',
    },
    mode: 'onChange',
  });

  const handleAvatarUpload = async (file: File) => {
    if (!user) return null;
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
      upsert: true,
    });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return `${data.publicUrl}?t=${new Date().getTime()}`;
  };

  const onSubmit = async (data: ProfileFormValues) => {
    const updates: TablesUpdate<'profiles'> = { full_name: data.full_name || '' };

    if (avatarFile) {
      try {
        const newAvatarUrl = await handleAvatarUpload(avatarFile);
        if (newAvatarUrl) {
          updates.avatar_url = newAvatarUrl;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        toast.error(`Failed to upload avatar: ${errorMessage}`);
        return;
      }
    }
    
    updateProfile(updates, {
      onSuccess: () => {
        if (onSuccess) {
          onSuccess();
        }
      }
    });
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const getInitials = () => {
    if (form.getValues().full_name) {
      return form.getValues().full_name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "??";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <button onClick={() => fileInputRef.current?.click()} className="relative group">
          <Avatar className="w-24 h-24">
            <AvatarImage src={avatarPreview || undefined} alt="User avatar" />
            <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-4xl">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <Pencil className="text-white h-8 w-8"/>
          </div>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAvatarChange}
          className="hidden"
          accept="image/png, image/jpeg"
        />
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isUpdatingProfile}>
            {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ProfileForm;
