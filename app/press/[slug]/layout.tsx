import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Press Room',
  description: 'Latest news, media resources, and press inquiries',
};

export default function PressLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
