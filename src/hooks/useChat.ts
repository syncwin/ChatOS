
import { useAuth } from './useAuth';
import { useGuestChat } from './useGuestChat';
import { useAuthenticatedChat } from './useAuthenticatedChat';
import type { Chat as DbChat, Folder, Message, Tag, NewMessage } from '@/services/chatService';

export interface UseChatReturn {
  chats: (DbChat & { tags: Tag[] })[];
  isLoadingChats: boolean;
  activeChatId: string | null;
  setActiveChatId: React.Dispatch<React.SetStateAction<string | null>>;
  messages: Message[];
  isLoadingMessages: boolean;
  createChat: (title: string) => void;
  createChatAsync: (title: string) => Promise<any>;
  addMessage: (message: NewMessage, options?: any) => void;
  updateChatTitle: (args: { chatId: string, title: string }) => void;
  deleteChat: (chatId: string) => void;
  updateChatPinStatus: (args: { chatId: string, is_pinned: boolean }) => void;
  folders: Folder[];
  isLoadingFolders: boolean;
  createFolder: (name: string) => void;
  updateFolder: (args: { folderId: string; name: string }) => void;
  deleteFolder: (folderId: string) => void;
  assignChatToFolder: (args: { chatId: string; folderId: string | null }) => void;
  tags: Tag[];
  isLoadingTags: boolean;
  createTag: (name: string) => void;
  assignTagToChat: (args: { chatId: string; tagId: string }) => void;
  removeTagFromChat: (args: { chatId: string; tagId: string }) => void;
}

export const useChat = (): UseChatReturn => {
  const { isGuest } = useAuth();
  
  const guestChat = useGuestChat();
  const authenticatedChat = useAuthenticatedChat();
  
  if (isGuest) {
    return guestChat;
  }
  
  return authenticatedChat;
};
