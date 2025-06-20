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
          className="h-10 w-10 hover:bg-muted rounded-md transition-colors"
        >
          <Filter className="w-5 h-5 text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent className="mobile-selection-modal w-[95vw] max-w-lg mx-auto p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center justify-between text-lg font-semibold">
            <span>Chat Settings</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-muted rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6 space-y-8">
          {/* AI Provider & Model Section */}
          <div className="mobile-selection-section space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-primary rounded-full"></div>
              <h3 className="text-base font-semibold text-foreground">AI Provider & Model</h3>
            </div>
            <div className="bg-muted/30 rounded-md p-4 flex justify-center">
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

          <Separator className="my-6" />

          {/* Folder Section */}
          <div className="mobile-selection-section space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-secondary rounded-full"></div>
              <h3 className="text-base font-semibold text-foreground">Folder Organization</h3>
            </div>
            <div className="bg-muted/30 rounded-md p-4 flex justify-center">
              <FolderDropdown
                folders={folders}
                activeChat={activeChat}
                onAssignChatToFolder={onAssignChatToFolder}
                onCreateFolder={onCreateFolder}
                isLoading={isLoadingFolders}
              />
            </div>
          </div>

          <Separator className="my-6" />

          {/* Tags Section */}
          <div className="mobile-selection-section space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-accent rounded-full"></div>
              <h3 className="text-base font-semibold text-foreground">Tags & Labels</h3>
            </div>
            <div className="bg-muted/30 rounded-md p-4 flex justify-center">
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