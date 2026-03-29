# Role Template System - Testing Plan

## Pre-Testing: Migration Verification

### ✅ Step 1: Verify Migration Completed
Run this query in Supabase Dashboard SQL Editor:

```sql
SELECT
  COUNT(*) as total_templates,
  COUNT(*) FILTER (WHERE is_system_template = true) as system_templates,
  COUNT(*) FILTER (WHERE is_system_template = false) as custom_templates
FROM permission_templates;
```

**Expected Result:**
- total_templates: 8
- system_templates: 8
- custom_templates: 0

### ✅ Step 2: View All Templates
```sql
SELECT
  name,
  is_system_template,
  sort_order,
  description
FROM permission_templates
ORDER BY is_system_template DESC, sort_order ASC;
```

**Expected Result:** 8 rows with names:
1. Social Media Manager
2. Content Creator
3. Content Strategist
4. Brand Manager
5. Copywriter
6. Graphic Designer
7. Viewer
8. Community Manager

---

## Test 1: Template API Endpoint

### Test 1A: Fetch Templates
```bash
# Via browser or Postman (replace with your actual auth token)
GET http://localhost:3000/api/team/permission-templates
```

**Expected Result:**
```json
{
  "templates": [
    {
      "id": "uuid...",
      "name": "Social Media Manager",
      "description": "Full access to content creation...",
      "is_system_template": true,
      "sort_order": 1,
      "permissions": {
        "brand_engine": { "access": true, "chat": false, "edit_variables": false },
        "content_engine": { "access": true, "create": true, ... },
        "pipeline": { "access": false }
      }
    },
    // ... 7 more templates
  ]
}
```

---

## Test 2: UI - Template Selector in Permissions Tab

### Step-by-Step:
1. Navigate to **My Team** → **Permissions** tab
2. Find a team member in the permissions grid
3. Click to expand their row
4. Look for **"Apply Template"** button (should be visible)
5. Click "Apply Template"
6. Dropdown should show all 8 system templates with:
   - Template name
   - "System" badge
   - Description text

### Expected UI:
```
┌─────────────────────────────────────┐
│ 🎨 Apply Template             ▼    │
└─────────────────────────────────────┘
  ┌───────────────────────────────────┐
  │ Social Media Manager    [System]  │
  │ Full access to content creation...│
  ├───────────────────────────────────┤
  │ Content Creator         [System]  │
  │ Can create and edit content...    │
  ├───────────────────────────────────┤
  │ ... (6 more templates)            │
  └───────────────────────────────────┘
```

---

## Test 3: Apply "Social Media Manager" Template

### Step-by-Step:
1. In Permissions tab, expand a test user's row
2. Click "Apply Template" → Select "Social Media Manager"
3. Template should close
4. Permissions grid should update to show:

**Expected Permissions for Social Media Manager:**

| Feature | Access | Create | Edit | Edit Others | Upload Media | Approve | Schedule | Publish | View Analytics |
|---------|--------|--------|------|-------------|--------------|---------|----------|---------|----------------|
| Brand Engine | ✅ | - | - | - | - | - | - | - | - |
| Content Engine | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Pipeline | ❌ | - | - | - | - | - | - | - | - |

**Other expected permissions:**
- `request_approval`: true
- `comment`: true
- `mention`: true
- `view_revisions`: true
- `revert`: false
- `reject`: false
- `approve`: false

### Verification Query:
```sql
SELECT
  u.email,
  tp.feature,
  tp.permissions
FROM team_permissions tp
JOIN users u ON u.id = tp.user_id
WHERE u.email = 'test-user@example.com'
ORDER BY tp.feature;
```

---

## Test 4: Apply Different Role Templates

### Test 4A: Apply "Viewer" (Read-Only)
**Expected:** ALL permissions should be false except:
- `brand_engine.access`: true
- `content_engine.access`: true
- `content_engine.comment`: true
- `content_engine.view_analytics`: true
- `content_engine.view_revisions`: true

### Test 4B: Apply "Brand Manager" (Full Access)
**Expected:** Nearly ALL permissions should be true:
- `brand_engine.edit_variables`: true (only Brand Managers have this)
- `content_engine.approve`: true
- `content_engine.delete`: true
- `content_engine.edit_others`: true
- `content_engine.revert`: true

