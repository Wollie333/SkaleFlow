import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Press Releases',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
