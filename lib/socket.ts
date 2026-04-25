import { useState, useEffect, useRef, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  sender: 'Me' | 'You';
  senderName?: string;
  text: string;
  timestamp: number;
}

export function useMockSocket(roomId: string, currentName?: string) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [reactions, setReactions] = useState<{ id: number, emoji: string, x: number }[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [games, setGames] = useState<any>(null);
  const lastFetchRef = useRef<number>(0);
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
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (!res.ok) return;
        const data = await res.json();
        
        if (!mountedRef.current) return;
        
        setCurrentCardIndex(data.cardIndex);
        setReactions(data.reactions || []);
        if (data.games) setGames(data.games);
        
        const newChats = data.chats || [];
        setChats(newChats.map((c: any) => ({
           id: c.id,
           sender: c.senderDeviceId === deviceId ? 'Me' : 'You',
           senderName: c.senderName,
           text: c.text,
           timestamp: c.timestamp
        })));
      } catch(e) {}
    }

    poll();
    
    pollingRef.current = setInterval(() => poll(true), 3000);
    
    return () => {
      mountedRef.current = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
  }, [roomId]);

  const sendCardChange = async (idx: number) => {
    setCurrentCardIndex(idx);
    await fetch(`/api/room/${roomId}`, { method: 'POST', body: JSON.stringify({ type: 'CARD', cardIndex: idx }) });
  };

  const sendReaction = async (emoji: string) => {
    const reaction = { id: Date.now(), emoji, x: Math.random() * 80 + 10 };
    setReactions(prev => [...prev, reaction]);
    await fetch(`/api/room/${roomId}`, { method: 'POST', body: JSON.stringify({ type: 'REACTION', reaction }) });
  };

  const sendChat = async (text: string) => {
    const deviceId = localStorage.getItem('deviceId') || 'unknown';
    const chatMsg = { id: Math.random().toString(36).slice(2), senderDeviceId: deviceId, senderName: currentName || 'Anonymous', text, timestamp: Date.now() };
    setChats(prev => [...prev, { id: chatMsg.id, sender: 'Me', senderName: currentName || 'Anonymous', text: chatMsg.text, timestamp: chatMsg.timestamp }]);
    await fetch(`/api/room/${roomId}`, { method: 'POST', body: JSON.stringify({ type: 'CHAT', chat: chatMsg }) });
  };

  const updateGameState = async (gameType: 'GAME_TTT' | 'GAME_RPS' | 'GAME_HOTPOTATO', newState: any) => {
    // Optimistic UI
    setGames((prev: any) => {
      if (!prev) return prev;
      if (gameType === 'GAME_TTT') return { ...prev, ticTacToe: newState };
      if (gameType === 'GAME_RPS') return { ...prev, rps: newState };
      if (gameType === 'GAME_HOTPOTATO') return { ...prev, hotPotato: newState };
      return prev;
    });
    await fetch(`/api/room/${roomId}`, { method: 'POST', body: JSON.stringify({ type: gameType, state: newState }) });
  };

  return { currentCardIndex, sendCardChange, reactions, sendReaction, chats, sendChat, games, updateGameState };
}
