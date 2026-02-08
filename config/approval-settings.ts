import type { OrgMemberRole } from '@/types/database';

export interface ApprovalSettings {
  approval_required: boolean;
  roles_requiring_approval: OrgMemberRole[];
  roles_that_can_approve: OrgMemberRole[];
  auto_approve_owner: boolean;
}

export const DEFAULT_APPROVAL_SETTINGS: ApprovalSettings = {
  approval_required: false,
  roles_requiring_approval: ['member', 'viewer'],
  roles_that_can_approve: ['owner', 'admin'],
  auto_approve_owner: true,
};

export function getApprovalSettings(orgSettings: Record<string, unknown> | null): ApprovalSettings {
  if (!orgSettings || !orgSettings.approval_settings) {
    return DEFAULT_APPROVAL_SETTINGS;
  }
  const s = orgSettings.approval_settings as Partial<ApprovalSettings>;
  return {
    approval_required: s.approval_required ?? DEFAULT_APPROVAL_SETTINGS.approval_required,
    roles_requiring_approval: s.roles_requiring_approval ?? DEFAULT_APPROVAL_SETTINGS.roles_requiring_approval,
    roles_that_can_approve: s.roles_that_can_approve ?? DEFAULT_APPROVAL_SETTINGS.roles_that_can_approve,
    auto_approve_owner: s.auto_approve_owner ?? DEFAULT_APPROVAL_SETTINGS.auto_approve_owner,
  };
}

export function canApproveContent(role: OrgMemberRole, settings: ApprovalSettings): boolean {
  return settings.roles_that_can_approve.includes(role);
}

export function requiresApproval(role: OrgMemberRole, settings: ApprovalSettings): boolean {
  if (!settings.approval_required) return false;
  if (settings.auto_approve_owner && role === 'owner') return false;
  return settings.roles_requiring_approval.includes(role);
}
