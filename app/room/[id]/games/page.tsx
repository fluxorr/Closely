// "use client";

// import { useParams, useRouter } from "next/navigation";
// import { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { useMockSocket } from "../../../../lib/socket";

// export default function Games() {
//   const params = useParams();
//   const roomId = params?.id as string;
//   const router = useRouter();

//   const [userName, setUserName] = useState("");
//   const [deviceId, setDeviceId] = useState("");
//   const [activeGame, setActiveGame] = useState<"TTT" | "RPS" | "TUG" | "MEMORY" | "CARD_FLIP" | null>(null);

//   // Game states
//   const [memoryBoard, setMemoryBoard] = useState<number[]>([]);
//   const [memoryFlipped, setMemoryFlipped] = useState<number[]>([]);
//   const [memoryMatched, setMemoryMatched] = useState<number[]>([]);
//   const [memoryMoves, setMemoryMoves] = useState(0);
//   const [memoryIsChecking, setMemoryIsChecking] = useState(false);

//   const [cardFlipCards, setCardFlipCards] = useState<number[]>([]);
//   const [cardFlipFlipped, setCardFlipFlipped] = useState<number[]>([]);
//   const [cardFlipMatched, setCardFlipMatched] = useState<number[]>([]);
//   const [cardFlipMoves, setCardFlipMoves] = useState(0);
//   const [cardFlipIsChecking, setCardFlipIsChecking] = useState(false);

//   useEffect(() => {
//     const saved = localStorage.getItem('closely_name');
//     if (saved) setUserName(saved);
//     setDeviceId(localStorage.getItem('deviceId') || "");
//   }, []);

//   const { games, updateGameState, chats } = useMockSocket(roomId, userName);

//   if (!games) {
//     return <div className="min-h-screen flex items-center justify-center font-display font-black text-2xl uppercase">Loading Game Center...</div>;
//   }

//   // TIC TAC TOE LOGIC
//   const { ticTacToe: ttt } = games;
//   const playTtt = (index: number) => {
//     if (ttt.winner || ttt.board[index]) return;

//     let nextXPlayer = ttt.xPlayer;
//     let nextOPlayer = ttt.oPlayer;

//     // Self-assign if empty
//     if (!nextXPlayer && nextOPlayer !== deviceId) nextXPlayer = deviceId;
//     else if (!nextOPlayer && nextXPlayer !== deviceId) nextOPlayer = deviceId;

//     // Checking turn
//     if (ttt.nextTurn === "X" && nextXPlayer !== deviceId) return;
//     if (ttt.nextTurn === "O" && nextOPlayer !== deviceId) return;

//     const newBoard = [...ttt.board];
//     newBoard[index] = ttt.nextTurn;

//     // Check winner
//     const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
//     let nextWinner = null;
//     let nextWinningLine = null;
//     for (let line of lines) {
//       const [a, b, c] = line;
//       if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
//         nextWinner = newBoard[a];
//         nextWinningLine = line;
//       }
//     }

//     updateGameState('GAME_TTT', {
//       board: newBoard,
//       xPlayer: nextXPlayer,
//       oPlayer: nextOPlayer,
//       nextTurn: ttt.nextTurn === "X" ? "O" : "X",
//       winner: nextWinner,
//       winningLine: nextWinningLine
//     });
//   };

//   const resetTtt = () => {
//     updateGameState('GAME_TTT', {
//       board: Array(9).fill(null),
//       xPlayer: null,
//       oPlayer: null,
//       nextTurn: 'X',
//       winner: null,
//       winningLine: null
//     });
//   };

//   // RPS LOGIC
//   const { rps } = games;
//   const playRps = (choice: string) => {
//     if (rps.status === 'finished') return;
//     let newRps = { ...rps };
//     let amP1 = false, amP2 = false;

//     if (rps.p1?.id === deviceId) amP1 = true;
//     else if (rps.p2?.id === deviceId) amP2 = true;
//     else if (!rps.p1) { newRps.p1 = { id: deviceId, choice: null, name: userName }; amP1 = true; }
//     else if (!rps.p2) { newRps.p2 = { id: deviceId, choice: null, name: userName }; amP2 = true; }

//     if (amP1) newRps.p1.choice = choice;
//     if (amP2) newRps.p2.choice = choice;

