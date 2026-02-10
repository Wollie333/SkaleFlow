'use client';

import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { SHORT_SCRIPT_TEMPLATES, MEDIUM_TEACHING_FORMATS, LONG_TEACHING_STRUCTURES, CAROUSEL_TEMPLATES, STATIC_TEMPLATES, HOOK_TEMPLATES, CTA_TEMPLATES } from '@/config/script-frameworks';

interface ScriptTemplateBadgeProps {
  scriptTemplate?: string | null;
  hookTemplate?: string | null;
  ctaTemplate?: string | null;
  className?: string;
}

// Config-based name lookup (fallback)
const ALL_SCRIPT_TEMPLATES: Record<string, { name: string }> = {
  ...SHORT_SCRIPT_TEMPLATES,
  ...MEDIUM_TEACHING_FORMATS,
  ...LONG_TEACHING_STRUCTURES,
  ...CAROUSEL_TEMPLATES,
  ...STATIC_TEMPLATES,
};

// Simple in-memory cache for DB template names
const dbNameCache: Record<string, string> = {};

function getTemplateName(key: string): string {
  // Check DB cache first
  if (dbNameCache[key]) return dbNameCache[key];
  // Fallback to config
  return ALL_SCRIPT_TEMPLATES[key]?.name || key.replace(/_/g, ' ');
}

function getHookName(key: string): string {
  if (dbNameCache[`hook_${key}`]) return dbNameCache[`hook_${key}`];
  return HOOK_TEMPLATES[key as keyof typeof HOOK_TEMPLATES]?.name || key.replace(/_/g, ' ');
}

function getCtaName(key: string): string {
  if (dbNameCache[`cta_${key}`]) return dbNameCache[`cta_${key}`];
  return CTA_TEMPLATES[key as keyof typeof CTA_TEMPLATES]?.name || key.replace(/_/g, ' ');
}

export function ScriptTemplateBadge({ scriptTemplate, hookTemplate, ctaTemplate, className }: ScriptTemplateBadgeProps) {
  const [, setLoaded] = useState(false);

  // Lazy-load DB names on first render if we have unknown keys
  useEffect(() => {
    const unknownKeys: string[] = [];
    if (scriptTemplate && !ALL_SCRIPT_TEMPLATES[scriptTemplate] && !dbNameCache[scriptTemplate]) {
      unknownKeys.push(scriptTemplate);
    }
    if (unknownKeys.length === 0) return;

    // Fetch from API to populate cache
    const params = new URLSearchParams({ active: 'true' });
    fetch(`/api/admin/templates?${params}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.templates) {
          for (const t of data.templates) {
            dbNameCache[t.template_key] = t.name;
          }
          setLoaded(true);
        }
      })
      .catch(() => {});
  }, [scriptTemplate]);

  if (!scriptTemplate && !hookTemplate && !ctaTemplate) return null;

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {scriptTemplate && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {getTemplateName(scriptTemplate)}
        </span>
      )}
      {hookTemplate && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          Hook: {getHookName(hookTemplate)}
        </span>
      )}
      {ctaTemplate && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
          CTA: {getCtaName(ctaTemplate)}
        </span>
      )}
    </div>
  );
}
