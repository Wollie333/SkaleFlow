import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Media Contacts',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
