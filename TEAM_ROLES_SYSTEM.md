# SkaleFlow Team Roles System

## Overview

The Team Roles System allows you to create and manage reusable permission configurations for common team roles. Instead of manually setting permissions for each user, you can apply predefined role templates.

**IMPORTANT:** This is different from content templates (`content_templates`) which are used for post/script templates. Team Roles are specifically for user permission management.

---

## ✅ What You Can Do

### 1. **Use Predefined System Roles**
8 built-in role templates ready to use:

| Role | Description | Key Permissions |
|------|-------------|--------------------|
| **Social Media Manager** | Full content creation & publishing | Create, edit, upload media, schedule, publish, view analytics |
| **Content Creator** | Create content, request approvals | Create, edit own content, upload media, request approval |
| **Content Strategist** | Review & approve content | Edit all content, approve/reject, request revisions, view analytics |
| **Brand Manager** | Full brand & content control | Everything including brand variables |
| **Copywriter** | Text-only content creation | Create, edit copy, request approval (no media) |
| **Graphic Designer** | Media management only | Upload & manage media assets |
| **Viewer** | Read-only access | View content & brand assets |
| **Community Manager** | Content + community engagement | Full content access + pipeline for contacts |

### 2. **Create Custom Team Roles**
- Organization admins can create custom roles
- Define unique permission combinations
- Reuse across multiple team members

### 3. **Quick Apply to Team Members**
- Select a user in the Permissions tab
- Click "Apply Template"
- Choose a role
- All permissions instantly applied

---

## 🗂️ Database Structure

### Main Table: `team_roles`
```sql
CREATE TABLE team_roles (
  id UUID PRIMARY KEY,
  organization_id UUID,  -- NULL for system roles
  name TEXT NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL,  -- Full permission structure
  is_system_role BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0
);
```

### Tracking Table: `team_role_assignments`
- Tracks which roles were applied to which users
- Stores snapshot of permissions at application time
- Audit trail for compliance

---

## 🔧 How to Use

### For Org Admins:

#### **Step 1: Navigate to Permissions**
1. Go to "My Team" → "Permissions" tab
2. Expand a team member's row
3. You'll see "Apply Template" button

#### **Step 2: Apply a Role**
1. Click "Apply Template"
2. Browse system roles or your custom roles
3. Select the role that matches the user's responsibilities
4. Permissions are instantly applied

#### **Step 3: Fine-Tune (Optional)**
- After applying a role, you can still adjust individual permissions
- Roles are starting points, not restrictions

### Creating Custom Roles:

**Via API** (UI coming soon):
```typescript
POST /api/team/permission-templates
{
  "name": "Junior Designer",
  "description": "Can upload media and comment, but cannot publish",
  "permissions": {
    "content_engine": {
      "access": true,
      "upload_media": true,
      "comment": true,
      "create": false,
      "publish": false
    }
  }
}
```

---

## 📋 Permission Structure

Each role contains permissions for these features:

### **Brand Engine**
- `access` - Can access brand engine
- `chat` - Can chat with Brand AI
- `edit_variables` - Can edit brand variables

### **Content Engine**
- `access` - Can access content engine
- `create` - Create new content
- `edit` - Edit own content
- `edit_others` - Edit others' content
- `delete` - Delete content
- `upload_media` - Upload media assets
- `request_approval` - Send for review
- `approve` - Approve content
- `reject` - Reject content
- `request_revision` - Request revisions
- `schedule` - Schedule posts
- `change_schedule` - Change schedules
- `publish` - Publish content
- `comment` - Add comments
- `mention` - Mention users
- `view_analytics` - View analytics
- `view_revisions` - View revision history
- `revert` - Revert to previous versions

### **Pipeline**
- `access` - Can access pipeline
- `manage_contacts` - Manage contacts
- `send_emails` - Send emails

---

## 🎯 Best Practices

### **1. Start with System Roles**
- System roles cover 90% of use cases
- Proven permission combinations
- Regularly updated

### **2. Create Custom Roles Sparingly**
- Only create custom roles for recurring unique needs
- Keep names clear and descriptive
- Document what each custom role is for

### **3. Regular Permission Audits**
- Review who has what access quarterly
- Remove unnecessary permissions
- Update roles as responsibilities evolve

### **4. Use Principle of Least Privilege**
- Grant minimum permissions needed
- Escalate only when necessary
- Viewer role for stakeholders who just need visibility

---

## 🔐 Security Features

1. **System Roles are Immutable**
   - Cannot be edited or deleted
   - Prevents accidental permission drift
   - Only SkaleFlow can update system roles

2. **Organization Scoping**
   - Custom roles are org-specific
   - No cross-org role sharing
   - Admin-only role management

3. **Audit Trail**
   - `team_role_assignments` tracks all applications
   - See who applied what role when
   - Compliance-ready

4. **Permission Inheritance**
   - Roles don't override workspace roles
   - Workspace admins always have full control
   - Roles only affect feature-level permissions

---

## 🚀 Quick Start

### **Scenario: New Social Media Manager Joins**

**Old Way (Manual):**
1. Invite user
2. Go to Permissions tab
3. Expand their row
4. Toggle 15+ individual permissions
5. Double-check nothing was missed
6. Repeat for next hire

**New Way (Role):**
1. Invite user
2. Go to Permissions tab
3. Expand their row
4. Click "Apply Template" → "Social Media Manager"
5. Done! ✅

---

## 📊 Migration & Setup

### **Step 1: Run Migration**
```bash
# RENAME_TO_TEAM_ROLES.sql creates the tables and seeds system roles
# Run in Supabase Dashboard SQL Editor
```

### **Step 2: Verify System Roles**
```sql
SELECT name, description
FROM team_roles
WHERE is_system_role = true
ORDER BY sort_order;
```

You should see 8 system roles.

### **Step 3: Test Role Application**
1. Go to any user in Permissions tab
2. Click "Apply Template"
3. Select "Viewer"
4. Verify all permissions are read-only

---

## 🛠️ API Endpoints

### **GET** `/api/team/permission-templates`
- Fetch all available roles (system + org custom)
- Returns: `{ roles: TeamRole[] }`

### **POST** `/api/team/permission-templates`
- Create custom role (admin only)
- Body: `{ name, description, permissions }`

### **POST** `/api/team/permissions/apply-template`
- Apply role to user(s)
- Body: `{ roleId, userIds: string[], workspaceId?: string }`

---

## 💡 Future Enhancements

- [ ] UI for creating custom roles
- [ ] Role versioning
- [ ] Clone system roles to customize
- [ ] Role-based analytics (which roles are most productive)
- [ ] Bulk role application
- [ ] Role marketplace (share roles across orgs)

---

## ✅ What's Included Right Now

✅ 8 predefined system roles
✅ Role application via Permissions tab
✅ Organization custom role support
✅ API for role management
✅ Audit trail for compliance
✅ Permission structure for all features
✅ Admin-only role control
✅ Immutable system roles

---

## 📞 Support

If you need a custom system role added or have questions about permissions:
- Check existing roles first
- Create a custom role for your org
- Contact SkaleFlow support for system-wide roles

**Remember**: Team Roles are productivity tools, not security boundaries. Always review permissions after application!
