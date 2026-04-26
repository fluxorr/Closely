import { useState, useEffect, useRef, useCallback } from 'react';
import type { GameStates, TicTacToeState, RPSState } from '@/lib/games/types';

export interface ChatMessage {
  id: string;
  sender: 'Me' | 'You';
  senderName?: string;
  text: string;
  timestamp: number;
}

interface UseSocketOptions {
  roomId: string;
  userName?: string;
}

export function useSocket({ roomId, userName }: UseSocketOptions) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [reactions, setReactions] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [games, setGames] = useState<GameStates | null>(null);
  const lastFetchRef = useRef(0);
  const mountedRef = useRef(true);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    if (typeof window !== 'undefined' && !localStorage.getItem('deviceId')) {
      localStorage.setItem('deviceId', Math.random().toString(36).slice(2));
    }
    const deviceId = typeof window !== 'undefined' ? localStorage.getItem('deviceId') : 'unknown';

    const poll = async (isBackground = false) => {
      const now = Date.now();
      if (isBackground && now - lastFetchRef.current < 2000) return;
      lastFetchRef.current = now;

      try {
        const res = await fetch(`/api/room/${roomId}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (!res.ok) return;
        const data = await res.json();

        if (!mountedRef.current) return;

        setCurrentCardIndex(data.cardIndex);
        setReactions(data.reactions || []);
        if (data.games) setGames(data.games);

        const newChats = data.chats || [];
        setChats(
          newChats.map((c: unknown) => {
            const chat = c as { id: string; senderDeviceId: string; senderName?: string; text: string; timestamp: number };
            return {
              id: chat.id,
              sender: chat.senderDeviceId === deviceId ? 'Me' : 'You',
              senderName: chat.senderName,
              text: chat.text,
              timestamp: chat.timestamp,
            };
          })
        );
      } catch (e) {
        // Silent fail
      }
    };

    poll();

    pollingRef.current = setInterval(() => poll(true), 3000);

    return () => {
      mountedRef.current = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [roomId]);

  const sendCardChange = useCallback(
    async (idx: number) => {
      setCurrentCardIndex(idx);
      await fetch(`/api/room/${roomId}`, {
        method: 'POST',
        body: JSON.stringify({ type: 'CARD', cardIndex: idx }),
      });
    },
    [roomId]
  );

  const sendReaction = useCallback(
    async (emoji: string) => {
      const reaction = { id: Date.now(), emoji, x: Math.random() * 80 + 10 };
      setReactions((prev) => [...prev, reaction]);
      await fetch(`/api/room/${roomId}`, {
        method: 'POST',
        body: JSON.stringify({ type: 'REACTION', reaction }),
      });
    },
    [roomId]
  );

  const sendChat = useCallback(
    async (text: string) => {
      const deviceId = localStorage.getItem('deviceId') || 'unknown';
      const chatMsg = {
        id: Math.random().toString(36).slice(2),
        senderDeviceId: deviceId,
        senderName: userName || 'Anonymous',
        text,
        timestamp: Date.now(),
      };
      setChats((prev) => [
        ...prev,
        {
          id: chatMsg.id,
          sender: 'Me' as const,
          senderName: userName || 'Anonymous',
          text: chatMsg.text,
          timestamp: chatMsg.timestamp,
        },
      ]);
      await fetch(`/api/room/${roomId}`, {
        method: 'POST',
        body: JSON.stringify({ type: 'CHAT', chat: chatMsg }),
      });
    },
    [roomId, userName]
  );

  const updateGameState = useCallback(
    async (gameType: 'GAME_TTT' | 'GAME_RPS' | 'GAME_HOTPOTATO', newState: TicTacToeState | RPSState | null) => {
      setGames((prev) => {
        if (!prev) return prev;
        if (gameType === 'GAME_TTT') return { ...prev, ticTacToe: newState as TicTacToeState };
        if (gameType === 'GAME_RPS') return { ...prev, rps: newState as RPSState };
        return prev;
      });
      await fetch(`/api/room/${roomId}`, {
        method: 'POST',
        body: JSON.stringify({ type: gameType, state: newState }),
      });
    },
    [roomId]
  );

  return {
    currentCardIndex,
    sendCardChange,
    reactions,
    sendReaction,
    chats,
    sendChat,
    games,
    updateGameState,
  };
}