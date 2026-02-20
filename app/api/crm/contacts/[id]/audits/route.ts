import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: audits, error } = await supabase
      .from('brand_audits')
      .select(`
        id,
        status,
        source,
        overall_score,
        overall_rating,
        sections_completed,
        total_sections,
        created_at,
        updated_at,
        users!brand_audits_created_by_fkey (full_name)
      `)
      .eq('contact_id', id)
      .neq('status', 'abandoned')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const normalized = (audits || []).map((a: Record<string, unknown>) => ({
      ...a,
      creator: a.users || null,
      users: undefined,
    }));

    return NextResponse.json(normalized);
  } catch (error) {
    console.error('Error fetching contact audits:', error);
    return NextResponse.json({ error: 'Failed to fetch audits' }, { status: 500 });
  }
}
