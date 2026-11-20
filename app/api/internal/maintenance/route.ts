import type { NextRequest } from 'next/server';
import { json, problem, same } from '@/lib/rooms/auth';
import { cleanRooms } from '@/lib/rooms/store';
import { dispatch } from '@/lib/rooms/transport';

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !same(req.headers.get('authorization') ?? '', `Bearer ${secret}`)) return problem('Unauthorized.', 401);
  await dispatch();
  await cleanRooms();
  return json({ ok: true });
}
