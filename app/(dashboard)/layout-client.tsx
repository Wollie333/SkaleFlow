'use client';

import { useState, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileSidebar } from '@/components/layout/mobile-sidebar';
import { CreditsWarningBanner } from '@/components/layout';
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
  creditBalance?: {
    totalRemaining: number;
    isSuperAdmin: boolean;
  };
}

export function DashboardLayoutClient({
  children,
  headerProps,
  sidebarProps,
  creditBalance,
}: DashboardLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMenuOpen = useCallback(() => {
    console.log('Menu clicked, setting mobileMenuOpen to true');
    setMobileMenuOpen(true);
  }, []);

  const handleMenuClose = useCallback(() => {
    console.log('Menu closing, setting mobileMenuOpen to false');
    setMobileMenuOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-cream overflow-x-hidden">
      {/* Header with hamburger menu callback */}
      <Header
        {...headerProps}
        onMenuClick={handleMenuOpen}
      />

      {/* Desktop Sidebar - hidden below lg */}
      <Sidebar {...sidebarProps} className="hidden lg:flex" />

      {/* Mobile Sidebar - visible below lg */}
      <MobileSidebar
        {...sidebarProps}
        isOpen={mobileMenuOpen}
        onClose={handleMenuClose}
      />

      {/* Credits Warning Banner - only for super admins with low/negative balance */}
      {creditBalance && (
        <CreditsWarningBanner
          totalRemaining={creditBalance.totalRemaining}
          isSuperAdmin={creditBalance.isSuperAdmin}
        />
      )}

      {/* Main Content - responsive margin */}
      <main className="ml-0 lg:ml-60 pt-16 min-h-screen overflow-x-hidden">
        <div className="p-4 md:p-6 lg:p-8 max-w-full lg:max-w-[calc(100vw-15rem)]">
          {children}
        </div>
      </main>
    </div>
  );
}
