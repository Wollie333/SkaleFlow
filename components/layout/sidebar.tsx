'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  HomeIcon,
  SparklesIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  UsersIcon,
  UserGroupIcon,
  FunnelIcon,
  LockClosedIcon,
  VideoCameraIcon,
  ChartBarIcon,
  PencilSquareIcon,
  CalendarDaysIcon,
  InboxArrowDownIcon,
  CreditCardIcon,
  MegaphoneIcon,
  RocketLaunchIcon,
  PhotoIcon,
  CurrencyDollarIcon,
  ClipboardDocumentCheckIcon,
  EyeIcon,
  DocumentTextIcon,
  BoltIcon,
  InboxIcon,
  ChatBubbleLeftIcon,
  EnvelopeIcon,
  AtSymbolIcon,
  MicrophoneIcon,
  HashtagIcon,
  FolderIcon,
  ChatBubbleLeftRightIcon,
  TrophyIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  NewspaperIcon,
  GlobeAltIcon,
  BuildingOfficeIcon,
  CubeIcon,
  ShareIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';

interface FeaturePermissions {
  access?: boolean;
  chat?: boolean;
  edit_variables?: boolean;
  create?: boolean;
  edit?: boolean;
  schedule?: boolean;
  publish?: boolean;
  manage_contacts?: boolean;
  send_emails?: boolean;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  disabled?: boolean;
}

const marketingNavigation: NavItem[] = [
  { name: 'Ads Dashboard', href: '/marketing', icon: MegaphoneIcon },
  { name: 'Campaigns', href: '/marketing/campaigns', icon: RocketLaunchIcon },
  { name: 'Audiences', href: '/marketing/audiences', icon: UserGroupIcon },
  { name: 'Creative Library', href: '/marketing/creative-library', icon: PhotoIcon },
];

const salesNavigation: NavItem[] = [
  { name: 'Pipeline', href: '/pipeline', icon: FunnelIcon },
];

const crmNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/crm', icon: HomeIcon },
  { name: 'Contacts', href: '/crm/contacts', icon: UsersIcon },
  { name: 'Companies', href: '/crm/companies', icon: BuildingOfficeIcon },
  { name: 'Deals', href: '/crm/deals', icon: CurrencyDollarIcon },
  { name: 'Pipeline', href: '/pipeline', icon: FunnelIcon },
  { name: 'Products', href: '/crm/products', icon: CubeIcon },
  { name: 'Invoices', href: '/crm/invoices', icon: DocumentTextIcon },
];

const crmAdminNavigation: NavItem[] = [
  { name: 'Meetings', href: '/crm/meetings', icon: CalendarDaysIcon },
];

