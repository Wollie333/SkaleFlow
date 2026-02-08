'use client';

import { useState } from 'react';
import { MarketingNav } from '@/components/marketing/nav';
import { MarketingFooter } from '@/components/marketing/footer';
import { Hero } from '@/components/marketing/hero';
import Link from 'next/link';

function FAQItem({ question, answer, defaultOpen = false }: { question: string; answer: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-teal/10 py-7 first:pt-0 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center text-left font-serif text-[19px] font-bold text-charcoal cursor-pointer group"
      >
        {question}
        <span className="text-teal text-[22px] font-light flex-shrink-0 ml-4 transition-transform">
          {open ? '−' : '+'}
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-400 ${open ? 'max-h-[400px] mt-3' : 'max-h-0'}`}
      >
        <div className="text-[15px] text-[#666] leading-relaxed space-y-4">
          {answer}
        </div>
      </div>
    </div>
  );
}

export default function SkaleFlowPage() {
  return (
    <>
      <MarketingNav />

      {/* ─── Hero ─── */}
      <Hero
        fullHeight
        label="SkaleFlow™ — Strategic Growth System"
        title="The goal isn't just growth. It's peace, security, and purpose."
        subtitle=""
      >
        <ul className="space-y-2 mb-7">
          {[
            'Clarity on exactly what to do next',
            'A brand that attracts the right clients',
            'A system that works without the chaos',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-[16px] text-cream/75">
              <span className="mt-2 w-2 h-2 rounded-full bg-teal flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-[17px] text-cream/85 max-w-[580px] leading-relaxed mb-5">
          SkaleFlow is the strategic growth system for founder-led brands who are done guessing and ready to build something that actually works.
        </p>
        <p className="text-sm text-stone mb-9">
          For founders with teams of 3–10 who&apos;ve built something real—but growth has stalled and marketing feels like a gamble.
        </p>
        <div className="flex flex-wrap gap-3.5">
          <Link
            href="/apply"
            className="inline-flex items-center px-7 py-3 rounded-md text-sm font-semibold bg-gold text-dark hover:bg-gold-light hover:-translate-y-px transition-all tracking-wide"
          >
            Apply for SkaleFlow
          </Link>
          <a
            href="#how"
            className="inline-flex items-center px-7 py-3 rounded-md text-sm font-semibold border border-cream/25 text-cream hover:border-cream/50 hover:-translate-y-px transition-all tracking-wide"
          >
            See How It Works
          </a>
        </div>
      </Hero>

      {/* ─── S2: Story ─── */}
      <section className="bg-dark py-24 px-6">
        <div className="max-w-[780px] mx-auto">
          <div className="text-[11px] font-semibold text-gold tracking-[0.18em] uppercase mb-4">
            The truth nobody tells you
          </div>
          <h2 className="font-serif text-[clamp(28px,4vw,42px)] font-bold text-cream leading-[1.2] mb-6">
            You&apos;ve built something real.<br />So why does it feel like it&apos;s breaking?
          </h2>
          <div className="text-[17px] leading-[1.85] text-cream/80 space-y-5">
            <p>Revenue is coming in. You have a team counting on you. From the outside, it looks like it&apos;s working.</p>
            <p>But you know the truth.</p>
            <p>Growth has flatlined. Marketing feels like guesswork. You&apos;re spending money on tactics that should work—but don&apos;t.</p>
            <p>You&apos;ve posted more. Tried the ads. Maybe even hired an agency. And still… <strong className="text-cream font-semibold">nothing moves the needle.</strong></p>
            <p>You watch competitors grow while you stay stuck. You wonder what they know that you don&apos;t.</p>
            <p>And it&apos;s not just about you anymore.</p>
            <p>You&apos;ve got <span className="text-gold font-medium">people depending on this.</span> Team members with families. A business that needs to keep moving forward. The weight of that responsibility isn&apos;t something you can just shake off.</p>
            <p>You&apos;ve invested before. Agencies. Courses. Consultants. Some helped a little. Most didn&apos;t. And every time, you walked away wondering if <span className="text-gold font-medium">you</span> were the problem.</p>
            <p>You&apos;re not afraid of spending money. You&apos;re afraid of wasting it again.</p>
            <p>So you hold back. Try to figure it out yourself. Keep grinding.</p>
            <p>But deep down you know—more of the same won&apos;t get you where you need to go.</p>
          </div>
        </div>
      </section>

      {/* ─── S3: Enemy ─── */}
      <section className="bg-cream py-24 px-6">
        <div className="max-w-[780px] mx-auto">
          <div className="text-[11px] font-semibold text-teal tracking-[0.18em] uppercase mb-4">
            It&apos;s not you. It never was.
          </div>
          <h2 className="font-serif text-[clamp(28px,4vw,42px)] font-bold text-charcoal leading-[1.2] mb-6">
            The advice was broken.
          </h2>
          <div className="max-w-[640px] space-y-5">
            <p className="text-[17px] text-[#555]">The tactics weren&apos;t wrong. The timing was.</p>
            <p className="text-[17px] text-[#555]">You can&apos;t scale a business on a broken foundation. No amount of ads, content, or agency retainers will fix a message that doesn&apos;t resonate or a brand that blends in.</p>
            <p className="text-[17px] text-[#555]">The Snake Oil Gurus didn&apos;t fail you because you weren&apos;t smart enough to see through them. They failed you because they sold solutions for problems you didn&apos;t actually have.</p>
            <p className="text-[17px] text-[#555]">They gave you tactics when you needed clarity. Execution when you needed strategy. Band-aids when you needed surgery.</p>
          </div>

          <div className="py-7 px-8 bg-dark rounded-[10px] my-9 max-w-[500px]">
            <p className="font-serif text-[18px] text-cream/60 leading-[1.8]">
              &ldquo;Just post more.&rdquo;<br />
              &ldquo;Run paid ads.&rdquo;<br />
              &ldquo;Get a new logo.&rdquo;<br />
              &ldquo;Hire an agency.&rdquo;
            </p>
          </div>

          <div className="max-w-[640px] space-y-5">
            <p className="text-[17px] text-[#555]">None of it was going to work—because <strong className="text-charcoal">the foundation was never right.</strong></p>
            <p className="text-[17px] text-[#555]">And the cost wasn&apos;t just money. It was momentum. Confidence. Trust in outside help.</p>
          </div>
        </div>
      </section>

      {/* ─── S4: Pain / Benefit ─── */}
      <section className="bg-cream-warm py-24 px-6">
        <div className="max-w-[780px] mx-auto">
          <div className="text-[11px] font-semibold text-teal tracking-[0.18em] uppercase mb-4">
            What you actually need
          </div>
          <h2 className="font-serif text-[clamp(28px,4vw,42px)] font-bold text-charcoal leading-[1.2] mb-12">
            Six problems. One system.
          </h2>

          {[
            {
              label: 'Pain → Clarity',
              title: '"I don\'t know what to do next."',
              paragraphs: [
                'What if you woke up tomorrow knowing exactly what to do? Not guessing. Not hoping. Knowing.',
                "Clarity isn't a luxury—it's the difference between spinning your wheels and moving forward. When you know who you are, who you serve, and what you stand for, every decision becomes easier.",
              ],
            },
            {
              label: 'Pain → Positioning',
              title: '"I\'m invisible in my market."',
              paragraphs: [
                "Right now, you're one of many. A commodity. Competing on price because nobody can see what makes you different.",
                'But what if you became the obvious choice? Not through hype—but because your message was so clear that choosing you felt like the only logical decision?',
              ],
            },
            {
              label: 'Pain → Alignment',
              title: '"I get leads, but they don\'t convert."',
              paragraphs: [
                "Bad leads aren't a traffic problem. They're an alignment problem.",
                'When everything aligns—your brand, your message, your offer—the right people find you. And they arrive ready to buy.',
              ],
            },
            {
              label: 'Pain → System',
              title: '"My business can\'t function without me."',
              paragraphs: [
                "You're the bottleneck. Every decision runs through you. If you step away, things fall apart.",
                "A system changes that. Not by replacing you—but by multiplying you. When your team follows a clear playbook, you get your time back.",
              ],
            },
            {
              label: 'Pain → Peace',
              title: '"I\'m exhausted and anxious."',
              paragraphs: [
                "The goal isn't just growth. It's peace.",
                "Imagine checking your phone without dread. Opening your laptop without that tight feeling in your chest. That's what happens when the foundation is right.",
              ],
            },
            {
              label: 'Pain → Trust',
              title: '"I\'ve been burned before."',
              paragraphs: [
                "You've paid for help before. Agencies that promised leads and delivered invoices. Gurus who disappeared after the sale.",
                "SkaleFlow isn't a tactic. It's a complete system—built for you. You don't walk away hoping it works. You walk away knowing exactly how to use it.",
              ],
            },
          ].map((item, i) => (
            <div
              key={i}
              className="border-l-[3px] border-teal pl-8 py-8 mb-12 last:mb-0"
            >
              <div className="font-serif text-[13px] font-bold text-gold tracking-[0.1em] uppercase mb-1.5">
                {item.label}
              </div>
              <div className="font-serif text-[clamp(20px,3vw,26px)] font-bold text-charcoal mb-4 leading-[1.3]">
                {item.title}
              </div>
              {item.paragraphs.map((p, j) => (
                <p key={j} className="text-[16px] text-[#555] leading-relaxed mb-4 last:mb-0">
                  {p}
                </p>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ─── S5: Guide ─── */}
      <section className="bg-dark py-24 px-6">
        <div className="max-w-[780px] mx-auto">
          <div className="text-[11px] font-semibold text-gold tracking-[0.18em] uppercase mb-4">
            Meet your guide
          </div>
          <h2 className="font-serif text-[clamp(28px,4vw,42px)] font-bold text-cream leading-[1.2] mb-6">
            So why me?
          </h2>

          <div className="bg-dark-light rounded-xl p-12 md:p-12 max-md:p-7 border border-teal/15 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal to-gold" />
            <div className="text-[17px] text-cream/80 leading-[1.8] space-y-5">
              <p>Because I&apos;ve been where you are.</p>
              <p>I know what it&apos;s like to grind with nothing to show for it. To question yourself. To wonder if it&apos;s ever going to work.</p>
              <p>I&apos;ve built businesses from chaos to clarity. I&apos;ve helped founders grow to <strong className="text-cream">R300M+ in annual revenue.</strong> I&apos;ve seen what works—and what doesn&apos;t.</p>
              <p>And I built SkaleFlow because I got tired of watching good founders fail because of bad advice.</p>
              <p>Too many capable people stuck—not because they lack talent, but because they lack a system.</p>
              <p>I believe if you have the clarity to see the path and the system to walk it, <strong className="text-cream">you&apos;ll win.</strong></p>
              <p>My job is to give you both.</p>
            </div>
            <div className="mt-7 pt-6 border-t border-teal/15">
              <p className="text-sm text-stone">
                <strong className="text-gold">Wollie Steenkamp</strong> — Founder &amp; Strategist, Mana Marketing<br />
                20+ years building businesses. From sawmill owner to brand strategist.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── S6: Path / How It Works ─── */}
      <section id="how" className="bg-cream py-24 px-6">
        <div className="max-w-[1060px] mx-auto">
          <div className="text-center max-w-[600px] mx-auto mb-10">
            <div className="text-[11px] font-semibold text-teal tracking-[0.18em] uppercase mb-4">
              How SkaleFlow works
            </div>
            <h2 className="font-serif text-[clamp(28px,4vw,42px)] font-bold text-charcoal leading-[1.2] mb-4">
              Three phases. One complete system.
            </h2>
            <p className="text-[16px] text-[#666]">
              SkaleFlow isn&apos;t a course. It&apos;s not a template. It&apos;s a complete system—built with you, for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {[
              {
                num: '01',
                title: 'Brand Clarity',
                desc: "We define who you are, who you serve, and why you matter. No more confusion. No more competing on price. You walk away knowing exactly what to say—and who to say it to.",
              },
              {
                num: '02',
                title: 'Website That Converts',
                desc: "We build a presence that earns trust and drives action. Not a brochure. A conversion system—designed to turn visitors into leads and leads into clients.",
              },
              {
                num: '03',
                title: 'Growth System',
                desc: "We create a clear plan to attract, convert, and scale. Content strategy. Messaging framework. Everything aligned so your marketing compounds instead of scatters.",
              },
            ].map((phase) => (
              <div
                key={phase.num}
                className="bg-white rounded-[10px] p-9 border border-teal/10 transition-all hover:-translate-y-[3px] hover:shadow-[0_12px_40px_rgba(15,31,29,0.08)]"
              >
                <div className="font-serif text-[48px] font-extrabold text-teal/10 leading-none mb-3">
                  {phase.num}
                </div>
                <h3 className="font-serif text-[22px] font-bold text-charcoal mb-3">
                  {phase.title}
                </h3>
                <p className="text-[15px] text-[#666]">{phase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── S7: Value / What's Included ─── */}
      <section className="bg-cream-warm py-24 px-6">
        <div className="max-w-[780px] mx-auto">
          <div className="text-[11px] font-semibold text-teal tracking-[0.18em] uppercase mb-4">
            What&apos;s included
          </div>
          <h2 className="font-serif text-[clamp(28px,4vw,42px)] font-bold text-charcoal leading-[1.2] mb-4">
            Everything built. Everything ready to use.
          </h2>
          <p className="text-[16px] text-[#666] mb-9">
            This isn&apos;t a strategy session that leaves you with a PDF and a pat on the back.
          </p>

          {[
            {
              title: 'Complete Strategic Guide',
              desc: 'Your playbook for every marketing decision. All documented so you—and your team—can execute with confidence.',
            },
            {
              title: 'Conversion-Focused Website',
              desc: "Fully designed and built. Not a template—a custom presence that positions you as the leader and turns visitors into leads.",
            },
            {
              title: 'Brand Identity',
              desc: "Logo, visual system, and brand guidelines that make you look like the category leader you're becoming.",
            },
            {
              title: 'Messaging Framework',
              desc: 'The exact words that attract your dream clients and repel the wrong ones. Use it everywhere.',
            },
            {
              title: 'Content Plan & Editorial Calendar',
              desc: 'What to say. When to say it. Where to say it. A clear roadmap so marketing stops feeling like guesswork.',
            },
            {
              title: 'Guided Implementation',
              desc: "We don't hand you a system and disappear. You get training on how to use everything—and how to teach your team to run it without you.",
            },
          ].map((item, i) => (
            <div key={i} className="py-7 border-b border-teal/10 first:pt-0 last:border-b-0">
              <h4 className="font-serif text-[20px] font-bold text-charcoal mb-2">{item.title}</h4>
              <p className="text-[15px] text-[#666]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── S8: Transformation ─── */}
      <section className="bg-cream py-24 px-6">
        <div className="max-w-[1060px] mx-auto">
          <div className="text-center mb-8">
            <div className="text-[11px] font-semibold text-teal tracking-[0.18em] uppercase mb-4">
              The transformation
            </div>
            <h2 className="font-serif text-[clamp(28px,4vw,42px)] font-bold text-charcoal leading-[1.2]">
              Before &amp; after SkaleFlow
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 rounded-xl overflow-hidden">
            {/* Before */}
            <div className="bg-charcoal p-10 max-md:p-7">
              <h3 className="text-[16px] font-semibold text-stone tracking-[0.1em] uppercase mb-6">
                Before
              </h3>
              <ul className="space-y-4">
                {[
                  'Confused about what to do next',
                  'Invisible in your market',
                  'Attracting leads that don\'t convert',
                  'Competing on price',
                  'Business depends entirely on you',
                  'Overwhelmed, anxious, and tired',
                  'Team waiting on you for every decision',
                ].map((item, i) => (
                  <li key={i} className="text-[15px] text-cream/70 pl-5 relative">
                    <span className="absolute left-0 text-[#666] font-bold">&times;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* After */}
            <div className="bg-teal p-10 max-md:p-7">
              <h3 className="text-[16px] font-semibold text-gold tracking-[0.1em] uppercase mb-6">
                After
              </h3>
              <ul className="space-y-4">
                {[
                  'Clear direction—you know exactly what to do',
                  'Positioned as the obvious choice',
                  'Quality leads that arrive ready to buy',
                  "Premium pricing because you're worth it",
                  'A system your team can run without you',
                  'Peace, security, and purpose',
                  "A business you're proud to lead",
                ].map((item, i) => (
                  <li key={i} className="text-[15px] text-cream pl-5 relative">
                    <span className="absolute left-0 text-gold font-bold">&#10003;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── S9: Proof ─── */}
      <section className="bg-cream-warm py-24 px-6">
        <div className="max-w-[780px] mx-auto">
          <div className="text-[11px] font-semibold text-teal tracking-[0.18em] uppercase mb-4">
            Proof it works
          </div>
          <h2 className="font-serif text-[clamp(28px,4vw,42px)] font-bold text-charcoal leading-[1.2] mb-6">
            From R0 to R291K in 12 months—part-time.
          </h2>

          <div className="bg-white rounded-xl p-12 max-md:p-7 border border-teal/[0.08]">
            <p className="text-sm text-stone mb-1.5">Case Study</p>
            <h3 className="font-serif text-[clamp(22px,3vw,30px)] font-bold text-charcoal mb-2">
              Wholistic Mental Health Care
            </h3>
            <p className="text-[15px] text-[#666]">
              Started from zero. No clients. No marketing system. No big budget. Just a clear brand, the right positioning, and a simple strategy.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8 py-7 border-t border-b border-teal/10">
              {[
                { value: 'R291K', label: 'Total revenue in 12 months' },
                { value: '73%', label: 'Client retention rate' },
                { value: '85%+', label: 'Revenue from organic growth' },
              ].map((stat, i) => (
                <div key={i}>
                  <div className="font-serif text-[28px] font-bold text-teal leading-[1.2]">
                    {stat.value}
                  </div>
                  <div className="text-[13px] text-stone mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            <p className="text-[15px] text-[#666] mb-6">
              Not by throwing money at ads. By getting the foundation right first: clear brand positioning, messaging that attracted aligned clients, a website that converted, and consistent organic content with purpose.
            </p>

            <div className="font-serif italic text-[20px] text-teal text-center py-6 leading-[1.5]">
              &ldquo;Complexity kills growth. Clarity builds trust—and trust drives revenue.&rdquo;
            </div>

            <div className="bg-cream-warm rounded-lg p-6 mt-2">
              <p className="text-[15px] text-[#555]">
                <strong className="text-charcoal">Now imagine what&apos;s possible for your business.</strong> You&apos;re not starting from zero. You already have revenue, a team, and years of experience. What happens when you add the same clarity and system to a business that&apos;s already running?
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── S10: Stakes ─── */}
      <section className="bg-dark py-24 px-6">
        <div className="max-w-[780px] mx-auto">
          <div className="text-[11px] font-semibold text-gold tracking-[0.18em] uppercase mb-4">
            The cost of staying stuck
          </div>
          <h2 className="font-serif text-[clamp(28px,4vw,42px)] font-bold text-cream leading-[1.2] mb-6">
            If nothing changes,<br />nothing changes.
          </h2>
          <div className="text-[18px] leading-[1.85] text-cream/80 max-w-[640px] space-y-5">
            <p>You&apos;ve already proven you can build something.</p>
            <p>The question is: what happens if you don&apos;t change course?</p>
            <p>Another year of marketing that feels random. Another year of good revenue but stalled growth. Another year of carrying the weight while your team waits for direction.</p>
            <p>Your competitors aren&apos;t standing still. The ones with clarity—with a real system—they&apos;re pulling ahead. Not because they work harder. <strong className="text-cream">Because they work aligned.</strong></p>
            <p>Every month without a system is a month of wasted effort. Scattered tactics. Money spent without return.</p>
            <p>At some point, staying stuck costs more than moving forward.</p>
            <p><strong className="text-cream">How much longer can you afford to wait?</strong></p>
          </div>
        </div>
      </section>

      {/* ─── S11: Future ─── */}
      <section className="bg-dark-light py-24 px-6">
        <div className="max-w-[780px] mx-auto">
          <div className="text-[11px] font-semibold text-gold tracking-[0.18em] uppercase mb-4">
            What&apos;s possible
          </div>
          <h2 className="font-serif text-[clamp(28px,4vw,42px)] font-bold text-cream leading-[1.2] mb-6">
            Imagine this…
          </h2>
          <div className="text-[18px] leading-[1.85] text-cream/80 space-y-5">
            <p>Twelve months from now. Your brand is recognized. Your message cuts through. Leads come in—qualified ones who already trust you before the first call.</p>
            <p>Your team isn&apos;t waiting for you to make every decision. They have a playbook. They know the strategy. They execute while you lead.</p>
            <p>You&apos;re not grinding anymore. You&apos;re growing. On purpose.</p>
            <p>Clients find you—not because you screamed the loudest, but because you&apos;re the obvious choice in your market.</p>
            <p>You check your phone without dread. You open your laptop without that tight feeling in your chest.</p>
            <p><span className="text-gold font-medium">Peace. Security. Purpose.</span></p>
            <p>A business you&apos;re proud to lead—one that gives back instead of just taking.</p>
            <p>That&apos;s not luck. That&apos;s what happens when the foundation is built right.</p>
          </div>
        </div>
      </section>

      {/* ─── S12: For / Not For ─── */}
      <section className="bg-cream py-24 px-6">
        <div className="max-w-[1060px] mx-auto">
          <div className="text-center mb-8">
            <div className="text-[11px] font-semibold text-teal tracking-[0.18em] uppercase mb-4">
              Is this for you?
            </div>
            <h2 className="font-serif text-[clamp(28px,4vw,42px)] font-bold text-charcoal leading-[1.2]">
              Honest qualification.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-9 rounded-[10px] border border-teal/15">
              <h3 className="text-[18px] font-semibold text-teal mb-5">This is for you if:</h3>
              <ul className="space-y-3">
                {[
                  "You've built a business generating revenue—but growth has stalled",
                  'You have a team (3–10 people) who depend on this business',
                  "You've invested in marketing before and been disappointed",
                  "You're not looking for a quick fix—you want a system that lasts",
                  "You're ready to do the work, you just need the right direction",
                ].map((item, i) => (
                  <li key={i} className="text-[15px] text-[#555] pl-6 relative">
                    <span className="absolute left-0 text-teal font-bold">&#10003;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-cream-warm p-9 rounded-[10px] border border-charcoal/[0.08]">
              <h3 className="text-[18px] font-semibold text-stone mb-5">This is NOT for you if:</h3>
              <ul className="space-y-3">
                {[
                  "You're just starting out with no revenue or traction yet",
                  'You want someone to "do it all" without your involvement',
                  "You're looking for magic—overnight results, viral hacks, or shortcuts",
                  "You're not willing to invest seriously in your business's foundation",
                ].map((item, i) => (
                  <li key={i} className="text-[15px] text-[#555] pl-6 relative">
                    <span className="absolute left-0 text-stone font-bold">&times;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── S13: FAQ ─── */}
      <section className="bg-cream-warm py-24 px-6">
        <div className="max-w-[780px] mx-auto">
          <div className="text-[11px] font-semibold text-teal tracking-[0.18em] uppercase mb-4">
            Common questions
          </div>
          <h2 className="font-serif text-[clamp(28px,4vw,42px)] font-bold text-charcoal leading-[1.2] mb-9">
            Straight answers.
          </h2>

          <FAQItem
            question={'"This feels like a big investment."'}
            defaultOpen
            answer={
              <>
                <p>It is. And it should be. You&apos;re not buying a tactic—you&apos;re building the foundation your business will run on for years.</p>
                <p>The real question isn&apos;t &ldquo;can I afford this?&rdquo; It&apos;s &ldquo;what&apos;s it costing me to keep going without it?&rdquo;</p>
              </>
            }
          />
          <FAQItem
            question={'"How do I know this will work?"'}
            answer={
              <>
                <p>SkaleFlow fixes the foundation first. That&apos;s why other tactics failed—they were built on sand. This is bedrock.</p>
                <p>When your brand is clear and your system is built for conversion, marketing stops being a gamble. It starts compounding.</p>
              </>
            }
          />
          <FAQItem
            question={'"What makes you different from other agencies?"'}
            answer={
              <>
                <p>We don&apos;t sell tactics. We build systems.</p>
                <p>Most agencies want to run your ads or manage your content—forever. We want to build your foundation and hand you the keys.</p>
              </>
            }
          />
          <FAQItem
            question={'"How long does it take?"'}
            answer={
              <p>Depending on the tier, SkaleFlow takes between 6–12 weeks. You&apos;ll have clear deliverables at each phase—not months of &ldquo;strategy&rdquo; with nothing to show for it.</p>
            }
          />
          <FAQItem
            question={'"I\'ve been burned before."'}
            answer={
              <p>Understandable. That&apos;s exactly why we built SkaleFlow the way we did. No fluff. No vague promises. Just a system—phase by phase, deliverable by deliverable.</p>
            }
          />
          <FAQItem
            question={'"What if it doesn\'t work for my industry?"'}
            answer={
              <p>The principles behind SkaleFlow—clarity, positioning, messaging, conversion—are universal. We&apos;ve applied them across industries from counselling to manufacturing. The system adapts to your market.</p>
            }
          />
        </div>
      </section>

      {/* ─── S14: Final CTA ─── */}
      <section className="bg-dark py-28 md:py-32 px-6 relative overflow-hidden text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(30,107,99,0.1)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative z-10 max-w-[780px] mx-auto">
          <h2 className="font-serif text-[clamp(32px,5vw,50px)] font-bold text-cream leading-[1.15] mb-5">
            You&apos;ve fought long enough.
          </h2>
          <p className="text-[17px] text-cream/70 max-w-[520px] mx-auto mb-9">
            You&apos;ve proven you can grind. You&apos;ve proven you can build. You&apos;ve proven you can carry the weight. Now it&apos;s time to build something that actually works.
          </p>
          <Link
            href="/apply"
            className="inline-flex items-center px-10 py-3.5 rounded-md text-[16px] font-semibold bg-gold text-dark hover:bg-gold-light hover:-translate-y-px transition-all"
          >
            Apply for SkaleFlow
          </Link>
          <p className="text-sm text-stone mt-5">
            This is an application. Not everyone is accepted.<br />
            We only work with founders who are ready to do the work and build something that lasts.
          </p>
        </div>
      </section>

      {/* ─── S15: Founder Note ─── */}
      <section className="bg-dark-light py-20 px-6 border-t border-teal/10">
        <div className="max-w-[640px] mx-auto text-[17px] text-cream/[0.78] leading-[1.85] space-y-5">
          <p>I&apos;ll be honest with you.</p>
          <p>I don&apos;t take every client. I can&apos;t. SkaleFlow only works if you&apos;re willing to do the work.</p>
          <p>But if you&apos;re the kind of founder who&apos;s been grinding in the dark and just needs someone to turn on the light—I&apos;d be honored to help.</p>
          <p>I&apos;ve seen too many good people fail because of bad advice. Too many capable founders stuck—not because they lack talent, but because they lack a system.</p>
          <p><strong className="text-cream">You&apos;ve built something worth protecting.</strong> You&apos;ve got a team counting on you. And you weren&apos;t made to stay stuck.</p>
          <p>Let&apos;s build something that works.</p>
          <div className="font-serif italic text-[22px] text-gold mt-9">
            — Wollie
          </div>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}
