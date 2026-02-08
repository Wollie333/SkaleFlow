'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  disabled?: boolean;
}

const baseNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Brand Engine', href: '/brand', icon: SparklesIcon },
  { name: 'My Team', href: '/team', icon: UserGroupIcon },
];

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
  { name: 'Content Reviews', href: '/content/reviews', icon: InboxArrowDownIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Create Post', href: '/content/create', icon: PencilSquareIcon },
];

const bottomNavigation: NavItem[] = [
  { name: 'Billing', href: '/billing', icon: CreditCardIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  { name: 'Help', href: '/help', icon: QuestionMarkCircleIcon },
];

const adminNavigation: NavItem[] = [
  { name: 'Applications', href: '/admin/pipeline', icon: FunnelIcon },
  { name: 'Meetings', href: '/admin/meetings', icon: VideoCameraIcon },
  { name: 'Users', href: '/admin/users', icon: UsersIcon },
  { name: 'AI Models', href: '/admin/models', icon: SparklesIcon },
  { name: 'Costs', href: '/admin/costs', icon: CurrencyDollarIcon },
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
  tierName?: string;
  pipelineCount?: number;
  contentEngineEnabled?: boolean;
  notificationCount?: number;
}

export function Sidebar({ brandProgress, contentStats, userRole, tierName, pipelineCount, contentEngineEnabled, notificationCount }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-60 bg-white border-r border-stone/10 flex flex-col">
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
                userRole === 'super_admin'
                  ? 'bg-gold/15 text-gold'
                  : 'bg-teal/15 text-teal'
              )}>
                {userRole === 'super_admin' ? 'Super Admin' : 'Team Member'}
              </span>
            )}
          </div>
        )}

        <div className="space-y-1">
          {baseNavigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

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
          })}
        </div>

        {/* Content Engine Section */}
        <div className="mt-6">
          <h4 className="px-3 text-xs font-semibold text-teal-dark uppercase tracking-wider mb-2 flex items-center gap-2">
            Content Engine
            {!contentEngineEnabled && <LockClosedIcon className="w-3 h-3 text-stone/40" />}
          </h4>
          <div className="space-y-1">
            {contentEngineEnabled ? (
              contentNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href);
                const showReviewsBadge = item.href === '/content/reviews' && notificationCount !== undefined && notificationCount > 0;
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
                    {showReviewsBadge ? (
                      <span className="ml-auto text-xs bg-teal/15 text-teal px-2 py-0.5 rounded-full font-semibold">
                        {notificationCount}
                      </span>
                    ) : null}
                  </Link>
                );
              })
            ) : (
              contentNavigation.map((item) => (
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

        {/* Marketing Section — locked for non-super_admins */}
        <div className="mt-6">
          <h4 className="px-3 text-xs font-semibold text-teal-dark uppercase tracking-wider mb-2 flex items-center gap-2">
            Marketing
            {userRole !== 'super_admin' && <LockClosedIcon className="w-3 h-3 text-stone/40" />}
          </h4>
          <div className="space-y-1">
            {userRole === 'super_admin' ? (
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
            {userRole !== 'super_admin' && <LockClosedIcon className="w-3 h-3 text-stone/40" />}
          </h4>
          <div className="space-y-1">
            {userRole === 'super_admin' ? (
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
        {userRole === 'super_admin' && (
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
          {bottomNavigation.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
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
    </aside>
  );
}
