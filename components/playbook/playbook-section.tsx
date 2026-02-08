interface PlaybookSectionProps {
  title: string;
  subtitle?: string;
  number?: string;
  children: React.ReactNode;
  pageBreak?: boolean;
  id?: string;
}

export function PlaybookSection({ title, subtitle, number, children, pageBreak = true, id }: PlaybookSectionProps) {
  return (
    <section id={id} className={`playbook-section mb-24 ${pageBreak ? 'break-before-page' : ''}`}>
      {/* Section header */}
      <div className="mb-14">
        {number && (
          <p
            className="text-[13px] font-mono font-medium mb-5"
            style={{ color: 'var(--playbook-primary, #1E6B63)', letterSpacing: '0.05em' }}
          >
            {number}
          </p>
        )}
        <h2
          className="text-[38px] font-bold"
          style={{
            fontFamily: 'var(--playbook-heading-font, sans-serif)',
            color: 'var(--playbook-dark, #0F1F1D)',
            letterSpacing: '-0.025em',
            lineHeight: '1.08',
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="text-[15px] mt-3"
            style={{
              color: 'var(--playbook-neutral, #7A756D)',
              lineHeight: '1.6',
            }}
          >
            {subtitle}
          </p>
        )}
        <div
          className="mt-8"
          style={{
            width: '100%',
            height: '1px',
            background: 'linear-gradient(to right, rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.2), transparent)',
          }}
        />
      </div>
      {children}
    </section>
  );
}
