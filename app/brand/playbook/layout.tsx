import type { Metadata } from 'next';
import './playbook.css';

export const metadata: Metadata = {
  title: 'Brand Playbook — SkaleFlow',
};

export default function PlaybookLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="playbook-layout bg-white min-h-screen">
      {children}
    </div>
  );
}
