import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, Badge } from '@/components/ui';
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  SparklesIcon,
  FunnelIcon,
  InboxArrowDownIcon,
  CreditCardIcon,
  ArrowRightIcon,
  ExclamationCircleIcon,
  UserGroupIcon,
  MegaphoneIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { redirect('/login'); }

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id, role, organizations(name, brand_engine_status, content_engine_enabled)')
    .eq('user_id', user.id)
    .single();

  const organization = membership?.organizations as { name: string; brand_engine_status: string; content_engine_enabled: boolean } | null;
  const orgId = membership?.organization_id;
  const orgRole = membership?.role || '';

  // Get user profile
  const { data: userData } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  const firstName = userData?.full_name?.split(' ')[0] || 'there';

  // Default stats
  let pendingApprovals = 0;
  let pipelineLeads = 0;
  let scheduledPosts = 0;
  let creditsRemaining = 0;
  let creditsTotal = 0;

  let approvalItems: Array<{
    id: string;
    topic: string | null;
    format: string;
    platforms: string[];
    scheduled_date: string;
    status: string;
    created_at: string;
  }> = [];

  let pipelineActivity: Array<{
    id: string;
    event_type: string;
    metadata: Record<string, unknown> | null;
    created_at: string;
    contact_name?: string;
  }> = [];

  let upcomingContent: Array<{
    id: string;
    scheduled_date: string;
    time_slot: string;
    topic: string | null;
    format: string;
    status: string;
    funnel_stage: string;
    platforms: string[];
  }> = [];

  let unreadNotifications = 0;
  let connectedPlatforms = 0;

  if (orgId) {
    // Parallel queries for performance
    const [
      approvalsRes,
      leadsRes,
      scheduledRes,
      creditsRes,
      approvalItemsRes,
      activityRes,
      upcomingRes,
      notifRes,
      socialRes,
    ] = await Promise.all([
      // 1. Pending approvals count
      supabase
        .from('content_items')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .in('status', ['pending_review', 'revision_requested']),

      // 2. Pipeline leads count
      supabase
        .from('pipeline_contacts')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),

      // 3. Scheduled posts count
      supabase
        .from('content_items')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('status', 'scheduled'),

      // 4. Credits
      supabase
        .from('credit_balances')
        .select('monthly_credits_remaining, monthly_credits_total, topup_credits_remaining')
        .eq('organization_id', orgId)
        .single(),

      // 5. Approval items (recent 5)
      supabase
        .from('content_items')
        .select('id, topic, format, platforms, scheduled_date, status, created_at')
        .eq('organization_id', orgId)
        .in('status', ['pending_review', 'revision_requested'])
        .order('created_at', { ascending: false })
        .limit(5),

      // 6. Pipeline activity (recent 5)
      supabase
        .from('pipeline_activity')
        .select('id, event_type, metadata, created_at')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(5),

      // 7. Upcoming content (next 5 scheduled)
      supabase
        .from('content_items')
        .select('id, scheduled_date, time_slot, topic, format, status, funnel_stage, platforms')
        .eq('organization_id', orgId)
        .gte('scheduled_date', new Date().toISOString().split('T')[0])
        .in('status', ['scheduled', 'approved', 'edited', 'designed'])
        .order('scheduled_date')
        .limit(5),

      // 8. Unread notifications
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false),

      // 9. Connected social platforms
      supabase
        .from('social_media_connections')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('is_active', true),
    ]);

    pendingApprovals = approvalsRes.count || 0;
    pipelineLeads = leadsRes.count || 0;
    scheduledPosts = scheduledRes.count || 0;
    unreadNotifications = notifRes.count || 0;
    connectedPlatforms = socialRes.count || 0;

    if (creditsRes.data) {
      creditsRemaining = (creditsRes.data.monthly_credits_remaining || 0) + (creditsRes.data.topup_credits_remaining || 0);
      creditsTotal = creditsRes.data.monthly_credits_total || 0;
    }

    approvalItems = (approvalItemsRes.data || []) as typeof approvalItems;
    upcomingContent = (upcomingRes.data || []) as typeof upcomingContent;

    // Enrich pipeline activity with contact names
    const rawActivity = (activityRes.data || []) as Array<{
      id: string;
      event_type: string;
      metadata: Record<string, unknown> | null;
      created_at: string;
    }>;

    pipelineActivity = rawActivity.map(a => ({
      ...a,
      contact_name: (a.metadata?.contact_name as string) || 'Contact',
    }));
  }

  const isSuperAdmin = userData?.role === 'super_admin';

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-dark text-cream">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }} />
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-teal/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-gold/8 blur-3xl" />

        <div className="relative px-8 py-10 md:px-12 md:py-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-lg">
              <div className="inline-flex items-center gap-2 bg-cream/10 text-cream/70 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-4">
                <SparklesIcon className="w-4 h-4" />
                Dashboard
              </div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-3">
                Welcome back, {firstName}
              </h1>
              <p className="text-cream/60 text-base leading-relaxed">
                {organization?.name ? `Managing ${organization.name}` : "Here's what's happening with your content"}
              </p>
            </div>

            {/* Key stats in hero */}
            <div className="flex gap-6 md:gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-gold">{pendingApprovals}</div>
                <div className="text-xs text-cream/40 uppercase tracking-wider mt-1">Approvals</div>
              </div>
              <div className="w-px bg-cream/10" />
              <div className="text-center">
                <div className="text-3xl font-bold text-gold">{pipelineLeads}</div>
                <div className="text-xs text-cream/40 uppercase tracking-wider mt-1">Leads</div>
              </div>
              <div className="w-px bg-cream/10" />
              <div className="text-center">
                <div className="text-3xl font-bold text-gold">{scheduledPosts}</div>
                <div className="text-xs text-cream/40 uppercase tracking-wider mt-1">Scheduled</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/content/reviews">
          <Card className={`hover:border-teal/30 transition-colors cursor-pointer ${pendingApprovals > 0 ? 'border-teal/20 bg-teal/[0.02]' : 'bg-cream-warm border-stone/10'}`}>
            <div className="flex items-center justify-between mb-3">
              <InboxArrowDownIcon className="w-5 h-5 text-teal" />
              {pendingApprovals > 0 && (
                <span className="text-xs bg-teal/15 text-teal px-2 py-0.5 rounded-full font-semibold">Action needed</span>
              )}
            </div>
            <p className="text-3xl font-bold text-charcoal">{pendingApprovals}</p>
            <p className="text-sm text-stone">Pending approvals</p>
          </Card>
        </Link>

        <Link href="/pipeline">
          <Card className="bg-cream-warm border-stone/10 hover:border-teal/30 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <FunnelIcon className="w-5 h-5 text-teal" />
            </div>
            <p className="text-3xl font-bold text-charcoal">{pipelineLeads}</p>
            <p className="text-sm text-stone">Pipeline leads</p>
          </Card>
        </Link>

        <Link href="/calendar">
          <Card className="bg-cream-warm border-stone/10 hover:border-teal/30 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <CalendarIcon className="w-5 h-5 text-teal" />
            </div>
            <p className="text-3xl font-bold text-charcoal">{scheduledPosts}</p>
            <p className="text-sm text-stone">Scheduled posts</p>
          </Card>
        </Link>

        <Link href="/billing">
          <Card className={`hover:border-teal/30 transition-colors cursor-pointer ${creditsTotal > 0 && creditsRemaining < creditsTotal * 0.1 ? 'border-gold/30 bg-gold/5' : 'bg-cream-warm border-stone/10'}`}>
            <div className="flex items-center justify-between mb-3">
              <CreditCardIcon className="w-5 h-5 text-teal" />
              {creditsTotal > 0 && creditsRemaining < creditsTotal * 0.1 && (
                <span className="text-xs bg-gold/15 text-gold px-2 py-0.5 rounded-full font-semibold">Low</span>
              )}
            </div>
            <p className="text-3xl font-bold text-charcoal">
              {isSuperAdmin ? '\u221e' : creditsRemaining.toLocaleString()}
            </p>
            <p className="text-sm text-stone">Credits remaining</p>
          </Card>
        </Link>
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Approvals — left 2/3 */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-heading-md text-charcoal">Content Approvals</h3>
                {pendingApprovals > 0 && (
                  <span className="text-xs bg-teal/15 text-teal px-2 py-0.5 rounded-full font-semibold">
                    {pendingApprovals}
                  </span>
                )}
              </div>
              <Link href="/content/reviews" className="text-sm text-teal hover:text-teal-light font-medium flex items-center gap-1">
                View all <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
            <CardContent>
              {approvalItems.length > 0 ? (
                <div className="space-y-3">
                  {approvalItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/content/reviews`}
                      className="flex items-center gap-4 p-3 rounded-lg bg-cream-warm hover:bg-cream transition-colors"
                    >
                      <div className="flex-shrink-0">
                        {item.status === 'revision_requested' ? (
                          <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center">
                            <ExclamationCircleIcon className="w-5 h-5 text-gold" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-teal/10 flex items-center justify-center">
                            <ClockIcon className="w-5 h-5 text-teal" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-charcoal truncate">
                          {item.topic || item.format.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-stone">
                          {item.format.replace(/_/g, ' ')} &bull; {item.platforms?.join(', ') || 'No platform'}
                        </p>
                      </div>
                      <Badge variant={item.status === 'revision_requested' ? 'consideration' : 'awareness'}>
                        {item.status === 'revision_requested' ? 'Revision' : 'Review'}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-stone">
                  <CheckCircleIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium text-charcoal/60">All caught up</p>
                  <p className="text-sm mt-1">No content waiting for review</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Activity — right 1/3 */}
        <div>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-heading-md text-charcoal">Pipeline</h3>
              <Link href="/pipeline" className="text-sm text-teal hover:text-teal-light font-medium flex items-center gap-1">
                Open <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
            <CardContent>
              {pipelineActivity.length > 0 ? (
                <div className="space-y-3">
                  {pipelineActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-2"
                    >
                      <div className="w-2 h-2 rounded-full bg-teal mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-charcoal">
                          <span className="font-medium">{activity.contact_name}</span>
                          {' '}
                          <span className="text-stone">
                            {formatEventType(activity.event_type)}
                          </span>
                        </p>
                        <p className="text-xs text-stone/70 mt-0.5">
                          {formatTimeAgo(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-stone">
                  <FunnelIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium text-charcoal/60">No activity yet</p>
                  <Link href="/pipeline" className="text-sm text-teal hover:text-teal-light mt-2 inline-block">
                    Create a pipeline
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Content — left 2/3 */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-heading-md text-charcoal">Upcoming Content</h3>
              <Link href="/calendar" className="text-sm text-teal hover:text-teal-light font-medium flex items-center gap-1">
                View calendar <ArrowRightIcon className="w-3.5 h-3.5" />
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
                          {item.time_slot} &bull; {item.format.replace(/_/g, ' ')} &bull; {item.platforms?.join(', ') || 'No platform'}
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
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium text-charcoal/60">No upcoming content</p>
                  <Link href="/calendar" className="text-sm text-teal hover:text-teal-light mt-2 inline-block">
                    Create your first calendar
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions — right 1/3 */}
        <div>
          <Card>
            <h3 className="text-heading-md text-charcoal mb-4">Quick Actions</h3>
            <CardContent>
              <div className="space-y-2">
                <QuickAction
                  href="/content/create"
                  icon={SparklesIcon}
                  label="Create Content"
                  description="Generate AI-powered posts"
                />
                <QuickAction
                  href="/analytics"
                  icon={MegaphoneIcon}
                  label="View Analytics"
                  description="Check content performance"
                />
                <QuickAction
                  href="/pipeline"
                  icon={UserGroupIcon}
                  label="Manage Leads"
                  description="View your sales pipeline"
                />
                <QuickAction
                  href="/brand"
                  icon={SparklesIcon}
                  label="Brand Engine"
                  description="Refine your brand strategy"
                />
              </div>
            </CardContent>
          </Card>

          {/* Connected platforms */}
          <Card className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-charcoal">Connected Platforms</h3>
              <Link href="/settings" className="text-xs text-teal hover:text-teal-light font-medium">
                Manage
              </Link>
            </div>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-charcoal">{connectedPlatforms}</div>
                <p className="text-sm text-stone">
                  {connectedPlatforms === 0
                    ? 'No accounts connected'
                    : `social account${connectedPlatforms !== 1 ? 's' : ''} active`}
                </p>
              </div>
              {connectedPlatforms === 0 && (
                <Link href="/settings" className="text-sm text-teal hover:text-teal-light mt-2 inline-block">
                  Connect your first account
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-cream-warm transition-colors group"
    >
      <div className="w-9 h-9 rounded-lg bg-teal/10 flex items-center justify-center flex-shrink-0 group-hover:bg-teal/15 transition-colors">
        <Icon className="w-4.5 h-4.5 text-teal" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-charcoal">{label}</p>
        <p className="text-xs text-stone">{description}</p>
      </div>
      <ArrowRightIcon className="w-3.5 h-3.5 text-stone/30 group-hover:text-teal transition-colors" />
    </Link>
  );
}

function formatEventType(type: string): string {
  const map: Record<string, string> = {
    contact_created: 'was added',
    stage_changed: 'moved stage',
    tag_added: 'was tagged',
    tag_removed: 'tag removed',
    email_sent: 'was emailed',
    note_added: 'note added',
  };
  return map[type] || type.replace(/_/g, ' ');
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return format(date, 'MMM d');
}
