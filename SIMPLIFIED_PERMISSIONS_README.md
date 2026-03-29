# Simplified Permission System - Setup & Usage Guide

## Overview

Your permission system has been **completely simplified**. No more confusion with 4 layers of roles and permissions!

## New System (3 Simple Layers)

### 1. User Role (System-wide)
- **super_admin** - You (bypasses everything)
- **user** - Everyone else

### 2. Subscription Tier (What features you get)
- **Beta** - R0/month, 0 credits, Brand + Content only
- **Foundation** - R2,999/month, 15k credits, + Analytics
- **Momentum** - R4,999/month, 35k credits, + Pipeline + Ads
- **Authority** - R7,999/month, 75k credits, + Team features

### 3. Org Role (What you can do)
- **owner** - Full access to allowed features
- **admin** - Full access to allowed features
- **member** - View-only (only on Authority tier)

## Features

1. **brand_engine** - Brand Engine
2. **content_engine** - Content Engine
3. **analytics** - Analytics dashboard
4. **team** - Team management (Authority tier only)
5. **pipeline** - Pipeline/CRM
6. **ad_campaigns** - Ad campaigns

## Setup Instructions

### Step 1: Run the Database Migration

In Supabase SQL Editor, run:

```bash
# Copy the migration file to Supabase
supabase/migrations/109_simplified_permissions_system.sql
```

Or manually paste the contents into Supabase SQL Editor and execute.

This migration:
- ✅ Creates Beta tier
- ✅ Updates all tiers with proper feature definitions
- ✅ Creates helper functions (create_beta_user, upgrade_user_tier, check_feature_access)
- ✅ Creates user_feature_access view for easy monitoring

### Step 2: Create Your First Beta User

In Supabase SQL Editor, run:

```sql
SELECT * FROM create_beta_user(
  'sumasteenkamp@gmail.com',
  'Suma Steenkamp'
);
```

See `SETUP_BETA_USER.sql` for complete verification steps.

### Step 3: Update API Routes (Progressive)

You don't need to update all routes at once. Update them progressively as needed.

**See `API_ROUTE_PROTECTION_GUIDE.md` for detailed examples.**

Simple pattern:
```typescript
import { requireFeatureAccess } from '@/lib/feature-gates';

// In your route handler:
try {
  await requireFeatureAccess(userId, orgId, 'brand_engine');
  // User has access, continue...
} catch (error: any) {
  return NextResponse.json({ error: error.message }, { status: 403 });
}
```

### Step 4: Test the System

1. **Login as beta user** (sumasteenkamp@gmail.com)
2. **Verify sidebar** shows:
   - ✅ Dashboard
   - ✅ Brand Engine
   - ✅ Content Engine
   - ❌ Analytics (hidden)
   - ❌ Team (hidden)
   - ✅ Billing (visible to buy credits)
3. **Verify badge** shows "BETA" tier in purple
4. **Try accessing** /analytics → should get 402 Payment Required
5. **Purchase credits** via Billing page → should work

## Managing Beta Users

### Create a Beta User

```sql
SELECT * FROM create_beta_user('email@example.com', 'Full Name');
```

### List All Beta Users

```sql
SELECT * FROM user_feature_access WHERE tier_slug = 'beta';
```

or via API (as super_admin):

```bash
GET /api/admin/beta-users
```

### Grant Test Credits (Optional)

```sql
UPDATE credit_balances
SET topup_credits_remaining = 1000
WHERE organization_id = (
  SELECT organization_id FROM users u
  JOIN org_members om ON om.user_id = u.id
  WHERE u.email = 'email@example.com'
);
```

### Upgrade a Beta User to Paid Tier

```sql
SELECT * FROM upgrade_user_tier('email@example.com', 'foundation');
```

or via API (as super_admin):

```bash
POST /api/admin/upgrade-tier
{
  "email": "email@example.com",
  "tierSlug": "foundation"
}
```

## API Endpoints

### For Super Admins

**Create Beta User:**
```bash
POST /api/admin/beta-users
{
  "email": "email@example.com",
  "fullName": "Full Name"
}
```

**List Beta Users:**
```bash
GET /api/admin/beta-users
```

**Upgrade Tier:**
```bash
POST /api/admin/upgrade-tier
{
  "email": "email@example.com",
  "tierSlug": "foundation"
}
```

### For All Users

**Check Your Feature Access:**
```bash
GET /api/feature-access
```

