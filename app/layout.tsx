import type { Metadata } from 'next';
import { Suspense } from 'react';
import { NavigationProgress } from '@/components/layout/navigation-progress';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'SkaleFlow',
    template: '%s | SkaleFlow',
  },
  description: 'Build your brand strategy and generate content at scale with AI-powered automation.',
};

const themeScript = `try{var t=localStorage.getItem('sf-theme');if(t==='light')document.documentElement.classList.remove('dark');else document.documentElement.classList.add('dark')}catch(e){document.documentElement.classList.add('dark')}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased bg-cream text-charcoal">
        <ThemeProvider>
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
