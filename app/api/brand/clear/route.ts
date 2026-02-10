import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = await request.json();

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    // Verify org membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete all UNLOCKED brand outputs for this organization.
    // Locked outputs (user-confirmed) are preserved.
    // brand_conversations (AI chat threads) are never touched.
    const { data: deleted, error: deleteError } = await supabase
      .from('brand_outputs')
      .delete()
      .eq('organization_id', organizationId)
      .eq('is_locked', false)
      .select('id');

    if (deleteError) {
      logger.error('Failed to clear brand outputs', {
        organizationId,
        error: deleteError.message,
      });
      return NextResponse.json({ error: 'Failed to clear data' }, { status: 500 });
    }

    const deletedCount = deleted?.length ?? 0;

    logger.info('Brand outputs cleared', {
      organizationId,
      deletedCount,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      deletedCount,
    });
  } catch (error) {
    logger.error('Brand clear error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to clear data' }, { status: 500 });
  }
}
