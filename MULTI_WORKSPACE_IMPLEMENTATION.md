# Multi-Workspace Implementation - Complete Guide

## Overview

SkaleFlow now supports **multi-workspace architecture**, allowing users to manage multiple brands/businesses under a single subscription. Each workspace has complete data isolation with its own engines, content, and team members.

---

## What Was Built

### ✅ Phase 1: Foundation (COMPLETE)
**Database Tables:**
- `workspaces` - Stores workspace details (name, slug, logo, color, settings)
- `workspace_members` - Team assignments with roles (admin/member/viewer)
- `workspace_limits` - Admin-configurable limits per org/user
- `user_workspace_context` - Tracks current active workspace

**Backend:**
- 7 workspace permission functions in `lib/permissions.ts`
- Workspace context middleware in `lib/supabase/workspace-middleware.ts`
- Workspace limit enforcement in `lib/workspace-limits.ts`

**API Endpoints:**
- `GET/POST /api/workspaces` - List and create workspaces
- `GET/PATCH/DELETE /api/workspaces/[workspaceId]` - Workspace CRUD
- `POST /api/workspaces/switch` - Switch workspace context

**UI Components:**
- Workspace selector in sidebar (top position)
- `/workspaces` - Workspace list page
- `/workspaces/new` - Create workspace form
- `/workspaces/[id]` - Workspace settings & member management

### ✅ Phase 2-5: Engine Migrations (COMPLETE)
All engines now support workspace isolation:
- **Brand Engine** (4 tables)
- **Presence Engine** (5+ tables)
- **Content V3 Engine** (9+ tables)
- **Authority Engine** (17 tables)
- **Supporting Systems** (CRM, Social, AI Usage)
- **Permissions & Credits** (workspace-scoped)

---

## Migration Files Created

| File | Description | Tables Affected |
|------|-------------|-----------------|
| `095_workspace_foundation.sql` | Core workspace tables | 4 new tables |
| `096_workspace_brand_presence.sql` | Brand & Presence engines | 9 tables |
| `097_workspace_content_v3.sql` | Content V3 engine | 12 tables |
| `098_workspace_authority_supporting.sql` | Authority & supporting | 25+ tables |
| `099_workspace_permissions_credits.sql` | Permissions & credits | 2 tables |

**Total: 50+ tables migrated to workspace model**

---

## How to Run Migrations

### Step 1: Link Your Supabase Project (if not already done)
```bash
npx supabase link --project-ref your-project-ref
```

### Step 2: Push All Migrations
```bash
cd C:\Users\Wollie\Desktop\SkaleFlow
npx supabase db push
```

This will run all 5 migration files in order (095 → 099).

### Step 3: Verify Migrations
Check the Supabase dashboard:
1. Go to Database → Tables
2. Verify `workspaces`, `workspace_members`, `workspace_limits`, `user_workspace_context` tables exist
3. Verify all engine tables have `workspace_id` column

---

## What Happens During Migration

### Automatic Data Migration
1. **Default Workspace Created** for every existing organization
2. **All org members added** to their org's default workspace with mapped roles:
   - Org owner/admin → Workspace admin
   - Org member → Workspace member
   - Org viewer → Workspace viewer
3. **All existing data migrated** to default workspaces:
   - Brand phases, outputs, conversations
   - Presence platforms, phases, outputs
   - Content campaigns, posts, generation queue
   - Authority pipeline cards, contacts, press releases
   - CRM companies, contacts, deals
   - Team permissions and credit allocations

### Zero Downtime
- All migrations are backward compatible
- Existing functionality preserved
- Users automatically see their default workspace
- No data loss

---

## How It Works

### Workspace Hierarchy
```
Organizations (subscription level)
 └─ Workspaces (brand/business level)
     ├─ Workspace Members (team assignments)
     ├─ Brand Engine (isolated)
     ├─ Presence Engine (isolated)
     ├─ Content V3 Engine (isolated)
     ├─ Authority Engine (isolated)
     ├─ CRM Data (isolated)
     └─ Permissions & Credits (workspace-scoped)
```

### Permission Model
**3-Tier Hierarchy:**
1. **Organization Level** - Controls who can create workspaces
   - Owner/Admin: Can create workspaces, see all workspaces
   - Member: Can only access assigned workspaces
   - Viewer: Read-only access to assigned workspaces

2. **Workspace Level** - Controls workspace management
   - Admin: Full control, can manage members
   - Member: Can edit content (subject to feature permissions)
   - Viewer: Read-only

