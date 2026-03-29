# SIMPLIFIED PERMISSION SYSTEM

## Design Philosophy
**One tier, one truth.** Your subscription tier determines what features you get. Simple.

## 3-Layer System (Down from 4)

### Layer 1: User Role (System-wide)
- `super_admin` - Bypasses all gates (for you/admin team)
- `user` - Everyone else

### Layer 2: Subscription Tier (Org-level) - **THE MAIN GATE**
Determines WHAT features the organization has access to.

**BETA TIER** (New)
- Cost: R0/month
- Monthly Credits: 0
- Features: `brand_engine`, `content_engine` only
- Use case: Beta testers, must buy credits

**FOUNDATION TIER**
- Cost: R2,999/month
- Monthly Credits: 15,000
- Features: `brand_engine`, `content_engine`, `analytics`

**MOMENTUM TIER**
- Cost: R4,999/month
- Monthly Credits: 35,000
- Features: `brand_engine`, `content_engine`, `analytics`, `pipeline`, `ad_campaigns`

**AUTHORITY TIER**
- Cost: R7,999/month
- Monthly Credits: 75,000
- Features: Everything including `team` (multi-user)

### Layer 3: Org Role (What you can DO)
Determines your capabilities WITHIN allowed features.

- `owner` - Full control of all allowed features
- `admin` - Full control of all allowed features
- `member` - View-only or limited (only on Authority tier with team feature)

## Feature List

1. **brand_engine** - Brand Engine (chat, edit variables)
2. **content_engine** - Content Engine (create, edit, schedule posts)
3. **analytics** - Analytics dashboard
4. **team** - Team management (invite members, permissions)
5. **pipeline** - Pipeline/CRM features
6. **ad_campaigns** - Ad campaign management

## Permission Check Flow

```
User requests to access a feature
  ↓
Is user super_admin?
  ↓ YES → ALLOW
  ↓ NO
Does user's org tier include this feature?
  ↓ NO → DENY (show upgrade prompt)
  ↓ YES
What is user's org role?
  ↓ owner/admin → ALLOW full access
  ↓ member → ALLOW limited access (if tier supports team)
```

## One Function to Rule Them All

```typescript
canAccessFeature(userId, orgId, feature, requireAdmin = false)
```

Returns: `{ allowed: boolean, reason?: string, tier?: string }`

## Removed Complexity

**REMOVED:**
- ❌ Workspace roles (overkill for current needs)
- ❌ Granular team_permissions table (too complex)
- ❌ 4-layer permission checks
- ❌ Viewer role (just use member)

**KEPT:**
- ✅ Super admin bypass
- ✅ Subscription tiers
- ✅ Org roles (owner/admin/member)
- ✅ Credit system

## Managing Beta Users

**Simple SQL function:**
```sql
SELECT create_beta_user('email@example.com', 'Full Name');
```

This creates:
1. User account
2. Organization
3. Beta tier subscription (0 credits)
4. Owner role

**That's it.** Clean and simple.
