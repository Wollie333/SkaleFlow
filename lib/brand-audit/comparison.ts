/**
 * Brand Audit comparison — generates before/after analysis for re-audits.
 */

import { createServiceClient } from '@/lib/supabase/server';
import { CATEGORY_ORDER, CATEGORY_LABELS } from './types';
import type { BrandAuditCategory } from '@/types/database';

export interface CategoryComparison {
  category: BrandAuditCategory;
  label: string;
  previousScore: number;
  currentScore: number;
  change: number;
  previousRating: string;
  currentRating: string;
  improved: boolean;
}

export async function generateComparison(
  currentAuditId: string,
  previousAuditId: string
): Promise<{
  categories: CategoryComparison[];
  overallPrevious: number;
  overallCurrent: number;
  overallChange: number;
}> {
  const supabase = createServiceClient();

  const [{ data: currentScores }, { data: previousScores }] = await Promise.all([
    supabase.from('brand_audit_scores').select('category, score, rating').eq('audit_id', currentAuditId),
    supabase.from('brand_audit_scores').select('category, score, rating').eq('audit_id', previousAuditId),
  ]);

  const currentMap = new Map((currentScores || []).map((s) => [s.category, s]));
  const previousMap = new Map((previousScores || []).map((s) => [s.category, s]));

  const categories: CategoryComparison[] = CATEGORY_ORDER.map((cat) => {
    const current = currentMap.get(cat);
    const previous = previousMap.get(cat);
    const currentScore = current?.score || 0;
    const previousScore = previous?.score || 0;
    return {
      category: cat,
      label: CATEGORY_LABELS[cat],
      previousScore,
      currentScore,
      change: currentScore - previousScore,
      previousRating: previous?.rating || 'red',
      currentRating: current?.rating || 'red',
      improved: currentScore > previousScore,
    };
  });

  const [{ data: currentAudit }, { data: previousAudit }] = await Promise.all([
    supabase.from('brand_audits').select('overall_score').eq('id', currentAuditId).single(),
    supabase.from('brand_audits').select('overall_score').eq('id', previousAuditId).single(),
  ]);

  const overallCurrent = currentAudit?.overall_score || 0;
  const overallPrevious = previousAudit?.overall_score || 0;

  // Store comparison data on the current audit
  await supabase
    .from('brand_audits')
    .update({
      comparison_data: { categories, overallPrevious, overallCurrent, overallChange: overallCurrent - overallPrevious } as unknown as import('@/types/database').Json,
    })
    .eq('id', currentAuditId);

  return {
    categories,
    overallPrevious,
    overallCurrent,
    overallChange: overallCurrent - overallPrevious,
  };
}
