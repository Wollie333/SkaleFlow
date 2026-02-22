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
  accentColor?: string;
  darkBase?: string;
  lightColor?: string;
  positioningStatement?: string;
}

export function MediaKitSection({ pressKit, logoUrl, primaryColor = '#14b8a6', accentColor, darkBase = '#0a0f0e', lightColor = '#faf9f6', positioningStatement }: MediaKitSectionProps) {
  if (!pressKit) return null;

  const accent = accentColor || primaryColor;
  const speakingTopics = Array.isArray(pressKit.speaking_topics) ? pressKit.speaking_topics as string[] : [];
  const hasDownloads = logoUrl || pressKit.brand_guidelines_url;
  const hasContent = pressKit.company_overview || pressKit.founder_bio || speakingTopics.length > 0 || hasDownloads;

  if (!hasContent) return null;

  return (
    <section id="media-kit" className="py-16 md:py-20 px-5" style={{ backgroundColor: `${primaryColor}08` }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10 md:mb-12">
          <span className="text-[10px] font-semibold tracking-[0.3em] uppercase mb-3 block" style={{ color: `${darkBase}40` }}>
            Resources
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold" style={{ color: darkBase }}>Media Kit</h2>
        </div>

        {/* Company Overview — Full Width Featured */}
        {pressKit.company_overview && (
          <div className="mb-8 md:mb-10 max-w-3xl mx-auto">
            <div className="relative p-6 sm:p-8 md:p-10 bg-white rounded-2xl border shadow-sm" style={{ borderColor: `${darkBase}08` }}>
              <div
                className="absolute top-6 sm:top-8 left-0 w-8 sm:w-10 h-0.5 rounded-full"
                style={{ backgroundColor: primaryColor }}
              />
              <h3 className="text-xs font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: `${darkBase}40` }}>
                About
              </h3>
              <p className="text-sm sm:text-base md:text-lg leading-relaxed whitespace-pre-line font-light" style={{ color: `${darkBase}bb` }}>
                {pressKit.company_overview}
              </p>
              {positioningStatement && (
                <p
                  className="mt-6 text-sm italic border-l-2 pl-4"
                  style={{ borderColor: `${accent}60`, color: accent }}
                >
                  {positioningStatement}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {/* Founder Bio */}
          {pressKit.founder_bio && (
            <div className="p-6 sm:p-7 bg-white rounded-2xl border shadow-sm" style={{ borderColor: `${darkBase}08` }}>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}10` }}
                >
                  <svg className="w-4 h-4" style={{ color: primaryColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <h3 className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: `${darkBase}40` }}>
                  Founder
                </h3>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: `${darkBase}a5` }}>
                {pressKit.founder_bio}
              </p>
            </div>
          )}

          {/* Speaking Topics */}
          {speakingTopics.length > 0 && (
            <div className="p-6 sm:p-7 bg-white rounded-2xl border shadow-sm" style={{ borderColor: `${darkBase}08` }}>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}10` }}
                >
                  <svg className="w-4 h-4" style={{ color: primaryColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h3 className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: `${darkBase}40` }}>
                  Speaking Topics
                </h3>
              </div>
              <div className="space-y-2.5">
                {speakingTopics.map((topic, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span
                      className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: accent }}
                    />
                    <span className="text-sm leading-relaxed" style={{ color: `${darkBase}a5` }}>{topic}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Downloads */}
          {hasDownloads && (
            <div className={`p-6 sm:p-7 bg-white rounded-2xl border shadow-sm ${!pressKit.founder_bio && speakingTopics.length === 0 ? 'md:col-span-2' : ''}`} style={{ borderColor: `${darkBase}08` }}>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}10` }}
                >
                  <svg className="w-4 h-4" style={{ color: primaryColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                </div>
                <h3 className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: `${darkBase}40` }}>
                  Downloads
                </h3>
              </div>
              <div className="space-y-3">
                {logoUrl && (
                  <a
                    href={logoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 hover:shadow-sm"
                    style={{ borderColor: `${darkBase}08` }}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors" style={{ backgroundColor: `${darkBase}05` }}>
                      <svg className="w-5 h-5" style={{ color: `${darkBase}40` }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 6.75v10.5A2.25 2.25 0 003.75 21z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: darkBase }}>Brand Logo</p>
                      <p className="text-xs" style={{ color: `${darkBase}40` }}>High-resolution logo file</p>
                    </div>
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: `${darkBase}30` }}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                  </a>
                )}
                {pressKit.brand_guidelines_url && (
                  <a
                    href={pressKit.brand_guidelines_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 hover:shadow-sm"
                    style={{ borderColor: `${darkBase}08` }}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors" style={{ backgroundColor: `${darkBase}05` }}>
                      <svg className="w-5 h-5" style={{ color: `${darkBase}40` }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: darkBase }}>Brand Guidelines</p>
                      <p className="text-xs" style={{ color: `${darkBase}40` }}>Usage guidelines and standards</p>
                    </div>
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: `${darkBase}30` }}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
