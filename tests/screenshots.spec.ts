import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { action, joinPair, players, readyBoth, snapshot } from './browser-helpers';

const folder = 'artifacts/closely';
const viewports = [ [360,800], [390,844], [768,1024], [1440,900] ] as const;
test.skip(!process.env.CLOSELY_CAPTURE, 'Set CLOSELY_CAPTURE=1 to regenerate screenshot evidence.');
async function capture(page: Page, filename: string, fullPage = false) {
  await page.evaluate(async () => { await document.fonts.ready; });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.screenshot({ path:`${folder}/${filename}.png`, animations:'disabled', fullPage });
}
test('public screens and brand board across sizes', async ({ page }, info) => {
  for (const [width,height] of viewports) {
    await page.setViewportSize({ width,height });
    await page.goto('/');
    await expect(page.getByRole('heading', { name:'A little world for just us.' })).toBeVisible();
    await capture(page, `home-${width}`, width === 1440 || width === 390);
    await page.locator('.hero').getByRole('button', { name:'Join with code' }).click();
    await capture(page, `join-${width}`);
    await page.keyboard.press('Escape');
  }
  await page.setViewportSize({ width:1440, height:900 });
  const logos = [['public/brand/closely-mark.svg','Together C'],['assets/source/interlocking-bubbles.svg','Speech bubbles'],['assets/source/overlapping-cards.svg','Overlapping cards']];
  const samples = await Promise.all(logos.map(async ([file,name]) => ({ name, url:`data:image/svg+xml;base64,${(await readFile(file)).toString('base64')}` })));
  await page.goto(new URL('/', info.project.use.baseURL).href);
  await page.evaluate((items) => {
    document.body.innerHTML = `<main style="width:1200px;margin:40px auto"><p style="margin-bottom:15px;color:#8a425a">Closely 2.0 · Brand explorations</p><h1 style="font-size:60px;margin-bottom:25px">Together C</h1><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">${items.map(item => `<article style="border:1px solid #e2ded7;padding:12px;border-radius:20px;background:#fffdfc"><h3>${item.name}</h3><div style="display:flex;align-items:end;gap:5px;justify-content:center;padding:16px 0">${[16,32,64,256].map(n => `<img src="${item.url}" width="${n}" height="${n}" alt="">`).join('')}</div></article>`).join('')}</div><div style="margin:22px 0;display:flex;align-items:center;gap:12px">${['#f9f7f1','#292827','#f2becb','#c9ddbf','#c5ddf1','#f6e2a5','#dbd1ec'].map(color => `<i style="width:44px;height:44px;border-radius:8px;border:1px solid #ccc;background:${color}"></i>`).join('')}<img src="/brand/closely-wordmark.svg" width="125" height="40" alt="Closely wordmark"></div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px"><div><h2 style="font-size:38px">Fraunces</h2><p style="font-size:24px;font-weight:650">DM Sans</p><p>A little world for just us.</p></div><img src="/assets/illustrations/world.webp" width="365" alt="Hero illustration"><img src="/assets/games/same.webp" width="365" alt="Same Brain cover"></div></main>`;
  }, samples);
  await page.locator('img').first().waitFor();
  await capture(page, 'brand-board');
});

test('wait, lobby, card and chat screens across sizes', async ({ browser, baseURL }) => {
  const { a,b,close } = await players(browser,baseURL!,'Visual');
  try {
    await a.page.goto('/');
    await a.page.locator('.hero').getByRole('button', { name:'Create a room' }).click();
    await a.page.getByRole('dialog').getByLabel('Your name').fill(a.name);
    await a.page.getByRole('dialog').getByRole('button', { name:'Create a room' }).click();
    await expect(a.page.getByRole('heading', { name:'A seat for your person.' })).toBeVisible();
    for (const [width,height] of viewports) {
      await a.page.setViewportSize({width,height});
      await capture(a.page,`waiting-${width}`);
    }
    const id = new URL(a.page.url()).pathname.split('/').at(-1)!;
    const { invite } = await snapshot(a,id);
    await b.page.goto(`/room/${id}#invite=${invite}`);
    await b.page.getByLabel('Your name').fill(b.name);
    await b.page.getByRole('button', { name:'Join room' }).click();
    await expect(a.page.getByRole('heading', { name:'Here together.' })).toBeVisible();
    for (const [width,height] of viewports) {
      await a.page.setViewportSize({width,height});
      await capture(a.page,`lobby-${width}`);
    }
    await a.page.getByRole('button', { name:'Answer & Reveal' }).click();
    await a.page.getByRole('button', { name:'Fun', exact:true }).click();
    await a.page.getByRole('button', { name:'Flip card' }).click();
    await expect(a.page.getByLabel('Your private answer')).toBeVisible();
    for (const [width,height] of viewports) {
      await a.page.setViewportSize({width,height});
      await capture(a.page,`cards-${width}`);
    }
    await a.page.getByRole('button', { name:'Chat', exact:true }).click();
    await a.page.getByRole('textbox', { name:'Message' }).fill('Ready when you are!');
    await a.page.getByRole('button', { name:'Send message' }).click();
    await expect(a.page.getByText('Ready when you are!')).toBeVisible();
    await capture(a.page,'chat-1440');
  } finally { await close(); }
});

