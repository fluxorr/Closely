import { motion } from 'framer-motion';

interface TicTacToeProps {
  board: (string | null)[] | undefined;
  nextTurn: 'X' | 'O' | undefined;
  winner: string | null | undefined;
  winningLine: number[] | null | undefined;
  onPlay: (index: number) => void;
  onReset: () => void;
}

export default function TicTacToe({ board = [], nextTurn = 'X', winner = null, winningLine = null, onPlay, onReset }: TicTacToeProps) {
  const WINNING_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  return (
    <div className="flex flex-col items-center w-full max-w-md">
      <h2 className="text-5xl font-display font-black uppercase mb-8 tracking-widest bg-primary px-6 py-2 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-[-2deg]">
        Tic Tac Toe
      </h2>

      <div className="grid grid-cols-3 gap-4 w-full bg-black p-4 rounded-xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        {board.map((cell, i) => (
          <motion.div
            key={i}
            whileTap={{ scale: 0.9 }}
            onClick={() => onPlay(i)}
            className={`aspect-square bg-white rounded-lg border-4 border-black flex items-center justify-center text-7xl font-display font-black cursor-pointer shadow-[Inset_0_-6px_rgba(0,0,0,0.1)] 
              ${winningLine?.includes(i) ? "bg-highlight animate-pulse" : ""} 
              ${cell === "X" ? "text-primary" : "text-secondary"}`}
          >
            {cell && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: cell === 'X' ? 10 : -10 }}
                transition={{ type: "spring" }}
              >
                {cell}
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-8 text-center">
        {winner ? (
          <div className="text-3xl font-black uppercase tracking-wider animate-bounce">
            {winner === 'Tie' ? 'Draw!' : `${winner} Wins!`}
          </div>
        ) : (
          <div className="text-2xl font-bold uppercase">
            Turn: <span className="text-3xl font-black bg-white px-3 py-1 border-2 border-black rounded-full">{nextTurn}</span>
          </div>
        )}
      </div>

      <button
        onClick={onReset}
        className="mt-8 px-8 py-3 bg-white border-4 border-black font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all uppercase cursor-pointer"
      >
        Reset Board
      </button>
    </div>
  );
}