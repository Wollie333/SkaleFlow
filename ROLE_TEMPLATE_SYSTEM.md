# SkaleFlow Role Template System

## Overview

The Role Template System allows you to create and manage reusable permission configurations for common team roles. Instead of manually setting permissions for each user, you can apply predefined role templates.

---

## ✅ What You Can Do

### 1. **Use Predefined System Templates**
8 built-in role templates ready to use:

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **Social Media Manager** | Full content creation & publishing | Create, edit, upload media, schedule, publish, view analytics |
| **Content Creator** | Create content, request approvals | Create, edit own content, upload media, request approval |
| **Content Strategist** | Review & approve content | Edit all content, approve/reject, request revisions, view analytics |
| **Brand Manager** | Full brand & content control | Everything including brand variables |
| **Copywriter** | Text-only content creation | Create, edit copy, request approval (no media) |
| **Graphic Designer** | Media management only | Upload & manage media assets |
| **Viewer** | Read-only access | View content & brand assets |
| **Community Manager** | Content + community engagement | Full content access + pipeline for contacts |

### 2. **Create Custom Role Templates**
- Organization admins can create custom templates
- Define unique permission combinations
- Reuse across multiple team members

### 3. **Quick Apply to Team Members**
- Select a user in the Permissions tab
- Click "Apply Template"
- Choose a role template
- All permissions instantly applied

---

## 🗂️ Database Structure

### Main Table: `permission_templates`
```sql
CREATE TABLE permission_templates (
  id UUID PRIMARY KEY,
  organization_id UUID,  -- NULL for system templates
  name TEXT NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL,  -- Full permission structure
  is_system_template BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0
);
```

### Tracking Table: `permission_template_assignments`
- Tracks which templates were applied to which users
- Stores snapshot of permissions at application time
- Audit trail for compliance

---

## 🔧 How to Use

### For Org Admins:

#### **Step 1: Navigate to Permissions**
1. Go to "My Team" → "Permissions" tab
2. Expand a team member's row
3. You'll see "Apply Template" button

#### **Step 2: Apply a Template**
1. Click "Apply Template"
2. Browse system templates or your custom templates
3. Select the role that matches the user's responsibilities
4. Permissions are instantly applied

#### **Step 3: Fine-Tune (Optional)**
- After applying a template, you can still adjust individual permissions
- Templates are starting points, not restrictions

### Creating Custom Templates:

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

Each template contains permissions for these features:

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

### **1. Start with System Templates**
- System templates cover 90% of use cases
- Proven permission combinations
- Regularly updated

### **2. Create Custom Templates Sparingly**
- Only create custom templates for recurring unique roles
- Keep names clear and descriptive
- Document what each custom role is for

### **3. Regular Permission Audits**
- Review who has what access quarterly
- Remove unnecessary permissions
- Update templates as roles evolve

### **4. Use Principle of Least Privilege**
- Grant minimum permissions needed
- Escalate only when necessary
- Viewer role for stakeholders who just need visibility

---

## 🔐 Security Features

1. **System Templates are Immutable**
   - Cannot be edited or deleted
   - Prevents accidental permission drift
   - Only SkaleFlow can update system templates

2. **Organization Scoping**
   - Custom templates are org-specific
   - No cross-org template sharing
   - Admin-only template management

3. **Audit Trail**
   - `permission_template_assignments` tracks all applications
   - See who applied what template when
   - Compliance-ready

4. **Permission Inheritance**
   - Templates don't override workspace roles
   - Workspace admins always have full control
   - Templates only affect feature-level permissions

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

**New Way (Template):**
1. Invite user
2. Go to Permissions tab
3. Expand their row
4. Click "Apply Template" → "Social Media Manager"
5. Done! ✅

---

## 📊 Migration & Setup

### **Step 1: Run Migration**
```bash
# Migration 108 creates the tables and seeds system templates
# Run this once:
npm run supabase:migrate
```

### **Step 2: Verify System Templates**
```sql
SELECT name, description
FROM permission_templates
WHERE is_system_template = true
ORDER BY sort_order;
```

You should see 8 system templates.

### **Step 3: Test Template Application**
1. Go to any user in Permissions tab
2. Click "Apply Template"
3. Select "Viewer"
4. Verify all permissions are read-only

---

## 🛠️ API Endpoints

### **GET** `/api/team/permission-templates`
- Fetch all available templates (system + org custom)
- Returns: `{ templates: PermissionTemplate[] }`

### **POST** `/api/team/permission-templates`
- Create custom template (admin only)
- Body: `{ name, description, permissions }`

### **POST** `/api/team/permissions/apply-template`
- Apply template to user(s)
- Body: `{ templateId, userIds: string[] }`

---

## 💡 Future Enhancements

- [ ] UI for creating custom templates
- [ ] Template versioning
- [ ] Clone system templates to customize
- [ ] Role-based analytics (which roles are most productive)
- [ ] Bulk template application
- [ ] Template marketplace (share templates across orgs)

---

## ✅ What's Included Right Now

✅ 8 predefined system role templates
✅ Template application via Permissions tab
✅ Organization custom template support
✅ API for template management
✅ Audit trail for compliance
✅ Permission structure for all features
✅ Admin-only template control
✅ Immutable system templates

---

## 📞 Support

If you need a custom system template added or have questions about permissions:
- Check existing templates first
- Create a custom template for your org
- Contact SkaleFlow support for system-wide templates

**Remember**: Role templates are productivity tools, not security boundaries. Always review permissions after application!
