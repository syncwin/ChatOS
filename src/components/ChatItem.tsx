
import { Pin, PinOff, Pencil, Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarMenuItem } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import SidebarEditInput from "@/components/ui/SidebarEditInput";

interface Chat {
  id: string;
  title: string;
  date: string;
  messages: unknown[];
  is_pinned: boolean;
  folder_id: string | null;
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
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStartEdit(chat.id, chat.title);
  };

  const handleCancelEdit = () => {
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' }) as unknown as React.KeyboardEvent<HTMLInputElement>;
    onTitleKeyDown(escapeEvent, chat.id);
  };

  const itemContent = (
    <div
      onClick={() => !isEditing && onSelectChat(chat)}
      data-active={isActive}
      className={cn(
        "w-full text-left rounded-md cursor-pointer transition-colors p-2.5 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground",
        isCollapsed && "flex justify-center items-center h-10 w-10 mx-auto"
      )}
    >
      {isEditing && !isCollapsed ? (
        <div className="w-full">
          <SidebarEditInput
            value={newChatTitle}
            onChange={onTitleChange}
            onSave={() => onUpdateTitle(chat.id)}
            onCancel={handleCancelEdit}
            onKeyDown={(e) => onTitleKeyDown(e, chat.id)}
            placeholder="Enter chat title"
          />
        </div>
      ) : isCollapsed ? (
        chat.is_pinned ? <Pin className="w-4 h-4 text-accent" /> : <MessageSquare className="w-4 h-4" />
      ) : (
        <div>
          <div className="flex items-start">
            {chat.is_pinned && <Pin className="w-3 h-3 mr-2 mt-1 flex-shrink-0 text-accent" />}
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
  );

  return (
    <SidebarMenuItem className="group/item" data-active={isActive}>
      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{itemContent}</TooltipTrigger>
          <TooltipContent side="right">
            <p>{chat.title}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        itemContent
      )}
    </SidebarMenuItem>
  );
};

export default ChatItem;
