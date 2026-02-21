'use client';

import { MarketingNav } from '@/components/marketing/nav';
import { MarketingFooter } from '@/components/marketing/footer';
import { Hero } from '@/components/marketing/hero';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <>
      <MarketingNav />

      {/* ─── Hero ─── */}
      <Hero
        label="About Mana Marketing"
        title="I help founders build businesses that actually work."
        subtitle="Not with more tactics. With clarity, structure, and systems that compound."
      />

      {/* ─── My Story ─── */}
      <section className="bg-cream py-24 px-6">
        <div className="max-w-[780px] mx-auto">
          <div className="text-[11px] font-semibold text-teal tracking-[0.18em] uppercase mb-4">
            My story
          </div>
          <h2 className="font-serif text-[clamp(28px,4vw,40px)] font-bold text-charcoal leading-[1.2] mb-6">
            I didn&apos;t start in marketing.<br />I started with sawdust.
          </h2>
          <div className="text-[17px] leading-[1.9] text-charcoal/80 space-y-5">
            <p>My first business was a sawmill. I learned what it means to build something from nothing—the early mornings, the cashflow stress, the weight of making it work when everything depends on you.</p>
            <p>After a decade as a business owner, I transitioned into web design. Then digital marketing. Then brand strategy.</p>
            <p>Each shift came from the same realization: <span className="text-teal font-medium">there was always something deeper missing.</span></p>
            <p>Clients would come to me for a website. Then they&apos;d need traffic—so I learned digital marketing. But the marketing wouldn&apos;t work the way it should. Something was off.</p>
            <p>That&apos;s when it clicked.</p>
            <p>The website wasn&apos;t the problem. The ads weren&apos;t the problem. <strong className="text-charcoal font-semibold">The foundation was the problem.</strong></p>
            <p>Brand. Message. Positioning. Offer. When those aren&apos;t aligned, no tactic will save you. When they are, everything compounds.</p>
            <p>That insight changed everything. I spent the next decade running a full-fledged media agency, refining my approach, and helping businesses grow—not with more noise, but with more clarity.</p>
            <p>Now, through Mana Marketing, I help founder-led brands build the systems they need to grow without the chaos.</p>
          </div>
        </div>
      </section>

      {/* ─── Why I Do This ─── */}
      <section className="bg-dark py-24 px-6">
        <div className="max-w-[780px] mx-auto">
          <div className="text-[11px] font-semibold text-gold tracking-[0.18em] uppercase mb-4">
            Why I do this
          </div>
          <h2 className="font-serif text-[clamp(28px,4vw,40px)] font-bold text-cream leading-[1.2] mb-6">
            Every founder has a calling.
          </h2>
          <div className="text-[17px] leading-[1.9] text-cream/[0.78] space-y-5">
            <p>Not just a business—a calling. Something they were made to do. Something that, when it works, creates ripple effects far beyond revenue.</p>
            <p>Families strengthened. Teams employed. Communities impacted.</p>
            <p>But too many capable founders get stuck. Not because they lack talent—<strong className="text-cream">because they lack a system.</strong> They grind in the dark, hoping the next tactic finally works.</p>
            <p>I&apos;ve been there. I know the weight.</p>
            <p>My mission is simple: help founders find clarity so they can live out their calling through business.</p>
          </div>

          <div className="bg-dark rounded-xl p-10 max-md:p-7 my-10 border-l-4 border-gold">
            <p className="font-serif text-[20px] italic text-cream/85 leading-[1.6]">
              &ldquo;And personally? I&apos;m building toward funding an orphanage. Every business I help grow gets me one step closer.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* ─── How I Think ─── */}
      <section className="bg-cream-warm py-24 px-6">
        <div className="max-w-[780px] mx-auto">
          <div className="text-[11px] font-semibold text-teal tracking-[0.18em] uppercase mb-4">
            How I think
          </div>
          <h2 className="font-serif text-[clamp(28px,4vw,40px)] font-bold text-charcoal leading-[1.2] mb-6">
            I question everything.
          </h2>
          <div className="text-[17px] leading-[1.9] text-charcoal/80 space-y-5">
            <p>Every &ldquo;best practice.&rdquo; Every trend. Every guru promise.</p>
            <p>Then I hold on to what actually works—the proven principles behind growth—and help founders implement them with structure and simplicity.</p>
            <p><strong className="text-charcoal font-semibold">No fluff. No hype. Just systems that work.</strong></p>
            <p>I&apos;m a strategist at heart. I see the patterns most people miss. And I believe complexity kills growth—clarity builds it.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            {[
              {
                title: 'Foundation First',
                desc: "Tactics fail without strategy. I always start with the foundation—brand, positioning, message—before building anything else.",
              },
              {
                title: 'Clarity Over Complexity',
                desc: 'The best solutions are simple. I cut through noise to find what actually matters and make it actionable.',
              },
              {
                title: 'Systems Over Tactics',
                desc: "One-off wins don't compound. I build systems your team can run—so growth becomes inevitable, not accidental.",
              },
              {
                title: 'Truth Over Comfort',
                desc: "I'll tell you what you need to hear, not what you want to hear. Honesty is how we get results.",
              },
            ].map((value, i) => (
              <div key={i} className="bg-white rounded-[10px] p-8 border border-teal/[0.08]">
                <h3 className="font-serif text-[18px] font-bold text-teal mb-2.5">{value.title}</h3>
                <p className="text-[15px] text-charcoal/70 leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── A Bit More About Me ─── */}
      <section className="bg-dark-light py-24 px-6">
        <div className="max-w-[780px] mx-auto">
          <div className="text-[11px] font-semibold text-gold tracking-[0.18em] uppercase mb-4">
            A bit more about me
          </div>
          <h2 className="font-serif text-[clamp(28px,4vw,40px)] font-bold text-cream leading-[1.2] mb-6">
            The person behind the strategy.
          </h2>

          <div className="bg-dark-light rounded-xl p-10 max-md:p-7 border border-teal/[0.12]">
            <div className="text-[16px] text-cream/75 leading-[1.8] space-y-4">
              <p>I hold an <strong className="text-cream">honours degree in theology.</strong> My faith shapes how I see business—not as an end in itself, but as a vehicle for purpose and impact.</p>
              <p>When I&apos;m not building systems or advising clients, you&apos;ll find me on the <strong className="text-cream">golf course</strong> or <strong className="text-cream">fishing in the ocean.</strong> I&apos;m a bit of a workaholic—but only because I love what I do.</p>
              <p>I live in the <strong className="text-cream">Lowveld region of South Africa</strong> with my wife, who runs operations at Mana. We&apos;re a small team by design—intentional, focused, and committed to the founders we serve.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── The Team ─── */}
      <section className="bg-cream py-24 px-6">
        <div className="max-w-[1060px] mx-auto">
          <div className="text-center mb-10">
            <div className="text-[11px] font-semibold text-teal tracking-[0.18em] uppercase mb-4">
              The team
            </div>
            <h2 className="font-serif text-[clamp(28px,4vw,40px)] font-bold text-charcoal leading-[1.2]">
              Small by design. Focused by choice.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {[
              {
                initials: 'WS',
                name: 'Wollie Steenkamp',
                role: 'Founder & Strategist',
                desc: 'Brand strategy, systems design, and client consulting. The one asking "why" until everything aligns.',
              },
              {
                initials: 'MS',
                name: 'Operations Manager',
                role: 'Operations',
                desc: 'Keeps everything running. Onboarding, project management, and making sure nothing falls through the cracks.',
              },
              {
                initials: 'GD',
                name: 'Graphic Designer',
                role: 'Design',
                desc: 'Visual identity, brand assets, and making strategy look as good as it works.',
              },
            ].map((member, i) => (
              <div key={i} className="text-center">
                <div className="w-[100px] h-[100px] rounded-full bg-dark-light mx-auto mb-5 flex items-center justify-center border-[3px] border-teal font-serif text-[32px] font-bold text-teal">
                  {member.initials}
                </div>
                <h3 className="font-serif text-[18px] font-bold text-charcoal mb-1">{member.name}</h3>
                <p className="text-sm text-stone mb-3">{member.role}</p>
                <p className="text-sm text-charcoal/70 leading-relaxed">{member.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="bg-dark py-28 md:py-32 px-6 relative overflow-hidden text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(30,107,99,0.1)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative z-10 max-w-[780px] mx-auto">
          <h2 className="font-serif text-[clamp(30px,4.5vw,44px)] font-bold text-cream leading-[1.2] mb-5">
            Let&apos;s build something that works.
          </h2>
          <p className="text-[17px] text-cream/70 max-w-[480px] mx-auto mb-9">
            If you&apos;re a founder who&apos;s done guessing and ready for clarity, I&apos;d be honored to help.
          </p>
          <Link
            href="/apply"
            className="inline-flex items-center px-10 py-3.5 rounded-md text-[16px] font-semibold bg-gold text-dark hover:bg-gold-light hover:-translate-y-px transition-all"
          >
            Apply for SkaleFlow
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}
