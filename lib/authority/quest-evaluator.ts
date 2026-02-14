import { createServiceClient } from '@/lib/supabase/server';
import type { QuestRequirement } from './types';
import type { Json } from '@/types/database';

interface QuestDefinition {
  quest_slug: string;
  quest_name: string;
  tier: number;
  description: string;
  points_threshold_min: number;
  points_threshold_max: number | null;
  requirements: QuestRequirement[];
}

export const DEFAULT_QUESTS: QuestDefinition[] = [
  {
    quest_slug: 'foundation',
    quest_name: 'Foundation',
    tier: 1,
    description: 'Lay the groundwork for your authority journey.',
    points_threshold_min: 0,
    points_threshold_max: 50,
    requirements: [
      { type: 'publish_count', target: 1, current: 0, completed: false, label: 'Get 1 placement published' },
      { type: 'total_points', target: 50, current: 0, completed: false, label: 'Earn 50 authority points' },
    ],
  },
  {
    quest_slug: 'emerging',
    quest_name: 'Emerging Voice',
    tier: 2,
    description: 'Build momentum with multiple placements.',
    points_threshold_min: 50,
    points_threshold_max: 150,
    requirements: [
      { type: 'publish_count', target: 3, current: 0, completed: false, label: 'Get 3 placements published' },
      { type: 'total_points', target: 150, current: 0, completed: false, label: 'Earn 150 authority points' },
      { type: 'category_count', target: 2, current: 0, completed: false, label: 'Publish in 2 different categories' },
    ],
  },
  {
    quest_slug: 'rising',
    quest_name: 'Rising Star',
    tier: 3,
    description: 'Diversify your media presence and amplify your reach.',
    points_threshold_min: 150,
    points_threshold_max: 400,
    requirements: [
      { type: 'publish_count', target: 7, current: 0, completed: false, label: 'Get 7 placements published' },
      { type: 'total_points', target: 400, current: 0, completed: false, label: 'Earn 400 authority points' },
      { type: 'category_count', target: 3, current: 0, completed: false, label: 'Publish in 3 different categories' },
      { type: 'amplification_count', target: 1, current: 0, completed: false, label: 'Run 1 amplification campaign' },
    ],
  },
  {
    quest_slug: 'established',
    quest_name: 'Established Expert',
    tier: 4,
    description: 'Cement your position as a recognized authority.',
    points_threshold_min: 400,
    points_threshold_max: 800,
    requirements: [
      { type: 'publish_count', target: 15, current: 0, completed: false, label: 'Get 15 placements published' },
      { type: 'total_points', target: 800, current: 0, completed: false, label: 'Earn 800 authority points' },
      { type: 'category_count', target: 5, current: 0, completed: false, label: 'Publish in 5 different categories' },
      { type: 'amplification_count', target: 3, current: 0, completed: false, label: 'Run 3 amplification campaigns' },
    ],
  },
  {
    quest_slug: 'authority',
    quest_name: 'Authority Leader',
    tier: 5,
    description: 'You are an industry authority with widespread media presence.',
    points_threshold_min: 800,
    points_threshold_max: null,
    requirements: [
      { type: 'publish_count', target: 25, current: 0, completed: false, label: 'Get 25 placements published' },
      { type: 'total_points', target: 1500, current: 0, completed: false, label: 'Earn 1,500 authority points' },
      { type: 'category_count', target: 7, current: 0, completed: false, label: 'Publish in 7 different categories' },
      { type: 'amplification_count', target: 5, current: 0, completed: false, label: 'Run 5 amplification campaigns' },
      { type: 'national_plus_count', target: 3, current: 0, completed: false, label: 'Get 3 national/international placements' },
    ],
  },
];

interface OrgStats {
  publishCount: number;
  totalPoints: number;
  uniqueCategories: number;
  amplificationCount: number;
  nationalPlusCount: number;
}

async function getOrgStats(orgId: string): Promise<OrgStats> {
  const serviceClient = createServiceClient();

  // Published cards count
  const { count: publishCount } = await serviceClient
    .from('authority_pipeline_cards')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .not('published_at', 'is', null);

  // Total points
  const { data: scores } = await serviceClient
    .from('authority_scores')
    .select('total_points')
    .eq('organization_id', orgId);
  const totalPoints = (scores || []).reduce((sum, s) => sum + (s.total_points || 0), 0);

  // Unique categories among published cards
  const { data: categories } = await serviceClient
    .from('authority_pipeline_cards')
    .select('category')
    .eq('organization_id', orgId)
    .not('published_at', 'is', null);
  const uniqueCategories = new Set((categories || []).map(c => c.category)).size;

  // Amplification campaigns (content calendars starting with "Amplification:")
  const { count: amplificationCount } = await serviceClient
    .from('content_calendars')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .ilike('name', 'Amplification:%');

  // National/international placements
  const { count: nationalPlusCount } = await serviceClient
    .from('authority_pipeline_cards')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .not('published_at', 'is', null)
    .in('reach_tier', ['national', 'international']);

  return {
    publishCount: publishCount || 0,
    totalPoints,
    uniqueCategories,
    amplificationCount: amplificationCount || 0,
    nationalPlusCount: nationalPlusCount || 0,
  };
}

