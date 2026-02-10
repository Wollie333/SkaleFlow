'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface CreditBalance {
  monthlyRemaining: number;
  monthlyTotal: number;
  topupRemaining: number;
  totalRemaining: number;
  periodEnd: string | null;
  hasCredits: boolean;
  isSuperAdmin?: boolean;
  apiCostUSD30d?: number;
  apiCostUSDAllTime?: number;
}

export function useCreditBalance(organizationId: string | null) {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    if (!organizationId) return;

    try {
      const response = await fetch(`/api/billing/credits?organizationId=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setBalance(data);
      }
    } catch (error) {
      console.error('Failed to fetch credit balance:', error);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchBalance();
    // Poll every 30s so the header stays current as AI calls deduct credits
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [fetchBalance]);

  return { balance, isLoading, refetch: fetchBalance };
}
