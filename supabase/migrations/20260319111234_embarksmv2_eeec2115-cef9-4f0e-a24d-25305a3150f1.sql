CREATE TABLE embarksmv2.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo text,
  accent_color text,
  use_case_context text,
  is_default boolean DEFAULT false,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE embarksmv2.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read accounts"
  ON embarksmv2.accounts FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert accounts"
  ON embarksmv2.accounts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update accounts"
  ON embarksmv2.accounts FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete non-default accounts"
  ON embarksmv2.accounts FOR DELETE
  USING (is_default = false);