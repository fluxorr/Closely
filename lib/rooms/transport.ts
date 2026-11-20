import * as Ably from 'ably';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { database } from '@/src/database/client';
import { outbox } from '@/src/database/schemas/rooms';

let rest: Ably.Rest | undefined;
function realtime() {
  const key = process.env.ABLY_API_KEY;
  if (!key) return null;
  return rest ??= new Ably.Rest({ key, queryTime: true, logLevel: 0 });
}
export const channelName = (id: string) => `closely:room:${id}`;
export function seatToken(id: string, seat: number) {
  return realtime()?.auth.createTokenRequest({ clientId: `${id}:${seat}`, ttl: 20 * 60 * 1000, capability: { [channelName(id)]: ['subscribe', 'presence'] } });
}
export async function dispatch(id?: string) {
  const transport = realtime();
  if (!transport) return;
  const db = database();
  const pending = await db.select().from(outbox).where(and(isNull(outbox.sent), id ? eq(outbox.room, id) : undefined)).orderBy(asc(outbox.created)).limit(id ? 8 : 50);
  await Promise.allSettled(pending.map(async event => {
    await transport.channels.get(channelName(event.room)).publish({ name: 'version', id: `${event.room}:${event.version}:0`, data: { version: event.version } });
    await db.update(outbox).set({ sent: Date.now() }).where(and(eq(outbox.room, event.room), eq(outbox.version, event.version)));
  }));
}
