import type { RoomView } from '@/lib/rooms/state';

export type RoomSnapshot = RoomView & { realtime: boolean };

let handoff: { snapshot: RoomSnapshot; until: number } | undefined;

export function handOffRoom(snapshot: RoomSnapshot) {
  handoff = { snapshot, until: Date.now() + 30000 };
}

export function initialRoom(id: string) {
  return handoff?.snapshot.id === id && handoff.until > Date.now() ? handoff.snapshot : null;
}

export function clearRoomHandoff(id: string) {
  if (handoff?.snapshot.id === id) handoff = undefined;
}
