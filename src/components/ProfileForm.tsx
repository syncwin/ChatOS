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
  nickname: z.string().min(2, { message: "Nickname must be at least 2 characters." }).max(50).or(z.literal('')),
  username: z.string().min(3, { message: "Username must be at least 3 characters." }).max(30).regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores." }).or(z.literal('')),
  email: z.string().email({ message: "Please enter a valid email address." }),
  avatar_url: z.string().url().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
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
      nickname: profile.nickname || '',
      username: profile.username || '',
      email: user?.email || '',
      avatar_url: profile.avatar_url || '',
      website: profile.website || '',
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
    const updates: TablesUpdate<'profiles'> = { 
      nickname: data.nickname || '',
      username: data.username || null,
      website: data.website || '',
    };

    // Handle avatar upload
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

    // Handle email update if changed
    const emailChanged = data.email !== user?.email;
    if (emailChanged) {
      try {
        const { error: emailError } = await supabase.auth.updateUser(
          { email: data.email },
          {
            emailRedirectTo: `${window.location.origin}/confirm-email`
          }
        );
        
        if (emailError) {
          toast.error(`Failed to update email: ${emailError.message}`);
          return;
        }
        
        toast.success('Email change confirmation sent! Please check your new email address and click the confirmation link to complete the change.');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        toast.error(`Failed to update email: ${errorMessage}`);
        return;
      }
    }
    
    // Update profile data
    updateProfile(updates, {
      onSuccess: () => {
        if (!emailChanged) {
          toast.success('Profile updated successfully!');
        }
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
    const username = form.getValues().username;
    const nickname = form.getValues().nickname;
    
    if (username) {
      return username.charAt(0).toUpperCase();
    }
    if (nickname) {
      return nickname.split(' ').map(n => n[0]).join('').toUpperCase();
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
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="Your username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nickname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nickname</FormLabel>
                <FormControl>
                  <Input placeholder="Your nickname" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Your email address" {...field} />
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