
import { ReactNode } from 'react';
import { ChevronDown, Pin, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface CollapsibleSidebarSectionProps {
  title: string;
  isCollapsed: boolean;
  isPinned: boolean;
  onToggle: () => void;
  onTogglePin: () => void;
  children: ReactNode;
  rightElement?: ReactNode;
  onPlusClick?: () => void;
}

const CollapsibleSidebarSection = ({
  title,
  isCollapsed,
  isPinned,
  onToggle,
  onTogglePin,
  children,
  rightElement,
  onPlusClick
}: CollapsibleSidebarSectionProps) => {
  return (
    <Collapsible open={!isCollapsed} onOpenChange={onToggle}>
      <div className="flex items-center justify-between px-2 py-1 group/section-header hover:bg-muted/50 rounded-md transition-colors">
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground p-1 h-auto py-[4px] text-center px-[4px] hover:bg-transparent"
          >
            <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", isCollapsed && "-rotate-90")} />
            <span className="mr-2">{title}</span>
          </Button>
        </CollapsibleTrigger>
        <div className="flex items-center gap-1">
          {rightElement}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 opacity-0 group-hover/section-header:opacity-100 transition-opacity hover:bg-muted" 
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }} 
            aria-label={isPinned ? "Unpin section" : "Pin section"}
          >
            {isPinned ? <Pin className="w-3 h-3 text-blue-500" /> : <PinOff className="w-3 h-3" />}
          </Button>
        </div>
      </div>
      <CollapsibleContent className="pb-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default CollapsibleSidebarSection;
