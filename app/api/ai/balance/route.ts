import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

interface ProviderBalance {
  provider: string;
  status: 'active' | 'offline' | 'error';
  balance?: number; // USD
  usage?: {
    requests_30d: number;
    cost_30d: number;
  };
  error?: string;
}

// Check Anthropic balance/usage
async function getAnthropicBalance(): Promise<ProviderBalance> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return { provider: 'anthropic', status: 'offline' };
  }

  try {
    // Anthropic doesn't have a balance API, so we'll return active status
    // Balance information would need to be checked on Anthropic Console
    return {
      provider: 'anthropic',
      status: 'active',
      balance: undefined, // Not available via API
    };
  } catch (error) {
    return {
      provider: 'anthropic',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Check Google AI balance/usage
async function getGoogleAIBalance(): Promise<ProviderBalance> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    return { provider: 'google', status: 'offline' };
  }

  try {
    // Google AI doesn't have a direct balance API endpoint
    // You'd need to check usage through Google Cloud Console
    return {
      provider: 'google',
      status: 'active',
      balance: undefined, // Not available via API
    };
  } catch (error) {
    return {
      provider: 'google',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Check Groq balance/usage
async function getGroqBalance(): Promise<ProviderBalance> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return { provider: 'groq', status: 'offline' };
  }

  try {
    // Groq has free tier, no balance API available
    return {
      provider: 'groq',
      status: 'active',
      balance: undefined, // Free tier
    };
  } catch (error) {
    return {
      provider: 'groq',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Get usage stats from our database (last 30 days)
async function getUsageStats(provider: string) {
  try {
    const supabase = await createClient();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: usage } = await supabase
      .from('ai_usage')
      .select('credits_charged')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .ilike('model', `%${provider}%`);

    if (usage) {
      const requests = usage.length;
      // Rough estimate: credits to USD (actual API cost)
      const totalCredits = usage.reduce((sum, row) => sum + (row.credits_charged || 0), 0);
      const costUSD = totalCredits / (18 * 2 * 100); // Convert credits to real USD cost

      return {
        requests_30d: requests,
        cost_30d: Math.round(costUSD * 100) / 100,
      };
    }
  } catch (error) {
    console.error(`Failed to get usage stats for ${provider}:`, error);
  }

  return { requests_30d: 0, cost_30d: 0 };
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get balances from each provider
    const [anthropic, google, groq] = await Promise.all([
      getAnthropicBalance(),
      getGoogleAIBalance(),
      getGroqBalance(),
    ]);

    // Attach usage stats from our database
    const [anthropicUsage, googleUsage, groqUsage] = await Promise.all([
      getUsageStats('anthropic'),
      getUsageStats('google'),
      getUsageStats('groq'),
    ]);

    return NextResponse.json({
      balances: [
        { ...anthropic, usage: anthropicUsage },
        { ...google, usage: googleUsage },
        { ...groq, usage: groqUsage },
      ],
    });
  } catch (error) {
    console.error('Balance check error:', error);
    return NextResponse.json({ error: 'Failed to fetch balances' }, { status: 500 });
  }
}
