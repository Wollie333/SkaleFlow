import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CallRoom } from '@/components/calls/call-room';

export default async function FullPageCallRoomPage({
  params,
}: {
  params: Promise<{ roomCode: string }>;
}) {
  const { roomCode } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get the call
  const { data: call } = await supabase
    .from('calls')
    .select('id, host_user_id, organization_id, title, call_type, call_status, template_id')
    .eq('room_code', roomCode)
    .single();

  if (!call) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F1F1D]">
        <div className="text-center">
          <h1 className="text-xl font-bold text-white mb-2">Call Not Found</h1>
          <p className="text-white/50 text-sm">This call room does not exist.</p>
        </div>
      </div>
    );
  }

  const isHost = call.host_user_id === user.id;

  return (
    <CallRoom
      roomCode={roomCode}
      callId={call.id}
      callTitle={call.title}
      organizationId={call.organization_id}
      userId={user.id}
      isHost={isHost}
      showOpenInTab={false}
    />
  );
}
