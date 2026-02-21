import Link from 'next/link';

interface EmotionHeroProps {
  label: string;
  title: string;
  subtitle: string;
}

export function EmotionHero({ label, title, subtitle }: EmotionHeroProps) {
  return (
    <section className="min-h-[70vh] flex items-center bg-dark relative overflow-hidden pt-[60px]">
      {/* Radial glow */}
      <div className="absolute -top-[40%] -right-[25%] w-[70%] h-[120%] bg-[radial-gradient(ellipse,rgba(30,107,99,0.07)_0%,transparent_70%)] pointer-events-none" />
      {/* Bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      {/* Corner marks */}
      <div className="hidden md:block absolute top-20 left-6 w-[60px] h-[60px] border-t-2 border-l-2 border-gold/15 pointer-events-none" />
      <div className="hidden md:block absolute bottom-6 right-6 w-[60px] h-[60px] border-b-2 border-r-2 border-gold/15 pointer-events-none" />

      <div className="relative z-10 max-w-[780px] mx-auto px-6 py-20 md:py-28">
        <div className="text-xs font-semibold text-gold tracking-[0.18em] uppercase mb-6 animate-fade-up [animation-delay:0.3s] [animation-fill-mode:forwards] opacity-0">
          {label}
        </div>
        <h1 className="font-serif text-[clamp(34px,5vw,54px)] font-bold text-cream leading-[1.1] mb-6 animate-fade-up [animation-delay:0.5s] [animation-fill-mode:forwards] opacity-0">
          {title}
        </h1>
        <p className="text-lg text-cream/70 max-w-[560px] leading-relaxed mb-10 animate-fade-up [animation-delay:0.7s] [animation-fill-mode:forwards] opacity-0">
          {subtitle}
        </p>
        <div className="flex flex-wrap gap-4 animate-fade-up [animation-delay:1s] [animation-fill-mode:forwards] opacity-0">
          <Link
            href="/apply"
            className="inline-flex items-center px-7 py-3 rounded-md text-[14px] font-semibold bg-teal text-cream hover:bg-teal-light hover:-translate-y-px transition-all"
          >
            Apply Now
          </Link>
          <a
            href="#features"
            className="inline-flex items-center px-7 py-3 rounded-md text-[14px] font-medium border border-cream/20 text-cream/80 hover:text-cream hover:border-cream/40 transition-all"
          >
            See How It Works
          </a>
        </div>
      </div>
    </section>
  );
}
