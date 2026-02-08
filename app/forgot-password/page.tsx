'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Check your email for the password reset link!');
    }

    setIsLoading(false);
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
            Password Reset
          </p>
          <h1 className="font-serif text-4xl font-bold text-cream leading-tight mb-3">
            Forgot your password?
          </h1>
          <p className="text-base text-cream/70">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl p-8 md:p-10 border border-teal/[0.08] shadow-[0_8px_40px_rgba(15,31,29,0.04)]">
          <h2 className="font-serif text-xl font-bold text-charcoal text-center mb-6">
            Reset your password
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="p-4 bg-teal/10 border border-teal/20 rounded-lg text-teal text-sm">
                {message}
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
            <a href="/login" className="text-teal font-medium hover:text-teal-light">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
