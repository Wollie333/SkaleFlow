import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Social Analytics',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
