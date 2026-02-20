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

    // Get latest non-abandoned audit for this contact
    const { data: audit } = await supabase
      .from('brand_audits')
      .select(`
        id,
        status,
        overall_score,
        overall_rating,
        source,
        created_at,
        brand_audit_scores (category, rating)
      `)
      .eq('contact_id', id)
      .neq('status', 'abandoned')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!audit) {
      return NextResponse.json(null);
    }

    // Count total audits
    const { count } = await supabase
      .from('brand_audits')
      .select('id', { count: 'exact', head: true })
      .eq('contact_id', id)
      .neq('status', 'abandoned');

    return NextResponse.json({
      latest_audit_id: audit.id,
      status: audit.status,
      overall_score: audit.overall_score,
      overall_rating: audit.overall_rating,
      source: audit.source,
      audit_date: audit.created_at,
      total_audits: count || 1,
      scores: audit.brand_audit_scores || [],
    });
  } catch (error) {
    console.error('Error fetching audit summary:', error);
    return NextResponse.json(null);
  }
}
