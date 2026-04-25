"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, X, Moon, Sun } from "lucide-react";

type Toast = { id: string; message: string; type: "success" | "error" | "info" };
type ToastContextType = {
  showToast: (message: string, type?: Toast["type"]) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ThemeProvider");
  return ctx;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isOnline, setIsOnline] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    if (saved) setTheme(saved);
    else if (window.matchMedia("(prefers-color-scheme: dark)").matches) setTheme("dark");
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

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

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const toastColors = {
    success: "bg-green-500 border-black",
    error: "bg-destructive border-black",
    info: "bg-primary border-black",
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
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

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="fixed bottom-6 right-6 z-40 p-3 bg-white border-4 border-black shadow-brutal-md hover:shadow-brutal-lg hover:-translate-y-1 transition-all"
        aria-label="Toggle theme"
      >
        {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>

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