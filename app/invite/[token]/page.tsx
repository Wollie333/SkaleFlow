'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Input } from '@/components/ui';

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [invitation, setInvitation] = useState<{
    email: string;
    organization_name: string;
  } | null>(null);
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;

    async function fetchInvitation() {
      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from('invitations')
          .select('email, organization_name, status, expires_at')
          .eq('token', token)
          .single();

        if (fetchError || !data) {
          setError('Invalid or expired invitation link.');
          setIsLoading(false);
          return;
        }

        if (data.status !== 'pending') {
          setError('This invitation has already been used.');
          setIsLoading(false);
          return;
        }

        if (new Date(data.expires_at) < new Date()) {
          setError('This invitation has expired.');
          setIsLoading(false);
          return;
        }

        setInvitation({
          email: data.email,
          organization_name: data.organization_name,
        });
      } catch {
        setError('Something went wrong. Please try again.');
      }
      setIsLoading(false);
    }

    fetchInvitation();
  }, [token]);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation || !token) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: invitation.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?invite=${token}`,
          data: {
            full_name: fullName,
            invite_token: token,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <h1 className="font-serif text-3xl font-bold text-cream mb-4">
            Invitation Error
          </h1>
          <p className="text-stone mb-8">{error}</p>
          <Button onClick={() => router.push('/login')} variant="outline" className="border-cream/25 text-cream hover:border-cream/50">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-teal/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-serif text-3xl font-bold text-cream mb-4">
            Check your email
          </h1>
          <p className="text-stone">
            We&apos;ve sent a login link to <span className="text-cream">{invitation?.email}</span>.
            Click the link to complete your account setup.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4 radial-glow">
      <div className="corner-mark corner-mark-tl" />
      <div className="corner-mark corner-mark-br" />

      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl font-bold text-cream tracking-wide">
            SkaleFlow
          </h1>
          <p className="text-stone mt-2">by Mana Marketing</p>
        </div>

        <div className="bg-dark-light border border-teal/12 rounded-2xl p-8 card-gradient-border">
          <div className="text-center mb-8">
            <h2 className="text-heading-lg text-cream">You&apos;re invited!</h2>
            <p className="text-stone mt-2">
              Join <span className="text-gold">{invitation?.organization_name}</span> on SkaleFlow
            </p>
          </div>

          <form onSubmit={handleAccept} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-cream/70 mb-2">Email</label>
              <Input
                type="email"
                value={invitation?.email || ''}
                disabled
                className="bg-dark border-teal/20 text-cream/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cream/70 mb-2">Your Name</label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="bg-dark border-teal/20 text-cream placeholder:text-stone/50"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isSubmitting}
            >
              Accept Invitation
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
