import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Newsroom',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
