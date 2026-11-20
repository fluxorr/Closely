import { randomUUID } from 'node:crypto';
import { and, eq, lt, sql } from 'drizzle-orm';
import { database, queryRows } from '@/src/database/client';
import { questionBank } from '@/src/database/queries/questions';
import { limits, outbox, receipts, rooms } from '@/src/database/schemas/rooms';
import type { z } from 'zod';
import type { entry, envelope, join } from './actions';
import { hash, inviteFor, roomLifetime, same } from './auth';
import { tickMatch, type Seat } from './game';
import { applyRoomAction, legacyId, makeRoom, resetLegacyActivity, roomView, sessionId } from './state';

type Row = typeof rooms.$inferSelect;
const participant = (data: z.infer<typeof entry>, guest: string, now: number) => ({ name: data.name, avatar: data.avatar, credential: hash(guest), joinedAt: now });

export function seatOf(row: Row, guest: string | null): Seat | null {
  if (!guest) return null;
  const credential = hash(guest);
  const index = row.state.players.findIndex(p => p && same(p.credential, credential));
  return index === 0 || index === 1 ? index : null;
}

const view = (row: Row, seat: Seat, now: number) => ({ ...roomView(row, seat, now, [row.seen0, row.seen1], inviteFor(row.id)), realtime: Boolean(process.env.ABLY_API_KEY) });

function advanceRoom(row: Row, now: number) {
  if (resetLegacyActivity(row.state)) return 'legacy';
  if (row.state.match && tickMatch(row.state.match, now)) return 'timer';
}

export async function lookup(id: string) {
  const [row] = await database().select().from(rooms).where(eq(rooms.id, id)).limit(1);
  return row;
}

function meter(key: string, now: number) {
  const window = Math.floor(now / 60000) * 60000;
  return sql`
    insert into ${limits} (key, window_start, hits) values (${key}, ${window}, 1)
    on conflict (key) do update set
      hits = case when closely_limits.window_start >= excluded.window_start then closely_limits.hits + 1 else 1 end,
      window_start = greatest(closely_limits.window_start, excluded.window_start)
    returning hits
  `;
}

export async function consume(key: string, allowed: number, now = Date.now()) {
  const [row] = await queryRows<{ hits: number }>(meter(key, now));
  return row.hits <= allowed;
}

export async function createRoom(data: z.infer<typeof entry>, guest: string, rateKey: string) {
  const id = randomUUID();
  const now = Date.now();
  const room: Row = { id, inviteHash: hash(inviteFor(id)), version: 0, state: makeRoom(participant(data, guest, now)), expires: now + roomLifetime, seen0: now, seen1: 0 };
  const [created] = await queryRows<{ id: string }>(sql`
    with quota as (${meter(rateKey, now)})
    insert into ${rooms} (id, invite_hash, state, expires_at, seen_0)
    select ${room.id}, ${room.inviteHash}, ${JSON.stringify(room.state)}::jsonb, ${room.expires}, ${room.seen0}
    from quota where hits <= 20
    returning id
  `);
  return created ? view(room, 0, now) : null;
}

// The version guard lets concurrent requests read without a lock. Only the winning
// write can change the room, enqueue its notification, and record its receipt.
async function save(row: Row, now: number, seat: Seat, receipt?: { id: string; hash: string }) {
  const seen = seat === 0 ? sql`seen_0` : sql`seen_1`;
  const [updated] = await queryRows<{ version: number; seen0: number; seen1: number }>(sql`
    with updated as (
      update ${rooms}
      set state = ${JSON.stringify(row.state)}::jsonb,
          version = version + 1,
          ${seen} = greatest(${seen}, ${now})
      where id = ${row.id} and version = ${row.version} and expires_at > ${now}
      returning id, version, seen_0, seen_1
    ), queued as (
      insert into ${outbox} (room_id, version, created_at)
      select id, version, ${now} from updated
    )
    ${receipt ? sql`, recorded as (
      insert into ${receipts} (room_id, seat, id, hash)
      select id, ${seat}, ${receipt.id}, ${receipt.hash} from updated
    )` : sql.empty()}
    select version, seen_0::double precision as "seen0", seen_1::double precision as "seen1" from updated
  `);
  return updated ? { ...row, ...updated } : null;
}

export async function joinRoom(data: z.infer<typeof join>, guest: string, rateKey: string) {
  const now = Date.now();
  const id = data.id;
  const invitation = hash(data.invite ?? '');
  const condition = id ? eq(rooms.id, id) : eq(rooms.inviteHash, invitation);
  const [initial] = await queryRows<{ allowed: boolean; room: Row | null }>(sql`
    with quota as (${meter(rateKey, now)})
    select hits <= 35 as allowed, (
      select jsonb_build_object(
        'id', id, 'inviteHash', invite_hash, 'version', version, 'state', state,
        'expires', expires_at, 'seen0', seen_0, 'seen1', seen_1
      )
      from ${rooms} where ${condition} and quota.hits <= 35
    ) as room from quota
  `);
  if (!initial.allowed) return { status: 429 } as const;
  let row = initial.room ?? undefined;
  if (!row && id && legacyId.test(id) && !data.invite) {
    const [created] = await database().insert(rooms).values({
      id, inviteHash: hash(inviteFor(id)), state: makeRoom(participant(data, guest, now)), expires: now + roomLifetime, seen0: now,
    }).onConflictDoNothing().returning();
    row = created ?? await lookup(id);
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    if (!row) return { status: 404 } as const;
    const currentTime = Date.now();
    const seat = seatOf(row, guest);
    if (seat !== null) {
      if (row.expires <= currentTime) return { status: 410 } as const;
      if (!advanceRoom(row, currentTime)) return { status: 200, view: view(row, seat, currentTime), changed: false } as const;
      const updated = await save(row, currentTime, seat);
      if (updated) return { status: 200, view: view(updated, seat, currentTime), changed: true } as const;
      row = await lookup(row.id);
      continue;
    }
    const valid = data.invite ? same(row.inviteHash, invitation) : legacyId.test(row.id);
    if (!valid) return { status: 404 } as const;
    if (row.expires <= currentTime) return { status: 410 } as const;
    if (row.state.players[1]) return { status: 409 } as const;
    row.state.players[1] = participant(data, guest, currentTime);
    const updated = await save(row, currentTime, 1);
    if (updated) return { status: 200, view: view(updated, 1, currentTime), changed: true } as const;
    row = await lookup(row.id);
  }
  return { status: 503 } as const;
}

