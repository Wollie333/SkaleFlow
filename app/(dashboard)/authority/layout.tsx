import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authority Engine',
};

export default function AuthorityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
