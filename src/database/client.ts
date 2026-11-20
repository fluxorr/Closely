import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

let client: ReturnType<typeof drizzle> | undefined;
export function database() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is required');
    client = drizzle(postgres(url, { prepare: false, max: 3, idle_timeout: 20, connect_timeout: 8 }));
  }
  return client;
}
