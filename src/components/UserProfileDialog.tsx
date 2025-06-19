
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import ProfileForm from "./ProfileForm";
import { useProfile } from "@/hooks/useProfile";

interface UserProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  isDarkMode: boolean;
}

const UserProfileDialog = ({ isOpen, onOpenChange, isDarkMode }: UserProfileDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, isLoadingProfile } = useProfile();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out: " + error.message);
    } else {
      toast.success("Signed out successfully");
      onOpenChange(false);
      navigate('/auth');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={isDarkMode ? "dark" : ""}>
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
          <DialogDescription>
            View and edit your profile details. Your email is {user?.email}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoadingProfile ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : profile ? (
            <ProfileForm profile={profile} onSuccess={() => onOpenChange(false)} />
          ) : user ? (
            <ProfileForm 
              profile={{ 
                id: user.id, 
                avatar_url: null, 
                full_name: '', 
                website: null, 
                updated_at: null,
                theme: 'dark',
                model_selection: null
              }} 
              onSuccess={() => onOpenChange(false)} 
            />
          ) : (
            <div className="text-center text-muted-foreground">
              Could not load profile. Please try again.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileDialog;
