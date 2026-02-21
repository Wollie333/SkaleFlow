import type { CallType } from '@/types/database';

export interface ScoringDimension {
  key: string;
  label: string;
  description: string;
  weight: number; // 0-1, must sum to ~1.0 per call type
}

const salesDimensions: ScoringDimension[] = [
  { key: 'framework_adherence', label: 'Framework Adherence', description: 'How well the call framework was followed', weight: 0.15 },
  { key: 'rapport_building', label: 'Rapport Building', description: 'Quality of relationship building during the call', weight: 0.15 },
  { key: 'objection_handling', label: 'Objection Handling', description: 'How well objections were addressed and resolved', weight: 0.20 },
  { key: 'value_presentation', label: 'Value Presentation', description: 'Effectiveness of communicating the value proposition', weight: 0.20 },
  { key: 'closing_technique', label: 'Closing Technique', description: 'Effectiveness of the call closing and next step setup', weight: 0.15 },
  { key: 'urgency_creation', label: 'Urgency Creation', description: 'How well urgency and motivation to act was established', weight: 0.15 },
];

const discoveryDimensions: ScoringDimension[] = [
  { key: 'question_depth', label: 'Question Depth', description: 'Quality and depth of discovery questions asked', weight: 0.25 },
  { key: 'active_listening', label: 'Active Listening', description: 'Evidence of active listening and follow-up probing', weight: 0.20 },
  { key: 'need_identification', label: 'Need Identification', description: 'How well prospect needs and pain points were uncovered', weight: 0.25 },
  { key: 'rapport', label: 'Rapport', description: 'Quality of rapport and trust building', weight: 0.15 },
  { key: 'qualification_accuracy', label: 'Qualification Accuracy', description: 'Accuracy of prospect qualification and fit assessment', weight: 0.15 },
];

const onboardingDimensions: ScoringDimension[] = [
  { key: 'clarity_of_process', label: 'Clarity of Process', description: 'How clearly the onboarding process was explained', weight: 0.25 },
  { key: 'expectation_setting', label: 'Expectation Setting', description: 'How well expectations and timelines were set', weight: 0.20 },
  { key: 'engagement', label: 'Engagement', description: 'Client engagement and participation level', weight: 0.20 },
  { key: 'knowledge_transfer', label: 'Knowledge Transfer', description: 'Effectiveness of information and tool handoff', weight: 0.20 },
  { key: 'satisfaction_check', label: 'Satisfaction Check', description: 'Whether client satisfaction was confirmed', weight: 0.15 },
];

const meetingDimensions: ScoringDimension[] = [
  { key: 'agenda_adherence', label: 'Agenda Adherence', description: 'How well the meeting followed the planned agenda', weight: 0.20 },
  { key: 'decision_clarity', label: 'Decision Clarity', description: 'Clarity of decisions made during the meeting', weight: 0.25 },
  { key: 'participation_balance', label: 'Participation Balance', description: 'How balanced the conversation was among participants', weight: 0.15 },
  { key: 'action_orientation', label: 'Action Orientation', description: 'Whether clear action items and owners were established', weight: 0.25 },
  { key: 'time_management', label: 'Time Management', description: 'Effectiveness of time usage during the meeting', weight: 0.15 },
];

const followUpDimensions: ScoringDimension[] = [
  { key: 'commitment_tracking', label: 'Commitment Tracking', description: 'How well previous commitments were reviewed', weight: 0.25 },
  { key: 'relationship_warmth', label: 'Relationship Warmth', description: 'Quality of ongoing relationship maintenance', weight: 0.15 },
  { key: 'progress_assessment', label: 'Progress Assessment', description: 'Thoroughness of progress review since last interaction', weight: 0.25 },
  { key: 'next_step_clarity', label: 'Next Step Clarity', description: 'Clarity and specificity of agreed next steps', weight: 0.20 },
  { key: 'value_reinforcement', label: 'Value Reinforcement', description: 'How well ongoing value was demonstrated', weight: 0.15 },
];

const customDimensions: ScoringDimension[] = [
  { key: 'framework_adherence', label: 'Framework Adherence', description: 'How well the call structure was followed', weight: 0.20 },
  { key: 'communication_clarity', label: 'Communication Clarity', description: 'Clarity and effectiveness of communication', weight: 0.20 },
  { key: 'objective_progress', label: 'Objective Progress', description: 'Progress made toward the call objective', weight: 0.25 },
  { key: 'engagement', label: 'Engagement', description: 'Level of engagement from all participants', weight: 0.15 },
  { key: 'actionable_outcomes', label: 'Actionable Outcomes', description: 'Quality and clarity of actionable outcomes', weight: 0.20 },
];

const dimensionMap: Record<CallType, ScoringDimension[]> = {
  sales: salesDimensions,
  discovery: discoveryDimensions,
  onboarding: onboardingDimensions,
  meeting: meetingDimensions,
  follow_up: followUpDimensions,
  custom: customDimensions,
};

export function getScoringDimensions(callType: CallType): ScoringDimension[] {
  return dimensionMap[callType] || customDimensions;
}
