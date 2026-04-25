"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, X, Volume2, VolumeX } from "lucide-react";

type Toast = { id: string; message: string; type: "success" | "error" | "info" };
type ToastContextType = {
  showToast: (message: string, type?: Toast["type"]) => void;
  isMuted: boolean;
  toggleMute: () => void;
  playSound: (type: "click" | "success" | "error" | "hover") => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ThemeProvider");
  return ctx;
}

const soundFiles: Record<string, string> = {
  click: "/sounds/click.mp3",
  success: "/sounds/success.mp3",
  error: "/sounds/error.mp3",
  hover: "/sounds/hover.mp3",
};

const audioCache: Record<string, HTMLAudioElement> = {};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("muted");
    if (saved) setIsMuted(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("muted", JSON.stringify(isMuted));
  }, [isMuted]);

  const toggleMute = useCallback(() => setIsMuted((m) => !m), []);

  const playSound = useCallback((type: "click" | "success" | "error" | "hover") => {
    if (isMuted) return;
    const file = soundFiles[type];
    if (!file) return;
    try {
      if (!audioCache[type]) {
        audioCache[type] = new Audio(file);
      }
      audioCache[type].currentTime = 0;
      audioCache[type].play().catch(() => {});
    } catch {}
  }, [isMuted]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const showToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const toastColors = {
    success: "bg-green-500 border-black",
    error: "bg-destructive border-black",
    info: "bg-primary border-black",
  };

  return (
    <ToastContext.Provider value={{ showToast, isMuted, toggleMute, playSound }}>
      {children}
      
      {/* Mute button */}
      <button
        onClick={toggleMute}
        className="fixed top-4 left-4 z-50 p-2 bg-white border-4 border-black shadow-brutal-md hover:shadow-brutal-lg hover:-translate-y-1 transition-all"
        aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      {/* Offline indicator */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-destructive text-black border-b-4 border-black py-3 font-bold"
          >
            <WifiOff className="w-5 h-5" />
            You&apos;re offline - some features may not work
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              className={`flex items-center gap-3 px-4 py-3 border-4 border-black shadow-brutal-md ${toastColors[toast.type]}`}
            >
              <span className="font-bold text-sm">{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} className="hover:opacity-70">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}