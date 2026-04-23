# Closely

A real-time conversation and games experience for couples to deepen their connection through interactive prompts and activities.

## Features

### Card-Based Conversations
- Interactive cards with thought-provoking questions
- Categories: Deep, Fun, Memory, Action, Spicy, Naughty
- Smooth flip animations
- Card uniqueness - each card in a room is drawn only once (stored in localStorage)
- Resets when all cards have been used

### Real-Time Chat
- Synchronized messaging between partners
- Message history within the room
- Collapsible sidebar (slides in from right)
- Chat button always visible on screen
- Name persistence across sessions

### Reactions
- React to conversations with emojis (❤️, 🔥, 😂, 🥺, 😘, 😴)
- Floating animation across the screen in real-time

### Mini Games

#### Tic Tac Toe
- Classic X and O game
- Real-time syncing between players
- Winner detection and winning line highlight
- Reset board functionality

#### Rock Paper Scissors
- Player vs player gameplay
- Secret choice phase, then reveal
- Win detection with celebration animation

#### Hot Potato
- Pass the "hot potato" before it explodes
- Timer countdown
- Visual feedback when holding the potato

### Room System
- Unique room codes for sharing
- Copy room link button
- Device-based identification

## Quick Start

1. Run `npm install` and `npm run dev`
2. Open http://localhost:3000
3. Enter a room code or create new room
4. Enter your name to join
5. Share the room link with your partner
6. Start drawing cards and playing games

## Design

Neo-brutalist aesthetic with:
- Bold black borders (4px)
- Hard drop shadows
- High-contrast colors
- Playful animations (Framer Motion)
- Responsive layout for mobile and desktop

## Technology

- Next.js 16 (App Router with Turbopack)
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- LocalStorage for persistence

## Folder Structure

```
app/
├── room/[id]/
│   ├── page.tsx      # Main card room
│   └── games/
│       └── page.tsx  # Arcade games
lib/
├── socket.ts         # Mock real-time sync
└── cards.ts        # Card prompts
components/
└── Card.tsx       # Card component
```

## API Routes

```
/api/room/[id]     # GET (sync state), POST (update state)
```

## Notes

- Uses mock WebSocket (polling-based) for real-time sync
- Data stored in memory on server
- Device ID used for player identification
- Suitable for local development/demo only

## License

MIT