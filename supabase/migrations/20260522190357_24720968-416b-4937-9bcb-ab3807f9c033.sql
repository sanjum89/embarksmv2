ALTER TABLE public.catalog_chapters
  ADD COLUMN IF NOT EXISTS condensed_by_persona jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.micro_learnings
  ADD COLUMN IF NOT EXISTS topic_tag text,
  ADD COLUMN IF NOT EXISTS module_code text;

ALTER TABLE public.assessment_instances
  ADD COLUMN IF NOT EXISTS locks_retake_until_chapters jsonb NOT NULL DEFAULT '[]'::jsonb;