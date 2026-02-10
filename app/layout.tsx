import type { Metadata } from 'next';
import { Suspense } from 'react';
import { NavigationProgress } from '@/components/layout/navigation-progress';
import './globals.css';

export const metadata: Metadata = {
  title: 'SkaleFlow - Brand & Content Engine',
  description: 'Build your brand strategy and generate content at scale with AI-powered automation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-cream text-charcoal" suppressHydrationWarning>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
