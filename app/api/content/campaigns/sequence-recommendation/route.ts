import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CAMPAIGN_OBJECTIVES, type CampaignObjectiveId } from '@/config/campaign-objectives';

// GET — AI sequence recommendation based on brand maturity + completed campaigns
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get completed campaigns
    const { data: completedCampaigns } = await supabase
      .from('campaigns')
      .select('objective, status')
      .eq('organization_id', organizationId)
      .eq('status', 'completed')
      .order('updated_at', { ascending: false });

    // Get active campaigns
    const { data: activeCampaigns } = await supabase
      .from('campaigns')
      .select('objective, status')
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    const completedObjectives = (completedCampaigns || []).map(c => c.objective);
    const activeObjectives = (activeCampaigns || []).map(c => c.objective);

    let recommendation: {
      nextObjective: CampaignObjectiveId;
      reasoning: string;
      sequence: CampaignObjectiveId[];
    };

    if (completedObjectives.length === 0 && activeObjectives.length === 0) {
      // Brand new — start with awareness
      recommendation = {
        nextObjective: 'awareness',
        reasoning: 'You have no previous campaigns. Start with an Awareness campaign to build your audience base, then move to Authority to establish expertise, then Leads to convert.',
        sequence: ['awareness', 'authority', 'leads'],
      };
    } else {
      // Find the last completed campaign's recommended next
      const lastObjective = completedObjectives[0] as CampaignObjectiveId;
      const config = CAMPAIGN_OBJECTIVES[lastObjective];
      const nextOptions = config?.sequenceNext || ['awareness'];

      // Filter out objectives that are currently active
      const available = nextOptions.filter(o => !activeObjectives.includes(o));
      const next = (available[0] || nextOptions[0]) as CampaignObjectiveId;
      const nextConfig = CAMPAIGN_OBJECTIVES[next];

      recommendation = {
        nextObjective: next,
        reasoning: `Your last campaign was ${config?.name || lastObjective}. Based on that, I recommend a ${nextConfig?.name || next} campaign next. ${nextConfig?.description || ''}`,
        sequence: [next, ...(nextConfig?.sequenceNext || []).slice(0, 2)] as CampaignObjectiveId[],
      };
    }

    return NextResponse.json({ recommendation });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
