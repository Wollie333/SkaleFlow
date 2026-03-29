# Quick Start Guide - Set Up Beta Users NOW

## What I've Built For You

✅ **Simplified permission system** - 3 layers instead of 4 messy ones
✅ **Beta tier** - 0 credits, Brand + Content only
✅ **Database functions** - Easy user management
✅ **API endpoints** - Manage beta users
✅ **React hooks** - Check feature access in UI
✅ **Updated sidebar** - Hides features based on tier

## Do This NOW (5 Minutes)

### Step 1: Run the Database Migration

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Open this file: `supabase/migrations/109_simplified_permissions_system.sql`
4. Copy ALL the SQL code
5. Paste into Supabase SQL Editor
6. Click "Run" (or press Ctrl+Enter)
7. ✅ Should see success message

### Step 2: Create Beta User (sumasteenkamp@gmail.com)

Still in Supabase SQL Editor:

1. Copy this SQL:
```sql
SELECT * FROM create_beta_user(
  'sumasteenkamp@gmail.com',
  'Suma Steenkamp'
);
```

2. Paste and Run
3. ✅ Should see output with user_id and org_id

### Step 3: Verify It Worked

Copy and paste this verification SQL:

```sql
-- Check user and tier
SELECT
  u.email,
  u.full_name,
  o.name AS org_name,
  st.name AS tier_name,
  st.slug AS tier_slug,
  cb.monthly_credits_remaining,
  cb.topup_credits_remaining
FROM users u
JOIN org_members om ON om.user_id = u.id
JOIN organizations o ON o.id = om.organization_id
JOIN subscriptions s ON s.organization_id = o.id
JOIN subscription_tiers st ON st.id = s.tier_id
JOIN credit_balances cb ON cb.organization_id = o.id
WHERE u.email = 'sumasteenkamp@gmail.com';
```

Expected output:
- ✅ Tier: "Beta"
- ✅ Monthly credits: 0
- ✅ Topup credits: 0

### Step 4: (Optional) Give Test Credits

If you want to give them credits to test with:

```sql
UPDATE credit_balances
SET topup_credits_remaining = 1000
WHERE organization_id = (
  SELECT om.organization_id
  FROM users u
  JOIN org_members om ON om.user_id = u.id
  WHERE u.email = 'sumasteenkamp@gmail.com'
);
```

### Step 5: Test Login

1. Have the user login at your app URL
2. Check the sidebar - should show:
   - ✅ Dashboard
   - ✅ Brand Engine
   - ✅ Content Engine
   - ✅ Billing
   - ❌ Analytics (hidden)
   - ❌ Team (hidden)
   - ✅ Badge shows "BETA" in purple

### Step 6: Create More Beta Users

To create another beta user, just run:

```sql
SELECT * FROM create_beta_user(
  'another@email.com',
  'Their Full Name'
);
```

## How to Manage Beta Users

### List All Beta Users

```sql
SELECT
  email,
  full_name,
  organization_name,
  tier_name,
  total_credits
FROM user_feature_access
WHERE tier_slug = 'beta'
ORDER BY email;
```

### Upgrade a Beta User to Paid

When they're ready to pay:

```sql
SELECT * FROM upgrade_user_tier(
  'email@example.com',
  'foundation'  -- or 'momentum' or 'authority'
);
```

This automatically:
- Changes their tier
- Gives them monthly credits
- Unlocks new features
- Keeps their purchased topup credits

### Give a User Credits

```sql
UPDATE credit_balances
SET topup_credits_remaining = topup_credits_remaining + 5000
WHERE organization_id = (
  SELECT om.organization_id
  FROM users u
  JOIN org_members om ON om.user_id = u.id
  WHERE u.email = 'email@example.com'
);
```

## Current Feature Access by Tier

| Feature | Beta | Foundation | Momentum | Authority |
|---------|------|------------|----------|-----------|
| Brand Engine | ✅ | ✅ | ✅ | ✅ |
| Content Engine | ✅ | ✅ | ✅ | ✅ |
| Analytics | ❌ | ✅ | ✅ | ✅ |
| Team | ❌ | ❌ | ❌ | ✅ |
| Pipeline | ❌ | ❌ | ✅ | ✅ |
| Ad Campaigns | ❌ | ❌ | ✅ | ✅ |
| Monthly Credits | 0 | 15,000 | 35,000 | 75,000 |
| Price/Month | R0 | R2,999 | R4,999 | R7,999 |

## Files You Need to Know About

| File | What It Is |
|------|------------|
| `SIMPLIFIED_PERMISSIONS_README.md` | **Full documentation** |
| `supabase/migrations/109_simplified_permissions_system.sql` | **Database migration** (RUN THIS FIRST) |
| `SETUP_BETA_USER.sql` | SQL commands to create beta users |
| `API_ROUTE_PROTECTION_GUIDE.md` | How to protect API routes (for later) |
| `lib/feature-gates.ts` | Permission checking code |
| `hooks/useFeatureAccess.ts` | React hooks for UI |

## What's Next?

1. ✅ Run migration
2. ✅ Create beta users
3. ✅ Test that it works
4. 📋 (Later) Update API routes to enforce tier limits
5. 📋 (Later) Add upgrade prompts in UI

## Need to Add More Beta Users?

Just run:
```sql
SELECT * FROM create_beta_user('email@example.com', 'Full Name');
```

Done!

## Troubleshooting

**"Function create_beta_user does not exist"**
→ Run the migration file first: `109_simplified_permissions_system.sql`

**"User already exists"**
→ The user is already in the system. Check their tier:
```sql
SELECT * FROM user_feature_access WHERE email = 'email@example.com';
```

**Beta user can see Analytics/Team/etc**
→ Hard refresh the browser (Ctrl+Shift+R) or check tier assignment

**Credits not working**
→ Verify credit balance:
```sql
SELECT * FROM credit_balances WHERE organization_id = '<org-id>';
```

## Questions?

Read: `SIMPLIFIED_PERMISSIONS_README.md` for full documentation.
