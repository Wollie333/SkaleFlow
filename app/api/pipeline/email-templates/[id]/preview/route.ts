import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveMergeFields } from '@/lib/automations/merge-fields';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: template } = await supabase.from('email_templates').select('*').eq('id', params.id).single();
  if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', template.organization_id).eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Use sample data for preview
  const sampleContext = {
    contact: { full_name: 'Jane Doe', email: 'jane@example.com', phone: '+27 123 456 789', company: 'Acme Inc' },
    pipeline: { name: 'Sales Pipeline' },
    stage: { name: 'Qualified' },
    org: { name: 'My Organization' },
  };

  const subject = resolveMergeFields(template.subject, sampleContext);
  const bodyHtml = resolveMergeFields(template.body_html, sampleContext);

  return NextResponse.json({ subject, bodyHtml });
}
