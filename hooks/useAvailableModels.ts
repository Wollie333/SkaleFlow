'use client';

import { useState, useEffect } from 'react';
import type { ClientModelOption } from '@/lib/ai/client-models';

export function useAvailableModels(feature?: string) {
  const [models, setModels] = useState<ClientModelOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchModels() {
      try {
        const params = feature ? `?feature=${encodeURIComponent(feature)}` : '';
        const res = await fetch(`/api/models/available${params}`);
        if (!res.ok) throw new Error('Failed to fetch models');
        const data = await res.json();
        if (!cancelled) {
          setModels(data.models || []);
        }
      } catch (error) {
        console.error('useAvailableModels error:', error);
        if (!cancelled) {
          setModels([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchModels();

    return () => {
      cancelled = true;
    };
  }, [feature]);

  return { models, isLoading };
}
