import { z } from 'zod';
import { categories, gameIds, inkColors, reactions } from './catalog';

const clean = (max: number) => z.string().trim().min(1).max(max);
const name = clean(32).regex(/^[^\p{Cc}\p{Cf}]+$/u);
const roomId = z.union([z.uuid(), z.string().regex(/^[A-Z0-9]{6}$/)]);
export const entry = z.object({ name, avatar: z.number().int().min(0).max(5).default(0) });
export const join = entry.extend({ id: roomId.optional(), invite: z.string().trim().max(64).optional() });
export const roomIdSchema = roomId;
export const cardMode = z.enum(['talk', 'reveal']);
export const stroke = z.object({
  group: z.uuid(),
  points: z.array(z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)])).min(1).max(180),
  ink: z.enum(inkColors),
  erase: z.boolean(),
});
export type Stroke = z.infer<typeof stroke>;
export const roomAction = z.discriminatedUnion('type', [
  z.object({ type: z.literal('cards'), category: z.enum(categories), mode: cardMode }),
  z.object({ type: z.literal('game'), game: z.enum(gameIds) }),
  z.object({ type: z.literal('respond'), accept: z.boolean() }),
  z.object({ type: z.literal('flip') }),
  z.object({ type: z.literal('discuss') }),
  z.object({ type: z.literal('next') }),
  z.object({ type: z.literal('skip') }),
  z.object({ type: z.literal('shuffle') }),
  z.object({ type: z.literal('card-answer'), text: clean(600).nullable() }),
  z.object({ type: z.literal('return') }),
  z.object({ type: z.literal('chat'), text: clean(400) }),
  z.object({ type: z.literal('reaction'), emoji: z.enum(reactions) }),
  z.object({ type: z.literal('ready'), afterHours: z.boolean().optional() }),
  z.object({ type: z.literal('never-answer'), choice: z.enum(['have', 'never']) }),
  z.object({ type: z.literal('never-pass') }),
  z.object({ type: z.literal('play-again') }),
  z.object({ type: z.literal('answer'), text: clean(120) }),
  z.object({ type: z.literal('story'), text: clean(600) }),
  z.object({ type: z.literal('guess'), choice: z.enum(['truth', 'invent']) }),
  z.object({ type: z.literal('stroke'), stroke }),
  z.object({ type: z.literal('drawing-clear') }),
  z.object({ type: z.literal('drawing-undo') }),
  z.object({ type: z.literal('drawing-guess'), text: clean(100) }),
  z.object({ type: z.literal('move'), cell: z.number().int().min(0).max(8) }),
  z.object({ type: z.literal('choice'), choice: z.enum(['rock', 'paper', 'scissors']) }),
  z.object({ type: z.literal('pass-potato') }),
]);
export type RoomAction = z.infer<typeof roomAction>;
export const envelope = z.object({ actionId: z.uuid(), sessionId: z.string().max(120), expectedVersion: z.number().int().nonnegative(), action: roomAction });
