'use client';

interface HeroSectionProps {
  orgName: string;
  logoUrl: string | null;
  tagline?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export function HeroSection({ orgName, logoUrl, tagline, primaryColor = '#14b8a6' }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(160deg, #0a0f0e 0%, ${primaryColor}22 40%, #0a0f0e 100%)`,
        }}
      />

      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Gradient orb for depth */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] md:w-[700px] md:h-[700px] rounded-full opacity-15 blur-[120px] pointer-events-none"
        style={{ backgroundColor: primaryColor }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[70vh] md:min-h-[75vh] px-5 py-20 text-center">
        {logoUrl && (
          <img
            src={logoUrl}
            alt={orgName}
            className="h-14 sm:h-16 md:h-20 mb-8 object-contain drop-shadow-lg"
          />
        )}

        <div className="flex items-center gap-3 mb-6">
          <div className="h-px w-6 sm:w-8 md:w-12" style={{ backgroundColor: `${primaryColor}80` }} />
          <span
            className="text-[10px] sm:text-[11px] md:text-xs font-semibold tracking-[0.25em] uppercase"
            style={{ color: primaryColor }}
          >
            Press Room
          </span>
          <div className="h-px w-6 sm:w-8 md:w-12" style={{ backgroundColor: `${primaryColor}80` }} />
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-serif font-bold text-white mb-5 leading-[1.1] max-w-4xl">
          {orgName}
        </h1>

        {tagline && (
          <p className="text-sm sm:text-base md:text-lg text-white/50 max-w-xl mx-auto mb-10 leading-relaxed font-light px-4">
            {tagline}
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="#news"
            className="group px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white rounded-full transition-all duration-300 hover:scale-[1.03]"
            style={{
              backgroundColor: primaryColor,
              boxShadow: `0 4px 24px ${primaryColor}40`,
            }}
          >
            Latest News
            <span className="inline-block ml-1.5 transition-transform duration-300 group-hover:translate-y-0.5">&darr;</span>
          </a>
          <a
            href="#media-kit"
            className="px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white/80 rounded-full border border-white/15 backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:text-white hover:scale-[1.03]"
          >
            Media Kit
          </a>
          <a
            href="#inquiry"
            className="px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white/80 rounded-full border border-white/15 backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:text-white hover:scale-[1.03]"
          >
            Press Inquiries
          </a>
        </div>
      </div>

      {/* Bottom gradient fade to page bg */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-cream to-transparent" />
    </section>
  );
}
