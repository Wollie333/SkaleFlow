'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
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
  { name: 'Applications', href: '/crm/applications', icon: ClipboardDocumentCheckIcon },
  { name: 'Meetings', href: '/crm/meetings', icon: CalendarDaysIcon },
];

const contentNavigation: NavItem[] = [
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

const callsNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/calls', icon: VideoCameraIcon },
  { name: 'Templates', href: '/calls/templates', icon: DocumentTextIcon },
  { name: 'Offers', href: '/calls/offers', icon: CurrencyDollarIcon },
  { name: 'Recordings', href: '/calls/recordings', icon: MicrophoneIcon },
  { name: 'Insights', href: '/calls/insights', icon: EyeIcon },
];

const authorityNavigation: NavItem[] = [
  { name: 'Pipeline', href: '/authority', icon: NewspaperIcon },
  { name: 'Contacts', href: '/authority/contacts', icon: UsersIcon },
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
  pipelineCount?: number;
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
  pipelineCount,
  upcomingCallCount,
  contentEngineEnabled,
  notificationCount,
  pendingReviewCount,
  teamPermissions = {},
  className,
}: SidebarProps) {
  const pathname = usePathname();

  // Collapsible section state
  const [publishingExpanded, setPublishingExpanded] = useState(true);
  const [inboxExpanded, setInboxExpanded] = useState(false);
  const [listeningExpanded, setListeningExpanded] = useState(false);
  const [analyticsExpanded, setAnalyticsExpanded] = useState(false);
  const [libraryExpanded, setLibraryExpanded] = useState(false);
  const [authorityExpanded, setAuthorityExpanded] = useState(false);
  const [socialEngineExpanded, setSocialEngineExpanded] = useState(false);
  const [adsEngineExpanded, setAdsEngineExpanded] = useState(false);
  const [callsExpanded, setCallsExpanded] = useState(false);
  const [crmExpanded, setCrmExpanded] = useState(false);
  const [adminExpanded, setAdminExpanded] = useState(false);

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
  if (canAccessContentEngine) {
    engineItems.push({ name: 'Content Engine', href: '/content/machine', icon: BoltIcon });
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
                    : 'text-stone hover:bg-cream-warm hover:text-charcoal active:scale-[0.97] active:bg-teal/5'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Reviews — owner/admin only */}
        {canAccessReviews && (
          <div className="mt-4">
            <div className="space-y-1">
              <Link
                href="/reviews"
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  pathname.startsWith('/reviews')
                    ? 'bg-teal/10 text-teal'
                    : 'text-stone hover:bg-cream-warm hover:text-charcoal active:scale-[0.97] active:bg-teal/5'
                )}
              >
                <EyeIcon className="w-5 h-5" />
                Reviews
                {totalPendingReviews > 0 && (
                  <span className="ml-auto text-xs bg-gold/15 text-gold px-2 py-0.5 rounded-full font-semibold">
                    {totalPendingReviews}
                  </span>
                )}
              </Link>
            </div>
          </div>
        )}

        {/* SkaleFlow Engines */}
        {engineItems.length > 0 && (
          <div className="mt-6">
            <h4 className="px-3 text-xs font-semibold text-teal-dark uppercase tracking-wider mb-2">
              SkaleFlow Engines
            </h4>
            <div className="space-y-1">
              {engineItems.map((item) => {
                const isAuthority = item.name === 'Authority Engine';
                const isActive = isAuthority
                  ? pathname === '/authority' || pathname.startsWith('/authority')
                  : pathname === item.href || pathname.startsWith(item.href);

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
                              : 'text-stone hover:bg-cream-warm hover:text-charcoal active:scale-[0.97] active:bg-teal/5'
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
                                    : 'text-stone hover:bg-cream-warm hover:text-charcoal'
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
                        : 'text-stone hover:bg-cream-warm hover:text-charcoal active:scale-[0.97] active:bg-teal/5'
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

        {/* Social Engine Section */}
        <div className="mt-6">
          <div className="flex items-center">
            <button
              onClick={() => setSocialEngineExpanded(!socialEngineExpanded)}
              className="flex-1 flex items-center justify-between px-3 py-1 group"
            >
              <h4 className="text-xs font-semibold text-teal-dark uppercase tracking-wider flex items-center gap-2">
                Social Engine
              </h4>
              {socialEngineExpanded ? (
                <ChevronDownIcon className="w-4 h-4 text-stone group-hover:text-charcoal transition-colors" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-stone group-hover:text-charcoal transition-colors" />
              )}
            </button>
          </div>
          {socialEngineExpanded && (
            <div className="space-y-1 mt-2">
              {/* Publishing */}
              <div>
                <button
                  onClick={() => setPublishingExpanded(!publishingExpanded)}
                  className="w-full flex items-center gap-3 px-3 py-2 ml-2 text-sm font-medium text-stone hover:text-charcoal transition-colors"
                >
                  <CalendarDaysIcon className="w-4 h-4" />
                  <span className="flex-1 text-left">Publishing</span>
                  {publishingExpanded ? (
                    <ChevronDownIcon className="w-4 h-4" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4" />
                  )}
                </button>
                {publishingExpanded && (
                  <div className="space-y-1 mt-1">
                    {socialPublishingNav.map((navItem) => {
                      const navActive = pathname === navItem.href || pathname.startsWith(navItem.href);
                      return (
                        <Link
                          key={navItem.name}
                          href={navItem.href}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 ml-8 rounded-lg text-sm font-medium transition-colors',
                            navActive
                              ? 'bg-teal/10 text-teal'
                              : 'text-stone hover:bg-cream-warm hover:text-charcoal'
                          )}
                        >
                          <navItem.icon className="w-4 h-4" />
                          {navItem.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Inbox */}
              <div>
                <button
                  onClick={() => setInboxExpanded(!inboxExpanded)}
                  className="w-full flex items-center gap-3 px-3 py-2 ml-2 text-sm font-medium text-stone hover:text-charcoal transition-colors"
                >
                  <InboxIcon className="w-4 h-4" />
                  <span className="flex-1 text-left">Inbox</span>
                  {inboxExpanded ? (
                    <ChevronDownIcon className="w-4 h-4" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4" />
                  )}
                </button>
                {inboxExpanded && (
                  <div className="space-y-1 mt-1">
                    {socialInboxNav.map((navItem) => {
                      const navActive = pathname === navItem.href || pathname.startsWith(navItem.href);
                      return (
                        <Link
                          key={navItem.name}
                          href={navItem.href}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 ml-8 rounded-lg text-sm font-medium transition-colors',
                            navActive
                              ? 'bg-teal/10 text-teal'
                              : 'text-stone hover:bg-cream-warm hover:text-charcoal'
                          )}
                        >
                          <navItem.icon className="w-4 h-4" />
                          {navItem.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Listening */}
              <div>
                <button
                  onClick={() => setListeningExpanded(!listeningExpanded)}
                  className="w-full flex items-center gap-3 px-3 py-2 ml-2 text-sm font-medium text-stone hover:text-charcoal transition-colors"
                >
                  <MicrophoneIcon className="w-4 h-4" />
                  <span className="flex-1 text-left">Listening</span>
                  {listeningExpanded ? (
                    <ChevronDownIcon className="w-4 h-4" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4" />
                  )}
                </button>
                {listeningExpanded && (
                  <div className="space-y-1 mt-1">
                    {socialListeningNav.map((navItem) => {
                      const navActive = pathname === navItem.href || pathname.startsWith(navItem.href);
                      return (
                        <Link
                          key={navItem.name}
                          href={navItem.href}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 ml-8 rounded-lg text-sm font-medium transition-colors',
                            navActive
                              ? 'bg-teal/10 text-teal'
                              : 'text-stone hover:bg-cream-warm hover:text-charcoal'
                          )}
                        >
                          <navItem.icon className="w-4 h-4" />
                          {navItem.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Analytics */}
              <div>
                <button
                  onClick={() => setAnalyticsExpanded(!analyticsExpanded)}
                  className="w-full flex items-center gap-3 px-3 py-2 ml-2 text-sm font-medium text-stone hover:text-charcoal transition-colors"
                >
                  <ChartBarIcon className="w-4 h-4" />
                  <span className="flex-1 text-left">Analytics</span>
                  {analyticsExpanded ? (
                    <ChevronDownIcon className="w-4 h-4" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4" />
                  )}
                </button>
                {analyticsExpanded && (
                  <div className="space-y-1 mt-1">
                    {socialAnalyticsNav.map((navItem) => {
                      const navActive = pathname === navItem.href || pathname.startsWith(navItem.href);
                      return (
                        <Link
                          key={navItem.name}
                          href={navItem.href}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 ml-8 rounded-lg text-sm font-medium transition-colors',
                            navActive
                              ? 'bg-teal/10 text-teal'
                              : 'text-stone hover:bg-cream-warm hover:text-charcoal'
                          )}
                        >
                          <navItem.icon className="w-4 h-4" />
                          {navItem.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Library */}
              <div>
                <button
                  onClick={() => setLibraryExpanded(!libraryExpanded)}
                  className="w-full flex items-center gap-3 px-3 py-2 ml-2 text-sm font-medium text-stone hover:text-charcoal transition-colors"
                >
                  <FolderIcon className="w-4 h-4" />
                  <span className="flex-1 text-left">Library</span>
                  {libraryExpanded ? (
                    <ChevronDownIcon className="w-4 h-4" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4" />
                  )}
                </button>
                {libraryExpanded && (
                  <div className="space-y-1 mt-1">
                    {socialLibraryNav.map((navItem) => {
                      const navActive = pathname === navItem.href || pathname.startsWith(navItem.href);
                      return (
                        <Link
                          key={navItem.name}
                          href={navItem.href}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 ml-8 rounded-lg text-sm font-medium transition-colors',
                            navActive
                              ? 'bg-teal/10 text-teal'
                              : 'text-stone hover:bg-cream-warm hover:text-charcoal'
                          )}
                        >
                          <navItem.icon className="w-4 h-4" />
                          {navItem.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Ads Engine Section */}
        <div className="mt-6">
          <div className="flex items-center">
            <button
              onClick={() => setAdsEngineExpanded(!adsEngineExpanded)}
              className="flex-1 flex items-center justify-between px-3 py-1 group"
            >
              <h4 className="text-xs font-semibold text-teal-dark uppercase tracking-wider flex items-center gap-2">
                Ads Engine
                {!isSuperAdmin && <LockClosedIcon className="w-3 h-3 text-stone/40" />}
              </h4>
              {adsEngineExpanded ? (
                <ChevronDownIcon className="w-4 h-4 text-stone group-hover:text-charcoal transition-colors" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-stone group-hover:text-charcoal transition-colors" />
              )}
            </button>
          </div>
          {adsEngineExpanded && (
            <div className="space-y-1 mt-2">
              {isSuperAdmin ? (
                marketingNavigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 ml-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-teal/10 text-teal'
                          : 'text-stone hover:bg-cream-warm hover:text-charcoal'
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  );
                })
              ) : (
                marketingNavigation.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 px-3 py-2 ml-2 rounded-lg text-sm font-medium text-stone/40 cursor-not-allowed"
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* CRM Section — accessible to owners/admins/super_admins */}
        {(isOwnerOrAdmin || isSuperAdmin) && (
          <div className="mt-6">
            <div className="flex items-center">
              <button
                onClick={() => setCrmExpanded(!crmExpanded)}
                className="flex-1 flex items-center justify-between px-3 py-1 group"
              >
                <h4 className="text-xs font-semibold text-teal-dark uppercase tracking-wider flex items-center gap-2">
                  CRM
                </h4>
                {crmExpanded ? (
                  <ChevronDownIcon className="w-4 h-4 text-stone group-hover:text-charcoal transition-colors" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4 text-stone group-hover:text-charcoal transition-colors" />
                )}
              </button>
            </div>
            {crmExpanded && (
              <div className="space-y-1 mt-2">
                {crmNavigation.map((item) => {
                  const isActive = item.href === '/crm'
                    ? pathname === '/crm'
                    : pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 ml-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-teal/10 text-teal'
                          : 'text-stone hover:bg-cream-warm hover:text-charcoal'
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  );
                })}
                {isSuperAdmin && crmAdminNavigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 ml-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-teal/10 text-teal'
                          : 'text-stone hover:bg-cream-warm hover:text-charcoal'
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.name}
                      {item.href === '/crm/applications' && pipelineCount !== undefined && pipelineCount > 0 && (
                        <span className="ml-auto text-xs bg-teal/15 text-teal px-2 py-0.5 rounded-full font-semibold">
                          {pipelineCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Calls Section — accessible to owners/admins/super_admins */}
        {(isOwnerOrAdmin || isSuperAdmin) && (
          <div className="mt-6">
            <div className="flex items-center">
              <button
                onClick={() => setCallsExpanded(!callsExpanded)}
                className="flex-1 flex items-center justify-between px-3 py-1 group"
              >
                <h4 className="text-xs font-semibold text-teal-dark uppercase tracking-wider flex items-center gap-2">
                  Calls
                </h4>
                {callsExpanded ? (
                  <ChevronDownIcon className="w-4 h-4 text-stone group-hover:text-charcoal transition-colors" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4 text-stone group-hover:text-charcoal transition-colors" />
                )}
              </button>
            </div>
            {callsExpanded && (
              <div className="space-y-1 mt-2">
                {callsNavigation.map((item) => {
                  const isActive = item.href === '/calls'
                    ? pathname === '/calls'
                    : pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 ml-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-teal/10 text-teal'
                          : 'text-stone hover:bg-cream-warm hover:text-charcoal'
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.name}
                      {item.href === '/calls' && upcomingCallCount !== undefined && upcomingCallCount > 0 && (
                        <span className="ml-auto text-xs bg-teal/15 text-teal px-2 py-0.5 rounded-full font-semibold">
                          {upcomingCallCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Admin Navigation */}
        {isSuperAdmin && (
          <div className="mt-6">
            <div className="flex items-center">
              <button
                onClick={() => setAdminExpanded(!adminExpanded)}
                className="flex-1 flex items-center justify-between px-3 py-1 group"
              >
                <h4 className="text-xs font-semibold text-teal-dark uppercase tracking-wider flex items-center gap-2">
                  Admin
                </h4>
                {adminExpanded ? (
                  <ChevronDownIcon className="w-4 h-4 text-stone group-hover:text-charcoal transition-colors" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4 text-stone group-hover:text-charcoal transition-colors" />
                )}
              </button>
            </div>
            {adminExpanded && (
              <div className="space-y-1 mt-2">
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
                          : 'text-stone hover:bg-cream-warm hover:text-charcoal'
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </nav>

      {/* Bottom navigation */}
      <div className="p-4 border-t border-stone/10 dark:border-white/10">
        <div className="space-y-1">
          {canAccessBilling && (
            <Link
              href="/billing"
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === '/billing'
                  ? 'bg-teal/10 text-teal'
                  : 'text-stone hover:bg-cream-warm hover:text-charcoal'
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
                : 'text-stone hover:bg-cream-warm hover:text-charcoal'
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
                : 'text-stone hover:bg-cream-warm hover:text-charcoal'
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
