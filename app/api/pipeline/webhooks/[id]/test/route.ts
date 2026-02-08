import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: endpoint } = await supabase.from('webhook_endpoints').select('*').eq('id', params.id).single();
  if (!endpoint) return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', endpoint.organization_id).eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const testPayload = {
    event: 'test',
    timestamp: new Date().toISOString(),
    contact: {
      id: '00000000-0000-0000-0000-000000000000',
      full_name: 'Test Contact',
      email: 'test@example.com',
      company: 'Test Company',
      value_cents: 10000,
    },
    context: {
      pipeline: { name: 'Test Pipeline' },
      stage: { name: 'Test Stage' },
      organization: { name: 'Test Organization' },
    },
  };

  try {
    const headers = (endpoint.headers || {}) as Record<string, string>;
    const response = await fetch(endpoint.url, {
      method: endpoint.method || 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(testPayload),
    });

    return NextResponse.json({
      success: response.ok,
      statusCode: response.status,
      statusText: response.statusText,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Request failed',
    }, { status: 500 });
  }
}