//     if (newRps.p1?.choice && newRps.p2?.choice) {
//       newRps.status = 'reveal';
//       setTimeout(() => {
//         let p1Choice = newRps.p1.choice;
//         let p2Choice = newRps.p2.choice;
//         let winner = null;
//         if (p1Choice === p2Choice) winner = 'tie';
//         else if (
//           (p1Choice === 'rock' && p2Choice === 'scissors') ||
//           (p1Choice === 'paper' && p2Choice === 'rock') ||
//           (p1Choice === 'scissors' && p2Choice === 'paper')
//         ) winner = newRps.p1.id;
//         else winner = newRps.p2.id;

//         newRps.winnerId = winner;
//         newRps.status = 'finished';
//         updateGameState('GAME_RPS', { ...newRps });
//       }, 1000);
//     }

//     updateGameState('GAME_RPS', newRps);
//   };

//   const resetRps = () => updateGameState('GAME_RPS', { p1: null, p2: null, status: 'waiting', winnerId: null });

//   // TUG OF WAR LOGIC
//   const { tug } = games;
//   const playTug = () => {
//     let newTug = { ...tug };
//     let amP1 = false, amP2 = false;

//     if (tug.p1?.id === deviceId) amP1 = true;
//     else if (tug.p2?.id === deviceId) amP2 = true;
//     else if (!tug.p1) { newTug.p1 = { id: deviceId, score: 0, name: userName }; amP1 = true; }
//     else if (!tug.p2) { newTug.p2 = { id: deviceId, score: 0, name: userName }; amP2 = true; }

//     if (amP1) newTug.p1.score += 1;
//     if (amP2) newTug.p2.score += 1;

//     if (newTug.p1?.score >= 50) newTug.winnerId = newTug.p1.id;
//     if (newTug.p2?.score >= 50) newTug.winnerId = newTug.p2.id;

//     updateGameState('GAME_TUG', newTug);
//   };
//   const resetTug = () => updateGameState('GAME_TUG', { p1: null, p2: null, winnerId: null });

//   // MEMORY MATCH LOGIC
//   useEffect(() => {
//     if (games.memory && games.memory.board) {
//       setMemoryBoard(games.memory.board);
//       setMemoryFlipped(games.memory.flipped || []);
//       setMemoryMatched(games.memory.matched || []);
//       setMemoryMoves(games.memory.moves || 0);
//     }
//   }, [games.memory]);

//   const playMemory = (index: number) => {
//     if (memoryIsChecking || memoryFlipped.includes(index) || memoryMatched.includes(index)) return;

//     const newFlipped = [...memoryFlipped, index];
//     setMemoryFlipped(newFlipped);

//     if (newFlipped.length === 2) {
//       setMemoryIsChecking(true);
//       setMemoryMoves(memoryMoves + 1);

//       const [firstIndex, secondIndex] = newFlipped;
//       const firstCard = memoryBoard[firstIndex];
//       const secondCard = memoryBoard[secondIndex];

//       if (firstCard === secondCard) {
//         // Match found
//         setMemoryMatched([...memoryMatched, firstIndex, secondIndex]);
//         setMemoryFlipped([]);
//         setMemoryIsChecking(false);
//       } else {
//         // No match, flip back after delay
//         setTimeout(() => {
//           setMemoryFlipped([]);
//           setMemoryIsChecking(false);
//         }, 1000);
//       }
//     }
//   };

//   const resetMemory = () => {
//     const symbols = ['🍎', '🍌', '🍒', '🍇', '🍊', '🍓', '🥝', '🍑'];
//     const board = [...symbols, ...symbols].map((_, i) => i % symbols.length);
//     // Shuffle the board
//     const shuffled = [...board].sort(() => Math.random() - 0.5);

//     updateGameState('GAME_MEMORY', {
//       board: shuffled,
//       flipped: [],
//       matched: [],
//       moves: 0,
//       completed: false
//     });
//   };

//   // CARD FLIP GAME LOGIC
//   useEffect(() => {
//     if (games.cardFlip && games.cardFlip.cards) {
//       setCardFlipCards(games.cardFlip.cards);
//       setCardFlipFlipped(games.cardFlip.flipped || []);
//       setCardFlipMatched(games.cardFlip.matched || []);
//       setCardFlipMoves(games.cardFlip.moves || 0);
//     }
//   }, [games.cardFlip]);

//   const playCardFlip = (index: number) => {
//     if (cardFlipIsChecking || cardFlipFlipped.includes(index) || cardFlipMatched.includes(index)) return;

//     const newFlipped = [...cardFlipFlipped, index];
//     setCardFlipFlipped(newFlipped);

//     if (newFlipped.length === 2) {
//       setCardFlipIsChecking(true);
//       setCardFlipMoves(cardFlipMoves + 1);

