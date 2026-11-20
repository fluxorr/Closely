import { expect, test } from '@playwright/test';
import { action, joinPair, players, snapshot } from './browser-helpers';

test('two seats, synchronized cards, consent, private answers, chat and reconnect', async ({ browser, baseURL }) => {
  const { a,b,close } = await players(browser,baseURL!);
  try {
    const { id, invite } = await joinPair(a,b);
    const third = await browser.newContext({ baseURL });
    try {
      expect((await third.request.get(`/api/rooms/${id}`)).status()).toBe(401);
      expect((await third.request.post('/api/rooms/join', { data: { id, invite, name: 'Visitor' } })).status()).toBe(409);
      expect((await third.request.post(`/api/rooms/${id}/realtime`)).status()).toBe(401);
    } finally { await third.close(); }
    await a.page.getByRole('button', { name:'Fun', exact:true }).click();
    await expect(b.page.getByRole('button', { name:'Flip card' })).toBeVisible();
    const before = await snapshot(a,id);
    expect((await snapshot(b,id)).card?.cardId).toBe(before.card?.cardId);
    await b.page.getByRole('button', { name:'Flip card' }).click();
    await expect(a.page.getByRole('button', { name:'Next card' })).toBeVisible();
    await expect.poll(async () => (await snapshot(a,id)).card?.phase).toBe('revealed');
    const open = await snapshot(a,id);
    const concurrent = await Promise.all([action(a,id,{ type:'next' },open), action(b,id,{ type:'next' },open)]);
    expect(concurrent.map(r => r.status()).sort()).toEqual([200,409]);
    const request = await snapshot(a,id);
    const receiver = request.proposal?.seat === 0 ? b : a;
    const receipt = crypto.randomUUID();
    expect((await action(receiver,id,{ type:'respond', accept:true },request,receipt)).status()).toBe(200);
    expect((await action(receiver,id,{ type:'respond', accept:true },request,receipt)).status()).toBe(200);
    const next = await snapshot(a,id);
    expect(next.card?.round).toBe((open.card?.round ?? 0) + 1);
    expect(next.card?.cardId).not.toBe(open.card?.cardId);
    await b.page.reload();
    await expect(b.page.getByRole('button', { name:'Flip card' })).toBeVisible();
    expect((await snapshot(b,id)).card?.cardId).toBe(next.card?.cardId);
    await expect(a.page.locator('[data-card-id]')).toHaveAttribute('data-card-id', next.card!.cardId!);
    await a.page.getByRole('button', { name:'Answer & Reveal' }).click();
    await b.page.getByRole('button', { name:'Accept' }).click();
    await expect(a.page.getByRole('button', { name:'Answer & Reveal' })).toHaveAttribute('aria-pressed','true');
    await a.page.getByRole('button', { name:'Flip card' }).click();
    await a.page.getByLabel('Your private answer').fill('a secret lighthouse');
    await a.page.getByRole('button', { name:'Lock answer' }).click();
    await expect(a.page.getByText('Locked. Waiting for')).toBeVisible();
    const hidden = await snapshot(b,id);
    expect(JSON.stringify(hidden)).not.toContain('a secret lighthouse');
    expect(hidden.card?.ready).toEqual([true,false]);
    await b.page.getByLabel('Your private answer').fill('a moonlit pier');
    await b.page.getByRole('button', { name:'Lock answer' }).click();
    await expect(b.page.getByText('a secret lighthouse')).toBeVisible();
    await expect(a.page.getByText('a moonlit pier')).toBeVisible();
    await a.page.getByRole('button', { name:'Chat', exact:true }).click();
    await a.page.getByRole('textbox', { name:'Message' }).fill('Meet me by the sea');
    await a.page.getByRole('button', { name:'Send message' }).click();
    await b.page.getByRole('button', { name:'Chat', exact:true }).click();
    await expect(b.page.getByText('Meet me by the sea')).toBeVisible();
    await b.page.getByRole('button', { name:'Close chat' }).click();
    await b.page.getByRole('button', { name:'React heart' }).click();
    await expect(a.page.getByRole('button', { name:'Close chat' })).toBeVisible();
    await a.page.getByRole('button', { name:'Close chat' }).click();
    await expect(a.page.getByLabel(`${b.name} reacted ❤️`)).toBeVisible();
  } finally { await close(); }
});

test('two independent guests racing for the last seat get one success', async ({ request, browser, baseURL }) => {
  const created = await request.post('/api/rooms', { data: { name:'Seat host' } });
  expect(created.status()).toBe(201);
  const { id } = await created.json();
  const { invite } = await (await request.get(`/api/rooms/${id}`)).json();
  const { a,b,close } = await players(browser,baseURL!);
  try {
    const results = await Promise.all([a,b].map(player => player.context.request.post('/api/rooms/join', { data:{ id, invite, name:player.name } })));
    expect(results.map(response => response.status()).sort()).toEqual([200,409]);
    expect((await (await request.get(`/api/rooms/${id}`)).json()).players.filter(Boolean)).toHaveLength(2);
  } finally { await close(); }
});