function evaluateRequirements(requirements: QuestRequirement[], stats: OrgStats): QuestRequirement[] {
  return requirements.map(req => {
    let current = 0;
    switch (req.type) {
      case 'publish_count':
        current = stats.publishCount;
        break;
      case 'total_points':
        current = stats.totalPoints;
        break;
      case 'category_count':
        current = stats.uniqueCategories;
        break;
      case 'amplification_count':
        current = stats.amplificationCount;
        break;
      case 'national_plus_count':
        current = stats.nationalPlusCount;
        break;
    }
    return {
      ...req,
      current,
      completed: current >= req.target,
    };
  });
}

export async function evaluateQuests(orgId: string) {
  const serviceClient = createServiceClient();
  const stats = await getOrgStats(orgId);

  // Get existing quests
  const { data: quests } = await serviceClient
    .from('authority_quests')
    .select('*')
    .eq('organization_id', orgId)
    .order('tier', { ascending: true });

  // If no quests, seed them
  if (!quests || quests.length === 0) {
    const insertQuests = DEFAULT_QUESTS.map(q => ({
      organization_id: orgId,
      quest_name: q.quest_name,
      quest_slug: q.quest_slug,
      tier: q.tier,
      description: q.description,
      requirements: q.requirements as unknown as Json,
      points_threshold_min: q.points_threshold_min,
      points_threshold_max: q.points_threshold_max,
      is_system: true,
      is_current: q.tier === 1,
    }));

    await serviceClient.from('authority_quests').insert(insertQuests);
    const { data: seeded } = await serviceClient
      .from('authority_quests')
      .select('*')
      .eq('organization_id', orgId)
      .order('tier', { ascending: true });

    return evaluateAndUpdate(seeded || [], stats, orgId, serviceClient);
  }

  return evaluateAndUpdate(quests, stats, orgId, serviceClient);
}

async function evaluateAndUpdate(
  quests: Array<Record<string, unknown>>,
  stats: OrgStats,
  orgId: string,
  serviceClient: ReturnType<typeof createServiceClient>
) {
  const results = [];
  let highestCompletedTier = 0;

  for (const quest of quests) {
    const rawReqs = quest.requirements as unknown as QuestRequirement[];
    const reqs = Array.isArray(rawReqs) ? rawReqs : [];
    const evaluated = evaluateRequirements(reqs, stats);
    const allComplete = evaluated.length > 0 && evaluated.every(r => r.completed);
    const progress = evaluated.length > 0
      ? Math.round((evaluated.filter(r => r.completed).length / evaluated.length) * 100)
      : 0;

    const newStatus: 'locked' | 'active' | 'completed' = allComplete ? 'completed' : progress > 0 ? 'active' : (quest.status as 'locked' | 'active' | 'completed');

    if (allComplete) {
      highestCompletedTier = Math.max(highestCompletedTier, quest.tier as number);
    }

    // Update quest
    await serviceClient
      .from('authority_quests')
      .update({
        requirements: evaluated as unknown as Json,
        progress_percentage: progress,
        status: newStatus,
        started_at: progress > 0 && !quest.started_at ? new Date().toISOString() : (quest.started_at as string | null),
        completed_at: allComplete && !quest.completed_at ? new Date().toISOString() : (quest.completed_at as string | null),
        updated_at: new Date().toISOString(),
      })
      .eq('id', quest.id as string);

    results.push({
      ...quest,
      requirements: evaluated,
      progress_percentage: progress,
      status: newStatus,
    });
  }

  // Set the current quest (next incomplete tier)
  const nextTier = highestCompletedTier + 1;
  await serviceClient
    .from('authority_quests')
    .update({ is_current: false })
    .eq('organization_id', orgId);

  await serviceClient
    .from('authority_quests')
    .update({ is_current: true })
    .eq('organization_id', orgId)
    .eq('tier', nextTier);

  return { quests: results, stats, highestCompletedTier };
}
