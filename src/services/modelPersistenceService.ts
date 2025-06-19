
import { supabase } from '@/integrations/supabase/client';

interface ModelSelection {
  provider: string;
  model: string;
}

class ModelPersistenceService {
  // Save model selection to user profile
  async saveToProfile(userId: string, provider: string, model: string): Promise<void> {
    const modelSelection: ModelSelection = { provider, model };
    
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        model_selection: modelSelection,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to save model selection to profile:', error);
      throw error;
    }
  }

  // Load model selection from user profile
  async loadFromProfile(userId: string): Promise<ModelSelection | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('model_selection')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to load model selection from profile:', error);
        return null;
      }

      return (data as any)?.model_selection as ModelSelection | null;
    } catch (error) {
      console.error('Error loading model selection:', error);
      return null;
    }
  }

  // Save model selection to localStorage
  saveToLocalStorage(provider: string, model: string): void {
    try {
      localStorage.setItem('selectedProvider', provider);
      localStorage.setItem('selectedModel', model);
    } catch (error) {
      console.error('Failed to save model selection to localStorage:', error);
    }
  }

  // Load model selection from localStorage
  loadFromLocalStorage(): ModelSelection | null {
    try {
      const provider = localStorage.getItem('selectedProvider');
      const model = localStorage.getItem('selectedModel');

      if (provider && model) {
        return { provider, model };
      }
      return null;
    } catch (error) {
      console.error('Failed to load model selection from localStorage:', error);
      return null;
    }
  }

  // Clear model selection from localStorage
  clearLocalStorage(): void {
    try {
      localStorage.removeItem('selectedProvider');
      localStorage.removeItem('selectedModel');
    } catch (error) {
      console.error('Failed to clear model selection from localStorage:', error);
    }
  }

  // Check if a model is still available in the provider's model list
  isModelAvailable(modelId: string, availableModels: Array<{ id: string }>): boolean {
    return availableModels.some(model => model.id === modelId);
  }
}

export const modelPersistenceService = new ModelPersistenceService();
