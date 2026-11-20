import { expect, test } from '@playwright/test';
import { action, joinPair, players, readyBoth, snapshot, startGame, type Player } from './browser-helpers';

async function gameEvidence(a: Player, b: Player, name: string) {
  if (!process.env.CLOSELY_CAPTURE) return;
  const directory = 'artifacts/closely';
  await a.page.screenshot({ path: `${directory}/${name}-result-1440.png`, animations:'disabled' });
  await b.page.screenshot({ path: `${directory}/${name}-result-390.png`, animations:'disabled' });
  await b.context.setOffline(true);
  await expect(b.page.getByText('Reconnecting to your room…')).toBeVisible();
  await b.page.screenshot({ path: `${directory}/${name}-reconnecting-390.png`, animations:'disabled' });
  await b.context.setOffline(false);
  await expect(b.page.getByRole('button', { name:'Rematch' })).toBeEnabled();
}


test('Same Brain locks both answers, scores streaks and completes a rematch', async ({ browser, baseURL }) => {
  const { a,b,close } = await players(browser,baseURL!,'Brain');
  try {
    const { id } = await joinPair(a,b);
    await startGame(a,b,'same');
    for (let round=0; round < 5; round++) {
      await a.page.getByLabel('Your answer').fill('  midnight   Snack ');
      await a.page.getByRole('button', { name:'Lock answer' }).click();
      await expect(a.page.getByText('Locked. Waiting for')).toBeVisible();
      expect((await snapshot(b,id)).game?.answers).toBeNull();
      expect((await snapshot(b,id)).game?.ownAnswer).toBeNull();
      if (round === 1) {
        await b.page.reload();
        await expect(b.page.getByLabel('Your answer')).toBeVisible();
        expect((await snapshot(b,id)).game?.round).toBe(round);
      }
      await b.page.getByLabel('Your answer').fill('MIDNIGHT snack');
      await b.page.getByRole('button', { name:'Lock answer' }).click();
      await expect(a.page.getByRole('heading', { name:'Same brain!', exact:true })).toBeVisible();
      await readyBoth(a,b,round === 4);
    }
    for (const player of [a,b]) await expect(player.page.getByRole('heading', { name:'You did it together.' })).toBeVisible();
    expect((await snapshot(a,id)).game?.scores).toEqual([9,9]);
    await gameEvidence(a,b,'same');
    await a.page.getByRole('button', { name:'Rematch' }).click();
    await b.page.getByRole('button', { name:'I’m ready' }).click();
    await expect(a.page.getByLabel('Your answer')).toBeVisible();
    expect((await snapshot(a,id)).game?.scores).toEqual([0,0]);
  } finally { await close(); }
});

test('Bluff My Love keeps storyteller instructions private and alternates six rounds', async ({ browser, baseURL }) => {
  const { a,b,close } = await players(browser,baseURL!,'Bluff');
  try {
    const { id } = await joinPair(a,b);
    await startGame(a,b,'bluff');
    let previous: number | undefined;
    for (let round=0; round < 6; round++) {
      await expect.poll(async () => (await snapshot(a,id)).game?.phase).toBe('playing');
      const host = await snapshot(a,id);
      const actor = host.game!.actor;
      if (previous !== undefined) expect(actor).not.toBe(previous);
      previous = actor;
      const teller = actor === 0 ? a : b, guesser = actor === 0 ? b : a;
      const instruction = (await snapshot(teller,id)).game!.instruction!;
      expect((await snapshot(guesser,id)).game?.instruction).toBeNull();
      await teller.page.getByLabel('Your story').fill('I wore my dressing gown to a fancy dinner.');
      await teller.page.getByRole('button', { name:'Send story' }).click();
      await expect(guesser.page.getByText('I wore my dressing gown to a fancy dinner.')).toBeVisible();
      expect((await snapshot(guesser,id)).game?.instruction).toBeNull();
      await guesser.page.getByRole('button', { name:instruction === 'truth' ? 'Truth' : 'Invented', exact:true }).click();
      await expect(teller.page.getByText('You saw right through it.')).toBeVisible();
      await readyBoth(a,b,round === 5);
    }
    for (const player of [a,b]) {
      await expect(player.page.getByRole('heading', { name:'It’s a tie.' })).toBeVisible();
      expect((await snapshot(player,id)).game?.scores).toEqual([3,3]);
    }
    await gameEvidence(a,b,'bluff');
  } finally { await close(); }
});

