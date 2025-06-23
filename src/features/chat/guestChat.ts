import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import type { Chat, Message, NewMessage } from '@/services/chatService';

export type GuestMessage = Message;
export type GuestChat = Chat & { messages: GuestMessage[] };

type GuestData = { chats: GuestChat[]; activeChatId: string | null };

export const getGuestData = (): GuestData => {
  const data = sessionStorage.getItem('guestChatData');
  return data ? JSON.parse(data) : { chats: [], activeChatId: null };
};

export const setGuestData = (data: GuestData) => {
  sessionStorage.setItem('guestChatData', JSON.stringify(data));
};

export const createGuestChat = (
  title: string,
  setGuestChats: React.Dispatch<React.SetStateAction<GuestChat[]>>,
  setActiveChatId: React.Dispatch<React.SetStateAction<string | null>>
): GuestChat => {
  const newChat: GuestChat = {
    id: uuidv4(),
    title,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: '',
    is_pinned: false,
    folder_id: null,
    messages: [],
  };
  setGuestChats(prev => [newChat, ...prev]);
  setActiveChatId(newChat.id);
  return newChat;
};

export const addGuestMessage = (
  message: NewMessage,
  setGuestChats: React.Dispatch<React.SetStateAction<GuestChat[]>>
) => {
  setGuestChats(prev =>
    prev.map(chat =>
      chat.id === message.chat_id
        ? {
            ...chat,
            messages: [
              ...chat.messages,
              { ...message, id: uuidv4(), created_at: new Date().toISOString() } as GuestMessage,
            ],
            updated_at: new Date().toISOString(),
          }
        : chat
    ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
  );
};

export const updateGuestChatTitle = (
  { chatId, title }: { chatId: string, title: string },
  setGuestChats: React.Dispatch<React.SetStateAction<GuestChat[]>>
) => {
  setGuestChats(prev => prev.map(c => c.id === chatId ? {...c, title} : c));
};

export const deleteGuestChat = (
  chatId: string,
  guestChats: GuestChat[],
  setGuestChats: React.Dispatch<React.SetStateAction<GuestChat[]>>,
  activeChatId: string | null,
  setActiveChatId: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const remaining = guestChats.filter(c => c.id !== chatId);
  setGuestChats(remaining);
  if(activeChatId === chatId) {
      setActiveChatId(remaining.length > 0 ? remaining[0].id : null);
  }
  toast.success("Chat deleted for this session.");
};

export const checkAndAddErrorBubbleForGuest = (
  chatId: string,
  guestChats: GuestChat[],
  setGuestChats: React.Dispatch<React.SetStateAction<GuestChat[]>>
) => {
  const chat = guestChats.find(c => c.id === chatId);
  if (!chat || !chat.messages.length) return;

  const lastMessage = chat.messages[chat.messages.length - 1];
  
  // If the last message is from user and there's no assistant response following it,
  // and it's not already an error message, add an error bubble
  if (lastMessage.role === 'user') {
    const hasErrorBubble = chat.messages.some(msg => 
      msg.role === 'assistant' && 
      msg.error && 
      new Date(msg.created_at) > new Date(lastMessage.created_at)
    );
    
    if (!hasErrorBubble) {
      const errorMessage: GuestMessage = {
        id: uuidv4(),
        chat_id: chatId,
        content: '',
        role: 'assistant',
        created_at: new Date().toISOString(),
        isStreaming: false,
        user_id: '',
        model: undefined,
        provider: undefined,
        usage: null,
        error: 'Response was interrupted. Please try sending your message again.'
      };
      
      setGuestChats(prev =>
        prev.map(c =>
          c.id === chatId
            ? {
                ...c,
                messages: [...c.messages, errorMessage],
                updated_at: new Date().toISOString(),
              }
            : c
        )
      );
    }
  }
};
