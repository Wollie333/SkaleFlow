'use client';

import { useState, useEffect } from 'react';
import { Card, Badge } from '@/components/ui';
import { BoltIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ProviderBalance {
  provider: string;
  status: 'active' | 'offline' | 'error';
  balance?: number;
  usage?: {
    requests_30d: number;
    cost_30d: number;
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
                  <Badge variant="outline" className="bg-stone/5 text-stone flex items-center gap-1">
                    <XCircleIcon className="w-3 h-3" />
                    Offline
                  </Badge>
                )}
                {balance.status === 'error' && (
                  <Badge variant="outline" className="bg-red-100 text-red-700 flex items-center gap-1">
                    <ExclamationTriangleIcon className="w-3 h-3" />
                    Error
                  </Badge>
                )}
              </div>

              {balance.status === 'active' && balance.usage && (
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-stone/10">
                  <div>
                    <p className="text-xs text-stone mb-1">Last 30 Days</p>
                    <p className="text-lg font-bold text-charcoal">
                      {balance.usage.requests_30d.toLocaleString()} requests
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-stone mb-1">API Cost (30d)</p>
                    <p className="text-lg font-bold text-teal">
                      ${balance.usage.cost_30d.toFixed(4)}
                    </p>
                  </div>
                </div>
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

      <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <span className="text-xl">ℹ️</span>
          <div className="flex-1">
            <h5 className="text-sm font-semibold text-blue-900 mb-1">About Provider Balances</h5>
            <div className="text-xs text-blue-800 space-y-1">
              <p>• <strong>Connection Status:</strong> Shows if API keys are configured and working</p>
              <p>• <strong>Usage Stats:</strong> Tracked from your SkaleFlow database (last 30 days)</p>
              <p>• <strong>Real-Time Updates:</strong> Refreshes every 30 seconds automatically</p>
              <p>• <strong>API Costs:</strong> Actual costs paid to providers (not the sales price users pay)</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
