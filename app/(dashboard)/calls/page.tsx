import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CALL_TYPE_LABELS, CALL_STATUS_LABELS, CALL_STATUS_COLORS, formatDuration } from '@/lib/calls/helpers';
import type { CallType, CallStatus } from '@/types/database';

export default async function CallsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: member } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!member) redirect('/login');

  // Upcoming calls
  const { data: upcomingCalls } = await supabase
    .from('calls')
    .select('*, call_participants(guest_name, guest_email, role)')
    .eq('organization_id', member.organization_id)
    .in('call_status', ['scheduled', 'waiting'])
    .gte('scheduled_start', new Date().toISOString())
    .order('scheduled_start', { ascending: true })
    .limit(20);

  // Past calls
  const { data: pastCalls } = await supabase
    .from('calls')
    .select('*, call_summaries(id)')
    .eq('organization_id', member.organization_id)
    .eq('call_status', 'completed')
    .order('actual_end', { ascending: false })
    .limit(20);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-charcoal">Calls</h1>
          <p className="text-sm text-stone mt-1">Video calls with AI sales co-pilot</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/calls/templates"
            className="px-4 py-2 text-sm font-medium text-charcoal bg-cream border border-stone/20 rounded-lg hover:bg-stone/10 transition-colors"
          >
            Templates
          </Link>
          <Link
            href="/calls/new"
            className="px-4 py-2 text-sm font-medium text-dark bg-gold rounded-lg hover:bg-gold/90 transition-colors"
          >
            New Call
          </Link>
        </div>
      </div>

      {/* Upcoming Calls */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-charcoal mb-4">Upcoming</h2>
        {!upcomingCalls || upcomingCalls.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-stone/10">
            <p className="text-stone text-sm">No upcoming calls</p>
            <Link href="/calls/new" className="text-teal text-sm hover:underline mt-1 inline-block">
              Schedule a call
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingCalls.map((call) => {
              const guests = (call.call_participants as Array<{ guest_name: string | null; role: string }> || [])
                .filter((p) => p.role === 'guest');
              return (
                <Link
                  key={call.id}
                  href={`/calls/${call.room_code}`}
                  className="block bg-white rounded-xl border border-stone/10 p-4 hover:border-teal/20 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-charcoal">{call.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-stone">
                        <span>{CALL_TYPE_LABELS[call.call_type as CallType]}</span>
                        <span>{call.scheduled_start ? new Date(call.scheduled_start).toLocaleString() : 'Unscheduled'}</span>
                        <span>{formatDuration(call.scheduled_duration_min)}</span>
                        {guests.length > 0 && (
                          <span>with {guests.map(g => g.guest_name).filter(Boolean).join(', ')}</span>
                        )}
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${CALL_STATUS_COLORS[call.call_status as CallStatus]}`}>
                      {CALL_STATUS_LABELS[call.call_status as CallStatus]}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Calls */}
      <div>
        <h2 className="text-lg font-semibold text-charcoal mb-4">Past Calls</h2>
        {!pastCalls || pastCalls.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-stone/10">
            <p className="text-stone text-sm">No past calls yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pastCalls.map((call) => {
              const hasSummary = Array.isArray(call.call_summaries) ? call.call_summaries.length > 0 : !!call.call_summaries;
              return (
                <Link
                  key={call.id}
                  href={hasSummary ? `/calls/${call.room_code}/summary` : `/calls/${call.room_code}`}
                  className="block bg-white rounded-xl border border-stone/10 p-4 hover:border-teal/20 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-charcoal">{call.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-stone">
                        <span>{CALL_TYPE_LABELS[call.call_type as CallType]}</span>
                        <span>{call.actual_end ? new Date(call.actual_end).toLocaleDateString() : 'Unknown date'}</span>
                        {hasSummary && <span className="text-teal">Summary available</span>}
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${CALL_STATUS_COLORS[call.call_status as CallStatus]}`}>
                      {CALL_STATUS_LABELS[call.call_status as CallStatus]}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
