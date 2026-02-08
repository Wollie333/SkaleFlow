import { createServiceClient } from '@/lib/supabase/server';

interface MergeContext {
  contact: {
    full_name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
  };
  pipeline: {
    name: string;
  };
  stage: {
    name: string;
  };
  org: {
    name: string;
  };
}

export async function buildMergeContext(contactId: string): Promise<MergeContext> {
  const supabase = createServiceClient();

  const { data: contact } = await supabase
    .from('pipeline_contacts')
    .select('full_name, email, phone, company, pipeline_id, stage_id, organization_id')
    .eq('id', contactId)
    .single();

  if (!contact) {
    return {
      contact: { full_name: '', email: null, phone: null, company: null },
      pipeline: { name: '' },
      stage: { name: '' },
      org: { name: '' },
    };
  }

  const [pipelineRes, stageRes, orgRes] = await Promise.all([
    supabase.from('pipelines').select('name').eq('id', contact.pipeline_id).single(),
    supabase.from('pipeline_stages').select('name').eq('id', contact.stage_id).single(),
    supabase.from('organizations').select('name').eq('id', contact.organization_id).single(),
  ]);

  return {
    contact: {
      full_name: contact.full_name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
    },
    pipeline: { name: pipelineRes.data?.name || '' },
    stage: { name: stageRes.data?.name || '' },
    org: { name: orgRes.data?.name || '' },
  };
}

export function resolveMergeFields(template: string, context: MergeContext): string {
  const today = new Date().toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const fieldMap: Record<string, string> = {
    'contact.full_name': context.contact.full_name || '',
    'contact.email': context.contact.email || '',
    'contact.phone': context.contact.phone || '',
    'contact.company': context.contact.company || '',
    'pipeline.name': context.pipeline.name || '',
    'stage.name': context.stage.name || '',
    'org.name': context.org.name || '',
    'date.today': today,
  };

  return template.replace(/\{\{(\w+\.\w+)\}\}/g, (match, key) => {
    return fieldMap[key] ?? match;
  });
}

export const AVAILABLE_MERGE_FIELDS = [
  '{{contact.full_name}}',
  '{{contact.email}}',
  '{{contact.phone}}',
  '{{contact.company}}',
  '{{pipeline.name}}',
  '{{stage.name}}',
  '{{org.name}}',
  '{{date.today}}',
];