export async function recordPresence(id: string, seat: Seat, now: number) {
  const column = seat === 0 ? rooms.seen0 : rooms.seen1;
  await database().update(rooms).set(seat === 0 ? { seen0: now } : { seen1: now })
    .where(and(eq(rooms.id, id), lt(column, now - 4500)));
}

export async function readRoom(id: string, guest: string | null) {
  if (!guest) return { status: 401 } as const;
  for (let attempt = 0; attempt < 3; attempt++) {
    const row = await lookup(id);
    const seat = row ? seatOf(row, guest) : null;
    if (!row || seat === null) return { status: 401 } as const;
    const now = Date.now();
    if (row.expires <= now) return { status: 410 } as const;
    if (advanceRoom(row, now)) {
      const updated = await save(row, now, seat);
      if (updated) return { status: 200, view: view(updated, seat, now), changed: true } as const;
      continue;
    }
    const heartbeat = (seat === 0 ? row.seen0 : row.seen1) < now - 4500;
    return { status: 200, view: view(row, seat, now), changed: false, heartbeat } as const;
  }
  return { status: 503 } as const;
}

async function readAction(id: string, credential: string, actionId: string) {
  const [result] = await database().select({
    row: rooms,
    receiptHash: sql<string | null>`(
      select hash from ${receipts}
      where room_id = ${rooms}.id and id = ${actionId}
        and seat = case when ${rooms}.state->'players'->0->>'credential' = ${credential} then 0 else 1 end
    )`,
  }).from(rooms).where(eq(rooms.id, id));
  return result;
}

export async function mutateRoom(id: string, guest: string | null, message: z.infer<typeof envelope>) {
  if (!guest) return { status: 401 } as const;
  const { action, actionId, expectedVersion } = message;
  const credential = hash(guest);
  const requestHash = hash(JSON.stringify([message.sessionId, action]));
  const independent = action.type === 'chat' || action.type === 'reaction';
  for (let attempt = 0; attempt < 3; attempt++) {
    const snapshot = await readAction(id, credential, actionId);
    const seat = snapshot ? seatOf(snapshot.row, guest) : null;
    if (!snapshot || seat === null) return { status: 401 } as const;
    const { row, receiptHash } = snapshot;
    const now = Date.now();
    if (row.expires <= now) return { status: 410 } as const;
    if (receiptHash) {
      return same(receiptHash, requestHash)
        ? { status: 200, view: view(row, seat, now), changed: false } as const
        : { status: 409, error: 'This action was already used.', view: view(row, seat, now) } as const;
    }
    const transition = advanceRoom(row, now);
    if (transition) {
      const updated = await save(row, now, seat);
      if (!updated) continue;
      return { status: 409, error: transition === 'legacy' ? 'The room was updated. Choose an activity again.' : 'The timer moved on.', view: view(updated, seat, now), changed: true } as const;
    }
    if (!independent && (row.version !== expectedVersion || message.sessionId !== sessionId(row.state))) {
      return { status: 409, error: 'The room moved on. Try again.', view: view(row, seat, now) } as const;
    }
    const minGap = action.type === 'stroke' ? 110 : action.type === 'reaction' ? 400 : action.type === 'chat' || action.type === 'drawing-guess' ? 650 : 0;
    if (row.state.lastActions[seat][action.type] > now - minGap) return { status: 429, error: 'Give it a moment and try again.', view: view(row, seat, now) } as const;
    const applied = await applyRoomAction(row.state, seat, action, id, actionId, now, questionBank);
    if (applied !== true) {
      const error = applied === 'missing-questions' ? 'This game has no published prompts yet.' : 'That action isn’t available right now.';
      return { status: 422, error, view: view(row, seat, now) } as const;
    }
    row.state.lastActions[seat][action.type] = now;
    const updated = await save(row, now, seat, { id: actionId, hash: requestHash });
    if (updated) return { status: 200, view: view(updated, seat, now), changed: true } as const;
  }
  return { status: 503 } as const;
}

export async function cleanRooms(now = Date.now()) {
  const db = database();
  await Promise.all([
    db.execute(sql`delete from closely_rooms where id in (select id from closely_rooms where expires_at < ${now} limit 200)`),
    db.execute(sql`delete from closely_limits where key in (select key from closely_limits where window_start < ${now - 3600000} limit 1000)`),
    db.execute(sql`delete from closely_outbox where (room_id, version) in (select room_id, version from closely_outbox where created_at < ${now - 86400000} limit 1000)`),
  ]);
}
