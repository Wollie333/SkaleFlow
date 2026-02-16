import { createServiceClient } from '@/lib/supabase/server';

export interface CallScore {
  overall: number; // 0-100
  frameworkAdherence: number;
  talkRatio: number; // host talk percentage (lower is usually better for discovery)
  questionQuality: number;
  objectionHandling: number;
  closingEffectiveness: number;
}

export async function scoreCall(callId: string, orgId: string, userId: string) {
  const supabase = createServiceClient();

  // Get transcripts for talk ratio
  const { data: transcripts } = await supabase
    .from('call_transcripts')
    .select('speaker_label, content')
    .eq('call_id', callId);

  // Get guidance usage
  const { data: guidance } = await supabase
    .from('call_ai_guidance')
    .select('was_used, was_dismissed, guidance_type')
    .eq('call_id', callId);

  // Calculate talk ratio
  let hostWords = 0;
  let guestWords = 0;

  // First pass: identify host vs guest
  const { data: participants } = await supabase
    .from('call_participants')
    .select('id, role, guest_name')
    .eq('call_id', callId);

  const hostParticipantIds = new Set(
    (participants || []).filter(p => p.role === 'host' || p.role === 'team_member').map(p => p.id)
  );

  for (const t of transcripts || []) {
    const words = t.content.split(/\s+/).length;
    // Simple heuristic: if label matches host participant, count as host
    if (t.speaker_label === 'You' || t.speaker_label.toLowerCase().includes('host')) {
      hostWords += words;
    } else {
      guestWords += words;
    }
  }

  const totalWords = hostWords + guestWords;
  const talkRatio = totalWords > 0 ? Math.round((hostWords / totalWords) * 100) : 50;

  // Framework adherence: how many guidance items were used
  const totalGuidance = guidance?.length || 0;
  const usedGuidance = guidance?.filter(g => g.was_used).length || 0;
  const frameworkAdherence = totalGuidance > 0 ? Math.round((usedGuidance / totalGuidance) * 100) : 50;

  // Question quality: ratio of questions asked
  const questionGuidance = guidance?.filter(g => g.guidance_type === 'question') || [];
  const questionsUsed = questionGuidance.filter(g => g.was_used).length;
  const questionQuality = questionGuidance.length > 0
    ? Math.round((questionsUsed / questionGuidance.length) * 100)
    : 50;

  // Objection handling
  const objectionGuidance = guidance?.filter(g => g.guidance_type === 'objection_response') || [];
  const objectionsHandled = objectionGuidance.filter(g => g.was_used).length;
  const objectionHandling = objectionGuidance.length > 0
    ? Math.round((objectionsHandled / objectionGuidance.length) * 100)
    : 100; // No objections = perfect score

  // Closing effectiveness (simplified)
  const closingGuidance = guidance?.filter(g => g.guidance_type === 'closing') || [];
  const closingEffectiveness = closingGuidance.length > 0 ? (closingGuidance.some(g => g.was_used) ? 80 : 40) : 50;

  // Overall score
  const overall = Math.round(
    frameworkAdherence * 0.25 +
    (100 - Math.abs(talkRatio - 40)) * 0.20 + // Ideal: 40% host, 60% guest
    questionQuality * 0.20 +
    objectionHandling * 0.20 +
    closingEffectiveness * 0.15
  );

  const score: CallScore = {
    overall: Math.max(0, Math.min(100, overall)),
    frameworkAdherence,
    talkRatio,
    questionQuality,
    objectionHandling,
    closingEffectiveness,
  };

  await supabase
    .from('call_summaries')
    .update({ call_score: score as unknown as Record<string, unknown>, updated_at: new Date().toISOString() })
    .eq('call_id', callId);

  return score;
}
