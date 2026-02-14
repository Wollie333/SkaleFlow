'use client';

interface HeroSectionProps {
  orgName: string;
  logoUrl: string | null;
  tagline?: string;
  primaryColor?: string;
}

export function HeroSection({ orgName, logoUrl, tagline, primaryColor = '#14b8a6' }: HeroSectionProps) {
  return (
    <section className="relative py-16 px-6 text-center" style={{ backgroundColor: `${primaryColor}08` }}>
      <div className="max-w-3xl mx-auto">
        {logoUrl && (
          <img
            src={logoUrl}
            alt={orgName}
            className="h-16 mx-auto mb-6 object-contain"
          />
        )}
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-3">
          Press Room
        </h1>
        {tagline && (
          <p className="text-lg text-gray-500 max-w-xl mx-auto">{tagline}</p>
        )}
        <div className="mt-6 flex justify-center gap-4">
          <a
            href="#news"
            className="px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors"
            style={{ backgroundColor: primaryColor }}
          >
            Latest News
          </a>
          <a
            href="#inquiry"
            className="px-5 py-2.5 text-sm font-medium border rounded-lg transition-colors"
            style={{ borderColor: primaryColor, color: primaryColor }}
          >
            Press Inquiries
          </a>
        </div>
      </div>
    </section>
  );
}
