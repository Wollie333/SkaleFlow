import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Creative Library',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
