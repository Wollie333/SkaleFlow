import { NextResponse } from 'next/server';
import { checkCredits, estimateCreditCost } from './credits';
import { getModelConfig } from './providers/registry';

/**
 * Pre-flight credit check. Returns a 402 response if insufficient credits,
 * or null if the request can proceed.
 *
 * For free models, always returns null (proceed).
 * Super admins always get null (proceed).
 */
export async function requireCredits(
  orgId: string,
  modelId: string,
  estInputTokens: number,
  estOutputTokens: number,
  userId?: string | null
): Promise<NextResponse | null> {
  const config = getModelConfig(modelId);

  // Free models skip credit checks entirely
  if (!config || config.isFree) {
    return null;
  }

  const estimatedCredits = estimateCreditCost(modelId, estInputTokens, estOutputTokens);
  const balance = await checkCredits(orgId, estimatedCredits, userId);

  if (!balance.hasCredits) {
    return NextResponse.json(
      {
        error: 'Insufficient credits',
        creditsRequired: estimatedCredits,
        creditsAvailable: balance.totalRemaining,
        monthlyRemaining: balance.monthlyRemaining,
        topupRemaining: balance.topupRemaining,
        periodEnd: balance.periodEnd,
      },
      { status: 402 }
    );
  }

  return null; // proceed
}
