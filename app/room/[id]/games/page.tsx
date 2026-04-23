"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMockSocket } from "../../../../lib/socket";

type GameType = "TTT" | "RPS" | "HOTPOTATO";

const WINNING_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

const RPS_CHOICES = ["rock", "paper", "scissors"] as const;

export default function Games() {
    const params = useParams();
    const roomId = params?.id as string;
    const router = useRouter();

    const [userName, setUserName] = useState("");
    const [deviceId, setDeviceId] = useState("");
    const [activeGame, setActiveGame] = useState<GameType | null>(null);
    const [chatOpen, setChatOpen] = useState(true);
    const [chatInput, setChatInput] = useState("");

    useEffect(() => {
        setUserName(localStorage.getItem('closely_name') || "");
        setDeviceId(localStorage.getItem('deviceId') || "");
    }, []);

    const { games, updateGameState, chats, sendChat } = useMockSocket(roomId, userName);

    const ttt = games?.ticTacToe;
    const rps = games?.rps;

    const playTtt = (index: number) => {
        if (!ttt || ttt.winner || ttt.board[index]) return;

        let nx = ttt.xPlayer;
        let no = ttt.oPlayer;
        if (!nx && no !== deviceId) nx = deviceId;
        else if (!no && nx !== deviceId) no = deviceId;

        if (ttt.nextTurn === "X" && nx !== deviceId) return;
        if (ttt.nextTurn === "O" && no !== deviceId) return;

        const newBoard = [...ttt.board];
        newBoard[index] = ttt.nextTurn;

        let winner: string | null = null;
        let winningLine: number[] | null = null;
        for (const line of WINNING_LINES) {
            const [a, b, c] = line;
            if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
                winner = newBoard[a];
                winningLine = line;
                break;
            }
        }

        updateGameState('GAME_TTT', {
            board: newBoard,
            xPlayer: nx,
            oPlayer: no,
            nextTurn: ttt.nextTurn === "X" ? "O" : "X",
            winner,
            winningLine
        });
    };

    const resetTtt = () => updateGameState('GAME_TTT', {
        board: Array(9).fill(null),
        xPlayer: null,
        oPlayer: null,
        nextTurn: 'X',
        winner: null,
        winningLine: null
    });

    const playRps = (choice: string) => {
        if (!rps || rps.status === 'finished') return;

        const newRps = { ...rps };
        let amP1 = false, amP2 = false;

        if (rps.p1?.id === deviceId) amP1 = true;
        else if (rps.p2?.id === deviceId) amP2 = true;
        else if (!rps.p1) { newRps.p1 = { id: deviceId, choice: null, name: userName }; amP1 = true; }
        else if (!rps.p2) { newRps.p2 = { id: deviceId, choice: null, name: userName }; amP2 = true; }

        if (amP1) newRps.p1!.choice = choice;
        if (amP2) newRps.p2!.choice = choice;

        if (newRps.p1?.choice && newRps.p2?.choice) {
            newRps.status = 'reveal';
            setTimeout(() => {
                const p1 = newRps.p1!.choice;
                const p2 = newRps.p2!.choice;
                let winnerId: string | null = 'tie';

                if (p1 !== p2) {
                    const wins = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
                    if (wins[p1 as keyof typeof wins] === p2) winnerId = newRps.p1!.id;
                    else winnerId = newRps.p2!.id;
                }

                newRps.winnerId = winnerId;
                newRps.status = 'finished';
                updateGameState('GAME_RPS', { ...newRps });
            }, 1200);
        }

        updateGameState('GAME_RPS', newRps);
    };

    const resetRps = () => updateGameState('GAME_RPS', {
        p1: null, p2: null, status: 'waiting', winnerId: null
    });

    const handleBack = () => {
        if (activeGame) setActiveGame(null);
        else router.push(`/room/${roomId}`);
    };

    const handleChatSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        sendChat(chatInput.trim());
        setChatInput("");
    };

    if (!games) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#fffcf2] selection:bg-froly selection:text-white">
                <div className="text-2xl font-black uppercase animate-pulse">Loading...</div>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col md:flex-row p-6 bg-[#fffcf2] selection:bg-froly selection:text-white">
            {/* Chat Button */}
            <button
                onClick={() => setChatOpen(true)}
                className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-secondary border-4 border-black rounded-full flex items-center justify-center text-3xl font-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:scale-105 transition-transform"
                style={{ display: chatOpen ? 'none' : 'flex' }}
            >
                💬
            </button>

            {/* Chat Sidebar */}
            <AnimatePresence>
                {chatOpen && (
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
                                    onClick={() => setChatOpen(false)}
                                    className="bg-white border-2 border-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-100"
                                >
                                    ✕ Close
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 mb-4 max-h-[60vh] md:max-h-none">
                                {chats.map((msg, i) => {
                                    const isMe = msg.sender === 'Me';
                                    return (
                                        <motion.div
                                            key={msg.id + i}
                                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
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
                            </div>

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
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content - always visible */}
            <div className="flex-1 flex flex-col items-center">
                <header className="w-full flex justify-between items-center z-10 max-w-xl mx-auto pt-4 relative mb-12">
                    <button
                        onClick={handleBack}
                        className="bg-white border-4 border-black text-black px-4 py-2 font-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all uppercase cursor-pointer"
                    >
                        ← {activeGame ? 'Menu' : 'Cards'}
                    </button>
                    <div className="text-xl font-bold bg-highlight border-4 border-black px-6 py-2 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase">
                        {activeGame || 'ARCADE'}
                    </div>
                </header>

                {!activeGame ? (
                    <div className="max-w-xl w-full flex flex-col gap-6">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveGame('TTT')}
                            className="w-full bg-primary border-8 border-black rounded-3xl p-8 cursor-pointer shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all"
                        >
                            <h2 className="text-4xl font-display font-black uppercase mb-2">Tic Tac Toe</h2>
                            <p className="font-bold text-xl opacity-80">Classic brutal battle of Xs and Os.</p>
                        </motion.div>

                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveGame('RPS')}
                            className="w-full bg-secondary border-8 border-black rounded-3xl p-8 cursor-pointer shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all"
                        >
                            <h2 className="text-4xl font-display font-black uppercase mb-2">Rock Paper Scissors</h2>
                            <p className="font-bold text-xl opacity-80">Sync up and throw your hand down.</p>
                        </motion.div>

                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveGame('HOTPOTATO')}
                            className="w-full bg-accent border-8 border-black rounded-3xl p-8 cursor-pointer shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all"
                        >
                            <h2 className="text-4xl font-display font-black uppercase mb-2">Hot Potato</h2>
                            <p className="font-bold text-xl opacity-80">Don't get caught with the hot potato!</p>
                        </motion.div>
                    </div>
                ) : activeGame === 'TTT' ? (
                    <div className="flex flex-col items-center w-full max-w-md">
                        <h2 className="text-5xl font-display font-black uppercase mb-8 tracking-widest bg-primary px-6 py-2 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-[-2deg]">Tic Tac Toe</h2>

                        <div className="grid grid-cols-3 gap-4 w-full bg-black p-4 rounded-xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                            {ttt?.board.map((cell: string | null, i: number) => (
                                <motion.div
                                    key={i}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => playTtt(i)}
                                    className={`aspect-square bg-white rounded-lg border-4 border-black flex items-center justify-center text-7xl font-display font-black cursor-pointer shadow-[Inset_0_-6px_rgba(0,0,0,0.1)] 
                  ${ttt?.winningLine?.includes(i) ? "bg-highlight animate-pulse" : ""} 
                  ${cell === "X" ? "text-primary" : "text-secondary"}`}
                                >
                                    {cell && (
                                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1, rotate: cell === 'X' ? 10 : -10 }} transition={{ type: "spring" }}>
                                            {cell}
                                        </motion.span>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        <div className="mt-8 text-center">
                            {ttt?.winner ? (
                                <div className="text-3xl font-black uppercase tracking-wider animate-bounce">{ttt.winner === 'Tie' ? 'Draw!' : `${ttt.winner} Wins!`}</div>
                            ) : (
                                <div className="text-2xl font-bold uppercase">Turn: <span className="text-3xl font-black bg-white px-3 py-1 border-2 border-black rounded-full">{ttt?.nextTurn}</span></div>
                            )}
                        </div>

                        <button onClick={resetTtt} className="mt-8 px-8 py-3 bg-white border-4 border-black font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all uppercase cursor-pointer">Reset Board</button>
                    </div>
                ) : activeGame === 'RPS' ? (
                    <div className="flex flex-col items-center w-full max-w-md text-center">
                        <h2 className="text-5xl font-display font-black uppercase mb-8 tracking-widest bg-secondary px-6 py-2 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-[2deg]">Rock, Paper, Scissors</h2>

                        <div className="w-full flex justify-between gap-4 mb-12">
                            <div className="flex-1 bg-white border-4 border-black p-6 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative">
                                <span className="absolute -top-4 -left-4 bg-black text-white px-3 py-1 font-bold rounded-lg rotate-[-10deg]">P1</span>
                                <div className="text-6xl mt-4">
                                    {rps?.p1 ? (rps.status === 'finished' ? (rps.p1.choice === 'rock' ? '🪨' : rps.p1.choice === 'paper' ? '📄' : '✂️') : '❓') : 'Waiting...'}
                                </div>
                            </div>

                            <div className="flex items-center text-4xl font-black">VS</div>

                            <div className="flex-1 bg-white border-4 border-black p-6 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative">
                                <span className="absolute -top-4 -right-4 bg-black text-white px-3 py-1 font-bold rounded-lg rotate-[10deg]">P2</span>
                                <div className="text-6xl mt-4">
                                    {rps?.p2 ? (rps.status === 'finished' ? (rps.p2.choice === 'rock' ? '🪨' : rps.p2.choice === 'paper' ? '📄' : '✂️') : '❓') : 'Waiting...'}
                                </div>
                            </div>
                        </div>

                        {rps?.status === 'finished' && (
                            <div className="mb-12 font-display text-4xl font-black uppercase bg-highlight px-6 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce">
                                {rps.winnerId === 'tie' ? "IT'S A TIE!" : rps.winnerId === deviceId ? "YOU WON! 🎉" : "YOU LOST! 😭"}
                            </div>
                        )}

                        <div className="flex gap-4">
                            {RPS_CHOICES.map(choice => (
                                <motion.button
                                    key={choice}
                                    whileHover={{ scale: 1.1, rotate: Math.random() * 10 - 5 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => playRps(choice)}
                                    disabled={rps?.status !== 'waiting' && ((rps?.p1?.id === deviceId && rps?.p1?.choice) || (rps?.p2?.id === deviceId && rps?.p2?.choice))}
                                    className="bg-white border-4 border-black rounded-2xl w-24 h-24 text-5xl flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 disabled:opacity-50 transition-all uppercase cursor-pointer"
                                >
                                    {choice === 'rock' ? '🪨' : choice === 'paper' ? '📄' : '✂️'}
                                </motion.button>
                            ))}
                        </div>

                        <button onClick={resetRps} className="mt-12 px-8 py-3 bg-white border-4 border-black font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all uppercase cursor-pointer">Play Again</button>
                    </div>
                ) : (
                    <HotPotatoGame deviceId={deviceId} chats={chats} />
                )}
            </div>
        </main>
    );
}

function HotPotatoGame({ deviceId, chats }: { deviceId: string; chats: any[] }) {
    const [status, setStatus] = useState<'idle' | 'passing' | 'exploded'>('idle');
    const [holderId, setHolderId] = useState<string | null>(null);
    const [timer, setTimer] = useState(10);

    const players = useMemo(() => {
        const ids = new Set<string>();
        chats.forEach((m: any) => ids.add(m.sender === 'Me' ? deviceId : m.senderDeviceId || ''));
        return Array.from(ids).filter(Boolean);
    }, [chats, deviceId]);

    const passToRandom = () => {
        const others = players.filter(p => p !== holderId);
        if (others.length === 0) return deviceId;
        return others[Math.floor(Math.random() * others.length)];
    };

    const startGame = () => {
        if (players.length < 2) return;
        const firstHolder = players[Math.floor(Math.random() * players.length)];
        setHolderId(firstHolder);
        setTimer(10);
        setStatus('passing');

        const interval = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setStatus('exploded');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const pass = () => {
        const nextHolder = passToRandom();
        setHolderId(nextHolder);
        setTimer(10);
    };

    const amHolder = holderId === deviceId;

    return (
        <div className="flex flex-col items-center w-full max-w-md">
            <h2 className="text-5xl font-display font-black uppercase mb-8 tracking-widest bg-accent px-6 py-2 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-[-2deg]">Hot Potato</h2>

            {status === 'idle' ? (
                <div className="text-center">
                    <p className="font-bold text-xl mb-4">Pass the hot potato before it explodes!</p>
                    <p className="text-lg opacity-70 mb-8">{players.length} players in room</p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={startGame}
                        disabled={players.length < 2}
                        className="bg-destructive border-4 border-black px-8 py-4 rounded-2xl font-black text-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 cursor-pointer"
                    >
                        Start Game
                    </motion.button>
                </div>
            ) : (
                <>
                    <motion.div
                        animate={amHolder && status === 'passing' ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 0.5 }}
                        className={`text-8xl mb-6 ${timer <= 3 ? 'text-red-600 animate-pulse' : ''}`}
                    >
                        {status === 'exploded' ? '💥' : '🥔'}
                    </motion.div>

                    <div className={`text-6xl font-black mb-6 ${timer <= 3 ? 'text-red-600' : ''}`}>
                        {timer}
                    </div>

                    {amHolder && status === 'passing' && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={pass}
                            className="bg-primary border-4 border-black px-12 py-4 rounded-2xl font-black text-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-6 cursor-pointer"
                        >
                            Pass!
                        </motion.button>
                    )}

                    <div className="text-center mb-8">
                        {status === 'exploded' ? (
                            <div className="text-3xl font-black text-red-600">
                                {holderId === deviceId ? 'YOU EXPLODED! 💀' : 'SOMEONE EXPLODED! 😅'}
                            </div>
                        ) : (
                            <div className="text-2xl font-bold">
                                {amHolder ? 'You have the potato!' : 'Passing...'}
                            </div>
                        )}
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setStatus('idle'); setTimer(10); }}
                        className="bg-white border-4 border-black px-8 py-3 rounded-xl font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                    >
                        Play Again
                    </motion.button>
                </>
            )}
        </div>
    );
}