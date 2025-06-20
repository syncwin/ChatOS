
import React from 'react';
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarEditInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onCancel: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

const SidebarEditInput = ({
  value,
  onChange,
  onSave,
  onCancel,
  onKeyDown,
  placeholder,
  disabled = false,
  autoFocus = true,
}: SidebarEditInputProps) => {
  return (
    <div className="flex items-center gap-2 w-full max-w-full">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onClick={(e) => e.stopPropagation()}
        className="h-8 text-sm flex-1 min-w-0 max-w-none"
        autoFocus={autoFocus}
        style={{ width: 'calc(100% - 68px)' }} // Account for button widths
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            size="sm" 
            onClick={onSave} 
            disabled={disabled || !value.trim()} 
            className="h-8 w-8 p-0 bg-primary hover:bg-primary/90 flex-shrink-0"
          >
            <Check className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Save</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onCancel} 
            className="h-8 w-8 p-0 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Cancel</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default SidebarEditInput;
