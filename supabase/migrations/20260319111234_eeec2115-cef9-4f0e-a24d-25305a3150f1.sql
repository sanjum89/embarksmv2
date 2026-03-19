CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo text,
  accent_color text,
  use_case_context text,
  is_default boolean DEFAULT false,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read accounts"
  ON public.accounts FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert accounts"
  ON public.accounts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update accounts"
  ON public.accounts FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete non-default accounts"
  ON public.accounts FOR DELETE
  USING (is_default = false);