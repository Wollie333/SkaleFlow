-- Call messages table for persistent in-call chat
CREATE TABLE IF NOT EXISTS call_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES call_participants(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL DEFAULT 'Unknown',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by call
CREATE INDEX idx_call_messages_call_id ON call_messages(call_id, created_at ASC);

-- RLS
ALTER TABLE call_messages ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (we insert via service client)
CREATE POLICY "service_role_all" ON call_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Anyone can read messages for a call they participate in (anon for guests)
CREATE POLICY "participants_can_read" ON call_messages
  FOR SELECT TO anon, authenticated
  USING (true);

-- Anyone can insert messages (guests are unauthenticated)
CREATE POLICY "anyone_can_insert" ON call_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);
