/**
 * useFeatureAccess Hook
 *
 * Client-side hook to check feature access.
 * Fetches from /api/feature-access and caches the result.
 */

import { useEffect, useState } from 'react';
import type { Feature } from '@/lib/feature-gates';

interface FeatureAccess {
  brand_engine: boolean;
  content_engine: boolean;
  analytics: boolean;
  team: boolean;
  pipeline: boolean;
  ad_campaigns: boolean;
}

interface TierInfo {
  name: string;
  slug: string;
  monthlyCredits: number;
}

interface FeatureAccessResponse {
  features: FeatureAccess;
  tier: TierInfo | null;
  userId?: string;
  orgId?: string;
}

/**
 * Hook to get all feature access for current user
 */
export function useFeatureAccess() {
  const [data, setData] = useState<FeatureAccessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAccess() {
      try {
        const res = await fetch('/api/feature-access');
        if (!res.ok) {
          throw new Error('Failed to fetch feature access');
        }
        const data = await res.json();
        setData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAccess();
  }, []);

  return {
    features: data?.features || null,
    tier: data?.tier || null,
    loading,
    error,
  };
}

/**
 * Hook to check access to a specific feature
 */
export function useHasFeature(feature: Feature) {
  const { features, loading } = useFeatureAccess();

  return {
    hasAccess: features?.[feature] || false,
    loading,
  };
}

/**
 * Hook to check if user is on beta tier
 */
export function useIsBetaTier() {
  const { tier, loading } = useFeatureAccess();

  return {
    isBeta: tier?.slug === 'beta',
    tier,
    loading,
  };
}
