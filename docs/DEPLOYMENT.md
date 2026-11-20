# Vercel preview setup

The existing Closely project was found on Vercel. Its Preview environment had no configured variables when checked on November 21, 2026.

1. Create a dedicated Neon PostgreSQL branch for Preview. Apply `src/database/migrations/0001_rooms.sql` with `psql -v ON_ERROR_STOP=1` against that branch. Use the pooled TLS URL as `DATABASE_URL` in Vercel.
2. Create or use a dedicated Ably app. Scope its backend API key to `closely:room:*` with publish, subscribe and presence. Set it as `ABLY_API_KEY`. Browsers receive signed token requests scoped to their own channel, with subscribe and presence only. [Ably capability reference](https://ably.com/docs/auth/capabilities)
3. Add independent random `SESSION_SECRET` and `CRON_SECRET` values in Preview. Rotating the session secret invalidates active guest sessions and invite codes. Set separate values and resources in Production before a production release.
4. Deploy to a Preview first. Run the Playwright suite against the Preview URL via `CLOSELY_BASE_URL`, using Vercel’s approved preview authentication if needed. Verify both browsers really establish Ably connections. Confirm message delivery, reconnect and version recovery with duplicate or dropped events. Confirm scoped tokens cannot attach to other room channels.
5. Check the configured Vercel cron and run a maintenance smoke test with expired fixture rooms. The daily schedule is compatible with Vercel’s daily cron tier. Every mutation also schedules outbox dispatch immediately after commit.

Rooms remain playable through authenticated snapshots when Ably cannot connect. The primary validation of database persistence was on an isolated local PostgreSQL instance. Production Neon, Ably and Vercel execution needs the preview environment above.
