'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';

interface TransactionDetails {
  reference: string;
  amount: number; // in kobo/cents
  productName: string;
  credits: number | null;
  type: 'subscription' | 'topup';
}

function formatZAR(cents: number): string {
  return `R${(cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

export default function BillingCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');
  const [details, setDetails] = useState<TransactionDetails | null>(null);

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

          const metadata = data.metadata || {};
          const isTopup = metadata.type === 'topup';
          const productName = isTopup
            ? (metadata.packName as string) || 'Credit Top-Up'
            : (metadata.tierName as string) || data.plan?.name || 'Subscription';
          const credits = isTopup
            ? Number(metadata.credits) || null
            : Number(metadata.monthly_credits) || null;

          const txDetails: TransactionDetails = {
            reference: data.reference || ref!,
            amount: data.amount || 0,
            productName,
            credits,
            type: isTopup ? 'topup' : 'subscription',
          };
          setDetails(txDetails);

          if (isTopup) {
            setMessage(
              credits
                ? `${credits.toLocaleString()} credits have been added to your account.`
                : 'Credits have been added to your account.'
            );
          } else {
            setMessage('Your subscription is now active.');
          }

          // Push dataLayer event for Meta Pixel / GTM
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            event: 'purchase',
            currency: 'ZAR',
            value: txDetails.amount / 100,
            transaction_id: txDetails.reference,
            content_name: txDetails.productName,
            content_type: 'product',
            content_ids: [isTopup ? metadata.packSlug : metadata.tier_id].filter(Boolean),
          });
        } else {
          setStatus('error');
          setMessage(data.error || 'Payment verification failed');
        }
      } catch {
        setStatus('error');
        setMessage('Failed to verify payment');
      }
    }

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md w-full">
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

            {/* Purchase Summary Card */}
            {details && (
              <div className="bg-cream-warm rounded-xl p-5 mb-6 text-left">
                <h3 className="text-sm font-semibold text-stone uppercase tracking-wider mb-3">Purchase Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-stone">Product</span>
                    <span className="text-sm font-medium text-charcoal">{details.productName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-stone">Amount Paid</span>
                    <span className="text-sm font-medium text-charcoal">{formatZAR(details.amount)}</span>
                  </div>
                  {details.credits && (
                    <div className="flex justify-between">
                      <span className="text-sm text-stone">
                        {details.type === 'topup' ? 'Credits Added' : 'Monthly Credits'}
                      </span>
                      <span className="text-sm font-semibold text-teal">{details.credits.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-stone/10">
                    <span className="text-xs text-stone">Reference</span>
                    <span className="text-xs text-stone font-mono">{details.reference}</span>
                  </div>
                </div>
              </div>
            )}

            {details?.type === 'topup' ? (
              <div className="space-x-3">
                <Button onClick={() => router.push('/billing')} variant="ghost">
                  View Billing
                </Button>
                <Button onClick={() => router.push('/brand')}>
                  Continue Working
                </Button>
              </div>
            ) : (
              <Button onClick={() => router.push('/brand')}>
                Start Building Your Brand
              </Button>
            )}
          </>
        )}

        {status === 'error' && (
          <>
            <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-heading-lg text-charcoal mb-2">Payment Failed</h1>
            <p className="text-stone mb-6">{message}</p>
            <div className="space-x-3">
              <Button onClick={() => router.push('/billing')} variant="ghost">
                Go to Billing
              </Button>
              <Button onClick={() => router.push('/billing')}>
                Try Again
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
