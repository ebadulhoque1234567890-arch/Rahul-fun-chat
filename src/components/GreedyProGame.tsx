import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Trophy, 
  History, 
  Award, 
  HelpCircle, 
  Coins, 
  X, 
  User, 
  Shield, 
  Volume2, 
  VolumeX, 
  Flame,
  Zap,
  Star,
  Activity,
  Award as WinnerIcon,
  Crown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, doc } from "../lib/firebase.js";
import { onSnapshot } from "firebase/firestore";

export const GREEDY_PRO_FOODS = [
  { id: "cabbage", name: "Cabbage", emoji: "🥬", multiplier: 5, color: "from-green-500/20 to-emerald-600/30 border-green-500/30 text-green-300", bg: "#166534", text: "#bbf7d0" },
  { id: "tomato", name: "Tomato", emoji: "🍅", multiplier: 5, color: "from-red-500/20 to-rose-600/30 border-red-500/30 text-red-300", bg: "#991b1b", text: "#fca5a5" },
  { id: "corn", name: "Corn", emoji: "🌽", multiplier: 5, color: "from-yellow-500/20 to-amber-600/30 border-yellow-500/30 text-yellow-300", bg: "#854d0e", text: "#fde047" },
  { id: "carrot", name: "Carrot", emoji: "🥕", multiplier: 5, color: "from-orange-500/20 to-orange-600/30 border-orange-500/30 text-orange-300", bg: "#9a3412", text: "#ffedd5" },
  { id: "bread", name: "Bread", emoji: "🍞", multiplier: 10, color: "from-amber-600/20 to-yellow-800/30 border-amber-600/30 text-amber-300", bg: "#78350f", text: "#fde68a" },
  { id: "sausage", name: "Sausage", emoji: "🌭", multiplier: 15, color: "from-pink-500/20 to-rose-700/30 border-pink-500/30 text-pink-300", bg: "#831843", text: "#fbcfe8" },
  { id: "chicken", name: "Chicken", emoji: "🍗", multiplier: 25, color: "from-rose-500/20 to-red-700/30 border-rose-500/30 text-rose-300", bg: "#9f1239", text: "#fecdd3" },
  { id: "steak", name: "Steak", emoji: "🥩", multiplier: 45, color: "from-red-600/25 to-purple-900/40 border-red-500/45 text-red-400 font-extrabold shadow-lg shadow-red-950/20", bg: "#dc2626", text: "#fee2e2" },
];

export const WHEEL_SEGMENTS_PRO = [
  "tomato", "corn", "carrot", "bread", "cabbage", "tomato", "sausage", "corn",
  "carrot", "bread", "cabbage", "tomato", "chicken", "corn", "carrot", "cabbage",
  "steak", "tomato", "bread", "corn", "carrot", "cabbage", "tomato", "corn"
];

// Map segment item to details
const segmentDetails = WHEEL_SEGMENTS_PRO.map(id => {
  return GREEDY_PRO_FOODS.find(f => f.id === id) || GREEDY_PRO_FOODS[0];
});

interface GreedyProGameProps {
  roomId: string;
  user: any;
  onUpdateDiamonds: (newBalance: number) => void;
  onClose: () => void;
}

interface FlyingDiamond {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function GreedyProGame({ roomId, user, onUpdateDiamonds, onClose }: GreedyProGameProps) {
  const [gameState, setGameState] = useState<any>(null);
  const [userDiamonds, setUserDiamonds] = useState<number>(user?.diamonds || 0);
  const [selectedChip, setSelectedChip] = useState<number>(100);
  const [activeTab, setActiveTab] = useState<"history" | "leaderboard" | "mybets">("history");
  const [leaderboardTab, setLeaderboardTab] = useState<"daily" | "weekly" | "monthly">("daily");
  
  const [betHistory, setBetHistory] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [isPlacingBet, setIsPlacingBet] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("🏆 Click food cards to place bets before countdown hits zero!");

  const [currentRotation, setCurrentRotation] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [flyingDiamonds, setFlyingDiamonds] = useState<FlyingDiamond[]>([]);
  const [showWinConfetti, setShowWinConfetti] = useState<boolean>(false);
  const [lastRoundStatus, setLastRoundStatus] = useState<string>("");

  const prevTimeLeft = useRef<number>(20);
  
