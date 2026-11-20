import Image from 'next/image';
import { games, type GameId } from '@/lib/rooms/catalog';

export function GameCover({ kind, action }: { kind: GameId; action: React.ReactNode }) {
  const game = games[kind];
  return <article className={`game-cover game-${kind}`}>
    <div className="game-art"><Image src={game.art} fill sizes="(max-width: 620px) 95vw, (max-width: 900px) 46vw, 380px" alt="" unoptimized={game.art.endsWith('.svg')} /></div>
    <div className="game-cover-copy"><p className="game-meta"><span>{game.type}</span><span>{game.minutes}</span></p>
      <h3>{game.title}</h3><p>{game.tagline}</p>{action}
    </div>
  </article>;
}
