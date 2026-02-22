import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ConnectionWithTokens } from '@/lib/social/token-manager';
import { ensureValidToken } from '@/lib/social/token-manager';
import type { SocialPlatform } from '@/types/database';

const GRAPH_API_BASE = 'https://graph.facebook.com/v22.0';
const LINKEDIN_API_BASE = 'https://api.linkedin.com';

interface AudienceInsight {
  platform: SocialPlatform;
  accountName: string;
  followers: number | null;
  demographics: {
    age: Array<{ range: string; percentage: number }>;
    gender: Array<{ type: string; percentage: number }>;
  };
  topCountries: Array<{ country: string; percentage: number }>;
  topCities: Array<{ city: string; percentage: number }>;
  onlineFollowers: Record<string, number[]> | null;
  profileViews: number | null;
  websiteClicks: number | null;
  error?: string;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership?.organization_id) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 });
  }

  const { data: connections } = await supabase
    .from('social_media_connections')
    .select('*')
    .eq('organization_id', membership.organization_id)
    .eq('is_active', true);

  if (!connections || connections.length === 0) {
    return NextResponse.json({ insights: [], connectedPlatforms: [] });
  }

  console.log(`[audience-insights] Active connections: ${connections.map(c => `${c.platform}(type=${c.account_type})`).join(', ')}`);

  const insights: AudienceInsight[] = [];

  for (const connection of connections) {
    try {
      const tokens = await ensureValidToken(connection as unknown as ConnectionWithTokens);
      let insight: AudienceInsight | null = null;

      switch (connection.platform) {
        case 'instagram':
          insight = await fetchInstagramAudienceInsights(tokens, connection);
          break;
        case 'facebook':
          insight = await fetchFacebookAudienceInsights(tokens, connection);
          break;
        case 'linkedin':
          insight = await fetchLinkedInAudienceInsights(tokens, connection);
          break;
        default:
          insight = {
            platform: connection.platform as SocialPlatform,
            accountName: connection.platform_username || connection.platform_page_name || 'Unknown',
            followers: null,
            demographics: { age: [], gender: [] },
            topCountries: [],
            topCities: [],
            onlineFollowers: null,
            profileViews: null,
            websiteClicks: null,
            error: `Audience insights not available for ${connection.platform}`,
          };
      }

      if (insight) {
        insights.push(insight);
      }
    } catch (error) {
      insights.push({
        platform: connection.platform as SocialPlatform,
        accountName: connection.platform_username || connection.platform_page_name || 'Unknown',
        followers: null,
        demographics: { age: [], gender: [] },
        topCountries: [],
        topCities: [],
        onlineFollowers: null,
        profileViews: null,
        websiteClicks: null,
        error: error instanceof Error ? error.message : 'Failed to fetch',
      });
    }
  }

  const connectedPlatforms: SocialPlatform[] = Array.from(
    new Set(connections.map(c => c.platform as SocialPlatform))
  );

  return NextResponse.json({ insights, connectedPlatforms });
}

