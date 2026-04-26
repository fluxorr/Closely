import { motion } from 'framer-motion';

export default function HotPotato() {
  return (
    <div className="flex flex-col items-center w-full max-w-md">
      <h2 className="text-5xl font-display font-black uppercase mb-8 tracking-widest bg-accent px-6 py-2 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-[-2deg]">
        Hot Potato
      </h2>
      <div className="text-center">
        <p className="font-bold text-xl mb-4">This game requires 2+ players in the room.</p>
        <p className="text-lg opacity-70 mb-8">Coming soon!</p>
      </div>
    </div>
  );
}