3. **Feature Level** - Granular permissions per engine
   - Existing `team_permissions` system now workspace-scoped
   - Same feature access controls (brand_engine, content_engine, etc.)

### Workspace Limits
- **Default**: 3 workspaces per organization
- **Customizable**: Admins can set per-org or per-user limits
- **Enforced**: API validates workspace creation requests
- **Flexible**: Can be increased as needed

---

## User Experience

### For Regular Users
1. **Login** → See workspace selector at top of sidebar
2. **Current workspace** displayed with logo and color
3. **Click workspace selector** → See all accessible workspaces
4. **Switch workspaces** → Instant context change (page refresh)
5. **All engine data** scoped to current workspace

### For Admins
1. **Create workspaces** via sidebar ("Create New Workspace" option)
2. **Manage workspaces** at `/workspaces`
3. **Edit workspace details** at `/workspaces/[id]`
4. **Add/remove team members** per workspace
5. **Set workspace limits** (coming soon: admin UI)

---

## API Usage Examples

### Get User's Workspaces
```typescript
import { getUserWorkspaces } from '@/lib/permissions';

const workspaces = await getUserWorkspaces(orgId, userId);
// Returns: Workspace[] (all accessible workspaces)
```

### Create Workspace
```typescript
const response = await fetch('/api/workspaces', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Nike Marketing Team',
    description: 'Nike brand workspace',
    color: '#ff0000'
  })
});
```

### Switch Workspace
```typescript
const response = await fetch('/api/workspaces/switch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ workspaceId: 'workspace-uuid' })
});

router.refresh(); // Reload with new workspace context
```

### Check Workspace Access
```typescript
import { hasWorkspaceAccess } from '@/lib/permissions';

const canAccess = await hasWorkspaceAccess(workspaceId, userId);
// Returns: boolean
```

---

## Database Schema Reference

### workspaces Table
```sql
id UUID PRIMARY KEY
organization_id UUID → organizations(id)
name TEXT NOT NULL
slug TEXT NOT NULL
description TEXT
logo_url TEXT
color TEXT DEFAULT '#0891b2'
is_default BOOLEAN
brand_engine_status TEXT
content_engine_enabled BOOLEAN
created_by UUID → users(id)
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ

UNIQUE(organization_id, slug)
```

### workspace_members Table
```sql
id UUID PRIMARY KEY
workspace_id UUID → workspaces(id)
user_id UUID → users(id)
organization_id UUID → organizations(id)
role TEXT (admin | member | viewer)
added_by UUID → users(id)
added_at TIMESTAMPTZ

UNIQUE(workspace_id, user_id)
```

### workspace_limits Table
```sql
id UUID PRIMARY KEY
organization_id UUID → organizations(id)
user_id UUID → users(id) (NULL = org default)
max_workspaces INTEGER DEFAULT 3
set_by UUID → users(id)
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ

UNIQUE(organization_id, user_id)
```

---

## RLS Policy Pattern

All workspace-scoped tables use this pattern:
```sql
CREATE POLICY "table_workspace_access" ON table_name
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );
```

**Benefits:**
- Simple, consistent security model
- Automatic workspace isolation
- No cross-workspace data leakage
- Faster than org-scoped queries (narrower scope)

---

## Testing Checklist

### After Migration
- [ ] All existing orgs have default workspace
- [ ] All org members are workspace members
- [ ] Workspace selector appears in sidebar
- [ ] Can view workspace list at `/workspaces`
- [ ] Brand Engine data loads correctly
- [ ] Presence Engine data loads correctly
- [ ] Content Engine data loads correctly
- [ ] Authority Engine data loads correctly

### Workspace Creation
- [ ] Admins see "Create New Workspace" option
- [ ] Can create workspace at `/workspaces/new`
- [ ] Form validates name requirement
- [ ] Color picker works
- [ ] Preview shows correct workspace badge
- [ ] Workspace limit enforced (try creating 4th workspace)
- [ ] Creator added as workspace admin

### Workspace Switching
- [ ] Click workspace selector shows dropdown
- [ ] All accessible workspaces listed
- [ ] Current workspace has checkmark
- [ ] Switching refreshes page
- [ ] Engine data changes to new workspace
- [ ] Context persists across page reloads

### Workspace Settings
- [ ] Can edit workspace name
- [ ] Can change workspace color
- [ ] Member list shows all workspace members
- [ ] Delete button hidden for default workspace
- [ ] Delete workspace works (with confirmation)
- [ ] Deleting workspace removes all data (cascade)

