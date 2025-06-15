
import { User, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

interface UserFooterProps {
  isGuest: boolean;
  user: { email: string | null } | null;
  onOpenProfile: () => void;
}

const UserFooter = ({ isGuest, user, onOpenProfile }: UserFooterProps) => {
  const navigate = useNavigate();

  const getInitials = () => {
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "G";
  };

  return (
    <>
      {isGuest ? (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800">
            <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              Sign in for more features
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300 mb-3">
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
      ) : (
        <button 
          onClick={onOpenProfile} 
          aria-label="Open user profile"
          className="flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-accent-foreground w-full text-left"
        >
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.email}</div>
            <div className="text-xs text-muted-foreground">Signed in</div>
          </div>
          <User className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
    </>
  );
};

export default UserFooter;