for (const kind of ['same','bluff','draw'] as const) test(`${kind} ready, active and reveal visual states`, async ({ browser, baseURL }) => {
  const { a,b,close } = await players(browser,baseURL!,kind);
  try {
    const { id } = await joinPair(a,b);
    await a.page.getByRole('button', { name: `Play ${kind === 'same' ? 'Same Brain' : kind === 'bluff' ? 'Bluff My Love' : 'Draw Me Wrong'}`, exact:true }).click();
    await expect(a.page.getByText('Ready when you are')).toBeVisible();
    await capture(a.page,`${kind}-ready-1440`);
    await expect(b.page.getByText('Ready when you are')).toBeVisible();
    await capture(b.page,`${kind}-ready-390`);
    await a.page.getByRole('button', { name:'I’m ready' }).click();
    await b.page.getByRole('button', { name:'I’m ready' }).click();
    await expect.poll(async () => (await snapshot(a,id)).game?.phase).toBe('playing');
    const game = (await snapshot(a,id)).game!;
    const actor = game.actor === 0 ? a : b, partner = game.actor === 0 ? b : a;
    await expect(a.page.locator('.game-paper h2')).toBeVisible();
    await expect(b.page.locator('.game-paper h2')).toBeVisible();
    await capture(a.page,`${kind}-active-1440`);
    await capture(b.page,`${kind}-active-390`);
    for (const [width,height] of [viewports[0],viewports[2]]) {
      await a.page.setViewportSize({ width,height });
      await capture(a.page,`${kind}-active-${width}`);
    }
    await a.page.setViewportSize({ width:1440,height:900 });
    if (kind === 'same') {
      for (const person of [a,b]) expect((await action(person,id,{type:'answer',text:'Peach cobbler'})).status()).toBe(200);
    } else if (kind === 'bluff') {
      const instruction = (await snapshot(actor,id)).game?.instruction ?? 'truth';
      expect((await action(actor,id,{type:'story',text:'I once borrowed a velvet hat for a costume party.'})).status()).toBe(200);
      expect((await action(partner,id,{type:'guess',choice:instruction})).status()).toBe(200);
    } else {
      const prompt = (await snapshot(actor,id)).game!.prompt!;
      await action(actor,id,{type:'stroke',stroke:{group:crypto.randomUUID(),points:[[.2,.4],[.4,.3],[.7,.6]],ink:'rose',erase:false}});
      await capture(partner.page,`${kind}-stroke-${partner === a ? 1440 : 390}`);
      expect((await action(partner,id,{type:'drawing-guess',text:prompt})).status()).toBe(200);
    }
    await expect(a.page.getByRole('button',{name:'Next round'})).toBeVisible();
    await capture(a.page,`${kind}-round-1440`);
    await readyBoth(a,b);
  } finally { await close(); }
});

test('keyboard navigation, flip preview and branded error', async ({ page }) => {
  await page.setViewportSize({width:360,height:800});
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name:'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main-content$/);
  const preview = page.getByRole('button', { name:'Turn me over' });
  await preview.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.preview-card')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.preview-card')).toHaveAttribute('aria-busy','false');
  await page.goto('/room/short-invite');
  await expect(page.getByRole('heading', { name:'That invite looks off.' })).toBeVisible();
  await capture(page,'invalid-invite-360');
  await page.goto('/the-invitation-is-lost');
  await expect(page.getByRole('heading', { name:'This note got lost.' })).toBeVisible();
  await capture(page,'not-found-360');
});
