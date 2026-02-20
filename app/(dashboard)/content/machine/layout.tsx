import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Content Machine',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
