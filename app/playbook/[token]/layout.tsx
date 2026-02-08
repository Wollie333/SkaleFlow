import type { Metadata } from 'next';
import '../../brand/playbook/playbook.css';

export const metadata: Metadata = {
  title: 'Brand Playbook',
};

export default function PublicPlaybookLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="playbook-layout bg-white min-h-screen">
      {children}
    </div>
  );
}
