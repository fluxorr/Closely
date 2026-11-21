# Closely

A private room for two. Share conversation cards, lock answers and reveal them together, chat, and play Never Have I Ever, Same Brain, Bluff My Love, Draw Me Wrong, or three classic games.

## Run locally

Run the commands from the Closely directory. Local development uses Webpack to avoid the Turbopack compiler retry loop seen with Next.js 16.2.4. Version managers such as Vite+ can pick up `.node-version` for commands that use Node.js.

1. Copy `.env.example` to `.env.local` and follow the [manual setup](docs/DEPLOYMENT.md) for database migration and credentials.
2. Run `bun install` and `bun run dev`. For production-mode QA, run `bun run build` and `bun run start --port 3091`.

## Verify

Run `npm run lint` and `npm run typecheck`. With Chrome and a running app, use `npm test`. `CLOSELY_BASE_URL` defaults to `http://127.0.0.1:3091`. Set `CLOSELY_CAPTURE=1` to capture the desktop and mobile screenshots, or `CLOSELY_BROWSER_CHANNEL` to select another installed Chromium channel.

- [Architecture audit and rollback](docs/closely-audit.md)
- [Deployment and verification](docs/DEPLOYMENT.md)
- [Add questions in Neon](docs/QUESTIONS.md)
- [Art inventory and licences](docs/ASSET_LICENSES.md)
