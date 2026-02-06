'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BellIcon, UserCircleIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  user?: {
    email: string;
    full_name?: string;
  };
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-dark/95 backdrop-blur-md border-b border-teal/12">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif font-bold text-xl text-cream tracking-wide">
            SkaleFlow
          </span>
          <span className="text-xs text-stone font-normal">by Mana</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="p-2 rounded-lg text-stone hover:text-cream hover:bg-teal/10 transition-colors">
            <BellIcon className="w-5 h-5" />
          </button>

          {/* User menu */}
          <div className="relative group">
            <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-teal/10 transition-colors">
              <UserCircleIcon className="w-8 h-8 text-stone" />
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-cream">
                  {user?.full_name || user?.email?.split('@')[0]}
                </p>
                <p className="text-xs text-stone">{user?.email}</p>
              </div>
            </button>

            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-48 py-2 bg-dark-light border border-teal/12 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <Link
                href="/settings"
                className="block px-4 py-2 text-sm text-stone hover:text-cream hover:bg-teal/10 transition-colors"
              >
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-stone hover:text-cream hover:bg-teal/10 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
