import { neon } from '@neondatabase/serverless';
import type { SQL } from 'drizzle-orm';
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-http';
import { drizzle as postgresDrizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

let client: ReturnType<typeof neonDrizzle> | ReturnType<typeof postgresDrizzle> | undefined;
export function database() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is required');
    const neonHost = URL.canParse(url) && new URL(url).hostname.endsWith('.neon.tech');
    client = neonHost
      ? neonDrizzle(neon(process.env.DATABASE_URL_POOLED || url))
      : postgresDrizzle(postgres(url, { prepare: false, max: 3, idle_timeout: 20, connect_timeout: 8 }));
  }
  return client;
}

export async function queryRows<T extends Record<string, unknown>>(query: SQL) {
  const result = await database().execute<T>(query);
  return Array.isArray(result) ? result : result.rows;
}
