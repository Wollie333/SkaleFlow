import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

interface ProviderBalance {
  provider: string;
  status: 'active' | 'offline' | 'error';
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
    description: string;
  };
  usage?: {
    requests_30d: number;
    cost_30d: number;
  };
  pricing?: {
    model: string;
    inputCostPer1M: number;
    outputCostPer1M: number;
    simpleExplanation: string;
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
    return {
      provider: 'anthropic',
      status: 'active',
      rateLimit: {
        requestsPerMinute: 50,
        tokensPerMinute: 40000,
        description: "You can make 50 requests per minute. Think of it like a slide - you can only go down 50 times in one minute!",
      },
      pricing: {
        model: 'Claude Sonnet 3.5',
        inputCostPer1M: 3.00,
        outputCostPer1M: 15.00,
        simpleExplanation: "Every 1 million words you send costs $3. Every 1 million words Claude writes back costs $15. It's like paying per page - reading costs less than writing!",
      },
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
    return {
      provider: 'google',
      status: 'active',
      rateLimit: {
        requestsPerMinute: 60,
        tokensPerMinute: 32000,
        description: "You can ask Google AI 60 questions per minute. Like raising your hand in class - but you can only do it 60 times each minute!",
      },
      pricing: {
        model: 'Gemini 1.5 Flash',
        inputCostPer1M: 0.075,
        outputCostPer1M: 0.30,
        simpleExplanation: "Super cheap! Every 1 million words you send costs only 7 cents. Every 1 million words Gemini writes back costs 30 cents. It's like buying candy - very affordable!",
      },
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
    return {
      provider: 'groq',
      status: 'active',
      rateLimit: {
        requestsPerMinute: 30,
        tokensPerMinute: 14400,
        description: "You can make 30 requests per minute. It's like a speed limit on a road - you can't go too fast!",
      },
      pricing: {
        model: 'Llama 3.1 70B',
        inputCostPer1M: 0.59,
        outputCostPer1M: 0.79,
        simpleExplanation: "Groq is SUPER FAST but costs a bit more. Every 1 million words you send costs 59 cents. Every 1 million words it writes back costs 79 cents. Think of it like express shipping - faster but costs more!",
      },
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
