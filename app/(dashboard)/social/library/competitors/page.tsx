import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CompetitorManagementClient } from './competitor-management-client';

export const metadata = {
  title: 'Competitor Tracking - SkaleFlow',
  description: 'Track and compare competitor performance across social media platforms',
};

export default async function CompetitorManagementPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's organization
  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership?.organization_id) {
    redirect('/dashboard');
  }

  const organizationId = membership.organization_id;

  // Fetch competitors
  const { data: competitors, error: competitorsError } = await supabase
    .from('competitors')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  // Fetch recent metrics for each competitor
  const competitorIds = (competitors || []).map((c) => c.id);
  const { data: recentMetrics } = competitorIds.length > 0
    ? await supabase
        .from('competitor_metrics')
        .select('*')
        .in('competitor_id', competitorIds)
        .order('metric_date', { ascending: false })
    : { data: [] };

  // Group metrics by competitor
  const metricsMap = (recentMetrics || []).reduce((acc: any, metric: any) => {
    if (!acc[metric.competitor_id]) {
      acc[metric.competitor_id] = [];
    }
    acc[metric.competitor_id].push(metric);
    return acc;
  }, {});

  // Attach metrics to competitors
  const competitorsWithMetrics = (competitors || []).map((competitor) => ({
    ...competitor,
    metrics: metricsMap[competitor.id] || [],
  }));

  return (
    <CompetitorManagementClient
      initialCompetitors={competitorsWithMetrics}
      organizationId={organizationId}
    />
  );
}