test('Draw Me Wrong syncs strokes, hides prompts and restores canvas after refresh', async ({ browser, baseURL }) => {
  const { a,b,close } = await players(browser,baseURL!,'Draw');
  try {
    const { id } = await joinPair(a,b);
    await startGame(a,b,'draw');
    for (let round=0; round < 4; round++) {
      await expect.poll(async () => (await snapshot(a,id)).game?.phase).toBe('playing');
      const actor = (await snapshot(a,id)).game!.actor;
      const drawer = actor === 0 ? a : b, guesser = actor === 0 ? b : a;
      const prompt = (await snapshot(drawer,id)).game!.prompt!;
      expect((await snapshot(guesser,id)).game?.prompt).toBeNull();
      const canvas = drawer.page.locator('canvas');
      await canvas.scrollIntoViewIfNeeded();
      const bounds = (await canvas.boundingBox())!;
      await drawer.page.mouse.move(bounds.x + 30, bounds.y + 35);
      await drawer.page.mouse.down();
      await drawer.page.mouse.move(bounds.x + 105, bounds.y + 56, { steps: 8 });
      await drawer.page.mouse.up();
      await expect.poll(async () => (await snapshot(guesser,id)).game?.drawing.length).toBeGreaterThan(0);
      if (round === 0) {
        await guesser.page.reload();
        await expect(guesser.page.locator('canvas')).toBeVisible();
        expect((await snapshot(guesser,id)).game?.drawing[0].points.length).toBeGreaterThan(1);
      }
      await guesser.page.getByLabel('Your guess').fill(prompt);
      await guesser.page.getByRole('button', { name:'Guess', exact:true }).click();
      await expect(drawer.page.getByRole('heading', { name:'You got the picture!' })).toBeVisible();
      await readyBoth(a,b,round === 3);
    }
    for (const player of [a,b]) await expect(player.page.getByRole('button', { name:'Rematch' })).toBeVisible();
    expect((await snapshot(a,id)).game?.scores).toEqual((await snapshot(b,id)).game?.scores);
    await gameEvidence(a,b,'draw');
  } finally { await close(); }
});

test('classics derive results and turns from the server', async ({ browser, baseURL }) => {
  const { a,b,close } = await players(browser,baseURL!,'Classics');
  try {
    const { id } = await joinPair(a,b);
    await startGame(a,b,'ttt');
    await expect(a.page.getByRole('heading', { name:'Your turn' })).toBeVisible();
    expect((await action(b,id,{type:'move',cell:8})).status()).toBe(422);
    for (const [player,cell] of [[a,1],[b,4],[a,2],[b,5],[a,3]] as const) {
      await player.page.getByRole('button', { name:`Cell ${cell}, empty` }).click();
    }
    await expect(b.page.getByText('Three in a row!')).toBeVisible();
    await readyBoth(a,b,true);
    await expect(a.page.getByRole('heading', { name:'You won!' })).toBeVisible();
    await a.page.getByRole('button', { name:'Back to room' }).click();
    await startGame(a,b,'rps');
    await a.page.getByRole('button', { name:'Rock', exact:true }).click();
    expect((await snapshot(b,id)).game?.answers).toBeNull();
    await b.page.getByRole('button', { name:'Scissors', exact:true }).click();
    await readyBoth(a,b,true);
    await expect(a.page.getByRole('heading', { name:'You won!' })).toBeVisible();
    await a.page.getByRole('button', { name:'Back to room' }).click();
    await startGame(a,b,'potato');
    await expect.poll(async () => (await snapshot(a,id)).game?.phase).toBe('playing');
    const holder = (await snapshot(a,id)).game!.holder;
    await (holder === 0 ? a : b).page.getByRole('button', { name:'Pass the potato' }).click();
    expect((await snapshot(a,id)).game?.holder).toBe(1-holder);
    await expect(a.page.getByText('Pop! The potato went off.')).toBeVisible({ timeout: 26_000 });
    await readyBoth(a,b,true);
    expect((await snapshot(a,id)).game?.winner).toBe(holder);
  } finally { await close(); }
});
