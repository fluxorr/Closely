import Image from 'next/image';
import type { ReactNode } from 'react';
import { games, type GameId } from '@/lib/rooms/catalog';

export function GameCover({ kind, action, variant = 'standard' }: { kind: GameId; action: ReactNode; variant?: 'featured' | 'standard' | 'compact' }) {
  const game = games[kind];
  const Heading = variant === 'compact' ? 'h4' : 'h3';
  const sizes = variant === 'compact' ? '110px' : '(max-width: 620px) 94vw, (max-width: 1320px) 48vw, 650px';
  return <article className={`game-cover game-cover--${variant}`}>
    <div className="game-art"><Image src={game.art} fill sizes={sizes} alt="" unoptimized={game.art.endsWith('.svg')} /></div>
    <div className="game-cover-copy">
      <div className="game-cover-text">
        <p className="game-meta">{variant !== 'compact' && <span>{game.type}</span>}<span>{game.minutes}</span></p>
        <Heading>{game.title}</Heading>
        <p className="game-description">{game.tagline}</p>
      </div>
      {action}
    </div>
  </article>;
}
