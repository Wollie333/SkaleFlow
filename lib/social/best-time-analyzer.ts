import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';
import type { SocialPlatform } from '@/types/database';

export interface BestTimeAnalysis {
  platform: string;
  bestTimes: {
    [day: string]: string[]; // { "monday": ["09:00", "15:00"], ... }
  };
  confidenceScore: number; // 0-1
  sampleSize: number;
  avgEngagementByHour: { [hour: string]: number };
  avgReachByHour?: { [hour: string]: number };
  analyzedAt: Date;
}

export interface BestTimeSuggestion {
  suggestedDate: string;
  suggestedTime: string;
  reason: string;
  confidenceScore: number;
  expectedEngagementRate: number;
}

/**
 * Analyzes published posts to determine optimal posting times for a platform
 */
export async function analyzeOptimalPostingTimes(
  organizationId: string,
  platform: SocialPlatform | string
): Promise<BestTimeAnalysis | null> {
  const supabase = await createClient();

  // Fetch published posts with analytics for the platform (last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data: posts, error } = await supabase
    .from('published_posts')
    .select('id, platform, published_at, post_analytics(*)')
    .eq('organization_id', organizationId)
    .eq('platform', platform as SocialPlatform)
    .eq('publish_status', 'published')
    .gte('published_at', ninetyDaysAgo.toISOString()) as { data: any[] | null; error: any };

  if (error || !posts || posts.length < 10) {
    console.log(`Not enough data for ${platform}. Need at least 10 posts.`);
    return null;
  }

  // Group posts by day of week and hour
  const engagementByDayHour: {
    [day: string]: { [hour: string]: { total: number; count: number; reach: number } };
  } = {};

  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  posts.forEach((post) => {
    const publishedDate = new Date(post.published_at);
    const dayOfWeek = daysOfWeek[publishedDate.getDay()];
    const hour = publishedDate.getHours().toString().padStart(2, '0');

    const analytics = Array.isArray(post.post_analytics)
      ? post.post_analytics[0]
      : post.post_analytics;

    if (!analytics) return;

    if (!engagementByDayHour[dayOfWeek]) {
      engagementByDayHour[dayOfWeek] = {};
    }

    if (!engagementByDayHour[dayOfWeek][hour]) {
      engagementByDayHour[dayOfWeek][hour] = { total: 0, count: 0, reach: 0 };
    }

    const engagementRate = analytics.engagement_rate || 0;
    const reach = analytics.reach || analytics.impressions || 0;

    engagementByDayHour[dayOfWeek][hour].total += engagementRate;
    engagementByDayHour[dayOfWeek][hour].count += 1;
    engagementByDayHour[dayOfWeek][hour].reach += reach;
  });

  // Calculate average engagement per hour (across all days)
  const avgEngagementByHour: { [hour: string]: number } = {};
  const avgReachByHour: { [hour: string]: number } = {};

  for (let h = 0; h < 24; h++) {
    const hour = h.toString().padStart(2, '0');
    let totalEngagement = 0;
    let totalReach = 0;
    let count = 0;

    Object.values(engagementByDayHour).forEach((dayData) => {
      if (dayData[hour]) {
        totalEngagement += dayData[hour].total;
        totalReach += dayData[hour].reach;
        count += dayData[hour].count;
      }
    });

    if (count > 0) {
      avgEngagementByHour[hour] = totalEngagement / count;
      avgReachByHour[hour] = totalReach / count;
    }
  }

  // Find best times for each day
  const bestTimes: { [day: string]: string[] } = {};

  daysOfWeek.forEach((day) => {
    if (!engagementByDayHour[day]) return;

    const hourlyData = Object.entries(engagementByDayHour[day])
      .map(([hour, data]) => ({
        hour,
        avgEngagement: data.total / data.count,
        count: data.count,
      }))
      .filter((item) => item.count >= 2) // Only consider hours with at least 2 posts
      .sort((a, b) => b.avgEngagement - a.avgEngagement);

    // Take top 2-3 best hours
    bestTimes[day] = hourlyData.slice(0, 3).map((item) => item.hour + ':00');
  });

  // Calculate confidence score based on sample size
  const confidenceScore = Math.min(posts.length / 50, 1); // Max confidence at 50+ posts

  const analysis: BestTimeAnalysis = {
    platform,
    bestTimes,
    confidenceScore,
    sampleSize: posts.length,
    avgEngagementByHour,
    avgReachByHour,
    analyzedAt: new Date(),
  };

  // Store analysis in database
  await supabase.from('posting_schedule_analysis').upsert(
    {
      organization_id: organizationId,
      platform,
      best_times: bestTimes,
      confidence_score: confidenceScore,
      sample_size: posts.length,
      avg_engagement_by_hour: avgEngagementByHour,
      avg_reach_by_hour: avgReachByHour,
      analyzed_at: new Date().toISOString(),
    },
    {
      onConflict: 'organization_id,platform',
    }
  );

  return analysis;
}

