/**
 * Admin API - Resend User Invite Email
 *
 * POST /api/admin/users/[userId]/resend-invite
 *
 * Sends a welcome/invite email to the user with login instructions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/resend';

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient();

    // Get current admin user
    const {
      data: { user: adminUser },
    } = await supabase.auth.getUser();

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if admin is super_admin
    const { data: admin } = await supabase
      .from('users')
      .select('role')
      .eq('id', adminUser.id)
      .single();

    if (!admin || admin.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        last_login_at,
        created_at
      `)
      .eq('id', params.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get organization details
    const { data: orgMember } = await supabase
      .from('org_members')
      .select(`
        organization_id,
        organizations (
          id,
          name,
          subscription_tiers:subscriptions (
            tier:subscription_tiers (
              name,
              slug
            )
          )
        )
      `)
      .eq('user_id', user.id)
      .single();

    const orgName = orgMember?.organizations?.name || 'SkaleFlow';
    const tierName =
      orgMember?.organizations?.subscription_tiers?.[0]?.tier?.name || 'Beta';

    // Generate a magic link for the user to sign in
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000';
    const loginUrl = `${appUrl}/auth/login?email=${encodeURIComponent(user.email)}`;

    // Send welcome email
    const emailSubject = user.last_login_at
      ? `Your SkaleFlow Account Access`
      : `Welcome to SkaleFlow - Get Started!`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailSubject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f9b8e 0%, #0d8579 100%); padding: 40px 40px 30px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; text-align: center;">
                ${user.last_login_at ? 'Access Your Account' : 'Welcome to SkaleFlow!'}
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Hi <strong>${user.full_name}</strong>,
              </p>

              ${
                user.last_login_at
                  ? `
                <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                  Here's your access link to sign in to your SkaleFlow account:
                </p>
              `
                  : `
                <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                  Your SkaleFlow account has been set up! We're excited to have you on board.
                </p>

                <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                  You've been enrolled in our <strong>${tierName}</strong> plan with access to:
                </p>

                <ul style="margin: 0 0 30px; padding-left: 20px; color: #1f2937; font-size: 16px; line-height: 1.8;">
                  <li><strong>Brand Engine</strong> - Build your brand identity</li>
                  <li><strong>Content Engine</strong> - Generate content powered by AI</li>
                  ${tierName !== 'Beta' ? '<li><strong>Analytics</strong> - Track your performance</li>' : ''}
                </ul>
              `
              }

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display: inline-block; background-color: #0f9b8e; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(15, 155, 142, 0.3);">
                      Access Your Dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                Or copy and paste this link into your browser:<br>
                <a href="${loginUrl}" style="color: #0f9b8e; text-decoration: none; word-break: break-all;">${loginUrl}</a>
              </p>

              ${
                tierName === 'Beta'
                  ? `
                <div style="margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px; border-left: 4px solid #0f9b8e;">
                  <p style="margin: 0; color: #1f2937; font-size: 14px; line-height: 1.6;">
                    <strong>💡 Note:</strong> As a beta user, you'll need to purchase credits to use AI-powered features. Visit <strong>Billing</strong> in your dashboard to get started.
                  </p>
                </div>
              `
                  : ''
              }
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                Need help? Contact us at <a href="mailto:support@skaleflow.com" style="color: #0f9b8e; text-decoration: none;">support@skaleflow.com</a>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} SkaleFlow. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send the email
    let emailSent = false;
    let emailError: string | null = null;

    try {
      await sendEmail({
        to: user.email,
        subject: emailSubject,
        html: emailHtml,
      });
      emailSent = true;
    } catch (error: any) {
      console.error('Failed to send email:', error);
      emailError = error.message;
    }

    return NextResponse.json({
      success: true,
      emailSent,
      emailError,
      message: emailSent
        ? `Invite email sent to ${user.email}`
        : `Invite created but email failed to send: ${emailError}`,
    });
  } catch (error: any) {
    console.error('Error resending invite:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
