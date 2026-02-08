'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const links = [
  { href: '/about', label: 'About' },
  { href: '/skaleflow', label: 'SkaleFlow' },
  { href: '/problems', label: 'Problems We Solve' },
  { href: '/results', label: 'Results' },
];

export function MarketingNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; avatar: string | null } | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function getUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: profile } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', authUser.id)
        .single();

      setUser({
        name: profile?.full_name || authUser.email?.split('@')[0] || 'User',
        avatar: authUser.user_metadata?.avatar_url || null,
      });
    }

    getUser();
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark/95 backdrop-blur-md border-b border-teal/10 px-6">
      <div className="max-w-[1060px] mx-auto flex items-center justify-between h-[60px]">
        <Link href="/" className="font-serif font-bold text-[17px] text-cream tracking-wide">
          MANA<span className="font-sans text-xs font-normal text-stone ml-1.5">MARKETING</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors ${
                pathname === link.href ? 'text-cream' : 'text-cream/70 hover:text-cream'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-teal/30 group-hover:ring-teal/60 transition-all"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-teal/20 ring-2 ring-teal/30 group-hover:ring-teal/60 transition-all flex items-center justify-center text-xs font-semibold text-teal uppercase">
                  {user.name.charAt(0)}
                </div>
              )}
              <span className="text-sm text-cream/80 group-hover:text-cream transition-colors hidden sm:block">
                {user.name}
              </span>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[13px] font-medium text-cream/70 hover:text-cream transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/apply"
                className="inline-flex items-center px-5 py-2 rounded-md text-[13px] font-semibold bg-teal text-cream hover:bg-teal-light hover:-translate-y-px transition-all"
              >
                Apply Now
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