//       const [firstIndex, secondIndex] = newFlipped;
//       const firstCard = cardFlipCards[firstIndex];
//       const secondCard = cardFlipCards[secondIndex];

//       if (firstCard === secondCard) {
//         // Match found
//         setCardFlipMatched([...cardFlipMatched, firstIndex, secondIndex]);
//         setCardFlipFlipped([]);
//         setCardFlipIsChecking(false);
//       } else {
//         // No match, flip back after delay
//         setTimeout(() => {
//           setCardFlipFlipped([]);
//           setCardFlipIsChecking(false);
//         }, 1000);
//       }
//     }
//   };

//   const resetCardFlip = () => {
//     // Create 8 pairs of cards from existing cards
//     const allCards = [...Array(16).keys()];
//     const shuffled = [...allCards].sort(() => Math.random() - 0.5);

//     updateGameState('GAME_CARD_FLIP', {
//       cards: shuffled,
//       flipped: [],
//       matched: [],
//       moves: 0,
//       completed: false
//     });
//   };

//   // MENU VIEW
//   if (!activeGame) {
//     return (
//       <main className="flex min-h-screen flex-col md:flex-row p-6 bg-[#fffcf2] selection:bg-froly selection:text-white">
//         {/* Sidebar Chat */}
//         <div className="w-full md:w-80 flex flex-col md:flex-col md:mr-6">
//           {/* Chat header */}
//           <div className="flex justify-between items-center p-4 border-b-4 border-black bg-secondary mb-4">
//             <h2 className="text-2xl font-black uppercase">Room Chat</h2>
//           </div>

//           {/* Chat Messages */}
//           <div className="flex-1 overflow-y-auto p-4 space-y-4 mb-4">
//             {chats.map((msg, i) => {
//               const isMe = msg.sender === 'Me';
//               return (
//                 <motion.div
//                   initial={{ opacity: 0, y: 20, scale: 0.9 }}
//                   animate={{ opacity: 1, y: 0, scale: 1 }}
//                   key={msg.id + i}
//                   className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
//                 >
//                   <span className="text-xs font-bold mb-1 opacity-60 uppercase">
//                     {isMe ? 'You' : msg.senderName || 'Anonymous'}
//                   </span>
//                   <div
//                     className={`max-w-[80%] px-4 py-3 rounded-2xl border-4 border-black font-bold text-lg 
//                     ${isMe ? 'bg-primary text-black rounded-br-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black rounded-bl-none shadow-[-4px_4px_0px_0px_rgba(0,0,0,1)]'}`}
//                   >
//                     {msg.text}
//                   </div>
//                 </motion.div>
//               );
//             })}
//           </div>

//           {/* Chat Input */}
//           <form onSubmit={(e) => e.preventDefault()} className="p-4 border-t-4 border-black bg-white flex gap-2">
//             <input
//               type="text"
//               placeholder="Say something..."
//               className="flex-1 border-4 border-black rounded-xl px-4 py-3 font-bold text-lg focus:outline-none focus:ring-4 focus:ring-secondary focus:border-black"
//               disabled
//             />
//             <button
//               type="submit"
//               className="bg-accent text-black border-4 border-black px-6 font-black rounded-xl text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all uppercase disabled:opacity-50 cursor-pointer"
//               disabled
//             >
//               Send
//             </button>
//           </form>
//         </div>

//         {/* Main Content */}
//         <div className="flex-1 flex flex-col">
//           <header className="w-full flex justify-between items-center z-10 max-w-xl mx-auto pt-4 relative mb-12">
//             <button
//               onClick={() => router.push(`/room/${roomId}`)}
//               className="bg-white border-4 border-black text-black px-4 py-2 font-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all uppercase cursor-pointer"
//             >
//               ← Back to Cards
//             </button>
//             <div className="text-xl font-bold bg-highlight border-4 border-black px-6 py-2 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase">
//               ARCADE
//             </div>
//           </header>

//           <div className="max-w-xl w-full flex flex-col gap-6">
//             <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
//               onClick={() => setActiveGame('TTT')}
//               className="w-full bg-primary border-8 border-black rounded-3xl p-8 cursor-pointer shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all"
//             >
//               <h2 className="text-4xl font-display font-black uppercase mb-2">Tic Tac Toe</h2>
//               <p className="font-bold text-xl opacity-80">Classic brutal battle of Xs and Os.</p>
//             </motion.div>

