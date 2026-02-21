'use client';

import { MarketingNav } from '@/components/marketing/nav';
import { MarketingFooter } from '@/components/marketing/footer';
import { Hero } from '@/components/marketing/hero';
import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      {/* ─── Navigation ─── */}
      <MarketingNav />

      {/* ─── Hero ─── */}
      <Hero
        fullHeight
        label="Strategic Growth Partner"
        title="Clarity. Direction. <em class='text-teal not-italic'>Growth.</em>"
        subtitle="We help founder-led brands build marketing systems that actually work—so you can stop guessing and start growing."
      >
        <p className="text-sm text-stone mb-9">
          For founders with teams of 3–10 who&apos;ve built something real but feel stuck.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/skaleflow"
            className="inline-flex items-center px-7 py-3 rounded-md text-sm font-semibold bg-gold text-dark hover:bg-gold/90 hover:-translate-y-px transition-all"
          >
            See How It Works
          </Link>
          <Link
            href="/apply"
            className="inline-flex items-center px-7 py-3 rounded-md text-sm font-semibold border border-cream/30 text-cream hover:border-cream/60 hover:-translate-y-px transition-all"
          >
            Apply Now
          </Link>
        </div>
      </Hero>

      {/* ─── Problem Section ─── */}
      <section className="bg-dark text-cream py-24 px-6">
        <div className="max-w-[1060px] mx-auto">
          <div className="text-xs font-semibold text-gold tracking-[0.18em] uppercase mb-4">
            The real problem
          </div>
          <h2 className="font-serif text-[clamp(30px,4vw,42px)] font-bold text-cream leading-[1.15] mb-8 max-w-[640px]">
            You&apos;ve done everything right. So why isn&apos;t it working?
          </h2>
          <div className="max-w-[640px] space-y-5">
            <p className="text-[18px] text-cream/80 leading-relaxed">
              You&apos;ve invested in a website, posted on social media, maybe even hired a freelancer
              or two. But the results? Inconsistent at best. You&apos;re working harder than ever, yet
              growth feels random—like you&apos;re throwing darts in the dark.
            </p>
            <p className="text-[18px] text-cream/80 leading-relaxed">
              The truth is, most marketing advice is built for companies with big budgets and
              dedicated teams. It doesn&apos;t account for the reality of running a small, founder-led
              business where every dollar and every hour counts.
            </p>
            <p className="text-[18px] text-cream/80 leading-relaxed">
              The problem isn&apos;t effort—it&apos;s the absence of a system. Without a clear foundation,
              even the best tactics become noise. And noise doesn&apos;t grow a business.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Solution Section ─── */}
      <section className="bg-cream py-24 px-6">
        <div className="max-w-[1060px] mx-auto">
          <div className="text-xs font-semibold text-teal tracking-[0.18em] uppercase mb-4">
            What we do
          </div>
          <h2 className="font-serif text-[clamp(30px,4vw,42px)] font-bold text-charcoal leading-[1.15] mb-10 max-w-[640px]">
            We build the foundation first.
          </h2>

          <div className="relative bg-dark-light rounded-xl p-12 border border-teal/10 overflow-hidden">
            {/* Gradient top border */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal to-gold" />

            <p className="text-[18px] text-cream/80 leading-relaxed mb-5 max-w-[640px]">
              SkaleFlow is our proprietary system that gives founder-led brands the clarity,
              structure, and strategy they need to grow—without the guesswork. We don&apos;t start
              with ads or content calendars. We start with your business reality.
            </p>
            <p className="text-[18px] text-cream/80 leading-relaxed mb-8 max-w-[640px]">
              From positioning and messaging to channel strategy and execution rhythm, we build
              a marketing engine designed for how your business actually operates—not how some
              playbook says it should.
            </p>

            <Link
              href="/skaleflow"
              className="inline-flex items-center gap-2 text-sm font-semibold text-teal hover:text-teal-light transition-colors group"
            >
              Learn more about SkaleFlow
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Who We Help Section ─── */}
      <section className="bg-cream-warm py-24 px-6">
        <div className="max-w-[1060px] mx-auto">
          <div className="text-xs font-semibold text-teal tracking-[0.18em] uppercase mb-4">
            Who we help
          </div>
          <h2 className="font-serif text-[clamp(30px,4vw,42px)] font-bold text-charcoal leading-[1.15] mb-10 max-w-[640px]">
            Built for founders who refuse to stay stuck.
          </h2>

          <ul className="space-y-4 mb-10 max-w-[640px]">
            {[
              'You run a service-based or product business with a small team (3–10 people) and real revenue.',
              'You\'ve tried agencies, freelancers, or DIY marketing—and none of it stuck.',
              'You know marketing matters, but you don\'t have time to figure it all out yourself.',
              'You want a partner who understands your business, not someone who just runs ads.',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-[17px] text-charcoal leading-relaxed">
                <span className="mt-2 w-2 h-2 rounded-full bg-teal flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          <p className="text-[18px] text-charcoal leading-relaxed max-w-[640px]">
            If that sounds like you, <strong className="text-charcoal">we should talk.</strong>
          </p>
        </div>
      </section>

      {/* ─── Proof Section ─── */}
      <section className="bg-cream py-24 px-6">
        <div className="max-w-[1060px] mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs font-semibold text-teal tracking-[0.18em] uppercase mb-4">
              Proof
            </div>
            <h2 className="font-serif text-[clamp(30px,4vw,42px)] font-bold text-charcoal leading-[1.15]">
              Results speak louder than promises.
            </h2>
          </div>

          <div className="bg-white rounded-xl p-8 md:p-12 border border-charcoal/[0.06] shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
              {/* Stats */}
              <div className="space-y-6">
                <div className="text-xs font-semibold text-teal tracking-[0.18em] uppercase mb-6">
                  Key metrics
                </div>
                {[
                  { value: 'R291K', label: 'Revenue generated' },
                  { value: '73%', label: 'Client retention rate' },
                  { value: '85%+', label: 'Traffic from organic sources' },
                  { value: 'Part-time', label: 'Operation — no full-time marketing hire needed' },
                ].map((stat, i) => (
                  <div key={i} className="flex items-baseline gap-4 pb-4 border-b border-charcoal/[0.06] last:border-0">
                    <span className="font-serif text-[28px] font-bold text-charcoal leading-none">{stat.value}</span>
                    <span className="text-sm text-stone leading-snug">{stat.label}</span>
                  </div>
                ))}
              </div>

              {/* Case study text */}
              <div>
                <div className="text-xs font-semibold text-gold tracking-[0.18em] uppercase mb-4">
                  Case study
                </div>
                <h3 className="font-serif text-xl font-bold text-charcoal mb-4">
                  Wholistic Mental Health Care
                </h3>
                <p className="text-[16px] text-charcoal/80 leading-relaxed mb-4">
                  A solo-practitioner psychology practice that needed more than just a website—they
                  needed a system. We built their brand foundation, implemented a content engine driven
                  by organic search, and created a referral pipeline that now operates with minimal
                  ongoing effort.
                </p>
                <p className="text-[16px] text-charcoal/80 leading-relaxed mb-8">
                  The result: a practice that grew from zero online presence to a consistent flow of
                  qualified clients—all without paid advertising or a full-time marketing team.
                </p>
                <Link
                  href="/results"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-teal hover:text-teal-light transition-colors group"
                >
                  See full results
                  <svg
                    className="w-4 h-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Why Mana Section ─── */}
      <section className="bg-cream-warm py-24 px-6">
        <div className="max-w-[1060px] mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-semibold text-teal tracking-[0.18em] uppercase mb-4">
              Why Mana
            </div>
            <h2 className="font-serif text-[clamp(30px,4vw,42px)] font-bold text-charcoal leading-[1.15]">
              Not another agency. A strategic growth partner.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 — Foundation First */}
            <div className="bg-white rounded-xl p-8 border border-charcoal/[0.06]">
              <div className="w-12 h-12 rounded-xl bg-teal/[0.08] flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-teal" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21" />
                </svg>
              </div>
              <h3 className="font-serif text-lg font-bold text-charcoal mb-3">Foundation First</h3>
              <p className="text-[15px] text-charcoal/80 leading-relaxed">
                We don&apos;t jump to tactics. Every engagement starts with deep clarity on your
                positioning, audience, and growth levers—so everything we build actually compounds.
              </p>
            </div>

            {/* Card 2 — Independence, Not Dependency */}
            <div className="bg-white rounded-xl p-8 border border-charcoal/[0.06]">
              <div className="w-12 h-12 rounded-xl bg-teal/[0.08] flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-teal" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
              </div>
              <h3 className="font-serif text-lg font-bold text-charcoal mb-3">Independence, Not Dependency</h3>
              <p className="text-[15px] text-charcoal/80 leading-relaxed">
                Our goal isn&apos;t to keep you on retainer forever. We build systems your team can
                own and operate—so you grow stronger, not more reliant on us.
              </p>
            </div>

            {/* Card 3 — Clarity That Compounds */}
            <div className="bg-white rounded-xl p-8 border border-charcoal/[0.06]">
              <div className="w-12 h-12 rounded-xl bg-teal/[0.08] flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-teal" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
                </svg>
              </div>
              <h3 className="font-serif text-lg font-bold text-charcoal mb-3">Clarity That Compounds</h3>
              <p className="text-[15px] text-charcoal/80 leading-relaxed">
                Every decision we make is designed to create long-term leverage. Clear positioning,
                focused channels, repeatable processes—marketing that gets easier over time, not harder.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="bg-dark py-28 px-6 relative overflow-hidden">
        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(ellipse,rgba(30,107,99,0.1)_0%,transparent_70%)] pointer-events-none" />

        <div className="relative z-10 max-w-[640px] mx-auto text-center">
          <h2 className="font-serif text-[clamp(30px,4vw,42px)] font-bold text-cream leading-[1.15] mb-5">
            You&apos;ve fought long enough.
          </h2>
          <p className="text-lg text-cream/70 leading-relaxed mb-10">
            Let&apos;s build something that actually works.
          </p>
          <Link
            href="/apply"
            className="inline-flex items-center px-8 py-3.5 rounded-md text-sm font-semibold bg-gold text-dark hover:bg-gold/90 hover:-translate-y-px transition-all"
          >
            Apply Now
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <MarketingFooter />
    </>
  );
}