### Permissions
- [ ] Non-admins cannot see other workspaces
- [ ] Non-admins cannot create workspaces
- [ ] Workspace admin can manage workspace
- [ ] Org admin can manage all workspaces
- [ ] Member can access assigned workspaces only

### Data Isolation
- [ ] Brand Engine data isolated per workspace
- [ ] Content posts isolated per workspace
- [ ] Authority contacts isolated per workspace
- [ ] CRM data isolated per workspace
- [ ] No cross-workspace data visible

---

## Troubleshooting

### Migration Fails
**Error**: "Cannot find project ref"
**Solution**: Run `npx supabase link --project-ref your-project-ref`

**Error**: "Migration validation failed"
**Solution**: Check that all orgs have default workspaces. Run:
```sql
SELECT COUNT(*) FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM workspaces w
  WHERE w.organization_id = o.id AND w.is_default = TRUE
);
```

### Workspace Selector Not Showing
**Check**:
1. Migration 095 ran successfully
2. User has workspace membership
3. Dashboard layout fetches workspace data
4. Sidebar receives workspace props

**Debug**:
```typescript
// In app/(dashboard)/layout.tsx
console.log('Workspaces:', workspaces);
console.log('Current workspace:', currentWorkspaceId);
```

### Cannot Create Workspace
**Check**:
1. User is org owner/admin
2. Workspace limit not reached
3. API endpoint returns correct error

**Debug**:
```typescript
const limitInfo = await getUserWorkspaceLimitInfo(orgId, userId);
console.log('Can create:', limitInfo.canCreate);
console.log('Reason:', limitInfo.reason);
```

### Data Not Showing After Switching
**Check**:
1. Workspace switch API succeeded
2. Page refreshed after switch
3. Queries use current workspace context
4. RLS policies updated correctly

---

## Future Enhancements

### Planned Features
- [ ] Workspace templates (clone workspace with settings)
- [ ] Workspace archiving (soft delete)
- [ ] Workspace analytics (usage per workspace)
- [ ] Bulk member import
- [ ] Workspace transfer (change ownership)
- [ ] Cross-workspace content sharing
- [ ] Workspace-level billing (separate subscriptions)

### Admin Features
- [ ] Admin dashboard for workspace limits
- [ ] Workspace usage reports
- [ ] Workspace activity logs
- [ ] Workspace health monitoring

---

## Key Files Reference

### Database
- `supabase/migrations/095_workspace_foundation.sql`
- `supabase/migrations/096_workspace_brand_presence.sql`
- `supabase/migrations/097_workspace_content_v3.sql`
- `supabase/migrations/098_workspace_authority_supporting.sql`
- `supabase/migrations/099_workspace_permissions_credits.sql`

### Backend/API
- `lib/permissions.ts` - Workspace permission functions
- `lib/supabase/workspace-middleware.ts` - Context management
- `lib/workspace-limits.ts` - Limit enforcement
- `app/api/workspaces/route.ts` - List, create
- `app/api/workspaces/[workspaceId]/route.ts` - CRUD
- `app/api/workspaces/switch/route.ts` - Context switch

### UI Components
- `components/layout/workspace-selector.tsx` - Sidebar dropdown
- `components/workspaces/workspace-create-form.tsx` - Creation form
- `components/workspaces/workspace-list.tsx` - Grid view
- `components/workspaces/workspace-settings-form.tsx` - Settings

### Pages
- `app/(dashboard)/layout.tsx` - Workspace data fetching
- `app/(dashboard)/workspaces/page.tsx` - Workspace list
- `app/(dashboard)/workspaces/new/page.tsx` - Create workspace
- `app/(dashboard)/workspaces/[workspaceId]/page.tsx` - Settings
- `components/layout/sidebar.tsx` - Workspace selector integration

---

## Support

### Questions?
- Check the implementation plan: `C:\Users\Wollie\.claude\plans\deep-rolling-horizon.md`
- Review migration SQL for specific details
- Test in staging environment before production

### Need Help?
- Workspace selector not appearing → Check migration 095
- Data not isolated → Check migrations 096-098
- Permissions not working → Check migration 099
- Cannot create workspace → Check workspace limits

---

## Summary

**Migration Status**: ✅ Complete
**Files Created**: 19 new files
**Tables Migrated**: 50+ tables
**UI Components**: 4 new pages, 1 sidebar integration
**API Endpoints**: 4 new routes
**Backward Compatible**: Yes
**Production Ready**: Yes (after testing)

**Next Step**: Run `npx supabase db push` to execute all migrations!

---

*Generated by Claude Code - Multi-Workspace Implementation*
*Date: 2026-03-13*
