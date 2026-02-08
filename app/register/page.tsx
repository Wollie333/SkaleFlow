'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';

type FormState = 'form' | 'success';

export default function RegisterPage() {
  const [state, setState] = useState<FormState>('form');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          organizationName,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setIsLoading(false);
        return;
      }

      setState('success');
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

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
            {state === 'success' ? 'Almost There' : 'Get Started'}
          </p>
          <h1 className="font-serif text-4xl font-bold text-cream leading-tight mb-3">
            {state === 'success' ? 'Account Created!' : 'Create your account'}
          </h1>
          <p className="text-base text-cream/70">
            {state === 'success'
              ? 'Your account is pending admin approval.'
              : 'Register to access SkaleFlow.'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl p-8 md:p-10 border border-teal/[0.08] shadow-[0_8px_40px_rgba(15,31,29,0.04)]">

          {state === 'form' && (
            <>
              <h2 className="font-serif text-xl font-bold text-charcoal text-center mb-6">
                Enter your details
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Smith"
                    required
                    className="w-full px-4 py-3.5 bg-cream border border-teal/15 rounded-lg text-charcoal placeholder:text-stone transition-all focus:outline-none focus:border-teal focus:shadow-[0_0_0_3px_rgba(30,107,99,0.1)]"
                  />
                </div>

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
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Your Company"
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
                    minLength={6}
                    className="w-full px-4 py-3.5 bg-cream border border-teal/15 rounded-lg text-charcoal placeholder:text-stone transition-all focus:outline-none focus:border-teal focus:shadow-[0_0_0_3px_rgba(30,107,99,0.1)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full px-4 py-3.5 bg-cream border border-teal/15 rounded-lg text-charcoal placeholder:text-stone transition-all focus:outline-none focus:border-teal focus:shadow-[0_0_0_3px_rgba(30,107,99,0.1)]"
                  />
                </div>

                <div className="pt-1">
                  <Button
                    type="submit"
                    className="w-full py-4 text-base bg-gold hover:bg-gold-light text-dark"
                    isLoading={isLoading}
                  >
                    Create Account
                  </Button>
                </div>
              </form>

              <p className="text-center text-sm text-stone mt-6 leading-relaxed">
                Already have an account?{' '}
                <Link href="/login" className="text-teal font-medium hover:text-teal-light">
                  Sign in
                </Link>
              </p>
            </>
          )}

          {state === 'success' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="font-serif text-xl font-bold text-charcoal mb-3">
                Waiting for approval
              </h2>

              <p className="text-stone mb-6">
                Your account has been created successfully. An administrator will review and approve your account shortly. You&apos;ll be able to log in once approved.
              </p>

              <Link href="/login">
                <Button
                  type="button"
                  className="w-full py-4 text-base bg-gold hover:bg-gold-light text-dark"
                >
                  Back to Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
