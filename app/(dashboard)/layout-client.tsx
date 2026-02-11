'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileSidebar } from '@/components/layout/mobile-sidebar';
import type { FeaturePermissions } from '@/lib/permissions';

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  headerProps: {
    user: { email: string; full_name?: string };
    initialUnreadCount: number;
    organizationId?: string;
    draftCount: number;
  };
  sidebarProps: {
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
  };
}

export function DashboardLayoutClient({
  children,
  headerProps,
  sidebarProps,
}: DashboardLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cream">
      {/* Header with hamburger menu callback */}
      <Header
        {...headerProps}
        onMenuClick={() => setMobileMenuOpen(true)}
      />

      {/* Desktop Sidebar - hidden below lg */}
      <Sidebar {...sidebarProps} className="hidden lg:flex" />

      {/* Mobile Sidebar - visible below lg */}
      <MobileSidebar
        {...sidebarProps}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content - responsive margin */}
      <main className="ml-0 lg:ml-60 pt-16 min-h-screen overflow-x-hidden">
        <div className="p-4 md:p-6 lg:p-8 max-w-full lg:max-w-[calc(100vw-15rem)]">
          {children}
        </div>
      </main>
    </div>
  );
}
