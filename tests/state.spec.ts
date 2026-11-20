import { expect, test } from '@playwright/test';
import { ALL_CARDS } from '../lib/cards';
import { makeRoom, applyRoomAction, roomView } from '../lib/rooms/state';
import { newMatch, playMatch, tickMatch, gameView } from '../lib/rooms/game';

const player = { name:'Guest', avatar:1, credential:'guest', joinedAt:0 };
test('retains all prompts, has unique IDs and exhausts a deterministic deck', () => {
  expect(ALL_CARDS).toHaveLength(450);
  expect(new Set(ALL_CARDS.map(c => c.id)).size).toBe(450);
  const room = makeRoom(player);
  room.players[1] = { ...player, credential:'guest2' };
  const length = ALL_CARDS.filter(c => c.category === 'memory').length;
  const mutate = (seat: 0 | 1, action: Parameters<typeof applyRoomAction>[2]) => expect(applyRoomAction(room,seat,action,'test-room',crypto.randomUUID(),0)).toBeTruthy();
  mutate(0,{type:'cards', mode:'talk', category:'memory'});
  const used = new Set<string>();
  for (let i=0; i<length; i++) {
    used.add(room.card!.cardId!);
    mutate(0,{type:'flip'});
    mutate(1,{type:'next'});
    mutate(0,{type:'respond',accept:true});
  }
  expect(used.size).toBe(length);
  expect(room.history).toHaveLength(length);
  expect(room.card?.phase).toBe('exhausted');
  mutate(0,{type:'shuffle'});
  expect(room.decks.memory?.cycle).toBe(1);
  expect(room.history).toHaveLength(length);
  expect(roomView({id:'test-room',version:1,state:room},1,0,[0,0],'invite').card?.text).toBeNull();
});
test('server clock settles expired rounds and player projection hides drawing prompt', () => {
  const game = newMatch('draw','match',3);
  expect(playMatch(game,0,{type:'ready'},10)).toBe(true);
  expect(playMatch(game,1,{type:'ready'},10)).toBe(true);
  expect(tickMatch(game,2509)).toBe(false);
  expect(tickMatch(game,2510)).toBe(true);
  const player0 = gameView(game,0), player1 = gameView(game,1);
  expect(player0.prompt).toBeNull();
  expect(player1.prompt).toBeTruthy();
  expect(tickMatch(game,77510)).toBe(true);
  expect(game.phase).toBe('resolving');
  expect(gameView(game,0).prompt).toBe(player1.prompt);
});

test('Random deals every nonsensitive source card and passing drops sealed responses', () => {
  const room = makeRoom(player);
  room.players[1] = { ...player, credential:'guest2' };
  const mutate = (seat: 0 | 1, action: Parameters<typeof applyRoomAction>[2]) => expect(applyRoomAction(room,seat,action,'test-room',crypto.randomUUID(),0)).toBeTruthy();
  mutate(0,{type:'cards', mode:'talk', category:'all'});
  const expected = ALL_CARDS.filter(card => card.category !== 'naughty' && card.category !== 'spicy');
  const dealt = new Set<string>();
  for (let n = 0; n < expected.length; n++) {
    dealt.add(room.card!.cardId!);
    mutate(0,{type:'flip'});
    mutate(0,{type:'next'});
    mutate(1,{type:'respond',accept:true});
  }
  expect(dealt).toEqual(new Set(expected.map(c => c.id)));
  expect(room.card?.phase).toBe('exhausted');
  mutate(0,{type:'shuffle'});
  mutate(0,{type:'cards', mode:'reveal', category:'deep'});
  mutate(1,{type:'respond',accept:true});
  mutate(1,{type:'flip'});
  mutate(0,{type:'card-answer',text:'This should be discarded'});
  mutate(1,{type:'card-answer',text:null});
  expect(room.card?.phase).toBe('skipped');
  expect(JSON.stringify(room)).not.toContain('This should be discarded');
});
