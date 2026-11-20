# Closely 2.0 verification

## Local release candidate

- The production build ran against a fresh local PostgreSQL 14 database with the committed migration. The multiplayer test suite uses separate desktop and mobile Chrome contexts with independent guest cookies.
- The separate-process smoke test used two Chrome launches. It verified the actual clipboard invite link, joining on a second browser, a shared flip, and restoration on refresh.
- Reducer tests exercise room-specific card draws across the entire Random deck, exhaustion and shuffling, private-answer discard on pass, the server clock, and asymmetric projections.
- Browser coverage includes atomic last-seat claims, a third guest receiving a full-room error, stale card advance conflicts, idempotent retries, shared card, reveal privacy, chat, reactions, all three new games and all three classics. Draw Me Wrong covers real pointer strokes, secret prompts, replay and reconnect. Same Brain covers rematch and match scoring.
- Captured screens were reviewed at 360, 390, 768 and 1440 CSS pixels. Review covered the landing, join and invite flows, waiting, lobby, chat, cards and the three new games. Game result and reconnect screens were captured for each new title. The SVG board includes all three mark alternatives and checks the selected C at favicon size.
- Automated accessibility checks scanned landing, create, waiting, invite, lobby, card table and chat. See `artifacts/closely/accessibility.json` for coverage and rules needing manual judgment. The keyboard run verifies skip navigation, a keyboard card flip and opening and closing dialogs.

## Evidence

- [Architecture and baseline](closely-audit.md)
- [Brand board](../artifacts/closely/brand-board.png)
- [Desktop landing](../artifacts/closely/home-1440.png)
- [Mobile card table](../artifacts/closely/cards-390.png)
- [Same Brain result](../artifacts/closely/same-result-1440.png)
- [Draw Me Wrong reconnect screen](../artifacts/closely/draw-reconnecting-390.png)

## Outstanding release gates

The last completed suite passed 14 of 15 checks. The remaining card test attempted to switch modes before its browser received the advanced card. The test now waits for that card ID. Verification stopped during the final rerun after the laptop froze. The latest small accessibility and copy changes were linted and type-checked. Browser screenshots document the previous build. Playwright now defaults to one worker.

The Vercel Preview environment has no configured Neon database, Ably key or session/maintenance secrets. The local tests used the HTTP snapshot fallback with real PostgreSQL. Live Ably delivery, Vercel preview multiplayer, physical-mobile testing and real-user Core Web Vitals remain unverified. Follow [Preview setup](DEPLOYMENT.md) before promoting a build. The four 2.1 features are outside the 2.0 catalogue.
