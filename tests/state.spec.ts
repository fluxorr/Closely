import { expect, test } from '@playwright/test';
import { makeRoom, applyRoomAction, roomView, resetLegacyActivity } from '../lib/rooms/state';
import { playMatch, tickMatch, gameView } from '../lib/rooms/game';
import { selectionCategories, type CardQuestion, type GameQuestion, type QuestionBank } from '../lib/rooms/questions';

const player = { name:'Guest', avatar:1, credential:'guest', joinedAt:0 };
const fixture = (category: CardQuestion['category']): CardQuestion => ({ id: crypto.randomUUID(), category, text: crypto.randomUUID() });
function questionBank(cards: CardQuestion[], game: GameQuestion[] = []): QuestionBank {
  return {
    async card({ category, mode, used }) {
      const enabled = cards.filter(card => selectionCategories(category, mode).includes(card.category));
      return enabled.find(card => !used.includes(card.id)) ?? (enabled.length ? 'exhausted' : null);
    },
    async game(_kind, _seed, limit) { return game.slice(0, limit); },
  };
}
function pair(bank: QuestionBank) {
  const room = makeRoom(player);
  room.players[1] = { ...player, credential:'guest2' };
  const mutate = (seat: 0 | 1, action: Parameters<typeof applyRoomAction>[2]) => applyRoomAction(room,seat,action,'test-room',crypto.randomUUID(),0,bank);
  return { room, mutate };
}

test('selected questions stay secret before flipping and do not repeat until a shuffle', async () => {
  const cards = Array.from({ length: 3 }, () => fixture('memory'));
  const { room, mutate } = pair(questionBank(cards));
  expect(await mutate(0,{type:'cards', mode:'talk', category:'memory'})).toBe(true);
  const used = new Set<string>();
  for (const card of cards) {
    expect(room.card?.cardId).toBe(card.id);
    expect(roomView({id:'test-room',version:1,state:room},1,0,[0,0],'invite').card?.text).toBeNull();
    used.add(card.id);
    expect(await mutate(0,{type:'flip'})).toBe(true);
    expect(roomView({id:'test-room',version:1,state:room},1,0,[0,0],'invite').card?.text).toBe(card.text);
    expect(await mutate(1,{type:'next'})).toBe(true);
    expect(await mutate(0,{type:'respond',accept:true})).toBe(true);
  }
  expect(used.size).toBe(cards.length);
  expect(room.history).toHaveLength(cards.length);
  expect(room.card?.phase).toBe('exhausted');
  expect(await mutate(0,{type:'shuffle'})).toBe(true);
  expect(room.decks.memory?.cycle).toBe(1);
  expect(room.history).toHaveLength(cards.length);
});

test('empty decks can be retried and classics work without published prompts', async () => {
  const cards: CardQuestion[] = [];
  const { room, mutate } = pair(questionBank(cards));
  expect(await mutate(0,{type:'game',game:'same'})).toBe('missing-questions');
  expect(room.activity).toBe('hub');
  expect(await mutate(0,{type:'cards', mode:'talk', category:'all'})).toBe(true);
  expect(room.card?.phase).toBe('empty');
  cards.push(fixture('fun'));
  expect(await mutate(0,{type:'shuffle'})).toBe(true);
  expect(room.card?.cardId).toBe(cards[0].id);
  expect(await mutate(0,{type:'game',game:'ttt'})).toBe(true);
  expect(await mutate(1,{type:'respond',accept:true})).toBe(true);
  expect(room.match?.kind).toBe('ttt');
});

test('a one-question match keeps answer keys private and ends after one round', async () => {
  const question = { id: crypto.randomUUID(), text: crypto.randomUUID(), answerTerms: ['test','term'] };
  const { room, mutate } = pair(questionBank([], [question]));
  expect(await mutate(0,{type:'game', game:'draw'})).toBe(true);
  const game = room.match!;
  expect(gameView(game,0).total).toBe(1);
  expect(playMatch(game,0,{type:'ready'},10)).toBe(true);
  expect(playMatch(game,1,{type:'ready'},10)).toBe(true);
  expect(tickMatch(game,2509)).toBe(false);
  expect(tickMatch(game,2510)).toBe(true);
  const actor = gameView(game,0).actor;
  const guesser = actor === 0 ? 1 : 0;
  expect(gameView(game,guesser).prompt).toBeNull();
  expect(gameView(game,actor).prompt).toBe(question.text);
  expect(gameView(game,guesser)).not.toHaveProperty('questions');
  expect(gameView(game,actor)).not.toHaveProperty('answerTerms');
  expect(playMatch(game,guesser,{type:'drawing-guess',text:' TEST-term '},2600)).toBe(true);
  expect(game.phase).toBe('resolving');
  expect(gameView(game,guesser).prompt).toBe(question.text);
  expect(playMatch(game,0,{type:'ready'},2610)).toBe(true);
  expect(playMatch(game,1,{type:'ready'},2610)).toBe(true);
  expect(game.phase).toBe('results');
});

