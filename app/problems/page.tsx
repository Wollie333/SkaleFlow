import { MarketingNav } from '@/components/marketing/nav';
import { MarketingFooter } from '@/components/marketing/footer';
import { Hero } from '@/components/marketing/hero';
import Link from 'next/link';

const painPoints = [
  {
    number: '01',
    quote: '\u201cI don\u2019t know what to do next.\u201d',
    body: [
      'You\u2019ve tried everything \u2014 courses, coaches, ads, funnels. But nothing sticks. Every Monday feels like starting from zero because there\u2019s no real plan holding it all together.',
      'You\u2019re not lazy. You\u2019re overwhelmed. And without clarity, even hard work feels wasted.',
    ],
    solutionIntro: 'What you actually need:',
    solutionText:
      'A clear, prioritised growth system that tells you exactly what to focus on \u2014 and what to ignore. No fluff. No guesswork.',
  },
  {
    number: '02',
    quote: '\u201cI\u2019m invisible in my market.\u201d',
    body: [
      'You know you\u2019re good at what you do \u2014 but your market doesn\u2019t. You\u2019re being commoditised, compared to cheaper competitors, and forced to compete on price.',
      'The problem isn\u2019t your skill. It\u2019s your positioning. When everyone looks the same, nobody stands out.',
    ],
    solutionIntro: 'What you actually need:',
    solutionText:
      'A brand strategy and positioning framework that makes you the obvious choice \u2014 so you attract premium clients instead of chasing them.',
  },
  {
    number: '03',
    quote: '\u201cI get leads, but they don\u2019t convert.\u201d',
    body: [
      'You\u2019re generating interest, but it\u2019s the wrong kind. Tyre-kickers, price-shoppers, and people who ghost after the first call.',
      'It\u2019s not a traffic problem. It\u2019s a trust and qualification problem \u2014 your pipeline isn\u2019t filtering for fit.',
    ],
    solutionIntro: 'What you actually need:',
    solutionText:
      'A conversion system that pre-qualifies, nurtures, and warms your leads before you ever get on a call \u2014 so you only speak to people who are ready to buy.',
  },
  {
    number: '04',
    quote: '\u201cMy business can\u2019t function without me.\u201d',
    body: [
      'You\u2019re the bottleneck. Every decision, every client, every fire \u2014 it all flows through you. You built the business, but now it owns you.',
      'Growth shouldn\u2019t mean more hours. It should mean better systems.',
    ],
    solutionIntro: 'What you actually need:',
    solutionText:
      'Operational systems, automations, and delegation frameworks that let your business run without you being in every meeting and every inbox.',
  },
  {
    number: '05',
    quote: '\u201cI\u2019m exhausted and anxious.\u201d',
    body: [
      'This isn\u2019t normal tired. It\u2019s soul-tired. The kind that doesn\u2019t go away with a holiday. You carry the weight of your business everywhere \u2014 in the shower, at dinner, at 3am.',
      'You started this for freedom. But right now it feels like a trap.',
    ],
    solutionIntro: 'What you actually need:',
    solutionText:
      'A partner who takes real ownership of growth \u2014 so you can stop carrying everything alone and start building a business that gives back more than it takes.',
  },
  {
    number: '06',
    quote: '\u201cI\u2019ve been burned before.\u201d',
    body: [
      'Bad agencies. Empty promises. Fancy decks with zero results. You\u2019ve spent money on \u201cexperts\u201d who disappeared the moment the invoice cleared.',
      'You\u2019re not sceptical because you\u2019re difficult. You\u2019re cautious because you\u2019ve been let down. That\u2019s fair.',
    ],
    solutionIntro: 'What you actually need:',
    solutionText:
      'A transparent, accountable system with clear deliverables, real reporting, and a team that treats your business like their own.',
  },
];

function ArrowIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      className="w-[18px] h-[18px]"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 8l4 4m0 0l-4 4m4-4H3"
      />
    </svg>
  );
}

export default function ProblemsPage() {
  return (
    <>
      <MarketingNav />

      <Hero
        label="Problems We Solve"
        title="Sound familiar?"
        subtitle="These are the problems we solve for founder-led brands every day."
      />

      {/* Pain Point Blocks */}
      {painPoints.map((point, index) => (
        <section
          key={point.number}
          className={`${
            index % 2 === 0 ? 'bg-cream' : 'bg-cream-warm'
          } py-20 border-b border-teal/[0.08]`}
        >
          <div className="max-w-[780px] mx-auto px-6">
            {/* Big faded number */}
            <div className="font-serif text-[64px] md:text-[64px] font-extrabold text-teal/[0.08] leading-none mb-4">
              {point.number}
            </div>

            {/* Quote heading */}
            <h2 className="font-serif text-[clamp(24px,3.5vw,34px)] font-bold text-dark mb-6">
              {point.quote}
            </h2>

            {/* Body paragraphs */}
            {point.body.map((paragraph, pIndex) => (
              <p
                key={pIndex}
                className="text-[17px] text-[#555] max-w-[640px] leading-relaxed mb-4"
              >
                {paragraph}
              </p>
            ))}

            {/* Solution box */}
            <div className="bg-dark rounded-xl p-6 max-w-[640px] mt-8">
              <p className="text-cream/90 text-[15px] leading-relaxed">
                <strong className="text-gold">{point.solutionIntro}</strong>{' '}
                {point.solutionText}
              </p>
              <Link
                href="/skaleflow"
                className="inline-flex items-center gap-2 text-teal text-[15px] font-semibold mt-4 hover:text-teal/80 transition-colors"
              >
                That&apos;s what SkaleFlow does
                <ArrowIcon />
              </Link>
            </div>
          </div>
        </section>
      ))}

      {/* Final CTA */}
      <section className="bg-dark py-28 relative overflow-hidden">
        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[radial-gradient(ellipse,rgba(30,107,99,0.08)_0%,transparent_70%)] pointer-events-none" />

        <div className="relative z-10 max-w-[680px] mx-auto px-6 text-center">
          <h2 className="font-serif text-[clamp(28px,4vw,42px)] font-bold text-cream leading-[1.15] mb-5">
            You&apos;re not the problem. You just need the right system.
          </h2>
          <p className="text-lg text-cream/70 mb-10">
            Let&apos;s build something that actually works.
          </p>
          <Link
            href="/apply"
            className="inline-block bg-gold text-dark font-semibold text-[15px] px-8 py-3.5 rounded-lg hover:bg-gold/90 transition-colors"
          >
            Apply Now
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}
