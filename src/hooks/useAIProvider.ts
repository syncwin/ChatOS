
import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  sendChatMessage, 
  streamChatMessage,
  getAvailableProviders, 
  getDefaultModel,
  getAvailableModels,
  type ChatMessage, 
  type NormalizedResponse,
  type ChatRequest
} from '@/services/aiProviderService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useAIProvider = () => {
  const { user, isGuest, guestApiKeys } = useAuth();
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');

  const { data: availableProvidersFromDB = [], isLoading: isLoadingProviders } = useQuery({
    queryKey: ['availableProviders', user?.id],
    queryFn: getAvailableProviders,
    enabled: !!user && !isGuest,
  });

  const availableProviders = isGuest
    ? guestApiKeys.map(k => k.provider)
    : availableProvidersFromDB;

  useEffect(() => {
    if (availableProviders.length > 0 && !availableProviders.includes(selectedProvider)) {
      const firstProvider = availableProviders[0];
      setSelectedProvider(firstProvider);
      setSelectedModel(getDefaultModel(firstProvider));
    }
  }, [availableProviders, selectedProvider]);

  const sendMessage = useCallback(async (
    messages: ChatMessage[],
    temperature: number = 0.7,
    maxTokens: number = 1000
  ): Promise<NormalizedResponse | null> => {
    if (!selectedProvider) {
      toast.error('Please select an AI provider first');
      return null;
    }

    setIsAiResponding(true);

    try {
      const request: ChatRequest = {
        provider: selectedProvider,
        model: selectedModel,
        messages,
        temperature,
        max_tokens: maxTokens,
      };

      if (isGuest) {
        const guestKey = guestApiKeys.find(k => k.provider === selectedProvider)?.api_key;
        if (!guestKey) {
          toast.error(`API key for ${selectedProvider} not found for guest session.`);
          return null;
        }
        request.apiKey = guestKey;
      } else if (!user) {
        toast.error('Please sign in to use AI features');
        return null;
      }

      const response = await sendChatMessage(request);
      console.log(`AI Response from ${selectedProvider}:`, response);
      return response;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
      return null;
    } finally {
      setIsAiResponding(false);
    }
  }, [selectedProvider, selectedModel, user, isGuest, guestApiKeys]);

  const streamMessage = useCallback(async (
    messages: ChatMessage[],
    onDelta: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
  ) => {
    if (!selectedProvider) {
      onError(new Error('Please select an AI provider first'));
      return;
    }

    setIsAiResponding(true);

    try {
      const request: ChatRequest = {
        provider: selectedProvider,
        model: selectedModel,
        messages,
      };

      if (isGuest) {
        const guestKey = guestApiKeys.find(k => k.provider === selectedProvider)?.api_key;
        if (!guestKey) {
          throw new Error(`API key for ${selectedProvider} not found for guest session.`);
        }
        request.apiKey = guestKey;
      } else if (!user) {
        throw new Error('Please sign in to use AI features');
      }

      // Try streaming first, but gracefully fallback to non-streaming
      if (selectedProvider === 'OpenAI') {
        try {
          await streamChatMessage(request, onDelta, onError);
          onComplete();
        } catch (streamError) {
          console.warn('Streaming failed, falling back to non-streaming:', streamError);
          // Fallback to non-streaming
          const fallbackResponse = await sendChatMessage(request);
          if (fallbackResponse) {
            onDelta(fallbackResponse.content);
            onComplete();
          } else {
            onError(new Error("Both streaming and non-streaming failed."));
          }
        }
      } else {
        // For non-OpenAI providers, use non-streaming directly
        const fallbackResponse = await sendChatMessage(request);
        if (fallbackResponse) {
          onDelta(fallbackResponse.content);
          onComplete();
        } else {
          onError(new Error("Non-streaming request failed."));
        }
      }
    } catch (error) {
      console.error('Error in streamMessage:', error);
      onError(error as Error);
    } finally {
      setIsAiResponding(false);
    }
  }, [selectedProvider, selectedModel, user, isGuest, guestApiKeys, sendMessage]);

  const switchProvider = useCallback((provider: string) => {
    setSelectedProvider(provider);
    setSelectedModel(getDefaultModel(provider));
  }, []);

  const switchModel = useCallback((model: string) => {
    setSelectedModel(model);
  }, []);

  return {
    // State
    isAiResponding,
    isLoadingProviders,
    selectedProvider,
    selectedModel,
    availableProviders,
    availableModels: selectedProvider ? getAvailableModels(selectedProvider) : [],
    
    // Actions
    sendMessage,
    streamMessage,
    switchProvider,
    switchModel,
  };
};
