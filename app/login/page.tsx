'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui';

type FormMode = 'login' | 'forgot' | 'reset-sent';

export default function LoginPage() {
  const [mode, setMode] = useState<FormMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    // Check if user is approved
    if (data.user) {
      const { data: userData } = await supabase
        .from('users')
        .select('approved')
        .eq('id', data.user.id)
        .single();

      if (userData && !userData.approved) {
        // Sign out unapproved user immediately
        await supabase.auth.signOut();
        setError('Your account is pending admin approval. Please wait for an administrator to approve your account.');
        setIsLoading(false);
        return;
      }
    }

    router.push('/dashboard');
    router.refresh();
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    setMode('reset-sent');
    setIsLoading(false);
  };

  const getHeaderContent = () => {
    switch (mode) {
      case 'forgot':
        return {
          label: 'Password Reset',
          title: 'Forgot your password?',
          subtitle: 'Enter your email and we\'ll send you a reset link.',
        };
      case 'reset-sent':
        return {
          label: 'Check Your Email',
          title: 'Reset link sent!',
          subtitle: 'Check your inbox for the password reset link.',
        };
      default:
        return {
          label: 'Welcome Back',
          title: 'Sign in to SkaleFlow',
          subtitle: 'Access your brand engine and content calendar.',
        };
    }
  };

  const header = getHeaderContent();

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-6 relative overflow-hidden">
      {/* Radial glow */}
      <div className="absolute top-[-40%] left-[-25%] w-[70%] h-[120%] bg-[radial-gradient(ellipse,rgba(30,107,99,0.06)_0%,transparent_70%)] pointer-events-none" />

      {/* Corner marks */}
      <div className="absolute top-20 left-6 w-[60px] h-[60px] border-l-2 border-t-2 border-gold/15 pointer-events-none hidden md:block" />
      <div className="absolute bottom-6 right-6 w-[60px] h-[60px] border-r-2 border-b-2 border-gold/15 pointer-events-none hidden md:block" />

      <div className="w-full max-w-[420px] relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-xs font-semibold text-gold tracking-[0.18em] uppercase mb-4">
            {header.label}
          </p>
          <h1 className="font-serif text-4xl font-bold text-cream leading-tight mb-3">
            {header.title}
          </h1>
          <p className="text-base text-cream/70">
            {header.subtitle}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl p-8 md:p-10 border border-teal/[0.08] shadow-[0_8px_40px_rgba(15,31,29,0.04)]">

          {/* Login Form */}
          {mode === 'login' && (
            <>
              <h2 className="font-serif text-xl font-bold text-charcoal text-center mb-6">
                Enter your credentials
              </h2>

              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full px-4 py-3.5 bg-cream border border-teal/15 rounded-lg text-charcoal placeholder:text-stone transition-all focus:outline-none focus:border-teal focus:shadow-[0_0_0_3px_rgba(30,107,99,0.1)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3.5 bg-cream border border-teal/15 rounded-lg text-charcoal placeholder:text-stone transition-all focus:outline-none focus:border-teal focus:shadow-[0_0_0_3px_rgba(30,107,99,0.1)]"
                  />
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); }}
                    className="text-sm text-teal hover:text-teal-light font-medium"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="pt-1">
                  <Button
                    type="submit"
                    className="w-full py-4 text-base bg-gold hover:bg-gold-light text-dark"
                    isLoading={isLoading}
                  >
                    Sign In
                  </Button>
                </div>
              </form>

              <p className="text-center text-sm text-stone mt-6 leading-relaxed">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-teal font-medium hover:text-teal-light">
                  Register here
                </Link>
              </p>
            </>
          )}

          {/* Forgot Password Form */}
          {mode === 'forgot' && (
            <>
              <h2 className="font-serif text-xl font-bold text-charcoal text-center mb-6">
                Reset your password
              </h2>

              <form onSubmit={handleForgotPassword} className="space-y-5">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full px-4 py-3.5 bg-cream border border-teal/15 rounded-lg text-charcoal placeholder:text-stone transition-all focus:outline-none focus:border-teal focus:shadow-[0_0_0_3px_rgba(30,107,99,0.1)]"
                  />
                </div>

                <div className="pt-1">
                  <Button
                    type="submit"
                    className="w-full py-4 text-base bg-gold hover:bg-gold-light text-dark"
                    isLoading={isLoading}
                  >
                    Send Reset Link
                  </Button>
                </div>
              </form>

              <p className="text-center text-sm text-stone mt-6 leading-relaxed">
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-teal font-medium hover:text-teal-light"
                >
                  Sign in
                </button>
              </p>
            </>
          )}

          {/* Reset Link Sent */}
          {mode === 'reset-sent' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <h2 className="font-serif text-xl font-bold text-charcoal mb-3">
                Check your email
              </h2>

              <p className="text-stone mb-6">
                We sent a password reset link to<br />
                <span className="font-medium text-charcoal">{email}</span>
              </p>

              <Button
                type="button"
                onClick={() => { setMode('login'); setError(''); setEmail(''); }}
                className="w-full py-4 text-base bg-gold hover:bg-gold-light text-dark"
              >
                Back to Sign In
              </Button>

              <p className="text-xs text-stone mt-4">
                Didn&apos;t receive the email? Check your spam folder or{' '}
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-teal hover:text-teal-light"
                >
                  try again
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
