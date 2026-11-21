BEGIN;

ALTER TABLE closely_questions
  ADD COLUMN IF NOT EXISTS mature boolean NOT NULL DEFAULT false;

ALTER TABLE closely_questions
  DROP CONSTRAINT IF EXISTS closely_questions_kind_check,
  DROP CONSTRAINT IF EXISTS closely_questions_mature_check;

ALTER TABLE closely_questions
  ADD CONSTRAINT closely_questions_kind_check CHECK (kind IN ('card', 'same', 'bluff', 'draw', 'never')),
  ADD CONSTRAINT closely_questions_mature_check CHECK (NOT mature OR kind = 'never');

COMMIT;