//             <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
//               onClick={() => setActiveGame('RPS')}
//               className="w-full bg-secondary border-8 border-black rounded-3xl p-8 cursor-pointer shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all"
//             >
//               <h2 className="text-4xl font-display font-black uppercase mb-2">Rock Paper Scissors</h2>
//               <p className="font-bold text-xl opacity-80">Sync up and throw your hand down.</p>
//             </motion.div>

//             <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
//               onClick={() => setActiveGame('MEMORY')}
//               className="w-full bg-accent border-8 border-black rounded-3xl p-8 cursor-pointer shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all"
//             >
//               <h2 className="text-4xl font-display font-black uppercase mb-2">Memory Match</h2>
//               <p className="font-bold text-xl opacity-80">Match pairs of emojis before they disappear!</p>
//             </motion.div>

//             <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
//               onClick={() => setActiveGame('CARD_FLIP')}
//               className="w-full bg-destructive border-8 border-black rounded-3xl p-8 cursor-pointer shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all"
//             >
//               <h2 className="text-4xl font-display font-black uppercase mb-2">Card Flip</h2>
//               <p className="font-bold text-xl opacity-80">Match pairs of cards from the deck!</p>
//             </motion.div>
//           </div>
//         </div>
//       </main>
//     );
//   }

//   return (
//     <main className="flex min-h-screen flex-col md:flex-row p-6 bg-[#fffcf2] selection:bg-froly selection:text-white">
//       {/* Sidebar Chat */}
//       <div className="w-full md:w-96 flex flex-col md:flex-col md:mr-6 border-r-4 border-black">
//         {/* Chat header */}
//         <div className="flex justify-between items-center p-4 border-b-4 border-black bg-secondary mb-4">
//           <h2 className="text-2xl font-black uppercase">Room Chat</h2>
//         </div>

//         {/* Chat Messages */}
//         <div className="flex-1 overflow-y-auto p-4 space-y-4 mb-4">
//           {chats.map((msg, i) => {
//             const isMe = msg.sender === 'Me';
//             return (
//               <motion.div
//                 initial={{ opacity: 0, y: 20, scale: 0.9 }}
//                 animate={{ opacity: 1, y: 0, scale: 1 }}
//                 key={msg.id + i}
//                 className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
//               >
//                 <span className="text-xs font-bold mb-1 opacity-60 uppercase">
//                   {isMe ? 'You' : msg.senderName || 'Anonymous'}
//                 </span>
//                 <div
//                   className={`max-w-[80%] px-4 py-3 rounded-2xl border-4 border-black font-bold text-lg 
//                   ${isMe ? 'bg-primary text-black rounded-br-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black rounded-bl-none shadow-[-4px_4px_0px_0px_rgba(0,0,0,1)]'}`}
//                 >
//                   {msg.text}
//                 </div>
//               </motion.div>
//             );
//           })}
//         </div>

//         {/* Chat Input */}
//         <form onSubmit={(e) => e.preventDefault()} className="p-4 border-t-4 border-black bg-white flex gap-2">
//           <input
//             type="text"
//             placeholder="Say something..."
//             className="flex-1 border-4 border-black rounded-xl px-4 py-3 font-bold text-lg focus:outline-none focus:ring-4 focus:ring-secondary focus:border-black"
//             disabled
//           />
//           <button
//             type="submit"
//             className="bg-accent text-black border-4 border-black px-6 font-black rounded-xl text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all uppercase disabled:opacity-50 cursor-pointer"
//             disabled
//           >
//             Send
//           </button>
//         </form>
//       </div>

//       {/* Camera View */}
//       <div className="w-full md:w-80 flex flex-col ml-6 md:ml-0">
//         <div className="flex justify-between items-center p-4 border-b-4 border-black bg-secondary mb-4">
//           <h2 className="text-2xl font-black uppercase">Camera View</h2>
//         </div>
        
//         <div className="flex-1 flex flex-col items-center justify-center p-4 border-4 border-black rounded-2xl bg-gray-200">
//           <div className="w-full h-full flex items-center justify-center">
//             <div className="bg-gray-300 border-2 border-dashed rounded-xl w-full h-64 flex items-center justify-center">
//               <span className="text-gray-500 font-bold">Camera Feed</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="flex-1 flex flex-col">
//         <header className="w-full flex justify-between items-center z-10 max-w-xl mx-auto pt-4 relative mb-12">
//           <button
//             onClick={() => setActiveGame(null)}
//             className="bg-white border-4 border-black text-black px-4 py-2 font-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all uppercase cursor-pointer"
//           >
//             ← Menu
//           </button>
//         </header>

