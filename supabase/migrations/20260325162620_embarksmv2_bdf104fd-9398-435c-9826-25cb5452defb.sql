-- Delete duplicate nudge_cards, keeping only the earliest per grouping_key
DELETE FROM embarksmv2.nudge_cards
WHERE id NOT IN (
  SELECT DISTINCT ON (grouping_key) id
  FROM embarksmv2.nudge_cards
  ORDER BY grouping_key, created_at ASC
);

-- Add unique constraint on grouping_key to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS nudge_cards_grouping_key_unique ON embarksmv2.nudge_cards (grouping_key) WHERE grouping_key IS NOT NULL;