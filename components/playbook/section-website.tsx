import { PlaybookSection } from './playbook-section';
import { PlaybookRow } from './playbook-row';
import { getVariableDescription } from '@/config/variable-descriptions';
import type { ParsedBrandData } from '@/lib/playbook/parse-brand-outputs';

interface Props {
  data: ParsedBrandData;
  id?: string;
}

/** Parse sitemap text into clean page names */
function parseSitemapPages(text: string): string[] {
  const seen = new Set<string>();
  const pages: string[] = [];

  const addPage = (raw: string) => {
    let name = raw.trim()
      .replace(/^[-\u2013\u2014*\u2022\u25E6\u25B8\u25AA\u25BA\u2726\u2192|+\u251C\u2514\u2500\u250C\u2510\u2502\u2524\u252C\u2534\u253C]+\s*/, '')
      .replace(/^\d+[.)]\s+/, '')
      .replace(/^[/\\]+/, '');

    const parenMatch = name.match(/^([^(]+?)\s*\(.+\)$/);
    if (parenMatch) name = parenMatch[1].trim();

    const sepMatch = name.match(/^(.+?)\s*[-\u2013\u2014:]\s+.{10,}$/);
    if (sepMatch) name = sepMatch[1].trim();

    name = name.replace(/^["'\u201C\u201D]+|["'\u201C\u201D]+$/g, '');
    name = name.replace(/[.,;:]+$/, '').trim();

    if (!name) return;
    if (name.length > 30) name = name.substring(0, 30).trim();
    const lower = name.toLowerCase();
    if (seen.has(lower)) return;
    seen.add(lower);
    pages.push(name);
  };

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length >= 2) {
    for (const line of lines) addPage(line);
    if (pages.length >= 1) return pages;
  }

  const items = text.split(',').map(s => s.trim()).filter(Boolean);
  for (const item of items) addPage(item);

  return pages;
}

/** Mini browser-window page node */
function PageNode({ name, isRoot }: { name: string; isRoot?: boolean }) {
  const bg = isRoot ? 'var(--playbook-dark, #0F1F1D)' : 'white';
  const textColor = isRoot ? 'var(--playbook-light, #F0ECE4)' : 'var(--playbook-dark, #0F1F1D)';
  const dotColor = isRoot ? 'rgba(255,255,255,0.3)' : 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.3)';
  const barColor = isRoot ? 'rgba(255,255,255,0.1)' : 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.08)';

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: bg,
        border: isRoot ? 'none' : '1px solid rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.15)',
        minWidth: isRoot ? '140px' : '100px',
        maxWidth: '160px',
      }}
    >
      <div className="flex items-center gap-1 px-2.5 py-1.5" style={{ backgroundColor: barColor }}>
        <span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: dotColor }} />
        <span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: dotColor }} />
        <span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: dotColor }} />
      </div>
      <div className="px-3 py-2 text-center">
        <span
          className={`${isRoot ? 'text-[13px] font-bold' : 'text-[11px] font-medium'}`}
          style={{ color: textColor, fontFamily: 'var(--playbook-body-font)', lineHeight: '1.3' }}
        >
          {name}
        </span>
      </div>
    </div>
  );
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

const lineColor = 'rgba(var(--playbook-primary-rgb, 30, 107, 99), 0.25)';

