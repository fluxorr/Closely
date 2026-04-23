"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);

  const startRoom = () => {
    setIsJoining(true);
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setTimeout(() => {
      router.push(`/room/${roomId}`);
    }, 400);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden bg-[#fffcf2] selection:bg-froly selection:text-white">
      {/* Decorative Grid - Neo-Brutalist Element */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dot-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="2" fill="black" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-grid)" />
        </svg>
      </div>

      {/* Floating Graphic Element */}
      <motion.div
        animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 right-10 md:right-32 w-32 h-32 bg-highlight border-8 border-black rounded-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-0"
      />
      <motion.div
        animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-20 left-10 md:left-32 w-24 h-24 bg-primary border-8 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-0"
      />

      {/* Floating Graphic Element */}

      {/* Main Content Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.5 }}
        className="z-10 flex flex-col items-center text-center bg-white border-8 border-black p-10 md:p-16 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] max-w-2xl relative"
      >
        {/* Banner Tape */}
        <div className="absolute -top-6 bg-accent border-4 border-black px-6 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-3 text-2xl font-black uppercase tracking-widest">
          Beta V1
        </div>

        <div className="space-y-6 mb-12 mt-6">
          <h1 className="text-7xl md:text-8xl font-display font-black text-black uppercase tracking-tighter mix-blend-multiply">
            Closely
          </h1>
          <p className="text-xl md:text-2xl text-black font-bold max-w-sm mx-auto leading-relaxed border-t-4 border-b-4 border-black py-4">
            Real-time conversations for couples to get closer.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05, y: -4, x: -4, boxShadow: "12px 12px 0px 0px rgba(0,0,0,1)" }}
          whileTap={{ scale: 0.95, y: 4, x: 4, boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)" }}
          onClick={startRoom}
          disabled={isJoining}
          className="px-12 py-6 bg-destructive text-black border-4 border-black font-black uppercase tracking-widest rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-2xl flex items-center justify-center gap-4 transition-all w-full md:w-auto"
        >
          {isJoining ? "Launching..." : "Start Room Now"}
        </motion.button>
      </motion.div>
    </main>
  );
}
