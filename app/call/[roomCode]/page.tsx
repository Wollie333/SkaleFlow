import { createServiceClient } from '@/lib/supabase/server';
import { GuestJoinForm } from './guest-join-form';

export default async function GuestCallRoomPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await params;
  const serviceClient = createServiceClient();

  // Fetch call info (public — no auth required for guests)
  const { data: call } = await serviceClient
    .from('calls')
    .select('id, title, organization_id')
    .eq('room_code', roomCode)
    .single();

  if (!call) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F1F1D]">
        <div className="text-center">
          <h1 className="text-xl font-bold text-white mb-2">Call Not Found</h1>
          <p className="text-white/50 text-sm">This call room does not exist or has ended.</p>
        </div>
      </div>
    );
  }

  return (
    <GuestJoinForm
      roomCode={roomCode}
      callId={call.id}
      callTitle={call.title}
    />
  );
}
