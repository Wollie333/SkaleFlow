-- Fix brand_audits.created_by FK to reference public.users instead of auth.users
-- PostgREST cannot resolve joins through auth.users, causing API queries to fail
ALTER TABLE brand_audits DROP CONSTRAINT brand_audits_created_by_fkey;
ALTER TABLE brand_audits ADD CONSTRAINT brand_audits_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(id);
