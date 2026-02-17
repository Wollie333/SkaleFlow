import { createServiceClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

/**
 * Sync Phase 4 brand outputs → offers table.
 * Called when Phase 4 is locked (last question saved).
 * Uses service client directly (NOT the API route) to prevent sync loops.
 */
export async function syncBrandToOffers(organizationId: string): Promise<void> {
  const supabase = createServiceClient();

  // Fetch all Phase 4 offer_* brand outputs for this org
  const { data: outputs } = await supabase
    .from('brand_outputs')
    .select('output_key, output_value')
    .eq('organization_id', organizationId)
    .like('output_key', 'offer_%');

  if (!outputs || outputs.length === 0) {
    console.log('[BrandToOffers] No offer brand outputs found, skipping sync');
    return;
  }

  // Build a lookup map
  const vars: Record<string, string> = {};
  for (const o of outputs) {
    vars[o.output_key] = o.output_value || '';
  }

  // Required field — skip sync if offer has no name
  const offerName = vars['offer_name'];
  if (!offerName) {
    console.log('[BrandToOffers] No offer_name found, skipping sync');
    return;
  }

  // Build description from tagline + problem + outcome
  const descriptionParts = [
    vars['offer_tagline'],
    vars['offer_problem'] ? `Problem: ${vars['offer_problem']}` : '',
    vars['offer_outcome'] ? `Outcome: ${vars['offer_outcome']}` : '',
  ].filter(Boolean);
  const description = descriptionParts.join('\n\n') || null;

  // Parse deliverables from offer_inclusions (may be YAML list or comma-separated)
  const deliverables = parseToArray(vars['offer_inclusions']);

  // Build value propositions from transformation + outcome
  const valueProps: string[] = [];
  if (vars['offer_transformation_before'] && vars['offer_transformation_after']) {
    valueProps.push(`From: ${vars['offer_transformation_before']} → To: ${vars['offer_transformation_after']}`);
  }
  if (vars['offer_outcome']) {
    valueProps.push(vars['offer_outcome']);
  }

  // Parse objections — expect structured YAML/JSON with {objection, response} pairs
  const objections = parseObjections(vars['offer_objections']);

  // Build the offer payload
  const offerData: Record<string, unknown> = {
    organization_id: organizationId,
    name: offerName,
    description,
    tier: vars['offer_tier'] || null,
    price_display: vars['offer_price_display'] || null,
    billing_frequency: vars['offer_billing_frequency'] || null,
    deliverables: deliverables as unknown as Json,
    value_propositions: valueProps as unknown as Json,
    common_objections: objections as unknown as Json,
    source: 'brand_engine',
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  // Check if a brand_engine offer already exists for this org
  const { data: existing } = await supabase
    .from('offers')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('source', 'brand_engine')
    .single();

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('offers')
      .update(offerData)
      .eq('id', existing.id);

    if (error) {
      console.error('[BrandToOffers] Update failed:', error.message);
      throw error;
    }
    console.log(`[BrandToOffers] Updated existing offer "${offerName}" (${existing.id})`);
  } else {
    // Create new
    const { error } = await supabase
      .from('offers')
      .insert(offerData);

    if (error) {
      console.error('[BrandToOffers] Insert failed:', error.message);
      throw error;
    }
    console.log(`[BrandToOffers] Created new brand-synced offer "${offerName}"`);
  }
}

/**
 * Parse a brand output value into an array of strings.
 * Handles YAML lists, comma-separated, and newline-separated formats.
 */
function parseToArray(value: string | undefined): string[] {
  if (!value) return [];

  // Try JSON array first
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // Not JSON, continue
  }

  // YAML-style list (lines starting with "- ")
  const yamlLines = value.split('\n').filter(l => l.trim().startsWith('- '));
  if (yamlLines.length > 0) {
    return yamlLines.map(l => l.trim().replace(/^- /, ''));
  }

  // Comma-separated
  if (value.includes(',')) {
    return value.split(',').map(s => s.trim()).filter(Boolean);
  }

  // Newline-separated
  return value.split('\n').map(s => s.trim()).filter(Boolean);
}

/**
 * Parse objections from brand output value.
 * Expects structured format with objection/response pairs.
 */
function parseObjections(value: string | undefined): Array<{ objection: string; response: string }> {
  if (!value) return [];

  // Try JSON first
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map(item => ({
        objection: item.objection || item.concern || String(item),
        response: item.response || item.answer || '',
      }));
    }
  } catch {
    // Not JSON, try YAML-style parsing
  }

  // Simple YAML-style: look for objection:/response: pairs
  const results: Array<{ objection: string; response: string }> = [];
  const lines = value.split('\n');
  let currentObjection = '';

  for (const line of lines) {
    const trimmed = line.trim();
    const objMatch = trimmed.match(/^(?:objection|concern|question)\s*[:]\s*(.+)/i);
    const respMatch = trimmed.match(/^(?:response|answer|reply)\s*[:]\s*(.+)/i);

    if (objMatch) {
      currentObjection = objMatch[1].replace(/^["']|["']$/g, '');
    } else if (respMatch && currentObjection) {
      results.push({
        objection: currentObjection,
        response: respMatch[1].replace(/^["']|["']$/g, ''),
      });
      currentObjection = '';
    }
  }

  return results;
}
