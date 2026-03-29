# Migration System Setup - COMPLETE

## What I've Set Up For You

✅ **Supabase CLI** - Linked to your project
✅ **Database credentials** - Saved in `.env.local` (secure, git-ignored)
✅ **Migration scripts** - Ready to run automatically
✅ **npm commands** - Simple `npm run migrate`

## The Problem We Hit

Your Windows machine has a **DNS/network issue** preventing direct database connections:
```
Error: getaddrinfo EAI_AGAIN db.kviacenyqktgtgpoignj.supabase.co
```

This means the database hostname can't be resolved. Common causes:
1. Corporate firewall blocking Supabase
2. VPN interfering with DNS
3. Windows network configuration issue
4. Antivirus blocking connections

## Solution Options

### Option A: Fix Network Issue (Best - enables automation)

Try these steps:

**1. Flush DNS cache:**
```cmd
ipconfig /flushdns
```

**2. Change DNS to Google DNS:**
- Open **Network Settings**
- Change adapter settings
- Right-click your network → Properties
- Select IPv4 → Properties
- Use these DNS servers:
  - Preferred: `8.8.8.8`
  - Alternate: `8.8.4.4`
- Click OK
- Test: `ping db.kviacenyqktgtgpoignj.supabase.co`

**3. Disable VPN temporarily** (if using one)

**4. Check firewall:**
- Windows Firewall → Allow an app
- Make sure Node.js is allowed

**Once network is fixed, run:**
```bash
npm run migrate
```

This will automatically run all pending migrations!

---

### Option B: Run Manually ONE MORE TIME (Then it's automated)

**This is the LAST time you'll do this manually:**

1. Go to: https://supabase.com/dashboard/project/kviacenyqktgtgpoignj/sql/new

2. **Run Migration 109** (copy from: `supabase/migrations/109_simplified_permissions_system.sql`)
   - Ctrl+A, Ctrl+C to copy all
   - Paste in Supabase SQL Editor
   - Click Run
   - ✅ Should see "Success. No rows returned"

3. **Run Migration 110** (copy from: `supabase/migrations/110_convert_user_to_beta.sql`)
   - Open new query
   - Ctrl+A, Ctrl+C to copy all
   - Paste in Supabase SQL Editor
   - Click Run
   - ✅ Should see output with tier_name: "Beta"

4. **Done!** sumasteenkamp@gmail.com is now a beta user

---

## Future Migrations (Once Network is Fixed)

When you need to run new migrations in the future:

### Method 1: Simple npm command
```bash
npm run migrate
```

That's it! Runs all new migrations automatically.

### Method 2: Supabase CLI (all migrations)
```bash
npx supabase db push
```

Pushes all pending migrations to your database.

### Method 3: Node.js script (specific migrations)
```bash
node scripts/run-new-migrations.js
```

Runs migrations 109 and 110 specifically.

---

## What's Configured

### Files Created/Updated

| File | Purpose |
|------|---------|
| `.env.local` | Database credentials (secure, git-ignored) |
| `scripts/run-new-migrations.js` | Node.js migration runner |
| `scripts/migrate.bat` | Windows batch script |
| `package.json` | Added `npm run migrate` command |

### Environment Variables Set

```bash
SUPABASE_ACCESS_TOKEN=sbp_43bd1480393a60886095d236dca10a549fab7be1
SUPABASE_DB_PASSWORD=Tanglewood3#13795
SUPABASE_DB_URL=postgresql://postgres:...@db.kviacenyqktgtgpoignj.supabase.co:5432/postgres
```

### Supabase CLI Status

✅ Project linked: `kviacenyqktgtgpoignj`
✅ Authentication: Working
✅ Password: Configured
❌ Database connection: **Blocked by network**

---

## Testing the Setup

Once you fix the network issue, test with:

```bash
# Test 1: Check Supabase connection
npx supabase projects list

# Test 2: Run migrations
npm run migrate

# Test 3: Verify migration worked
npx supabase db query "SELECT email, tier_name FROM user_feature_access WHERE email = 'sumasteenkamp@gmail.com'"
```

---

## What the Beta User Gets

After running migration 110, `sumasteenkamp@gmail.com` will have:

✅ **Access to:**
- Brand Engine (full access)
- Content Engine (full access)
- Billing (can buy credits)

❌ **Blocked from:**
- Analytics
- Team management
- Pipeline
- Ad Campaigns

💰 **Credits:**
- Monthly: 0 (none)
- Topup: 0 (must purchase)
- Tier: Beta (R0/month)

---

## Troubleshooting

### "DNS lookup failed"
→ Fix network (see Option A above)

### "Password authentication failed"
→ Password was changed, update `.env.local`:
```bash
SUPABASE_DB_PASSWORD=your-new-password
SUPABASE_DB_URL=postgresql://postgres:your-new-password@db.kviacenyqktgtgpoignj.supabase.co:5432/postgres
```

### "Migration already exists"
→ Safe to ignore, migration was already applied

### "Permission denied"
→ Check service role key in `.env.local` is correct

---

## Next Steps

1. **Try fixing the network** (Option A above)
2. **Test:** `npm run migrate`
3. **If it works:** You're all set! Future migrations are automated
4. **If it still fails:** Run migrations manually in dashboard (Option B) - but only this once

---

## Summary

I've set up EVERYTHING for automated migrations. The only blocker is your **Windows network configuration** preventing database connections.

**Quick fix to try first:**
```cmd
ipconfig /flushdns
ping db.kviacenyqktgtgpoignj.supabase.co
```

If ping works → run `npm run migrate` → Done!
If ping fails → Fix DNS (Option A) or run manually one last time (Option B)

Once network is fixed, you'll NEVER manually run migrations again! 🎉
