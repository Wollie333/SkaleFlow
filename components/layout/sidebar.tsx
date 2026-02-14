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
  { name: 'Applications', href: '/admin/pipeline', icon: FunnelIcon },
  { name: 'Meetings', href: '/admin/meetings', icon: VideoCameraIcon },
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

  if (canAccessBrandEngine) {
    baseNavItems.push({ name: 'Brand Engine', href: '/brand', icon: SparklesIcon });
  }

  if (canAccessContentEngine) {
    baseNavItems.push({ name: 'Content Engine', href: '/content/machine', icon: BoltIcon });
  }

  if (canAccessTeam) {
    baseNavItems.push({ name: 'My Team', href: '/team', icon: UserGroupIcon });
  }

  // Total pending reviews = change_requests + content pending_review notifications
  const totalPendingReviews = (pendingReviewCount || 0);

  return (
    <aside className={cn("fixed left-0 top-16 bottom-0 w-60 bg-white border-r border-stone/10 flex flex-col", className)}>
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

        {/* Social Media Management Section - Available to all users */}
        <div className="mt-6">
          <h4 className="px-3 text-xs font-semibold text-teal-dark uppercase tracking-wider mb-2">
            Social Media Management
          </h4>

          {/* Publishing Subsection */}
          <div className="mb-2">
            <button
              onClick={() => setPublishingExpanded(!publishingExpanded)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-stone hover:text-charcoal transition-colors"
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
                {socialPublishingNav.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 ml-6 rounded-lg text-sm font-medium transition-colors',
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

          {/* Inbox Subsection */}
          <div className="mb-2">
            <button
              onClick={() => setInboxExpanded(!inboxExpanded)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-stone hover:text-charcoal transition-colors"
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
                {socialInboxNav.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 ml-6 rounded-lg text-sm font-medium transition-colors',
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

          {/* Listening Subsection */}
          <div className="mb-2">
            <button
              onClick={() => setListeningExpanded(!listeningExpanded)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-stone hover:text-charcoal transition-colors"
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
                {socialListeningNav.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 ml-6 rounded-lg text-sm font-medium transition-colors',
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

          {/* Analytics Subsection */}
          <div className="mb-2">
            <button
              onClick={() => setAnalyticsExpanded(!analyticsExpanded)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-stone hover:text-charcoal transition-colors"
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
                {socialAnalyticsNav.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 ml-6 rounded-lg text-sm font-medium transition-colors',
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

          {/* Library Subsection */}
          <div className="mb-2">
            <button
              onClick={() => setLibraryExpanded(!libraryExpanded)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-stone hover:text-charcoal transition-colors"
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
                {socialLibraryNav.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 ml-6 rounded-lg text-sm font-medium transition-colors',
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
        </div>

        {/* Authority Engine — owners/admins only */}
        {isOwnerOrAdmin && (
          <div className="mt-6">
            <h4 className="px-3 text-xs font-semibold text-teal-dark uppercase tracking-wider mb-2">
              Authority Engine
            </h4>
            <div className="space-y-1">
              {authorityNavigation.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/authority' && pathname.startsWith(item.href));
                const isExact = item.href === '/authority' && pathname === '/authority';
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      (isExact || isActive)
                        ? 'bg-teal/10 text-teal'
                        : 'text-stone hover:bg-cream-warm hover:text-charcoal'
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

        {/* Marketing Section — locked for non-super_admins */}
        <div className="mt-6">
          <h4 className="px-3 text-xs font-semibold text-teal-dark uppercase tracking-wider mb-2 flex items-center gap-2">
            Marketing
            {!isSuperAdmin && <LockClosedIcon className="w-3 h-3 text-stone/40" />}
          </h4>
          <div className="space-y-1">
            {isSuperAdmin ? (
              marketingNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-teal/10 text-teal'
                        : 'text-stone hover:bg-cream-warm hover:text-charcoal'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })
            ) : (
              marketingNavigation.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-stone/40 cursor-not-allowed"
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sales Section — locked for non-super_admins */}
        <div className="mt-6">
          <h4 className="px-3 text-xs font-semibold text-teal-dark uppercase tracking-wider mb-2 flex items-center gap-2">
            Sales
            {!isSuperAdmin && <LockClosedIcon className="w-3 h-3 text-stone/40" />}
          </h4>
          <div className="space-y-1">
            {isSuperAdmin ? (
              salesNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-teal/10 text-teal'
                        : 'text-stone hover:bg-cream-warm hover:text-charcoal'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })
            ) : (
              salesNavigation.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-stone/40 cursor-not-allowed"
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Admin Navigation */}
        {isSuperAdmin && (
          <div className="mt-6">
            <h4 className="px-3 text-xs font-semibold text-teal-dark uppercase tracking-wider mb-2">
              Admin
            </h4>
            <div className="space-y-1">
              {adminNavigation.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const showBadge = item.href === '/admin/pipeline' && pipelineCount !== undefined && pipelineCount > 0;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-teal/10 text-teal'
                        : 'text-stone hover:bg-cream-warm hover:text-charcoal'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                    {showBadge && (
                      <span className="ml-auto text-xs bg-teal/15 text-teal px-2 py-0.5 rounded-full font-semibold">
                        {pipelineCount}
                      </span>
                    )}
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
