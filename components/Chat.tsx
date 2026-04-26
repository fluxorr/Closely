"use client";

import { motion, AnimatePresence } from "framer-motion";
import { type ChatMessage } from "@/hooks/useSocket";
import { useRef, type FormEvent } from "react";

interface ChatProps {
  isOpen: boolean;
  onClose: () => void;
  chats: ChatMessage[];
  onSend: (text: string) => void;
}

export function Chat({ isOpen, onClose, chats, onSend }: ChatProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = inputRef.current;
    if (!input?.value.trim()) return;
    onSend(input.value.trim());
    input.value = "";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", ease: "easeOut", duration: 0.3 }}
          className="fixed inset-y-0 right-0 z-50 w-full md:w-md bg-[#fffcf2] md:bg-transparent flex"
        >
          <div className="w-full md:w-md flex flex-col border-4 border-black md:border-r-4 md:border-black h-full">
            <div className="flex justify-between items-center p-4 border-b-4 border-black bg-secondary">
              <h2 className="text-2xl font-black uppercase">Chat</h2>
              <button
                onClick={onClose}
                className="bg-white border-2 border-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-100"
              >
                ✕ Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 mb-4 max-h-[60vh] md:max-h-none">
              {chats.map((msg, i) => {
                const isMe = msg.sender === "Me";
                return (
                  <motion.div
                    key={msg.id + i}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <span className="text-xs font-bold mb-1 opacity-60 uppercase">
                      {isMe ? "You" : msg.senderName || "Anonymous"}
                    </span>
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl border-4 border-black font-bold text-lg 
                        ${isMe
                          ? "bg-primary text-black rounded-br-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                          : "bg-white text-black rounded-bl-none shadow-[-4px_4px_0px_0px_rgba(0,0,0,1)]"
                        }`}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t-4 border-black bg-white flex gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Say something..."
                className="flex-1 border-4 border-black rounded-xl px-4 py-3 font-bold text-lg focus:outline-none focus:ring-4 focus:ring-secondary focus:border-black"
              />
              <button
                type="submit"
                className="bg-accent text-black border-4 border-black px-6 font-black rounded-xl text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all uppercase cursor-pointer disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ChatToggleProps {
  onClick: () => void;
}

export function ChatToggle({ onClick }: ChatToggleProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-secondary border-4 border-black rounded-full flex items-center justify-center text-3xl font-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:scale-105 transition-transform"
    >
      💬
    </button>
  );
}