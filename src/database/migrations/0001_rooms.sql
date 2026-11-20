BEGIN;
CREATE TABLE closely_rooms (
  id text PRIMARY KEY,
  invite_hash text UNIQUE NOT NULL,
  version integer NOT NULL DEFAULT 0,
  state jsonb NOT NULL,
  expires_at bigint NOT NULL,
  seen_0 bigint NOT NULL,
  seen_1 bigint NOT NULL DEFAULT 0
);
CREATE INDEX closely_rooms_expires ON closely_rooms (expires_at);
CREATE TABLE closely_receipts (
  room_id text NOT NULL REFERENCES closely_rooms(id) ON DELETE CASCADE,
  seat integer NOT NULL CHECK (seat IN (0, 1)),
  id uuid NOT NULL,
  hash text NOT NULL,
  PRIMARY KEY (room_id, seat, id)
);
CREATE TABLE closely_outbox (
  room_id text NOT NULL REFERENCES closely_rooms(id) ON DELETE CASCADE,
  version integer NOT NULL,
  created_at bigint NOT NULL,
  sent_at bigint,
  PRIMARY KEY (room_id, version)
);
CREATE INDEX closely_outbox_pending ON closely_outbox (sent_at, created_at);
CREATE TABLE closely_limits (
  key text PRIMARY KEY,
  window_start bigint NOT NULL,
  hits integer NOT NULL
);
CREATE INDEX closely_limits_window ON closely_limits (window_start);
COMMIT;
