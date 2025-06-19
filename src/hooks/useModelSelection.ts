
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { modelPersistenceService } from '@/services/modelPersistenceService';
import { toast } from 'sonner';

interface ModelSelection {
  provider: string;
  model: string;
}

export const useModelSelection = () => {
  const { user, isGuest } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load initial selection on mount and when auth state changes
  useEffect(() => {
    loadSelectedModel();
  }, [user, isGuest, profile]);

  const loadSelectedModel = async () => {
    try {
      let savedSelection: ModelSelection | null = null;

      if (user && profile) {
        // Load from user profile
        savedSelection = await modelPersistenceService.loadFromProfile(user.id);
      } else {
        // Load from localStorage for guests or non-logged-in users
        savedSelection = modelPersistenceService.loadFromLocalStorage();
      }

      if (savedSelection) {
        setSelectedProvider(savedSelection.provider);
        setSelectedModel(savedSelection.model);
      }
    } catch (error) {
      console.error('Failed to load model selection:', error);
    } finally {
      setIsInitialized(true);
    }
  };

  const saveSelectedModel = async (provider: string, model: string) => {
    setSelectedProvider(provider);
    setSelectedModel(model);

    try {
      if (user && profile) {
        // Save to user profile
        await modelPersistenceService.saveToProfile(user.id, provider, model);
      } else {
        // Save to localStorage for guests or non-logged-in users
        modelPersistenceService.saveToLocalStorage(provider, model);
      }
    } catch (error) {
      console.error('Failed to save model selection:', error);
      toast.error('Failed to save model selection');
    }
  };

  const clearSelectedModel = async () => {
    setSelectedProvider('');
    setSelectedModel('');

    try {
      if (user && profile) {
        await modelPersistenceService.saveToProfile(user.id, '', '');
      } else {
        modelPersistenceService.clearLocalStorage();
      }
    } catch (error) {
      console.error('Failed to clear model selection:', error);
    }
  };

  // Handle login/logout transitions
  const migrateSelection = async (fromGuest: boolean) => {
    if (fromGuest && selectedProvider && selectedModel) {
      // Migrate from localStorage to user profile
      try {
        if (user) {
          await modelPersistenceService.saveToProfile(user.id, selectedProvider, selectedModel);
          // Clear localStorage after successful migration
          modelPersistenceService.clearLocalStorage();
        }
      } catch (error) {
        console.error('Failed to migrate model selection:', error);
      }
    } else if (!fromGuest && selectedProvider && selectedModel) {
      // Migrate from user profile to localStorage (logout)
      modelPersistenceService.saveToLocalStorage(selectedProvider, selectedModel);
    }
  };

  // Check if model is available and handle unavailable models
  const validateModelAvailability = (modelId: string, availableModels: Array<{ id: string }>) => {
    if (!modelId) return true;
    
    const isAvailable = modelPersistenceService.isModelAvailable(modelId, availableModels);
    if (!isAvailable && modelId) {
      toast.warning(`Previously selected model "${modelId}" is no longer available. Please select a new model.`);
      return false;
    }
    return true;
  };

  return {
    selectedProvider,
    selectedModel,
    saveSelectedModel,
    clearSelectedModel,
    migrateSelection,
    loadSelectedModel,
    validateModelAvailability,
    isInitialized,
  };
};
