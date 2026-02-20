import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authority Settings',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
