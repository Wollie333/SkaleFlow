interface ProofStripProps {
  stat: string;
  statLabel: string;
  quote: string;
  quoteAuthor: string;
}

export function ProofStrip({ stat, statLabel, quote, quoteAuthor }: ProofStripProps) {
  return (
    <section className="py-20 px-6 bg-dark relative overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute top-0 left-[20%] w-[60%] h-full bg-[radial-gradient(ellipse,rgba(30,107,99,0.05)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative z-10 max-w-[1060px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Stat */}
          <div className="text-center md:text-left">
            <div className="font-serif text-[clamp(36px,5vw,52px)] font-bold text-teal leading-none mb-3">
              {stat}
            </div>
            <p className="text-[16px] text-cream/60 leading-relaxed max-w-[360px] md:mx-0 mx-auto">
              {statLabel}
            </p>
          </div>

          {/* Quote */}
          <div className="border-l-2 border-gold/30 pl-6">
            <p className="text-[17px] text-cream/80 leading-relaxed italic mb-4">
              &ldquo;{quote}&rdquo;
            </p>
            <p className="text-[14px] text-gold font-medium">
              — {quoteAuthor}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
