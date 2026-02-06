'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Input } from '@/components/ui';

interface InvitePageProps {
  params: { token: string };
}

export default function InvitePage({ params }: InvitePageProps) {
  const router = useRouter();
  const supabase = createClient();

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
    async function fetchInvitation() {
      const { data, error } = await supabase
        .from('invitations')
        .select('email, organization_name, status, expires_at')
        .eq('token', params.token)
        .single();

      setIsLoading(false);

      if (error || !data) {
        setError('Invalid or expired invitation link.');
        return;
      }

      if (data.status !== 'pending') {
        setError('This invitation has already been used.');
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired.');
        return;
      }

      setInvitation({
        email: data.email,
        organization_name: data.organization_name,
      });
    }

    fetchInvitation();
  }, [params.token, supabase]);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;

    setIsSubmitting(true);
    setError(null);

    // Sign up with magic link
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: invitation.email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?invite=${params.token}`,
        data: {
          full_name: fullName,
          invite_token: params.token,
        },
      },
    });

    setIsSubmitting(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setSuccess(true);
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
          <Button onClick={() => router.push('/login')} variant="outline">
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
            We've sent a login link to <span className="text-cream">{invitation?.email}</span>.
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
            <h2 className="text-heading-lg text-cream">You're invited!</h2>
            <p className="text-stone mt-2">
              Join <span className="text-gold">{invitation?.organization_name}</span> on SkaleFlow
            </p>
          </div>

          <form onSubmit={handleAccept} className="space-y-6">
            <Input
              type="email"
              label="Email"
              value={invitation?.email || ''}
              disabled
              className="bg-dark border-teal/20 text-cream/50"
            />

            <Input
              type="text"
              label="Your Name"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="bg-dark border-teal/20 text-cream placeholder:text-stone/50"
            />

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
