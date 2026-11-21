BEGIN;

CREATE OR REPLACE FUNCTION closely_invite_code()
RETURNS text
LANGUAGE sql VOLATILE
AS $$
  SELECT string_agg(substr('0123456789ABCDEFGHJKMNPQRSTVWXYZ', (get_byte(bytes, slot) & 31) + 1, 1), '' ORDER BY slot)
  FROM (SELECT uuid_send(gen_random_uuid()) AS bytes) AS source
  CROSS JOIN generate_series(0, 5) AS slots(slot);
$$;

ALTER TABLE closely_rooms
  ADD COLUMN IF NOT EXISTS display_code text,
  ALTER COLUMN display_code SET DEFAULT closely_invite_code();

CREATE UNIQUE INDEX IF NOT EXISTS closely_rooms_display_code_key ON closely_rooms (display_code);

DO $$
DECLARE
  pending record;
BEGIN
  FOR pending IN SELECT id FROM closely_rooms WHERE display_code IS NULL LOOP
    LOOP
      BEGIN
        UPDATE closely_rooms SET display_code = DEFAULT WHERE id = pending.id;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        -- Draw a new code without changing the original invitation or room ID.
        NULL;
      END;
    END LOOP;
  END LOOP;
END
$$;

ALTER TABLE closely_rooms
  ALTER COLUMN display_code SET NOT NULL,
  DROP CONSTRAINT IF EXISTS closely_rooms_display_code_check;
ALTER TABLE closely_rooms
  ADD CONSTRAINT closely_rooms_display_code_check CHECK (display_code ~ '^[0-9A-HJKMNP-TV-Z]{6}$');

COMMIT;
