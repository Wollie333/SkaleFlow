import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const serviceClient = createServiceClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { method, email } = body; // method: 'email' | 'link'

    const { data: audit } = await supabase
      .from('brand_audits')
      .select('organization_id, status')
      .eq('id', id)
      .single();
    if (!audit) return NextResponse.json({ error: 'Audit not found' }, { status: 404 });

    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('organization_id', audit.organization_id)
      .eq('user_id', user.id)
      .single();
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get latest report
    const { data: report } = await serviceClient
      .from('brand_audit_reports')
      .select('*')
      .eq('audit_id', id)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (!report) {
      return NextResponse.json({ error: 'No report generated yet' }, { status: 400 });
    }

    if (method === 'email' && email) {
      // Send email with link
      try {
        const { sendNotificationEmail } = await import('@/lib/resend');
        const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.skaleflow.com'}/brand-audit/report/${report.share_token}`;
        await sendNotificationEmail({
          to: email,
          title: 'Your Brand Audit Report is Ready',
          body: `Your comprehensive brand audit report has been generated and is ready for review. Click the link below to view it.`,
          link: shareUrl,
        });
      } catch (emailError) {
        console.error('Error sending report email:', emailError);
      }

      // Update delivery tracking
      await serviceClient
        .from('brand_audit_reports')
        .update({
          delivered_at: new Date().toISOString(),
          delivered_via: 'email',
          delivered_to: email,
        })
        .eq('id', report.id);
    }

    // Update audit status to delivered
    await serviceClient
      .from('brand_audits')
      .update({ status: 'delivered' })
      .eq('id', id);

    // Build share URL
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.skaleflow.com'}/brand-audit/report/${report.share_token}`;

    return NextResponse.json({
      shareUrl,
      shareToken: report.share_token,
      delivered: method === 'email',
    });
  } catch (error) {
    console.error('Error delivering report:', error);
    return NextResponse.json({ error: 'Failed to deliver report' }, { status: 500 });
  }
}
