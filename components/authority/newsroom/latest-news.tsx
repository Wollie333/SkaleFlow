'use client';

interface Placement {
  id: string;
  opportunity_name: string;
  target_outlet: string | null;
  category: string;
  reach_tier: string;
  published_at: string | null;
  live_url: string | null;
  confirmed_format: string | null;
  engagement_type: string;
}

interface PressRelease {
  id: string;
  headline: string;
  subtitle: string | null;
  body_content: string;
  published_at: string | null;
}

interface LatestNewsProps {
  placements: Placement[];
  pressReleases: PressRelease[];
  primaryColor?: string;
  accentColor?: string;
  darkBase?: string;
  lightColor?: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function LatestNews({ placements, pressReleases, primaryColor = '#14b8a6', accentColor, darkBase = '#0a0f0e' }: LatestNewsProps) {
  const accent = accentColor || primaryColor;
  const hasContent = placements.length > 0 || pressReleases.length > 0;

  if (!hasContent) {
    return (
      <section id="news" className="py-16 md:py-20 px-5">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-[10px] font-semibold tracking-[0.3em] uppercase mb-3 block" style={{ color: `${darkBase}40` }}>
            Latest
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold mb-4" style={{ color: darkBase }}>
            News &amp; Coverage
          </h2>
          <p className="text-sm" style={{ color: `${darkBase}50` }}>No press coverage yet. Check back soon.</p>
        </div>
      </section>
    );
  }

  const featured = pressReleases.length > 0 ? pressReleases[0] : null;
  const rest = pressReleases.slice(1);

  return (
    <section id="news" className="py-16 md:py-20 px-5">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10 md:mb-12">
          <span className="text-[10px] font-semibold tracking-[0.3em] uppercase mb-3 block" style={{ color: `${darkBase}40` }}>
            Latest
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold" style={{ color: darkBase }}>
            News &amp; Coverage
          </h2>
        </div>

        {/* Featured Press Release */}
        {featured && (
          <article
            className="relative p-6 sm:p-8 md:p-10 rounded-2xl mb-6 md:mb-8 border transition-shadow duration-300 hover:shadow-xl overflow-hidden"
            style={{ borderColor: `${primaryColor}20`, backgroundColor: `${primaryColor}08` }}
          >
            <div
              className="absolute top-0 left-0 w-1 h-full rounded-r-full"
              style={{ backgroundColor: primaryColor }}
            />
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
              <span
                className="text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full"
                style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
              >
                Press Release
              </span>
              {featured.published_at && (
                <span className="text-xs" style={{ color: `${darkBase}40` }}>{formatDate(featured.published_at)}</span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-serif font-bold mb-3 leading-snug" style={{ color: darkBase }}>
              {featured.headline}
            </h3>
            {featured.subtitle && (
              <p className="text-sm sm:text-base mb-3 font-medium" style={{ color: `${darkBase}60` }}>{featured.subtitle}</p>
            )}
            <p className="text-sm leading-relaxed line-clamp-4 max-w-3xl" style={{ color: `${darkBase}50` }}>
              {featured.body_content}
            </p>
          </article>
        )}

        {/* Remaining Press Releases */}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mb-10 md:mb-12">
            {rest.map((pr) => (
              <article
                key={pr.id}
                className="group p-5 sm:p-6 bg-white rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                style={{ borderColor: `${darkBase}08` }}
              >
                {pr.published_at && (
                  <p className="text-[11px] mb-2 font-medium" style={{ color: `${darkBase}35` }}>
                    {formatDate(pr.published_at)}
                  </p>
                )}
                <h4 className="text-sm sm:text-base font-semibold mb-2 leading-snug transition-colors" style={{ color: darkBase }}>
                  {pr.headline}
                </h4>
                {pr.subtitle && (
                  <p className="text-xs sm:text-sm mb-2" style={{ color: `${darkBase}50` }}>{pr.subtitle}</p>
                )}
                <p className="text-xs sm:text-sm line-clamp-3" style={{ color: `${darkBase}40` }}>{pr.body_content}</p>
              </article>
            ))}
          </div>
        )}

        {/* Media Placements */}
        {placements.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold tracking-[0.2em] uppercase mb-5" style={{ color: `${darkBase}40` }}>
              Media Coverage
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {placements.map((p) => (
                <article
                  key={p.id}
                  className="group relative p-4 sm:p-5 bg-white rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                  style={{ borderColor: `${darkBase}08` }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      {p.target_outlet && (
                        <p
                          className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase mb-1"
                          style={{ color: accent }}
                        >
                          {p.target_outlet}
                        </p>
                      )}
                      <h4 className="text-xs sm:text-sm font-semibold leading-snug" style={{ color: darkBase }}>
                        {p.opportunity_name}
                      </h4>
                    </div>
                    {p.live_url && (
                      <a
                        href={p.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                        style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
                        aria-label="Read article"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                        </svg>
                      </a>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full" style={{ backgroundColor: `${darkBase}05`, color: `${darkBase}50` }}>
                      {p.category.replace(/_/g, ' ')}
                    </span>
                    {p.confirmed_format && (
                      <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full" style={{ backgroundColor: `${darkBase}05`, color: `${darkBase}50` }}>
                        {p.confirmed_format.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  {p.published_at && (
                    <p className="text-[10px] mt-3" style={{ color: `${darkBase}30` }}>{formatDate(p.published_at)}</p>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
