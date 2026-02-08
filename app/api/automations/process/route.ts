import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { resumeFromDelay } from '@/lib/automations/executor';

export async function GET() {
  const supabase = createServiceClient();

  // Find waiting step logs where next_retry_at has passed
  const { data: waitingSteps, error } = await supabase
    .from('automation_step_logs')
    .select('id, run_id, step_id')
    .eq('status', 'waiting')
    .lte('next_retry_at', new Date().toISOString())
    .limit(50);

  if (error) {
    console.error('Error querying waiting steps:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!waitingSteps || waitingSteps.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  let processed = 0;
  for (const step of waitingSteps) {
    try {
      await resumeFromDelay(step.run_id, step.step_id);
      processed++;
    } catch (err) {
      console.error(`Error resuming run ${step.run_id} step ${step.step_id}:`, err);
    }
  }

  return NextResponse.json({ processed });
}
