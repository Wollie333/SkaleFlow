'use client';

import { useState, useEffect } from 'react';

type ModelStatus = 'active' | 'offline';

export function useModelStatus() {
  const [statuses, setStatuses] = useState<Record<string, ModelStatus>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStatuses() {
      try {
        const response = await fetch('/api/ai/status');
        if (response.ok) {
          const data = await response.json();
          setStatuses(data.statuses);
        }
      } catch (error) {
        console.error('Failed to fetch model statuses:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStatuses();
  }, []);

  return { statuses, isLoading };
}
