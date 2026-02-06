'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';

export default function BillingCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const reference = searchParams.get('reference');
    const trxref = searchParams.get('trxref');
    const ref = reference || trxref;

    if (!ref) {
      setStatus('error');
      setMessage('No payment reference found');
      return;
    }

    async function verifyPayment() {
      try {
        const response = await fetch('/api/billing/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference: ref }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setMessage('Payment successful! Your subscription is now active.');
        } else {
          setStatus('error');
          setMessage(data.error || 'Payment verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Failed to verify payment');
      }
    }

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        {status === 'verifying' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-teal mx-auto mb-6" />
            <h1 className="text-heading-lg text-charcoal mb-2">Processing Payment</h1>
            <p className="text-stone">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircleIcon className="w-16 h-16 text-teal mx-auto mb-6" />
            <h1 className="text-heading-lg text-charcoal mb-2">Payment Successful</h1>
            <p className="text-stone mb-6">{message}</p>
            <Button onClick={() => router.push('/brand')}>
              Start Building Your Brand
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-heading-lg text-charcoal mb-2">Payment Failed</h1>
            <p className="text-stone mb-6">{message}</p>
            <div className="space-x-3">
              <Button onClick={() => router.push('/settings')} variant="ghost">
                Go to Settings
              </Button>
              <Button onClick={() => router.push('/settings')}>
                Try Again
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
