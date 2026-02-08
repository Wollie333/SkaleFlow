import { SmartContent } from './output-block';

interface PlaybookRowProps {
  label: string;
  description?: string;
  value?: string;
  fullWidth?: boolean;
  children?: React.ReactNode;
  variableKey?: string;
}

export function PlaybookRow({ label, description, value, fullWidth, children, variableKey }: PlaybookRowProps) {
  if (!value && !children) return null;

  if (fullWidth) {
    return (
      <div
        className="py-8 break-inside-avoid"
        data-variable={variableKey}
        style={{ borderBottom: '1px solid rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.1)' }}
      >
        <p
          className="text-[11px] font-semibold uppercase mb-2"
          style={{
            color: 'var(--playbook-primary, #1E6B63)',
            letterSpacing: '0.1em',
            fontFamily: 'var(--playbook-body-font, sans-serif)',
          }}
        >
          {label}
        </p>
        {description && (
          <p
            className="text-[13px] mb-4"
            style={{ color: 'var(--playbook-neutral, #7A756D)', lineHeight: '1.6' }}
          >
            {description}
          </p>
        )}
        {children || (
          <div
            className="rounded-lg p-5"
            style={{ backgroundColor: 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.04)' }}
          >
            <SmartContent value={value} size="base" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex gap-8 py-8 break-inside-avoid"
      data-variable={variableKey}
      style={{ borderBottom: '1px solid rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.1)' }}
    >
      {/* Left: Label */}
      <div className="w-[30%] flex-shrink-0 pt-1">
        <p
          className="text-[11px] font-semibold uppercase"
          style={{
            color: 'var(--playbook-primary, #1E6B63)',
            letterSpacing: '0.1em',
            fontFamily: 'var(--playbook-body-font, sans-serif)',
          }}
        >
          {label}
        </p>
      </div>

      {/* Right: Description + Value */}
      <div className="flex-1 min-w-0">
        {description && (
          <p
            className="text-[13px] mb-3"
            style={{ color: 'var(--playbook-neutral, #7A756D)', lineHeight: '1.6' }}
          >
            {description}
          </p>
        )}
        {children || (
          <div
            className="rounded-lg p-5"
            style={{ backgroundColor: 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.04)' }}
          >
            <SmartContent value={value} size="base" />
          </div>
        )}
      </div>
    </div>
  );
}
