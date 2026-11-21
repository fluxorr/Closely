import { sql } from 'drizzle-orm';
import { bigint, check, index, integer, jsonb, pgTable, primaryKey, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { RoomState } from '@/lib/rooms/state';

const milliseconds = (name: string) => bigint(name, { mode: 'number' });
export const rooms = pgTable('closely_rooms', {
  id: text('id').primaryKey(), inviteHash: text('invite_hash').notNull().unique(),
  displayCode: text('display_code').notNull().default(sql`closely_invite_code()`),
  version: integer('version').notNull().default(0), state: jsonb('state').$type<RoomState>().notNull(),
  expires: milliseconds('expires_at').notNull(), seen0: milliseconds('seen_0').notNull(), seen1: milliseconds('seen_1').notNull().default(0),
}, table => [
  index('closely_rooms_expires').on(table.expires),
  uniqueIndex('closely_rooms_display_code_key').on(table.displayCode),
  check('closely_rooms_display_code_check', sql`${table.displayCode} ~ '^[0-9A-HJKMNP-TV-Z]{6}$'`),
]);
export const receipts = pgTable('closely_receipts', {
  room: text('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }), seat: integer('seat').notNull(),
  id: uuid('id').notNull(), hash: text('hash').notNull(),
}, table => [primaryKey({ columns: [table.room, table.seat, table.id] })]);
export const outbox = pgTable('closely_outbox', {
  room: text('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }), version: integer('version').notNull(),
  created: milliseconds('created_at').notNull(), sent: milliseconds('sent_at'),
}, table => [primaryKey({ columns: [table.room, table.version] }), index('closely_outbox_pending').on(table.sent, table.created)]);
export const limits = pgTable('closely_limits', {
  key: text('key').primaryKey(), window: milliseconds('window_start').notNull(), hits: integer('hits').notNull(),
}, table => [index('closely_limits_window').on(table.window)]);
