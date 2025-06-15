
import { MessageSquare } from "lucide-react";
import { SidebarMenuItem } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface Chat {
  id: string;
  title: string;
  date: string;
  messages: unknown[];
}

interface TagItemProps {
  chat: Chat;
  isActive: boolean;
  onSelectChat: (chat: Chat) => void;
}

const TagItem = ({ chat, isActive, onSelectChat }: TagItemProps) => {
  return (
    <SidebarMenuItem className="group/item" data-active={isActive}>
      <div
        onClick={() => onSelectChat(chat)}
        data-active={isActive}
        className={cn(
          "w-full text-left rounded-md cursor-pointer transition-colors p-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
        )}
      >
        <div className="flex items-start gap-2">
          <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm font-medium">{chat.title}</div>
            <div className="text-xs text-muted-foreground group-data-[active=true]/item:text-primary-foreground/70">
              {chat.date}
            </div>
          </div>
        </div>
      </div>
    </SidebarMenuItem>
  );
};

export default TagItem;