Returns:
```json
{
  "features": {
    "brand_engine": true,
    "content_engine": true,
    "analytics": false,
    "team": false,
    "pipeline": false,
    "ad_campaigns": false
  },
  "tier": {
    "name": "Beta",
    "slug": "beta",
    "monthlyCredits": 0
  }
}
```

## Client-Side Usage

### Check Feature Access in Components

```typescript
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

function MyComponent() {
  const { features, tier, loading } = useFeatureAccess();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {features?.analytics && <AnalyticsSection />}
      {features?.team && <TeamSection />}
      {tier?.slug === 'beta' && <UpgradeBanner />}
    </div>
  );
}
```

### Check Specific Feature

```typescript
import { useHasFeature } from '@/hooks/useFeatureAccess';

function AnalyticsPage() {
  const { hasAccess, loading } = useHasFeature('analytics');

  if (loading) return <div>Loading...</div>;
  if (!hasAccess) return <UpgradePrompt feature="analytics" />;

  return <AnalyticsContent />;
}
```

## Monitoring

### View All Users & Their Access

```sql
SELECT * FROM user_feature_access ORDER BY email;
```

### Check Specific User's Access

```sql
SELECT * FROM user_feature_access
WHERE email = 'email@example.com';
```

### Test Feature Access

```sql
SELECT * FROM check_feature_access(
  '<user-id>'::UUID,
  '<org-id>'::UUID,
  'brand_engine'
);
```

## Key Files

| File | Purpose |
|------|---------|
| `supabase/migrations/109_simplified_permissions_system.sql` | Database migration |
| `lib/feature-gates.ts` | Permission checking logic |
| `hooks/useFeatureAccess.ts` | React hooks for client-side |
| `app/api/feature-access/route.ts` | Feature access API |
| `app/api/admin/beta-users/route.ts` | Beta user management |
| `components/layout/sidebar.tsx` | Updated to use new system |
| `SETUP_BETA_USER.sql` | Script to create beta user |
| `API_ROUTE_PROTECTION_GUIDE.md` | Guide for protecting routes |

## Beta User Specifics

Beta users get:
- ✅ Brand Engine (full access)
- ✅ Content Engine (full access)
- ✅ Billing (can buy credits)
- ❌ Analytics (blocked)
- ❌ Team management (blocked)
- ❌ Pipeline (blocked)
- ❌ Ad Campaigns (blocked)
- 💰 0 monthly credits (must purchase)
- 💰 Can buy topup credit packs

## Upgrading Beta to Paid

When a beta user wants to convert:

1. **Via SQL:**
   ```sql
   SELECT * FROM upgrade_user_tier('email@example.com', 'foundation');
   ```

2. **Via API (as super_admin):**
   ```bash
   POST /api/admin/upgrade-tier
   {
     "email": "email@example.com",
     "tierSlug": "foundation"
   }
   ```

This automatically:
- ✅ Changes subscription tier
- ✅ Grants monthly credits
- ✅ Unlocks tier features
- ✅ Preserves existing topup credits

## Troubleshooting

### Beta user can see features they shouldn't

1. Check tier assignment:
   ```sql
   SELECT * FROM user_feature_access WHERE email = 'email@example.com';
   ```

2. Verify subscription is active:
   ```sql
   SELECT * FROM subscriptions WHERE organization_id = '<org-id>';
   ```

3. Clear browser cache / hard refresh

### Feature access check failing

1. Verify migration ran:
   ```sql
   SELECT * FROM subscription_tiers WHERE slug = 'beta';
   ```

2. Check function exists:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'check_feature_access';
   ```

3. Test directly in SQL:
   ```sql
   SELECT * FROM check_feature_access('<user-id>', '<org-id>', 'brand_engine');
   ```

## Next Steps

1. ✅ Run migration: `109_simplified_permissions_system.sql`
2. ✅ Create beta user: `sumasteenkamp@gmail.com`
3. ✅ Test login and verify feature access
4. ✅ (Optional) Grant test credits for testing
5. 📝 Progressively update API routes to use new system
6. 📝 Create upgrade prompts for blocked features
7. 📝 Add analytics to track upgrade intent

## Support

For questions or issues:
1. Check this README
2. Check `API_ROUTE_PROTECTION_GUIDE.md`
3. Check `SIMPLIFIED_PERMISSIONS_DESIGN.md`
4. Test feature access using SQL functions
5. Review Supabase logs for errors