//         {activeGame === 'TTT' && (
//           <div className="flex flex-col items-center w-full max-w-md">
//             <h2 className="text-5xl font-display font-black uppercase mb-8 tracking-widest bg-primary px-6 py-2 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-[-2deg]">Tic Tac Toe</h2>

//             <div className="grid grid-cols-3 gap-4 w-full bg-black p-4 rounded-xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
//               {ttt.board.map((cell: string, i: number) => (
//                 <motion.div
//                   key={i}
//                   whileTap={{ scale: 0.9 }}
//                   onClick={() => playTtt(i)}
//                   className={`aspect-square bg-white rounded-lg border-4 border-black flex items-center justify-center text-7xl font-display font-black cursor-pointer shadow-[Inset_0_-6px_rgba(0,0,0,0.1)] 
//                   ${ttt.winningLine?.includes(i) ? "bg-highlight animate-pulse" : ""} 
//                   ${cell === "X" ? "text-primary" : "text-secondary"}`}
//                 >
//                   {cell && (
//                     <motion.span initial={{ scale: 0 }} animate={{ scale: 1, rotate: cell === 'X' ? 10 : -10 }} transition={{ type: "spring" }}>
//                       {cell}
//                     </motion.span>
//                   )}
//                 </motion.div>
//               ))}
//             </div>

//             <div className="mt-8 text-center">
//               {ttt.winner ? (
//                 <div className="text-3xl font-black uppercase tracking-wider animate-bounce">{ttt.winner === 'Tie' ? 'Draw!' : `${ttt.winner} Wins!`}</div>
//               ) : (
//                 <div className="text-2xl font-bold uppercase">Turn: <span className="text-3xl font-black bg-white px-3 py-1 border-2 border-black rounded-full">{ttt.nextTurn}</span></div>
//               )}
//             </div>

//             <button onClick={resetTtt} className="mt-8 px-8 py-3 bg-white border-4 border-black font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all uppercase">Reset Board</button>
//           </div>
//         )}

//         {activeGame === 'RPS' && (
//           <div className="flex flex-col items-center w-full max-w-md text-center">
//             <h2 className="text-5xl font-display font-black uppercase mb-8 tracking-widest bg-secondary px-6 py-2 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-[2deg]">Rock, Paper, Scissors</h2>

//             <div className="w-full flex justify-between gap-4 mb-12">
//               <div className="flex-1 bg-white border-4 border-black p-6 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative">
//                 <span className="absolute -top-4 -left-4 bg-black text-white px-3 py-1 font-bold rounded-lg rotate-[-10deg]">P1</span>
//                 <div className="text-6xl mt-4">
//                   {rps.p1 ? (rps.status === 'finished' ? (rps.p1.choice === 'rock' ? '🪨' : rps.p1.choice === 'paper' ? '📄' : '✂️') : '❓') : 'Waiting...'}
//                 </div>
//               </div>

//               <div className="flex items-center text-4xl font-black">VS</div>

//               <div className="flex-1 bg-white border-4 border-black p-6 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative">
//                 <span className="absolute -top-4 -right-4 bg-black text-white px-3 py-1 font-bold rounded-lg rotate-[10deg]">P2</span>
//                 <div className="text-6xl mt-4">
//                   {rps.p2 ? (rps.status === 'finished' ? (rps.p2.choice === 'rock' ? '🪨' : rps.p2.choice === 'paper' ? '📄' : '✂️') : '❓') : 'Waiting...'}
//                 </div>
//               </div>
//             </div>

//             {rps.status === 'finished' && (
//               <div className="mb-12 font-display text-4xl font-black uppercase bg-highlight px-6 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce">
//                 {rps.winnerId === 'tie' ? "IT'S A TIE!" : rps.winnerId === deviceId ? "YOU WON! 🎉" : "YOU LOST! 😭"}
//               </div>
//             )}

//             <div className="flex gap-4">
//               {['rock', 'paper', 'scissors'].map(choice => (
//                 <motion.button
//                   key={choice}
//                   whileHover={{ scale: 1.1, rotate: Math.random() * 10 - 5 }}
//                   whileTap={{ scale: 0.9 }}
//                   onClick={() => playRps(choice)}
//                   disabled={rps.status !== 'waiting' && ((rps.p1?.id === deviceId && rps.p1?.choice) || (rps.p2?.id === deviceId && rps.p2?.choice))}
//                   className="bg-white border-4 border-black rounded-2xl w-24 h-24 text-5xl flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 disabled:opacity-50 transition-all uppercase cursor-pointer"
//                 >
//                   {choice === 'rock' ? '🪨' : choice === 'paper' ? '📄' : '✂️'}
//                 </motion.button>
//               ))}
//             </div>