test('passing removes sealed answers and legacy activity returns the room to its hub', async () => {
  const { room, mutate } = pair(questionBank([fixture('deep')]));
  await mutate(0,{type:'cards', mode:'reveal', category:'deep'});
  await mutate(1,{type:'flip'});
  const answer = crypto.randomUUID();
  await mutate(0,{type:'card-answer',text:answer});
  await mutate(1,{type:'card-answer',text:null});
  expect(room.card?.phase).toBe('skipped');
  expect(JSON.stringify(room)).not.toContain(answer);
  delete room.card!.content;
  expect(resetLegacyActivity(room)).toBe(true);
  expect(room.activity).toBe('hub');
  expect(room.history).toHaveLength(1);
  expect(room.players[1]?.credential).toBe('guest2');
});

test('Never Have I Ever has no clock, seals votes, and requires two After Hours opt-ins', async () => {
  const mild = { id: 'everyday', text: 'picked the music on a date', answerTerms: [] };
  const bold = { id: 'bolder', text: 'said what I really wanted', answerTerms: [], mature: true };
  const bank = questionBank([], [mild, { ...mild, id: 'second' }, bold]);
  const { room, mutate } = pair(bank);

  expect(await mutate(0, { type: 'game', game: 'never' })).toBe(true);
  const game = room.match!;
  expect(await mutate(0, { type: 'ready', afterHours: true })).toBe(true);
  expect(gameView(game, 1).prompt).toBeNull();
  expect(await mutate(1, { type: 'ready' })).toBe(true);
  expect(game.phase).toBe('playing');
  expect(game.deadline).toBeNull();
  expect(tickMatch(game, 600000)).toBe(false);

  expect(await mutate(0, { type: 'never-answer', choice: 'have' })).toBe(true);
  expect(gameView(game, 1)).toMatchObject({ locked: [true, false], answers: null, ownAnswer: null });
  expect(await mutate(0, { type: 'never-answer', choice: 'never' })).toBe(false);
  expect(await mutate(1, { type: 'never-pass' })).toBe(true);
  expect(gameView(game, 0).answers).toEqual([null, null]);
  expect(await mutate(0, { type: 'ready' })).toBe(false);
  expect(tickMatch(game, 2999)).toBe(false);
  expect(tickMatch(game, 3000)).toBe(true);
  expect(gameView(game, 1).never?.mature).toBe(false);

  await mutate(0, { type: 'never-answer', choice: 'have' });
  await mutate(1, { type: 'never-answer', choice: 'never' });
  expect(gameView(game, 0).answers).toEqual(['have', 'never']);
  expect(gameView(game, 1).answers).toEqual(['have', 'never']);
  expect(tickMatch(game, 3000)).toBe(true);
  expect(gameView(game, 1)).toMatchObject({ phase: 'results', answers: null, never: { revealed: 1 } });

  expect(await mutate(0, { type: 'play-again' })).toBe(true);
  const rematch = room.match!;
  expect(rematch.ready).toEqual([false, false]);
  await mutate(0, { type: 'ready', afterHours: true });
  await mutate(1, { type: 'ready', afterHours: true });
  expect(gameView(rematch, 0).prompt).toBe(mild.text);
  await mutate(0, { type: 'never-answer', choice: 'never' });
  await mutate(1, { type: 'never-answer', choice: 'never' });
  expect(tickMatch(rematch, 3000)).toBe(true);
  expect(gameView(rematch, 0)).toMatchObject({ phase: 'playing', prompt: bold.text, never: { mature: true } });
});
