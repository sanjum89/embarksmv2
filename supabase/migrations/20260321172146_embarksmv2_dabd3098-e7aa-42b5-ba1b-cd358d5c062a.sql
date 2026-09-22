
-- Create nudge_cards table
CREATE TABLE embarksmv2.nudge_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES embarksmv2.accounts(id) ON DELETE CASCADE NOT NULL,
  target_user_id text NOT NULL,
  created_by text NOT NULL DEFAULT 'system',
  type text NOT NULL CHECK (type IN ('kudos', 'meeting', 'learning_activity', 'reflection_request')),
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  color_theme text NOT NULL DEFAULT 'blue' CHECK (color_theme IN ('blue', 'emerald', 'amber', 'violet', 'rose')),
  cta_label text NOT NULL DEFAULT 'View',
  cta_action jsonb NOT NULL DEFAULT '{}',
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  metadata jsonb DEFAULT '{}',
  viewed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE embarksmv2.nudge_cards ENABLE ROW LEVEL SECURITY;

-- Public read/write for demo (no auth)
CREATE POLICY "Anyone can read nudge_cards"
  ON embarksmv2.nudge_cards FOR SELECT USING (true);

CREATE POLICY "Anyone can insert nudge_cards"
  ON embarksmv2.nudge_cards FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update nudge_cards"
  ON embarksmv2.nudge_cards FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete nudge_cards"
  ON embarksmv2.nudge_cards FOR DELETE USING (true);
