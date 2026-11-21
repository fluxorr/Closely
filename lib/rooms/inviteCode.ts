export const roomCodePattern = /^[A-Z0-9]{6}$/;

export function normalizeRoomCode(value: string) {
  return value.replace(/[\s-]/g, '').toUpperCase();
}