// ────────────────────────────────────────────────
// Instagram — IG Business Account Insights
// ────────────────────────────────────────────────
async function fetchInstagramAudienceInsights(
  tokens: { accessToken: string; platformUserId?: string; platformPageId?: string; platformUsername?: string },
  connection: { platform_username: string | null; platform_page_name: string | null }
): Promise<AudienceInsight> {
  const igUserId = tokens.platformUserId;
  if (!igUserId) {
    return makeEmptyInsight('instagram', connection, 'No Instagram Business Account ID');
  }

  // Fetch follower count
  const profileRes = await fetch(
    `${GRAPH_API_BASE}/${igUserId}?fields=followers_count,media_count&access_token=${tokens.accessToken}`
  );
  const profileData = await profileRes.json();
  const followers = profileData.followers_count || null;

  // Fetch audience demographics (requires >= 100 followers)
  const demographics: AudienceInsight['demographics'] = { age: [], gender: [] };
  const topCountries: AudienceInsight['topCountries'] = [];
  const topCities: AudienceInsight['topCities'] = [];
  let profileViews: number | null = null;
  let websiteClicks: number | null = null;

  try {
    // follower_demographics metric (IG API v18.0+)
    const demoRes = await fetch(
      `${GRAPH_API_BASE}/${igUserId}/insights?metric=follower_demographics&period=lifetime&metric_type=total_value&breakdown=age,gender&access_token=${tokens.accessToken}`
    );
    const demoData = await demoRes.json();

    if (demoData.data && !demoData.error) {
      for (const metric of demoData.data) {
        if (metric.name === 'follower_demographics') {
          const breakdowns = metric.total_value?.breakdowns || [];
          for (const bd of breakdowns) {
            const dimension = bd.dimension_keys?.[0];
            const results = bd.results || [];
            if (dimension === 'age') {
              const total = results.reduce((s: number, r: { value: number }) => s + r.value, 0);
              demographics.age = results.map((r: { dimension_values: string[]; value: number }) => ({
                range: r.dimension_values[0],
                percentage: total > 0 ? Math.round((r.value / total) * 100) : 0,
              }));
            }
            if (dimension === 'gender') {
              const total = results.reduce((s: number, r: { value: number }) => s + r.value, 0);
              demographics.gender = results.map((r: { dimension_values: string[]; value: number }) => ({
                type: r.dimension_values[0] === 'M' ? 'Male' : r.dimension_values[0] === 'F' ? 'Female' : 'Other',
                percentage: total > 0 ? Math.round((r.value / total) * 100) : 0,
              }));
            }
          }
        }
      }
    }
  } catch {
    // Demographics may require 100+ followers
  }

  // Country breakdown
  try {
    const countryRes = await fetch(
      `${GRAPH_API_BASE}/${igUserId}/insights?metric=follower_demographics&period=lifetime&metric_type=total_value&breakdown=country&access_token=${tokens.accessToken}`
    );
    const countryData = await countryRes.json();
    if (countryData.data && !countryData.error) {
      for (const metric of countryData.data) {
        if (metric.name === 'follower_demographics') {
          const breakdowns = metric.total_value?.breakdowns || [];
          for (const bd of breakdowns) {
            const results = bd.results || [];
            const total = results.reduce((s: number, r: { value: number }) => s + r.value, 0);
            const sorted = [...results].sort((a: { value: number }, b: { value: number }) => b.value - a.value).slice(0, 6);
            for (const r of sorted) {
              topCountries.push({
                country: r.dimension_values[0],
                percentage: total > 0 ? Math.round((r.value / total) * 100) : 0,
              });
            }
          }
        }
      }
    }
  } catch {}

  // City breakdown
  try {
    const cityRes = await fetch(
      `${GRAPH_API_BASE}/${igUserId}/insights?metric=follower_demographics&period=lifetime&metric_type=total_value&breakdown=city&access_token=${tokens.accessToken}`
    );
    const cityData = await cityRes.json();
    if (cityData.data && !cityData.error) {
      for (const metric of cityData.data) {
        if (metric.name === 'follower_demographics') {
          const breakdowns = metric.total_value?.breakdowns || [];
          for (const bd of breakdowns) {
            const results = bd.results || [];
            const total = results.reduce((s: number, r: { value: number }) => s + r.value, 0);
            const sorted = [...results].sort((a: { value: number }, b: { value: number }) => b.value - a.value).slice(0, 6);
            for (const r of sorted) {
              topCities.push({
                city: r.dimension_values[0],
                percentage: total > 0 ? Math.round((r.value / total) * 100) : 0,
              });
            }
          }
        }
      }
    }
  } catch {}

  // Profile views + website clicks (28-day window)
  try {
    const actRes = await fetch(
      `${GRAPH_API_BASE}/${igUserId}/insights?metric=profile_views,website_clicks&period=day&since=${Math.floor(Date.now() / 1000) - 28 * 86400}&until=${Math.floor(Date.now() / 1000)}&access_token=${tokens.accessToken}`
    );
    const actData = await actRes.json();
    if (actData.data && !actData.error) {
      for (const metric of actData.data) {
        const total = (metric.values || []).reduce((s: number, v: { value: number }) => s + v.value, 0);
        if (metric.name === 'profile_views') profileViews = total;
        if (metric.name === 'website_clicks') websiteClicks = total;
      }
    }
  } catch {}

  return {
    platform: 'instagram',
    accountName: connection.platform_username || connection.platform_page_name || 'Instagram',
    followers,
    demographics,
    topCountries,
    topCities,
    onlineFollowers: null,
    profileViews,
    websiteClicks,
  };
}

