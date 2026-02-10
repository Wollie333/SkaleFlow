'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BRAND_VARIABLE_CATEGORIES,
  VARIABLE_DISPLAY_NAMES,
} from '@/lib/content-engine/brand-variable-categories';

export interface FlatBrandVariable {
  key: string;
  displayName: string;
  value: string;
  categoryKey: string;
  categoryLabel: string;
}

export interface BrandVariableCategory {
  key: string;
  label: string;
  variables: FlatBrandVariable[];
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'object') {
    return Object.entries(val as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ');
  }
  return String(val);
}

export function useBrandVariables(organizationId: string | null) {
  const [categories, setCategories] = useState<BrandVariableCategory[]>([]);
  const [flatVariables, setFlatVariables] = useState<FlatBrandVariable[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVariables = useCallback(async () => {
    if (!organizationId) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/content/brand-variables?organizationId=${organizationId}`
      );
      if (!res.ok) return;
      const data = await res.json();

      const apiCategories: Array<{
        key: string;
        label: string;
        variables: Array<{ key: string; value: unknown }>;
      }> = data.categories || [];

      const cats: BrandVariableCategory[] = [];
      const flat: FlatBrandVariable[] = [];

      for (const cat of apiCategories) {
        const catDef = BRAND_VARIABLE_CATEGORIES.find(c => c.key === cat.key);
        const catLabel = catDef?.label || cat.label;
        const catVars: FlatBrandVariable[] = [];

        for (const v of cat.variables) {
          const fv: FlatBrandVariable = {
            key: v.key,
            displayName: VARIABLE_DISPLAY_NAMES[v.key] || v.key,
            value: formatValue(v.value),
            categoryKey: cat.key,
            categoryLabel: catLabel,
          };
          catVars.push(fv);
          flat.push(fv);
        }

        if (catVars.length > 0) {
          cats.push({ key: cat.key, label: catLabel, variables: catVars });
        }
      }

      setCategories(cats);
      setFlatVariables(flat);
    } catch (err) {
      console.error('Failed to fetch brand variables:', err);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchVariables();
  }, [fetchVariables]);

  return { categories, flatVariables, isLoading };
}
