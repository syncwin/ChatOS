
import { Pin, PinOff, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarMenuItem } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface Chat {
  id: string;
  title: string;
  date: string;
  messages: unknown[];
  is_pinned: boolean;
}

interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  isEditing: boolean;
  newChatTitle: string;
  onSelectChat: (chat: Chat) => void;
  onStartEdit: (chatId: string, currentTitle: string) => void;
  onPinChat: (e: React.MouseEvent, chatId: string, isPinned: boolean) => void;
  onDeleteChat: (e: React.MouseEvent, chatId: string) => void;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpdateTitle: (chatId: string) => void;
  onTitleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, chatId: string) => void;
}

const ChatItem = ({
  chat,
  isActive,
  isEditing,
  newChatTitle,
  onSelectChat,
  onStartEdit,
  onPinChat,
  onDeleteChat,
  onTitleChange,
  onUpdateTitle,
  onTitleKeyDown,
}: ChatItemProps) => {
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStartEdit(chat.id, chat.title);
  };

  return (
    <SidebarMenuItem className="group/item" data-active={isActive}>
      <div
        onClick={() => !isEditing && onSelectChat(chat)}
        data-active={isActive}
        className="w-full text-left rounded-md cursor-pointer transition-colors p-2.5 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
      >
        {isEditing ? (
          <Input
            value={newChatTitle}
            onChange={onTitleChange}
            onBlur={() => onUpdateTitle(chat.id)}
            onKeyDown={(e) => onTitleKeyDown(e, chat.id)}
            onClick={(e) => e.stopPropagation()}
            className="h-7 text-sm flex-1 bg-transparent border-0 border-b border-current focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
        ) : (
          <div>
            <div className="flex items-start">
              {chat.is_pinned && <Pin className="w-3 h-3 mr-2 mt-1 flex-shrink-0 text-amber-500" />}
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-medium">{chat.title}</div>
                <div className="text-xs text-muted-foreground group-data-[active=true]/item:text-primary-foreground/70">{chat.date}</div>
              </div>
            </div>
            
            <div className={cn(
              "items-center justify-start gap-0.5 mt-2 hidden",
              "group-hover/item:flex group-data-[active=true]/item:flex"
            )}>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground group-data-[active=true]/item:text-primary-foreground group-data-[active=true]/item:hover:bg-primary/80"
                onClick={handleEditClick}
                aria-label={`Edit chat title: ${chat.title}`}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground group-data-[active=true]/item:text-primary-foreground group-data-[active=true]/item:hover:bg-primary/80"
                onClick={e => onPinChat(e, chat.id, chat.is_pinned)}
                aria-label={chat.is_pinned ? `Unpin chat: ${chat.title}` : `Pin chat: ${chat.title}`}
              >
                {chat.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground group-data-[active=true]/item:text-primary-foreground group-data-[active=true]/item:hover:bg-primary/80"
                onClick={e => onDeleteChat(e, chat.id)} 
                aria-label={`Delete chat: ${chat.title}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </SidebarMenuItem>
  );
};

export default ChatItem;
