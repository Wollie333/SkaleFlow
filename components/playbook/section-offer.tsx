import { PlaybookSection } from './playbook-section';
import { PlaybookRow } from './playbook-row';
import { SmartContent } from './output-block';
import { getVariableDescription } from '@/config/variable-descriptions';
import type { ParsedBrandData } from '@/lib/playbook/parse-brand-outputs';

interface Props {
  data: ParsedBrandData;
  id?: string;
}

export function SectionOffer({ data, id }: Props) {
  const hasOffer = data.offer_problem || data.offer_outcome || data.offer_name;
  const hasPositioning = data.positioning_statement || data.differentiation_statement;
  const hasLeadMagnet = data.lead_magnet_type || data.lead_magnet_title || data.lead_magnet_promise;
  if (!hasOffer && !hasPositioning && !hasLeadMagnet) return null;

  return (
    <PlaybookSection id={id} number="03" title="Offer & Positioning" subtitle="What you sell and how you stand apart">
      {/* Offer name — dark card (special visual) */}
      {data.offer_name && (
        <PlaybookRow label="Offer Name" description="The memorable, brandable name for your offer." variableKey="offer_name" fullWidth>
          <div
            className="py-12 px-10 rounded-2xl text-center break-inside-avoid"
            style={{ backgroundColor: 'var(--playbook-dark, #0F1F1D)' }}
          >
            <p
              className="text-[30px] font-bold"
              style={{
                color: 'var(--playbook-light)',
                fontFamily: 'var(--playbook-heading-font)',
                letterSpacing: '-0.02em',
                lineHeight: '1.2',
              }}
            >
              {data.offer_name}
            </p>
            {data.offer_tagline && (
              <p className="text-[14px] mt-4" style={{ color: 'rgba(var(--playbook-light-rgb, 240, 236, 228), 0.45)' }}>
                {data.offer_tagline}
              </p>
            )}
          </div>
        </PlaybookRow>
      )}

      <PlaybookRow {...getVariableDescription('offer_problem')} variableKey="offer_problem" value={data.offer_problem} />
      <PlaybookRow {...getVariableDescription('offer_outcome')} variableKey="offer_outcome" value={data.offer_outcome} />
      <PlaybookRow {...getVariableDescription('offer_inclusions')} variableKey="offer_inclusions" value={data.offer_inclusions} />
      <PlaybookRow {...getVariableDescription('offer_exclusions')} variableKey="offer_exclusions" value={data.offer_exclusions} />

      {/* Before / After transformation (special visual) */}
      {(data.offer_transformation_before || data.offer_transformation_after) && (
        <PlaybookRow label="Transformation" description="The before-and-after journey your customer experiences." variableKey="offer_transformation_before" fullWidth>
          <div className="grid grid-cols-2 gap-0 rounded-xl overflow-hidden break-inside-avoid">
            <div className="p-6" style={{ backgroundColor: 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.05)' }}>
              <h4
                className="text-[11px] font-semibold uppercase mb-3"
                style={{ color: 'var(--playbook-neutral, #7A756D)', letterSpacing: '0.08em' }}
              >
                Before
              </h4>
              <SmartContent value={data.offer_transformation_before || '\u2014'} size="sm" />
            </div>
            <div className="p-6" style={{ backgroundColor: 'rgba(var(--playbook-primary-rgb, 30, 107, 99), 0.05)' }}>
              <h4
                className="text-[11px] font-semibold uppercase mb-3"
                style={{ color: 'var(--playbook-primary, #1E6B63)', letterSpacing: '0.08em' }}
              >
                After
              </h4>
              <SmartContent value={data.offer_transformation_after || '\u2014'} size="sm" />
            </div>
          </div>
        </PlaybookRow>
      )}

      {/* Positioning */}
      <PlaybookRow {...getVariableDescription('positioning_statement')} variableKey="positioning_statement" value={data.positioning_statement} />
      <PlaybookRow {...getVariableDescription('differentiation_statement')} variableKey="differentiation_statement" value={data.differentiation_statement} />
      <PlaybookRow {...getVariableDescription('category')} variableKey="category" value={data.category} />
      <PlaybookRow {...getVariableDescription('competitive_landscape')} variableKey="competitive_landscape" value={data.competitive_landscape} />

      {/* Lead Magnet */}
      <PlaybookRow {...getVariableDescription('lead_magnet_type')} variableKey="lead_magnet_type" value={data.lead_magnet_type} />
      <PlaybookRow {...getVariableDescription('lead_magnet_title')} variableKey="lead_magnet_title" value={data.lead_magnet_title} />
      <PlaybookRow {...getVariableDescription('lead_magnet_promise')} variableKey="lead_magnet_promise" value={data.lead_magnet_promise} />
      <PlaybookRow {...getVariableDescription('lead_magnet_content_outline')} variableKey="lead_magnet_content_outline" value={data.lead_magnet_content_outline} />
    </PlaybookSection>
  );
}
