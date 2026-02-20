import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ad Generator',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
