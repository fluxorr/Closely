import { expect, test } from '@playwright/test';
import { joinPair, players, snapshot } from './browser-helpers';

test('auction seals bids, advances on its own, and fits a narrow room header', async ({ browser, baseURL }, info) => {
  const { a, b, close } = await players(browser, baseURL!);
  try {
    const { id } = await joinPair(a, b);
    await info.attach('test-room', { body: id, contentType: 'text/plain' });
    await a.page.getByRole('button', { name: 'Play Date Night Auction' }).click();
    await b.page.getByRole('button', { name: 'Open the auction' }).click();
    await expect(a.page.getByRole('button', { name: 'Bid 3 coins' })).toBeEnabled();
    for (const width of [320, 360, 390]) {
      await b.page.setViewportSize({ width, height: 844 });
      const nav = await b.page.locator('.room-header .actions').evaluate(node => Array.from(node.children).map(child => child.getBoundingClientRect().top));
      expect(Math.max(...nav) - Math.min(...nav)).toBeLessThan(4);
      expect(await b.page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
    }
    const capture = process.env.CLOSELY_AUCTION_CAPTURE;
    if (capture) {
      await a.page.screenshot({ path: `${capture}/auction-1440.png`, animations: 'disabled' });
      await b.page.setViewportSize({ width: 320, height: 844 });
      await b.page.screenshot({ path: `${capture}/auction-320.png`, animations: 'disabled' });
    }
    await a.page.getByRole('button', { name: 'Bid 3 coins' }).click();
    await expect(a.page.getByText('Your 3-coin bid is sealed.')).toBeVisible();
    expect((await snapshot(b, id)).game?.auction?.bids).toBeNull();
    await b.page.getByRole('button', { name: 'Bid 2 coins' }).click();
    await expect(b.page.getByText('Sold!', { exact: true })).toBeVisible();
    await expect(b.page.getByText('9 coins left')).toBeVisible();
    await expect(a.page.getByText('Lot 2 of 6')).toBeVisible();
    await expect(b.page.getByText('Lot 2 of 6')).toBeVisible();
  } finally { await close(); }
});
