
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

interface ModelSelection {
  provider: string;
  model: string;
}

export const useModelSelection = () => {
  const { user, isGuest } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');

  // Load initial selection on mount
  useEffect(() => {
    loadSelectedModel();
  }, [user, isGuest, profile]);

  const loadSelectedModel = () => {
    if (user && profile) {
      // Load from user profile
      const savedSelection = (profile as any).model_selection as ModelSelection | null;
      if (savedSelection) {
        setSelectedProvider(savedSelection.provider);
        setSelectedModel(savedSelection.model);
      }
    } else {
      // Load from localStorage for guests or non-logged-in users
      const savedProvider = localStorage.getItem('selectedProvider');
      const savedModel = localStorage.getItem('selectedModel');
      if (savedProvider && savedModel) {
        setSelectedProvider(savedProvider);
        setSelectedModel(savedModel);
      }
    }
  };

  const saveSelectedModel = (provider: string, model: string) => {
    setSelectedProvider(provider);
    setSelectedModel(model);

    if (user && profile) {
      // Save to user profile
      const modelSelection: ModelSelection = { provider, model };
      updateProfile({ model_selection: modelSelection } as any);
    } else {
      // Save to localStorage for guests or non-logged-in users
      localStorage.setItem('selectedProvider', provider);
      localStorage.setItem('selectedModel', model);
    }
  };

  const clearSelectedModel = () => {
    setSelectedProvider('');
    setSelectedModel('');

    if (user && profile) {
      updateProfile({ model_selection: null } as any);
    } else {
      localStorage.removeItem('selectedProvider');
      localStorage.removeItem('selectedModel');
    }
  };

  // Handle login/logout transitions
  const migrateSelection = (fromGuest: boolean) => {
    if (fromGuest && selectedProvider && selectedModel) {
      // Migrate from localStorage to user profile
      const modelSelection: ModelSelection = { 
        provider: selectedProvider, 
        model: selectedModel 
      };
      updateProfile({ model_selection: modelSelection } as any);
      
      // Clear localStorage after migration
      localStorage.removeItem('selectedProvider');
      localStorage.removeItem('selectedModel');
    } else if (!fromGuest) {
      // Migrate from user profile to localStorage (logout)
      if ((profile as any)?.model_selection) {
        const selection = (profile as any).model_selection as ModelSelection;
        localStorage.setItem('selectedProvider', selection.provider);
        localStorage.setItem('selectedModel', selection.model);
      }
    }
  };

  return {
    selectedProvider,
    selectedModel,
    saveSelectedModel,
    clearSelectedModel,
    migrateSelection,
    loadSelectedModel,
  };
};
