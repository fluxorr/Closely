import { randomUUID } from 'node:crypto';
import { and, eq, lt, sql } from 'drizzle-orm';
import { database } from '@/src/database/client';
import { questionBank } from '@/src/database/queries/questions';
import { limits, outbox, receipts, rooms } from '@/src/database/schemas/rooms';
import type { z } from 'zod';
import type { entry, envelope, join } from './actions';
import { hash, inviteFor, roomLifetime, same } from './auth';
import { tickMatch, type Seat } from './game';
import { applyRoomAction, hasLegacyActivity, legacyId, makeRoom, resetLegacyActivity, roomView, sessionId, type RoomState } from './state';

type Row = typeof rooms.$inferSelect;
type Transaction = Parameters<Parameters<ReturnType<typeof database>['transaction']>[0]>[0];
const participant = (data: z.infer<typeof entry>, guest: string, now: number) => ({ name: data.name, avatar: data.avatar, credential: hash(guest), joinedAt: now });
export function seatOf(row: Row, guest: string | null): Seat | null {
  if (!guest) return null;
  const credential = hash(guest);
  const index = row.state.players.findIndex(p => p && same(p.credential, credential));
  return index === 0 || index === 1 ? index : null;
}
const view = (row: Row, seat: Seat, now: number) => ({ ...roomView(row, seat, now, [row.seen0, row.seen1], inviteFor(row.id)), realtime: Boolean(process.env.ABLY_API_KEY) });
export async function lookup(id: string) {
  const [row] = await database().select().from(rooms).where(eq(rooms.id, id)).limit(1);
  return row;
}
export async function consume(key: string, allowed: number, now = Date.now()) {
  const window = Math.floor(now / 60000) * 60000;
  const [row] = await database().insert(limits).values({ key, window, hits: 1 }).onConflictDoUpdate({ target: limits.key, set: {
    window, hits: sql`case when ${limits.window} = ${window} then ${limits.hits} + 1 else 1 end`,
  } }).returning({ hits: limits.hits });
  return row.hits <= allowed;
}
export async function createRoom(data: z.infer<typeof entry>, guest: string) {
  const id = randomUUID(), now = Date.now();
  await database().insert(rooms).values({ id, inviteHash: hash(inviteFor(id)), state: makeRoom(participant(data, guest, now)), expires: now + roomLifetime, seen0: now });
  return id;
}
async function save(tx: Transaction, row: Row, state: RoomState, now: number, seen?: Seat) {
  const [updated] = await tx.update(rooms).set({ state, version: row.version + 1,
    ...(seen === 0 ? { seen0: now } : seen === 1 ? { seen1: now } : {}),
  }).where(eq(rooms.id, row.id)).returning();
  await tx.insert(outbox).values({ room: updated.id, version: updated.version, created: now });
  return updated;
}
export async function joinRoom(data: z.infer<typeof join>, guest: string) {
  return database().transaction(async tx => {
    const now = Date.now();
    const id = data.id;
    if (id && legacyId.test(id) && !data.invite) {
      await tx.insert(rooms).values({ id, inviteHash: hash(inviteFor(id)), state: makeRoom(participant(data, guest, now)), expires: now + roomLifetime, seen0: now }).onConflictDoNothing();
    }
    const [row] = await tx.select().from(rooms).where(id ? eq(rooms.id, id) : eq(rooms.inviteHash, hash(data.invite ?? ''))).for('update');
    if (!row) return { status: 404 } as const;
    if (seatOf(row, guest) !== null) return row.expires > now ? { status: 200, id: row.id } as const : { status: 410 } as const;
    const valid = data.invite ? same(row.inviteHash, hash(data.invite)) : legacyId.test(row.id);
    if (!valid) return { status: 404 } as const;
    if (row.expires <= now) return { status: 410 } as const;
    if (row.state.players[1]) return { status: 409 } as const;
    row.state.players[1] = participant(data, guest, now);
    await save(tx, row, row.state, now, 1);
    return { status: 200, id: row.id } as const;
  });
}
export async function readRoom(id: string, guest: string | null) {
  if (!guest) return { status: 401 } as const;
  const row = await lookup(id);
  const seat = row ? seatOf(row, guest) : null;
  if (!row || seat === null) return { status: 401 } as const;
  const now = Date.now();
  if (row.expires <= now) return { status: 410 } as const;
  if (hasLegacyActivity(row.state) || row.state.match?.deadline != null && row.state.match.deadline <= now) {
    return database().transaction(async tx => {
      const [live] = await tx.select().from(rooms).where(eq(rooms.id, id)).for('update');
      if (!live || live.expires <= now) return { status: 410 } as const;
      const changed = resetLegacyActivity(live.state) || !!live.state.match && tickMatch(live.state.match, now);
      const current = changed ? await save(tx, live, live.state, now, seat) : live;
      return { status: 200, view: view(current, seat, now), changed } as const;
    });
  }
  const column = seat === 0 ? rooms.seen0 : rooms.seen1;
  if ((seat === 0 ? row.seen0 : row.seen1) < now - 4500) {
    await database().update(rooms).set(seat === 0 ? { seen0: now } : { seen1: now }).where(and(eq(rooms.id, id), lt(column, now - 4500)));
  }
  return { status: 200, view: view(row, seat, now), changed: false } as const;
}
export async function mutateRoom(id: string, guest: string | null, message: z.infer<typeof envelope>) {
  if (!guest) return { status: 401 } as const;
  return database().transaction(async tx => {
    const [row] = await tx.select().from(rooms).where(eq(rooms.id, id)).for('update');
    const seat = row ? seatOf(row, guest) : null;
    if (!row || seat === null) return { status: 401 } as const;
    const now = Date.now();
    if (row.expires <= now) return { status: 410 } as const;
    const { action, actionId, expectedVersion } = message;
    const requestHash = hash(JSON.stringify([message.sessionId, action]));
    const [old] = await tx.select().from(receipts).where(and(eq(receipts.room, id), eq(receipts.seat, seat), eq(receipts.id, actionId))).limit(1);
    if (old) return same(old.hash, requestHash) ? { status: 200, view: view(row, seat, now), changed: false } as const : { status: 409, error: 'This action was already used.', view: view(row, seat, now) } as const;
    const legacy = resetLegacyActivity(row.state);
    if (legacy || row.state.match && tickMatch(row.state.match, now)) {
      const updated = await save(tx, row, row.state, now, seat);
      return { status: 409, error: legacy ? 'The room was updated. Choose an activity again.' : 'The timer moved on.', view: view(updated, seat, now), changed: true } as const;
    }
    const independent = action.type === 'chat' || action.type === 'reaction';
    if (!independent && (row.version !== expectedVersion || message.sessionId !== sessionId(row.state))) {
      return { status: 409, error: 'The room moved on. Try again.', view: view(row, seat, now) } as const;
    }
    const minGap = action.type === 'stroke' ? 110 : action.type === 'reaction' ? 400 : action.type === 'chat' || action.type === 'drawing-guess' ? 650 : 0;
    if (row.state.lastActions[seat][action.type] > now - minGap) return { status: 429, error: 'Give it a moment and try again.', view: view(row, seat, now) } as const;
    const applied = await applyRoomAction(row.state, seat, action, id, actionId, now, questionBank(tx));
    if (applied !== true) {
      const error = applied === 'missing-questions' ? 'This game has no published prompts yet.' : 'That action isn’t available right now.';
      return { status: 422, error, view: view(row, seat, now) } as const;
    }
    row.state.lastActions[seat][action.type] = now;
    const updated = await save(tx, row, row.state, now, seat);
    await tx.insert(receipts).values({ room: id, seat, id: actionId, hash: requestHash });
    return { status: 200, view: view(updated, seat, now), changed: true } as const;
  });
}
export async function cleanRooms(now = Date.now()) {
  const db = database();
  await Promise.all([
    db.execute(sql`delete from closely_rooms where id in (select id from closely_rooms where expires_at < ${now} limit 200)`),
    db.execute(sql`delete from closely_limits where key in (select key from closely_limits where window_start < ${now - 3600000} limit 1000)`),
    db.execute(sql`delete from closely_outbox where (room_id, version) in (select room_id, version from closely_outbox where created_at < ${now - 86400000} limit 1000)`),
  ]);
}
