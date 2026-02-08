type ListResult = {
  items: string[];
  style: 'tags' | 'bullets';
};

function parseListItems(text: string): ListResult | null {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  if (lines.length >= 2) {
    const bulletPattern = /^[-–—*•◦▸▪]\s+|^\d+[.)]\s+/;
    const bulletLines = lines.filter(l => bulletPattern.test(l));

    if (bulletLines.length >= lines.length * 0.6) {
      const items = lines.map(l => l.replace(bulletPattern, '').trim()).filter(Boolean);
      const avg = items.reduce((s, i) => s + i.length, 0) / items.length;
      return { items, style: avg < 40 ? 'tags' : 'bullets' };
    }

    if (lines.length >= 3) {
      const avg = lines.reduce((s, l) => s + l.length, 0) / lines.length;
      if (avg < 100) {
        return { items: lines, style: avg < 40 ? 'tags' : 'bullets' };
      }
    }
  }

  const commaCount = (text.match(/,/g) || []).length;
  if (commaCount >= 2) {
    const items = text.split(',').map(s => s.trim()).filter(Boolean);
    if (items.length >= 3) {
      const avg = items.reduce((s, i) => s + i.length, 0) / items.length;
      const maxLen = Math.max(...items.map(i => i.length));
      if (avg < 30 && maxLen < 50) {
        return { items, style: 'tags' };
      }
    }
  }

  return null;
}

/** Clean pill tags for short keyword-like items */
function BrandedTags({ items, size = 'base' }: { items: string[]; size?: 'base' | 'sm' }) {
  const textClass = size === 'sm' ? 'text-[12px]' : 'text-[13px]';
  const padding = size === 'sm' ? 'px-3.5 py-1.5' : 'px-4 py-2';

  return (
    <div className="flex flex-wrap gap-2.5">
      {items.map((item, i) => (
        <span
          key={i}
          className={`${textClass} ${padding} rounded-full font-medium`}
          style={{
            backgroundColor: 'rgba(var(--playbook-primary-rgb, 30, 107, 99), 0.07)',
            color: 'var(--playbook-dark, #0F1F1D)',
            fontFamily: 'var(--playbook-body-font, sans-serif)',
            lineHeight: '1.4',
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

/** Clean bullet list for longer descriptive items */
function BrandedList({ items, size = 'base' }: { items: string[]; size?: 'base' | 'sm' }) {
  const textClass = size === 'sm' ? 'text-[13px]' : 'text-[15px]';

  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3.5">
          <span
            className="w-[5px] h-[5px] rounded-full flex-shrink-0 mt-[9px]"
            style={{ backgroundColor: 'var(--playbook-primary, #1E6B63)', opacity: 0.5 }}
          />
          <span
            className={textClass}
            style={{
              fontFamily: 'var(--playbook-body-font, sans-serif)',
              color: 'var(--playbook-dark, #0F1F1D)',
              lineHeight: '1.65',
            }}
          >
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ListDisplay({ result, size = 'base' }: { result: ListResult; size?: 'base' | 'sm' }) {
  if (result.style === 'tags') {
    return <BrandedTags items={result.items} size={size} />;
  }
  return <BrandedList items={result.items} size={size} />;
}

interface OutputBlockProps {
  label: string;
  value?: string;
  large?: boolean;
}

export function OutputBlock({ label, value, large }: OutputBlockProps) {
  if (!value) return null;

  const listResult = parseListItems(value);

  return (
    <div className="mb-10 break-inside-avoid">
      <h4
        className="text-[12px] font-semibold uppercase mb-3"
        style={{ color: 'var(--playbook-neutral, #7A756D)', letterSpacing: '0.08em' }}
      >
        {label}
      </h4>
      {listResult ? (
        <ListDisplay result={listResult} />
      ) : (
        <p
          className={`whitespace-pre-wrap ${large ? 'text-lg leading-[1.8]' : 'text-[15px] leading-[1.75]'}`}
          style={{
            fontFamily: 'var(--playbook-body-font, sans-serif)',
            color: 'var(--playbook-dark, #0F1F1D)',
          }}
        >
          {value}
        </p>
      )}
    </div>
  );
}

export function SmartContent({ value, size = 'sm' }: { value?: string; size?: 'base' | 'sm' }) {
  if (!value) return null;
  const listResult = parseListItems(value);
  if (listResult) return <ListDisplay result={listResult} size={size} />;
  return (
    <p
      className={`whitespace-pre-wrap ${size === 'sm' ? 'text-[13px] leading-[1.7]' : 'text-[15px] leading-[1.75]'}`}
      style={{
        fontFamily: 'var(--playbook-body-font, sans-serif)',
        color: 'var(--playbook-dark, #0F1F1D)',
      }}
    >
      {value}
    </p>
  );
}

interface OutputCardProps {
  label: string;
  value?: string;
}

export function OutputCard({ label, value }: OutputCardProps) {
  if (!value) return null;

  const listResult = parseListItems(value);

  return (
    <div
      className="p-6 rounded-xl break-inside-avoid"
      style={{
        backgroundColor: 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.04)',
      }}
    >
      <h4
        className="text-[11px] font-semibold uppercase mb-3"
        style={{ color: 'var(--playbook-neutral, #7A756D)', letterSpacing: '0.08em' }}
      >
        {label}
      </h4>
      {listResult ? (
        <ListDisplay result={listResult} size="sm" />
      ) : (
        <p
          className="text-[13px] whitespace-pre-wrap leading-[1.7]"
          style={{
            fontFamily: 'var(--playbook-body-font, sans-serif)',
            color: 'var(--playbook-dark, #0F1F1D)',
          }}
        >
          {value}
        </p>
      )}
    </div>
  );
}
