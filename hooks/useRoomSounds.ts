'use client';

import { useEffect, useRef } from 'react';
import { playSound, type SoundCue } from '@/lib/audio/sound';
import type { RoomView } from '@/lib/rooms/state';

function cueFor(previous: RoomView, next: RoomView): SoundCue | undefined {
  const { seat, card, game } = next;
  const oldGame = previous.game;
  const oldCard = previous.card;
  if (!previous.players[1] && next.players[1]) return 'notice';
  if (game?.phase === 'results' && oldGame?.phase !== 'results') return 'finish';
  if (game?.phase === 'resolving' && (oldGame?.phase !== 'resolving' || previous.sessionId !== next.sessionId)) {
    return game.kind === 'never' && !game.answers?.some(Boolean) ? 'card' : 'reveal';
  }
  if (card?.answers && !oldCard?.answers) return 'reveal';
  if (game?.phase === 'playing' && game.prompt && (oldGame?.phase !== 'playing' || previous.sessionId !== next.sessionId)) return 'card';
  if (card?.cardId && (card.id !== oldCard?.id || oldCard.phase === 'concealed' && card.phase === 'revealed')) return 'card';
  if (card?.ready[seat] && !oldCard?.ready[seat] || game?.phase === 'playing' && game.locked[seat] && !oldGame?.locked[seat]) return 'sealed';
  const latest = next.messages.at(-1);
  if (latest && latest.seat !== seat && latest.id !== previous.messages.at(-1)?.id) return 'notice';
}

export function useRoomSounds(view: RoomView | null) {
  const last = useRef<RoomView | null>(null);
  useEffect(() => {
    const previous = last.current;
    last.current = view;
    if (!view || !previous || previous.id !== view.id || previous.version >= view.version) return;
    const cue = cueFor(previous, view);
    if (cue) void playSound(cue);
  }, [view]);
}
