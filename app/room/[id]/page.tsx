"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Card } from "../../../components/Card";
import { CARDS } from "../../../lib/cards";
import { useMockSocket } from "../../../lib/socket";
import { motion, AnimatePresence } from "framer-motion";

export default function Room() {
  const params = useParams();
  const roomId = params?.id as string;
  const router = useRouter();

  const [userName, setUserName] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem('closely_name');
    if (saved) {
      setUserName(saved);
      setIsJoined(true);
    }
  }, []);

  const { currentCardIndex, sendCardChange, reactions, sendReaction, chats, sendChat } = useMockSocket(roomId, userName);

  const [isFlipped, setIsFlipped] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const card = CARDS[currentCardIndex % CARDS.length];

  useEffect(() => {
    if (chatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chats, chatOpen]);

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      sendCardChange(Math.floor(Math.random() * CARDS.length));
    }, 300);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChat(chatInput.trim());
    setChatInput("");
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    const name = nameInput.trim();
    localStorage.setItem('closely_name', name);
    setUserName(name);
    setIsJoined(true);
  };

  if (!isJoined) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#fffcf2] selection:bg-froly selection:text-white">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-white border-8 border-black p-8 md:p-12 rounded-[2rem] shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] w-full max-w-sm"
        >
          <h1 className="text-4xl font-display font-black uppercase mb-2">Join Room</h1>
          <p className="font-bold text-lg mb-8 opacity-70">Room Code: {roomId}</p>
          <form onSubmit={handleJoin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-xl font-black uppercase tracking-wider">What's your name?</label>
              <input
                id="name"
                type="text"
                autoFocus
                maxLength={20}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Rahul"
                className="border-4 border-black rounded-xl px-4 py-4 font-bold text-xl focus:outline-none focus:ring-4 focus:ring-secondary focus:border-black transition-all"
              />
            </div>
            <motion.button
              whileHover={{ y: -2, x: -2, boxShadow: "6px 6px 0px 0px rgba(0,0,0,1)" }}
              whileTap={{ y: 2, x: 2, boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)" }}
              disabled={!nameInput.trim()}
              className="w-full py-4 mt-2 bg-primary text-black font-black text-2xl uppercase rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer disabled:opacity-50"
            >
              Enter
            </motion.button>
          </form>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col md:flex-row p-6 overflow-hidden relative selection:bg-froly selection:text-white">
      {/* Sidebar Chat */}
      <div className="w-full md:w-md flex flex-col md:flex-col md:mr-12 border-r-4 border-black">
        {/* Chat header */}
        <div className="flex justify-between items-center p-4 border-b-4 border-black bg-secondary mb-4">
          <h2 className="text-2xl font-black uppercase">Room Chat</h2>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 mb-4">
          {chats.map((msg, i) => {
            const isMe = msg.sender === 'Me';
            return (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                key={msg.id + i}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="text-xs font-bold mb-1 opacity-60 uppercase">
                  {isMe ? 'You' : msg.senderName || 'Anonymous'}
                </span>
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl border-4 border-black font-bold text-lg 
                  ${isMe ? 'bg-primary text-black rounded-br-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black rounded-bl-none shadow-[-4px_4px_0px_0px_rgba(0,0,0,1)]'}`}
                >
                  {msg.text}
                </div>
              </motion.div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <form onSubmit={handleChatSubmit} className="p-4 border-t-4 border-black bg-white flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Say something..."
            className="flex-1 border-4 border-black rounded-xl px-4 py-3 font-bold text-lg focus:outline-none focus:ring-4 focus:ring-secondary focus:border-black"
          />
          <button
            type="submit"
            disabled={!chatInput.trim()}
            className="bg-accent text-black border-4 border-black px-6 font-black rounded-xl text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all uppercase disabled:opacity-50 cursor-pointer"
          >
            Send
          </button>
        </form>
      </div>

      {/* Camera View
      <div className="w-full md:w-80 flex flex-col ml-6 md:ml-0">
        <div className="flex justify-between items-center p-4 border-b-4 border-black bg-secondary mb-4">
          <h2 className="text-2xl font-black uppercase">Camera View</h2>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-4 border-4 border-black rounded-2xl bg-gray-200">
          <div className="w-full h-full flex items-center justify-center">
            <div className="bg-gray-300 border-2 border-dashed rounded-xl w-full h-64 flex items-center justify-center">
              <span className="text-gray-500 font-bold">Camera Feed</span>
            </div>
          </div>
        </div>
      </div> */}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="w-full flex justify-between items-center z-10 max-w-xl mx-auto pt-4 relative">
          <div className="flex -space-x-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-sm font-black border-4 border-black z-20">ME</div>
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-sm font-black border-4 border-black z-10">U</div>
          </div>
          <div className="text-xl font-bold bg-white text-black border-4 border-black px-6 py-2 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider flex items-center gap-2 group cursor-pointer active:translate-y-1 active:translate-x-1 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all"
            onClick={() => {
              if (typeof window !== "undefined") {
                navigator.clipboard.writeText(window.location.href);
                alert("Room link copied to invite partner!");
              }
            }}
            title="Click to copy invite link"
          >
            ROOM: {roomId || '...'}
            <span className="opacity-0 group-hover:opacity-100 text-xs bg-black text-white px-2 py-1 rounded-full transition-opacity ml-2">COPY LINK</span>
          </div>
          {/* <button
            onClick={() => router.push(`/room/${roomId}/games`)}
            className="bg-highlight border-4 border-black text-black px-4 py-2 font-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all uppercase cursor-pointer " disabled
          >
            Minigames
          </button> */}
        </header>

        {/* Main Experience */}
        <div className="flex-1 flex w-full relative max-w-xl mx-auto items-center justify-center z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCardIndex}
              initial={{ opacity: 0, x: -100, rotateZ: Math.random() * -10 - 5 }}
              animate={{ opacity: 1, x: 0, rotateZ: 0 }}
              exit={{ opacity: 0, x: 100, rotateZ: Math.random() * 10 + 5 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="pointer-events-auto">
                <Card card={card} isFlipped={isFlipped} onFlip={handleFlip} />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Reaction Buttons */}
          <div className="absolute -bottom-4 right-0 w-16 flex flex-col justify-end items-center gap-4 z-20">
            {["❤️", "🔥", "😂", "🥺", "😘", "😴"].map((emoji) => (
              <button
                key={emoji}
                onClick={() => sendReaction(emoji)}
                className="text-4xl bg-white border-4 border-black rounded-full w-14 h-14 flex items-center justify-center shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Controls */}
        <div className="w-full max-w-xl mx-auto pb-4 pt-8 z-10 flex gap-4">
          {/* Draw Card button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={nextCard}
            className="flex-1 py-4 bg-primary text-black font-black text-2xl uppercase rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
          >
            Draw Next
          </motion.button>
        </div>
      </div>

      {/* Floating Reactions overlay */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-[100]">
        <AnimatePresence>
          {reactions.map((r, i) => (
            <motion.div
              key={r.id + i}
              initial={{ opacity: 0, y: "100vh", x: `${r.x}vw`, scale: 0.5, rotate: 0 }}
              animate={{ opacity: 1, y: "-20vh", scale: 2, rotate: Math.random() * 60 - 30 }}
              exit={{ opacity: 0, scale: 3 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute bottom-0 text-6xl drop-shadow-[0px_4px_0px_rgba(0,0,0,1)]"
            >
              {r.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </main>
  );
}
