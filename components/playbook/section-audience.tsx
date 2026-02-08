import { PlaybookSection } from './playbook-section';
import { PlaybookRow } from './playbook-row';
import { getVariableDescription } from '@/config/variable-descriptions';
import type { ParsedBrandData } from '@/lib/playbook/parse-brand-outputs';

interface Props {
  data: ParsedBrandData;
  id?: string;
}

export function SectionAudience({ data, id }: Props) {
  const hasIcp = data.icp_demographics || data.icp_pains || data.icp_desires;
  const hasEnemy = data.enemy_name || data.enemy_description;
  if (!hasIcp && !hasEnemy) return null;

  return (
    <PlaybookSection id={id} number="02" title="Audience & Enemy" subtitle="Who you serve and what you fight against">
      {/* ICP */}
      <PlaybookRow {...getVariableDescription('icp_demographics')} variableKey="icp_demographics" value={data.icp_demographics} />
      <PlaybookRow {...getVariableDescription('icp_psychographics')} variableKey="icp_psychographics" value={data.icp_psychographics} />
      <PlaybookRow {...getVariableDescription('icp_pains')} variableKey="icp_pains" value={data.icp_pains} />
      <PlaybookRow {...getVariableDescription('icp_desires')} variableKey="icp_desires" value={data.icp_desires} />
      <PlaybookRow {...getVariableDescription('icp_emotional_triggers')} variableKey="icp_emotional_triggers" value={data.icp_emotional_triggers} />
      <PlaybookRow {...getVariableDescription('icp_internal_dialogue')} variableKey="icp_internal_dialogue" value={data.icp_internal_dialogue} />
      <PlaybookRow {...getVariableDescription('icp_objections')} variableKey="icp_objections" value={data.icp_objections} />
      <PlaybookRow {...getVariableDescription('icp_buying_triggers')} variableKey="icp_buying_triggers" value={data.icp_buying_triggers} />
      <PlaybookRow {...getVariableDescription('customer_journey_stages')} variableKey="customer_journey_stages" value={data.customer_journey_stages} />

      {/* Enemy — special name callout */}
      {data.enemy_name && (
        <PlaybookRow label="Enemy Name" description="The branded name for the mindset, system, or approach your brand fights against." variableKey="enemy_name" fullWidth>
          <div className="break-inside-avoid">
            <p
              className="text-[24px] font-bold"
              style={{
                fontFamily: 'var(--playbook-heading-font)',
                color: 'var(--playbook-dark)',
                letterSpacing: '-0.015em',
                lineHeight: '1.3',
                borderLeft: '2px solid var(--playbook-accent, #C8A86E)',
                paddingLeft: '24px',
              }}
            >
              {data.enemy_name}
            </p>
            {data.enemy_type && (
              <p
                className="text-[13px] mt-2"
                style={{ color: 'var(--playbook-neutral)', paddingLeft: '24px' }}
              >
                {data.enemy_type}
              </p>
            )}
          </div>
        </PlaybookRow>
      )}

      <PlaybookRow {...getVariableDescription('enemy_description')} variableKey="enemy_description" value={data.enemy_description} />
      <PlaybookRow {...getVariableDescription('enemy_cost')} variableKey="enemy_cost" value={data.enemy_cost} />
      <PlaybookRow {...getVariableDescription('enemy_false_promises')} variableKey="enemy_false_promises" value={data.enemy_false_promises} />
    </PlaybookSection>
  );
}
