import React from 'react';

interface ChatBubbleLoaderProps {
  type: 'new' | 'rewrite';
  messageId?: string;
  className?: string;
}

const ChatBubbleLoader: React.FC<ChatBubbleLoaderProps> = ({ 
  type, 
  messageId, 
  className = '' 
}) => {
  const getMessage = () => {
    switch (type) {
      case 'rewrite':
        return 'Rewriting response...';
      case 'new':
      default:
        return 'Generating response...';
    }
  };

  return (
    <div className={`flex items-center gap-2 mt-2 text-muted-foreground ${className}`}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
      </div>
      <span className="text-sm italic">{getMessage()}</span>
    </div>
  );
};

export default ChatBubbleLoader;