import { expect, test, type Page, type Route } from '@playwright/test';
import { join } from 'node:path';
import { action, joinPair, players, snapshot } from './browser-helpers';

async function capture(page: Page, name: string) {
  const folder = process.env.CLOSELY_NEVER_CAPTURE;
  if (!folder) return;
  await page.evaluate(async () => { await document.fonts.ready; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: join(folder, `never-${name}.png`), animations: 'disabled', style: 'nextjs-portal { visibility: hidden !important; }' });
}

test('two players seal, reveal, pass, reconnect, and finish an untimed game', async ({ browser, baseURL }, info) => {
  const { a, b, close } = await players(browser, baseURL!);
  try {
    const { id } = await joinPair(a, b);
    await info.attach('test-room', { body: id, contentType: 'text/plain' });
    await a.page.getByRole('button', { name: 'Play Never Have I Ever', exact: true }).click();
    for (const player of [a, b]) await expect(player.page.getByRole('heading', { name: 'Two picks, one reveal.' })).toBeVisible();
    await capture(a.page, 'lobby-1440');
    await capture(b.page, 'lobby-390');

    await a.page.bringToFront();
    await a.page.getByLabel('Sound settings').click();
    const effects = a.page.getByRole('checkbox', { name: 'Sound effects' });
    await expect(effects).not.toBeChecked();
    const audio = a.page.waitForResponse(response => response.url().endsWith('/assets/audio/paper-reveal.mp3'), { timeout: 7000 });
    await effects.check();
    expect((await audio).ok()).toBe(true);
    await expect(a.page.getByRole('slider', { name: 'Volume' })).toBeEnabled();
    await effects.uncheck();
    await a.page.keyboard.press('Escape');

    for (const player of [a, b]) await player.page.getByLabel('Include After Hours').check();
    await a.page.getByRole('button', { name: 'I’m ready' }).click();
    await expect(a.page.getByRole('button', { name: 'Waiting for Sam…' })).toBeDisabled();
    await b.page.getByRole('button', { name: 'I’m ready' }).click();
    await expect(a.page.getByRole('button', { name: 'I have', exact: true })).toBeEnabled();
    await expect(a.page.getByRole('timer')).toHaveCount(0);
    await expect(a.page.getByText('Sam is thinking about it…')).toBeVisible();
    await capture(b.page, 'choosing-390');

    await a.page.getByRole('button', { name: 'I have', exact: true }).click();
    await expect(a.page.getByText('Waiting for Sam to choose…')).toBeVisible();
    const privateView = await snapshot(b, id);
    expect(privateView.game).toMatchObject({ locked: [true, false], answers: null, ownAnswer: null, deadline: null });
    await expect(b.page.getByText('Jo has picked. Your turn.')).toBeVisible();
    await capture(a.page, 'waiting-1440');

    const match = new RegExp(`/api/rooms/${id}$`);
    const disconnect = async (route: Route) => {
      if (route.request().method() === 'GET') await route.abort();
      else await route.continue();
    };
    await b.page.route(match, disconnect);
    await expect(b.page.getByText('Reconnecting to your room…')).toBeVisible();
    await expect(b.page.getByRole('button', { name: 'Neverrr' })).toBeDisabled();
    await capture(b.page, 'offline-390');
    await b.page.unroute(match, disconnect);
    await b.page.reload();
    await expect(b.page.getByRole('button', { name: 'Neverrr' })).toBeEnabled();

    await b.page.getByRole('button', { name: 'Neverrr' }).click();
    for (const player of [a, b]) {
      await expect(player.page.getByText('We don’t match.')).toBeVisible();
      const choices = player.page.getByRole('group', { name: 'Choice stamps' });
      await expect(choices).toContainText('Jo');
      await expect(choices).toContainText('Sam');
      await expect(choices).toContainText('I have');
      await expect(choices).toContainText('Neverrr');
    }
    await capture(a.page, 'reveal-1440');
    await capture(b.page, 'reveal-390');

    for (const player of [a, b]) await player.page.getByRole('button', { name: 'Next prompt' }).click();
    await expect(b.page.getByText('After Hours', { exact: true })).toBeVisible();
    await a.page.emulateMedia({ reducedMotion: 'no-preference' });
    for (const player of [a, b]) await player.page.getByRole('button', { name: 'Neverrr' }).click();
    await expect(a.page.getByText('We match!')).toBeVisible();
    const mascot = a.page.locator('.never-characters img');
    await expect(mascot).toHaveCSS('animation-name', 'never-hop');
    await a.page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(mascot).toHaveCSS('animation-name', 'none');
    await capture(a.page, 'match-1440');
    for (const player of [a, b]) await player.page.getByRole('button', { name: 'Next prompt' }).click();
    await a.page.getByRole('button', { name: 'Neverrr' }).click();
    await b.page.getByRole('button', { name: 'Pass this prompt' }).click();
    await expect(a.page.getByText('Any sealed picks stay private.')).toBeVisible();
    expect((await snapshot(b, id)).game?.answers).toEqual([null, null]);

    const total = (await snapshot(a, id)).game!.total;
    for (let round = 3; round < total; round++) {
      expect((await action(a, id, { type: 'ready' })).ok()).toBe(true);
      expect((await action(b, id, { type: 'ready' })).ok()).toBe(true);
      expect((await action(a, id, { type: 'never-pass' })).ok()).toBe(true);
    }
    expect((await action(a, id, { type: 'ready' })).ok()).toBe(true);
    expect((await action(b, id, { type: 'ready' })).ok()).toBe(true);
    await expect(a.page.getByText('That stays between us.')).toBeVisible();
    await expect(a.page.getByText(`2 of ${total} prompts answered together.`)).toBeVisible();
    await capture(a.page, 'results-1440');

    await a.page.getByRole('button', { name: 'Play again' }).click();
    await expect(b.page.getByRole('heading', { name: 'Another round?' })).toBeVisible();
    await expect(b.page.getByLabel('Include After Hours')).not.toBeChecked();
  } finally { await close(); }
});
