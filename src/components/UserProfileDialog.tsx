
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  isDarkMode: boolean;
}

const UserProfileDialog = ({ isOpen, onOpenChange, isDarkMode }: UserProfileDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={isDarkMode ? "dark" : ""}>
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>
        <div className="py-4 flex flex-col items-center gap-4">
          <Avatar className="w-24 h-24">
            <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-4xl">
              JD
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <div className="text-xl font-bold">John Doe</div>
            <div className="text-muted-foreground">john@example.com</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileDialog;
