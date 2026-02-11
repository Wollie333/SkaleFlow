/**
 * Client-safe utility functions for AI credit calculations and formatting.
 * These functions have no dependencies on server-only code.
 */

// ZAR/USD exchange rate approximation (updated periodically)
const ZAR_PER_USD = 18.0;
// Markup multiplier: 2x actual cost (100% markup)
export const MARKUP = 2.0;

/**
 * Convert credits to USD for transparent pricing display.
 * 1 credit = 1 ZAR cent = 0.01 ZAR
 * USD = credits * 0.01 / ZAR_PER_USD
 *
 * This shows the SALES PRICE (what users pay at 2x markup).
 */
export function creditsToUSD(credits: number): number {
  if (credits === 0) return 0;
  return credits / (ZAR_PER_USD * 100);
}

/**
 * Format credits to USD string with $ symbol.
 * Examples: 75 credits = "$0.04", 1000 credits = "$0.56"
 *
 * This shows the SALES PRICE (what users pay at 2x markup).
 */
export function formatCreditsToUSD(credits: number): string {
  const usd = creditsToUSD(credits);
  if (usd < 0.01) return '<$0.01';
  return `$${usd.toFixed(2)}`;
}

/**
 * Convert credits to ACTUAL API cost (before markup).
 * This is what you actually pay to the AI providers.
 *
 * Formula:
 * - Credits represent 2x marked-up cost
 * - Real cost = credits / 2 / (ZAR_PER_USD * 100)
 *
 * Example: 100 credits = $0.056 sales price, but only $0.028 actual API cost
 */
export function creditsToRealCost(credits: number): number {
  if (credits === 0) return 0;
  return credits / (ZAR_PER_USD * 100 * MARKUP);
}

/**
 * Format credits to real API cost string.
 * Shows what you ACTUALLY pay to AI providers (before markup).
 */
export function formatCreditsToRealCost(credits: number): string {
  const realCost = creditsToRealCost(credits);
  if (realCost < 0.01) return '<$0.01';
  return `$${realCost.toFixed(4)}`;
}

/**
 * Calculate the profit margin (revenue - cost) for a given credit amount.
 *
 * Example: 1800 credits
 * - Sales revenue: $1.00
 * - Real API cost: $0.50
 * - Profit: $0.50 (100% markup)
 */
export function calculateProfitFromCredits(credits: number): number {
  const salesRevenue = creditsToUSD(credits);
  const realCost = creditsToRealCost(credits);
  return salesRevenue - realCost;
}

/**
 * Format profit margin as string.
 */
export function formatProfitFromCredits(credits: number): string {
  const profit = calculateProfitFromCredits(credits);
  if (profit < 0.01) return '<$0.01';
  return `$${profit.toFixed(2)}`;
}

/**
 * Calculate sales revenue from actual API cost.
 * This is what users will pay for a given API cost (with markup applied).
 *
 * Example: $10 API cost → $20 sales revenue (2x markup)
 */
export function apiCostToSalesRevenue(apiCostUSD: number): number {
  return apiCostUSD * MARKUP;
}

/**
 * Format API cost to sales revenue string.
 */
export function formatSalesRevenue(apiCostUSD: number): string {
  const revenue = apiCostToSalesRevenue(apiCostUSD);
  return `$${revenue.toFixed(2)}`;
}
