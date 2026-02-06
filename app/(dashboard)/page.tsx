import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, Badge } from '@/components/ui';
import { CalendarIcon, ClockIcon, CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Get user's organization
  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id, organizations(name, brand_engine_status, content_engine_enabled)')
    .eq('user_id', user!.id)
    .single();

  const organization = membership?.organizations as { name: string; brand_engine_status: string; content_engine_enabled: boolean } | null;
  const orgId = membership?.organization_id;

  // Get stats
  let stats = {
    thisWeek: 0,
    pending: 0,
    scheduled: 0,
    published: 0,
  };

  let upcomingContent: Array<{
    id: string;
    scheduled_date: string;
    time_slot: string;
    topic: string | null;
    format: string;
    status: string;
    funnel_stage: string;
  }> = [];

  let brandPhases: Array<{
    phase_number: string;
    phase_name: string;
    status: string;
  }> = [];

  if (orgId) {
    // Get content stats
    const { data: items } = await supabase
      .from('content_items')
      .select('status, scheduled_date')
      .eq('organization_id', orgId);

    if (items) {
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      stats = {
        thisWeek: items.filter(i => {
          const date = new Date(i.scheduled_date);
          return date >= weekStart && date <= weekEnd;
        }).length,
        pending: items.filter(i => ['idea', 'scripted'].includes(i.status)).length,
        scheduled: items.filter(i => i.status === 'scheduled').length,
        published: items.filter(i => i.status === 'published').length,
      };
    }

    // Get upcoming content
    const { data: upcoming } = await supabase
      .from('content_items')
      .select('id, scheduled_date, time_slot, topic, format, status, funnel_stage')
      .eq('organization_id', orgId)
      .gte('scheduled_date', new Date().toISOString().split('T')[0])
      .order('scheduled_date')
      .limit(5);

    upcomingContent = upcoming || [];

    // Get brand phases
    const { data: phases } = await supabase
      .from('brand_phases')
      .select('phase_number, phase_name, status')
      .eq('organization_id', orgId)
      .order('sort_order')
      .limit(5);

    brandPhases = phases || [];
  }

  const { data: userData } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user!.id)
    .single();

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-display-md text-charcoal">
          Welcome back, {userData?.full_name?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-body-lg text-stone mt-1">
          {organization?.name ? `Managing ${organization.name}` : 'Here\'s what\'s happening with your content'}
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="This Week"
          value={stats.thisWeek}
          subtitle="content pieces"
          icon={CalendarIcon}
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          subtitle="need action"
          icon={ClockIcon}
          variant="warning"
        />
        <StatCard
          title="Scheduled"
          value={stats.scheduled}
          subtitle="ready to publish"
          icon={SparklesIcon}
          variant="success"
        />
        <StatCard
          title="Published"
          value={stats.published}
          subtitle="this month"
          icon={CheckCircleIcon}
          variant="primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Content */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-heading-md text-charcoal">Upcoming Content</h3>
              <Link href="/calendar" className="text-sm text-teal hover:text-teal-light font-medium">
                View Calendar →
              </Link>
            </div>
            <CardContent>
              {upcomingContent.length > 0 ? (
                <div className="space-y-3">
                  {upcomingContent.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-cream-warm hover:bg-cream transition-colors"
                    >
                      <div className="flex-shrink-0 w-12 text-center">
                        <p className="text-xs text-stone">
                          {format(new Date(item.scheduled_date), 'MMM')}
                        </p>
                        <p className="text-lg font-bold text-charcoal">
                          {format(new Date(item.scheduled_date), 'd')}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-charcoal truncate">
                          {item.topic || item.format.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-stone">
                          {item.time_slot} • {item.format.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <Badge variant={item.funnel_stage as 'awareness' | 'consideration' | 'conversion'}>
                        {item.funnel_stage}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-stone">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No upcoming content</p>
                  <Link href="/calendar" className="text-sm text-teal hover:text-teal-light mt-2 inline-block">
                    Create your first calendar
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Brand Engine Progress */}
        <div>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-heading-md text-charcoal">Brand Engine</h3>
              <Link href="/brand" className="text-sm text-teal hover:text-teal-light font-medium">
                Continue →
              </Link>
            </div>
            <CardContent>
              {brandPhases.length > 0 ? (
                <div className="space-y-2">
                  {brandPhases.map((phase) => (
                    <div
                      key={phase.phase_number}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        phase.status === 'in_progress'
                          ? 'bg-teal/10 border border-teal/20'
                          : phase.status === 'locked' || phase.status === 'completed'
                          ? 'bg-cream-warm'
                          : 'opacity-50'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          phase.status === 'locked' || phase.status === 'completed'
                            ? 'bg-teal text-cream'
                            : phase.status === 'in_progress'
                            ? 'bg-teal/20 text-teal ring-2 ring-teal'
                            : 'bg-stone/20 text-stone'
                        }`}
                      >
                        {phase.status === 'locked' || phase.status === 'completed' ? '✓' : phase.phase_number}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          phase.status === 'in_progress' ? 'text-teal' : 'text-charcoal'
                        }`}>
                          Phase {phase.phase_number}
                        </p>
                        <p className="text-xs text-stone">{phase.phase_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-stone">
                  <SparklesIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Start building your brand</p>
                  <Link href="/brand" className="text-sm text-teal hover:text-teal-light mt-2 inline-block">
                    Begin Brand Engine
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'primary' | 'success' | 'warning';
}) {
  const variantStyles = {
    default: 'bg-white border-stone/10',
    primary: 'bg-teal/5 border-teal/20',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
  };

  return (
    <Card className={variantStyles[variant]}>
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-5 h-5 text-stone" />
      </div>
      <p className="text-3xl font-bold text-charcoal">{value}</p>
      <p className="text-sm text-stone">{subtitle}</p>
    </Card>
  );
}
