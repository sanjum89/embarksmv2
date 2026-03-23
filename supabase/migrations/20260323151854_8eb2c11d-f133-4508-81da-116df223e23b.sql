
ALTER TABLE public.nudge_cards DROP CONSTRAINT IF EXISTS nudge_cards_color_theme_check;
ALTER TABLE public.nudge_cards ADD CONSTRAINT nudge_cards_color_theme_check CHECK (color_theme = ANY (ARRAY['blue'::text, 'emerald'::text, 'amber'::text, 'violet'::text, 'rose'::text, 'sky'::text, 'mint'::text, 'lavender'::text, 'peach'::text, 'lilac'::text, 'sand'::text]));
ALTER TABLE public.nudge_cards DROP CONSTRAINT IF EXISTS nudge_cards_type_check;
