'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  isFree: boolean;
}

interface ModelContextType {
  selectedModel: string | null;
  setSelectedModel: (modelId: string) => void;
  availableModels: ModelInfo[];
  isLoading: boolean;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

const STORAGE_KEY = 'skaleflow_selected_model';

export function ModelProvider({ children }: { children: ReactNode }) {
  const [selectedModel, setSelectedModelState] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch available models on mount
  useEffect(() => {
    async function fetchModels() {
      try {
        const res = await fetch('/api/models/enabled');
        if (res.ok) {
          const data = await res.json();
          setAvailableModels(data.models || []);

          // Load selected model from localStorage or default to first model
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored && data.models?.some((m: ModelInfo) => m.id === stored)) {
            setSelectedModelState(stored);
          } else if (data.models && data.models.length > 0) {
            setSelectedModelState(data.models[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch enabled models:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchModels();
  }, []);

  const setSelectedModel = (modelId: string) => {
    setSelectedModelState(modelId);
    localStorage.setItem(STORAGE_KEY, modelId);
  };

  return (
    <ModelContext.Provider value={{ selectedModel, setSelectedModel, availableModels, isLoading }}>
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
}
