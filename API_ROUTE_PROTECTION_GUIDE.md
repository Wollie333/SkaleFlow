# API Route Protection Guide

## How to Protect API Routes with New Permission System

The new simplified permission system makes it easy to gate API routes based on subscription tiers.

## Step 1: Import the Feature Gate

```typescript
import { requireFeatureAccess, canAccessFeature } from '@/lib/feature-gates';
import type { Feature } from '@/lib/feature-gates';
```

## Step 2: Get User & Org Info

```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Get user's org
const { data: membership } = await supabase
  .from('org_members')
  .select('organization_id')
  .eq('user_id', user.id)
  .single();

if (!membership) {
  return NextResponse.json({ error: 'No organization found' }, { status: 403 });
}
```

## Step 3: Check Feature Access

### Option A: requireFeatureAccess (Throws Error)

Use this for simple protection - it throws an error if access is denied.

```typescript
try {
  await requireFeatureAccess(
    user.id,
    membership.organization_id,
    'brand_engine', // feature name
    false // set to true if only owner/admin should access
  );

  // User has access, continue with route logic...

} catch (error: any) {
  if (error.requiresUpgrade) {
    return NextResponse.json(
      {
        error: error.message,
        requiresUpgrade: true,
        tier: error.tier,
      },
      { status: 402 } // Payment Required
    );
  }

  return NextResponse.json(
    { error: error.message },
    { status: 403 }
  );
}
```

### Option B: canAccessFeature (Returns Result)

Use this when you need more control over the response.

```typescript
const access = await canAccessFeature(
  user.id,
  membership.organization_id,
  'content_engine'
);

if (!access.allowed) {
  return NextResponse.json(
    {
      error: access.reason,
      requiresUpgrade: access.requiresUpgrade,
      tier: access.tier,
    },
    { status: access.requiresUpgrade ? 402 : 403 }
  );
}

// User has access, continue...
```

## Available Features

```typescript
type Feature =
  | 'brand_engine'      // Brand Engine
  | 'content_engine'    // Content Engine
  | 'analytics'         // Analytics
  | 'team'              // Team management
  | 'pipeline'          // Pipeline/CRM
  | 'ad_campaigns';     // Ad campaigns
```

## Complete Example

```typescript
// app/api/brand/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireFeatureAccess } from '@/lib/feature-gates';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get user's org
    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 });
    }

    // 3. Check feature access (throws if denied)
    try {
      await requireFeatureAccess(
        user.id,
        membership.organization_id,
        'brand_engine'
      );
    } catch (error: any) {
      return NextResponse.json(
        {
          error: error.message || 'Access denied',
          requiresUpgrade: error.requiresUpgrade,
          tier: error.tier,
        },
        { status: error.requiresUpgrade ? 402 : 403 }
      );
    }

    // 4. Feature access granted - continue with route logic
    const body = await req.json();

    // ... your route logic here ...

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Routes to Update

Update all these route files to use the new permission system:

### Brand Engine Routes
- `app/api/brand/chat/route.ts` → `brand_engine`
- `app/api/brand/variables/route.ts` → `brand_engine`

### Content Engine Routes
- `app/api/content/campaigns/route.ts` → `content_engine`
- `app/api/content/campaigns/[id]/route.ts` → `content_engine`
- `app/api/content/campaigns/[id]/generate/route.ts` → `content_engine`
- `app/api/content/campaigns/[id]/posts/[postId]/route.ts` → `content_engine`

### Analytics Routes
- `app/api/analytics/route.ts` → `analytics`
- `app/api/content/analytics/route.ts` → `analytics`

### Team Routes
- `app/api/team/route.ts` → `team`
- `app/api/team/permissions/route.ts` → `team` + requireAdmin = true
- `app/api/team/bulk-invite/route.ts` → `team` + requireAdmin = true

### Pipeline Routes
- `app/api/pipeline/route.ts` → `pipeline`

### Ad Campaign Routes
- `app/api/marketing/campaigns/route.ts` → `ad_campaigns`

## Error Responses

### 401 Unauthorized
User not logged in.

### 402 Payment Required
Feature not included in tier - user needs to upgrade.

```json
{
  "error": "Feature not included in Beta tier",
  "requiresUpgrade": true,
  "tier": "Beta"
}
```

### 403 Forbidden
User doesn't have permission (not an admin, not a member, etc.)

```json
{
  "error": "Admin access required"
}
```

## Testing

1. Create a beta user
2. Try accessing different features
3. Verify beta users can only access Brand + Content
4. Verify upgrade prompts appear for blocked features
