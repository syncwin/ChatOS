
import React, { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import ProviderIconSelector from './ProviderIconSelector';
import FolderDropdown from './FolderDropdown';
import TagDropdown from './TagDropdown';
import type { Folder, Chat, Tag } from '@/services/chatService';
import type { ModelInfo } from '@/services/modelProviderService';

interface MobileSelectionModalProps {
  availableProviders: string[];
  selectedProvider: string;
  onSelectProvider: (provider: string) => void;
  availableModels: ModelInfo[];
  isLoadingModels: boolean;
  modelError: string | null;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  isLoadingProviders: boolean;
  folders: Folder[];
  isLoadingFolders: boolean;
  onAssignChatToFolder: (folderId: string) => void;
  activeChat: Chat | undefined;
  tags: Tag[];
  chatTags: Tag[];
  isLoadingTags: boolean;
  onAssignTagToChat: (tagId: string) => void;
  onRemoveTagFromChat: (tagId: string) => void;
  onCreateFolder: (name: string) => void;
  onCreateTag: (name: string, color?: string) => void;
}

const MobileSelectionModal = ({
  availableProviders,
  selectedProvider,
  onSelectProvider,
  availableModels,
  selectedModel,
  onSelectModel,
  isLoadingModels,
  modelError,
  isLoadingProviders,
  folders,
  isLoadingFolders,
  onAssignChatToFolder,
  activeChat,
  tags,
  chatTags,
  isLoadingTags,
  onAssignTagToChat,
  onRemoveTagFromChat,
  onCreateFolder,
  onCreateTag,
}: MobileSelectionModalProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-muted rounded-md transition-colors"
        >
          <Filter className="w-4 h-4 text-primary dark:text-white" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-md mx-auto p-0 gap-0 max-h-[85vh] overflow-hidden">
        <DialogHeader className="p-4 pb-2 border-b flex-shrink-0">
          <DialogTitle className="text-lg font-semibold">
            Chat Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 space-y-6 overflow-y-auto flex-1">
          {/* AI Provider & Model Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-primary rounded-full"></div>
              <h3 className="text-sm font-semibold text-foreground">AI Provider & Model</h3>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <ProviderIconSelector
                availableProviders={availableProviders}
                selectedProvider={selectedProvider}
                onSelectProvider={onSelectProvider}
                availableModels={availableModels}
                selectedModel={selectedModel}
                onSelectModel={onSelectModel}
                isLoadingProviders={isLoadingProviders}
                isLoadingModels={isLoadingModels}
                modelError={modelError}
              />
            </div>
          </div>

          <Separator className="my-4" />

          {/* Folder Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-secondary rounded-full"></div>
              <h3 className="text-sm font-semibold text-foreground">Folder Organization</h3>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <FolderDropdown
                folders={folders}
                activeChat={activeChat}
                onAssignChatToFolder={onAssignChatToFolder}
                onCreateFolder={onCreateFolder}
                isLoading={isLoadingFolders}
              />
            </div>
          </div>

          <Separator className="my-4" />

          {/* Tags Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-accent rounded-full"></div>
              <h3 className="text-sm font-semibold text-foreground">Tags & Labels</h3>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <TagDropdown
                tags={tags}
                chatTags={chatTags}
                activeChat={activeChat}
                onAssignTagToChat={onAssignTagToChat}
                onRemoveTagFromChat={onRemoveTagFromChat}
                onCreateTag={onCreateTag}
                isLoading={isLoadingTags}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MobileSelectionModal;
