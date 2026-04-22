import { useState, useEffect } from 'react';

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

  useEffect(() => {
    let _mounted = true;
    
    if (typeof window !== 'undefined' && !localStorage.getItem('deviceId')) {
      localStorage.setItem('deviceId', Math.random().toString(36).slice(2));
    }
    const deviceId = typeof window !== 'undefined' ? localStorage.getItem('deviceId') : 'unknown';

    const poll = async () => {
      try {
        const res = await fetch(`/api/room/${roomId}`);
        if (!res.ok) return;
        const data = await res.json();
        
        if (!_mounted) return;
        
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

    const interval = setInterval(poll, 1000);
    poll(); 
    
    return () => {
      _mounted = false;
      clearInterval(interval);
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

  const updateGameState = async (gameType: 'GAME_TTT' | 'GAME_RPS' | 'GAME_TUG', newState: any) => {
    // Optimistic UI
    setGames((prev: any) => {
      if (!prev) return prev;
      if (gameType === 'GAME_TTT') return { ...prev, ticTacToe: newState };
      if (gameType === 'GAME_RPS') return { ...prev, rps: newState };
      if (gameType === 'GAME_TUG') return { ...prev, tug: newState };
      return prev;
    });
    await fetch(`/api/room/${roomId}`, { method: 'POST', body: JSON.stringify({ type: gameType, state: newState }) });
  };

  return { currentCardIndex, sendCardChange, reactions, sendReaction, chats, sendChat, games, updateGameState };
}
