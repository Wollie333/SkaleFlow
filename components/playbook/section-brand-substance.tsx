import { PlaybookSection } from './playbook-section';
import { PlaybookRow } from './playbook-row';
import { getVariableDescription } from '@/config/variable-descriptions';
import type { ParsedBrandData } from '@/lib/playbook/parse-brand-outputs';

interface Props {
  data: ParsedBrandData;
  id?: string;
}

export function SectionBrandSubstance({ data, id }: Props) {
  const hasData = data.brand_purpose || data.brand_vision || data.brand_mission || data.brand_values || data.brand_archetype;
  if (!hasData) return null;

  return (
    <PlaybookSection id={id} number="01" title="Brand Substance" subtitle="The internal core of your brand">
      <PlaybookRow {...getVariableDescription('brand_purpose')} variableKey="brand_purpose" value={data.brand_purpose} />
      <PlaybookRow {...getVariableDescription('brand_vision')} variableKey="brand_vision" value={data.brand_vision} />
      <PlaybookRow {...getVariableDescription('brand_mission')} variableKey="brand_mission" value={data.brand_mission} />

      {/* Archetype — dark centered callout (special visual) */}
      {data.brand_archetype && (
        <PlaybookRow label="Brand Archetype" description="The universal character pattern your brand embodies." variableKey="brand_archetype" fullWidth>
          <div
            className="py-12 px-10 rounded-2xl text-center break-inside-avoid"
            style={{ backgroundColor: 'var(--playbook-dark, #0F1F1D)' }}
          >
            <p
              className="text-[36px] font-bold"
              style={{
                color: 'var(--playbook-light, #F0ECE4)',
                fontFamily: 'var(--playbook-heading-font)',
                letterSpacing: '-0.02em',
                lineHeight: '1.15',
              }}
            >
              {data.brand_archetype}
            </p>
          </div>
        </PlaybookRow>
      )}

      <PlaybookRow {...getVariableDescription('brand_values')} variableKey="brand_values" value={data.brand_values} />
      <PlaybookRow {...getVariableDescription('brand_characteristics')} variableKey="brand_characteristics" value={data.brand_characteristics} />
      <PlaybookRow {...getVariableDescription('brand_non_negotiables')} variableKey="brand_non_negotiables" value={data.brand_non_negotiables} />
      <PlaybookRow {...getVariableDescription('brand_origin_story')} variableKey="brand_origin_story" value={data.brand_origin_story} />
      <PlaybookRow {...getVariableDescription('founder_story')} variableKey="founder_story" value={data.founder_story} />
    </PlaybookSection>
  );
}