// ────────────────────────────────────────────────
// Facebook — Page Insights
// ────────────────────────────────────────────────
async function fetchFacebookAudienceInsights(
  tokens: { accessToken: string; platformPageId?: string },
  connection: { platform_username: string | null; platform_page_name: string | null }
): Promise<AudienceInsight | null> {
  const pageId = tokens.platformPageId;
  if (!pageId) {
    // Profile-only connection — skip silently, the page connection will provide data
    console.log('[audience-insights] Skipping Facebook profile connection (no page ID)');
    return null;
  }

  let followers: number | null = null;
  const demographics: AudienceInsight['demographics'] = { age: [], gender: [] };
  const topCountries: AudienceInsight['topCountries'] = [];
  const topCities: AudienceInsight['topCities'] = [];

  // Follower count
  try {
    const pageRes = await fetch(
      `${GRAPH_API_BASE}/${pageId}?fields=followers_count,fan_count&access_token=${tokens.accessToken}`
    );
    const pageData = await pageRes.json();
    followers = pageData.followers_count || pageData.fan_count || null;
  } catch {}

  // Age-Gender breakdown (page_fans_gender_age)
  try {
    const demoRes = await fetch(
      `${GRAPH_API_BASE}/${pageId}/insights?metric=page_fans_gender_age&period=lifetime&access_token=${tokens.accessToken}`
    );
    const demoData = await demoRes.json();
    if (demoData.data && !demoData.error) {
      const metric = demoData.data[0];
      const values = metric?.values?.[0]?.value || {};
      // Format: { "F.18-24": 100, "M.25-34": 200, ... }
      const ageMap: Record<string, number> = {};
      const genderMap: Record<string, number> = {};
      let total = 0;

      for (const [key, count] of Object.entries(values)) {
        const parts = key.split('.');
        if (parts.length === 2) {
          const gender = parts[0];
          const age = parts[1];
          const val = count as number;
          total += val;
          ageMap[age] = (ageMap[age] || 0) + val;
          genderMap[gender] = (genderMap[gender] || 0) + val;
        }
      }

      if (total > 0) {
        demographics.age = Object.entries(ageMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([range, val]) => ({
            range,
            percentage: Math.round((val / total) * 100),
          }));

        demographics.gender = Object.entries(genderMap).map(([g, val]) => ({
          type: g === 'F' ? 'Female' : g === 'M' ? 'Male' : 'Other',
          percentage: Math.round((val / total) * 100),
        }));
      }
    }
  } catch {}

  // Country breakdown (page_fans_country)
  try {
    const countryRes = await fetch(
      `${GRAPH_API_BASE}/${pageId}/insights?metric=page_fans_country&period=lifetime&access_token=${tokens.accessToken}`
    );
    const countryData = await countryRes.json();
    if (countryData.data && !countryData.error) {
      const values = countryData.data[0]?.values?.[0]?.value || {};
      const total = Object.values(values).reduce((s: number, v) => s + (v as number), 0);
      const sorted = Object.entries(values)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 6);
      for (const [country, count] of sorted) {
        topCountries.push({
          country,
          percentage: total > 0 ? Math.round(((count as number) / total) * 100) : 0,
        });
      }
    }
  } catch {}

  // City breakdown (page_fans_city)
  try {
    const cityRes = await fetch(
      `${GRAPH_API_BASE}/${pageId}/insights?metric=page_fans_city&period=lifetime&access_token=${tokens.accessToken}`
    );
    const cityData = await cityRes.json();
    if (cityData.data && !cityData.error) {
      const values = cityData.data[0]?.values?.[0]?.value || {};
      const total = Object.values(values).reduce((s: number, v) => s + (v as number), 0);
      const sorted = Object.entries(values)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 6);
      for (const [city, count] of sorted) {
        topCities.push({
          city,
          percentage: total > 0 ? Math.round(((count as number) / total) * 100) : 0,
        });
      }
    }
  } catch {}

  return {
    platform: 'facebook',
    accountName: connection.platform_page_name || connection.platform_username || 'Facebook',
    followers,
    demographics,
    topCountries,
    topCities,
    onlineFollowers: null,
    profileViews: null,
    websiteClicks: null,
  };
}

