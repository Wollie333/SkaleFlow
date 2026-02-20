'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserAvatar } from '@/components/ui';

export default function TestAvatarPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        setUser({ ...authUser, profile });
      }
      setLoading(false);
    }
    fetchUser();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Avatar Diagnostic Page</h1>

      <div className="space-y-6">
        {/* Avatar Display Test */}
        <div className="bg-cream-warm p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Avatar Component Test</h2>
          <div className="flex items-center gap-4">
            <UserAvatar
              avatarUrl={user?.profile?.avatar_url}
              userName={user?.profile?.full_name}
              size="xl"
            />
            <div>
              <p className="text-sm text-stone">Size: XL (96x96px)</p>
              <p className="text-sm text-stone">
                Status: {user?.profile?.avatar_url ? 'Has Avatar URL' : 'No Avatar URL'}
              </p>
            </div>
          </div>
        </div>

        {/* Raw Data */}
        <div className="bg-cream-warm p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">User Data</h2>
          <div className="space-y-2 text-sm">
            <p><strong>User ID:</strong> {user?.id}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Full Name:</strong> {user?.profile?.full_name || 'Not set'}</p>
            <p><strong>Avatar URL:</strong></p>
            <div className="bg-cream p-3 rounded mt-1 break-all font-mono text-xs">
              {user?.profile?.avatar_url || 'NULL (No avatar uploaded)'}
            </div>
          </div>
        </div>

        {/* Avatar URL Preview */}
        {user?.profile?.avatar_url && (
          <div className="bg-cream-warm p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Direct Image Preview</h2>
            <img
              src={user.profile.avatar_url}
              alt="Direct preview"
              className="w-32 h-32 rounded-full object-cover border-4 border-stone/10"
              onError={(e) => {
                console.error('Image failed to load:', user.profile.avatar_url);
                (e.target as HTMLImageElement).style.border = '4px solid red';
              }}
            />
            <p className="text-sm text-stone mt-2">
              If you see a broken image above, the URL might be invalid or inaccessible.
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Troubleshooting Steps</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Check if "Avatar URL" above shows a valid URL</li>
            <li>If NULL, go to <a href="/settings" className="text-blue-600 underline">Settings</a> and upload a profile picture</li>
            <li>After uploading, refresh this page</li>
            <li>Do a hard refresh (Ctrl+Shift+R or Cmd+Shift+R) to clear cache</li>
            <li>Check browser console for any errors</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
