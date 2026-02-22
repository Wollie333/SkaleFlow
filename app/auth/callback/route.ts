import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  const inviteToken = searchParams.get('invite');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user exists in our users table
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Check if user record exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();

        if (!existingUser) {
          // Create user record
          await supabase.from('users').insert({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || user.email!.split('@')[0],
          });
        }

        // Update last login
        await supabase
          .from('users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', user.id);

        // Process invite token if present
        if (inviteToken) {
          try {
            const serviceSupabase = createServiceClient();

            // Fetch the invitation by token
            const { data: invitation } = await serviceSupabase
              .from('invitations')
              .select('id, email, organization_name, invited_by, status, expires_at')
              .eq('token', inviteToken)
              .eq('status', 'pending')
              .single();

            if (invitation && new Date(invitation.expires_at) > new Date()) {
              // Look up the organization by name
              const { data: org } = await serviceSupabase
                .from('organizations')
                .select('id')
                .eq('name', invitation.organization_name)
                .single();

              if (org) {
                // Check if user is already a member of this org
                const { data: existingMembership } = await serviceSupabase
                  .from('org_members')
                  .select('id')
                  .eq('user_id', user.id)
                  .eq('organization_id', org.id)
                  .maybeSingle();

                if (!existingMembership) {
                  // Insert org_members record
                  await serviceSupabase
                    .from('org_members')
                    .insert({
                      user_id: user.id,
                      organization_id: org.id,
                      role: 'member',
                      invited_by: invitation.invited_by,
                    });
                }

                // Auto-approve the user and update name from metadata
                const updateData: Record<string, unknown> = { approved: true };
                if (user.user_metadata?.full_name) {
                  updateData.full_name = user.user_metadata.full_name;
                }
                await serviceSupabase
                  .from('users')
                  .update(updateData)
                  .eq('id', user.id);

                // Mark invitation as accepted
                await serviceSupabase
                  .from('invitations')
                  .update({
                    status: 'accepted',
                    accepted_at: new Date().toISOString(),
                  })
                  .eq('id', invitation.id);
              }
            }
          } catch (inviteError) {
            console.error('Error processing invite token:', inviteError);
            // Don't block login if invite processing fails
          }
        }
      }

      // After invite signup verification, redirect to login
      if (inviteToken) {
        return NextResponse.redirect(`${origin}/login?verified=true`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth failed, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
