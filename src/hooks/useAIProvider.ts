
import { useState, useCallback, useEffect } from 'react';
import { useModelSelection } from './useModelSelection';
import { useQuery } from '@tanstack/react-query';
import { 
  sendChatMessage, 
  streamChatMessage,
  getAvailableProviders, 
  getDefaultModel,
  type ChatMessage, 
  type NormalizedResponse,
  type ChatRequest
} from '@/services/aiProviderService';
import { getAuthenticatedUserApiKey } from '@/services/chatService';
import { modelProviderService, type ModelInfo } from '@/services/modelProviderService';
import { modelPersistenceService } from '@/services/modelPersistenceService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useAIProvider = () => {
  const {
    selectedProvider,
    selectedModel,
    setSelectedProvider,
    setSelectedModel,
    isInitialized,
    hasUserSelection,
  } = useModelSelection();

  // Safety check for setSelectedProvider
  if (!setSelectedProvider) {
    console.error('setSelectedProvider is undefined. Check useModelSelection hook export.');
  }
  if (!setSelectedModel) {
    console.error('setSelectedModel is undefined. Check useModelSelection hook export.');
  }
  const { user, isGuest, guestApiKeys } = useAuth();
  const [isAiResponding, setIsAiResponding] = useState(false);

  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  const { data: availableProvidersFromDB = [], isLoading: isLoadingProviders } = useQuery({
    queryKey: ['availableProviders', user?.id],
    queryFn: getAvailableProviders,
    enabled: !!user && !isGuest,
  });

  const availableProviders = isGuest
    ? guestApiKeys.map(k => k.provider)
    : availableProvidersFromDB;

  const fetchModels = useCallback(async (provider: string) => {
    if (!provider) return;

    setIsLoadingModels(true);
    setModelError(null);

    try {
      let apiKey: string | undefined;
      
      if (isGuest) {
        // For guest users, get API key from session storage
        apiKey = guestApiKeys.find(k => k.provider === provider)?.api_key;
      } else if (user) {
        // For authenticated users, get API key from database
        apiKey = await getAuthenticatedUserApiKey(provider, user.id) || undefined;
      }
      
      let modelResponse;
      
      // Use the appropriate method based on provider
      switch (provider) {
        case 'OpenRouter':
          modelResponse = await modelProviderService.fetchOpenRouterModels(apiKey);
          break;
        case 'Google Gemini':
          modelResponse = await modelProviderService.fetchGeminiModels(apiKey);
          break;
        case 'OpenAI':
          modelResponse = await modelProviderService.fetchOpenAIModels(apiKey);
          break;
        default:
          // For providers without dynamic fetching, use fallback models
          setAvailableModels([]);
          setModelError(`Dynamic model fetching not implemented for ${provider}`);
          return;
      }
      
      setAvailableModels(modelResponse.models);
      
      if (modelResponse.error) {
        setModelError(modelResponse.error);
      } else if (hasUserSelection && selectedModel && !modelPersistenceService.isModelAvailable(selectedModel, modelResponse.models)) {
        toast.warning(`Model ${selectedModel} is no longer available. Please select a new one.`);
        // Optionally, reset to a default model for the provider
        const defaultModel = getDefaultModel(provider);
        setSelectedModel(defaultModel);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch models';
      setModelError(errorMessage);
      console.error(`Failed to fetch models for ${provider}:`, error);
      setAvailableModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  }, [isGuest, guestApiKeys, user]);

  useEffect(() => {
    if (isInitialized && availableProviders.length > 0) {
      if (!hasUserSelection) {
        // If no selection is persisted, set the default
        const firstProvider = availableProviders[0];
        if (selectedProvider !== firstProvider) {
          if (setSelectedProvider) {
            setSelectedProvider(firstProvider);
          } else {
            console.error('Cannot set default provider: setSelectedProvider is undefined');
          }
          if (setSelectedModel) {
            setSelectedModel(getDefaultModel(firstProvider));
          } else {
            console.error('Cannot set default model: setSelectedModel is undefined');
          }
        }
      } else if (!availableProviders.includes(selectedProvider)) {
        // If the persisted provider is no longer available, fallback to default
        toast.warning(`Provider ${selectedProvider} is no longer available. Falling back to default.`);
        const firstProvider = availableProviders[0];
        if (setSelectedProvider) {
          setSelectedProvider(firstProvider);
        } else {
          console.error('Cannot fallback provider: setSelectedProvider is undefined');
        }
        if (setSelectedModel) {
          setSelectedModel(getDefaultModel(firstProvider));
        } else {
          console.error('Cannot fallback model: setSelectedModel is undefined');
        }
      }
    }
  }, [isInitialized, hasUserSelection, availableProviders, selectedProvider, setSelectedProvider, setSelectedModel]);

  // Fetch models when provider changes
  useEffect(() => {
    if (selectedProvider) {
      fetchModels(selectedProvider);
    }
  }, [selectedProvider, fetchModels]);

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
    onComplete: (usage?: { prompt_tokens: number; completion_tokens: number; total_tokens?: number }) => void,
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
          // For streaming, we don't have usage data immediately, so pass empty usage
          onComplete();
        } catch (streamError) {
          console.warn('Streaming failed, falling back to non-streaming:', streamError);
          // Fallback to non-streaming
          const fallbackResponse = await sendChatMessage(request);
          if (fallbackResponse) {
            onDelta(fallbackResponse.content);
            onComplete(fallbackResponse.usage);
          } else {
            onError(new Error("Both streaming and non-streaming failed."));
          }
        }
      } else {
        // For non-OpenAI providers, use non-streaming directly
        const fallbackResponse = await sendChatMessage(request);
        if (fallbackResponse) {
          onDelta(fallbackResponse.content);
          onComplete(fallbackResponse.usage);
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
    if (setSelectedProvider) {
      setSelectedProvider(provider);
    } else {
      console.error('Cannot switch provider: setSelectedProvider is undefined');
    }
    if (setSelectedModel) {
      setSelectedModel(getDefaultModel(provider));
    } else {
      console.error('Cannot switch model: setSelectedModel is undefined');
    }
  }, [setSelectedProvider, setSelectedModel]);

  const switchModel = useCallback((model: string) => {
    if (setSelectedModel) {
      setSelectedModel(model);
    } else {
      console.error('Cannot switch model: setSelectedModel is undefined');
    }
  }, [setSelectedModel]);

  return {
    // State
    isAiResponding,
    isLoadingProviders,
    selectedProvider,
    selectedModel,
    availableProviders,
    availableModels,
    isLoadingModels,
    modelError,
    
    // Actions
    sendMessage,
    streamMessage,
    switchProvider,
    switchModel,
  };
};
