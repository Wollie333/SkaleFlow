import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Landing Page Generator',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
