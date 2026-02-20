import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Call',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
