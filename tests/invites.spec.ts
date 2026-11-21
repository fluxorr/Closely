import { expect, test, type Page } from '@playwright/test';
import { join } from 'node:path';
import { players } from './browser-helpers';

async function copyButton(page: Page, name: string | RegExp) {
  const copied = page.evaluate(() => new Promise<string>(resolve => {
    document.addEventListener('closely-test-clipboard', event => resolve((event as CustomEvent<string>).detail), { once: true });
  }));
  await page.getByRole('button', { name }).click();
  return copied;
}

test('copy a six-character code and join with it or the full invite link', async ({ browser, baseURL }, info) => {
  const { a, b, close } = await players(browser, baseURL!);
  try {
    await a.page.addInitScript(() => {
      Object.defineProperty(navigator.clipboard, 'writeText', {
        value: async (text: string) => document.dispatchEvent(new CustomEvent('closely-test-clipboard', { detail: text })),
        configurable: true,
      });
    });
    const makeRoom = async () => {
      const response = await a.context.request.post('/api/rooms', { data: { name: a.name } });
      expect(response.status()).toBe(201);
      const { id, view } = await response.json();
      await info.attach('test-room', { body: id, contentType: 'text/plain' });
      expect(view.code).toMatch(/^[0-9A-HJKMNP-TV-Z]{6}$/);
      await a.page.goto(`/room/${id}`);
      await expect(a.page.getByRole('heading', { name: 'A seat for your person.' })).toBeVisible();
      return { id, view };
    };

    const first = await makeRoom();
    const code = await copyButton(a.page, /^Copy code/);
    expect(code).toBe(first.view.code);
    if (process.env.CLOSELY_INVITE_CAPTURE) {
      for (const [width, height] of [[1440, 900], [390, 844]]) {
        await a.page.setViewportSize({ width, height });
        expect(await a.page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
        await a.page.screenshot({
          path: join(process.env.CLOSELY_INVITE_CAPTURE, `short-room-code-${width}.png`),
          animations: 'disabled',
          style: 'nextjs-portal { visibility: hidden !important; }',
        });
      }
      await a.page.setViewportSize({ width: 1440, height: 900 });
    }

    await b.page.goto('/');
    const button = b.page.locator('.hero').getByRole('button', { name: 'Join with code' });
    const dialog = b.page.getByRole('dialog');
    await expect(async () => {
      if (!await dialog.isVisible()) await button.click();
      await expect(dialog).toBeVisible({ timeout: 300 });
    }).toPass({ timeout: 6000 });
    await dialog.getByLabel('Invite link or code').fill(`${code.slice(0, 3).toLowerCase()}-${code.slice(3).toLowerCase()}`);
    await dialog.getByLabel('Your name').fill(b.name);
    await dialog.getByRole('button', { name: 'Join room' }).click();
    await expect(b.page).toHaveURL(new RegExp(`/room/${first.id}$`));
    await expect(b.page.getByRole('heading', { name: 'Here together.' })).toBeVisible();

    const second = await makeRoom();
    expect(second.view.code).not.toBe(code);
    const fullInvite = await copyButton(a.page, 'Copy invite link');
    expect(new URL(fullInvite).hash).toBe(`#invite=${second.view.invite}`);
    expect(second.view.invite).toHaveLength(22);
    await b.page.goto(fullInvite);
    await b.page.getByLabel('Your name').fill(b.name);
    await b.page.getByRole('button', { name: 'Join room' }).click();
    await expect(b.page.getByRole('heading', { name: 'Here together.' })).toBeVisible();
    await expect(b.page).toHaveURL(new RegExp(`/room/${second.id}$`));
  } finally { await close(); }
});
