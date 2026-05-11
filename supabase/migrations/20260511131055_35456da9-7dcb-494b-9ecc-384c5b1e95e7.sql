ALTER TABLE catalog_chapters
  ADD COLUMN IF NOT EXISTS content_sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS diagnostic_questions jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE persona_module_adaptations
  ADD COLUMN IF NOT EXISTS section_overrides jsonb NOT NULL DEFAULT '{}'::jsonb;