/**
 * Get the best time to post for a specific content item
 */
export async function suggestBestTime(
  organizationId: string,
  platforms: string[],
  preferredDate?: string
): Promise<BestTimeSuggestion | null> {
  const supabase = await createClient();

  // Get analysis for all platforms
  const { data: analyses } = await supabase
    .from('posting_schedule_analysis')
    .select('*')
    .eq('organization_id', organizationId)
    .in('platform', platforms)
    .order('analyzed_at', { ascending: false });

  if (!analyses || analyses.length === 0) {
    console.log('No best time analysis found. Running analysis...');
    // Try to generate analysis first
    for (const platform of platforms) {
      await analyzeOptimalPostingTimes(organizationId, platform);
    }

    // Retry fetching
    const { data: newAnalyses } = await supabase
      .from('posting_schedule_analysis')
      .select('*')
      .eq('organization_id', organizationId)
      .in('platform', platforms);

    if (!newAnalyses || newAnalyses.length === 0) {
      return null;
    }
  }

  // Use the first platform's analysis (or could merge multiple platforms)
  const raw = analyses?.[0] || null;

  if (!raw || !raw.best_times) {
    return null;
  }

  // Cast Json fields to their runtime types
  const analysis = {
    ...raw,
    best_times: raw.best_times as Record<string, string[]>,
    confidence_score: raw.confidence_score as number,
    avg_engagement_by_hour: (raw.avg_engagement_by_hour || {}) as Record<string, number>,
  };

  // Determine target date
  const targetDate = preferredDate ? new Date(preferredDate) : new Date();
  targetDate.setHours(0, 0, 0, 0);

  // Get day of week
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = daysOfWeek[targetDate.getDay()];

  const bestTimesForDay = analysis.best_times[dayName];

  if (!bestTimesForDay || bestTimesForDay.length === 0) {
    // Fall back to best overall time
    const allTimes = Object.values(analysis.best_times).flat();
    if (allTimes.length === 0) return null;

    const suggestedTime = allTimes[0] || '09:00';
    return {
      suggestedDate: targetDate.toISOString().split('T')[0],
      suggestedTime: suggestedTime,
      reason: `Based on historical performance across all days`,
      confidenceScore: analysis.confidence_score || 0.5,
      expectedEngagementRate: Object.values(analysis.avg_engagement_by_hour || {})[0] || 0,
    };
  }

  // Find the best time that hasn't passed yet (if today)
  const now = new Date();
  const isToday = targetDate.toDateString() === now.toDateString();

  let suggestedTime = bestTimesForDay[0];

  if (isToday) {
    const currentHour = now.getHours();
    const futureTime = bestTimesForDay.find((time: any) => {
      const hour = parseInt(time.split(':')[0]);
      return hour > currentHour;
    });

    if (futureTime) {
      suggestedTime = futureTime;
    } else {
      // No good time left today, suggest tomorrow
      targetDate.setDate(targetDate.getDate() + 1);
      const tomorrowDay = daysOfWeek[targetDate.getDay()];
      const tomorrowTimes = analysis.best_times[tomorrowDay];
      suggestedTime = tomorrowTimes?.[0] || bestTimesForDay[0];
    }
  }

  const hour = suggestedTime.split(':')[0];
  const expectedEngagementRate = analysis.avg_engagement_by_hour?.[hour] || 0;

  return {
    suggestedDate: targetDate.toISOString().split('T')[0],
    suggestedTime,
    reason: `Peak engagement time for ${dayName}s on ${platforms[0]}`,
    confidenceScore: analysis.confidence_score || 0.5,
    expectedEngagementRate,
  };
}

/**
 * Use AI to generate insights from posting time analysis
 */
export async function generatePostingInsights(
  analysis: BestTimeAnalysis
): Promise<string> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });

  const prompt = `Analyze this social media posting time data and provide 3-4 actionable insights:

Platform: ${analysis.platform}
Sample Size: ${analysis.sampleSize} posts
Confidence: ${(analysis.confidenceScore * 100).toFixed(0)}%

Best Times by Day:
${Object.entries(analysis.bestTimes)
  .map(([day, times]) => `${day}: ${times.join(', ')}`)
  .join('\n')}

Provide brief, actionable insights for the user. Focus on:
1. Best days to post
2. Optimal time windows
3. Any patterns or recommendations

Keep it concise (2-3 sentences per insight).`;

  const message = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const textContent = message.content.find((block) => block.type === 'text');
  return textContent && 'text' in textContent ? textContent.text : 'No insights available.';
}
