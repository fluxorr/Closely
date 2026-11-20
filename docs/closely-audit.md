# Closely 2.0 repository audit

The baseline is the existing Next 16.2.4 App Router, React 19, strict TypeScript and Tailwind 4 application. `bun.lock` is the tracked lockfile. The baseline has ESLint and no checked-in automated test harness.

| Entry | Baseline data flow |
| --- | --- |
| `/` | Generates a six-character room ID in the browser and navigates to the room. |
| `/room/[id]` | Browser owns category, card flip, name and recently used indexes. Polling reads a shared card index, chat and reactions. |
| `/room/[id]/games` | Clients calculate Tic-Tac-Toe and Rock Paper Scissors results and post full game state. Hot Potato renders a message only. Couple Trivia exists as an unused component. |
| `/api/room/[id]` | GET creates process-memory rooms and exposes their whole state. POST stores unchecked client patches. No membership, seat limit, persistence, version checks or idempotency. |
| Metadata and offline | Metadata used an example hostname. The offline service worker references a missing route and caches API responses without a privacy boundary. |

The six visible card categories and all original prompt modules are preserved. The `game` category is also present in the source type. Legacy room paths must be recognized with an explicit compatible join flow. Existing memory-only state cannot be exported across server instances.

## Migration order

1. Capture the existing browser experience and references. Translate the attached two-ghost C into a production vector and establish the Soft-Play Editorial illustration family and tokens.
2. Add a separate PostgreSQL schema for versioned room snapshots, idempotency receipts, rate limits and outbox. Keep room updates, receipts and invalidation events in the same transaction. Use a signed HttpOnly browser credential and hashed per-seat identity. Lock the room row for seat assignment and actions.
3. Reuse room URLs with an authorized snapshot endpoint and scoped Ably version notifications. Recovery uses snapshot reads and reconnect. Keep answer text, private roles and drawing prompts off shared events. Replace the service worker on the same URL and evict its legacy cache.
4. Migrate synchronized decks and consent, then shared lifecycle and classics, then the three 2.0 games with original artwork. Keep the 2.1 catalogue off the 2.0 screens until its own gate passes.

## Deployment and rollback

Use separate Neon branches for preview and production. Apply the versioned SQL before deploying the application. Configure `DATABASE_URL`, `SESSION_SECRET`, `ABLY_API_KEY` and `CRON_SECRET` in each Vercel environment. Keep the old deployment available during the preview gate. Roll back to the prior deployment if necessary and retain the additive tables for recovery. The legacy application cannot interpret new snapshots, so a rollback pauses access to 2.0 rooms until 2.0 is restored. Do not destroy room data during a deployment rollback.

## Baseline and reference captures

See `artifacts/closely/baseline-*` and `artifacts/closely/reference-*`. Cofounder uses a continuous illustrated world with enough detail to reward a second look. Closely borrows the storytelling role of the image and gives its twilight scene a quiet, separate frame. Stick It Up uses outlined sticker silhouettes and small interactive accents. Closely adopts a single specimen around the invitation and a restrained celebration accent. Source screenshots are reference evidence only.

Baseline deck count is 450 unique IDs across seven source categories, including the six visible categories and the embedded `game` category. The latter is preserved in the original source modules.

Room actions share one endpoint so activity arbitration, versioning, the idempotency receipt and related side effects use the same transaction. Private projections omit internal state and secret prompt seed. Realtime events carry only a version. PostgreSQL retains complete strokes and periodic chunks of longer strokes, rather than pointer events. Presence messages enter the scoped Ably channel while the room uses server-recorded heartbeats to recover connection status during transport interruptions.

The migrated Random deck includes the original 30 game prompts. Random keeps Spicy and Naughty behind explicit selection, and uses the same per-category used IDs as direct deck selection. Skipping or passing a private card discards its sealed answer immediately.
