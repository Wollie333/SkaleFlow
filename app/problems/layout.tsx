import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Problems We Solve',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
