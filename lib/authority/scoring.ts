import type { AuthorityCategory, AuthorityReachTier, AuthorityEngagementType } from './types';
import { CATEGORY_CONFIG, REACH_MULTIPLIERS, ENGAGEMENT_MULTIPLIERS, BONUS_PERCENTAGES } from './constants';

interface ScoringInput {
  category: AuthorityCategory;
  reachTier: AuthorityReachTier;
  engagementType: AuthorityEngagementType;
  hasAmplification?: boolean;
  isRoundComplete?: boolean;
  hasConsistencyBonus?: boolean;
}

interface ScoringResult {
  basePoints: number;
  reachMultiplier: number;
  engagementMultiplier: number;
  amplificationBonus: number;
  roundBonus: number;
  consistencyBonus: number;
  totalPoints: number;
  description: string;
}

export function calculateActivityScore(input: ScoringInput): ScoringResult {
  const { category, reachTier, engagementType, hasAmplification, isRoundComplete, hasConsistencyBonus } = input;

  const basePoints = CATEGORY_CONFIG[category]?.basePoints ?? 10;
  const reachMultiplier = REACH_MULTIPLIERS[reachTier] ?? 1.0;
  const engagementMultiplier = ENGAGEMENT_MULTIPLIERS[engagementType] ?? 1.0;

  // Base score with multipliers
  const adjustedBase = basePoints * reachMultiplier * engagementMultiplier;

  // Bonuses (applied as percentages of adjusted base)
  const amplificationBonus = hasAmplification ? adjustedBase * BONUS_PERCENTAGES.amplification : 0;
  const roundBonus = isRoundComplete ? adjustedBase * BONUS_PERCENTAGES.round_completion : 0;
  const consistencyBonus = hasConsistencyBonus ? adjustedBase * BONUS_PERCENTAGES.consistency : 0;

  const totalPoints = Math.round((adjustedBase + amplificationBonus + roundBonus + consistencyBonus) * 100) / 100;

  const categoryLabel = CATEGORY_CONFIG[category]?.label ?? category;
  const reachLabel = reachTier.charAt(0).toUpperCase() + reachTier.slice(1);
  const engagementLabel = engagementType.charAt(0).toUpperCase() + engagementType.slice(1);
  const description = `${categoryLabel} (${reachLabel}, ${engagementLabel})`;

  return {
    basePoints,
    reachMultiplier,
    engagementMultiplier,
    amplificationBonus: Math.round(amplificationBonus * 100) / 100,
    roundBonus: Math.round(roundBonus * 100) / 100,
    consistencyBonus: Math.round(consistencyBonus * 100) / 100,
    totalPoints,
    description,
  };
}

export function getTierForPoints(points: number): { tier: number; name: string } {
  if (points >= 800) return { tier: 5, name: 'Authority' };
  if (points >= 400) return { tier: 4, name: 'Established' };
  if (points >= 150) return { tier: 3, name: 'Rising' };
  if (points >= 50)  return { tier: 2, name: 'Emerging' };
  return { tier: 1, name: 'Foundation' };
}
