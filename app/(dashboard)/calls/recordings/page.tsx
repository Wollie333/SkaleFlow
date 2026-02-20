import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CALL_TYPE_LABELS } from '@/lib/calls/helpers';
import type { CallType } from '@/types/database';

export default async function RecordingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: member } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!member) redirect('/login');

  // Fetch completed calls that have a recording_url
  const { data: recordings } = await supabase
    .from('calls')
    .select('id, title, call_type, room_code, recording_url, actual_start, actual_end, scheduled_duration_min, created_at')
    .eq('organization_id', member.organization_id)
    .not('recording_url', 'is', null)
    .order('actual_end', { ascending: false })
    .limit(50);

  function calcDuration(start: string | null, end: string | null): string {
    if (!start || !end) return '—';
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-charcoal">Recordings</h1>
          <p className="text-sm text-stone mt-1">Call recordings are saved automatically after each recorded call</p>
        </div>
      </div>

      {!recordings || recordings.length === 0 ? (
        <div className="text-center py-16 bg-cream-warm rounded-xl border border-stone/10">
          <svg className="w-10 h-10 mx-auto text-stone/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
          </svg>
          <p className="text-stone text-sm mb-1">No recordings yet</p>
          <p className="text-xs text-stone/60">Recordings appear here after you record a call</p>
        </div>
      ) : (
        <div className="bg-cream-warm rounded-xl border border-stone/10 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone/10">
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Call Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Duration</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone/5">
              {recordings.map((call) => (
                <tr key={call.id} className="hover:bg-cream/30 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-medium text-charcoal text-sm">{call.title}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-0.5 text-xs rounded bg-cream text-stone">
                      {CALL_TYPE_LABELS[call.call_type as CallType] || call.call_type}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-stone">
                    {call.actual_end
                      ? new Date(call.actual_end).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
                      : new Date(call.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
                    }
                  </td>
                  <td className="px-5 py-4 text-sm text-stone font-mono">
                    {calcDuration(call.actual_start, call.actual_end)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <a
                      href={call.recording_url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal bg-teal/10 rounded-lg hover:bg-teal/20 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
