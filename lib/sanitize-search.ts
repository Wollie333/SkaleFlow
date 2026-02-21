/**
 * Sanitize a user-provided search string for use in Supabase PostgREST .or() filters.
 * Strips characters that could break out of ilike patterns: commas, periods, parentheses, backticks.
 */
export function sanitizeSearch(input: string): string {
  return input.replace(/[,.()`\\]/g, '');
}
