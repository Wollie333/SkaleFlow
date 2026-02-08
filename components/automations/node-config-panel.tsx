'use client';

import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { Node } from '@xyflow/react';

interface Stage { id: string; name: string; color: string; }
interface Tag { id: string; name: string; color: string; }
interface Template { id: string; name: string; }
interface Endpoint { id: string; name: string; }

interface NodeConfigPanelProps {
  node: Node | null;
  stages: Stage[];
  tags: Tag[];
  templates: Template[];
  endpoints: Endpoint[];
  onUpdate: (nodeId: string, data: Record<string, unknown>) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
}

export function NodeConfigPanel({ node, stages, tags, templates, endpoints, onUpdate, onDelete, onClose }: NodeConfigPanelProps) {
  if (!node) return null;

  const data = node.data as Record<string, unknown>;
  const config = (data.config || {}) as Record<string, unknown>;
  const nodeType = data.stepType as string || node.type || '';

  const updateConfig = (key: string, value: unknown) => {
    const newConfig = { ...config, [key]: value };
    onUpdate(node.id, { ...data, config: newConfig });
  };

  const updateLabel = (label: string) => {
    onUpdate(node.id, { ...data, label });
  };

  return (
    <div className="w-72 bg-white border-l border-stone/10 p-4 flex-shrink-0 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-charcoal">Configure Node</h3>
        <button onClick={onClose} className="text-stone hover:text-charcoal">
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {nodeType === 'trigger' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-stone mb-1">Trigger Type</label>
            <select
              value={(data.triggerType as string) || ''}
              onChange={(e) => {
                onUpdate(node.id, { ...data, triggerType: e.target.value, label: e.target.options[e.target.selectedIndex].text });
              }}
              className="w-full px-2 py-1.5 border border-stone/20 rounded-lg text-sm"
            >
              <option value="">Select...</option>
              <option value="stage_changed">Stage Changed</option>
              <option value="contact_created">Contact Created</option>
              <option value="tag_added">Tag Added</option>
              <option value="tag_removed">Tag Removed</option>
            </select>
          </div>
          {(data.triggerType === 'stage_changed') && (
            <div>
              <label className="block text-xs font-medium text-stone mb-1">To Stage</label>
              <select
                value={(config.to_stage_id as string) || ''}
                onChange={(e) => updateConfig('to_stage_id', e.target.value)}
                className="w-full px-2 py-1.5 border border-stone/20 rounded-lg text-sm"
              >
                <option value="">Any stage</option>
                {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          {((data.triggerType === 'tag_added') || (data.triggerType === 'tag_removed')) && (
            <div>
              <label className="block text-xs font-medium text-stone mb-1">Tag</label>
              <select
                value={(config.tag_id as string) || ''}
                onChange={(e) => updateConfig('tag_id', e.target.value)}
                className="w-full px-2 py-1.5 border border-stone/20 rounded-lg text-sm"
              >
                <option value="">Any tag</option>
                {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      {nodeType === 'send_email' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-stone mb-1">Email Template</label>
            <select
              value={(config.template_id as string) || ''}
              onChange={(e) => {
                updateConfig('template_id', e.target.value);
                const tmpl = templates.find(t => t.id === e.target.value);
                if (tmpl) updateLabel(tmpl.name);
              }}
              className="w-full px-2 py-1.5 border border-stone/20 rounded-lg text-sm"
            >
              <option value="">Select template...</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone mb-1">From Name (optional)</label>
            <input type="text" value={(config.from_name as string) || ''}
              onChange={(e) => updateConfig('from_name', e.target.value)}
              className="w-full px-2 py-1.5 border border-stone/20 rounded-lg text-sm" placeholder="Company Name" />
          </div>
        </div>
      )}

      {nodeType === 'move_stage' && (
        <div>
          <label className="block text-xs font-medium text-stone mb-1">Target Stage</label>
          <select
            value={(config.stage_id as string) || ''}
            onChange={(e) => {
              updateConfig('stage_id', e.target.value);
              const stage = stages.find(s => s.id === e.target.value);
              if (stage) updateLabel(stage.name);
            }}
            className="w-full px-2 py-1.5 border border-stone/20 rounded-lg text-sm"
          >
            <option value="">Select stage...</option>
            {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}

      {(nodeType === 'add_tag' || nodeType === 'remove_tag') && (
        <div>
          <label className="block text-xs font-medium text-stone mb-1">Tag</label>
          <select
            value={(config.tag_id as string) || ''}
            onChange={(e) => {
              updateConfig('tag_id', e.target.value);
              const tag = tags.find(t => t.id === e.target.value);
              if (tag) updateLabel(tag.name);
            }}
            className="w-full px-2 py-1.5 border border-stone/20 rounded-lg text-sm"
          >
            <option value="">Select tag...</option>
            {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      )}

      {nodeType === 'webhook' && (
        <div>
          <label className="block text-xs font-medium text-stone mb-1">Webhook Endpoint</label>
          <select
            value={(config.endpoint_id as string) || ''}
            onChange={(e) => {
              updateConfig('endpoint_id', e.target.value);
              const ep = endpoints.find(ep => ep.id === e.target.value);
              if (ep) updateLabel(ep.name);
            }}
            className="w-full px-2 py-1.5 border border-stone/20 rounded-lg text-sm"
          >
            <option value="">Select endpoint...</option>
            {endpoints.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
      )}

      {nodeType === 'delay' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-stone mb-1">Duration</label>
            <input type="number" value={(config.duration_minutes as number) || 60} min={1}
              onChange={(e) => {
                const mins = parseInt(e.target.value) || 60;
                updateConfig('duration_minutes', mins);
                if (mins >= 1440) updateLabel(`${Math.floor(mins / 1440)} day(s)`);
                else if (mins >= 60) updateLabel(`${Math.floor(mins / 60)} hour(s)`);
                else updateLabel(`${mins} min(s)`);
              }}
              className="w-full px-2 py-1.5 border border-stone/20 rounded-lg text-sm" />
          </div>
          <div className="flex gap-2">
            {[15, 60, 1440, 10080].map((mins) => (
              <button key={mins} onClick={() => {
                updateConfig('duration_minutes', mins);
                if (mins >= 1440) updateLabel(`${Math.floor(mins / 1440)} day(s)`);
                else if (mins >= 60) updateLabel(`${Math.floor(mins / 60)} hour(s)`);
                else updateLabel(`${mins} min(s)`);
              }}
                className="px-2 py-1 text-[10px] bg-stone/10 rounded hover:bg-stone/20">
                {mins < 60 ? `${mins}m` : mins < 1440 ? `${mins / 60}h` : `${mins / 1440}d`}
              </button>
            ))}
          </div>
        </div>
      )}

      {nodeType === 'condition' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-stone mb-1">Field</label>
            <select value={(config.field as string) || ''}
              onChange={(e) => updateConfig('field', e.target.value)}
              className="w-full px-2 py-1.5 border border-stone/20 rounded-lg text-sm">
              <option value="">Select field...</option>
              <option value="email">Email</option>
              <option value="company">Company</option>
              <option value="value_cents">Deal Value</option>
              <option value="phone">Phone</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone mb-1">Operator</label>
            <select value={(config.operator as string) || ''}
              onChange={(e) => {
                updateConfig('operator', e.target.value);
                updateLabel(`${config.field || '?'} ${e.target.value} ${config.value || '?'}`);
              }}
              className="w-full px-2 py-1.5 border border-stone/20 rounded-lg text-sm">
              <option value="">Select...</option>
              <option value="equals">Equals</option>
              <option value="not_equals">Not Equals</option>
              <option value="contains">Contains</option>
              <option value="is_empty">Is Empty</option>
              <option value="is_not_empty">Is Not Empty</option>
              <option value="greater_than">Greater Than</option>
              <option value="less_than">Less Than</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone mb-1">Value</label>
            <input type="text" value={(config.value as string) || ''}
              onChange={(e) => updateConfig('value', e.target.value)}
              className="w-full px-2 py-1.5 border border-stone/20 rounded-lg text-sm" placeholder="Enter value..." />
          </div>
        </div>
      )}

      {/* Delete Node */}
      <div className="mt-6 pt-4 border-t border-stone/10">
        <button
          onClick={() => onDelete(node.id)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
        >
          <TrashIcon className="w-4 h-4" />
          Delete Step
        </button>
      </div>
    </div>
  );
}
