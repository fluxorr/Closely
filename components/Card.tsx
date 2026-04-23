"use client";

import { motion } from "framer-motion";
import { type CardInfo } from "../lib/cards";

const categoryColors: Record<string, string> = {
  deep: "bg-primary text-black",
  fun: "bg-secondary text-black",
  memory: "bg-highlight text-black",
  game: "bg-accent text-black",
  action: "bg-primary text-black",
  spicy: "bg-destructive text-black",
  naughty: "bg-destructive text-black",
};

export function Card({ card, isFlipped, onFlip }: { card: CardInfo, isFlipped: boolean, onFlip: () => void }) {
  return (
    <div className="relative w-80 h-[28rem] [perspective:1500px] cursor-pointer group" onClick={onFlip}>
      <motion.div
        className="w-full h-full relative"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 20, mass: 1.2 }}
        whileHover={{ scale: 1.05, rotateZ: isFlipped ? 0 : -3 }}
        whileTap={{ scale: 0.95, rotateZ: isFlipped ? 0 : 2 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front (Back of card visually - before flip) */}
        <div
          className={`absolute inset-0 border-8 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-shadow duration-300 rounded-[2rem] flex flex-col items-center justify-center overflow-hidden ${categoryColors[card.category] || "bg-white text-black"}`}
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Subtle pattern background for the front! Let's make it a nice dot pattern */}
          <div className="absolute inset-0 opacity-30 mix-blend-overlay">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="2" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dots)" />
            </svg>
          </div>

          <div className="absolute top-6 left-6 right-6 flex justify-between items-center text-sm font-black border-4 border-black bg-white rounded-full px-6 py-2 shadow-brutal uppercase tracking-widest z-20">
            <span >#{card.id}</span>
            <span>{card.category}</span>
          </div>

          <div className="text-5xl font-display font-black tracking-widest uppercase z-10 bg-white px-8 py-4 border-y-8 border-black mix-blend-normal">
            CLOSELY

          </div>



          <div className="absolute bottom-6 font-bold uppercase tracking-widest bg-black opacity-90 text-white px-4 py-2 rounded-full text-xs animate-pulse z-20">
            TAP TO FLIP
          </div>
        </div>

        {/* Back (Front of card visually - after flip) */}
        <div
          className={`absolute inset-0 rounded-[2rem] flex flex-col p-8 border-8 border-black shadow-brutal-lg ${categoryColors[card.category] || "bg-white text-black"}`}
          style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
        >
          <div className="flex justify-between items-center mb-auto w-full">
            <div className="uppercase tracking-widest text-sm font-black border-4 border-black bg-white rounded-full px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {card.category}
            </div>
            <div className="font-black text-xl bg-white border-4 border-black w-14 h-10 flex items-center justify-center rounded-full  shadow-brutal ">#{card.id}</div>
          </div>

          <div className="text-3xl font-display font-black text-center leading-tight [text-wrap:balance] w-full my-auto py-8">
            {card.text}
          </div>

          <div className="mt-auto w-full flex justify-center">
            <div className="flex gap-2 p-3 border-4 border-black rounded-full bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-3 h-3 rounded-full bg-black animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 rounded-full bg-black animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 rounded-full bg-black animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
