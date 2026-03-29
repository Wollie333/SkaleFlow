# Comment System Database Schema

This document describes all the tables and columns created for the team collaboration comment system.

## Tables Created

### 1. post_comments

**Purpose:** Store comments on content posts with @mention support and threaded replies

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | `PRIMARY KEY DEFAULT gen_random_uuid()` |
| `post_id` | UUID | Reference to content post | `NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE` |
| `user_id` | UUID | Comment author | `NOT NULL REFERENCES users(id) ON DELETE CASCADE` |
| `workspace_id` | UUID | Workspace context | `NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE` |
| `organization_id` | UUID | Organization context | `NOT NULL REFERENCES organizations(id) ON DELETE CASCADE` |
| `parent_comment_id` | UUID | Parent comment for threading | `REFERENCES post_comments(id) ON DELETE CASCADE` (nullable) |
| `body` | TEXT | Comment content | `NOT NULL` |
| `mentioned_user_ids` | UUID[] | Array of @mentioned user IDs | Array type |
| `is_internal` | BOOLEAN | Internal vs external flag | `DEFAULT true` |
| `is_edited` | BOOLEAN | Whether comment was edited | `DEFAULT false` |
| `edited_at` | TIMESTAMPTZ | When comment was edited | Nullable |
| `created_at` | TIMESTAMPTZ | Creation timestamp | `NOT NULL DEFAULT NOW()` |
| `updated_at` | TIMESTAMPTZ | Last update timestamp | `NOT NULL DEFAULT NOW()` |

**Indexes:**
- `idx_post_comments_post ON post_comments(post_id, created_at)`
- `idx_post_comments_user ON post_comments(user_id)`
- `idx_post_comments_workspace ON post_comments(workspace_id)`
- `idx_post_comments_mentioned ON post_comments USING GIN(mentioned_user_ids)` - for fast @mention lookups
- `idx_post_comments_parent ON post_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL`

**RLS Policies:**
- `post_comments_workspace` - Users can see/manage comments in workspaces they're members of

**Features:**
- ✅ Threaded replies via `parent_comment_id`
- ✅ @Mentions via `mentioned_user_ids` array
- ✅ Edit tracking with `is_edited` and `edited_at`
- ✅ Workspace isolation via RLS

---

### 2. notifications (Enhanced)

**New Columns Added:**

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `workspace_id` | UUID | Workspace context | `REFERENCES workspaces(id) ON DELETE CASCADE` (nullable) |
| `comment_id` | UUID | Reference to comment | `REFERENCES post_comments(id) ON DELETE CASCADE` (nullable) |

**New Index:**
- `idx_notifications_workspace ON notifications(workspace_id, created_at DESC)`

**Purpose:** Links notifications to comments for @mention alerts

---

### 3. team_activity_log (Enhanced)

**New Columns Added for Comment Tracking:**

| Column | Type | Description |
|--------|------|-------------|
| `workspace_id` | UUID | Workspace context |
| `entity_type` | TEXT | Entity type (e.g., 'post', 'comment') |
| `entity_id` | UUID | Entity ID |
| `metadata` | JSONB | Additional data (comment_id, mentions, etc.) |

**Comment-Related Actions Logged:**
- `comment_added` - New comment created
- `comment_edited` - Comment modified
- `comment_deleted` - Comment removed
- `mention_created` - User @mentioned in comment

---

## Comment Workflow

### Creating a Comment

```sql
INSERT INTO post_comments (
  post_id,
  user_id,
  workspace_id,
  organization_id,
  body,
  mentioned_user_ids
) VALUES (
  'post-uuid',
  'user-uuid',
  'workspace-uuid',
  'org-uuid',
  'Great work! @john please review',
  ARRAY['john-uuid']
);
```

### Threading Replies

```sql
-- Reply to a comment
INSERT INTO post_comments (
  post_id,
  user_id,
  workspace_id,
  organization_id,
  parent_comment_id,  -- Links to parent
  body
) VALUES (
  'post-uuid',
  'user-uuid',
  'workspace-uuid',
  'org-uuid',
  'parent-comment-uuid',
  'Thanks for the feedback!'
);
```

### Querying Comments with Replies

```sql
-- Get all comments for a post with user info
SELECT
  c.*,
  u.full_name,
  u.avatar_url
FROM post_comments c
JOIN users u ON u.id = c.user_id
WHERE c.post_id = 'post-uuid'
ORDER BY c.created_at ASC;

-- Get reply count
SELECT
  parent_comment_id,
  COUNT(*) as reply_count
FROM post_comments
WHERE parent_comment_id IS NOT NULL
GROUP BY parent_comment_id;
```

### Finding @Mentions

```sql
-- Get all comments where user was mentioned
SELECT c.*
FROM post_comments c
WHERE 'user-uuid' = ANY(c.mentioned_user_ids);
```

---

## API Endpoints (To Be Created)

- `GET /api/content/posts/[postId]/comments` - Fetch all comments
- `POST /api/content/posts/[postId]/comments` - Create comment
- `PATCH /api/content/posts/[postId]/comments/[commentId]` - Edit comment
- `DELETE /api/content/posts/[postId]/comments/[commentId]` - Delete comment

---

## Security (RLS)

All comments are protected by Row-Level Security:
- Users can only see comments in workspaces they're members of
- Comments cascade delete when posts are removed
- Workspace admins can moderate all comments

---

## Migration Status

✅ **Migration 107** successfully created all comment tables
✅ Tables are live in your Supabase database
✅ RLS policies are active
✅ Indexes are optimized for performance
