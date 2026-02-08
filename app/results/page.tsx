import { MarketingNav } from '@/components/marketing/nav';
import { MarketingFooter } from '@/components/marketing/footer';
import { Hero } from '@/components/marketing/hero';
import Link from 'next/link';

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-cream font-sans text-charcoal">
      <MarketingNav />

      <Hero
        label="Case Studies & Results"
        title="Clarity creates results."
        subtitle="See what happens when founder-led brands stop guessing and start building on a real foundation."
      />

      {/* ── Case Study Section ── */}
      <section className="bg-cream py-24">
        <div className="max-w-[1060px] mx-auto px-6">
          <div className="bg-white rounded-2xl border border-teal/[0.08] shadow-lg overflow-hidden">

            {/* Header */}
            <div className="bg-dark p-10 border-b-[3px] border-teal">
              <div className="text-xs font-semibold text-gold tracking-[0.18em] uppercase mb-4">
                Featured Case Study
              </div>
              <h2 className="font-serif text-[clamp(28px,4vw,40px)] font-bold text-cream leading-tight mb-6">
                Wholistic Mental Health Care
              </h2>
              <div className="flex flex-wrap gap-6">
                {[
                  { label: 'Industry', value: 'Counselling' },
                  { label: 'Stage', value: 'Startup' },
                  { label: 'Operation', value: 'Part-time only' },
                  { label: 'Timeline', value: 'January \u2013 December 2024' },
                ].map((meta) => (
                  <div key={meta.label}>
                    <span className="text-[11px] uppercase tracking-[0.14em] text-stone block mb-1">
                      {meta.label}
                    </span>
                    <span className="text-sm font-bold text-cream">{meta.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="p-10 md:p-12">

              {/* The Challenge */}
              <div className="mb-10">
                <h3 className="text-lg font-bold text-charcoal mb-3">The Challenge</h3>
                <p className="text-[15px] text-charcoal/80 leading-relaxed">
                  Wholistic Mental Health Care was a brand-new counselling practice run by a single founder
                  with no existing client base, no digital presence, and no marketing experience. The founder
                  was operating part-time while still employed full-time elsewhere, which meant every rand and
                  every hour had to count. There was no room for guesswork or wasted spend.
                </p>
              </div>

              {/* The Approach */}
              <div className="mb-10">
                <h3 className="text-lg font-bold text-charcoal mb-3">The Approach</h3>
                <p className="text-[15px] text-charcoal/80 leading-relaxed mb-4">
                  We applied the SkaleFlow methodology from day one: build the brand foundation first,
                  then layer on acquisition systems designed to compound over time. No hacks, no shortcuts
                  &mdash; just clear positioning and disciplined execution.
                </p>
                <ul className="space-y-2.5">
                  {[
                    'Defined a clear brand position in a crowded wellness space',
                    'Built a professional website designed for trust and conversion',
                    'Launched targeted Meta ad campaigns with precise audience segmentation',
                    'Created a content system for organic reach on social media',
                    'Set up tracking, reporting, and feedback loops from the start',
                    'Managed the full marketing function so the founder could focus on clients',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-[15px] text-charcoal/80">
                      <span className="text-teal font-bold mt-0.5 flex-shrink-0">&#10003;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Stats Row */}
              <div className="border-t border-b border-teal/10 py-8 my-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                  {[
                    { number: 'R291K', label: 'Total revenue' },
                    { number: '48', label: 'Unique clients' },
                    { number: '73%', label: 'Retention rate' },
                    { number: '208%', label: 'ROAS on ads' },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className="font-serif text-[32px] font-bold text-teal leading-none mb-1">
                        {stat.number}
                      </div>
                      <div className="text-[13px] text-stone">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* The Results */}
              <div className="mb-10">
                <h3 className="text-lg font-bold text-charcoal mb-3">The Results</h3>
                <ul className="space-y-2.5">
                  {[
                    { text: 'Generated ', bold: 'R291,000 in revenue', after: ' within the first 12 months of operation' },
                    { text: 'Acquired ', bold: '48 unique paying clients', after: ' from a standing start with zero existing audience' },
                    { text: 'Achieved a ', bold: '73% client retention rate', after: ', proving the brand attracted the right people' },
                    { text: 'Delivered a ', bold: '208% return on ad spend', after: ', meaning every R1 spent returned over R3' },
                    { text: 'Built a brand that ', bold: 'generates referrals organically', after: ', reducing dependence on paid acquisition' },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-[15px] text-charcoal/80">
                      <span className="text-teal font-bold mt-0.5 flex-shrink-0">&#10003;</span>
                      <span>
                        {item.text}<strong className="text-charcoal">{item.bold}</strong>{item.after}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quote Block */}
              <div className="bg-cream-warm rounded-xl p-8 border-l-4 border-gold mb-10">
                <p className="font-serif italic text-xl text-charcoal leading-relaxed">
                  &ldquo;I came in with nothing &mdash; no clients, no brand, no idea how to market a practice.
                  Mana built the whole thing with me. A year later I have a real business, consistent income,
                  and clients who keep coming back. I couldn&apos;t have done this alone.&rdquo;
                </p>
                <p className="text-sm text-stone mt-4">
                  &mdash; Founder, Wholistic Mental Health Care
                </p>
              </div>

              {/* The Insight */}
              <div className="mb-10">
                <h3 className="text-lg font-bold text-charcoal mb-3">The Insight</h3>
                <p className="text-[15px] text-charcoal/80 leading-relaxed">
                  Most marketing agencies would have told this founder to &ldquo;just run ads&rdquo; or
                  &ldquo;post more on social media.&rdquo; That would have failed. What made the difference
                  was building a brand foundation first &mdash; clear positioning, a credible digital presence,
                  and a system designed to convert strangers into loyal clients. The ads worked because
                  everything behind them was built properly.
                </p>
              </div>

              {/* Takeaway Box */}
              <div className="bg-dark rounded-xl p-8">
                <h3 className="font-serif text-xl font-bold text-gold mb-4">What This Means For You</h3>
                <p className="text-[15px] text-cream/80 leading-relaxed mb-4">
                  If a part-time startup with <strong className="text-cream">zero audience</strong> and{' '}
                  <strong className="text-cream">zero marketing experience</strong> can generate nearly R300K
                  in its first year, imagine what&apos;s possible when you already have a running business,
                  existing clients, and revenue to invest.
                </p>
                <p className="text-[15px] text-cream/80 leading-relaxed">
                  The difference isn&apos;t more tactics. It&apos;s{' '}
                  <strong className="text-cream">better foundations</strong>. That&apos;s what SkaleFlow builds.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── More Coming Section ── */}
      <section className="bg-cream-warm text-center py-16 border-t border-teal/[0.08]">
        <div className="max-w-[560px] mx-auto px-6">
          <h3 className="font-serif text-2xl font-bold text-stone mb-3">
            More case studies coming
          </h3>
          <p className="text-[15px] text-stone leading-relaxed">
            We&apos;re selective about who we work with &mdash; which means we don&apos;t have hundreds of
            case studies. But the ones we do have are real, detailed, and worth reading. More will be
            published as our current clients hit their milestones.
          </p>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-dark py-28 relative overflow-hidden">
        <div className="absolute -top-[40%] -right-[25%] w-[70%] h-[120%] bg-[radial-gradient(ellipse,rgba(30,107,99,0.06)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative z-10 max-w-[600px] mx-auto px-6 text-center">
          <h2 className="font-serif text-[clamp(30px,4.5vw,44px)] font-bold text-cream leading-tight mb-5">
            Ready to become the next case study?
          </h2>
          <p className="text-lg text-cream/70 mb-9 leading-relaxed">
            Let&apos;s build something worth talking about.
          </p>
          <Link
            href="/apply"
            className="inline-flex items-center px-8 py-4 rounded-md text-base font-semibold bg-gold text-dark hover:bg-gold-light hover:-translate-y-px transition-all"
          >
            Apply Now
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
