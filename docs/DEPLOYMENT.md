# Manual setup

Copy `.env.example` to `.env.local` for local testing. The four values belong on the server. Use independently generated session and cron secrets and add the values directly to your environment.

| Variable | Where to get it | When it is needed |
| --- | --- | --- |
| `DATABASE_URL` | Neon project **Connect** dialog. Select the test branch, database, and role. Copy the pooled connection URI with its TLS parameters. | Required for rooms, chat, and games. A local PostgreSQL URI also works. [Neon connection guide](https://neon.com/docs/connect/connect-from-any-app) |
| `SESSION_SECRET` | Run `openssl rand -hex 32` and use the generated value. | Required to sign guest sessions and invites. Keep the same value while testing the same rooms. |
| `ABLY_API_KEY` | Open an Ably app’s **API Keys** tab. Create a key scoped to channel resource `closely:room:*` with `publish`, `subscribe`, and `presence`. Copy the full key, including the part after the colon. | Required for Ably events and presence. When it is empty, rooms still work through polling. [Ably key capabilities](https://ably.com/docs/auth/capabilities) |
| `CRON_SECRET` | Run `openssl rand -hex 32` again and use the new value. | Required for automated cleanup and outbox retries in production. Optional for gameplay testing. [Vercel Cron security](https://vercel.com/docs/schedules/cron-jobs/manage-cron-jobs#securing-cron-jobs) |

## Local test

1. Run [`0001_rooms.sql`](../src/database/migrations/0001_rooms.sql) followed by [`0002_questions.sql`](../src/database/migrations/0002_questions.sql) and [`0003_never_have_i_ever.sql`](../src/database/migrations/0003_never_have_i_ever.sql) against the test database. In Neon, select that branch and database in the SQL Editor, paste each migration, and run it in order. If you prefer `psql`, use the direct connection URI in your shell variable `NEON_DIRECT_URL` and pass the files in order with `psql -v ON_ERROR_STOP=1 "$NEON_DIRECT_URL" -f src/database/migrations/0001_rooms.sql -f src/database/migrations/0002_questions.sql -f src/database/migrations/0003_never_have_i_ever.sql`.
2. [Add your question rows](QUESTIONS.md) to test the card decks and prompt-based games. From the Closely folder, run `bun install` and `bun run dev`. Open the URL printed by Next.js.
3. Create a room in a regular browser window. Use its invite link in a private window or a different browser profile, and join with a different name. Check a shared card flip, private-answer reveal, chat, a game, and refreshing one player partway through.
4. To confirm Ably is active, look for a successful `POST /api/rooms/<id>/realtime` followed by a live Ably WebSocket connection in the browser’s Network panel. The page can still sync via polling even if that connection fails.

## Vercel preview and production

1. In the Closely project, open **Settings → Environment Variables**. Add `DATABASE_URL`, `SESSION_SECRET`, and `ABLY_API_KEY` to **Preview** and use a dedicated Neon test branch. Apply the migrations to that database once. Add `CRON_SECRET` there if you plan to call the maintenance endpoint manually.
2. Redeploy the preview after adding the values, then repeat the two-browser test. Vercel applies environment changes to new deployments. [Vercel environment variables](https://vercel.com/docs/environment-variables)
3. For a production release, create separate production values and apply the migrations to the production database. Test the preview before promoting the release.
4. Verify the daily cron configured in `vercel.json` in the production deployment logs. Vercel runs scheduled jobs in production and sends `CRON_SECRET` as the bearer token. [Vercel Cron troubleshooting](https://vercel.com/docs/schedules/cron-jobs/manage-cron-jobs#troubleshooting-cron-jobs)

Rotating `SESSION_SECRET` invalidates existing guest sessions and invite codes for that environment.
