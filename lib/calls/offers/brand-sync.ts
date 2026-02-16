import { createServiceClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

interface OfferData {
  id: string;
  name: string;
  description: string | null;
  price_display: string | null;
  billing_frequency: string | null;
  deliverables: Json;
  value_propositions: Json;
  common_objections: Json;
}

/**
 * Sync an offer's data to brand_outputs for AI consumption.
 * Uses the offer ID as part of the variable key to support multiple offers.
 */
export async function syncOfferToBrandEngine(offer: OfferData, orgId: string): Promise<void> {
  const supabase = createServiceClient();

  // Find the index of this offer in the org's offer list
  const { data: allOffers } = await supabase
    .from('offers')
    .select('id')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('sort_order')
    .order('created_at');

  const index = allOffers?.findIndex(o => o.id === offer.id) ?? 0;

  // Find phase 4 for this org (Growth Engine / Offer)
  const { data: phase } = await supabase
    .from('brand_phases')
    .select('id')
    .eq('organization_id', orgId)
    .eq('phase_number', 4)
    .single();

  const phaseId = phase?.id || null;

  const variables: Record<string, string> = {
    [`offer_${index + 1}_name`]: offer.name,
    [`offer_${index + 1}_description`]: offer.description || '',
    [`offer_${index + 1}_pricing`]: [offer.price_display, offer.billing_frequency].filter(Boolean).join(' / '),
    [`offer_${index + 1}_deliverables`]: Array.isArray(offer.deliverables) ? (offer.deliverables as string[]).join(', ') : JSON.stringify(offer.deliverables),
    [`offer_${index + 1}_value_props`]: JSON.stringify(offer.value_propositions),
    [`offer_${index + 1}_objections`]: JSON.stringify(offer.common_objections),
  };

  for (const [key, value] of Object.entries(variables)) {
    // Upsert brand_outputs
    const { data: existing } = await supabase
      .from('brand_outputs')
      .select('id')
      .eq('organization_id', orgId)
      .eq('variable_key', key)
      .single();

    if (existing) {
      await supabase
        .from('brand_outputs')
        .update({ value, is_locked: true, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('brand_outputs')
        .insert({
          organization_id: orgId,
          phase_id: phaseId,
          variable_key: key,
          value,
          is_locked: true,
        });
    }
  }

  console.log(`[BrandSync] Synced offer "${offer.name}" as offer_${index + 1} to brand_outputs`);
}
