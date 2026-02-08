interface PlaybookBackCoverProps {
  orgName: string;
}

export function PlaybookBackCover({ orgName }: PlaybookBackCoverProps) {
  return (
    <div
      className="break-before-page flex flex-col items-center justify-center min-h-screen text-center px-16"
      style={{ backgroundColor: 'var(--playbook-dark, #0F1F1D)' }}
    >
      <p
        className="text-[11px] font-mono uppercase tracking-[0.25em] mb-10"
        style={{ color: 'var(--playbook-primary, #1E6B63)' }}
      >
        Brand Playbook
      </p>

      <p
        className="text-[32px] font-bold"
        style={{
          fontFamily: 'var(--playbook-heading-font, sans-serif)',
          color: 'var(--playbook-light, #F0ECE4)',
          letterSpacing: '-0.02em',
          lineHeight: '1.15',
        }}
      >
        {orgName}
      </p>

      <div
        className="w-12 mt-12 mb-12"
        style={{
          height: '1px',
          backgroundColor: 'var(--playbook-primary, #1E6B63)',
          opacity: 0.3,
        }}
      />

      <p
        className="text-[11px] tracking-[0.1em]"
        style={{ color: 'rgba(var(--playbook-light-rgb, 240, 236, 228), 0.3)' }}
      >
        Powered by SkaleFlow
      </p>
    </div>
  );
}
