import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { TemplateCategory } from '@/types/database';

/**
 * GET — return active content templates (global, not per-org).
 * Used by content engine UI for template selection dropdowns.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const formatCategory = url.searchParams.get('formatCategory');

    let query = supabase
      .from('content_templates')
      .select('id, template_key, name, category, content_type, format_category, tier, funnel_stages, structure')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (category) {
      query = query.eq('category', category as TemplateCategory);
    }
    if (formatCategory) {
      query = query.eq('format_category', formatCategory);
    }

    const { data: templates } = await query;

    return NextResponse.json({ templates: templates || [] });
  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json({ error: 'Failed to load templates' }, { status: 500 });
  }
}
