import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getFormTheme } from '@/lib/forms/form-theme';
import type { Json } from '@/types/database';

// GET - Fetch published form + fields + brand theme (public, no auth)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createServiceClient();

  const { data: form, error } = await supabase
    .from('pipeline_forms')
    .select('*, pipeline_form_fields(*)')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error || !form) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 });
  }

  // Fetch brand theme for the org
  let theme = null;
  try {
    theme = await getFormTheme(form.organization_id);
  } catch {
    // Fall back to default theme
  }

  // Sort fields by sort_order
  const fields = (form.pipeline_form_fields || []).sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  );

  return NextResponse.json({
    id: form.id,
    name: form.name,
    description: form.description,
    submit_button_text: form.submit_button_text,
    success_message: form.success_message,
    fields,
    theme,
  });
}

// POST - Submit form (public, no auth)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createServiceClient();

  // Fetch form + fields
  const { data: form, error: formError } = await supabase
    .from('pipeline_forms')
    .select('*, pipeline_form_fields(*)')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (formError || !form) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 });
  }

  const body = await request.json();
  const submissions: Record<string, string> = body.data || {};
  const fields = (form.pipeline_form_fields || []) as Array<{
    id: string;
    label: string;
    field_type: string;
    is_required: boolean;
    mapping: string;
  }>;

  // Validate required fields
  for (const field of fields) {
    if (field.is_required) {
      const value = submissions[field.id];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return NextResponse.json(
          { error: `${field.label} is required` },
          { status: 400 }
        );
      }
    }
  }

  // Map fields to contact data
  // Use effective mapping: prefer field_type for email/phone if mapping was misconfigured
  let fullName = '';
  let email: string | null = null;
  let phone: string | null = null;
  let company: string | null = null;
  const customFields: Record<string, string> = {};

  for (const field of fields) {
    const value = submissions[field.id] || '';
    if (!value) continue;

    // Resolve mapping: field_type overrides stored mapping for email/phone
    let effectiveMapping = field.mapping;
    if (field.field_type === 'email') effectiveMapping = 'email';
    if (field.field_type === 'phone') effectiveMapping = 'phone';

    switch (effectiveMapping) {
      case 'full_name':
        fullName = value;
        break;
      case 'email':
        email = value;
        break;
      case 'phone':
        phone = value;
        break;
      case 'company':
        company = value;
        break;
      default:
        if (effectiveMapping.startsWith('custom:')) {
          const key = effectiveMapping.slice(7);
          customFields[key] = value;
        } else {
          customFields[effectiveMapping] = value;
        }
        break;
    }
  }

  if (!fullName) {
    return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
  }

  // Create CRM contact
  const nameParts = fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || fullName;
  const lastName = nameParts.slice(1).join(' ') || '';

  let crmContactId: string | null = null;

  const { data: crmContact } = await supabase
    .from('crm_contacts')
    .insert({
      organization_id: form.organization_id,
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      source: 'website',
      lifecycle_stage: 'lead',
      custom_fields: (Object.keys(customFields).length > 0 ? customFields : {}) as unknown as Json,
    })
    .select('id')
    .single();

  if (crmContact) {
    crmContactId = crmContact.id;
  }

  // Create pipeline contact
  const { data: contact, error: contactError } = await supabase
    .from('pipeline_contacts')
    .insert({
      organization_id: form.organization_id,
      pipeline_id: form.pipeline_id,
      stage_id: form.stage_id,
      full_name: fullName,
      email: email,
      phone: phone,
      company: company,
      custom_fields: (Object.keys(customFields).length > 0 ? customFields : {}) as unknown as Json,
      crm_contact_id: crmContactId,
    })
    .select()
    .single();

  if (contactError) {
    return NextResponse.json({ error: 'Failed to submit form' }, { status: 500 });
  }

  // Log pipeline activity
  await supabase.from('pipeline_activity').insert({
    contact_id: contact.id,
    organization_id: form.organization_id,
    event_type: 'contact_created',
    to_stage_id: form.stage_id,
    metadata: { source: 'form', form_id: form.id } as unknown as Json,
  });

  // Emit automation event
  try {
    const { emitPipelineEvent } = await import('@/lib/automations/events');
    await emitPipelineEvent({
      type: 'contact_created',
      contactId: contact.id,
      organizationId: form.organization_id,
      pipelineId: form.pipeline_id,
      data: {},
    });
  } catch (err) {
    console.error('Failed to emit contact_created event:', err);
  }

  return NextResponse.json({
    success: true,
    message: form.success_message,
  });
}
