CREATE TABLE embarksmv2.super_agent_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES embarksmv2.accounts(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  onboarding_stage text DEFAULT 'welcome',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (account_id, user_id)
);

ALTER TABLE embarksmv2.super_agent_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage super_agent_conversations"
  ON embarksmv2.super_agent_conversations FOR ALL TO public USING (true) WITH CHECK (true);