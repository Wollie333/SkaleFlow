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
          <div className="text-xs font-semibold text-teal tracking-[0.18em] uppercase mb-4 text-center">
            What we do
          </div>
          <h2 className="font-serif text-[clamp(30px,4vw,42px)] font-bold text-charcoal leading-[1.15] mb-6 text-center">
            Seven Engines. One Complete System.
          </h2>
          <p className="text-[18px] text-charcoal/70 leading-relaxed text-center max-w-[720px] mx-auto mb-16">
            SkaleFlow combines brand strategy, content creation, visibility management, and analytics into
            a unified platform that turns marketing chaos into predictable growth.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Brand Engine - MVP ENABLED */}
            <Link
              href="/features/brand-strategy-engine"
              className="group bg-white rounded-xl p-8 border border-charcoal/[0.08] hover:border-teal/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal/10 to-gold/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-teal" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl font-bold text-charcoal mb-3 group-hover:text-teal transition-colors">Brand Engine</h3>
              <p className="text-[15px] text-charcoal/70 leading-relaxed mb-4">
                Build your brand foundation with AI-powered strategy, positioning, and messaging that actually resonates.
              </p>
              <span className="inline-flex items-center text-sm font-medium text-teal group-hover:gap-2 transition-all">
                Learn more
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>

            {/* Presence Engine - DISABLED FOR MVP */}
            <div
              className="bg-white rounded-xl p-8 border border-charcoal/[0.08] opacity-40 blur-[0.5px] pointer-events-none cursor-not-allowed"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal/10 to-gold/10 flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-teal" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              </div>
              <h3 className="font-serif text-xl font-bold text-charcoal mb-3">Presence Engine</h3>
              <p className="text-[15px] text-charcoal/70 leading-relaxed mb-4">
                Manage your brand presence across all platforms. Consistent profiles, listings, and reputation in one dashboard.
              </p>
              <span className="inline-flex items-center text-sm font-medium text-teal">
                Learn more
                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>

            {/* Content Engine - MVP ENABLED */}
            <Link
              href="/features/ai-content-engine"
              className="group bg-white rounded-xl p-8 border border-charcoal/[0.08] hover:border-teal/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal/10 to-gold/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-teal" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </div>
              <h3 className="font-serif text-xl font-bold text-charcoal mb-3 group-hover:text-teal transition-colors">Content Engine</h3>
              <p className="text-[15px] text-charcoal/70 leading-relaxed mb-4">
                Generate weeks of on-brand content in minutes with AI that knows your voice, strategy, and audience.
              </p>
              <span className="inline-flex items-center text-sm font-medium text-teal group-hover:gap-2 transition-all">
                Learn more
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>

            {/* Ads Engine - DISABLED FOR MVP */}
            <div
              className="bg-white rounded-xl p-8 border border-charcoal/[0.08] opacity-40 blur-[0.5px] pointer-events-none cursor-not-allowed"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal/10 to-gold/10 flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-teal" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
                </svg>
              </div>
              <h3 className="font-serif text-xl font-bold text-charcoal mb-3">Ads Engine</h3>
              <p className="text-[15px] text-charcoal/70 leading-relaxed mb-4">
                Launch brand-aligned paid campaigns across platforms with AI-powered creation and conversion tracking.
              </p>
              <span className="inline-flex items-center text-sm font-medium text-teal">
                Learn more
                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>

            {/* Authority Engine - DISABLED FOR MVP */}
            <div
              className="bg-white rounded-xl p-8 border border-charcoal/[0.08] opacity-40 blur-[0.5px] pointer-events-none cursor-not-allowed"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal/10 to-gold/10 flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-teal" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                </svg>
              </div>
              <h3 className="font-serif text-xl font-bold text-charcoal mb-3">Authority Engine</h3>
              <p className="text-[15px] text-charcoal/70 leading-relaxed mb-4">
                Build executive authority with PR pipeline management, media outreach, and press release distribution.
              </p>
              <span className="inline-flex items-center text-sm font-medium text-teal">
                Learn more
                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>

            {/* Analytics - DISABLED FOR MVP */}
            <div
              className="bg-white rounded-xl p-8 border border-charcoal/[0.08] opacity-40 blur-[0.5px] pointer-events-none cursor-not-allowed"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal/10 to-gold/10 flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-teal" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl font-bold text-charcoal mb-3">Analytics</h3>
              <p className="text-[15px] text-charcoal/70 leading-relaxed mb-4">
                Track every metric that matters. See what's working and optimize based on real data, not guesswork.
              </p>
              <span className="inline-flex items-center text-sm font-medium text-teal">
                Learn more
                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>

            {/* Team Collaboration - DISABLED FOR MVP */}
            <div
              className="bg-white rounded-xl p-8 border border-charcoal/[0.08] opacity-40 blur-[0.5px] pointer-events-none cursor-not-allowed"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal/10 to-gold/10 flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-teal" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl font-bold text-charcoal mb-3">Team Collaboration</h3>
              <p className="text-[15px] text-charcoal/70 leading-relaxed mb-4">
                One platform for your entire team. Shared calendars, workflows, and real-time collaboration built in.
              </p>
              <span className="inline-flex items-center text-sm font-medium text-teal">
                Learn more
                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/skaleflow"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-[15px] font-semibold bg-teal text-cream hover:bg-teal-light hover:-translate-y-px transition-all shadow-lg hover:shadow-xl"
            >
              See the Full SkaleFlow System
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
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
