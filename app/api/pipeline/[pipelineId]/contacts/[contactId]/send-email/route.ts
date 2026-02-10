import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendAutomationEmail } from '@/lib/resend';
import { buildMergeContext, resolveMergeFields } from '@/lib/automations/merge-fields';
import type { Json } from '@/types/database';

export async function POST(request: NextRequest, { params }: { params: Promise<{ pipelineId: string; contactId: string }> }) {
  const { contactId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  if (!body.template_id) return NextResponse.json({ error: 'template_id required' }, { status: 400 });

  const { data: contact } = await supabase.from('pipeline_contacts').select('email, organization_id').eq('id', contactId).single();
  if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  if (!contact.email) return NextResponse.json({ error: 'Contact has no email address' }, { status: 400 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', contact.organization_id).eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: template } = await supabase.from('email_templates').select('subject, body_html').eq('id', body.template_id).single();
  if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

  const context = await buildMergeContext(contactId);
  const subject = resolveMergeFields(template.subject, context);
  const bodyHtml = resolveMergeFields(template.body_html, context);

  try {
    await sendAutomationEmail({ to: contact.email, subject, bodyHtml, fromName: body.from_name });

    await supabase.from('pipeline_activity').insert({
      contact_id: contactId,
      organization_id: contact.organization_id,
      event_type: 'email_sent',
      performed_by: user.id,
      metadata: { template_id: body.template_id, subject } as unknown as Json,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to send email' }, { status: 500 });
  }
}
