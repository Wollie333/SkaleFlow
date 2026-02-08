'use client';

import { cn } from '@/lib/utils';
import { SHORT_SCRIPT_TEMPLATES, MEDIUM_TEACHING_FORMATS, LONG_TEACHING_STRUCTURES, CAROUSEL_TEMPLATES, STATIC_TEMPLATES, HOOK_TEMPLATES, CTA_TEMPLATES } from '@/config/script-frameworks';

interface ScriptTemplateBadgeProps {
  scriptTemplate?: string | null;
  hookTemplate?: string | null;
  ctaTemplate?: string | null;
  className?: string;
}

function getTemplateName(key: string): string {
  const all: Record<string, { name: string }> = {
    ...SHORT_SCRIPT_TEMPLATES,
    ...MEDIUM_TEACHING_FORMATS,
    ...LONG_TEACHING_STRUCTURES,
    ...CAROUSEL_TEMPLATES,
    ...STATIC_TEMPLATES,
  };
  return all[key]?.name || key.replace(/_/g, ' ');
}

function getHookName(key: string): string {
  return HOOK_TEMPLATES[key as keyof typeof HOOK_TEMPLATES]?.name || key.replace(/_/g, ' ');
}

function getCtaName(key: string): string {
  return CTA_TEMPLATES[key as keyof typeof CTA_TEMPLATES]?.name || key.replace(/_/g, ' ');
}

export function ScriptTemplateBadge({ scriptTemplate, hookTemplate, ctaTemplate, className }: ScriptTemplateBadgeProps) {
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
