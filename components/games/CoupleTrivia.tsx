import { motion } from 'framer-motion';
import { useState } from 'react';

interface TriviaState {
  questionIndex: number;
  p1Answer: string | null;
  p2Answer: string | null;
  revealed: boolean;
}

const TRIVIA_QUESTIONS = [
  "What was I wearing on our first date?",
  "What's my favorite food?",
  "What's my favorite movie?",
  "What's my favorite song?",
  "What's my favorite color?",
  "What was my first job?",
  "What city was I born in?",
  "What's my middle name?",
  "What's my favorite animal?",
  "What was my nickname as a kid?",
  "What's my favorite season?",
  "What is my favorite number?",
  "What's my favorite ice cream flavor?",
  "What is my zodiac sign?",
  "What was the name of my first pet?",
  "What is my favorite hobby?",
  "What is my dream vacation?",
  "What is my favorite sports team?",
  "What is my go-to coffee order?",
  "What is my favorite time of day?",
];

interface CoupleTriviaProps {
  state: TriviaState | null;
  currentPlayer: string | null;
  onAnswer: (answer: string) => void;
  onReveal: () => void;
  onNext: () => void;
}

export default function CoupleTrivia({
  state,
  currentPlayer,
  onAnswer,
  onReveal,
  onNext,
}: CoupleTriviaProps) {
  const [input, setInput] = useState("");
  const currentIndex = state?.questionIndex ?? 0;
  const question = TRIVIA_QUESTIONS[currentIndex % TRIVIA_QUESTIONS.length];
  const hasAnswered = state?.p1Answer || state?.p2Answer;
  const isP1 = currentPlayer === 'p1';
  const myAnswer = isP1 ? state?.p1Answer : state?.p2Answer;
  const theirAnswer = isP1 ? state?.p2Answer : state?.p1Answer;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onAnswer(input.trim());
    setInput("");
  };

  const handleNext = () => {
    onNext();
    setInput("");
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md text-center">
      <h2 className="text-4xl font-display font-black uppercase mb-6 tracking-widest bg-highlight px-6 py-2 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-[-2deg]">
        Couple Trivia
      </h2>

      <div className="mb-6 text-sm font-bold uppercase tracking-widest opacity-70">
        Question {currentIndex + 1} of {TRIVIA_QUESTIONS.length}
      </div>

      <div className="w-full bg-white border-4 border-black p-6 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
        <p className="text-2xl font-black text-black">{question}</p>
      </div>

      {!state?.revealed ? (
        <div className="w-full">
          {hasAnswered ? (
            <div className="text-center">
              <div className="text-xl font-bold mb-4 text-green-600">
                Waiting for partner&apos;s answer...
              </div>
              <div className="text-sm opacity-70">
                Both answer to reveal!
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your answer..."
                className="w-full border-4 border-black rounded-xl px-4 py-4 font-bold text-xl focus:outline-none focus:ring-4 focus:ring-secondary"
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!input.trim()}
                className="w-full py-4 bg-primary text-black font-black text-xl uppercase rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
              >
                Submit Answer
              </motion.button>
            </form>
          )}

          {hasAnswered && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onReveal}
              className="w-full py-4 mt-4 bg-accent text-black font-black text-xl uppercase rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              Reveal Both Answers
            </motion.button>
          )}
        </div>
      ) : (
        <div className="w-full">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-primary border-4 border-black p-4 rounded-xl">
              <div className="text-sm font-bold uppercase mb-2">Your Answer</div>
              <div className="text-xl font-black">{myAnswer || "—"}</div>
            </div>
            <div className="bg-secondary border-4 border-black p-4 rounded-xl">
              <div className="text-sm font-bold uppercase mb-2">Their Answer</div>
              <div className="text-xl font-black">{theirAnswer || "—"}</div>
            </div>
          </div>

          {myAnswer?.toLowerCase() === theirAnswer?.toLowerCase() && (
            <div className="text-2xl font-black text-green-600 mb-4 animate-bounce">
              IT&apos;S A MATCH! 🎉
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNext}
            className="w-full py-4 bg-accent text-black font-black text-xl uppercase rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            Next Question →
          </motion.button>
        </div>
      )}
    </div>
  );
}