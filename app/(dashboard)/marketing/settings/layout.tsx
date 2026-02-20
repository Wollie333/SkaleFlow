import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Marketing Settings',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