const contentNavigation: NavItem[] = [
  { name: 'Campaigns', href: '/content/campaigns', icon: RocketLaunchIcon },
  { name: 'Winner Pool', href: '/content/campaigns/winners', icon: TrophyIcon },
  { name: 'Content Calendar', href: '/calendar', icon: CalendarDaysIcon },
  { name: 'Content Machine', href: '/content/machine', icon: BoltIcon },
  { name: 'Publish Log', href: '/content/publish-log', icon: ClipboardDocumentCheckIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Create Post', href: '/content/create', icon: PencilSquareIcon },
];

// Social Media Management navigation structure
const socialPublishingNav: NavItem[] = [
  { name: 'Calendar', href: '/calendar', icon: CalendarDaysIcon },
  { name: 'Create Post', href: '/content/create', icon: PencilSquareIcon },
  { name: 'Drafts', href: '/content/drafts', icon: DocumentTextIcon },
  { name: 'Publish Log', href: '/content/publish-log', icon: ClipboardDocumentCheckIcon },
];

const socialInboxNav: NavItem[] = [
  { name: 'All Messages', href: '/social/inbox', icon: InboxIcon },
  { name: 'Comments', href: '/social/inbox?type=comment', icon: ChatBubbleLeftIcon },
  { name: 'Direct Messages', href: '/social/inbox?type=dm', icon: EnvelopeIcon },
  { name: 'Mentions', href: '/social/inbox?type=mention', icon: AtSymbolIcon },
];

const socialListeningNav: NavItem[] = [
  { name: 'Brand Mentions', href: '/social/listening', icon: MicrophoneIcon },
  { name: 'Trends', href: '/social/listening/trends', icon: HashtagIcon },
  { name: 'Reports', href: '/social/listening/reports', icon: DocumentTextIcon },
];

const socialAnalyticsNav: NavItem[] = [
  { name: 'Overview', href: '/social/analytics', icon: ChartBarIcon },
  { name: 'Post Performance', href: '/social/analytics/posts', icon: ClipboardDocumentCheckIcon },
  { name: 'Audience Insights', href: '/social/analytics/audience', icon: UserGroupIcon },
  { name: 'Benchmarks', href: '/social/analytics/benchmarks', icon: TrophyIcon },
];

const socialLibraryNav: NavItem[] = [
  { name: 'Hashtag Vault', href: '/social/library/hashtags', icon: HashtagIcon },
  { name: 'Saved Replies', href: '/social/library/replies', icon: ChatBubbleLeftRightIcon },
  { name: 'Media Library', href: '/social/library/media', icon: PhotoIcon },
  { name: 'Competitors', href: '/social/library/competitors', icon: UsersIcon },
];

const brandAuditNavigation: NavItem[] = [
  { name: 'All Audits', href: '/brand-audit', icon: ClipboardDocumentCheckIcon },
  { name: 'Drafts', href: '/brand-audit?status=draft', icon: DocumentTextIcon },
];

const callsNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/calls', icon: VideoCameraIcon },
  { name: 'Templates', href: '/calls/templates', icon: DocumentTextIcon },
  { name: 'Offers', href: '/calls/offers', icon: CurrencyDollarIcon },
  { name: 'Recordings', href: '/calls/recordings', icon: MicrophoneIcon },
  { name: 'Insights', href: '/calls/insights', icon: EyeIcon },
];

const authorityNavigation: NavItem[] = [
  { name: 'Pipeline', href: '/authority', icon: NewspaperIcon },
  { name: 'PR Directory', href: '/authority/directory', icon: BookOpenIcon },
  { name: 'My Contacts', href: '/authority/contacts', icon: UsersIcon },
  { name: 'Press Kit', href: '/authority/press-kit', icon: DocumentTextIcon },
  { name: 'Press Releases', href: '/authority/press-releases', icon: DocumentTextIcon },
  { name: 'PR Calendar', href: '/authority/calendar', icon: CalendarDaysIcon },
  { name: 'Newsroom', href: '/authority/newsroom', icon: GlobeAltIcon },
  { name: 'Settings', href: '/authority/settings', icon: Cog6ToothIcon },
];

const adminNavigation: NavItem[] = [
  { name: 'Users', href: '/admin/users', icon: UsersIcon },
  { name: 'AI Models', href: '/admin/models', icon: SparklesIcon },
  { name: 'Costs', href: '/admin/costs', icon: CurrencyDollarIcon },
  { name: 'Templates', href: '/admin/templates', icon: DocumentTextIcon },
];

interface SidebarProps {
  brandProgress?: {
    currentPhase?: string;
    completedPhases?: number;
    totalPhases?: number;
  };
  contentStats?: {
    pending?: number;
  };
  userRole?: string;
  orgRole?: string | null;
  tierName?: string;
  upcomingCallCount?: number;
  contentEngineEnabled?: boolean;
  notificationCount?: number;
  pendingReviewCount?: number;
  teamPermissions?: Record<string, FeaturePermissions>;
  className?: string;
}