//             <button onClick={resetRps} className="mt-12 px-8 py-3 bg-white border-4 border-black font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all uppercase cursor-pointer">Play Again</button>
//           </div>
//         )}

//         {activeGame === 'MEMORY' && (
//           <div className="flex flex-col items-center w-full max-w-md">
//             <h2 className="text-5xl font-display font-black uppercase mb-8 tracking-widest bg-accent px-6 py-2 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-[-2deg]">Memory Match</h2>

//             <div className="grid grid-cols-4 gap-4 w-full mb-8">
//               {memoryBoard.map((symbol: number, i: number) => (
//                 <motion.div
//                   key={i}
//                   whileTap={{ scale: 0.9 }}
//                   onClick={() => playMemory(i)}
//                   className={`aspect-square bg-white rounded-lg border-4 border-black flex items-center justify-center text-4xl font-display font-black cursor-pointer shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] 
//                     ${memoryFlipped.includes(i) || memoryMatched.includes(i) ? 'bg-primary text-black' : 'bg-white'} 
//                     ${memoryMatched.includes(i) ? 'animate-pulse' : ''}`}
//                 >
//                   {memoryFlipped.includes(i) || memoryMatched.includes(i) ? (
//                     <motion.span
//                       initial={{ rotate: 0, scale: 0 }}
//                       animate={{ rotate: 360, scale: 1 }}
//                       transition={{ type: "spring", stiffness: 300 }}
//                     >
//                       {['🍎', '🍌', '🍒', '🍇', '🍊', '🍓', '🥝', '🍑'][symbol]}
//                     </motion.span>
//                   ) : (
//                     <span className="text-3xl">?</span>
//                   )}
//                 </motion.div>
//               ))}
//             </div>

//             <div className="text-center mb-4">
//               <div className="text-2xl font-bold">Moves: <span className="text-3xl font-black">{memoryMoves}</span></div>
//               <div className="text-xl mt-2">Matched: <span className="text-2xl font-black">{memoryMatched.length / 2} / 8</span></div>
//             </div>

//             <button onClick={resetMemory} className="mt-4 px-8 py-3 bg-white border-4 border-black font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all uppercase">Reset Game</button>
//           </div>
//         )}

//         {activeGame === 'CARD_FLIP' && (
//           <div className="flex flex-col items-center w-full max-w-md">
//             <h2 className="text-5xl font-display font-black uppercase mb-8 tracking-widest bg-destructive px-6 py-2 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-[2deg]">Card Flip</h2>

//             <div className="grid grid-cols-4 gap-4 w-full mb-8">
//               {cardFlipCards.map((cardIndex: number, i: number) => (
//                 <motion.div
//                   key={i}
//                   whileTap={{ scale: 0.9 }}
//                   onClick={() => playCardFlip(i)}
//                   className={`aspect-square bg-white rounded-lg border-4 border-black flex items-center justify-center text-4xl font-display font-black cursor-pointer shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] 
//                     ${cardFlipFlipped.includes(i) || cardFlipMatched.includes(i) ? 'bg-primary text-black' : 'bg-white'} 
//                     ${cardFlipMatched.includes(i) ? 'animate-pulse' : ''}`}
//                 >
//                   {cardFlipFlipped.includes(i) || cardFlipMatched.includes(i) ? (
//                     <motion.span
//                       initial={{ rotate: 0, scale: 0 }}
//                       animate={{ rotate: 360, scale: 1 }}
//                       transition={{ type: "spring", stiffness: 300 }}
//                     >
//                       {cardIndex}
//                     </motion.span>
//                   ) : (
//                     <span className="text-3xl">?</span>
//                   )}
//                 </motion.div>
//               ))}
//             </div>

//             <div className="text-center mb-4">
//               <div className="text-2xl font-bold">Moves: <span className="text-3xl font-black">{cardFlipMoves}</span></div>
//               <div className="text-xl mt-2">Matched: <span className="text-2xl font-black">{cardFlipMatched.length / 2} / 8</span></div>
//             </div>

//             <button onClick={resetCardFlip} className="mt-4 px-8 py-3 bg-white border-4 border-black font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all uppercase">Reset Game</button>
//           </div>
//         )}
//       </div>
//     </main>
//   );
// }