### Test 4C: Apply "Copywriter"
**Expected:**
- `content_engine.create`: true
- `content_engine.edit`: true
- `content_engine.upload_media`: **false** (copywriters can't upload media)
- `content_engine.publish`: **false** (can't publish)
- `content_engine.approve`: **false** (can't approve)

---

## Test 5: Create Custom Template (API)

### Via Postman/Curl:
```bash
POST http://localhost:3000/api/team/permission-templates
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Junior Designer",
  "description": "Can upload media and comment, but cannot publish",
  "permissions": {
    "brand_engine": {
      "access": true,
      "chat": false,
      "edit_variables": false
    },
    "content_engine": {
      "access": true,
      "create": false,
      "edit": false,
      "upload_media": true,
      "comment": true,
      "publish": false,
      "approve": false
    },
    "pipeline": {
      "access": false
    }
  }
}
```

**Expected Result:**
- Status 200
- Returns created template with `is_system_template: false`
- Template should appear in dropdown with "Custom" badge instead of "System"

---

## Test 6: Template Assignment Tracking

### Verification Query:
```sql
SELECT
  pta.id,
  u.email as user_email,
  pt.name as template_name,
  pta.applied_at,
  applier.email as applied_by_email,
  pta.permissions_snapshot
FROM permission_template_assignments pta
JOIN users u ON u.id = pta.user_id
JOIN permission_templates pt ON pt.id = pta.template_id
JOIN users applier ON applier.id = pta.applied_by
ORDER BY pta.applied_at DESC
LIMIT 10;
```

**Expected:** Each template application should create a record showing:
- Which user received the template
- Which template was applied
- When it was applied
- Who applied it
- Snapshot of permissions at that time

---

## Test 7: Activity Log Integration

### Step-by-Step:
1. Apply a template to a user
2. Navigate to **My Team** → **Activity Log** tab
3. Filter by "Permission Updated" or search for the user's email

**Expected Activity Log Entry:**
```
👤 Admin User applied "Social Media Manager" template to test-user@example.com
🕒 2 minutes ago
📋 Metadata: { templateId: "uuid...", templateName: "Social Media Manager" }
```

---

## Test 8: Permission Enforcement

### Test 8A: User Without Approval Permission
1. Login as user with "Content Creator" template (approve: false)
2. Navigate to a post in "pending_review" status
3. Look for "Approve" button
4. **Expected:** Button should be hidden or disabled

### Test 8B: User With Approval Permission
1. Login as user with "Content Strategist" template (approve: true)
2. Navigate to a post in "pending_review" status
3. Click "Approve" button
4. **Expected:** Post status changes to "approved", activity logged

### Test 8C: User Without Upload Media Permission
1. Login as user with "Copywriter" template (upload_media: false)
2. Try to upload media to a post
3. **Expected:** Upload button hidden or shows error

---

## Test 9: Role Template Manager UI Component

### Step-by-Step:
1. Create a new page or modal for role template browsing
2. Import and render `<RoleTemplateManager showApplyButton={true} />`
3. Click on a template to expand it
4. **Expected:** Shows detailed permission breakdown with green checkmarks for enabled permissions
5. Click "Use This Template"
6. **Expected:** `onTemplateSelect` callback fires with template data

---

## Test 10: Edge Cases

### Test 10A: Apply Template to Multiple Users
```typescript
// Call apply-template endpoint with multiple userIds
POST /api/team/permissions/apply-template
{
  "templateId": "social-media-manager-id",
  "userIds": ["user1-id", "user2-id", "user3-id"]
}
```

**Expected:** All 3 users get the same permissions, 3 activity log entries created

### Test 10B: Duplicate Template Names (Should Fail)
```sql
INSERT INTO permission_templates (organization_id, name, description, permissions, is_system_template)
VALUES ('org-id', 'Social Media Manager', 'Duplicate', '{}'::jsonb, false);
```

**Expected:** Error due to unique constraint on (organization_id, name)

### Test 10C: System Template Modification (Should Be Prevented)
Try to update or delete a system template via API.

**Expected:** API should reject with 403 or constraint should prevent it

---

## Success Criteria

✅ **Migration:**
- 8 system templates exist in database
- All templates have correct permission structures
- RLS policies allow users to view system templates

✅ **API:**
- GET /api/team/permission-templates returns all templates
- POST creates custom templates (org admins only)
- POST /api/team/permissions/apply-template applies permissions correctly

✅ **UI:**
- Template selector shows in Permissions tab
- All 8 system templates visible in dropdown
- Template application updates permission grid in real-time
- Role Template Manager component displays templates with permission details

✅ **Permissions:**
- Applied templates correctly set permissions in team_permissions table
- Permission checks enforce template-based access control
- Activity log tracks all template applications

✅ **Audit Trail:**
- permission_template_assignments records all applications
- Can see who applied what template when
- Permissions snapshot preserved for compliance

---

## Rollback Plan

If issues arise:

```sql
-- Remove all custom templates
DELETE FROM permission_templates WHERE is_system_template = false;

-- Remove all assignment records
DELETE FROM permission_template_assignments;

-- Reset user permissions to defaults (workspace role-based)
-- This would require identifying which permissions were set via templates
-- and reverting to role-based defaults
```

---

## Next Steps After Testing

Once all tests pass:

1. ✅ Document any issues found and fixes applied
2. ✅ Create user-facing documentation for template usage
3. ✅ Train admins on template application best practices
4. ✅ Monitor template usage and permission patterns
5. ✅ Gather feedback for additional system templates
6. ✅ Plan Phase 2 features (template versioning, UI for custom templates, etc.)