export function Sidebar({
  brandProgress,
  contentStats,
  userRole,
  orgRole,
  tierName,
  upcomingCallCount,
  contentEngineEnabled,
  notificationCount,
  pendingReviewCount,
  teamPermissions = {},
  className,
}: SidebarProps) {
  const pathname = usePathname();

  // Auto-expand sections based on current pathname
  const isSocialPath = pathname.startsWith('/social/') || pathname.startsWith('/calendar') || pathname.startsWith('/content/');
  const isAnalyticsPath = pathname.startsWith('/social/analytics') || pathname === '/analytics';

  const [publishingExpanded, setPublishingExpanded] = useState(isSocialPath);
  const [inboxExpanded, setInboxExpanded] = useState(pathname.startsWith('/social/inbox'));
  const [listeningExpanded, setListeningExpanded] = useState(pathname.startsWith('/social/listening'));
  const [analyticsExpanded, setAnalyticsExpanded] = useState(isAnalyticsPath);
  const [libraryExpanded, setLibraryExpanded] = useState(pathname.startsWith('/social/library'));
  const [authorityExpanded, setAuthorityExpanded] = useState(pathname.startsWith('/authority'));
  const [socialEngineExpanded, setSocialEngineExpanded] = useState(isSocialPath);
  const [adsEngineExpanded, setAdsEngineExpanded] = useState(pathname.startsWith('/marketing'));
  const [brandAuditExpanded, setBrandAuditExpanded] = useState(pathname.startsWith('/brand-audit'));
  const [callsExpanded, setCallsExpanded] = useState(pathname.startsWith('/calls'));
  const [crmExpanded, setCrmExpanded] = useState(pathname.startsWith('/crm') || pathname.startsWith('/pipeline'));
  const [adminExpanded, setAdminExpanded] = useState(pathname.startsWith('/admin'));

  // Expand relevant sections on navigation
  useEffect(() => {
    const social = pathname.startsWith('/social/') || pathname.startsWith('/calendar') || pathname.startsWith('/content/');
    if (social) {
      setSocialEngineExpanded(true);
      if (pathname.startsWith('/calendar') || pathname.startsWith('/content/create') || pathname.startsWith('/content/drafts') || pathname.startsWith('/content/publish-log')) setPublishingExpanded(true);
      if (pathname.startsWith('/social/inbox')) setInboxExpanded(true);
      if (pathname.startsWith('/social/listening')) setListeningExpanded(true);
      if (pathname.startsWith('/social/analytics') || pathname === '/analytics') setAnalyticsExpanded(true);
      if (pathname.startsWith('/social/library')) setLibraryExpanded(true);
    }
    if (pathname.startsWith('/marketing')) setAdsEngineExpanded(true);
    if (pathname.startsWith('/brand-audit')) setBrandAuditExpanded(true);
    if (pathname.startsWith('/calls')) setCallsExpanded(true);
    if (pathname.startsWith('/crm') || pathname.startsWith('/pipeline')) setCrmExpanded(true);
    if (pathname.startsWith('/admin')) setAdminExpanded(true);
    if (pathname.startsWith('/authority')) setAuthorityExpanded(true);
  }, [pathname]);

  const isOwnerOrAdmin = orgRole === 'owner' || orgRole === 'admin';
  const isSuperAdmin = userRole === 'super_admin';

  // Permission helpers
  const canAccessBrandEngine = isSuperAdmin || isOwnerOrAdmin || teamPermissions?.brand_engine?.access === true;
  const canAccessContentEngine = isSuperAdmin || isOwnerOrAdmin || (contentEngineEnabled && teamPermissions?.content_engine?.access === true);
  const canAccessTeam = isSuperAdmin || isOwnerOrAdmin;
  const canAccessBilling = isSuperAdmin || isOwnerOrAdmin;
  const canAccessReviews = isSuperAdmin || isOwnerOrAdmin;

  // Build base navigation dynamically
  const baseNavItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  ];

  if (canAccessTeam) {
    baseNavItems.push({ name: 'My Team', href: '/team', icon: UserGroupIcon });
  }

  // SkaleFlow Engines
  const engineItems: NavItem[] = [];
  if (canAccessBrandEngine) {
    engineItems.push({ name: 'Brand Engine', href: '/brand', icon: SparklesIcon });
  }
  if (canAccessBrandEngine) {
    engineItems.push({ name: 'Presence Engine', href: '/presence', icon: GlobeAltIcon });
  }
  if (canAccessContentEngine) {
    engineItems.push({ name: 'Content Engine', href: '/content/machine', icon: BoltIcon });
  }
  if (isOwnerOrAdmin || isSuperAdmin) {
    engineItems.push({ name: 'Ads Engine', href: '/marketing', icon: MegaphoneIcon });
  }
  if (isOwnerOrAdmin || isSuperAdmin) {
    engineItems.push({ name: 'Authority Engine', href: '/authority', icon: NewspaperIcon });
  }
  // Social Engine moved to its own expandable section (like Ads Engine)

  // Total pending reviews = change_requests + content pending_review notifications
  const totalPendingReviews = (pendingReviewCount || 0);

  return (
    <aside className={cn("fixed left-0 top-16 bottom-0 w-60 bg-cream-warm border-r border-stone/10 flex flex-col", className)}>
      <nav className="flex-1 p-4 overflow-y-auto sidebar-scroll">
        {/* User Role / Tier Badge */}
        {userRole && (
          <div className="mb-4 px-3 py-2">
            {userRole === 'client' && tierName ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-teal/15 text-teal">
                {tierName}
              </span>
            ) : (
              <span className={cn(
                'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider',
                isSuperAdmin
                  ? 'bg-gold/15 text-gold'
                  : 'bg-teal/15 text-teal'
              )}>
                {isSuperAdmin ? 'Super Admin' : orgRole === 'owner' ? 'Owner' : orgRole === 'admin' ? 'Admin' : orgRole === 'member' ? 'Member' : orgRole === 'viewer' ? 'Viewer' : 'Team Member'}
              </span>
            )}
          </div>
        )}

        <div className="space-y-1">
          {baseNavItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-teal/10 text-teal'
                    : 'text-stone hover:bg-cream hover:text-charcoal active:scale-[0.97] active:bg-teal/5'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Reviews — hidden for now (future feature) */}

        {/* SkaleFlow Engines */}
        {engineItems.length > 0 && (
          <div className="mt-6">
            <h4 className="px-3 text-xs font-semibold text-teal-dark dark:text-gold uppercase tracking-wider mb-2">
              SkaleFlow Engines
            </h4>
            <div className="space-y-1">
              {engineItems.map((item) => {
                const isAuthority = item.name === 'Authority Engine';
                const isAdsEngine = item.name === 'Ads Engine';
                const isActive = isAuthority
                  ? pathname === '/authority' || pathname.startsWith('/authority')
                  : isAdsEngine
                  ? pathname === '/marketing' || pathname.startsWith('/marketing')
                  : pathname === item.href || pathname.startsWith(item.href);

                if (isAdsEngine) {
                  // Ads Engine — collapsible with sub-nav (same style as Authority)
                  return (
                    <div key={item.name}>
                      <div className="flex items-center">
                        <Link
                          href={item.href}
                          className={cn(
                            'flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                            isActive
                              ? 'bg-teal/10 text-teal'
                              : 'text-stone hover:bg-cream hover:text-charcoal active:scale-[0.97] active:bg-teal/5'
                          )}
                        >
                          <item.icon className="w-5 h-5" />
                          {item.name}
                          {!isSuperAdmin && <LockClosedIcon className="w-3.5 h-3.5 text-stone/40" />}
                        </Link>
                        <button
                          onClick={() => setAdsEngineExpanded(!adsEngineExpanded)}
                          className="p-1.5 text-stone hover:text-charcoal transition-colors rounded"
                        >
                          {adsEngineExpanded ? (
                            <ChevronDownIcon className="w-4 h-4" />
                          ) : (
                            <ChevronRightIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {adsEngineExpanded && (
                        <div className="space-y-1 mt-1">
                          {isSuperAdmin ? (
                            marketingNavigation.map((sub) => {
                              const subActive = sub.href === '/marketing'
                                ? pathname === '/marketing'
                                : pathname.startsWith(sub.href);
                              return (
                                <Link
                                  key={sub.name}
                                  href={sub.href}
                                  className={cn(
                                    'flex items-center gap-3 px-3 py-2 ml-6 rounded-lg text-sm font-medium transition-colors',
                                    subActive
                                      ? 'bg-teal/10 text-teal'
                                      : 'text-stone hover:bg-cream hover:text-charcoal'
                                  )}
                                >
                                  <sub.icon className="w-4 h-4" />
                                  {sub.name}
                                </Link>
                              );
                            })
                          ) : (
                            marketingNavigation.map((sub) => (
                              <div
                                key={sub.name}
                                className="flex items-center gap-3 px-3 py-2 ml-6 rounded-lg text-sm font-medium text-stone/40 cursor-not-allowed"
                              >
                                <sub.icon className="w-4 h-4" />
                                {sub.name}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                if (isAuthority) {
                  // Authority Engine — collapsible with sub-nav
                  return (
                    <div key={item.name}>
                      <div className="flex items-center">
                        <Link
                          href={item.href}
                          className={cn(
                            'flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                            isActive
                              ? 'bg-teal/10 text-teal'
                              : 'text-stone hover:bg-cream hover:text-charcoal active:scale-[0.97] active:bg-teal/5'
                          )}
                        >
                          <item.icon className="w-5 h-5" />
                          {item.name}
                        </Link>
                        <button
                          onClick={() => setAuthorityExpanded(!authorityExpanded)}
                          className="p-1.5 text-stone hover:text-charcoal transition-colors rounded"
                        >
                          {authorityExpanded ? (
                            <ChevronDownIcon className="w-4 h-4" />
                          ) : (
                            <ChevronRightIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {authorityExpanded && (
                        <div className="space-y-1 mt-1">
                          {authorityNavigation.map((sub) => {
                            const subActive = sub.href === '/authority'
                              ? pathname === '/authority'
                              : pathname.startsWith(sub.href);
                            return (
                              <Link
                                key={sub.name}
                                href={sub.href}
                                className={cn(
                                  'flex items-center gap-3 px-3 py-2 ml-6 rounded-lg text-sm font-medium transition-colors',
                                  subActive
                                    ? 'bg-teal/10 text-teal'
                                    : 'text-stone hover:bg-cream hover:text-charcoal'
                                )}
                              >
                                <sub.icon className="w-4 h-4" />
                                {sub.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-teal/10 text-teal'
                        : 'text-stone hover:bg-cream hover:text-charcoal active:scale-[0.97] active:bg-teal/5'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Social Engine — hidden for now (future feature) */}

        {/* CRM — hidden for now (future feature) */}
        {/* Brand Audit — hidden for now (future feature) */}
        {/* Calls — hidden for now (future feature) */}

        {/* Admin Navigation */}
        {isSuperAdmin && (
          <div className="mt-6">
            <h4 className="px-3 text-xs font-semibold text-teal-dark dark:text-gold uppercase tracking-wider mb-2">
              Admin
            </h4>
            <div className="space-y-1">
              {adminNavigation.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 ml-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-teal/10 text-teal'
                        : 'text-stone hover:bg-cream hover:text-charcoal'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </nav>

      {/* Bottom navigation */}
      <div className="p-4 border-t border-stone/10">
        <div className="space-y-1">
          {canAccessBilling && (
            <Link
              href="/billing"
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === '/billing'
                  ? 'bg-teal/10 text-teal'
                  : 'text-stone hover:bg-cream hover:text-charcoal'
              )}
            >
              <CreditCardIcon className="w-5 h-5" />
              Billing
            </Link>
          )}
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname === '/settings'
                ? 'bg-teal/10 text-teal'
                : 'text-stone hover:bg-cream hover:text-charcoal'
            )}
          >
            <Cog6ToothIcon className="w-5 h-5" />
            Settings
          </Link>
          <Link
            href="/help"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname === '/help'
                ? 'bg-teal/10 text-teal'
                : 'text-stone hover:bg-cream hover:text-charcoal'
            )}
          >
            <QuestionMarkCircleIcon className="w-5 h-5" />
            Help
          </Link>
        </div>
      </div>
    </aside>
  );
}
