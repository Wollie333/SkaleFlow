import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { PRESENCE_PHASE_TEMPLATES, isPhaseConditionallySkipped } from '@/config/presence-phases';
import { PLATFORM_CONFIGS } from '@/config/platform-configs';
import type { PlatformKey } from '@/types/presence';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: platforms } = await supabase
      .from('presence_platforms')
      .select('*')
      .eq('organization_id', organizationId)
      .order('priority_order');

    return NextResponse.json({ platforms: platforms || [] });
  } catch (error) {
    logger.error('Presence platforms GET error', { error: String(error) });
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { organizationId, action } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (action === 'activate') {
      const { platforms } = body as { platforms: Array<{ key: PlatformKey; isActive: boolean; goal?: string; priority: number }>, organizationId: string, action: string };

      // Upsert all platform records
      for (const p of platforms) {
        await supabase
          .from('presence_platforms')
          .upsert(
            {
              organization_id: organizationId,
              platform_key: p.key,
              is_active: p.isActive,
              primary_goal: p.goal || null,
              priority_order: p.priority,
            },
            { onConflict: 'organization_id,platform_key' }
          );
      }

      // Update presence phase statuses based on active platforms
      const activePlatformKeys = platforms.filter(p => p.isActive).map(p => p.key);
      await updatePhaseSkipStatuses(organizationId, activePlatformKeys);

      return NextResponse.json({ success: true });
    }

    if (action === 'reorder') {
      const { order } = body as { order: Array<{ key: PlatformKey; priority: number }>, organizationId: string, action: string };

      for (const item of order) {
        await supabase
          .from('presence_platforms')
          .update({ priority_order: item.priority })
          .eq('organization_id', organizationId)
          .eq('platform_key', item.key);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    logger.error('Presence platforms POST error', { error: String(error) });
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

async function updatePhaseSkipStatuses(organizationId: string, activePlatforms: string[]) {
  const serviceClient = createServiceClient();

  // Ensure all 7 phases exist for this org
  const { data: existingPhases } = await serviceClient
    .from('presence_phases')
    .select('phase_number')
    .eq('organization_id', organizationId);

  const existingNumbers = new Set((existingPhases || []).map(p => p.phase_number));

  for (const [num, template] of Object.entries(PRESENCE_PHASE_TEMPLATES)) {
    if (!existingNumbers.has(num)) {
      await serviceClient
        .from('presence_phases')
        .insert({
          organization_id: organizationId,
          phase_number: num,
          phase_name: template.name,
          platform_key: template.platformKey,
          is_conditional: template.isConditional,
          status: 'not_started',
          sort_order: parseInt(num),
        });
    }
  }

  // Update skip statuses for conditional phases
  for (const [num, template] of Object.entries(PRESENCE_PHASE_TEMPLATES)) {
    if (!template.isConditional) continue;

    const shouldSkip = isPhaseConditionallySkipped(num, activePlatforms);

    // Only update if phase hasn't been started yet
    const { data: phase } = await serviceClient
      .from('presence_phases')
      .select('status')
      .eq('organization_id', organizationId)
      .eq('phase_number', num)
      .single();

    if (phase && (phase.status === 'not_started' || phase.status === 'skipped')) {
      await serviceClient
        .from('presence_phases')
        .update({
          status: shouldSkip ? 'skipped' : 'not_started',
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', organizationId)
        .eq('phase_number', num);
    }
  }
}