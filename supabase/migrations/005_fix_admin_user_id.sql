-- FIX: Align users table ID with Supabase Auth user ID
-- Run this in Supabase SQL Editor to fix the UUID mismatch
--
-- Problem: Migration 002 created users.id with gen_random_uuid() which
-- doesn't match the auth.users.id. RLS policies check auth.uid() = users.id,
-- so all queries fail silently.

DO $$
DECLARE
  auth_uid UUID;
  old_uid UUID;
BEGIN
  -- Get the auth user ID
  SELECT id INTO auth_uid FROM auth.users WHERE email = 'wollie@manamarketing.co.za';

  -- Get the old users table ID
  SELECT id INTO old_uid FROM public.users WHERE email = 'wollie@manamarketing.co.za';

  IF auth_uid IS NULL THEN
    RAISE EXCEPTION 'No auth user found for wollie@manamarketing.co.za. Create the auth user first in Supabase Dashboard > Authentication > Users.';
  END IF;

  IF old_uid IS NULL THEN
    -- No users record exists — create it fresh
    INSERT INTO public.users (id, email, full_name, role, email_verified, onboarding_completed, approved)
    VALUES (auth_uid, 'wollie@manamarketing.co.za', 'Wollie Steenkamp', 'super_admin', true, true, true);
    RAISE NOTICE 'Created new users record with auth ID: %', auth_uid;

  ELSIF old_uid = auth_uid THEN
    -- IDs already match — just ensure role and approved are correct
    UPDATE public.users SET role = 'super_admin', approved = true WHERE id = auth_uid;
    RAISE NOTICE 'IDs already match. Updated role to super_admin.';

  ELSE
    -- IDs don't match — fix by creating new record, moving FKs, deleting old
    RAISE NOTICE 'Fixing ID mismatch: old=%, new=%', old_uid, auth_uid;

    -- Step 1: Temporarily rename old email to avoid unique constraint
    UPDATE public.users SET email = 'temp-migrate-' || old_uid::text WHERE id = old_uid;

    -- Step 2: Insert new users record with the correct auth UID
    INSERT INTO public.users (id, email, full_name, role, email_verified, onboarding_completed, approved, created_at, updated_at)
    SELECT auth_uid, 'wollie@manamarketing.co.za', full_name, 'super_admin', true, true, true, created_at, NOW()
    FROM public.users WHERE id = old_uid;

    -- Step 3: Update all foreign key references to point to new ID
    UPDATE public.org_members SET user_id = auth_uid WHERE user_id = old_uid;
    UPDATE public.organizations SET owner_id = auth_uid WHERE owner_id = old_uid;
    UPDATE public.brand_phases SET locked_by = auth_uid WHERE locked_by = old_uid;
    UPDATE public.brand_conversations SET user_id = auth_uid WHERE user_id = old_uid;
    UPDATE public.content_items SET assigned_to = auth_uid WHERE assigned_to = old_uid;
    UPDATE public.content_items SET approved_by = auth_uid WHERE approved_by = old_uid;
    UPDATE public.ai_usage SET user_id = auth_uid WHERE user_id = old_uid;
    UPDATE public.invitations SET invited_by = auth_uid WHERE invited_by = old_uid;
    UPDATE public.brand_playbooks SET generated_by = auth_uid WHERE generated_by = old_uid;

    -- Step 4: Delete the old orphaned record (nothing references it now)
    DELETE FROM public.users WHERE id = old_uid;

    RAISE NOTICE 'Fixed! All references migrated to auth ID: %', auth_uid;
  END IF;

  -- Ensure organization exists and user is linked
  IF NOT EXISTS (
    SELECT 1 FROM public.organizations o
    JOIN public.org_members om ON om.organization_id = o.id
    WHERE om.user_id = auth_uid
  ) THEN
    -- Create org if missing
    INSERT INTO public.organizations (name, slug, owner_id)
    VALUES ('Mana', 'mana', auth_uid)
    ON CONFLICT (slug) DO UPDATE SET owner_id = auth_uid;

    -- Link user to org
    INSERT INTO public.org_members (organization_id, user_id, role)
    SELECT o.id, auth_uid, 'owner'
    FROM public.organizations o WHERE o.slug = 'mana'
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    RAISE NOTICE 'Created/linked organization for user.';
  END IF;

  -- Ensure brand_phases exist for the organization
  IF NOT EXISTS (
    SELECT 1 FROM public.brand_phases bp
    JOIN public.org_members om ON om.organization_id = bp.organization_id
    WHERE om.user_id = auth_uid
  ) THEN
    RAISE NOTICE 'No brand phases found. They should auto-create via trigger when a new organization is inserted.';
  END IF;

  RAISE NOTICE 'Done! Auth UID: %', auth_uid;
END $$;
