import { createHttpClient, type PubSubHttpClient } from '@ably/pubsub-server';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { database } from '@/src/database/client';
import { outbox } from '@/src/database/schemas/rooms';

let rest: PubSubHttpClient | undefined;
function realtime() {
  const key = process.env.ABLY_API_KEY;
  if (!key) return null;
  return rest ??= createHttpClient({ key, queryTime: true, logLevel: 0 });
}
export const channelName = (id: string) => `closely:room:${id}`;
export function seatToken(id: string, seat: number) {
  return realtime()?.auth.createTokenRequest({ clientId: `${id}:${seat}`, ttl: 20 * 60 * 1000, capability: { [channelName(id)]: ['subscribe', 'presence'] } });
}
export async function publishVersion(id: string, version: number) {
  const transport = realtime();
  if (!transport) return;
  await transport.channels.get(channelName(id)).publish({ name: 'version', id: `${id}:${version}:0`, data: { version } });
  await database().update(outbox).set({ sent: Date.now() }).where(and(eq(outbox.room, id), eq(outbox.version, version)));
}

export async function dispatch() {
  if (!realtime()) return;
  const pending = await database().select({ room: outbox.room, version: outbox.version }).from(outbox)
    .where(isNull(outbox.sent)).orderBy(asc(outbox.created)).limit(50);
  await Promise.allSettled(pending.map(event => publishVersion(event.room, event.version)));
}
