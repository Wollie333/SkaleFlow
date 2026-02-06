'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button, Input } from '@/components/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setIsLoading(false);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({
        type: 'success',
        text: 'Check your email for the login link.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4 radial-glow">
      {/* Corner marks */}
      <div className="corner-mark corner-mark-tl" />
      <div className="corner-mark corner-mark-br" />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl font-bold text-cream tracking-wide">
            SkaleFlow
          </h1>
          <p className="text-stone mt-2">by Mana Marketing</p>
        </div>

        {/* Login card */}
        <div className="bg-dark-light border border-teal/12 rounded-2xl p-8 card-gradient-border">
          <div className="text-center mb-8">
            <h2 className="text-heading-lg text-cream">Welcome back</h2>
            <p className="text-stone mt-2">
              Enter your email to receive a magic link
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              type="email"
              label="Email address"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-dark border-teal/20 text-cream placeholder:text-stone/50 focus:border-teal"
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Send Magic Link
            </Button>
          </form>

          {message && (
            <div
              className={`mt-6 p-4 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-teal/10 text-teal border border-teal/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-stone text-sm mt-8">
          Don't have an account?{' '}
          <span className="text-gold">Contact Mana for an invite</span>
        </p>
      </div>
    </div>
  );
}
