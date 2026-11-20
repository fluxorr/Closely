# Closely

A private room for two. Share conversation cards, lock answers and reveal them together, chat, and play Same Brain, Bluff My Love, Draw Me Wrong, or three classic games.

## Run locally

Run the commands from the Closely directory. The Bun workflow is `bun install` followed by `bun run dev`. Local development uses Webpack to avoid the Turbopack compiler retry loop seen with Next.js 16.2.4. Version managers such as Vite+ can pick up `.node-version` for commands that use Node.js.

1. Install dependencies with `bun install` or `npm ci`. Both lockfiles are maintained.
2. Create a PostgreSQL database and apply `src/database/migrations/0001_rooms.sql` with `psql -v ON_ERROR_STOP=1 "$DATABASE_URL" -f src/database/migrations/0001_rooms.sql`.
3. Set `DATABASE_URL` and a random `SESSION_SECRET` of at least 32 characters. Use `openssl rand -hex 32` for a new secret. Keep these values in a local environment file or the shell environment.
4. Start with `bun run dev` or `npm run dev`. For production-mode QA, run `bun run build` and `bun run start --port 3091`.

Ably provides scoped room notifications and presence. Without `ABLY_API_KEY` the application uses authenticated snapshot polling, which is enough for local browser tests. Set `CRON_SECRET` to enable the scheduled expiry cleanup and outbox retry route.

## Verify

Run `npm run lint` and `npm run typecheck`. With Chrome and a running app, use `npm test`. `CLOSELY_BASE_URL` defaults to `http://127.0.0.1:3091`. Set `CLOSELY_CAPTURE=1` to capture the desktop and mobile screenshots, or `CLOSELY_BROWSER_CHANNEL` to select another installed Chromium channel.

- [Architecture audit and rollback](docs/closely-audit.md)
- [Deployment and verification](docs/DEPLOYMENT.md)
- [Art inventory and licences](docs/ASSET_LICENSES.md)
