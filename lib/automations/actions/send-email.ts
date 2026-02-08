import { createServiceClient } from '@/lib/supabase/server';
import { sendAutomationEmail } from '@/lib/resend';
import { buildMergeContext, resolveMergeFields } from '../merge-fields';
import { StepConfig } from '../types';

export async function executeSendEmail(contactId: string, config: StepConfig): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  if (!config.template_id) {
    return { success: false, error: 'No template_id configured' };
  }

  const { data: contact } = await supabase
    .from('pipeline_contacts')
    .select('email, organization_id')
    .eq('id', contactId)
    .single();

  if (!contact?.email) {
    return { success: false, error: 'Contact has no email address' };
  }

  const { data: template } = await supabase
    .from('email_templates')
    .select('subject, body_html')
    .eq('id', config.template_id)
    .single();

  if (!template) {
    return { success: false, error: 'Email template not found' };
  }

  const context = await buildMergeContext(contactId);
  const subject = resolveMergeFields(template.subject, context);
  const bodyHtml = resolveMergeFields(template.body_html, context);

  try {
    await sendAutomationEmail({
      to: contact.email,
      subject,
      bodyHtml,
      fromName: config.from_name,
    });

    // Log activity
    await supabase.from('pipeline_activity').insert({
      contact_id: contactId,
      organization_id: contact.organization_id,
      event_type: 'email_sent',
      metadata: { template_id: config.template_id, subject } as unknown as import('@/types/database').Json,
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to send email' };
  }
}
