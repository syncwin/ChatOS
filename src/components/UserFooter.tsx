
import { User, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";

interface UserFooterProps {
  isGuest: boolean;
  user: { email?: string | null } | null;
  onOpenProfile: () => void;
}

const UserFooter = ({ isGuest, user, onOpenProfile }: UserFooterProps) => {
  const navigate = useNavigate();
  const { state } = useSidebar();
  const { profile } = useProfile();
  const isCollapsed = state === 'collapsed';

  const getInitials = () => {
    if (profile?.nickname) {
      return profile.nickname.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "G";
  };

  const getDisplayName = () => {
    return profile?.nickname || user?.email || "Guest";
  };

  if (isGuest) {
    if (isCollapsed) {
      return (
        <div className="flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={() => navigate('/auth')} size="icon" className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                <LogIn className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Sign In</p>
            </TooltipContent>
          </Tooltip>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <div className="p-3 rounded-md bg-muted/30">
          <div className="text-sm font-medium text-foreground mb-1">
            Sign in for more features
          </div>
          <div className="text-xs text-muted-foreground mb-3">
            Save your chats, sync across devices, and access advanced settings
          </div>
          <Button 
            onClick={() => navigate('/auth')} 
            size="sm" 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const userProfileButton = (
    <button 
      onClick={onOpenProfile} 
      aria-label="Open user profile"
      className={cn(
        "flex items-center gap-3 p-3 rounded-md transition-colors cursor-pointer bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-accent-foreground w-full text-left",
        isCollapsed && "w-10 h-10 justify-center p-1"
      )}
    >
      <Avatar className="w-8 h-8">
        <AvatarImage src={profile?.avatar_url || undefined} alt="User avatar" />
        <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm">
          {getInitials()}
        </AvatarFallback>
      </Avatar>
      {!isCollapsed && (
        <>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{getDisplayName()}</div>
            <div className="text-xs text-muted-foreground">Signed in</div>
          </div>
          <User className="w-4 h-4 text-muted-foreground" />
        </>
      )}
    </button>
  );

  return (
    <div className={cn(isCollapsed && "flex justify-center")}>
      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{userProfileButton}</TooltipTrigger>
          <TooltipContent side="right">
            <p>{getDisplayName()}</p>
          </TooltipContent>
        </Tooltip>
      ) : userProfileButton}
    </div>
  );
};

export default UserFooter;
