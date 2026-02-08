'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ThankYouContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'your inbox';

  return (
    <div className="min-h-screen bg-cream font-sans text-charcoal">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark/95 backdrop-blur-md border-b border-teal/10">
        <div className="max-w-[1060px] mx-auto flex items-center justify-between h-[60px] px-6">
          <Link href="/" className="font-serif font-bold text-[17px] text-cream tracking-wide">
            MANA<span className="font-sans text-xs font-normal text-stone ml-1.5">MARKETING</span>
          </Link>
        </div>
      </nav>

      {/* CONTENT */}
      <section className="min-h-screen flex items-center justify-center pt-[60px]">
        <div className="max-w-md w-full mx-6">
          <div className="bg-white rounded-2xl p-10 md:p-12 border border-teal/[0.08] shadow-[0_8px_40px_rgba(15,31,29,0.04)] text-center">
            {/* Checkmark */}
            <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-teal" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>

            <h1 className="font-serif text-2xl font-bold text-charcoal mb-3">
              We&apos;ve received your application
            </h1>

            <p className="text-stone leading-relaxed mb-6">
              Please check <span className="font-semibold text-charcoal">{email}</span> — we&apos;ll be replying soon.
            </p>

            <div className="bg-cream rounded-xl p-5 text-left">
              <p className="text-sm text-stone leading-relaxed">
                All applications are manually reviewed and replied to. No bots, no auto-responders. If SkaleFlow is the right fit, we&apos;ll reach out to schedule a call. If not, we&apos;ll tell you honestly.
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center mt-8 px-6 py-3 rounded-md text-sm font-semibold bg-teal text-cream hover:bg-teal-light transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense>
      <ThankYouContent />
    </Suspense>
  );
}
