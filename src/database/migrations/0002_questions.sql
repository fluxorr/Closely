BEGIN;

CREATE TABLE closely_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  category text,
  text text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  answer_reveal boolean NOT NULL DEFAULT false,
  public_preview boolean NOT NULL DEFAULT false,
  answer_terms text[] NOT NULL DEFAULT '{}'::text[],
  CONSTRAINT closely_questions_kind_check CHECK (kind IN ('card', 'same', 'bluff', 'draw')),
  CONSTRAINT closely_questions_category_check CHECK (
    (kind = 'card' AND category IS NOT NULL AND category IN ('deep', 'fun', 'memory', 'action', 'spicy', 'naughty', 'game'))
    OR (kind <> 'card' AND category IS NULL)
  ),
  CONSTRAINT closely_questions_text_check CHECK (text ~ '[^[:space:]]' AND length(text) <= 800 AND (kind <> 'draw' OR length(text) <= 100)),
  CONSTRAINT closely_questions_reveal_check CHECK (NOT answer_reveal OR (kind = 'card' AND category IN ('deep', 'fun', 'memory'))),
  CONSTRAINT closely_questions_preview_check CHECK (NOT public_preview OR (kind = 'card' AND category IN ('deep', 'fun', 'memory', 'action', 'game'))),
  CONSTRAINT closely_questions_terms_check CHECK (
    cardinality(answer_terms) <= 16 AND array_position(answer_terms, NULL) IS NULL AND length(array_to_string(answer_terms, ' ')) <= 800
    AND (kind = 'draw' OR cardinality(answer_terms) = 0)
  )
);

CREATE INDEX closely_questions_enabled_kind_idx ON closely_questions (kind, id) WHERE enabled;
CREATE INDEX closely_questions_enabled_deck_idx ON closely_questions (category, id) WHERE enabled AND kind = 'card';
CREATE INDEX closely_questions_public_preview_idx ON closely_questions (id) WHERE enabled AND public_preview;

COMMIT;