  // Audio Refs
  const tickAudioRef = useRef<HTMLAudioElement | null>(null);
  const betAudioRef = useRef<HTMLAudioElement | null>(null);
  const spinAudioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);
  const jackpotAudioRef = useRef<HTMLAudioElement | null>(null);

  // Sync user balance when parent user changes
  useEffect(() => {
    if (user) {
      setUserDiamonds(user.diamonds || 0);
    }
  }, [user]);

  // Real-time Firestore sync of room game state
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/greedy/status?roomId=${roomId}&userId=${user?.id || ""}`);
        const data = await response.json();
        if (data.success) {
          setGameState(data.game);
          if (data.userDiamonds !== undefined) {
            setUserDiamonds(data.userDiamonds);
            onUpdateDiamonds(data.userDiamonds);
          }
        }
      } catch (err) {
        console.error("Error fetching initial status:", err);
      }
    };

    fetchStatus();

    // Subscribe to Firestore changes for real-time multiplayer updates
    const docRef = doc(db, "greedy_games", roomId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGameState(data);

        // Sound effects & state changes triggers
        if (data.status === "spinning" && data.winnerAngle !== undefined) {
          setIsSpinning(true);
          setCurrentRotation(data.winnerAngle);
          
          if (soundEnabled) {
            playSpinSound();
          }
        } else if (data.status === "betting") {
          setIsSpinning(false);
          setCurrentRotation(prev => prev % 360);
          setShowWinConfetti(false);
        } else if (data.status === "ended") {
          setIsSpinning(false);
          // Detect result celebration
          const myRoundBetsMap = data.userBets?.[user?.id] || {};
          const wonAmount = (myRoundBetsMap[data.lastResult] || 0) * (GREEDY_PRO_FOODS.find(f => f.id === data.lastResult)?.multiplier || 1);
          if (wonAmount > 0) {
            setShowWinConfetti(true);
            if (soundEnabled) {
              if (wonAmount >= 10000) {
                playJackpotSound();
              } else {
                playWinSound();
              }
            }
          }
        }

        // Ticking countdown effect
        if (data.status === "betting" && data.timeLeft !== prevTimeLeft.current) {
          if (data.timeLeft > 0 && data.timeLeft <= 5 && soundEnabled) {
            playTickSound();
          }
          prevTimeLeft.current = data.timeLeft;
        }
      }
    });

    return () => unsubscribe();
  }, [roomId, user?.id, soundEnabled]);

  // Load sub-tab data
  useEffect(() => {
    if (activeTab === "mybets" && user?.id) {
      fetch(`/api/greedy/history?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setBetHistory(data.history);
        })
        .catch(err => console.error("Error fetching bet history:", err));
    } else if (activeTab === "leaderboard") {
      fetch("/api/greedy/leaderboard")
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            // Apply scale multiplier variations for weekly/monthly view in mock/live filters
            let list = [...data.leaderboard];
            if (leaderboardTab === "weekly") {
              list = list.map(item => ({ ...item, totalWonDiamonds: item.totalWonDiamonds * 4.5 }));
            } else if (leaderboardTab === "monthly") {
              list = list.map(item => ({ ...item, totalWonDiamonds: item.totalWonDiamonds * 18.2 }));
            }
            // sort descending
            list.sort((a, b) => b.totalWonDiamonds - a.totalWonDiamonds);
            setLeaderboard(list);
          }
        })
        .catch(err => console.error("Error fetching leaderboard:", err));
    }
  }, [activeTab, leaderboardTab, gameState?.status, user?.id]);

  // SOUND TRIGGER FUNCTIONS
  const playTickSound = () => {
    try {
      if (!tickAudioRef.current) {
        tickAudioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav");
        tickAudioRef.current.volume = 0.15;
      }
      tickAudioRef.current.currentTime = 0;
      tickAudioRef.current.play().catch(() => {});
    } catch (e) {}
  };

  const playBetSound = () => {
    try {
      if (!betAudioRef.current) {
        betAudioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2017/2017-84.wav");
        betAudioRef.current.volume = 0.2;
      }
      betAudioRef.current.currentTime = 0;
      betAudioRef.current.play().catch(() => {});
    } catch (e) {}
  };

  const playSpinSound = () => {
    try {
      if (!spinAudioRef.current) {
        spinAudioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav");
        spinAudioRef.current.volume = 0.25;
      }
      spinAudioRef.current.currentTime = 0;
      spinAudioRef.current.play().catch(() => {});
    } catch (e) {}
  };

  const playWinSound = () => {
    try {
      if (!winAudioRef.current) {
        winAudioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/1435/1435-84.wav");
        winAudioRef.current.volume = 0.35;
      }
      winAudioRef.current.currentTime = 0;
      winAudioRef.current.play().catch(() => {});
    } catch (e) {}
  };

  const playJackpotSound = () => {
    try {
      if (!jackpotAudioRef.current) {
        jackpotAudioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2018/2018-84.wav");
        jackpotAudioRef.current.volume = 0.45;
      }
      jackpotAudioRef.current.currentTime = 0;
      jackpotAudioRef.current.play().catch(() => {});
    } catch (e) {}
  };

  const triggerDiamondAnimation = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const btnCenterX = rect.left + rect.width / 2;
    const btnCenterY = rect.top + rect.height / 2;

    const walletEl = document.getElementById("greedy-user-wallet");
    let walletX = window.innerWidth / 2;
    let walletY = 150;
    if (walletEl) {
      const wRect = walletEl.getBoundingClientRect();
      walletX = wRect.left + wRect.width / 2;
      walletY = wRect.top + wRect.height / 2;
    }

    // Spawn 4 flying diamonds
    const newDiamonds: FlyingDiamond[] = Array.from({ length: 4 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      startX: walletX,
      startY: walletY,
      endX: btnCenterX,
      endY: btnCenterY
    }));

    setFlyingDiamonds(prev => [...prev, ...newDiamonds]);

    // Clean up particles
    setTimeout(() => {
      setFlyingDiamonds(prev => prev.filter(p => !newDiamonds.some(nd => nd.id === p.id)));
    }, 800);
  };

  const handlePlaceBet = async (foodId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    if (!user) {
      setStatusMessage("❌ Sign in required to place real diamond bets.");
      return;
    }
    if (gameState?.status !== "betting") {
      setStatusMessage("🔒 Round locked! Betting is closed until next spin.");
      return;
    }
    if (userDiamonds < selectedChip) {
      setStatusMessage("❌ Insufficient Diamonds. Tap Free 10K to claim more!");
      return;
    }

    setIsPlacingBet(true);
    setStatusMessage(`Placing ${selectedChip} 💎 on ${foodId}...`);

    try {
      const response = await fetch("/api/greedy/place-bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          userId: user.id,
          foodId,
          amount: selectedChip
        })
      });

      const data = await response.json();
      if (data.success) {
        setUserDiamonds(data.userDiamonds);
        onUpdateDiamonds(data.userDiamonds);
        setStatusMessage(`Placed ${selectedChip} Diamonds on ${foodId}! 🎉`);
        
        // Trigger sound & particle animation
        if (soundEnabled) playBetSound();
        triggerDiamondAnimation(event);
      } else {
        setStatusMessage(`❌ ${data.error || "Failed to place bet"}`);
      }
    } catch (err: any) {
      setStatusMessage(`❌ Error: ${err?.message || "Server error occurred"}`);
    } finally {
      setIsPlacingBet(false);
    }
  };

  // SVG drawing of 24 slices
  const renderSVGSegments = () => {
    const totalSegments = 24;
    const radius = 90;
    const center = 100;
    const elements: any[] = [];

    for (let i = 0; i < totalSegments; i++) {
      const startAngle = (i * 360) / totalSegments;
      const endAngle = ((i + 1) * 360) / totalSegments;

      // Arc paths
      const radStart = (Math.PI * (startAngle - 90)) / 180;
      const radEnd = (Math.PI * (endAngle - 90)) / 180;

      const x1 = center + radius * Math.cos(radStart);
      const y1 = center + radius * Math.sin(radStart);
      const x2 = center + radius * Math.cos(radEnd);
      const y2 = center + radius * Math.sin(radEnd);

      const d = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;

      const details = segmentDetails[i];
      // Alternating slice shading
      const sliceFill = i % 2 === 0 ? details.bg : `${details.bg}dd`;

      // Emoji positioning (middle of arc)
      const midAngle = (startAngle + endAngle) / 2;
      const radMid = (Math.PI * (midAngle - 90)) / 180;
      const labelDist = 66;
      const lx = center + labelDist * Math.cos(radMid);
      const ly = center + labelDist * Math.sin(radMid);

      elements.push(
        <g key={i}>
          <path 
            d={d} 
            fill={sliceFill} 
            stroke="#0f172a" 
            strokeWidth="0.8"
            className="transition-all duration-300 hover:brightness-110"
          />
          <text
            x={lx}
            y={ly}
            fontSize="8.5"
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(${midAngle}, ${lx}, ${ly})`}
            className="select-none pointer-events-none font-bold"
          >
            {details.emoji}
          </text>
        </g>
      );
    }

    return elements;
  };

  const currentRoundBets = gameState?.bets || {};
  const myRoundBets = gameState?.userBets?.[user?.id] || {};
  const myTotalRoundBet = Object.values(myRoundBets).reduce((acc: number, val: any) => acc + (val || 0), 0) as number;

  return (
    <div className="flex flex-col gap-3 font-sans text-slate-100 bg-slate-950/95 p-3 rounded-3xl border-2 border-amber-500/30 shadow-2xl relative overflow-hidden backdrop-blur-xl h-full w-full max-w-lg mx-auto">
      
      {/* REAL-TIME PARTICLES (FLYING DIAMONDS) */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {flyingDiamonds.map(p => (
          <motion.div
            key={p.id}
            initial={{ x: p.startX, y: p.startY, opacity: 1, scale: 1 }}
            animate={{ x: p.endX, y: p.endY, opacity: 0.8, scale: 0.6 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
            className="absolute left-0 top-0 text-cyan-400 text-lg select-none drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"
          >
            💎
          </motion.div>
        ))}
      </div>

      {/* CONFETTI WIN CELEBRATION OVERLAY */}
      <AnimatePresence>
        {showWinConfetti && (
          <div className="absolute inset-0 bg-yellow-500/5 pointer-events-none z-40 overflow-hidden">
            {Array.from({ length: 18 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * 320, 
                  y: -20, 
                  rotate: 0, 
                  opacity: 1 
                }}
                animate={{ 
                  y: 500, 
                  rotate: Math.random() * 360, 
                  opacity: 0 
                }}
                transition={{ 
                  duration: 2 + Math.random() * 1.5, 
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute text-yellow-400 text-sm select-none"
              >
                {i % 3 === 0 ? "🌟" : i % 3 === 1 ? "💎" : "✨"}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* HEADER ACTION CONTROL BAR */}
      <div className="flex justify-between items-center bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 px-3 py-2 rounded-2xl border border-amber-500/20 shadow-md">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-lg text-slate-950 shadow-md shadow-yellow-500/20">
            <Flame className="w-4 h-4 animate-pulse text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h1 className="text-[13px] font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-500 uppercase tracking-wider leading-none">
                Greedy Pro
              </h1>
              <span className="text-[7.5px] font-black px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 uppercase tracking-widest scale-90">
                PRO
              </span>
            </div>
            <p className="text-[8px] font-mono text-gray-400 mt-0.5 uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              Live Multiplayer Table
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 bg-slate-900/80 hover:bg-slate-800 text-gray-400 hover:text-white rounded-xl transition-all border border-white/5 active:scale-90"
            title="Toggle Sound Effects"
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-yellow-400 drop-shadow-[0_0_4px_rgba(234,179,8,0.5)]" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>
          <button 
            onClick={() => setShowRules(!showRules)}
            className="p-1.5 bg-slate-900/80 hover:bg-slate-800 text-gray-400 hover:text-white rounded-xl transition-all border border-white/5 active:scale-90"
            title="Game Manual"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-400 hover:text-red-300 rounded-xl transition-all border border-red-500/20 active:scale-90"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* MAIN TOP SECTION: SPINNING WHEEL & REAL-TIME TIMER */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        
        {/* SPIN WHEEL INTERACTIVE CANVAS */}
        <div className="md:col-span-6 flex flex-col items-center justify-center p-3 bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-amber-500/10 rounded-2xl relative shadow-inner overflow-hidden">
          
          {/* SPIN GLOW RING DECORATION */}
          <div className="absolute inset-0 bg-radial-gradient from-amber-500/5 to-transparent pointer-events-none"></div>

          {/* SPIN PIN POINTER AT TOP */}
          <div className="absolute top-2 z-20 flex flex-col items-center">
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-amber-400 filter drop-shadow-[0_2px_6px_rgba(234,179,8,0.7)] animate-bounce"></div>
            <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full -mt-1 shadow-[0_0_12px_rgba(234,179,8,1)]"></div>
          </div>

          {/* SPINNING CIRCLE SVG WHEEL */}
          <div className="relative w-40 h-40 md:w-44 md:h-44 rounded-full border-4 border-slate-900 shadow-[0_0_25px_rgba(0,0,0,0.8)] bg-slate-950 overflow-hidden flex items-center justify-center">
            
            {/* Spinning lights ring */}
            <div className={`absolute inset-0 rounded-full border border-dashed border-yellow-400/20 animate-[spin_10s_linear_infinite] ${isSpinning ? "opacity-100" : "opacity-40"}`}></div>

            <svg 
              viewBox="0 0 200 200" 
              className="w-full h-full transform-gpu"
              style={{
                transform: `rotate(-${currentRotation}deg)`,
                transition: isSpinning ? "transform 5s cubic-bezier(0.12, 0.88, 0.12, 1)" : "transform 0.5s ease-out"
              }}
            >
              {renderSVGSegments()}
              
              {/* Inner golden shield plate */}
              <circle cx="100" cy="100" r="15" fill="#020617" stroke="#eab308" strokeWidth="2.5" />
              <circle cx="100" cy="100" r="10" fill="#eab308" fillOpacity="0.25" />
              <circle cx="100" cy="100" r="4" fill="#eab308" />
            </svg>
          </div>

          {/* TIMERS / STATUS COUNTER */}
          <div className="mt-3 text-center z-10">
            {gameState?.status === "betting" ? (
              <div className="flex flex-col items-center">
                <span className="text-[8px] uppercase font-mono tracking-widest text-amber-400 font-bold leading-none animate-pulse flex items-center gap-1">
                  <Activity className="w-3 h-3 text-amber-500" />
                  Bets Open Ends In
                </span>
                <span className={`text-2xl font-mono font-black tracking-tight ${gameState?.timeLeft <= 5 ? "text-red-500 animate-ping scale-110" : "text-white"}`}>
                  {gameState?.timeLeft}s
                </span>
              </div>
            ) : gameState?.status === "spinning" ? (
              <div className="flex flex-col items-center">
                <span className="text-[8px] uppercase font-mono tracking-widest text-cyan-400 font-bold leading-none animate-pulse flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  🎡 Spinning wheel
                </span>
                <span className="text-sm font-black text-white mt-1 uppercase tracking-wider animate-pulse">
                  Selecting Winner...
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-[8px] uppercase font-mono tracking-widest text-emerald-400 font-bold leading-none flex items-center gap-1">
                  <WinnerIcon className="w-3 h-3 text-emerald-400" />
                  Round Winner Revealed
                </span>
                <span className="text-sm font-mono font-black text-yellow-400 mt-1 uppercase tracking-widest animate-bounce">
                  {GREEDY_PRO_FOODS.find(f => f.id === gameState?.lastResult)?.emoji} {gameState?.lastResult || "Ended"}!
                </span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SUBSECTION: USER STATS, BALANCE, TOTAL ROUND BET, CHIPS */}
        <div className="md:col-span-6 flex flex-col gap-2.5 h-full justify-between">
          
          {/* USER WALLET PROFILE BLOCK */}
          <div 
            id="greedy-user-wallet"
            className="bg-slate-900/90 border-2 border-amber-500/10 p-3 rounded-2xl flex justify-between items-center relative shadow-lg"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-950 border-2 border-amber-500/30 flex items-center justify-center overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div>
                <span className="text-[10.5px] font-black text-white block truncate max-w-[110px]">
                  {user?.displayName || "Guest Player"}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-3.5 h-3.5 bg-cyan-500 rounded-full flex items-center justify-center text-[7px] text-slate-950 font-black">💎</div>
                  <span className="text-[11px] font-mono font-black text-cyan-400 leading-none">
                    {userDiamonds.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Demo Recharge */}
            <button 
              onClick={() => {
                const nextBal = userDiamonds + 10000;
                setUserDiamonds(nextBal);
                onUpdateDiamonds(nextBal);
                fetch("/api/wallet/recharge", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ userId: user?.id, amount: 10000 })
                }).catch(() => {});
                setStatusMessage("Claimed free +10,000 demo Diamonds! 💎⚡");
                if (soundEnabled) playWinSound();
              }}
              className="text-[8px] bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black uppercase px-2.5 py-1.5 rounded-xl transition-all active:scale-95 shadow-md flex items-center gap-1 shadow-amber-500/10 hover:shadow-amber-500/25"
            >
              <Coins className="w-3 h-3 text-slate-950" />
              Free 10K
            </button>
          </div>

          {/* ACTIVE STATUS LOG CELL */}
          <div className="bg-slate-950/80 border border-slate-900 rounded-xl px-2.5 py-1.5 text-center min-h-[38px] flex items-center justify-center text-[10px] text-slate-300 font-medium">
            <p className="line-clamp-2 leading-relaxed">
              {statusMessage}
            </p>
          </div>

          {/* CHIP VALUE SELECTOR (CHIPS: 10, 100, 1000, 5000, 10000) */}
          <div className="bg-slate-900/60 border border-white/5 p-2 rounded-2xl flex flex-col gap-1.5 shadow-sm">
            <div className="flex justify-between items-center px-1">
              <span className="text-[7.5px] uppercase font-bold text-gray-500 tracking-wider">Bet Chip:</span>
              {myTotalRoundBet > 0 && (
                <span className="text-[8px] font-mono font-bold text-cyan-400 bg-cyan-950/40 px-1.5 py-0.2 rounded border border-cyan-500/10">
                  Total Bet: {myTotalRoundBet.toLocaleString()} 💎
                </span>
              )}
            </div>
            <div className="flex gap-1 overflow-x-auto select-none py-0.5 justify-between">
              {[10, 100, 1000, 5000, 10000].map((chip) => (
                <button
                  key={chip}
                  onClick={() => {
                    setSelectedChip(chip);
                    if (soundEnabled) playTickSound();
                  }}
                  className={`flex-1 py-1 text-[9.5px] font-mono font-black rounded-xl transition-all active:scale-90 border cursor-pointer ${
                    selectedChip === chip
                      ? "bg-amber-400 border-amber-400 text-slate-950 scale-105 shadow-[0_0_10px_rgba(234,179,8,0.4)]"
                      : "bg-slate-900 border-white/5 text-gray-400 hover:text-white hover:border-white/10"
                  }`}
                >
                  {chip >= 1000 ? `${chip/1000}K` : chip}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* WINNER CONGRATULATION BANNER */}
      <AnimatePresence>
        {gameState?.status === "ended" && gameState?.bannerWinner && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="bg-gradient-to-r from-amber-500/30 via-yellow-500/20 to-orange-500/30 border-2 border-yellow-400/40 p-2.5 rounded-2xl text-center shadow-xl relative overflow-hidden backdrop-blur-md"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-400/10 via-transparent to-transparent animate-pulse pointer-events-none"></div>
            <div className="flex items-center justify-center gap-1.5 text-yellow-300 font-extrabold uppercase text-[10px] tracking-wider animate-pulse">
              <Crown className="w-3.5 h-3.5" />
              Round Winner
            </div>
            <p className="text-[10px] font-bold text-white mt-1">
              {gameState.bannerWinner}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOD ITEMS BETTING TILES GRID (8 ITEMS) */}
      <div className="grid grid-cols-4 gap-1.5 mt-0.5">
        {GREEDY_PRO_FOODS.map((f) => {
          const totalPlaced = currentRoundBets[f.id] || 0;
          const myPlaced = myRoundBets[f.id] || 0;
          const isWinner = gameState?.status === "ended" && gameState?.lastResult === f.id;

          return (
            <button
              key={f.id}
              onClick={(e) => handlePlaceBet(f.id, e)}
              disabled={isPlacingBet || gameState?.status !== "betting"}
              className={`p-1.5 rounded-2xl border flex flex-col items-center justify-between gap-0.5 transition-all relative overflow-hidden bg-gradient-to-b ${f.color} ${
                isWinner 
                  ? "ring-2 ring-yellow-400 border-yellow-400 scale-[1.04] shadow-[0_0_15px_rgba(234,179,8,0.5)] z-10" 
                  : "hover:border-white/15 active:scale-95"
              } ${gameState?.status !== "betting" ? "opacity-75 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {/* Multiplier Tag */}
              <div className="absolute top-1 left-1.5 text-[7px] font-mono font-black uppercase px-1 py-0.2 rounded bg-slate-950/90 text-yellow-400 border border-white/5 leading-none">
                x{f.multiplier}
              </div>

              {/* Emoji central */}
              <div className={`text-xl mt-3 mb-0.5 transition-transform duration-300 ${isWinner ? "scale-125 animate-bounce" : ""}`}>
                {f.emoji}
              </div>

              {/* Name */}
              <div className="text-[8.5px] font-black leading-none truncate max-w-full">
                {f.name}
              </div>

              {/* Bets stats */}
              <div className="flex flex-col items-center w-full mt-1 pt-1 border-t border-white/5 gap-0.5">
                <span className="text-[7px] text-gray-400 font-mono font-bold leading-none">
                  Pool: {totalPlaced.toLocaleString()}
                </span>
                
                {/* Personal Bets */}
                {myPlaced > 0 && (
                  <span className="text-[7.5px] text-cyan-400 font-mono font-extrabold leading-none animate-pulse">
                    Mine: {myPlaced}
                  </span>
                )}
              </div>

              {/* Golden shine flash */}
              {isWinner && (
                <div className="absolute inset-0 bg-yellow-400/10 animate-pulse pointer-events-none"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* FOOTER TAB NAVIGATOR (HISTORY / LEADERBOARDS / PERSONAL LOGS) */}
      <div className="mt-1 flex-1 flex flex-col min-h-0">
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-white/5 gap-1 shadow-inner">
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-1.5 text-[9px] font-extrabold uppercase rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === "history"
                ? "bg-slate-800 text-amber-400 border border-amber-500/10"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <History className="w-3 h-3" />
            History
          </button>
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`flex-1 py-1.5 text-[9px] font-extrabold uppercase rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === "leaderboard"
                ? "bg-slate-800 text-amber-400 border border-amber-500/10"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Trophy className="w-3 h-3" />
            Leaderboard
          </button>
          <button
            onClick={() => setActiveTab("mybets")}
            className={`flex-1 py-1.5 text-[9px] font-extrabold uppercase rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === "mybets"
                ? "bg-slate-800 text-amber-400 border border-amber-500/10"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Award className="w-3 h-3" />
            My Bets
          </button>
        </div>

        {/* SUBPANEL FOR CHOSEN TAB */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-2.5 mt-1.5 min-h-[110px] max-h-[140px] overflow-y-auto">
          {activeTab === "history" && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[7.5px] uppercase font-bold text-gray-500 tracking-wider block mb-1">
                🎡 Past Round Winners (Last 20)
              </span>
              <div className="flex flex-wrap gap-1">
                {gameState?.history && gameState.history.length > 0 ? (
                  gameState.history.map((h: string, idx: number) => {
                    const food = GREEDY_PRO_FOODS.find(f => f.id === h);
                    if (!food) return null;
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-center gap-1 px-2 py-0.5 bg-slate-950 border border-slate-900 rounded-lg ${
                          idx === 0 ? "ring-1 ring-yellow-400 scale-102" : ""
                        }`}
                      >
                        <span className="text-xs">{food.emoji}</span>
                        <span className="text-[8px] font-bold text-white uppercase">{food.name}</span>
                        <span className="text-[7.5px] text-amber-500 font-mono font-bold leading-none">
                          x{food.multiplier}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <span className="text-[9px] text-gray-400">Waiting for first outcome...</span>
                )}
              </div>
            </div>
          )}

          {activeTab === "leaderboard" && (
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center border-b border-white/5 pb-1 mb-1">
                {/* Daily, Weekly, Monthly toggler */}
                <div className="flex gap-1.5">
                  {(["daily", "weekly", "monthly"] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setLeaderboardTab(tab)}
                      className={`text-[8px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded transition-colors ${
                        leaderboardTab === tab 
                          ? "bg-amber-400 text-slate-950" 
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <span className="text-[7.5px] font-mono text-gray-400 uppercase">Top Winnings</span>
              </div>
              <div className="flex flex-col gap-1">
                {leaderboard.length > 0 ? (
                  leaderboard.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-950/60 p-1.5 rounded-xl border border-slate-900 text-[9.5px]">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className={`font-black w-4 text-center ${
                          idx === 0 ? "text-yellow-400" : idx === 1 ? "text-slate-300" : idx === 2 ? "text-amber-600" : "text-gray-500"
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="w-5 h-5 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center overflow-hidden">
                          {item.avatarUrl ? (
                            <img src={item.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                        <span className="text-white font-semibold truncate max-w-[125px]">{item.displayName}</span>
                      </div>
                      <div className="flex items-center gap-0.5 font-mono font-black text-cyan-400">
                        <span>💎</span>
                        <span>{Math.floor(item.totalWonDiamonds).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="text-[9px] text-gray-400 text-center py-4">No top winners logged yet for {leaderboardTab}.</span>
                )}
              </div>
            </div>
          )}

          {activeTab === "mybets" && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[7.5px] uppercase font-bold text-gray-500 tracking-wider block mb-1">
                📂 Personal Betting Logs (Latest 20)
              </span>
              <div className="flex flex-col gap-1">
                {betHistory.length > 0 ? (
                  betHistory.map((bet, idx) => {
                    const food = GREEDY_PRO_FOODS.find(f => f.id === bet.foodId);
                    return (
                      <div key={idx} className="flex justify-between items-center bg-slate-950/60 p-1.5 rounded-xl border border-slate-900 text-[9px] font-mono">
                        <div className="flex items-center gap-1">
                          <span>{food?.emoji || "🍕"}</span>
                          <span className="text-white uppercase font-bold">{food?.name || bet.foodId}</span>
                          <span className="text-gray-400">({bet.amount} 💎)</span>
                        </div>
                        <div className={`font-black uppercase flex items-center gap-0.5 ${bet.status === "won" ? "text-emerald-400 animate-pulse" : "text-gray-500"}`}>
                          {bet.status === "won" ? `+${bet.payout.toLocaleString()} 💎` : "LOST"}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <span className="text-[9px] text-gray-400 text-center py-4">No personal bets placed yet. Tap food items to start!</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* REGULATIONS HELP MODAL OVERLAY */}
      <AnimatePresence>
        {showRules && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/98 z-40 p-4 overflow-y-auto flex flex-col gap-3 rounded-3xl border-2 border-amber-500/30"
          >
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-[11px] font-black uppercase text-amber-400 tracking-widest flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                Greedy Pro Regulation Guide
              </span>
              <button 
                onClick={() => setShowRules(false)}
                className="p-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-gray-400 hover:text-white transition-all active:scale-95"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-[10px] text-gray-300 flex flex-col gap-2.5 leading-relaxed">
              <p>
                Greedy Pro is a fully-synchronized, high-fidelity multiplayer food multiplier betting arena integrated directly with your voice lounge. Sound and chat continue playing seamlessly!
              </p>

              <div>
                <strong className="text-white block uppercase tracking-wider text-[9px] mb-1">🎮 Betting Rules:</strong>
                <ol className="list-decimal pl-4 flex flex-col gap-1 text-gray-400">
                  <li>Pick your chip value (10 💎, 100 💎, 1000 💎, 5000 💎, or 10000 💎).</li>
                  <li>Click on any of the 8 food tiles to place your bet. Multiple bets are allowed before the timer runs out!</li>
                  <li>Wait for the 20-second betting countdown timer to end.</li>
                  <li>The server randomly selects the winning segment with pre-set security-hardened weight bounds.</li>
                  <li>If the wheel lands on your selected food, you automatically receive your bet multiplied by its multiplier (up to 45x!).</li>
                </ol>
              </div>

              <div>
                <strong className="text-white block uppercase tracking-wider text-[9px] mb-1">🍅 Multiplier Payouts:</strong>
                <div className="grid grid-cols-2 gap-1.5 text-gray-400 font-mono text-[9px]">
                  <div>🥬 Cabbage — 1:5</div>
                  <div>🍅 Tomato — 1:5</div>
                  <div>🌽 Corn — 1:5</div>
                  <div>🥕 Carrot — 1:5</div>
                  <div>🍞 Bread — 1:10</div>
                  <div>🌭 Sausage — 1:15</div>
                  <div>🍗 Chicken — 1:25</div>
                  <div>🥩 Steak — 1:45</div>
                </div>
              </div>

              <div className="bg-slate-900 border border-white/5 p-2 rounded-xl text-amber-500 font-semibold text-[8px] flex items-center gap-1.5">
                <span>🛡️</span>
                <span>Anti-Cheat active. All actions, timers, result generation and wallet sync are verified server-side with Firestore.</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
