import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Brand Visual Guide',
  description: 'Brand visual identity guide — logo, colors, typography, and design system',
};

export default function BrandGuideLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
