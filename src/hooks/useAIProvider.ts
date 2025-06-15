
import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  sendChatMessage, 
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
  const [isLoading, setIsLoading] = useState(false);
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

    setIsLoading(true);

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
      setIsLoading(false);
    }
  }, [selectedProvider, selectedModel, user, isGuest, guestApiKeys]);

  const switchProvider = useCallback((provider: string) => {
    setSelectedProvider(provider);
    setSelectedModel(getDefaultModel(provider));
  }, []);

  const switchModel = useCallback((model: string) => {
    setSelectedModel(model);
  }, []);

  return {
    // State
    isLoading,
    isLoadingProviders,
    selectedProvider,
    selectedModel,
    availableProviders,
    availableModels: selectedProvider ? getAvailableModels(selectedProvider) : [],
    
    // Actions
    sendMessage,
    switchProvider,
    switchModel,
  };
};
