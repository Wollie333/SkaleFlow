'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import {
  BriefcaseIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface TeamRole {
  id: string;
  name: string;
  description: string | null;
  permissions: Record<string, Record<string, boolean>>;
  is_system_role: boolean;
  sort_order: number;
}

interface RoleTemplateManagerProps {
  onTemplateSelect?: (template: TeamRole) => void;
  showApplyButton?: boolean;
  className?: string;
}

const PERMISSION_LABELS: Record<string, string> = {
  // Brand Engine
  chat: 'Chat with Brand AI',
  edit_variables: 'Edit Brand Variables',
  // Content Engine
  create: 'Create Content',
  edit: 'Edit Own Content',
  edit_others: 'Edit Others\' Content',
  delete: 'Delete Content',
  upload_media: 'Upload Media',
  request_approval: 'Request Approval',
  approve: 'Approve Content',
  reject: 'Reject Content',
  request_revision: 'Request Revisions',
  schedule: 'Schedule Posts',
  change_schedule: 'Change Schedules',
  publish: 'Publish Content',
  comment: 'Add Comments',
  mention: 'Mention Users',
  view_analytics: 'View Analytics',
  view_revisions: 'View Revision History',
  revert: 'Revert to Previous Versions',
  // Pipeline
  manage_contacts: 'Manage Contacts',
  send_emails: 'Send Emails',
};

export function RoleTemplateManager({
  onTemplateSelect,
  showApplyButton = false,
  className,
}: RoleTemplateManagerProps) {
  const [templates, setTemplates] = useState<TeamRole[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TeamRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const toast = useToast();

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/team/roles');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.roles || []);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSelect = (template: TeamRole) => {
    setSelectedTemplate(template);
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  const toggleExpand = (templateId: string) => {
    setExpandedTemplate(expandedTemplate === templateId ? null : templateId);
  };

  const getPermissionsSummary = (permissions: Record<string, Record<string, boolean>>): string => {
    const enabled: string[] = [];
    Object.entries(permissions).forEach(([feature, perms]) => {
      const featureEnabled = Object.values(perms).some(v => v === true);
      if (featureEnabled && feature !== 'access') {
        enabled.push(feature.replace('_', ' '));
      }
    });
    return enabled.length > 0 ? enabled.join(', ') : 'No permissions';
  };

  const systemTemplates = templates.filter(t => t.is_system_role);
  const customTemplates = templates.filter(t => !t.is_system_role);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BriefcaseIcon className="w-6 h-6 text-teal" />
          <h3 className="font-serif text-xl font-bold text-charcoal">Role Templates</h3>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-cream-warm rounded-lg border border-stone/10 p-4 animate-pulse">
              <div className="h-5 bg-stone/10 rounded w-1/3 mb-2" />
              <div className="h-4 bg-stone/8 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* System Templates */}
      {!isLoading && systemTemplates.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-stone uppercase tracking-wider mb-3">
            Predefined Roles
          </h4>
          <div className="space-y-2">
            {systemTemplates.map(template => {
              const isExpanded = expandedTemplate === template.id;
              const isSelected = selectedTemplate?.id === template.id;

              return (
                <div
                  key={template.id}
                  className={cn(
                    'bg-cream-warm rounded-lg border transition-all overflow-hidden',
                    isSelected ? 'border-teal/40 bg-teal/5' : 'border-stone/10 hover:border-teal/20'
                  )}
                >
                  {/* Template Header */}
                  <button
                    onClick={() => toggleExpand(template.id)}
                    className="w-full p-4 flex items-start gap-3 text-left hover:bg-stone/5 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0">
                      <BriefcaseIcon className="w-5 h-5 text-teal" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold text-charcoal">{template.name}</h5>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          System
                        </span>
                        {isSelected && (
                          <CheckCircleIcon className="w-5 h-5 text-teal" />
                        )}
                      </div>
                      <p className="text-sm text-stone">{template.description || 'No description'}</p>
                    </div>
                  </button>

                  {/* Expanded Permissions */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-stone/10 bg-white/50">
                      <div className="pt-4 space-y-4">
                        {Object.entries(template.permissions).map(([feature, perms]) => {
                          const enabledPerms = Object.entries(perms).filter(([_, v]) => v === true);
                          if (enabledPerms.length === 0) return null;

                          return (
                            <div key={feature}>
                              <p className="text-xs font-semibold text-stone uppercase tracking-wider mb-2">
                                {feature.replace('_', ' ')}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {enabledPerms.map(([perm]) => (
                                  <span
                                    key={perm}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-green-100 text-green-700"
                                  >
                                    <CheckCircleIcon className="w-3 h-3" />
                                    {PERMISSION_LABELS[perm] || perm}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Apply Button */}
                      {showApplyButton && (
                        <div className="mt-4 pt-4 border-t border-stone/10">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelect(template);
                            }}
                            className={cn(
                              'text-sm',
                              isSelected
                                ? 'bg-teal/20 text-teal border-2 border-teal'
                                : 'bg-teal hover:bg-teal-light text-white'
                            )}
                            size="sm"
                          >
                            {isSelected ? 'Selected' : 'Use This Template'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Templates */}
      {!isLoading && customTemplates.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-stone uppercase tracking-wider">
              Custom Roles
            </h4>
          </div>
          <div className="space-y-2">
            {customTemplates.map(template => {
              const isExpanded = expandedTemplate === template.id;
              const isSelected = selectedTemplate?.id === template.id;

              return (
                <div
                  key={template.id}
                  className={cn(
                    'bg-cream-warm rounded-lg border transition-all overflow-hidden',
                    isSelected ? 'border-teal/40 bg-teal/5' : 'border-stone/10 hover:border-teal/20'
                  )}
                >
                  <button
                    onClick={() => toggleExpand(template.id)}
                    className="w-full p-4 flex items-start gap-3 text-left hover:bg-stone/5 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <BriefcaseIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold text-charcoal">{template.name}</h5>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          Custom
                        </span>
                        {isSelected && (
                          <CheckCircleIcon className="w-5 h-5 text-teal" />
                        )}
                      </div>
                      <p className="text-sm text-stone">{template.description || 'No description'}</p>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-stone/10 bg-white/50">
                      <div className="pt-4 space-y-4">
                        {Object.entries(template.permissions).map(([feature, perms]) => {
                          const enabledPerms = Object.entries(perms).filter(([_, v]) => v === true);
                          if (enabledPerms.length === 0) return null;

                          return (
                            <div key={feature}>
                              <p className="text-xs font-semibold text-stone uppercase tracking-wider mb-2">
                                {feature.replace('_', ' ')}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {enabledPerms.map(([perm]) => (
                                  <span
                                    key={perm}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-green-100 text-green-700"
                                  >
                                    <CheckCircleIcon className="w-3 h-3" />
                                    {PERMISSION_LABELS[perm] || perm}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {showApplyButton && (
                        <div className="mt-4 pt-4 border-t border-stone/10">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelect(template);
                            }}
                            className={cn(
                              'text-sm',
                              isSelected
                                ? 'bg-teal/20 text-teal border-2 border-teal'
                                : 'bg-teal hover:bg-teal-light text-white'
                            )}
                            size="sm"
                          >
                            {isSelected ? 'Selected' : 'Use This Template'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && templates.length === 0 && (
        <div className="text-center py-12 text-stone">
          <BriefcaseIcon className="w-12 h-12 mx-auto mb-3 text-stone/40" />
          <p className="text-sm">No role templates available</p>
        </div>
      )}
    </div>
  );
}
