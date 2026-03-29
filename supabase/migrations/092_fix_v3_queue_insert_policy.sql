-- =====================================================
-- Fix: Add missing INSERT policy for v3_generation_queue
-- This allows queue entries to be created during campaign generation
-- =====================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'v3_generation_queue' AND policyname = 'v3_queue_insert_org') THEN
    CREATE POLICY v3_queue_insert_org ON v3_generation_queue FOR INSERT WITH CHECK (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
END $$;
