import { createServiceClient } from '@/lib/supabase/server';

type SupabaseClientLike = ReturnType<typeof createServiceClient>;

interface AuthorityAccess {
  authorized: boolean;
  role: string | null;
  isSuperAdmin: boolean;
  /** Use this client for data queries — bypasses RLS for super_admin */
  queryClient: SupabaseClientLike;
}

/**
 * Check if a user has access to an organization's Authority Engine.
 * Returns authorized=true if user is an org_member OR a super_admin.
 * Super admins get 'admin' role equivalent and a service client that bypasses RLS.
 */
export async function checkAuthorityAccess(
  supabase: SupabaseClientLike,
  userId: string,
  organizationId: string
): Promise<AuthorityAccess> {
  // Check org_members first
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .single();

  if (member) {
    return { authorized: true, role: member.role, isSuperAdmin: false, queryClient: supabase };
  }

  // Fallback: check if super_admin
  const serviceClient = createServiceClient();
  const { data: userData } = await serviceClient
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (userData?.role === 'super_admin') {
    // Super admin uses service client to bypass RLS (they're not in org_members)
    return { authorized: true, role: 'admin', isSuperAdmin: true, queryClient: serviceClient };
  }

  return { authorized: false, role: null, isSuperAdmin: false, queryClient: supabase };
}
