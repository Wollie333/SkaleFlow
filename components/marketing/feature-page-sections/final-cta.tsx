import Link from 'next/link';

interface FinalCTAProps {
  headline: string;
  subtitle: string;
}

export function FinalCTA({ headline, subtitle }: FinalCTAProps) {
  return (
    <section className="py-28 px-6 bg-dark relative overflow-hidden">
      {/* Radial glow */}
      <div className="absolute top-[10%] left-[30%] w-[40%] h-[80%] bg-[radial-gradient(ellipse,rgba(30,107,99,0.1)_0%,transparent_70%)] pointer-events-none" />
      {/* Corner marks */}
      <div className="hidden md:block absolute top-8 left-8 w-[50px] h-[50px] border-t-2 border-l-2 border-gold/15 pointer-events-none" />
      <div className="hidden md:block absolute bottom-8 right-8 w-[50px] h-[50px] border-b-2 border-r-2 border-gold/15 pointer-events-none" />

      <div className="relative z-10 max-w-[640px] mx-auto text-center">
        <h2 className="font-serif text-[clamp(28px,4vw,42px)] font-bold text-cream leading-[1.15] mb-5">
          {headline}
        </h2>
        <p className="text-[17px] text-cream/60 leading-relaxed mb-10 max-w-[480px] mx-auto">
          {subtitle}
        </p>
        <Link
          href="/apply"
          className="inline-flex items-center px-8 py-3.5 rounded-md text-[15px] font-semibold bg-gold text-dark hover:bg-gold/90 hover:-translate-y-px transition-all"
        >
          Apply Now
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
