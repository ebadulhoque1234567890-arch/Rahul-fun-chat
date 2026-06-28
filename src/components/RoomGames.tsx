import React, { useState, useEffect } from "react";
import { Sparkles, Trophy, HelpCircle, Shuffle, Award, AlertCircle } from "lucide-react";

// ==========================================
// 1. LUDO DICE GAME COMPONENT
// ==========================================
export function LudoGame() {
  const [diceValue, setDiceValue] = useState<number>(6);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [playerPositions, setPlayerPositions] = useState<{ [player: string]: number }>({
    Red: 0,
    Blue: 0,
    Green: 0,
    Yellow: 0
  });
  const [currentTurn, setCurrentTurn] = useState<string>("Red");
  const [ludoHistory, setLudoHistory] = useState<string[]>(["Red initiated the board game!"]);

  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    
    let rollCounter = 0;
    const rollInterval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rollCounter++;
      if (rollCounter > 6) {
        clearInterval(rollInterval);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalValue);
        setIsRolling(false);
        
        // Move current player token
        setPlayerPositions(prev => {
          const nextPos = prev[currentTurn] + finalValue;
          const cappedPos = nextPos > 50 ? 50 : nextPos;
          
          if (cappedPos === 50) {
            setLudoHistory(h => [`🏆 PLAYER ${currentTurn.toUpperCase()} REACHED HOME & WON!`, ...h.slice(0, 5)]);
          } else {
            setLudoHistory(h => [`${currentTurn} rolled and moved +${finalValue} (Pos: ${cappedPos})`, ...h.slice(0, 5)]);
          }
          return { ...prev, [currentTurn]: cappedPos };
        });

        // Switch turns
        const players = ["Red", "Blue", "Green", "Yellow"];
        const nextIndex = (players.indexOf(currentTurn) + 1) % players.length;
        setCurrentTurn(players[nextIndex]);
      }
    }, 100);
  };

  const resetLudo = () => {
    setPlayerPositions({ Red: 0, Blue: 0, Green: 0, Yellow: 0 });
    setCurrentTurn("Red");
    setLudoHistory(["Board resetted!"]);
  };

  return (
    <div className="flex flex-col gap-3 p-1 font-sans text-slate-200">
      <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-xl">
        <span className="text-[10px] text-gray-400 font-bold uppercase">Ludo Dice Arena</span>
        <button onClick={resetLudo} className="text-[8px] bg-red-650 px-2 py-0.5 rounded text-white font-bold uppercase">Reset</button>
      </div>

      {/* Turn indicator & Dice box */}
      <div className="flex items-center justify-around bg-slate-900/85 p-3 rounded-2xl border border-white/5">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-400 font-medium uppercase leading-tight">Current Turn</span>
          <span className={`text-sm font-black uppercase ${
            currentTurn === "Red" ? "text-red-500" :
            currentTurn === "Blue" ? "text-blue-400" :
            currentTurn === "Green" ? "text-emerald-400" : "text-yellow-400"
          }`}>
            ● Player {currentTurn}
          </span>
        </div>

        {/* Dice roll animation */}
        <button 
          onClick={rollDice}
          disabled={isRolling}
          className={`w-14 h-14 bg-gradient-to-br from-amber-500 to-yellow-600 hover:from-amber-450 hover:to-yellow-500 text-slate-950 rounded-2xl flex items-center justify-center text-3xl font-black shadow-lg transition-transform active:scale-90 ${
            isRolling ? "animate-spin cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          {diceValue}
        </button>
      </div>

      {/* Board Mini Track Positions */}
      <div className="grid grid-cols-4 gap-2 text-center mt-0.5">
        {Object.entries(playerPositions).map(([player, pos]) => {
          const numPos = pos as number;
          return (
            <div key={player} className="bg-slate-900 p-2 rounded-xl border border-white/5 flex flex-col items-center">
              <span className={`text-[9px] font-black uppercase ${
                player === "Red" ? "text-red-400" :
                player === "Blue" ? "text-blue-400" :
                player === "Green" ? "text-emerald-400" : "text-yellow-400"
              }`}>{player}</span>
              <span className="text-xs font-mono font-black mt-1">{numPos}/50</span>
              <div className="w-full bg-slate-950 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className={`h-full ${
                    player === "Red" ? "bg-red-500" :
                    player === "Blue" ? "bg-blue-500" :
                    player === "Green" ? "bg-emerald-500" : "bg-yellow-500"
                  }`}
                  style={{ width: `${(numPos / 50) * 100}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Roll history logs */}
      <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-900 mt-1 max-h-20 overflow-y-auto">
        <span className="text-[7.5px] text-gray-500 block uppercase font-bold mb-1">Live Dice Logs</span>
        <div className="flex flex-col gap-0.5 text-[8.5px] font-mono text-gray-300">
          {ludoHistory.map((h, i) => (
            <div key={i} className="truncate">{h}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. TIC TAC TOE GAME COMPONENT
// ==========================================
export function TicTacToeGame() {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [scores, setScores] = useState({ X: 0, O: 0 });

  const calculateWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(val => val !== null);

  const handleClickSquare = (index: number) => {
    if (board[index] || winner) return;
    const nextBoard = [...board];
    nextBoard[index] = isXNext ? "X" : "O";
    setBoard(nextBoard);
    setIsXNext(!isXNext);

    const matchWinner = calculateWinner(nextBoard);
    if (matchWinner) {
      setScores(prev => ({
        ...prev,
        [matchWinner]: prev[matchWinner as keyof typeof prev] + 1
      }));
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  return (
    <div className="flex flex-col gap-3 p-1 font-sans text-slate-200">
      <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-xl">
        <span className="text-[10px] text-gray-400 font-bold uppercase">Tic Tac Toe strategic deck</span>
        <button onClick={resetGame} className="text-[8px] bg-indigo-600 px-2 py-0.5 rounded text-white font-bold uppercase">Reset</button>
      </div>

      {/* Score and Status line */}
      <div className="flex justify-between items-center bg-slate-950 p-2 rounded-xl border border-slate-900 text-[10px]">
        <div>
          <span className="text-gray-400 uppercase">Interactive Score:</span>
          <span className="text-blue-400 font-bold ml-1.5">X: {scores.X}</span>
          <span className="text-pink-405 text-pink-400 font-bold ml-2">O: {scores.O}</span>
        </div>
        <div className="font-extrabold text-[10.5px]">
          {winner ? (
            <span className="text-emerald-400 animate-pulse uppercase">🏆 {winner} Won!</span>
          ) : isDraw ? (
            <span className="text-yellow-400 uppercase">Draw Match</span>
          ) : (
            <span className={isXNext ? "text-blue-400" : "text-pink-450 text-pink-400"}>
              Turn: {isXNext ? "X" : "O"}
            </span>
          )}
        </div>
      </div>

      {/* Grid 3x3 boards */}
      <div className="grid grid-cols-3 gap-2.5 mx-auto w-48 mt-1">
        {board.map((val, i) => (
          <button
            key={i}
            onClick={() => handleClickSquare(i)}
            className="w-14 h-14 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-center text-xl font-bold transition-transform active:scale-90"
          >
            <span className={val === "X" ? "text-blue-400" : val === "O" ? "text-pink-400" : "text-transparent"}>
              {val || "?"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 3. SPIN WHEEL GAME COMPONENT
// ==========================================
export function SpinWheelGame() {
  const [prize, setPrize] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [spinHistory, setSpinHistory] = useState<string[]>([]);

  const prizes = [
    "💎 50 Diamonds reward",
    "👑 Lord VIP Title (1 Day)",
    "🪙 100 Gold Coins",
    "🌹 15 Luxury Roses Bundle",
    "🌟 Imperial Halo Frame (3hrs)",
    "💥 250 Popularity Points boost",
    "🎟️ Gold Spin Ticket",
    "🍀 Cosmic Luck Aura"
  ];

  const triggerSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setPrize(null);

    let rotations = 0;
    const interval = setInterval(() => {
      setPrize(prizes[Math.floor(Math.random() * prizes.length)]);
      rotations++;
      if (rotations > 15) {
        clearInterval(interval);
        const selectedPrize = prizes[Math.floor(Math.random() * prizes.length)];
        setPrize(selectedPrize);
        setIsSpinning(false);
        setSpinHistory(h => [`Won ${selectedPrize}!`, ...h.slice(0, 5)]);
      }
    }, 120);
  };

  return (
    <div className="flex flex-col gap-3 p-1 font-sans text-slate-200">
      <div className="text-[10px] text-gray-400 font-bold uppercase bg-slate-900/60 p-2 rounded-xl">
        🎡 Lucky Wheel Stream Spin
      </div>

      <div className="flex flex-col items-center justify-center py-3 bg-slate-900/80 rounded-2xl border border-white/5 gap-3">
        {/* Animated Spin layout */}
        <div className={`w-28 h-28 rounded-full border-4 border-yellow-500/40 flex items-center justify-center relative bg-slate-950 shadow-lg ${
          isSpinning ? "animate-spin" : ""
        }`}>
          <div className="w-3 h-3 bg-yellow-500 rounded-full z-10 shadow-lg"></div>
          {/* Radial dividing line visuals */}
          <div className="absolute inset-x-0 h-0.5 bg-yellow-500/10 rotate-45"></div>
          <div className="absolute inset-x-0 h-0.5 bg-yellow-500/10 rotate-90"></div>
          <div className="absolute inset-x-0 h-0.5 bg-yellow-500/10 rotate-135"></div>
        </div>

        {prize ? (
          <div className="text-center">
            <span className="text-[7.5px] text-amber-500 block uppercase font-mono font-black animate-pulse">LUCKY LANDING</span>
            <span className="text-xs font-black text-white">{prize}</span>
          </div>
        ) : (
          <span className="text-[9px] text-gray-400">Spin the wheel to test your cosmic luck!</span>
        )}

        <button
          onClick={triggerSpin}
          disabled={isSpinning}
          className="px-6 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-405 text-slate-950 font-black text-[10.5px] uppercase tracking-wider rounded-xl shadow-md cursor-pointer animate-pulse transition-transform active:scale-95"
        >
          {isSpinning ? "Spinning..." : "🔮 Spin Wheel (Free)"}
        </button>
      </div>

      {spinHistory.length > 0 && (
        <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-900">
          <span className="text-[7.5px] text-gray-500 uppercase block font-bold mb-1">Your Lucky Spins</span>
          <div className="flex flex-col gap-0.5 text-[8.5px] font-mono text-amber-400">
            {spinHistory.map((h, i) => (
              <div key={i}>✓ {h}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 4. TRUTH OR DARE GAME COMPONENT
// ==========================================
export function TruthOrDareGame() {
  const [card, setCard] = useState<{ type: "TRUTH" | "DARE"; question: string } | null>({
    type: "TRUTH",
    question: "Click Generate to start the social party!"
  });

  const truths = [
    "What is the most ridiculous rumor you've ever heard about yourself?",
    "If you could trade lives with anyone in this chat room for 24 hours, who would it be?",
    "What is your biggest secret guilty pleasure song that you sing in the bathroom?",
    "What was your first impression when you loaded Ebadul's Chat App?",
    "If you became a billionaire tomorrow, what is the very first thing you'll buy?",
    "Who in this voice chat do you think has the gold crown voice?"
  ];

  const dares = [
    "Sing the chorus of your favorite benson song using micro-voice!",
    "Mimic the voice of a robot and introduce EbadulChat's grand admin crew.",
    "Give a 30-second dramatic poem honoring the active room hosts.",
    "Whisper your biggest secret into the microphone in sound effect mode.",
    "Send a free virtual Rose gift to the occupant in seat index #0.",
    "Speak in a formal British accent for the next 3 chat messages!"
  ];

  const handleDrawCard = (typeSelect: "TRUTH" | "DARE") => {
    const list = typeSelect === "TRUTH" ? truths : dares;
    const randomQuestion = list[Math.floor(Math.random() * list.length)];
    setCard({ type: typeSelect, question: randomQuestion });
  };

  return (
    <div className="flex flex-col gap-3 p-1 font-sans text-slate-200">
      <div className="text-[10px] text-gray-400 font-bold uppercase bg-slate-900/60 p-2 rounded-xl">
        🔥 Social Truth or Dare Stream Deck
      </div>

      <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-white/5 flex flex-col justify-between min-h-[110px] gap-3">
        {card && (
          <div className="text-center">
            <span className={`px-2.5 py-0.5 text-[8px] font-black uppercase rounded-full mb-2 inline-block ${
              card.type === "TRUTH" ? "bg-cyan-500/15 border border-cyan-500/20 text-cyan-400" : "bg-rose-500/15 border border-rose-500/20 text-rose-400 animate-pulse"
            }`}>
              {card.type} CARD
            </span>
            <p className="text-[11px] text-white italic font-medium leading-relaxed">
              "{card.question}"
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pb-0.5">
          <button
            onClick={() => handleDrawCard("TRUTH")}
            className="py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-[9.5px] uppercase tracking-wide rounded-xl shadow-md transition-all cursor-pointer"
          >
            📿 Draw Truth
          </button>
          <button
            onClick={() => handleDrawCard("DARE")}
            className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-[9.5px] uppercase tracking-wide rounded-xl shadow-md transition-all cursor-pointer"
          >
            🔥 Draw Dare
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. LUCKY DRAW SWEEPSTAKES
// ==========================================
export function LuckyDrawGame() {
  const [participants, setParticipants] = useState<string[]>(["Ebadul", "Sarker", "Guest#839", "Nabila"]);
  const [newPlayer, setNewPlayer] = useState<string>("");
  const [winner, setWinner] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  const registerPlayer = () => {
    if (!newPlayer.trim()) return;
    if (participants.includes(newPlayer.trim())) return;
    setParticipants([...participants, newPlayer.trim()]);
    setNewPlayer("");
  };

  const drawWinner = () => {
    if (participants.length === 0) return;
    setIsDrawing(true);
    setWinner(null);

    let ticks = 0;
    const interval = setInterval(() => {
      setWinner(participants[Math.floor(Math.random() * participants.length)]);
      ticks++;
      if (ticks > 12) {
        clearInterval(interval);
        setWinner(participants[Math.floor(Math.random() * participants.length)]);
        setIsDrawing(false);
      }
    }, 150);
  };

  return (
    <div className="flex flex-col gap-3 p-1 font-sans text-slate-200">
      <div className="text-[10px] text-gray-400 font-bold uppercase bg-slate-900/60 p-2 rounded-xl">
        🎰 Lucky Draw Raffle Campaign
      </div>

      <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/5 flex flex-col gap-2.5">
        <div className="flex gap-1.5 items-center">
          <input
            type="text"
            placeholder="Add player name..."
            value={newPlayer}
            onChange={(e) => setNewPlayer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && registerPlayer()}
            className="flex-1 text-[10px] bg-slate-950 border border-slate-800 text-white rounded px-2 py-1 outline-none focus:border-amber-500"
          />
          <button
            onClick={registerPlayer}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded uppercase"
          >
            Add
          </button>
        </div>

        {/* Player tags */}
        <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
          {participants.map((name, idx) => (
            <span key={idx} className="text-[8.5px] bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded-sm flex items-center gap-1">
              <span>●</span> {name}
            </span>
          ))}
        </div>

        {/* Winner outcome indicator */}
        {winner && (
          <div className="bg-slate-950 p-2 rounded-xl border border-amber-500/30 text-center">
            <span className="text-[7.5px] text-amber-500 uppercase block font-bold tracking-wider leading-none mb-0.5 animate-pulse">
              CONGRATULATIONS WINNER
            </span>
            <span className="text-xs font-black text-white uppercase">🎉 {winner} 🎉</span>
          </div>
        )}

        <button
          onClick={drawWinner}
          disabled={isDrawing || participants.length === 0}
          className="w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[10px] uppercase rounded-xl shadow-md transition-transform active:scale-95 disabled:opacity-40"
        >
          {isDrawing ? "Rolling Draw..." : "🎰 Pull Sweepstakes Winner"}
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 6. TRIVIA QUIZ GAME COMPONENT
// ==========================================
export function QuizGame() {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const [quizStatus, setQuizStatus] = useState<"questions" | "summary">("questions");

  const questions = [
    {
      q: "What is the capital city of Bangladesh?",
      options: ["Coxs Bazar", "Sylhet", "Dhaka", "Chittagong"],
      correct: 2
    },
    {
      q: "Which major national river merges with Padma near Goalundo?",
      options: ["Jamuna", "Meghna", "Karnaphuli", "Surma"],
      correct: 0
    },
    {
      q: "What is the primary currency code used in Bangladesh?",
      options: ["BDT (Taka)", "USD", "Rupee", "Euro"],
      correct: 0
    },
    {
      q: "In what year did Bangladesh establish formal sovereignty independence?",
      options: ["1952", "1966", "1971", "1990"],
      correct: 2
    }
  ];

  const handleSelectOption = (idx: number) => {
    if (selectedAns !== null) return;
    setSelectedAns(idx);
    if (idx === questions[currentIdx].correct) {
      setScore(s => s + 1);
    }
  };

  const handleNextQuiz = () => {
    setSelectedAns(null);
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(c => c + 1);
    } else {
      setQuizStatus("summary");
    }
  };

  const restartQuiz = () => {
    setCurrentIdx(0);
    setScore(0);
    setSelectedAns(null);
    setQuizStatus("questions");
  };

  return (
    <div className="flex flex-col gap-3 p-1 font-sans text-slate-200">
      <div className="text-[10px] text-gray-400 font-bold uppercase bg-slate-900/60 p-2 rounded-xl">
        🧠 General Knowledge Social Trivia
      </div>

      <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/5 min-h-[140px] flex flex-col justify-between gap-3">
        {quizStatus === "questions" ? (
          <div>
            <div className="flex justify-between items-center text-[7.5px] uppercase font-mono text-purple-400 font-black mb-1.5">
              <span>Question {currentIdx + 1} / {questions.length}</span>
              <span>Correct Score: {score}</span>
            </div>

            <p className="text-[10.5px] text-white font-bold leading-tight mb-2.5">
              {questions[currentIdx].q}
            </p>

            <div className="flex flex-col gap-1.5">
              {questions[currentIdx].options.map((opt, idx) => {
                let btnStyle = "bg-slate-950 hover:bg-slate-900 border-slate-900";
                if (selectedAns !== null) {
                  if (idx === questions[currentIdx].correct) {
                    btnStyle = "bg-emerald-950 border-emerald-500/60 text-emerald-400 font-bold";
                  } else if (idx === selectedAns) {
                    btnStyle = "bg-rose-950 border-rose-500/60 text-rose-400";
                  } else {
                    btnStyle = "bg-slate-950/40 border-transparent opacity-60";
                  }
                }
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    className={`text-left text-[9.5px] px-3 py-2 rounded-lg border leading-snug transition-colors shrink-0 ${btnStyle}`}
                  >
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {selectedAns !== null && (
              <button
                onClick={handleNextQuiz}
                className="w-full mt-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-[9px] uppercase rounded-lg shadow-sm"
              >
                {currentIdx + 1 < questions.length ? "Next Trivia Question →" : "See Final Score 🏆"}
              </button>
            )}
          </div>
        ) : (
          <div className="text-center flex flex-col items-center justify-center py-4 gap-2">
            <span className="text-3xl">🏆</span>
            <h4 className="text-sm font-black text-white uppercase tracking-wider">Trivia Complete!</h4>
            <p className="text-[10px] text-gray-400">
              You scored <span className="text-amber-400 font-black">{score} / {questions.length}</span> correct answers!
            </p>
            <button
              onClick={restartQuiz}
              className="mt-2 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[9px] font-black uppercase rounded-lg"
            >
              Restart Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 7. GREEDY COIN BETTING GAME (GRADY WHEEL)
// ==========================================
export function GreedyGame({
  userCoins = 150000,
  onUpdateCoins
}: {
  userCoins?: number;
  onUpdateCoins?: (newBalance: number) => void;
}) {
  const [localCoins, setLocalCoins] = useState<number>(userCoins);
  const [bets, setBets] = useState<{ [item: string]: number }>({
    apple: 0,
    orange: 0,
    watermelon: 0,
    grapes: 0,
    crown: 0,
    diamond: 0
  });
  const [selectedChip, setSelectedChip] = useState<number>(100);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [winnerCommodity, setWinnerCommodity] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>(["🍎", "🍉", "👑", "🍊"]);
  const [statusMessage, setStatusMessage] = useState<string>("Place chips and spin!");

  // Keep local level synchronized with outer balance if provided
  useEffect(() => {
    setLocalCoins(userCoins);
  }, [userCoins]);

  const activeCoins = onUpdateCoins ? userCoins : localCoins;

  const COMMODITIES = [
    { id: "apple", name: "🍎 Apple", multiplier: 2, chance: 42, color: "border-red-500/25 bg-red-950/20 text-red-400" },
    { id: "orange", name: "🍊 Orange", multiplier: 5, chance: 21, color: "border-orange-500/25 bg-orange-950/20 text-orange-400" },
    { id: "watermelon", name: "🍉 Melon", multiplier: 10, chance: 15, color: "border-emerald-500/25 bg-emerald-950/20 text-emerald-400" },
    { id: "grapes", name: "🍇 Grapes", multiplier: 15, chance: 11, color: "border-purple-500/25 bg-purple-950/20 text-purple-400" },
    { id: "crown", name: "👑 Crown", multiplier: 30, chance: 7, color: "border-amber-500/30 bg-amber-950/25 text-amber-400" },
    { id: "diamond", name: "💎 Gem", multiplier: 80, chance: 4, color: "border-cyan-500/25 bg-cyan-950/20 text-cyan-400" }
  ];

  const placeBet = (id: string) => {
    if (isRolling) return;
    if (activeCoins < selectedChip) {
      setStatusMessage("❌ Insufficient coins balance for chip bet!");
      return;
    }

    const nextCoins = activeCoins - selectedChip;
    if (onUpdateCoins) {
      onUpdateCoins(nextCoins);
    } else {
      setLocalCoins(nextCoins);
    }

    setBets(prev => ({
      ...prev,
      [id]: prev[id] + selectedChip
    }));
    setStatusMessage(`Placed ${selectedChip} coins on ${id}!`);
  };

  const clearBets = () => {
    if (isRolling) return;
    const totalPlaced = (Object.values(bets) as number[]).reduce((a: number, b: number) => a + b, 0);
    if (totalPlaced === 0) return;

    const restoredCoins = activeCoins + totalPlaced;
    if (onUpdateCoins) {
      onUpdateCoins(restoredCoins);
    } else {
      setLocalCoins(restoredCoins);
    }

    setBets({ apple: 0, orange: 0, watermelon: 0, grapes: 0, crown: 0, diamond: 0 });
    setStatusMessage("Bets cleared and refunded!");
  };

  const rollWheel = () => {
    if (isRolling) return;
    const totalBet = (Object.values(bets) as number[]).reduce((a: number, b: number) => a + b, 0);
    if (totalBet === 0) {
      setStatusMessage("⚠️ Please place some chips on fruits first!");
      return;
    }

    setIsRolling(true);
    setWinnerCommodity(null);
    setStatusMessage("🎡 Wheel is spinning... Greddy Gold!");

    // Choose winner based on weight distribution
    const rand = Math.random() * 100;
    let accumulated = 0;
    let selectedWinner = COMMODITIES[0];

    for (const commodity of COMMODITIES) {
      accumulated += commodity.chance;
      if (rand <= accumulated) {
        selectedWinner = commodity;
        break;
      }
    }

    let itemCursor = 0;
    let speed = 80;
    let stepCount = 0;
    const totalSteps = 24 + COMMODITIES.indexOf(selectedWinner);

    const animateLoop = () => {
      setWinnerCommodity(COMMODITIES[itemCursor].id);
      itemCursor = (itemCursor + 1) % COMMODITIES.length;
      stepCount++;

      if (stepCount < totalSteps) {
        setTimeout(animateLoop, speed);
      } else {
        // Animation complete!
        setWinnerCommodity(selectedWinner.id);
        setIsRolling(false);

        // Win calculation
        const profit = bets[selectedWinner.id] * selectedWinner.multiplier;
        const endingCoins = activeCoins + profit;

        if (onUpdateCoins) {
          onUpdateCoins(endingCoins);
        } else {
          setLocalCoins(endingCoins);
        }

        // Output results
        setBets({ apple: 0, orange: 0, watermelon: 0, grapes: 0, crown: 0, diamond: 0 });
        setHistory(h => [selectedWinner.name.split(" ")[0], ...h.slice(0, 6)]);

        if (profit > 0) {
          setStatusMessage(`🎉 WON +${profit} COINS! "${selectedWinner.name}" won!`);
        } else {
          setStatusMessage(`😢 Winner: "${selectedWinner.name}"! Try next spin!`);
        }
      }
    };

    animateLoop();
  };

  return (
    <div className="flex flex-col gap-2.5 p-1 font-sans text-slate-200">
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2 rounded-xl">
        <div className="flex flex-col">
          <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wide">🔥 GREEDY GOLD ARENA (GRADY)</span>
          <span className="text-[8.5px] font-mono text-gray-400 mt-0.5 font-bold">Account Balance: <strong className="text-yellow-400">{activeCoins}</strong> Coins</span>
        </div>
        <button
          onClick={clearBets}
          disabled={isRolling}
          className="bg-slate-800 hover:bg-slate-700 text-red-400 hover:text-red-300 font-black text-[8px] uppercase tracking-wider px-2 py-1 rounded cursor-pointer disabled:opacity-40"
        >
          Clear
        </button>
      </div>

      {/* Fruits betting cells grid */}
      <div className="grid grid-cols-3 gap-1.5 mt-0.5">
        {COMMODITIES.map((c) => {
          const hasBet = bets[c.id] > 0;
          const isGlowing = winnerCommodity === c.id;
          return (
            <button
              key={c.id}
              onClick={() => placeBet(c.id)}
              disabled={isRolling}
              className={`p-2 rounded-xl border flex flex-col items-center justify-between gap-1 transition-all relative ${c.color} ${
                isGlowing ? "scale-[1.04] ring-2 ring-yellow-400 border-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.4)]" : "hover:border-white/10"
              }`}
            >
              <div className="text-[10.5px] font-black leading-none">{c.name}</div>
              <div className="text-[7.5px] text-gray-500 font-mono font-bold uppercase leading-none">x{c.multiplier}</div>
              
              {/* Bet Chip Overlay */}
              {hasBet && (
                <div className="absolute top-1 right-1 bg-yellow-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full text-[7.5px] shadow animate-bounce">
                  {bets[c.id]}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Chip size selector bar */}
      <div className="flex items-center justify-between bg-slate-950 px-2 py-1.5 rounded-xl border border-slate-900 mt-0.5">
        <span className="text-[8px] uppercase font-bold text-gray-500">Pick Chip Bet:</span>
        <div className="flex gap-1">
          {[100, 500, 1000, 5000].map((chip) => (
            <button
              key={chip}
              onClick={() => setSelectedChip(chip)}
              className={`px-2 py-0.5 text-[8.5px] font-extrabold uppercase rounded-lg transition-transform active:scale-90 cursor-pointer ${
                selectedChip === chip
                  ? "bg-amber-500 text-slate-950 scale-102"
                  : "bg-slate-900 text-gray-400 hover:text-white"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Start play buttons and output history */}
      <div className="flex flex-col gap-1.5 mt-0.5">
        {/* Play output display */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-2 text-center text-[9.5px] font-bold text-white min-h-[22px] flex items-center justify-center">
          {statusMessage}
        </div>

        <button
          onClick={rollWheel}
          disabled={isRolling}
          className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-450 text-slate-950 font-black uppercase text-[10px] tracking-widest py-2 rounded-xl transition-all shadow-md active:scale-97 disabled:opacity-40 animate-pulse cursor-pointer"
        >
          {isRolling ? "🍀 Spinning Commodities..." : "🎡 PLAY GRADY SWEEPSTAKES 🎡"}
        </button>

        {/* Previous Outcomes List */}
        <div className="flex gap-1 items-center justify-start mt-0.5 bg-slate-950/40 p-1 rounded-lg">
          <span className="text-[7.5px] uppercase font-bold font-mono text-gray-500 whitespace-nowrap">Past results:</span>
          <div className="flex gap-1.5 overflow-x-auto select-none">
            {history.map((h, i) => (
              <span key={i} className="text-xs">{h}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

