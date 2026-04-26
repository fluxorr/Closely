import { motion } from 'framer-motion';
import { useState } from 'react';

interface Player {
  id: string;
  choice: string | null;
  name: string;
}

interface RockPaperScissorsProps {
  p1: Player | null | undefined;
  p2: Player | null | undefined;
  status: 'waiting' | 'reveal' | 'finished';
  winnerId: string | null | undefined;
  deviceId: string;
  onPlay: (choice: 'rock' | 'paper' | 'scissors') => void;
  onReset: () => void;
}

const CHOICES = ['rock', 'paper', 'scissors'] as const;

export default function RockPaperScissors({ p1, p2, status, winnerId = null, deviceId, onPlay, onReset }: RockPaperScissorsProps) {
  const [hoverRotation] = useState(() => {
    const r: Record<string, number> = {};
    CHOICES.forEach(c => { r[c] = Math.random() * 10 - 5; });
    return r;
  });

  const getEmoji = (choice: string | null) => {
    if (!choice) return 'Waiting...';
    if (status === 'finished') {
      return choice === 'rock' ? '🪨' : choice === 'paper' ? '📄' : '✂️';
    }
    return '❓';
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md text-center">
      <h2 className="text-5xl font-display font-black uppercase mb-8 tracking-widest bg-secondary px-6 py-2 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-[2deg]">
        Rock, Paper, Scissors
      </h2>

      <div className="w-full flex justify-between gap-4 mb-12">
        <div className="flex-1 bg-white border-4 border-black p-6 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative">
          <span className="absolute -top-4 -left-4 bg-black text-white px-3 py-1 font-bold rounded-lg rotate-[-10deg]">P1</span>
          <div className="text-6xl mt-4">{getEmoji(p1?.choice || null)}</div>
        </div>

        <div className="flex items-center text-4xl font-black">VS</div>

        <div className="flex-1 bg-white border-4 border-black p-6 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative">
          <span className="absolute -top-4 -right-4 bg-black text-white px-3 py-1 font-bold rounded-lg rotate-[10deg]">P2</span>
          <div className="text-6xl mt-4">{getEmoji(p2?.choice || null)}</div>
        </div>
      </div>

      {status === 'finished' && (
        <div className="mb-12 font-display text-4xl font-black uppercase bg-highlight px-6 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce">
          {winnerId === 'tie' ? "IT'S A TIE!" : winnerId === deviceId ? "YOU WON! 🎉" : "YOU LOST! 😭"}
        </div>
      )}

      <div className="flex gap-4">
        {CHOICES.map(choice => (
          <motion.button
            key={choice}
            whileHover={{ scale: 1.1, rotate: hoverRotation[choice] || 0 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onPlay(choice)}
            disabled={status !== 'waiting' && ((p1?.id === deviceId && !!p1?.choice) || (p2?.id === deviceId && !!p2?.choice))}
            className="bg-white border-4 border-black rounded-2xl w-24 h-24 text-5xl flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 disabled:opacity-50 transition-all uppercase cursor-pointer"
          >
            {choice === 'rock' ? '🪨' : choice === 'paper' ? '📄' : '✂️'}
          </motion.button>
        ))}
      </div>

      <button
        onClick={onReset}
        className="mt-12 px-8 py-3 bg-white border-4 border-black font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all uppercase cursor-pointer"
      >
        Play Again
      </button>
    </div>
  );
}