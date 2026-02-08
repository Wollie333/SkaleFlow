'use client';

import { useState, useEffect, useCallback } from 'react';

interface ModelPreference {
  feature: string;
  provider: string;
  model: string;
}

export function useModelPreference(organizationId: string | null, feature: string) {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;

    async function load() {
      try {
        const response = await fetch(`/api/billing/model-preferences?organizationId=${organizationId}`);
        if (response.ok) {
          const { preferences } = await response.json();
          const pref = preferences?.find((p: ModelPreference) => p.feature === feature);
          if (pref) {
            setSelectedModel(pref.model);
          }
        }
      } catch (error) {
        console.error('Failed to load model preference:', error);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [organizationId, feature]);

  const updatePreference = useCallback(async (modelId: string) => {
    if (!organizationId) return;

    setSelectedModel(modelId);

    try {
      await fetch('/api/billing/model-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, feature, modelId }),
      });
    } catch (error) {
      console.error('Failed to update model preference:', error);
    }
  }, [organizationId, feature]);

  return { selectedModel, isLoading, updatePreference };
}
