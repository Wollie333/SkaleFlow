'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  HomeIcon,
  SparklesIcon,
  CalendarIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Brand Engine', href: '/brand', icon: SparklesIcon },
  { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
];

const bottomNavigation: NavItem[] = [
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  { name: 'Help', href: '/help', icon: QuestionMarkCircleIcon },
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
}

export function Sidebar({ brandProgress, contentStats }: SidebarProps) {
  const pathname = usePathname();

  // Add badges dynamically
  const navWithBadges = navigation.map(item => {
    if (item.href === '/brand' && brandProgress?.currentPhase) {
      return { ...item, badge: `Phase ${brandProgress.currentPhase}` };
    }
    if (item.href === '/calendar' && contentStats?.pending) {
      return { ...item, badge: `${contentStats.pending} pending` };
    }
    return item;
  });

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-60 bg-white border-r border-stone/10 flex flex-col">
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navWithBadges.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));

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
                {item.badge && (
                  <span className="ml-auto text-xs bg-stone/10 text-stone px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Brand Engine Progress */}
        {brandProgress && brandProgress.totalPhases && (
          <div className="mt-6 p-4 bg-cream-warm rounded-lg">
            <h4 className="text-xs font-semibold text-stone uppercase tracking-wider mb-2">
              Brand Progress
            </h4>
            <div className="w-full bg-stone/10 rounded-full h-2">
              <div
                className="bg-teal h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${((brandProgress.completedPhases || 0) / brandProgress.totalPhases) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-stone mt-2">
              {brandProgress.completedPhases || 0} of {brandProgress.totalPhases} phases complete
            </p>
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
