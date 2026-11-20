import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

const cookieName = 'closely_guest';
export const roomLifetime = 7 * 24 * 60 * 60 * 1000;
export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters');
  return value;
}
const signature = (value: string) => createHmac('sha256', secret()).update(value).digest('base64url');
export const inviteFor = (id: string) => signature(`invite:${id}`).slice(0, 22);
export function same(a: string, b: string) {
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
export function guest(req: NextRequest) {
  const value = req.cookies.get(cookieName)?.value;
  if (!value) return null;
  const [id, expiry, signed] = value.split('.');
  if (!/^[A-Za-z0-9_-]{43}$/.test(id) || !signed || !Number.isSafeInteger(Number(expiry)) || Number(expiry) < Date.now()) return null;
  return same(signed, signature(`guest:${id}.${expiry}`)) ? id : null;
}
export function newGuest() { return randomBytes(32).toString('base64url'); }
export function setGuest(res: NextResponse, req: NextRequest, id: string) {
  const expiry = Date.now() + roomLifetime;
  res.cookies.set(cookieName, `${id}.${expiry}.${signature(`guest:${id}.${expiry}`)}`, {
    path: '/', httpOnly: true, secure: req.nextUrl.protocol === 'https:' || process.env.VERCEL === '1',
    sameSite: 'lax', maxAge: roomLifetime / 1000,
  });
}
export const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } });
export const problem = (error: string, status: number) => json({ error }, status);
export function validOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (!origin) return req.headers.get('sec-fetch-site') !== 'cross-site';
  try { return new URL(origin).host === req.nextUrl.host || new URL(origin).host === req.headers.get('host'); }
  catch { return false; }
}
export async function body(req: NextRequest, max = 16000): Promise<unknown> {
  if (!req.body || Number(req.headers.get('content-length')) > max) return null;
  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  let result = '', length = 0;
  try {
    for (;;) {
      const next = await reader.read();
      if (next.done) break;
      length += next.value.byteLength;
      if (length > max) { await reader.cancel(); return null; }
      result += decoder.decode(next.value, { stream: true });
    }
    return JSON.parse(result + decoder.decode());
  } catch { return null; }
}
