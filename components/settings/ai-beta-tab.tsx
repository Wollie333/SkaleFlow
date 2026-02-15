'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Button } from '@/components/ui';
import { KeyIcon, ShieldCheckIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ApiKeyInfo {
  provider: string;
  keyHint: string;
  isValid: boolean;
  updatedAt: string;
}

const PROVIDERS = [
  {
    id: 'anthropic',
    label: 'Claude (Anthropic)',
    description: 'Used for brand strategy, content generation, and PDF analysis.',
    placeholder: 'sk-ant-api03-...',
  },
  {
    id: 'google',
    label: 'Gemini (Google)',
    description: 'Used for content generation (free model).',
    placeholder: 'AIza...',
  },
  {
    id: 'groq',
    label: 'Llama (Groq)',
    description: 'Used for content generation (free model).',
    placeholder: 'gsk_...',
  },
  {
    id: 'openai',
    label: 'DALL-E (OpenAI)',
    description: 'Used for AI logo generation.',
    placeholder: 'sk-...',
  },
] as const;

export function AiBetaTab() {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [deletingProvider, setDeletingProvider] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/api-keys');
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch {
      console.error('Failed to load API keys');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleSave = async (provider: string) => {
    if (!inputValue.trim()) return;
    setSavingProvider(provider);
    setError('');

    try {
      const res = await fetch('/api/settings/api-keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: inputValue.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save key');
        return;
      }

      setEditingProvider(null);
      setInputValue('');
      await fetchKeys();
    } catch {
      setError('Failed to save key');
    } finally {
      setSavingProvider(null);
    }
  };

  const handleDelete = async (provider: string) => {
    setDeletingProvider(provider);
    setError('');

    try {
      const res = await fetch('/api/settings/api-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to remove key');
        return;
      }

      await fetchKeys();
    } catch {
      setError('Failed to remove key');
    } finally {
      setDeletingProvider(null);
    }
  };

  const getKeyInfo = (providerId: string): ApiKeyInfo | undefined => {
    return keys.find(k => k.provider === providerId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Info Banner */}
      <div className="p-4 bg-teal/5 border border-teal/15 rounded-xl flex items-start gap-3">
        <ShieldCheckIcon className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-charcoal">Use your own API keys</p>
          <p className="text-sm text-stone mt-0.5">
            Test the system without consuming platform credits. Your keys are encrypted at rest using AES-256-GCM.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Provider Cards */}
      <div className="space-y-4">
        {PROVIDERS.map(provider => {
          const keyInfo = getKeyInfo(provider.id);
          const isEditing = editingProvider === provider.id;
          const isSaving = savingProvider === provider.id;
          const isDeleting = deletingProvider === provider.id;

          return (
            <Card key={provider.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-cream-warm rounded-lg flex items-center justify-center flex-shrink-0">
                    <KeyIcon className="w-4.5 h-4.5 text-teal" />
                  </div>
                  <div>
                    <h3 className="font-medium text-charcoal text-sm">{provider.label}</h3>
                    <p className="text-xs text-stone mt-0.5">{provider.description}</p>
                  </div>
                </div>

                {keyInfo ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 flex-shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Ready
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-500 flex-shrink-0">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    Not configured
                  </span>
                )}
              </div>

              {/* Saved Key Display */}
              {keyInfo && !isEditing && (
                <div className="mt-4 flex items-center justify-between p-3 bg-cream-warm rounded-lg">
                  <code className="text-sm text-charcoal font-mono">{keyInfo.keyHint}</code>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingProvider(provider.id);
                        setInputValue('');
                      }}
                      className="text-xs font-medium text-teal hover:text-teal-light transition-colors"
                    >
                      Replace
                    </button>
                    <button
                      onClick={() => handleDelete(provider.id)}
                      disabled={isDeleting}
                      className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                      {isDeleting ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </div>
              )}

              {/* Edit / Add Key Input */}
              {(isEditing || !keyInfo) && (
                <div className="mt-4 flex items-center gap-2">
                  <input
                    type="password"
                    value={isEditing ? inputValue : (editingProvider === provider.id ? inputValue : '')}
                    onChange={(e) => {
                      if (!isEditing && editingProvider !== provider.id) {
                        setEditingProvider(provider.id);
                      }
                      setInputValue(e.target.value);
                    }}
                    onFocus={() => {
                      if (editingProvider !== provider.id) {
                        setEditingProvider(provider.id);
                        setInputValue('');
                      }
                    }}
                    placeholder={provider.placeholder}
                    className="flex-1 px-3 py-2 border border-cream rounded-lg text-sm text-charcoal placeholder:text-stone/40 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal font-mono"
                  />
                  <Button
                    onClick={() => handleSave(provider.id)}
                    disabled={!inputValue.trim() || isSaving}
                    isLoading={isSaving}
                    className="bg-teal hover:bg-teal-light text-white text-sm px-4 py-2"
                  >
                    Save
                  </Button>
                  {keyInfo && isEditing && (
                    <button
                      onClick={() => {
                        setEditingProvider(null);
                        setInputValue('');
                      }}
                      className="text-xs font-medium text-stone hover:text-charcoal transition-colors px-2"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
