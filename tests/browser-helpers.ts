import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import type { GameId } from '../lib/rooms/catalog';
import type { RoomView } from '../lib/rooms/state';
import type { RoomAction } from '../lib/rooms/actions';

export type Player = { context: BrowserContext; page: Page; name: string };
export async function players(browser: Browser, baseURL: string, id?: string) {
  const circle = await Promise.all([browser.newContext({ baseURL, viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }), browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' })]);
  const [a,b] = await Promise.all(circle.map(async (context, i) => ({ context, page: await context.newPage(), name: `${i === 0 ? 'Jo' : 'Sam'}${id ? ` ${id}` : ''}` })));
  return { a, b, close: () => Promise.all(circle.map(context => context.close())) };
}
export async function snapshot(player: Player, id: string): Promise<RoomView> {
  const response = await player.context.request.get(`/api/rooms/${id}`);
  expect(response.ok()).toBeTruthy();
  return response.json();
}
export async function action(player: Player, id: string, command: RoomAction, current?: RoomView, actionId = crypto.randomUUID()) {
  const room = current ?? await snapshot(player,id);
  return player.context.request.post(`/api/rooms/${id}`, { data: { actionId, sessionId: room.sessionId, expectedVersion: room.version, action: command } });
}
export async function joinPair(a: Player, b: Player) {
  await a.page.goto('/');
  await a.page.locator('.hero').getByRole('button', { name:'Create a room' }).click();
  const create = a.page.getByRole('dialog');
  await create.getByLabel('Your name').fill(a.name);
  await create.getByRole('button', { name:'Create a room' }).click();
  await expect(a.page.getByRole('heading', { name:'A seat for your person.' })).toBeVisible();
  const id = new URL(a.page.url()).pathname.split('/').at(-1)!;
  const invite = (await snapshot(a,id)).invite;
  await b.page.goto(`/room/${id}#invite=${invite}`);
  await b.page.getByLabel('Your name').fill(b.name);
  await b.page.getByRole('button', { name:'Join room' }).click();
  for (const player of [a,b]) await expect(player.page.getByRole('heading', { name:'Here together.' })).toBeVisible();
  return { id, invite };
}
const names = { same: 'Same Brain', bluff: 'Bluff My Love', draw: 'Draw Me Wrong', ttt: 'Tic-Tac-Toe', rps: 'Rock Paper Scissors', potato: 'Hot Potato' };
export async function startGame(a: Player, b: Player, kind: GameId) {
  await a.page.getByRole('button', { name:`Play ${names[kind]}`, exact:true }).click();
  await expect(b.page.getByRole('heading', { name:names[kind], exact:true })).toBeVisible();
  await a.page.getByRole('button', { name:'I’m ready' }).click();
  await b.page.getByRole('button', { name:'I’m ready' }).click();
}
export async function readyBoth(a: Player, b: Player, final = false) {
  for (const player of [a,b]) await player.page.getByRole('button', { name:final ? 'See results' : 'Next round' }).click();
}
