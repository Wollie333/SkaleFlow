'use client';

import { useState, useEffect } from 'react';
import { Card, Badge } from '@/components/ui';
import { BoltIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

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

interface ProviderConfig {
  name: string;
  displayName: string;
  color: string;
  icon: string;
}

const PROVIDER_CONFIG: Record<string, ProviderConfig> = {
  anthropic: {
    name: 'anthropic',
    displayName: 'Anthropic (Claude)',
    color: 'from-amber-500 to-orange-600',
    icon: '🤖',
  },
  google: {
    name: 'google',
    displayName: 'Google AI (Gemini)',
    color: 'from-blue-500 to-blue-600',
    icon: '🔵',
  },
  groq: {
    name: 'groq',
    displayName: 'Groq',
    color: 'from-emerald-500 to-teal-600',
    icon: '⚡',
  },
};

const PROVIDER_DESCRIPTIONS: Record<string, { title: string; description: string; bestFor: string[] }> = {
  anthropic: {
    title: 'Best for Smart & Deep Thinking',
    description: 'Claude is like having a really smart friend who thinks carefully before answering. It understands complex questions and gives thoughtful, detailed responses.',
    bestFor: [
      '📝 Writing long, detailed content (blog posts, articles)',
      '🧠 Complex reasoning and problem-solving',
      '💬 Having long conversations that make sense',
      '🎯 Understanding context and nuance',
      '📚 Analyzing documents and data',
    ],
  },
  google: {
    title: 'Best for Fast & Cheap Tasks',
    description: 'Gemini is super affordable and handles images! Like a quick helper that can do lots of simple tasks without costing much.',
    bestFor: [
      '⚡ Quick, simple content generation',
      '🖼️ Understanding and working with images',
      '💰 High-volume tasks on a budget',
      '📱 Social media captions and short posts',
      '🔄 Simple rewrites and translations',
    ],
  },
  groq: {
    title: 'Best for Lightning-Fast Speed',
    description: 'Groq is the speed champion! It responds almost instantly, like having someone who answers before you finish asking. Perfect when time matters more than cost.',
    bestFor: [
      '⚡ Real-time chat responses',
      '🏃 When you need answers RIGHT NOW',
      '💨 Live demos and presentations',
      '🎮 Interactive features',
      '⏱️ Time-sensitive content',
    ],
  },
};

export function AIProviderConnections() {
  const [balances, setBalances] = useState<ProviderBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchBalances = async () => {
    try {
      const res = await fetch('/api/ai/balance');
      if (res.ok) {
        const data = await res.json();
        setBalances(data.balances || []);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch provider balances:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
    // Poll every 30 seconds for real-time updates
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BoltIcon className="w-6 h-6 text-teal" />
          <div>
            <h3 className="text-lg font-semibold text-charcoal">LLM Provider Connections</h3>
            <p className="text-sm text-stone">Real-time connection status and usage</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-stone">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchBalances}
            className="p-2 rounded-lg hover:bg-cream-warm transition-colors"
            title="Refresh"
          >
            <ArrowPathIcon className="w-4 h-4 text-stone" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {balances.map((balance) => {
          const config = PROVIDER_CONFIG[balance.provider];
          const providerDesc = PROVIDER_DESCRIPTIONS[balance.provider];
          if (!config) return null;

          return (
            <div
              key={balance.provider}
              className="p-4 rounded-xl border border-stone/10 bg-gradient-to-r from-white to-cream-warm/30"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center text-xl`}>
                    {config.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-charcoal">{config.displayName}</h4>
                    <p className="text-xs text-stone capitalize">{balance.provider} API</p>
                  </div>
                </div>

                {balance.status === 'active' && (
                  <Badge variant="awareness" className="bg-teal/10 text-teal flex items-center gap-1">
                    <CheckCircleIcon className="w-3 h-3" />
                    Connected
                  </Badge>
                )}
                {balance.status === 'offline' && (
                  <Badge variant="default" className="bg-stone/5 text-stone flex items-center gap-1">
                    <XCircleIcon className="w-3 h-3" />
                    Offline
                  </Badge>
                )}
                {balance.status === 'error' && (
                  <Badge variant="default" className="bg-red-500/10 text-red-400 flex items-center gap-1">
                    <ExclamationTriangleIcon className="w-3 h-3" />
                    Error
                  </Badge>
                )}
              </div>

              {/* What This AI Is Good For */}
              {providerDesc && (
                <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">✨</span>
                    <h5 className="text-sm font-bold text-purple-900">{providerDesc.title}</h5>
                  </div>
                  <p className="text-xs text-purple-800 leading-relaxed mb-3">
                    {providerDesc.description}
                  </p>
                  <div className="space-y-1.5">
                    {providerDesc.bestFor.map((item, idx) => (
                      <p key={idx} className="text-xs text-purple-900 leading-relaxed">
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {balance.status === 'active' && (
                <>
                  {/* Rate Limits */}
                  {balance.rateLimit && (
                    <div className="mt-4 pt-4 border-t border-stone/10">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-charcoal uppercase tracking-wider">⏱️ Speed Limits</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="p-3 rounded-lg bg-cream-warm/50">
                          <p className="text-xs text-stone mb-1">Requests/Minute</p>
                          <p className="text-xl font-bold text-charcoal">
                            {balance.rateLimit.requestsPerMinute}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-cream-warm/50">
                          <p className="text-xs text-stone mb-1">Tokens/Minute</p>
                          <p className="text-xl font-bold text-charcoal">
                            {balance.rateLimit.tokensPerMinute.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-stone italic leading-relaxed">
                        💡 {balance.rateLimit.description}
                      </p>
                    </div>
                  )}

                  {/* Pricing */}
                  {balance.pricing && (
                    <div className="mt-4 pt-4 border-t border-stone/10">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-charcoal uppercase tracking-wider">💰 How Pricing Works</span>
                      </div>
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 mb-2">
                        <p className="text-xs font-semibold text-blue-900 mb-1">{balance.pricing.model}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-blue-400">Reading (Input):</span>
                            <span className="font-bold text-blue-900 ml-1">${balance.pricing.inputCostPer1M}/1M</span>
                          </div>
                          <div>
                            <span className="text-blue-400">Writing (Output):</span>
                            <span className="font-bold text-blue-900 ml-1">${balance.pricing.outputCostPer1M}/1M</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-blue-400 italic leading-relaxed">
                        📚 {balance.pricing.simpleExplanation}
                      </p>
                    </div>
                  )}

                  {/* Usage Stats */}
                  {balance.usage && (
                    <div className="mt-4 pt-4 border-t border-stone/10">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-charcoal uppercase tracking-wider">📊 Your Usage (Last 30 Days)</span>
                      </div>
                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-emerald-900">Total Requests:</span>
                          <span className="text-lg font-bold text-emerald-900">
                            {balance.usage.requests_30d.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {balance.status === 'offline' && (
                <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-xs text-amber-900">
                    <strong>Not configured:</strong> API key not found in environment variables.
                  </p>
                </div>
              )}

              {balance.status === 'error' && balance.error && (
                <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-xs text-red-900">
                    <strong>Error:</strong> {balance.error}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-purple-50 border border-purple-200">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎓</span>
          <div className="flex-1">
            <h5 className="text-sm font-semibold text-purple-900 mb-2">Easy Explanation</h5>
            <div className="text-xs text-purple-800 space-y-2 leading-relaxed">
              <p><strong>⏱️ Speed Limits (Rate Limits):</strong> Just like you can only ride a roller coaster a certain number of times per hour, these AI services only let you make a certain number of requests per minute. It keeps everything fair for everyone!</p>

              <p><strong>💰 Pricing:</strong> You pay for two things - (1) the words you send TO the AI (like asking a question), and (2) the words the AI sends BACK to you (like the answer). It's measured per million words, but don't worry - most conversations use way less than that!</p>

              <p><strong>🔢 Example:</strong> If you write 1,000 words and the AI writes 2,000 words back, that's only 0.003 million words total - so it costs just a few cents!</p>

              <p><strong>📊 Your Usage:</strong> We track how many times you've used each AI in the last 30 days so you can see which one you use the most.</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