function ChildRow({ children: pages }: { children: string[] }) {
  return (
    <div className="relative w-full">
      {pages.length > 1 && (
        <div
          className="absolute h-px"
          style={{
            backgroundColor: lineColor,
            top: 0,
            left: `${100 / (pages.length * 2)}%`,
            right: `${100 / (pages.length * 2)}%`,
          }}
        />
      )}
      <div className="flex justify-around" style={{ gap: '16px' }}>
        {pages.map((name, i) => (
          <div key={i} className="flex flex-col items-center" style={{ flex: '1 1 0', maxWidth: '150px', minWidth: 0 }}>
            <div className="w-px h-5" style={{ backgroundColor: lineColor }} />
            <PageNode name={name} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SitemapDiagram({ sitemap }: { sitemap: string }) {
  const pages = parseSitemapPages(sitemap);
  if (pages.length === 0) return null;

  const root = pages[0];
  const childPages = pages.slice(1);
  const rows = chunkArray(childPages, 5);

  return (
    <div className="break-inside-avoid">
      <div
        className="rounded-xl px-6 py-8"
        style={{
          backgroundColor: 'rgba(var(--playbook-primary-rgb, 30, 107, 99), 0.025)',
          border: '1px solid rgba(var(--playbook-primary-rgb, 30, 107, 99), 0.08)',
        }}
      >
        <div className="flex flex-col items-center">
          <PageNode name={root} isRoot />
          {childPages.length > 0 && (
            <div className="w-px h-7" style={{ backgroundColor: lineColor }} />
          )}
          {rows.map((row, ri) => (
            <div key={ri} className="w-full">
              <ChildRow>{row}</ChildRow>
              {ri < rows.length - 1 && (
                <div className="flex justify-center">
                  <div className="w-px h-5" style={{ backgroundColor: lineColor }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-right mt-2" style={{ color: 'var(--playbook-neutral, #7A756D)' }}>
        {pages.length} page{pages.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

export function SectionWebsite({ data, id }: Props) {
  const hasArchitecture = data.website_role || data.website_sitemap;
  const hasHomepage = data.homepage_hero || data.homepage_problem;
  const hasSalesPage = data.sales_page_hero;
  const hasSupporting = data.about_page_copy || data.problems_page_copy || data.results_page_copy;
  const hasConversion = data.apply_page_copy || data.form_fields;
  const hasContent = data.content_themes || data.beliefs_to_teach;
  const hasLeadPage = data.lead_page_headline || data.lead_page_copy;

  if (!hasArchitecture && !hasHomepage && !hasSalesPage && !hasSupporting && !hasConversion && !hasContent && !hasLeadPage) return null;

  return (
    <PlaybookSection id={id} number="07" title="Website & Copy" subtitle="Site architecture, page copy, and content strategy">
      {/* Architecture */}
      <PlaybookRow {...getVariableDescription('website_role')} variableKey="website_role" value={data.website_role} />
      <PlaybookRow {...getVariableDescription('primary_conversion')} variableKey="primary_conversion" value={data.primary_conversion} />
      <PlaybookRow {...getVariableDescription('secondary_conversion')} variableKey="secondary_conversion" value={data.secondary_conversion} />
      <PlaybookRow {...getVariableDescription('traffic_sources')} variableKey="traffic_sources" value={data.traffic_sources} />

      {/* Sitemap — special visual */}
      {data.website_sitemap && (
        <PlaybookRow label="Website Sitemap" description="The lean page structure serving your conversion goals." variableKey="website_sitemap" fullWidth>
          <SitemapDiagram sitemap={data.website_sitemap} />
        </PlaybookRow>
      )}

      <PlaybookRow {...getVariableDescription('user_journey')} variableKey="user_journey" value={data.user_journey} />

      {/* Content Strategy */}
      <PlaybookRow {...getVariableDescription('content_themes')} variableKey="content_themes" value={data.content_themes} />
      <PlaybookRow {...getVariableDescription('content_pillars')} variableKey="content_pillars" value={data.content_pillars} />
      <PlaybookRow {...getVariableDescription('beliefs_to_teach')} variableKey="beliefs_to_teach" value={data.beliefs_to_teach} />

      {/* Homepage Copy */}
      <PlaybookRow {...getVariableDescription('homepage_hero')} variableKey="homepage_hero" value={data.homepage_hero} />
      <PlaybookRow {...getVariableDescription('homepage_problem')} variableKey="homepage_problem" value={data.homepage_problem} />
      <PlaybookRow {...getVariableDescription('homepage_solution')} variableKey="homepage_solution" value={data.homepage_solution} />
      <PlaybookRow {...getVariableDescription('homepage_who_we_help')} variableKey="homepage_who_we_help" value={data.homepage_who_we_help} />
      <PlaybookRow {...getVariableDescription('homepage_proof')} variableKey="homepage_proof" value={data.homepage_proof} />
      <PlaybookRow {...getVariableDescription('homepage_why_us')} variableKey="homepage_why_us" value={data.homepage_why_us} />
      <PlaybookRow {...getVariableDescription('homepage_final_cta')} variableKey="homepage_final_cta" value={data.homepage_final_cta} />

      {/* Sales Page Copy */}
      <PlaybookRow {...getVariableDescription('sales_page_hero')} variableKey="sales_page_hero" value={data.sales_page_hero} />
      <PlaybookRow {...getVariableDescription('sales_page_story_pain')} variableKey="sales_page_story_pain" value={data.sales_page_story_pain} />
      <PlaybookRow {...getVariableDescription('sales_page_turn_enemy')} variableKey="sales_page_turn_enemy" value={data.sales_page_turn_enemy} />
      <PlaybookRow {...getVariableDescription('sales_page_value_stack')} variableKey="sales_page_value_stack" value={data.sales_page_value_stack} />
      <PlaybookRow {...getVariableDescription('sales_page_transformation')} variableKey="sales_page_transformation" value={data.sales_page_transformation} />
      <PlaybookRow {...getVariableDescription('sales_page_proof')} variableKey="sales_page_proof" value={data.sales_page_proof} />
      <PlaybookRow {...getVariableDescription('sales_page_faq')} variableKey="sales_page_faq" value={data.sales_page_faq} />
      <PlaybookRow {...getVariableDescription('sales_page_final_cta')} variableKey="sales_page_final_cta" value={data.sales_page_final_cta} />

      {/* Supporting Pages */}
      <PlaybookRow {...getVariableDescription('about_page_copy')} variableKey="about_page_copy" value={data.about_page_copy} />
      <PlaybookRow {...getVariableDescription('problems_page_copy')} variableKey="problems_page_copy" value={data.problems_page_copy} />
      <PlaybookRow {...getVariableDescription('results_page_copy')} variableKey="results_page_copy" value={data.results_page_copy} />

      {/* Conversion Pages */}
      <PlaybookRow {...getVariableDescription('apply_page_copy')} variableKey="apply_page_copy" value={data.apply_page_copy} />
      <PlaybookRow {...getVariableDescription('form_fields')} variableKey="form_fields" value={data.form_fields} />
      <PlaybookRow {...getVariableDescription('form_cta')} variableKey="form_cta" value={data.form_cta} />
      <PlaybookRow {...getVariableDescription('reassurance')} variableKey="reassurance" value={data.reassurance} />

      {/* Lead Magnet Page */}
      <PlaybookRow {...getVariableDescription('lead_page_headline')} variableKey="lead_page_headline" value={data.lead_page_headline} />
      <PlaybookRow {...getVariableDescription('lead_page_copy')} variableKey="lead_page_copy" value={data.lead_page_copy} />
      <PlaybookRow {...getVariableDescription('lead_page_cta')} variableKey="lead_page_cta" value={data.lead_page_cta} />
    </PlaybookSection>
  );
}
