'use client';

interface HeroSectionProps {
  orgName: string;
  logoUrl: string | null;
  tagline?: string;
  primaryColor?: string;
  darkBase?: string;
  accentColor?: string;
}

export function HeroSection({ orgName, logoUrl, tagline, primaryColor = '#14b8a6', darkBase = '#0a0f0e', accentColor }: HeroSectionProps) {
  const accent = accentColor || primaryColor;

  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: darkBase }}>
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
          <div className="h-px w-6 sm:w-8 md:w-12" style={{ backgroundColor: primaryColor }} />
          <span
            className="text-[10px] sm:text-[11px] md:text-xs font-semibold tracking-[0.25em] uppercase"
            style={{ color: primaryColor }}
          >
            Press Room
          </span>
          <div className="h-px w-6 sm:w-8 md:w-12" style={{ backgroundColor: primaryColor }} />
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
            style={{ backgroundColor: primaryColor }}
          >
            Latest News
            <span className="inline-block ml-1.5 transition-transform duration-300 group-hover:translate-y-0.5">&darr;</span>
          </a>
          <a
            href="#media-kit"
            className="px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white/80 rounded-full border border-white/15 transition-all duration-300 hover:border-white/30 hover:text-white hover:scale-[1.03]"
          >
            Media Kit
          </a>
          <a
            href="#inquiry"
            className="px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold rounded-full border transition-all duration-300 hover:scale-[1.03]"
            style={{ borderColor: `${accent}50`, color: accent }}
          >
            Press Inquiries
          </a>
        </div>
      </div>
    </section>
  );
}
