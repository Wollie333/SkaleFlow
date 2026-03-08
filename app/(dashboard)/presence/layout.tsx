import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Presence Engine — SkaleFlow',
  description: 'Build professional, consistent profiles across all your platforms.',
};

export default function PresenceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
