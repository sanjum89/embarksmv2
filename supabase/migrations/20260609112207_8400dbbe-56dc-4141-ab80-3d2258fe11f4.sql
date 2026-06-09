
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS workforce_groups_enabled boolean NOT NULL DEFAULT false;

-- workforce_groups
CREATE TABLE public.workforce_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.workforce_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  kind text NOT NULL DEFAULT 'custom' CHECK (kind IN ('office','function','team','initiative','custom')),
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, parent_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workforce_groups TO authenticated;
GRANT ALL ON public.workforce_groups TO service_role;
ALTER TABLE public.workforce_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wg_read"   ON public.workforce_groups FOR SELECT USING (true);
CREATE POLICY "wg_insert" ON public.workforce_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "wg_update" ON public.workforce_groups FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "wg_delete" ON public.workforce_groups FOR DELETE USING (true);
CREATE TRIGGER trg_wg_updated_at BEFORE UPDATE ON public.workforce_groups FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_wg_account_parent ON public.workforce_groups(account_id, parent_id);

-- workforce_group_members
CREATE TABLE public.workforce_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.workforce_groups(id) ON DELETE CASCADE,
  employee_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, employee_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workforce_group_members TO authenticated;
GRANT ALL ON public.workforce_group_members TO service_role;
ALTER TABLE public.workforce_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wgm_read"   ON public.workforce_group_members FOR SELECT USING (true);
CREATE POLICY "wgm_insert" ON public.workforce_group_members FOR INSERT WITH CHECK (true);
CREATE POLICY "wgm_update" ON public.workforce_group_members FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "wgm_delete" ON public.workforce_group_members FOR DELETE USING (true);
CREATE INDEX idx_wgm_group ON public.workforce_group_members(group_id);
CREATE INDEX idx_wgm_employee ON public.workforce_group_members(account_id, employee_id);

-- workforce_group_links
CREATE TABLE public.workforce_group_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.workforce_groups(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('role','cohort','compliance_rule','requisition','succession_slate')),
  entity_id text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, entity_type, entity_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workforce_group_links TO authenticated;
GRANT ALL ON public.workforce_group_links TO service_role;
ALTER TABLE public.workforce_group_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wgl_read"   ON public.workforce_group_links FOR SELECT USING (true);
CREATE POLICY "wgl_insert" ON public.workforce_group_links FOR INSERT WITH CHECK (true);
CREATE POLICY "wgl_update" ON public.workforce_group_links FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "wgl_delete" ON public.workforce_group_links FOR DELETE USING (true);
CREATE INDEX idx_wgl_group ON public.workforce_group_links(group_id);
CREATE INDEX idx_wgl_entity ON public.workforce_group_links(account_id, entity_type, entity_id);

-- workforce_group_compliance_rules
CREATE TABLE public.workforce_group_compliance_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  code text NOT NULL,
  label text NOT NULL,
  framework text NOT NULL DEFAULT 'CUSTOM' CHECK (framework IN ('SMCR','CONSUMER_DUTY','CISI_CPD','TC','CUSTOM')),
  target_hours numeric,
  cadence text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workforce_group_compliance_rules TO authenticated;
GRANT ALL ON public.workforce_group_compliance_rules TO service_role;
ALTER TABLE public.workforce_group_compliance_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wgcr_read"   ON public.workforce_group_compliance_rules FOR SELECT USING (true);
CREATE POLICY "wgcr_insert" ON public.workforce_group_compliance_rules FOR INSERT WITH CHECK (true);
CREATE POLICY "wgcr_update" ON public.workforce_group_compliance_rules FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "wgcr_delete" ON public.workforce_group_compliance_rules FOR DELETE USING (true);
CREATE TRIGGER trg_wgcr_updated_at BEFORE UPDATE ON public.workforce_group_compliance_rules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
