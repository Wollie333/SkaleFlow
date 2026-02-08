interface PlaybookCoverProps {
  orgName: string;
  logoUrl?: string | null;
  brandLogoUrl?: string | null;
}

export function PlaybookCover({ orgName, logoUrl, brandLogoUrl }: PlaybookCoverProps) {
  const displayLogo = brandLogoUrl || logoUrl;
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div
      className="playbook-cover flex flex-col items-center justify-center min-h-screen text-center px-16"
      style={{ backgroundColor: 'var(--playbook-dark, #0F1F1D)' }}
    >
      {displayLogo && (
        <div className="mb-20">
          <img
            src={displayLogo}
            alt={`${orgName} logo`}
            className="max-h-24 max-w-[280px] object-contain"
          />
        </div>
      )}

      <p
        className="text-[11px] font-mono uppercase tracking-[0.25em] mb-8"
        style={{ color: 'var(--playbook-primary, #1E6B63)' }}
      >
        Brand Playbook
      </p>

      <h1
        className="text-[56px] font-bold leading-none"
        style={{
          fontFamily: 'var(--playbook-heading-font, sans-serif)',
          color: 'var(--playbook-light, #F0ECE4)',
          letterSpacing: '-0.03em',
        }}
      >
        {orgName}
      </h1>

      <div
        className="w-12 mt-12 mb-12"
        style={{
          height: '1px',
          backgroundColor: 'var(--playbook-primary, #1E6B63)',
          opacity: 0.4,
        }}
      />

      <p
        className="text-[12px] tracking-[0.15em] uppercase"
        style={{ color: 'rgba(var(--playbook-light-rgb, 240, 236, 228), 0.35)' }}
      >
        {today}
      </p>
    </div>
  );
}
