
import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  sendChatMessage, 
  getAvailableProviders, 
  getDefaultModel,
  getAvailableModels,
  type ChatMessage, 
  type NormalizedResponse 
} from '@/services/aiProviderService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useAIProvider = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');

  // Fetch available providers for the current user
  const { data: availableProviders = [], isLoading: isLoadingProviders } = useQuery({
    queryKey: ['availableProviders', user?.id],
    queryFn: getAvailableProviders,
    enabled: !!user,
  });

  // Auto-select first provider when available
  useEffect(() => {
    if (availableProviders.length > 0 && !selectedProvider) {
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

    if (!user) {
      toast.error('Please sign in to use AI features');
      return null;
    }

    setIsLoading(true);
    try {
      const response = await sendChatMessage({
        provider: selectedProvider,
        model: selectedModel,
        messages,
        temperature,
        max_tokens: maxTokens,
      });

      console.log(`AI Response from ${selectedProvider}:`, response);
      return response;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [selectedProvider, selectedModel, user]);

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
