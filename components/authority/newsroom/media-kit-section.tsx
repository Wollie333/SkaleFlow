'use client';

interface MediaKitSectionProps {
  pressKit: {
    company_overview: string | null;
    founder_bio: string | null;
    speaking_topics: unknown;
    brand_guidelines_url: string | null;
    hero_tagline?: string | null;
  } | null;
  logoUrl: string | null;
  primaryColor?: string;
}

export function MediaKitSection({ pressKit, logoUrl, primaryColor = '#14b8a6' }: MediaKitSectionProps) {
  if (!pressKit) return null;

  const speakingTopics = Array.isArray(pressKit.speaking_topics) ? pressKit.speaking_topics as string[] : [];

  return (
    <section id="media-kit" className="py-12 px-6 bg-cream">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-serif font-bold text-charcoal mb-8 text-center">Media Kit</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* About */}
          {pressKit.company_overview && (
            <div className="bg-cream-warm rounded-xl border border-stone/10 p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">About</h3>
              <p className="text-sm text-stone leading-relaxed whitespace-pre-line">
                {pressKit.company_overview}
              </p>
            </div>
          )}

          {/* Founder Bio */}
          {pressKit.founder_bio && (
            <div className="bg-cream-warm rounded-xl border border-stone/10 p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Founder</h3>
              <p className="text-sm text-stone leading-relaxed whitespace-pre-line line-clamp-6">
                {pressKit.founder_bio}
              </p>
            </div>
          )}

          {/* Speaking Topics */}
          {speakingTopics.length > 0 && (
            <div className="bg-cream-warm rounded-xl border border-stone/10 p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Speaking Topics</h3>
              <ul className="space-y-2">
                {speakingTopics.map((topic, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-stone">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    />
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Downloads */}
          <div className="bg-cream-warm rounded-xl border border-stone/10 p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Downloads</h3>
            <div className="space-y-3">
              {logoUrl && (
                <a
                  href={logoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-stone/10 hover:border-stone/10 transition-colors"
                >
                  <span className="text-sm font-medium text-charcoal">Brand Logo</span>
                  <span className="text-xs ml-auto" style={{ color: primaryColor }}>Download</span>
                </a>
              )}
              {pressKit.brand_guidelines_url && (
                <a
                  href={pressKit.brand_guidelines_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-stone/10 hover:border-stone/10 transition-colors"
                >
                  <span className="text-sm font-medium text-charcoal">Brand Guidelines</span>
                  <span className="text-xs ml-auto" style={{ color: primaryColor }}>Download</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
