import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getAdAccountTokens } from '@/lib/marketing/auth';
import { MetaAdsAdapter } from '@/lib/marketing/platforms/meta-ads';
import type { AdPlatform, AdPlatformAdapter, CustomerListData } from '@/lib/marketing/types';
import { createHash } from 'crypto';

function getAdapter(platform: AdPlatform): AdPlatformAdapter {
  switch (platform) {
    case 'meta':
      return new MetaAdsAdapter();
    default:
      throw new Error(`Platform adapter not yet implemented: ${platform}`);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Get audience
  const { data: audience, error: fetchError } = await supabase
    .from('ad_audiences')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !audience) {
    return NextResponse.json({ error: 'Audience not found' }, { status: 404 });
  }

  // Verify admin/owner
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', audience.organization_id)
    .eq('user_id', user.id)
    .single();

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Only owners and admins can sync audiences' }, { status: 403 });
  }

  // Get ad account tokens
  const platform = audience.platform as AdPlatform;
  const accountData = await getAdAccountTokens(audience.organization_id, platform);
  if (!accountData) {
    return NextResponse.json({ error: `No active ${platform} ad account connected` }, { status: 400 });
  }

  const adapter = getAdapter(platform);
  const { tokens } = accountData;
  const serviceClient = createServiceClient();

  try {
    // Get pipeline contacts if source pipeline is configured
    let contacts: CustomerListData[] = [];

    if (audience.source_pipeline_id) {
      let contactQuery = serviceClient
        .from('pipeline_contacts')
        .select('id, email, phone, first_name, last_name, stage_id, pipeline_contact_tags(tag_id)')
        .eq('pipeline_id', audience.source_pipeline_id);

      const { data: pipelineContacts } = await contactQuery;

      if (pipelineContacts) {
        // Filter by stage if specified
        const stageIds: string[] = audience.source_stage_ids || [];
        const tagIds: string[] = audience.source_tag_ids || [];

        let filtered = pipelineContacts;

        if (stageIds.length > 0) {
          filtered = filtered.filter((c: any) => stageIds.includes(c.stage_id));
        }

        if (tagIds.length > 0) {
          filtered = filtered.filter((c: any) => {
            const contactTagIds = (c.pipeline_contact_tags || []).map((t: any) => t.tag_id);
            return tagIds.some(tid => contactTagIds.includes(tid));
          });
        }

        contacts = filtered
          .filter((c: any) => c.email || c.phone)
          .map((c: any) => ({
            email: c.email || undefined,
            phone: c.phone || undefined,
            firstName: c.first_name || undefined,
            lastName: c.last_name || undefined,
          }));
      }
    }

    if (contacts.length === 0) {
      return NextResponse.json({
        error: 'No contacts found matching the audience criteria. Add contacts to your pipeline or adjust filters.',
      }, { status: 400 });
    }

    // Create custom audience on platform if it doesn't exist yet
    if (!audience.platform_audience_id) {
      const createResult = await adapter.createCustomAudience(tokens, {
        name: audience.name,
        description: audience.description || undefined,
        audienceType: audience.audience_type as 'custom' | 'lookalike',
        customerFileSource: 'USER_PROVIDED_ONLY',
      });

      if (!createResult.success) {
        return NextResponse.json({
          error: `Failed to create audience on ${platform}: ${createResult.error}`,
        }, { status: 500 });
      }

      // Store the platform audience ID
      await serviceClient
        .from('ad_audiences')
        .update({ platform_audience_id: createResult.platformId })
        .eq('id', id);

      audience.platform_audience_id = createResult.platformId!;
    }

    // Upload contacts to the audience (already hashed by the adapter)
    await adapter.addUsersToAudience(tokens, audience.platform_audience_id, contacts);

    // Update audience metadata
    await serviceClient
      .from('ad_audiences')
      .update({
        size: contacts.length,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    return NextResponse.json({
      success: true,
      contactsSynced: contacts.length,
      platformAudienceId: audience.platform_audience_id,
    });
  } catch (err) {
    console.error('Audience sync error:', err);
    const message = err instanceof Error ? err.message : 'Sync failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