// ────────────────────────────────────────────────
// LinkedIn — Organization Follower Statistics
// ────────────────────────────────────────────────
async function fetchLinkedInAudienceInsights(
  tokens: { accessToken: string; platformPageId?: string; accountType?: string },
  connection: { platform_username: string | null; platform_page_name: string | null }
): Promise<AudienceInsight | null> {
  const orgId = tokens.platformPageId;
  if (!orgId || tokens.accountType !== 'page') {
    // Personal profiles can't access audience demographics — show helpful message
    return {
      platform: 'linkedin',
      accountName: connection.platform_username || connection.platform_page_name || 'LinkedIn',
      followers: null,
      demographics: { age: [], gender: [] },
      topCountries: [],
      topCities: [],
      onlineFollowers: null,
      profileViews: null,
      websiteClicks: null,
      error: 'Audience demographics are only available for LinkedIn Company Pages. Connect a Company Page in Settings to see follower insights.',
    };
  }

  let followers: number | null = null;
  const demographics: AudienceInsight['demographics'] = { age: [], gender: [] };
  const topCountries: AudienceInsight['topCountries'] = [];
  const topCities: AudienceInsight['topCities'] = [];

  const orgUrn = `urn:li:organization:${orgId}`;

  // Follower count
  try {
    const followerRes = await fetch(
      `${LINKEDIN_API_BASE}/rest/networkSizes/${encodeURIComponent(orgUrn)}?edgeType=CompanyFollowedByMember`,
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          'LinkedIn-Version': '202601',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );
    if (followerRes.ok) {
      const followerData = await followerRes.json();
      followers = followerData.firstDegreeSize || null;
    }
  } catch {}

  // Follower statistics by function/seniority (LinkedIn doesn't provide age/gender)
  try {
    const statsRes = await fetch(
      `${LINKEDIN_API_BASE}/rest/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(orgUrn)}`,
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          'LinkedIn-Version': '202601',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );
    if (statsRes.ok) {
      const statsData = await statsRes.json();
      const element = statsData.elements?.[0];
      if (element) {
        // Country breakdown from followerCountsByGeoCountry
        const countryBreakdown = element.followerCountsByGeoCountry || [];
        const countryTotal = countryBreakdown.reduce((s: number, c: { followerCounts: { organicFollowerCount: number } }) =>
          s + (c.followerCounts?.organicFollowerCount || 0), 0);
        const sortedCountries = [...countryBreakdown]
          .sort((a: { followerCounts: { organicFollowerCount: number } }, b: { followerCounts: { organicFollowerCount: number } }) =>
            (b.followerCounts?.organicFollowerCount || 0) - (a.followerCounts?.organicFollowerCount || 0))
          .slice(0, 6);

        for (const c of sortedCountries) {
          const count = c.followerCounts?.organicFollowerCount || 0;
          topCountries.push({
            country: c.geo || 'Unknown',
            percentage: countryTotal > 0 ? Math.round((count / countryTotal) * 100) : 0,
          });
        }

        // Seniority as a proxy for demographics (LinkedIn-specific)
        const seniorityBreakdown = element.followerCountsBySeniority || [];
        if (seniorityBreakdown.length > 0) {
          const senTotal = seniorityBreakdown.reduce((s: number, item: { followerCounts: { organicFollowerCount: number } }) =>
            s + (item.followerCounts?.organicFollowerCount || 0), 0);
          // Map seniority to age-like ranges as a best approximation
          demographics.age = seniorityBreakdown
            .sort((a: { followerCounts: { organicFollowerCount: number } }, b: { followerCounts: { organicFollowerCount: number } }) =>
              (b.followerCounts?.organicFollowerCount || 0) - (a.followerCounts?.organicFollowerCount || 0))
            .slice(0, 5)
            .map((item: { seniority: string; followerCounts: { organicFollowerCount: number } }) => ({
              range: item.seniority || 'Unknown',
              percentage: senTotal > 0 ? Math.round(((item.followerCounts?.organicFollowerCount || 0) / senTotal) * 100) : 0,
            }));
        }
      }
    }
  } catch {}

  return {
    platform: 'linkedin',
    accountName: connection.platform_page_name || connection.platform_username || 'LinkedIn',
    followers,
    demographics,
    topCountries,
    topCities,
    onlineFollowers: null,
    profileViews: null,
    websiteClicks: null,
  };
}

function makeEmptyInsight(
  platform: SocialPlatform,
  connection: { platform_username: string | null; platform_page_name: string | null },
  error: string
): AudienceInsight {
  return {
    platform,
    accountName: connection.platform_username || connection.platform_page_name || platform,
    followers: null,
    demographics: { age: [], gender: [] },
    topCountries: [],
    topCities: [],
    onlineFollowers: null,
    profileViews: null,
    websiteClicks: null,
    error,
  };
}
