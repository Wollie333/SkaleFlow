import { PlaybookSection } from './playbook-section';
import { PlaybookRow } from './playbook-row';
import { getVariableDescription } from '@/config/variable-descriptions';
import type { ParsedBrandData } from '@/lib/playbook/parse-brand-outputs';

interface Props {
  data: ParsedBrandData;
  id?: string;
}

function splitWords(text?: string): string[] {
  if (!text) return [];
  let items = text.split('\n').map(s => s.replace(/^[-\u2013\u2014*\u2022\u25E6\u25B8\u25AA]\s+/, '').trim()).filter(Boolean);
  if (items.length <= 1) {
    items = text.split(',').map(s => s.trim()).filter(Boolean);
  }
  return items;
}

function VocabularyTable({ preferred, avoided }: { preferred?: string; avoided?: string }) {
  const useWords = splitWords(preferred);
  const avoidWords = splitWords(avoided);
  const maxRows = Math.max(useWords.length, avoidWords.length);

  if (maxRows === 0) return null;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.1)' }}>
      {/* Header */}
      <div className="grid grid-cols-2">
        <div className="px-5 py-3" style={{ backgroundColor: 'rgba(var(--playbook-primary-rgb, 30, 107, 99), 0.06)' }}>
          <p className="text-[11px] font-semibold uppercase" style={{ color: 'var(--playbook-primary, #1E6B63)', letterSpacing: '0.08em' }}>
            Words We Use
          </p>
        </div>
        <div
          className="px-5 py-3"
          style={{
            backgroundColor: 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.06)',
            borderLeft: '1px solid rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.1)',
          }}
        >
          <p className="text-[11px] font-semibold uppercase" style={{ color: 'var(--playbook-neutral, #7A756D)', letterSpacing: '0.08em' }}>
            Words We Avoid
          </p>
        </div>
      </div>

      {/* Rows */}
      {Array.from({ length: maxRows }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-2"
          style={i % 2 === 0 ? { backgroundColor: 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.02)' } : undefined}
        >
          <div
            className="px-5 py-2.5"
            style={{ borderTop: '1px solid rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.06)' }}
          >
            {useWords[i] && (
              <span className="text-[13px]" style={{ color: 'var(--playbook-dark, #0F1F1D)' }}>
                {useWords[i]}
              </span>
            )}
          </div>
          <div
            className="px-5 py-2.5"
            style={{
              borderTop: '1px solid rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.06)',
              borderLeft: '1px solid rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.1)',
            }}
          >
            {avoidWords[i] && (
              <span className="text-[13px]" style={{ color: 'var(--playbook-dark, #0F1F1D)' }}>
                {avoidWords[i]}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SectionVoice({ data, id }: Props) {
  const hasVocab = data.vocabulary_preferred || data.vocabulary_avoided || data.tone_descriptors;
  const hasMessaging = data.message_core || data.message_pillars;
  if (!hasVocab && !hasMessaging) return null;

  return (
    <PlaybookSection id={id} number="04" title="Brand Voice & Messaging" subtitle="How your brand speaks and what it says">
      <PlaybookRow {...getVariableDescription('tone_descriptors')} variableKey="tone_descriptors" value={data.tone_descriptors} />

      {/* Vocabulary table — special visual */}
      {(data.vocabulary_preferred || data.vocabulary_avoided) && (
        <PlaybookRow label="Brand Vocabulary" description="Words the brand uses and avoids, with reasoning." variableKey="vocabulary_preferred" fullWidth>
          <VocabularyTable preferred={data.vocabulary_preferred} avoided={data.vocabulary_avoided} />
        </PlaybookRow>
      )}

      <PlaybookRow {...getVariableDescription('industry_terms_embrace')} variableKey="industry_terms_embrace" value={data.industry_terms_embrace} />
      <PlaybookRow {...getVariableDescription('industry_terms_reject')} variableKey="industry_terms_reject" value={data.industry_terms_reject} />

      {/* Core message — dark callout (special visual) */}
      {data.message_core && (
        <PlaybookRow label="Core Message" description="The one thing people should remember about this brand." variableKey="message_core" fullWidth>
          <div
            className="py-12 px-10 rounded-2xl break-inside-avoid"
            style={{ backgroundColor: 'var(--playbook-dark, #0F1F1D)' }}
          >
            <p
              className="text-[22px] font-semibold leading-[1.5]"
              style={{
                color: 'var(--playbook-light)',
                fontFamily: 'var(--playbook-heading-font)',
                letterSpacing: '-0.01em',
              }}
            >
              {data.message_core}
            </p>
          </div>
        </PlaybookRow>
      )}

      <PlaybookRow {...getVariableDescription('message_pillars')} variableKey="message_pillars" value={data.message_pillars} />
    </PlaybookSection>
  );
}
