
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
    <div className="flex items-center gap-2 w-full">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onClick={(e) => e.stopPropagation()}
        className="flex-1 h-8 text-sm border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
        autoFocus={autoFocus}
      />
      <div className="flex gap-1 flex-shrink-0">
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
    </div>
  );
};

export default SidebarEditInput;
