import { PlaybookSection } from './playbook-section';
import { PlaybookRow } from './playbook-row';
import { getVariableDescription } from '@/config/variable-descriptions';
import type { ParsedBrandData } from '@/lib/playbook/parse-brand-outputs';

interface Props {
  data: ParsedBrandData;
  id?: string;
}

export function SectionConversion({ data, id }: Props) {
  // Phase 10 Growth Engine variables
  const hasAuthority = data.authority_pitch || data.authority_publish_plan || data.authority_product_ecosystem || data.authority_profile_plan || data.authority_partnerships;
  const hasConversion = data.conversion_business_type || data.conversion_strategy || data.conversion_funnel || data.conversion_metrics;
  // Legacy variables
  const hasLegacy = data.conversion_flow || data.nurture_sequence || data.authority_assets || data.authority_gaps;

  if (!hasAuthority && !hasConversion && !hasLegacy) return null;

  return (
    <PlaybookSection id={id} number="08" title="Conversion & Authority" subtitle="How you convert leads and build trust through authority positioning">
      {/* Authority (KPI 5P) */}
      <PlaybookRow {...getVariableDescription('authority_pitch')} variableKey="authority_pitch" value={data.authority_pitch} />
      <PlaybookRow {...getVariableDescription('authority_publish_plan')} variableKey="authority_publish_plan" value={data.authority_publish_plan} />
      <PlaybookRow {...getVariableDescription('authority_product_ecosystem')} variableKey="authority_product_ecosystem" value={data.authority_product_ecosystem} />
      <PlaybookRow {...getVariableDescription('authority_profile_plan')} variableKey="authority_profile_plan" value={data.authority_profile_plan} />
      <PlaybookRow {...getVariableDescription('authority_partnerships')} variableKey="authority_partnerships" value={data.authority_partnerships} />

      {/* Conversion */}
      <PlaybookRow {...getVariableDescription('conversion_business_type')} variableKey="conversion_business_type" value={data.conversion_business_type} />
      <PlaybookRow {...getVariableDescription('conversion_strategy')} variableKey="conversion_strategy" value={data.conversion_strategy} />
      <PlaybookRow {...getVariableDescription('conversion_funnel')} variableKey="conversion_funnel" value={data.conversion_funnel} />
      <PlaybookRow {...getVariableDescription('conversion_metrics')} variableKey="conversion_metrics" value={data.conversion_metrics} />

      {/* Legacy variables for backward compatibility */}
      <PlaybookRow {...getVariableDescription('conversion_flow')} variableKey="conversion_flow" value={data.conversion_flow} />
      <PlaybookRow {...getVariableDescription('nurture_sequence')} variableKey="nurture_sequence" value={data.nurture_sequence} />
      <PlaybookRow {...getVariableDescription('authority_assets')} variableKey="authority_assets" value={data.authority_assets} />
      <PlaybookRow {...getVariableDescription('authority_gaps')} variableKey="authority_gaps" value={data.authority_gaps} />
    </PlaybookSection>
  );
}
