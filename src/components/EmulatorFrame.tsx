/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import {
  UserProfile,
  ChatRoom,
  ChatMessage,
  GiftItem,
  PKBattle,
  Family,
  VipLevel,
  Gender,
  RoomCategory,
  VoiceSeat,
  MessageType,
} from "../types.js";
import { LocaleStrings } from "../locales.js";
import PKBattleView from "./PKBattleView.js";
import UserProfileModal from "./UserProfileModal.js";
import {
  LudoGame,
  TicTacToeGame,
  SpinWheelGame,
  TruthOrDareGame,
  LuckyDrawGame,
  QuizGame,
} from "./RoomGames.js";
import { GreedyProGame } from "./GreedyProGame.js";
import {
  PhoneCall,
  Send,
  MessageCircle,
  Mic,
  MicOff,
  LogOut,
  Lock,
  CheckCircle,
  Calendar,
  Coins,
  Sparkles,
  Heart,
  User,
  ChevronLeft,
  ChevronRight,
  Smile,
  Image,
  ShieldAlert,
  X,
  Plus,
  Wrench,
  Pocket,
  Gamepad2,
  Music,
  Award,
  Users,
  TrendingUp,
  Settings,
  Search,
  Volume2,
  VolumeX,
  Bell,
  Camera,
  Shuffle,
  SkipBack,
  SkipForward,
  Repeat,
  Play,
  Pause,
} from "lucide-react";
import {
  auth,
  db,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  doc,
  setDoc,
  getDoc
} from "../lib/firebase.js";

// --- INDEXEDDB MOBILE STORAGE SONG CACHE UTILITIES ---
const DB_NAME = "EbadulSongCacheDB";
const STORE_NAME = "songs";

function initSongDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e: any) => {
      const dbInstance = e.target.result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = (e: any) => resolve(e.target.result);
    request.onerror = (e) => reject(e);
  });
}

async function saveSongToLocalDB(id: string, name: string, file: File): Promise<void> {
  try {
    const dbInstance = await initSongDB();
    const transaction = dbInstance.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.put({ id, name, file });
  } catch (err) {
    console.error("Failed to save song to IndexedDB:", err);
  }
}

// Helper to generate stylish Unicode names
export const generateStylishOptions = (name: string): string[] => {
  if (!name || !name.trim()) return [];
  // Strip any decorations to get raw characters for restyling
  const trimmed = name.replace(/[👑🔥⚡亗★彡╰‿╯💎🌸✨꧂꧁]/g, "").trim();
  const normalUpper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const normalLower = "abcdefghijklmnopqrstuvwxyz";

  // Bold Script characters
  const boldScriptUpper = ["𝓐","𝓑","𝓒","𝓓","𝓔","𝓕","𝓖","𝓗","𝓘","𝓙","𝓚","𝓛","𝓜","𝓝","𝓞","𝓟","𝓠","𝓡","𝓢","𝓣","𝓤","𝓥","𝓦","𝓧","𝓨","𝓩"];
  const boldScriptLower = ["𝓪","𝓫","𝓬","𝓭","𝓮","𝓯","𝓰","𝓱","𝓲","𝓳","𝓴","𝓵","𝓶","𝓷","𝓸","𝓹","𝓺","𝓻","𝓼","𝓽","𝓾","𝓿","𝔀","𝔁","𝔂","𝔃"];
  
  // Double Struck characters
  const doubleStruckUpper = ["𝔸","𝔹","ℂ","𝔻","𝔼","𝔽","𝔾","ℍ","𝕀","𝕁","𝕂","𝕃","𝕄","ℕ","𝕆","ℙ","ℚ","ℝ","𝕊","𝕋","𝕌","𝕍","𝕎","𝕏","𝕐","ℤ"];
  const doubleStruckLower = ["𝕒","𝕓","𝕔","𝕕","𝕖","𝕗","𝕘","𝕙","𝕚","𝕛","𝕜","𝕝","𝕞","𝕟","𝕠","𝕡","𝕢","𝕣","𝕤","𝕥","𝕦","𝕧","𝕨","𝕩","𝕪","𝕫"];

  // Gothic / Old English characters
  const gothicUpper = ["𝔄","𝔅","𝔖","𝔇","𝔈","𝔉","𝔊","ℌ","ℑ","𝔍","𝔎","𝔏","𝔐","𝔫","𝔒","𝔓","𝔔","ℜ","𝔖","𝔗","𝔘","𝔙","𝔚","𝔛","𝔜","ℨ"];
  const gothicLower = ["𝔞","𝔟","𝔠","𝔡","𝔢","𝔣","𝔤","𝔥","𝔦","𝔧","𝔨","𝔩","𝔪","𝔫","𝔬","𝔭","𝔮","𝔯","𝔰","𝔱","𝔲","𝔳","𝔴","𝔵","𝔶","𝔷"];

  // Bubble / Encircled characters
  const bubbleUpper = ["Ⓐ","Ⓑ","Ⓒ","Ⓓ","Ⓔ","Ⓕ","Ⓖ","Ⓗ","Ⓘ","Ⓙ","Ⓚ","Ⓛ","Ⓜ","Ⓝ","Ⓞ","Ⓟ","Ⓠ","Ⓡ","Ⓢ","Ⓣ","Ⓤ","Ⓥ","Ⓦ","Ⓧ","Ⓨ","Ⓩ"];
  const bubbleLower = ["ⓐ","ⓑ","ⓒ","ⓓ","ⓔ","ⓕ","ⓖ","ⓗ","ⓘ","ⓙ","ⓚ","ⓛ","ⓜ","ⓝ","ⓞ","ⓟ","ⓠ","ⓡ","ⓢ","ⓣ","ⓤ","ⓥ","ⓦ","ⓧ","ⓨ","ⓩ"];

  const buildFont = (txt: string, upArr: string[], lowArr: string[]) => {
    return txt.split("").map(c => {
      const idxU = normalUpper.indexOf(c);
      if (idxU !== -1) return upArr[idxU];
      const idxL = normalLower.indexOf(c);
      if (idxL !== -1) return lowArr[idxL];
      return c;
    }).join("");
  };

  const scriptStyle = buildFont(trimmed, boldScriptUpper, boldScriptLower);
  const doubleStyle = buildFont(trimmed, doubleStruckUpper, doubleStruckLower);
  const gothicStyle = buildFont(trimmed, gothicUpper, gothicLower);
  const bubbleStyle = buildFont(trimmed, bubbleUpper, bubbleLower);

  return [
    `👑 ꧁ ${scriptStyle} ꧂ 👑`,
    `🔥 ꧁ ${doubleStyle} ꧂ 🔥`,
    `⚡ ꧁ ${gothicStyle} ꧂ ⚡`,
    `亗 ${scriptStyle} 亗`,
    `★彡 ${doubleStyle} 彡★`,
    `╰‿╯ ${gothicStyle}`,
    `💎 ${bubbleStyle} 💎`,
    `🌸 ${scriptStyle} 🌸`,
    `✨ ${doubleStyle} ✨`,
  ];
};

interface EmulatorFrameProps {
  strings: LocaleStrings;
  user: UserProfile | null;
  onSetUser: (u: UserProfile | null) => void;
  lang: string;
  onBroadcastGift: (gift: any) => void;
  logsCount: number;
  triggerGlobalError: (msg: string) => void;
  loadingAuth?: boolean;
}

const EMOJI_CATEGORIES = [
  {
    id: "faces",
    label: "😀 Smileys",
    emojis: [
      "😀",
      "😂",
      "😍",
      "😘",
      "😡",
      "😢",
      "😭",
      "😎",
      "😲",
      "😴",
      "🤩",
      "😜",
      "🤔",
      "🙄",
      "🤮",
      "😷",
      "🥶",
      "🤯",
      "🥳",
      "💀",
      "🤡",
      "💩",
      "👻",
      "👽",
      "🤖",
      "👾",
      "👿",
    ],
  },
  {
    id: "hands",
    label: "👍 Gestures",
    emojis: [
      "👍",
      "👎",
      "👏",
      "🙌",
      "🤝",
      "👋",
      "✊",
      "👊",
      "⚡",
      "✌️",
      "🤟",
      "🤘",
      "👌",
      "🙏",
      "💪",
      "🧠",
      "👀",
      "👤",
      "👥",
    ],
  },
  {
    id: "love",
    label: "❤️ Hearts",
    emojis: [
      "❤️",
      "💔",
      "💖",
      "💗",
      "💓",
      "💞",
      "💕",
      "💟",
      "❣️",
      "💘",
      "💝",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "🖤",
      "🤍",
      "🤎",
      "💋",
      "💌",
    ],
  },
  {
    id: "vip",
    label: "👑 Luxury",
    emojis: [
      "🔥",
      "👑",
      "🌹",
      "⭐",
      "✨",
      "🌟",
      "🎇",
      "🎈",
      "🎉",
      "🎁",
      "🎙️",
      "📻",
      "🎷",
      "🎸",
      "🎹",
      "🎻",
      "🏆",
      "🎖️",
      "🏎️",
      "🚀",
      "🛸",
      "🍺",
      "🍹",
      "🍿",
      "🎟️",
      "🛡️",
      "⚔️",
      "🔔",
    ],
  },
  {
    id: "nature",
    label: "🦁 Animals",
    emojis: [
      "🦁",
      "🐯",
      "🐼",
      "🦊",
      "🐨",
      "🐵",
      "🙊",
      "🦅",
      "🐣",
      "🐸",
      "🐉",
      "🐲",
      "🦄",
      "🍀",
      "🍁",
      "🌸",
      "🌺",
      "🌻",
      "🌼",
    ],
  },
  {
    id: "flags",
    label: "🚩 Flags",
    emojis: [
      "🇧🇩",
      "🇸🇦",
      "🇺🇸",
      "🇬🇧",
      "🇦🇪",
      "🇮🇳",
      "🇵🇰",
      "🇲🇾",
      "🇨🇦",
      "🇯🇵",
      "🇧🇷",
      "🇦🇷",
      "🇹🇷",
      "🇪🇬",
      "🇫🇷",
      "🇩🇪",
      "🇮🇹",
      "🇨🇳",
      "🇰🇷",
    ],
  },
];

const renderAvatarEffectOverlay = (emoji: string) => {
  if (emoji === "❤️" || emoji === "💖" || emoji === "😍") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/75 rounded-full overflow-hidden pointer-events-none z-20 transition-all">
        <span className="text-3xl effect-heart-expl select-none">❤️</span>
        <div className="absolute inset-0 bg-red-500/10 animate-pulse rounded-full pointer-events-none"></div>
      </div>
    );
  }
  if (emoji === "💔") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/75 rounded-full overflow-hidden pointer-events-none z-20 transition-all">
        <span className="text-3xl effect-split-heart select-none">💔</span>
        <div className="absolute inset-0 bg-indigo-500/15 rounded-full pointer-events-none"></div>
      </div>
    );
  }
  if (emoji === "🔥") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 rounded-full overflow-hidden pointer-events-none z-20 transition-all">
        <span className="text-2xl effect-fire-aura select-none">🔥</span>
        <div className="absolute inset-0 border-2 border-amber-550 rounded-full animate-spin"></div>
      </div>
    );
  }
  if (emoji === "👑") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/85 rounded-full overflow-hidden pointer-events-none z-20 transition-all">
        <span className="text-2xl effect-crown-desc select-none">👑</span>
        <div className="absolute inset-0 border-2 border-yellow-400 rounded-full select-none animate-pulse"></div>
      </div>
    );
  }
  if (emoji === "😘" || emoji === "🌹") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 rounded-full overflow-hidden pointer-events-none z-20 transition-all">
        <div className="absolute inset-x-0 top-0 bottom-0 flex flex-col justify-around text-[10px]">
          <div className="flex justify-around animate-pulse">
            <span className="effect-rain-petal">🌹</span>
            <span
              className="effect-rain-petal"
              style={{ animationDelay: "0.4s" }}
            >
              💖
            </span>
          </div>
          <div className="flex justify-around">
            <span
              className="effect-rain-petal"
              style={{ animationDelay: "0.8s" }}
            >
              🌹
            </span>
            <span
              className="effect-rain-petal"
              style={{ animationDelay: "1.2s" }}
            >
              ✨
            </span>
          </div>
        </div>
      </div>
    );
  }
  if (emoji === "⭐" || emoji === "💎" || emoji === "✨") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/75 rounded-full overflow-hidden pointer-events-none z-20 transition-all">
        <span className="text-2xl effect-sparkle select-none">✨</span>
        <div className="absolute inset-0 ring-4 ring-cyan-400/30 rounded-full animate-pulse"></div>
      </div>
    );
  }
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 rounded-full pointer-events-none animate-ping z-20">
      <span className="text-xl select-none">{emoji}</span>
    </div>
  );
};

export const getVipNameStyle = (level?: number, vipEnum?: string) => {
  let lvl = level || 0;
  if (!lvl && vipEnum) {
    if (vipEnum === "emperor" || vipEnum === VipLevel.EMPEROR) lvl = 20;
    else if (vipEnum === "royal" || vipEnum === VipLevel.ROYAL) lvl = 15;
    else if (vipEnum === "svip" || vipEnum === VipLevel.SVIP) lvl = 10;
    else if (vipEnum === "vip" || vipEnum === VipLevel.VIP) lvl = 5;
  }

  if (lvl === 0) return "text-gray-100 font-semibold";
  if (lvl <= 3) return "text-teal-300 font-bold drop-shadow-[0_1px_1px_rgba(20,184,166,0.3)]";
  if (lvl <= 5) return "text-yellow-400 font-bold drop-shadow-[0_1px_2px_rgba(234,179,8,0.4)]";
  if (lvl <= 7) return "text-indigo-400 font-bold drop-shadow-[0_1px_2px_rgba(99,102,241,0.5)]";
  if (lvl <= 9) return "text-pink-400 font-extrabold drop-shadow-[0_1px_3px_rgba(236,72,153,0.6)]";
  if (lvl <= 12) return "text-cyan-400 font-extrabold drop-shadow-[0_2px_4px_rgba(6,182,212,0.7)] animate-pulse";
  if (lvl <= 15) return "bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent font-black tracking-wide drop-shadow-[0_2px_4px_rgba(219,39,119,0.8)] animate-pulse";
  if (lvl <= 18) return "bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent font-black tracking-wide drop-shadow-[0_2px_5px_rgba(59,130,246,0.85)] animate-pulse";
  return "bg-gradient-to-r from-amber-200 via-yellow-400 via-amber-500 to-yellow-300 bg-clip-text text-transparent font-black tracking-widest drop-shadow-[0_3px_10px_rgba(245,158,11,1.0)] animate-pulse";
};

export const getVipIdStyle = (level?: number) => {
  if (!level || level <= 5) return "text-gray-500 text-[8px]";
  if (level === 6) return "text-indigo-300 font-medium bg-indigo-950/40 px-1 rounded text-[8px] border border-indigo-900/30";
  if (level === 7) return "text-pink-300 font-medium bg-pink-950/40 px-1 rounded text-[8px] border border-pink-900/30";
  if (level === 8) return "text-cyan-300 font-bold bg-cyan-950/40 px-1.5 py-0.2 rounded text-[8px] border border-cyan-800/40 shadow-sm";
  if (level === 9) return "text-teal-300 font-bold bg-teal-950/40 px-1.5 py-0.2 rounded text-[8px] border border-teal-800/40 shadow-sm animate-pulse";
  if (level === 10) return "text-blue-200 font-black bg-blue-950/60 px-1.5 py-0.5 rounded-sm text-[8px] border border-blue-500/30 shadow-[0_0_6px_rgba(59,130,246,0.3)]";
  if (level >= 11 && level <= 14) {
    return "text-fuchsia-200 font-black bg-fuchsia-950/60 px-1.5 py-0.5 rounded-sm text-[8.5px] border border-fuchsia-500/40 shadow-[0_0_8px_rgba(217,70,239,0.4)] animate-pulse";
  }
  if (level >= 15 && level <= 19) {
    return "text-orange-200 font-black bg-gradient-to-r from-orange-950/50 to-indigo-950/50 px-2 py-0.5 rounded-md text-[8.5px] border border-orange-500/40 shadow-[0_0_10px_rgba(249,115,22,0.4)]";
  }
  if (level === 20) {
    return "text-amber-100 font-black bg-gradient-to-r from-amber-900/40 to-slate-900 px-2 py-0.5 rounded-md text-[9px] border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.6)] font-mono tracking-wide";
  }
  if (level >= 21 && level <= 24) {
    return "text-cyan-100 font-black bg-gradient-to-r from-cyan-900/40 via-purple-900/20 to-slate-900 px-2 py-0.5 rounded-md text-[9px] border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.7)] tracking-wider animate-pulse";
  }
  return "text-rose-100 font-black bg-gradient-to-r from-rose-950 via-red-950 to-slate-900 px-2 py-0.5 rounded-lg text-[9.5px] border border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.85)] tracking-widest uppercase animate-pulse";
};

export const getRoomLevelBadgeAndLogo = (level: number) => {
  const lvl = level || 1;
  let logo = "🌟";
  let bgGradient = "from-blue-600/25 via-indigo-600/25 to-purple-600/25";
  let borderClass = "border-blue-500/30";
  let textClass = "text-blue-300";
  let shadowClass = "shadow-blue-500/20";
  
  if (lvl >= 50) {
    logo = "🪐";
    bgGradient = "from-rose-600/30 via-purple-600/30 to-amber-500/30";
    borderClass = "border-rose-500/40 animate-pulse";
    textClass = "text-rose-300 font-extrabold animate-pulse";
    shadowClass = "shadow-rose-500/30";
  } else if (lvl >= 30) {
    logo = "👑";
    bgGradient = "from-yellow-500/30 via-amber-600/30 to-red-600/30";
    borderClass = "border-yellow-400/40";
    textClass = "text-yellow-300 font-extrabold";
    shadowClass = "shadow-yellow-500/30";
  } else if (lvl >= 20) {
    logo = "💎";
    bgGradient = "from-cyan-500/30 via-blue-500/30 to-purple-500/30";
    borderClass = "border-cyan-400/40";
    textClass = "text-cyan-300 font-bold";
    shadowClass = "shadow-cyan-500/30";
  } else if (lvl >= 15) {
    logo = "🥇";
    bgGradient = "from-amber-500/30 via-yellow-500/30 to-amber-600/30";
    borderClass = "border-amber-400/40";
    textClass = "text-amber-300 font-bold";
    shadowClass = "shadow-amber-500/20";
  } else if (lvl >= 10) {
    logo = "🥈";
    bgGradient = "from-slate-400/20 via-slate-300/25 to-slate-500/20";
    borderClass = "border-slate-400/30";
    textClass = "text-slate-300";
    shadowClass = "shadow-slate-400/10";
  } else if (lvl >= 5) {
    logo = "🥉";
    bgGradient = "from-amber-800/20 via-amber-700/20 to-amber-900/20";
    borderClass = "border-amber-700/30";
    textClass = "text-amber-500";
    shadowClass = "shadow-amber-800/10";
  }

  return (
    <span className={`inline-flex items-center gap-1 bg-gradient-to-r ${bgGradient} border ${borderClass} px-1.5 py-0.5 rounded-md shadow-[0_2px_8px_rgba(0,0,0,0.3)] ${shadowClass} select-none shrink-0 scale-95`}>
      <span className="text-xs">{logo}</span>
      <span className={`text-[8px] uppercase tracking-widest font-black ${textClass}`}>
        LV.{lvl}
      </span>
    </span>
  );
};

export const VipAvatarFrame = ({
  avatarUrl,
  level,
  sizeClass = "w-10 h-10",
  badgeSizeClass = "text-[7px]",
  customFrameId,
}: {
  avatarUrl: string;
  level?: number;
  sizeClass?: string;
  badgeSizeClass?: string;
  customFrameId?: string;
}) => {
  let ringClass = "";
  let overlaySvg: React.ReactNode = null;
  let crownBadge = "";

  if (customFrameId) {
    if (customFrameId === "frame_royal_golden") {
      ringClass = "ring-[3px] ring-yellow-400 ring-offset-1 ring-offset-slate-950 shadow-[0_0_18px_#facc15]";
      overlaySvg = (
        <div className="absolute inset-0 rounded-full border border-yellow-400/50 animate-spin" style={{ animationDuration: "6s" }}></div>
      );
      crownBadge = "🔱";
    } else if (customFrameId === "frame_neon_cyber") {
      ringClass = "ring-[3px] ring-cyan-400 ring-offset-1 ring-offset-slate-950 shadow-[0_0_18px_#22d3ee] animate-pulse";
      overlaySvg = (
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/40 animate-spin" style={{ animationDuration: "4s" }}></div>
      );
      crownBadge = "🤖";
    } else if (customFrameId === "frame_sakura") {
      ringClass = "ring-[3px] ring-pink-400 ring-offset-1 ring-offset-slate-950 shadow-[0_0_15px_#f472b6]";
      overlaySvg = (
        <div className="absolute inset-0 rounded-full border border-pink-400/30 animate-ping opacity-60"></div>
      );
      crownBadge = "🌸";
    } else if (customFrameId === "frame_emperor_fire") {
      ringClass = "ring-[3.5px] ring-red-500 ring-offset-1 ring-offset-slate-950 shadow-[0_0_22px_#ef4444]";
      overlaySvg = (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-orange-500 animate-spin"></div>
          <div className="absolute inset-0 rounded-full border border-red-500/40 animate-ping"></div>
        </>
      );
      crownBadge = "🔥";
    } else if (customFrameId === "frame_planet_orbit") {
      ringClass = "ring-[3px] ring-cyan-400 ring-offset-1 ring-offset-slate-950 shadow-[0_0_20px_#22d3ee]";
      overlaySvg = (
        <>
          <div className="absolute inset-0 rounded-full animate-spin pointer-events-none" style={{ animationDuration: "5s" }}>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] drop-shadow-[0_0_4px_#38bdf8]">🚀</div>
          </div>
          <div className="absolute -bottom-1 -right-1 text-[11px] z-20 pointer-events-none drop-shadow-[0_0_4px_#10b981]">🌍</div>
        </>
      );
      crownBadge = "🪐";
    } else if (customFrameId === "frame_joker_circus") {
      ringClass = "ring-[3px] ring-red-500 ring-offset-1 ring-offset-slate-950 shadow-[0_0_18px_#ef4444]";
      overlaySvg = (
        <>
          <div className="absolute inset-0 rounded-full animate-spin pointer-events-none" style={{ animationDuration: "8s" }}>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[9px]">🎈</div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px]">⭐</div>
          </div>
          <div className="absolute -bottom-1 -right-1 text-[11px] z-20 pointer-events-none drop-shadow-[0_0_4px_#f43f5e]">🤡</div>
        </>
      );
      crownBadge = "🎪";
    } else if (customFrameId === "frame_starshine") {
      ringClass = "ring-[3px] ring-yellow-300 ring-offset-1 ring-offset-slate-950 shadow-[0_0_18px_#fcd34d]";
      overlaySvg = (
        <>
          <div className="absolute inset-0 rounded-full animate-spin pointer-events-none" style={{ animationDuration: "4s" }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[9px] drop-shadow-[0_0_5px_#fbbf24]">⭐</div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[9px] drop-shadow-[0_0_5px_#a855f7]">✨</div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 text-[9px] drop-shadow-[0_0_5px_#ec4899]">🌟</div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[9px] drop-shadow-[0_0_5px_#06b6d4]">⭐</div>
          </div>
        </>
      );
      crownBadge = "✨";
    } else if (customFrameId === "frame_sailing_ship") {
      ringClass = "ring-[3px] ring-amber-600 ring-offset-1 ring-offset-slate-950 shadow-[0_0_16px_rgba(180,83,9,0.7)]";
      overlaySvg = (
        <>
          <div className="absolute inset-0 rounded-full border border-dashed border-amber-500/40 animate-spin" style={{ animationDuration: "12s" }}></div>
          <div className="absolute -bottom-1 -right-1.5 text-[11px] z-20 pointer-events-none drop-shadow-[0_0_4px_#0369a1]">⛵</div>
          <div className="absolute -bottom-1 -left-1.5 text-[8.5px] z-20 pointer-events-none">⚓</div>
        </>
      );
      crownBadge = "🧭";
    } else if (customFrameId === "frame_royal_prestige") {
      ringClass = "ring-[4px] ring-yellow-400 ring-offset-2 ring-offset-slate-950 shadow-[0_0_30px_#facc15] animate-pulse";
      overlaySvg = (
        <>
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[15px] z-30 pointer-events-none drop-shadow-[0_0_8px_#facc15] animate-bounce duration-[2000ms]">👑</div>
          <div className="absolute inset-0 rounded-full border border-yellow-400/30 animate-ping"></div>
          <div className="absolute -bottom-1 -right-1 text-[9px] z-20 pointer-events-none drop-shadow-[0_0_4px_#ef4444]">💎</div>
          <div className="absolute -bottom-1 -left-1 text-[9px] z-20 pointer-events-none drop-shadow-[0_0_4px_#ef4444]">💎</div>
        </>
      );
      crownBadge = "👑";
    } else if (customFrameId === "frame_magic_phoenix") {
      ringClass = "ring-[3.5px] ring-red-500 ring-offset-1 ring-offset-slate-950 shadow-[0_0_24px_rgba(239,68,68,0.95)] animate-pulse";
      overlaySvg = (
        <>
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-[12px] z-20 pointer-events-none drop-shadow-[0_0_5px_#f97316]">🪶</div>
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-[12px] z-20 pointer-events-none drop-shadow-[0_0_5px_#f97316]">🪶</div>
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-orange-500/60 animate-spin" style={{ animationDuration: "6s" }}></div>
        </>
      );
      crownBadge = "🔥";
    } else if (customFrameId === "frame_neon_skull") {
      ringClass = "ring-[3px] ring-emerald-400 ring-offset-1 ring-offset-slate-950 shadow-[0_0_20px_#34d399] animate-pulse";
      overlaySvg = (
        <>
          <div className="absolute -bottom-1 -right-1 text-[11px] z-20 pointer-events-none drop-shadow-[0_0_6px_#10b981]">💀</div>
          <div className="absolute inset-0 rounded-full border border-emerald-400/30 animate-ping opacity-60"></div>
        </>
      );
      crownBadge = "💀";
    } else if (customFrameId === "frame_ice_heart") {
      ringClass = "ring-[3px] ring-cyan-300 ring-offset-1 ring-offset-slate-950 shadow-[0_0_18px_rgba(103,232,249,0.8)]";
      overlaySvg = (
        <>
          <div className="absolute inset-0 rounded-full animate-spin pointer-events-none" style={{ animationDuration: "6s" }}>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[9px] drop-shadow-[0_0_4px_#a5f3fc]">❄️</div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] drop-shadow-[0_0_4px_#38bdf8]">💙</div>
          </div>
          <div className="absolute -bottom-1 -right-1 text-[10px] z-20 pointer-events-none drop-shadow-[0_0_4px_#67e8f9]">💎</div>
        </>
      );
      crownBadge = "❄️";
    } else if (customFrameId === "frame_dark_phantom") {
      ringClass = "ring-[3.5px] ring-purple-600 ring-offset-1 ring-offset-slate-950 shadow-[0_0_22px_#9333ea]";
      overlaySvg = (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-dotted border-purple-500 animate-spin" style={{ animationDuration: "5s" }}></div>
          <div className="absolute -bottom-1 -right-1 text-[11px] z-20 pointer-events-none drop-shadow-[0_0_6px_#dc2626]">😈</div>
        </>
      );
      crownBadge = "😈";
    } else if (customFrameId === "frame_golden_dragon") {
      ringClass = "ring-[4px] ring-yellow-500 ring-offset-2 ring-offset-slate-950 shadow-[0_0_32px_#eab308] animate-pulse";
      overlaySvg = (
        <>
          <div className="absolute inset-0 rounded-full border border-yellow-500/40 animate-spin" style={{ animationDuration: "10s" }}></div>
          <div className="absolute -top-1.5 -left-1 text-[12px] z-20 pointer-events-none drop-shadow-[0_0_6px_#eab308]">🐉</div>
          <div className="absolute -bottom-1 -right-1 text-[11px] z-20 pointer-events-none drop-shadow-[0_0_6px_#ef4444]">🔮</div>
        </>
      );
      crownBadge = "🐉";
    }
  } else if (!level || level <= 5) {
    return (
      <div className={`relative ${sizeClass} rounded-full overflow-hidden border border-white/10 flex-shrink-0`}>
        <img
          src={avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
          alt="Avatar"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover rounded-full"
        />
      </div>
    );
  } else {
    if (level === 6) {
      ringClass = "ring-2 ring-indigo-500 ring-offset-1 ring-offset-slate-950 shadow-[0_0_8px_rgba(99,102,241,0.5)]";
      crownBadge = "⭐";
    } else if (level === 7) {
      ringClass = "ring-2 ring-pink-500 ring-offset-1 ring-offset-slate-950 shadow-[0_0_10px_rgba(236,72,153,0.6)]";
      crownBadge = "💖";
    } else if (level === 8) {
      ringClass = "ring-2 ring-cyan-400 ring-offset-1 ring-offset-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.7)] animate-pulse";
      crownBadge = "⚡";
    } else if (level === 9) {
      ringClass = "ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-950 shadow-[0_0_14px_rgba(52,211,153,0.7)]";
      crownBadge = "🛡️";
    } else if (level === 10) {
      ringClass = "ring-[2.5px] ring-yellow-400 ring-offset-1 ring-offset-slate-950 shadow-[0_0_16px_rgba(234,179,8,0.8)]";
      crownBadge = "👑";
    } else if (level >= 11 && level <= 14) {
      ringClass = "ring-2 ring-fuchsia-500 ring-offset-1 ring-offset-slate-950 shadow-[0_0_18px_rgba(217,70,239,0.8)] animate-pulse";
      crownBadge = "🔥";
    } else if (level >= 15 && level <= 19) {
      ringClass = "ring-2 ring-orange-500 ring-offset-1 ring-offset-slate-950 shadow-[0_0_20px_rgba(249,115,22,0.8)]";
      crownBadge = "✨";
      overlaySvg = (
        <div className="absolute inset-0 rounded-full border border-pink-500 animate-ping opacity-30"></div>
      );
    } else if (level === 20) {
      ringClass = "ring-[3px] ring-amber-400 ring-offset-1 ring-offset-slate-950 shadow-[0_0_25px_rgba(245,158,11,1.0)] animate-pulse";
      crownBadge = "👑👑";
      overlaySvg = (
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400/50 animate-spin"></div>
      );
    } else if (level >= 21 && level <= 24) {
      ringClass = "ring-[3px] ring-cyan-400 ring-offset-1 ring-offset-slate-950 shadow-[0_0_30px_rgba(6,182,212,1.0)] animate-pulse";
      crownBadge = "💎✨";
      overlaySvg = (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-400/55 animate-spin"></div>
          <div className="absolute inset-0 rounded-full border border-purple-500/40 animate-ping"></div>
        </>
      );
    } else {
      ringClass = "ring-[3.5px] ring-rose-500 ring-offset-1 ring-offset-slate-950 shadow-[0_0_35px_rgba(244,63,94,1.0)] animate-bounce duration-[3000ms]";
      crownBadge = "🪐🔱";
      overlaySvg = (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-rose-500 animate-spin"></div>
          <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 animate-ping opacity-45"></div>
        </>
      );
    }
  }

  return (
    <div className={`relative ${sizeClass} flex-shrink-0 flex items-center justify-center`}>
      {overlaySvg}
      <div className={`w-full h-full rounded-full overflow-hidden ${ringClass} relative z-10 bg-slate-950`}>
        <img
          src={avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
          alt="Avatar"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover rounded-full"
        />
      </div>
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none drop-shadow-lg flex items-center justify-center">
        <span className={`${badgeSizeClass} bg-slate-950/95 text-white font-black px-1 rounded-full border border-yellow-500/30 whitespace-nowrap scale-80`}>
          {crownBadge} L{level}
        </span>
      </div>
    </div>
  );
};

export default function EmulatorFrame({
  strings,
  user,
  onSetUser,
  lang,
  onBroadcastGift,
  logsCount,
  triggerGlobalError,
  loadingAuth = false,
}: EmulatorFrameProps) {
  // Mobile router state: 'login' | 'explore' | 'room' | 'profile' | 'wallet' | 'spin' | 'family' | 'chats' | 'permissions'
  const [mobileRoute, setMobileRoute] = useState<string>("login");
  const [permissionStep, setPermissionStep] = useState<number>(1);

  // Google Selector & Onboarding States
  const [showGooglePickerModal, setShowGooglePickerModal] = useState<boolean>(false);
  const [showAddGoogleAccount, setShowAddGoogleAccount] = useState<boolean>(false);
  const [addGoogleEmail, setAddGoogleEmail] = useState<string>("");
  const [addGoogleName, setAddGoogleName] = useState<string>("");
  const [addGoogleAvatar, setAddGoogleAvatar] = useState<string>("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80");
  
  // Custom Google account Presets (simulated accounts on the mobile device)
  const [googlePresets, setGooglePresets] = useState<any[]>([
    {
      email: "ebadulhoque1234567890@gmail.com",
      displayName: "Ebadul Hoque",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    },
    {
      email: "sylhetfluteboy@gmail.com",
      displayName: "Sylhet Flute Boy",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    },
    {
      email: "anika.admin@gmail.com",
      displayName: "Anika Admin",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    },
    {
      email: "dhaka.beats@gmail.com",
      displayName: "Dhaka Beats Fan",
      avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80",
    }
  ]);

  // Onboarding workflow states
  const [showProfileOnboarding, setShowProfileOnboarding] = useState<boolean>(false);
  const [onboardingEmail, setOnboardingEmail] = useState<string>("");
  const [onboardingDisplayName, setOnboardingDisplayName] = useState<string>("");
  const [onboardingAvatarUrl, setOnboardingAvatarUrl] = useState<string>("");
  const [onboardingGender, setOnboardingGender] = useState<Gender | "">("");
  const [onboardingDob, setOnboardingDob] = useState<string>("");
  const [onboardingPresetAvatarSelector, setOnboardingPresetAvatarSelector] = useState<boolean>(false);

  // Room exit & double back minimize state tracking
  const [showRoomExitConfirm, setShowRoomExitConfirm] = useState<boolean>(false);
  const [lastBackPress, setLastBackPress] = useState<number>(0);
  const [roomPrivateChatOverlay, setRoomPrivateChatOverlay] = useState<boolean>(false);
  const [activeRelationshipForChat, setActiveRelationshipForChat] = useState<any | null>(null);

  // Payment simulated states
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<{
    id: string;
    inr: number;
    diamonds: number;
    coins: number;
    description: string;
  } | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("phonepe");
  const [customUpiId, setCustomUpiId] = useState<string>("");
  const [paymentProcessing, setPaymentProcessing] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  // Auth Form parameters
  const [guestName, setGuestName] = useState<string>("");
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [phoneInput, setPhoneInput] = useState<string>("");
  const [smsCode, setSmsCode] = useState<string>("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  // Modern Auth state parameters
  const [authModalType, setAuthModalType] = useState<
    "none" | "gmail" | "facebook" | "email"
  >("none");
  const [gmailEmail, setGmailEmail] = useState<string>("");
  const [gmailName, setGmailName] = useState<string>("");
  const [gmailAvatar, setGmailAvatar] = useState<string>(
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
  );

  const [facebookName, setFacebookName] = useState<string>("");
  const [facebookUsername, setFacebookUsername] = useState<string>("");
  const [facebookAvatar, setFacebookAvatar] = useState<string>(
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
  );

  const [emailAddress, setEmailAddress] = useState<string>("");
  const [emailPassword, setEmailPassword] = useState<string>("");
  const [emailName, setEmailName] = useState<string>("");

  // Profile edit fields
  const [editDisplayName, setEditDisplayName] = useState<string>("");
  const [editBio, setEditBio] = useState<string>("");
  const [editGender, setEditGender] = useState<Gender>(Gender.MALE);
  const [editAge, setEditAge] = useState<number>(22);
  const [editCountry, setEditCountry] = useState<string>("");
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>("");
  const [editCoverUrl, setEditCoverUrl] = useState<string>("");
  const [editVipLevel, setEditVipLevel] = useState<VipLevel>(VipLevel.NONE);

  // Storage / Fetch States
  const [roomsList, setRoomsList] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [latestVipAlert, setLatestVipAlert] = useState<any | null>(null);
  const lastAlertIdRef = useRef<string | null>(null);
  const [roomMessages, setRoomMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");
  const [userRelationships, setUserRelationships] = useState<any[]>([]);

  const fetchUserRelationships = () => {
    if (!user?.id) return;
    fetch(`/api/relationships/user/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.active) {
          setUserRelationships(data.active);
        }
      })
      .catch(err => console.error("Error loading active user relationships:", err));
  };

  useEffect(() => {
    fetchUserRelationships();
  }, [user?.id, activeRoom?.roomId]);

  // Private messages states
  const [bubblePos, setBubblePos] = useState<{ x: number; y: number }>({ x: 260, y: 550 });
  const isDraggingBubbleRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const bubbleStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [showPrivatePhotoPicker, setShowPrivatePhotoPicker] = useState<boolean>(false);
  const [privateThreads, setPrivateThreads] = useState<any[]>([
    {
      id: "ebadul",
      name: "Creator Ebadul",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      status: "online",
      unread: true,
      messages: [
        {
          id: "m1",
          senderId: "ebadul",
          senderName: "Creator Ebadul",
          avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
          content: "Assalamu Alaikum! Welcome to EbadulChat. Play Greedy Game under Tools inside any room!",
          timestamp: "09:12 AM"
        }
      ]
    },
    {
      id: "rahul",
      name: "Rahul Knight 🕺",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      status: "online",
      unread: false,
      messages: [
        {
          id: "m2",
          senderId: "rahul",
          senderName: "Rahul Knight 🕺",
          avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
          content: "Hey, can we start a PK Battle later? Let's win some coins!",
          timestamp: "Yesterday"
        }
      ]
    },
    {
      id: "sarah",
      name: "Sarah VIP 🌸",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      status: "offline",
      unread: false,
      messages: [
        {
          id: "m3",
          senderId: "sarah",
          senderName: "Sarah VIP 🌸",
          avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
          content: "Thank you for the amazing support inside EbadulChat and the lovely gifts!",
          timestamp: "Yesterday"
        }
      ]
    },
    {
      id: "nabila",
      name: "Nabila Angel 🧚‍♀️",
      avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
      status: "online",
      unread: false,
      messages: [
        {
          id: "m4",
          senderId: "nabila",
          senderName: "Nabila Angel 🧚‍♀️",
          avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
          content: "EbadulChat room voice sounds are super clear today! Let's sit on a seat together.",
          timestamp: "3 days ago"
        }
      ]
    },
    {
      id: "mod",
      name: "System Moderator 🤖",
      avatarUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=150&q=80",
      status: "online",
      unread: false,
      messages: [
        {
          id: "m5",
          senderId: "system",
          senderName: "System",
          avatarUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=150&q=80",
          content: "Alert: Keep your room rules clean. Do not share credentials.",
          timestamp: "4 days ago"
        }
      ]
    }
  ]);
  const [currentChatUser, setCurrentChatUser] = useState<UserProfile | null>(
    null,
  );

  useEffect(() => {
    if (roomPrivateChatOverlay && currentChatUser && user) {
      fetch(`/api/relationships/user/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.active) {
            const rel = data.active.find((r: any) => 
              (r.user1Id === currentChatUser.id && r.user2Id === user.id) ||
              (r.user2Id === currentChatUser.id && r.user1Id === user.id)
            );
            setActiveRelationshipForChat(rel || null);
          } else {
            setActiveRelationshipForChat(null);
          }
        })
        .catch(err => console.error("Error loading chat relationship details:", err));
    } else {
      setActiveRelationshipForChat(null);
    }
  }, [roomPrivateChatOverlay, currentChatUser, user?.id]);

  const [privateInput, setPrivateInput] = useState<string>("");

  // Catalog logs
  const [giftsCatalog, setGiftsCatalog] = useState<GiftItem[]>([]);
  const [familiesCatalog, setFamiliesCatalog] = useState<Family[]>([]);
  const [activePk, setActivePk] = useState<PKBattle | null>(null);

  // Active UI flags
  const [showGiftStore, setShowGiftStore] = useState<boolean>(false);
  const [showAdminBypassPanel, setShowAdminBypassPanel] = useState<boolean>(false);
  const [activeAdminTab, setActiveAdminTab] = useState<"general" | "gifts" | "vip">("general");
  const [adminVipList, setAdminVipList] = useState<any[]>([]);
  const [editingGiftId, setEditingGiftId] = useState<string>("");
  const [editingGiftName, setEditingGiftName] = useState<string>("");
  const [editingGiftCost, setEditingGiftCost] = useState<string>("");
  const [editingGiftImageUrl, setEditingGiftImageUrl] = useState<string>("");
  const [editingGiftAnimType, setEditingGiftAnimType] = useState<string>("2d");
  const [editingGiftCategory, setEditingGiftCategory] = useState<string>("small");
  const [editingGiftEffectClass, setEditingGiftEffectClass] = useState<string>("");

  const [editingVipLevel, setEditingVipLevel] = useState<string>("");
  const [editingVipTitle, setEditingVipTitle] = useState<string>("");
  const [editingVipMinRecharge, setEditingVipMinRecharge] = useState<string>("");
  const [editingVipBadge, setEditingVipBadge] = useState<string>("");
  const [editingVipFrameStyle, setEditingVipFrameStyle] = useState<string>("");
  const [editingVipChatStyle, setEditingVipChatStyle] = useState<string>("");
  const [editingVipEntryBanner, setEditingVipEntryBanner] = useState<string>("");
  const [editingVipEntrySound, setEditingVipEntrySound] = useState<string>("bronze");

  const [adminRewardTarget, setAdminRewardTarget] = useState<string>("me");
  const [adminRewardAmount, setAdminRewardAmount] = useState<string>("5000");
  const [adminRewardType, setAdminRewardType] = useState<"coins" | "diamonds">("diamonds");
  const [diamondGiftTargetId, setDiamondGiftTargetId] = useState<string>("");
  const [diamondGiftAmount, setDiamondGiftAmount] = useState<string>("");
  const [diamondGiftStep, setDiamondGiftStep] = useState<number>(1);
  const [isDiamondGiftOpen, setIsDiamondGiftOpen] = useState<boolean>(false);
  const [isSubmittingDiamondGift, setIsSubmittingDiamondGift] = useState<boolean>(false);
  const [royalEntrance, setRoyalEntrance] = useState<{ displayName: string; avatarUrl: string; vipLevel: string } | null>(null);
  const [showStickerPanel, setShowStickerPanel] = useState<boolean>(false);
  const [activeEmojiTab, setActiveEmojiTab] = useState<string>("faces");
  const [showReportsPanel, setShowReportsPanel] = useState<boolean>(false);
  const [activeReports, setActiveReports] = useState<any[]>([]);
  const [showMusicPlayer, setShowMusicPlayer] = useState<boolean>(false);
  const [showGameCenter, setShowGameCenter] = useState<boolean>(false);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [selectedReceiverId, setSelectedReceiverId] = useState<string>("");
  const [selectedReceiverIds, setSelectedReceiverIds] = useState<string[]>([]);
  const [showRecipientDropdown, setShowRecipientDropdown] = useState<boolean>(false);
  const [selectedAdminTarget, setSelectedAdminTarget] = useState<any | null>(null);
  const [userProfileView, setUserProfileView] = useState<UserProfile | null>(
    null,
  );
  const [autoOpenRelationship, setAutoOpenRelationship] = useState<boolean>(false);
  const [showSeatOptions, setShowSeatOptions] = useState<number | null>(null); // Seat index
  const [seatInvite, setSeatInvite] = useState<{
    roomId: string;
    seatIndex: number;
    inviterId?: string;
    inviterName: string;
  } | null>(null);
  const [isCurrentUserSeated, setIsCurrentUserSeated] =
    useState<boolean>(false);
  const [youtubeUrlInput, setYoutubeUrlInput] = useState<string>("");
  const [youtubeSongTitle, setYoutubeSongTitle] = useState<string>("");
  const [youtubeDurationChoice, setYoutubeDurationChoice] =
    useState<number>(360000); // Default 6 minutes
  const [youtubeSearchTerm, setYoutubeSearchTerm] = useState<string>("");
  const [localMusicFileName, setLocalMusicFileName] = useState<string>("");
  const localMusicFileUrlRef = useRef<string | null>(null);

  // Custom User Local Tracks Hub
  const [localTracks, setLocalTracks] = useState<{ id: string; name: string; blobUrl: string; artist: string; durMs: number }[]>([]);

  // Load Cached Songs from IndexedDB on Mount
  useEffect(() => {
    async function loadCachedSongs() {
      try {
        const dbInstance = await initSongDB();
        const transaction = dbInstance.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = (e: any) => {
          const results = e.target.result || [];
          const tracks = results.map((item: any) => {
            const blobUrl = URL.createObjectURL(item.file);
            return {
              id: item.id,
              name: item.name,
              blobUrl: blobUrl,
              artist: "Cached Audio File",
              durMs: 300000,
            };
          });
          if (tracks.length > 0) {
            setLocalTracks(prev => {
              const filteredPrev = prev.filter(p => !tracks.some((t: any) => t.id === p.id));
              return [...filteredPrev, ...tracks];
            });
            console.log(`Loaded ${tracks.length} songs from mobile IndexedDB storage!`);
          }
        };
      } catch (err) {
        console.error("Failed to load cached songs from IndexedDB:", err);
      }
    }
    loadCachedSongs();
  }, []);
  // YouTube Sync Browser integration inside the room
  const [selectedBrowserVideoId, setSelectedBrowserVideoId] = useState<string>("Umqb9DKHYEg");
  const [showInAppYtBrowser, setShowInAppYtBrowser] = useState<boolean>(false);
  const [musicStationTab, setMusicStationTab] = useState<'device' | 'youtube'>('device');

  // Tools modal states
  const [showToolsMenu, setShowToolsMenu] = useState<boolean>(false);
  const [showPicUploadPanel, setShowPicUploadPanel] = useState<boolean>(false);
  const [showRoomEventsModal, setShowRoomEventsModal] =
    useState<boolean>(false);
  const [showMiniAppsModal, setShowMiniAppsModal] = useState<boolean>(false);
  const [giftCombo, setGiftCombo] = useState<number>(1);
  const [songSearchQuery, setSongSearchQuery] = useState<string>("");
  const [floatingEmojis, setFloatingEmojis] = useState<
    { id: string; emoji: string; left: number; duration: number }[]
  >([]);
  const [avatarEffects, setAvatarEffects] = useState<{
    [userId: string]: { emoji: string; expiry: number };
  }>({});
  const [giftLeaderboard, setGiftLeaderboard] = useState<
    { name: string; score: number; rank: number }[]
  >([
    { name: "Sylhet Flute Boy", score: 8500, rank: 1 },
    { name: "Anika Admin", score: 6200, rank: 2 },
    { name: "Dhaka Beats Fan", score: 4500, rank: 3 },
  ]);

  // New room generation and filtering states
  const [showCreateRoomModal, setShowCreateRoomModal] =
    useState<boolean>(false);
  const [newMobRoomName, setNewMobRoomName] = useState<string>("");
  const [newMobRoomCategory, setNewMobRoomCategory] =
    useState<string>("public");
  const [newMobRoomLayout, setNewMobRoomLayout] = useState<number>(8);
  const [newMobRoomBg, setNewMobRoomBg] = useState<string>(
    "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=150&q=80",
  );
  const [discoverTab, setDiscoverTab] = useState<string>("trending");
  const [exploreTab, setExploreTab] = useState<"all" | "main">("all");
  const [recentRooms, setRecentRooms] = useState<{ id: string; name: string; coverUrl?: string; backgroundUrl?: string }[]>(() => {
    try {
      const stored = localStorage.getItem("recent_visited_rooms");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Global search modal and state
  const [showGlobalSearchModal, setShowGlobalSearchModal] = useState<boolean>(false);
  const [searchType, setSearchType] = useState<"room" | "profile">("room");
  const [searchQueryId, setSearchQueryId] = useState<string>("");
  const [searchResultRoom, setSearchResultRoom] = useState<any>(null);
  const [searchResultProfile, setSearchResultProfile] = useState<any>(null);
  const [searchError, setSearchError] = useState<string>("");
  const [searchLoading, setSearchLoading] = useState<boolean>(false);

  // Voice Controls
  const [micEnabled, setMicEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("ebadul_mic_enabled");
    return saved !== "false";
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("ebadul_sound_enabled");
    return saved !== "false";
  });

  // --- InFriends Music Player State ---
  const [bgMusicVolume, setBgMusicVolume] = useState<number>(() => {
    const saved = localStorage.getItem("ebadul_music_volume");
    return saved !== null ? Number(saved) : 0.8;
  });
  const [musicRepeat, setMusicRepeat] = useState<'none' | 'one' | 'all'>(() => {
    const saved = localStorage.getItem("ebadul_music_repeat");
    return (saved as 'none' | 'one' | 'all') || 'none';
  });
  const [musicShuffle, setMusicShuffle] = useState<boolean>(() => {
    const saved = localStorage.getItem("ebadul_music_shuffle");
    return saved === "true";
  });
  const [musicCurrentTime, setMusicCurrentTime] = useState<number>(0);
  const [musicDuration, setMusicDuration] = useState<number>(0);
  const [backgroundUploads, setBackgroundUploads] = useState<{ id: string; name: string; progress: number }[]>([]);

  useEffect(() => {
    if (bgMusicRef.current) {
      bgMusicRef.current.volume = bgMusicVolume;
    }
    localStorage.setItem("ebadul_music_volume", String(bgMusicVolume));
  }, [bgMusicVolume]);

  useEffect(() => {
    localStorage.setItem("ebadul_music_repeat", musicRepeat);
  }, [musicRepeat]);

  useEffect(() => {
    localStorage.setItem("ebadul_music_shuffle", String(musicShuffle));
  }, [musicShuffle]);

  const socketRef = useRef<any>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map()); // targetUserId -> RTCPeerConnection
  const localStreamRef = useRef<MediaStream | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const isCurrentUserSeatedRef = useRef<boolean>(false);
  const micEnabledRef = useRef<boolean>(false);
  const soundEnabledRef = useRef<boolean>(true);

  // PREMIUM ROOM OVERLAYS AND STATE HOOKS
  const [showRoomDetails, setShowRoomDetails] = useState<boolean>(false);
  const [showRoomFollowersList, setShowRoomFollowersList] = useState<boolean>(false);
  const [roomFollowersData, setRoomFollowersData] = useState<any[]>([]);
  const [loadingRoomFollowers, setLoadingRoomFollowers] = useState<boolean>(false);
  const [showRoomSettings, setShowRoomSettings] = useState<boolean>(false);
  const [roomSettingsData, setRoomSettingsData] = useState<any>(null);
  const [loadingSettings, setLoadingSettings] = useState<boolean>(false);

  // Editable settings inputs
  const [settingsName, setSettingsName] = useState<string>("");
  const [settingsAnnouncement, setSettingsAnnouncement] = useState<string>("");
  const [settingsBackgroundUrl, setSettingsBackgroundUrl] =
    useState<string>("");
  const [settingsCoverUrl, setSettingsCoverUrl] = useState<string>("");
  const [settingsCategory, setSettingsCategory] = useState<RoomCategory>(
    RoomCategory.PUBLIC,
  );
  const [settingsPassword, setSettingsPassword] = useState<string>("");
  const [settingsEntrySetting, setSettingsEntrySetting] = useState<
    "free" | "coins" | "vip" | "password"
  >("free");
  const [settingsEntryFee, setSettingsEntryFee] = useState<number>(0);
  const [settingsMinLevelRequired, setSettingsMinLevelRequired] =
    useState<number>(0);
  const [settingsVipRequired, setSettingsVipRequired] =
    useState<boolean>(false);
  const [settingsFollowRequired, setSettingsFollowRequired] =
    useState<boolean>(false);

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getAlbumArtwork = (songId: string) => {
    const hashes = songId ? songId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 42;
    const gradients = [
      "from-pink-500 via-purple-600 to-indigo-700",
      "from-cyan-500 via-blue-600 to-purple-700",
      "from-emerald-400 via-teal-600 to-indigo-700",
      "from-amber-400 via-rose-500 to-purple-700",
      "from-fuchsia-500 via-purple-700 to-slate-900"
    ];
    return gradients[hashes % gradients.length];
  };

  // Restriction Toggles
  const [settingsChatTextRestriction, setSettingsChatTextRestriction] =
    useState<boolean>(false);
  const [settingsChatMediaRestriction, setSettingsChatMediaRestriction] =
    useState<boolean>(false);
  const [settingsChatLinkRestriction, setSettingsChatLinkRestriction] =
    useState<boolean>(false);
  const [settingsChatBadWordFilter, setSettingsChatBadWordFilter] =
    useState<boolean>(false);

  // Audio/Visual Effects
  const [settingsSkipEntranceEffects, setSettingsSkipEntranceEffects] =
    useState<boolean>(false);
  const [settingsDisableBulletScreen, setSettingsDisableBulletScreen] =
    useState<boolean>(false);
  const [settingsDisableGiftAnimation, setSettingsDisableGiftAnimation] =
    useState<boolean>(false);
  const [settingsDisableJoinNotification, setSettingsDisableJoinNotification] =
    useState<boolean>(false);

  // Security Toggles
  const [settingsIsPrivate, setSettingsIsPrivate] = useState<boolean>(false);
  const [settingsAntiSpam, setSettingsAntiSpam] = useState<boolean>(false);
  const [settingsAntiAbuse, setSettingsAntiAbuse] = useState<boolean>(false);

  const [settingsSeatLayout, setSettingsSeatLayout] = useState<number>(8);

  // Administration helpers
  const [settingsActionUserId, setSettingsActionUserId] = useState<string>("");
  const [detailsTab, setDetailsTab] = useState<
    "members" | "admins" | "muted" | "banned"
  >("members");
  const [settingsTab, setSettingsTab] = useState<
    "general" | "entry" | "admins" | "members" | "seats" | "chat_seq"
  >("general");

  // Refresh ticks
  const [refreshTicks, setRefreshTicks] = useState<number>(0);
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Sticker presets
  const stickerPack = [
    "❤️",
    "⭐",
    "🔥",
    "🇧🇩",
    "🇸🇦",
    "🍿",
    "🎉",
    "👑",
    "🎙️",
    "🏎️",
    "🦁",
    "💎",
  ];

  // Initialize profile edit values
  useEffect(() => {
    if (user && mobileRoute === "profile") {
      setEditDisplayName(user.displayName || "");
      setEditBio(user.bio || "");
      setEditGender(user.gender || Gender.MALE);
      setEditAge(user.age || 22);
      setEditCountry(user.country || "");
      setEditAvatarUrl(user.avatarUrl || "");
      setEditCoverUrl(user.coverUrl || "");
      setEditVipLevel(user.vipLevel || VipLevel.NONE);
    }
  }, [user?.id, mobileRoute]);

  // Auto-route to explore on successful auth session restoration
  useEffect(() => {
    if (user && mobileRoute === "login") {
      setMobileRoute("explore");
    }
  }, [user, mobileRoute]);

  // File Upload Helper to convert images to Base64 and upload to the backend
  const handleImageFileUpload = async (file: File, bucket = "covers"): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const response = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: base64, filename: file.name, bucket }),
          });
          if (response.ok) {
            const result = await response.json();
            resolve(result.url);
          } else {
            const err = await response.json();
            reject(new Error(err.error || "Failed to upload image."));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("File reading failed"));
      reader.readAsDataURL(file);
    });
  };

  // File Upload Helper to convert audio to Base64 and upload to the backend
  const handleAudioFileUpload = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const response = await fetch("/api/upload-audio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioBase64: base64, filename: file.name }),
          });
          if (response.ok) {
            const result = await response.json();
            resolve(result.url);
          } else {
            const err = await response.json();
            reject(new Error(err.error || "Failed to upload audio file."));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Audio file reading failed"));
      reader.readAsDataURL(file);
    });
  };

  // Listen to secure postMessage callback from Google / Facebook Simulated popups
  useEffect(() => {
    const handleOauthMessage = async (event: MessageEvent) => {
      if (event.data?.type === "OAUTH_AUTH_SUCCESS" && event.data?.payload) {
        const {
          type,
          displayName,
          username,
          avatarUrl,
          email,
          googleId,
          facebookId,
        } = event.data.payload;
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type,
              displayName,
              username,
              avatarUrl,
              email,
              googleId,
              facebookId,
            }),
          });
          const data = await res.json();
          if (data.success) {
            onSetUser(data.profile);
            setMobileRoute("explore");
            triggerGlobalError(
              `Logged in beautifully via ${type === "google" ? "Google Account Picker" : "Facebook Secure Popup"}!`,
            );
            setAuthModalType("none");
          }
        } catch (err: any) {
          triggerGlobalError(err.message);
        }
      }
    };

    window.addEventListener("message", handleOauthMessage);
    return () => window.removeEventListener("message", handleOauthMessage);
  }, []);

  // Fetch Rooms & Catalogs regularly
  useEffect(() => {
    fetchRooms();
    fetchGifts();
    fetchVipLevels();
    fetchFamilies();
  }, [user?.id, refreshTicks, mobileRoute]);

  // Poll for global luxury VIP notifications
  useEffect(() => {
    if (!user) return;
    
    let isMounted = true;
    const fetchLatestVipAlerts = async () => {
      try {
        const res = await fetch("/api/gifts/vip-alerts");
        if (res.ok && isMounted) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const alerts = await res.json();
            if (alerts && alerts.length > 0) {
              const newest = alerts[0];
              // Only trigger alert on frontend if it's new (different ID) and not more than 45 seconds old
              if (newest.id !== lastAlertIdRef.current && (Date.now() - newest.timestamp < 45000)) {
                lastAlertIdRef.current = newest.id;
                setLatestVipAlert(newest);
                
                // Automatically dismiss after 10 seconds of VIP highlight display
                setTimeout(() => {
                  if (isMounted) {
                    setLatestVipAlert((current: any) => {
                      if (current && current.id === newest.id) {
                        return null;
                      }
                      return current;
                    });
                  }
                }, 10000);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error polling VIP alerts:", err);
      }
    };
    
    // Initial fetch
    fetchLatestVipAlerts();
    
    // Poll every 3 seconds
    const intervalId = setInterval(fetchLatestVipAlerts, 3000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [user?.id]);

  // WebRTC & Socket Helpers
  const getLocalAudioStream = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      stream.getAudioTracks().forEach((track) => {
        track.enabled = micEnabledRef.current;
      });
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error("Failed to access microphone:", err);
      return null;
    }
  };

  // Synchronize mic controls to physical hardware track & backend
  useEffect(() => {
    micEnabledRef.current = micEnabled;
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = micEnabled;
      });
    }
    localStorage.setItem("ebadul_mic_enabled", String(micEnabled));

    if (socketRef.current && activeRoom && user) {
      const mySeat = activeRoom.seats.find((s) => s.userId === user.id);
      if (mySeat && mySeat.isMutedByUser !== !micEnabled) {
        socketRef.current.emit("seat:set_mic", {
          roomId: activeRoom.id,
          userId: user.id,
          isMutedByUser: !micEnabled,
        });
      }
    }
  }, [micEnabled, activeRoom?.id, user?.id]);

  // Synchronize host moderation mute back to client state
  useEffect(() => {
    if (activeRoom && user && micEnabled) {
      const mySeat = activeRoom.seats.find((s) => s.userId === user.id);
      if (mySeat && mySeat.isMutedByOwner) {
        setMicEnabled(false);
        micEnabledRef.current = false;
        triggerGlobalError("Host/Admin muted your microphone.");
      }
    }
  }, [activeRoom, user?.id, micEnabled]);

  // Synchronize speaker controls to physical HTML Audio Elements
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
    const audios = document.querySelectorAll("audio[id^='audio_']");
    audios.forEach((el) => {
      (el as HTMLAudioElement).muted = !soundEnabled;
    });
    localStorage.setItem("ebadul_sound_enabled", String(soundEnabled));
  }, [soundEnabled]);

  // Synchronize premium real-time copyleft room background music
  useEffect(() => {
    if (!bgMusicRef.current) {
      bgMusicRef.current = new Audio();
    }
    const audio = bgMusicRef.current;
    const mState = activeRoom?.musicState;

    if (
      activeRoom &&
      mState &&
      mState.currentSongName &&
      mState.currentSongUrl &&
      !mState.currentSongId?.startsWith("yt_")
    ) {
      let resolvedUrl = mState.currentSongUrl;
      const matchingLocalTrack = localTracks.find(t => t.id === mState.currentSongId);
      if (matchingLocalTrack && matchingLocalTrack.blobUrl) {
        resolvedUrl = matchingLocalTrack.blobUrl;
      } else if (resolvedUrl === "local_file" || resolvedUrl.startsWith("local_")) {
        const matchingLocalTrackFallback = localTracks.find(t => t.id === mState.currentSongId || t.id === resolvedUrl);
        if (matchingLocalTrackFallback && matchingLocalTrackFallback.blobUrl) {
          resolvedUrl = matchingLocalTrackFallback.blobUrl;
        } else if (localMusicFileUrlRef.current) {
          resolvedUrl = localMusicFileUrlRef.current;
        } else {
          resolvedUrl =
            "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3";
        }
      } else if (resolvedUrl === "dhaka_vibe")
        resolvedUrl =
          "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
      else if (resolvedUrl === "bangla_melody")
        resolvedUrl =
          "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3";
      else if (resolvedUrl === "sufi_moonlight")
        resolvedUrl =
          "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3";
      else if (resolvedUrl === "sunset_jam")
        resolvedUrl =
          "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3";
      else if (!resolvedUrl.startsWith("http") && !resolvedUrl.startsWith("/uploads/"))
        resolvedUrl =
          "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

      if (audio.src !== resolvedUrl) {
        audio.src = resolvedUrl;
        audio.load();
      }

      audio.muted = !soundEnabled;

      if (mState.isPlaying) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) =>
            console.log(
              "BG Audio play interrupted or deferred user gesture:",
              err,
            ),
          );
        }

        // Relative offset alignment: align client time with server's absolute synced updatedAt play tick
        const updateTick = mState.updatedAt
          ? new Date(mState.updatedAt).getTime()
          : Date.now();
        const serverComputedOffsetSec =
          (mState.progressMs + (Date.now() - updateTick)) / 1000;

        // Match only if drift exceeds 2.5 seconds to prevent choppy loop experiences
        if (
          Math.abs(audio.currentTime - serverComputedOffsetSec) > 2.5 &&
          serverComputedOffsetSec > 0
        ) {
          audio.currentTime =
            serverComputedOffsetSec % (mState.durationMs / 1000 || 180);
        }
      } else {
        if (!audio.paused) {
          audio.pause();
        }
      }
    } else {
      if (!audio.paused) {
        audio.pause();
      }
      audio.src = "";
    }
  }, [activeRoom?.musicState, soundEnabled, localTracks]);

  const triggerPlaySong = async (songId: string) => {
    if (!activeRoom) return;
    const song = activeRoom.songs?.find((s: any) => s.id === songId);
    if (!song) return;

    try {
      const res = await fetch(`/api/rooms/${activeRoom.id}/music`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "play",
          requestingUserId: user?.id,
          songId: song.id,
          songName: song.name,
          songArtist: song.artist || "Uploaded Audio",
          songUrl: song.url,
          durationMs: song.durMs || 300000,
        })
      });
      if (res.ok) {
        const body = await res.json();
        setActiveRoom(body.room);
      } else {
        const errData = await res.json();
        triggerGlobalError(errData.error || "Failed to play song.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const triggerNextSong = async () => {
    if (!activeRoom || !activeRoom.songs || activeRoom.songs.length === 0) return;
    
    // Find current index
    const currentSongId = activeRoom.musicState?.currentSongId;
    let nextIndex = 0;
    
    if (musicShuffle) {
      nextIndex = Math.floor(Math.random() * activeRoom.songs.length);
    } else if (currentSongId) {
      const currIdx = activeRoom.songs.findIndex((s: any) => s.id === currentSongId);
      if (currIdx !== -1) {
        nextIndex = (currIdx + 1) % activeRoom.songs.length;
      }
    }

    const nextSong = activeRoom.songs[nextIndex];
    if (nextSong) {
      await triggerPlaySong(nextSong.id);
    }
  };

  const triggerPrevSong = async () => {
    if (!activeRoom || !activeRoom.songs || activeRoom.songs.length === 0) return;
    
    // Find current index
    const currentSongId = activeRoom.musicState?.currentSongId;
    let prevIndex = 0;
    
    if (musicShuffle) {
      prevIndex = Math.floor(Math.random() * activeRoom.songs.length);
    } else if (currentSongId) {
      const currIdx = activeRoom.songs.findIndex((s: any) => s.id === currentSongId);
      if (currIdx !== -1) {
        prevIndex = (currIdx - 1 + activeRoom.songs.length) % activeRoom.songs.length;
      }
    }

    const prevSong = activeRoom.songs[prevIndex];
    if (prevSong) {
      await triggerPlaySong(prevSong.id);
    }
  };

  // Bind audio element events for InFriends Player progress & repeat/shuffle
  useEffect(() => {
    if (!bgMusicRef.current) {
      bgMusicRef.current = new Audio();
    }
    const audio = bgMusicRef.current;

    const handleTimeUpdate = () => {
      setMusicCurrentTime(audio.currentTime);
    };
    const handleDurationChange = () => {
      setMusicDuration(audio.duration || 0);
    };
    const handleEnded = () => {
      const isHost = activeRoom && (activeRoom.ownerId === user?.id || activeRoom.admins?.includes(user?.id || "") || activeRoom.moderators?.includes(user?.id || ""));
      if (!isHost) return; // Only host advances playlist for everyone

      if (musicRepeat === 'one') {
        audio.currentTime = 0;
        audio.play().catch(e => console.error("Replay failed", e));
        fetch(`/api/rooms/${activeRoom.id}/music`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "seek", requestingUserId: user?.id, progressMs: 0 })
        }).catch(err => console.error(err));
      } else if (musicRepeat === 'all' || musicRepeat === 'none') {
        // If it's repeat none and we are at the end of the list, stop. Otherwise next song.
        const currentSongId = activeRoom.musicState?.currentSongId;
        const currIdx = activeRoom.songs?.findIndex((s: any) => s.id === currentSongId) ?? -1;
        const isLastSong = currIdx !== -1 && activeRoom.songs && currIdx === activeRoom.songs.length - 1;
        
        if (isLastSong && musicRepeat === 'none') {
          // Stop song
          fetch(`/api/rooms/${activeRoom.id}/music`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "stop", requestingUserId: user?.id })
          }).then(res => {
            if (res.ok) return res.json();
          }).then(body => {
            if (body) setActiveRoom(body.room);
          }).catch(err => console.error(err));
        } else {
          triggerNextSong();
        }
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("loadedmetadata", handleDurationChange);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("loadedmetadata", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [activeRoom, musicRepeat, musicShuffle, user?.id]);

  const cleanupAllPeerConnections = () => {
    peerConnectionsRef.current.forEach((pc) => {
      pc.close();
    });
    peerConnectionsRef.current.clear();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    const audios = document.querySelectorAll("audio[id^='audio_']");
    audios.forEach((el) => el.remove());
  };

  const getOrCreatePeerConnection = async (
    targetUserId: string,
    isInitiator: boolean,
  ) => {
    if (peerConnectionsRef.current.has(targetUserId)) {
      return peerConnectionsRef.current.get(targetUserId)!;
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    }) as any;
    pc.iceQueue = [];

    peerConnectionsRef.current.set(targetUserId, pc);

    pc.onicecandidate = (event: any) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("webrtc:signal", {
          toUserId: targetUserId,
          signal: { type: "candidate", candidate: event.candidate },
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`ICE Connection State with ${targetUserId}: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === "failed") {
        console.warn(`ICE connection failed with ${targetUserId}. Attempting ICE restart...`);
        try {
          pc.restartIce();
        } catch (err) {
          console.error("Failed to restart ICE:", err);
        }
      }
    };

    pc.ontrack = (event: any) => {
      console.log(`Received remote track from ${targetUserId}`);
      const stream = event.streams[0];
      let audioEl = document.getElementById(
        `audio_${targetUserId}`,
      ) as HTMLAudioElement;
      if (!audioEl) {
        audioEl = document.createElement("audio");
        audioEl.id = `audio_${targetUserId}`;
        audioEl.autoplay = true;
        audioEl.style.display = "none";
        document.body.appendChild(audioEl);
      }
      audioEl.srcObject = stream;
      audioEl.muted = !soundEnabledRef.current;

      // Explicit play trigger to guarantee voice audio activation in browser iframes & mobile webviews
      const playPromise = audioEl.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn(
            "Autoplay voice track deferred on client gesture limits:",
            err,
          );
          // Retry playing on any document user interaction click if blocked initially
          const playOnInteraction = () => {
            audioEl
              .play()
              .then(() =>
                document.removeEventListener("click", playOnInteraction),
              )
              .catch((e) => console.log("Still blocked voice play:", e));
          };
          document.addEventListener("click", playOnInteraction);
        });
      }
    };

    // Add local mic track ONLY if the current user is seated on a speaking seat
    if (isCurrentUserSeatedRef.current) {
      const localStream = await getLocalAudioStream();
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }
    } else {
      // For viewer/audience connections, ensure an audio transceiver is set up so the offer/answer contains an audio channel
      try {
        pc.addTransceiver("audio", { direction: "recvonly" });
      } catch (err) {
        console.warn("Transceiver not supported:", err);
      }
    }

    if (isInitiator) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current?.emit("webrtc:signal", {
          toUserId: targetUserId,
          signal: { type: "offer", offer },
        });
      } catch (err) {
        console.error("Error creating local RTC offer:", err);
      }
    }

    return pc;
  };

  const handleIncomingRtcSignal = async (fromUserId: string, signal: any) => {
    try {
      if (signal.type === "offer") {
        const pc = (await getOrCreatePeerConnection(fromUserId, false)) as any;
        await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
        
        // Process any queued candidates
        if (pc.iceQueue && pc.iceQueue.length > 0) {
          for (const cand of pc.iceQueue) {
            await pc.addIceCandidate(new RTCIceCandidate(cand)).catch((e: any) => console.warn("Error adding queued candidate:", e));
          }
          pc.iceQueue = [];
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketRef.current?.emit("webrtc:signal", {
          toUserId: fromUserId,
          signal: { type: "answer", answer },
        });
      } else if (signal.type === "answer") {
        const pc = peerConnectionsRef.current.get(fromUserId) as any;
        if (pc) {
          await pc.setRemoteDescription(
            new RTCSessionDescription(signal.answer),
          );
          
          // Process any queued candidates
          if (pc.iceQueue && pc.iceQueue.length > 0) {
            for (const cand of pc.iceQueue) {
              await pc.addIceCandidate(new RTCIceCandidate(cand)).catch((e: any) => console.warn("Error adding queued candidate:", e));
            }
            pc.iceQueue = [];
          }
        }
      } else if (signal.type === "candidate") {
        const pc = peerConnectionsRef.current.get(fromUserId) as any;
        if (pc) {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch((e: any) => console.warn("Error adding candidate:", e));
          } else {
            if (!pc.iceQueue) pc.iceQueue = [];
            pc.iceQueue.push(signal.candidate);
          }
        }
      }
    } catch (err) {
      console.error("RTC signal handler error:", err);
    }
  };

  const handleSocketSeatAction = (action: string) => {
    if (!activeRoom || !user || showSeatOptions === null) return;

    if (socketRef.current) {
      if (action === "take") {
        socketRef.current.emit("seat:take", {
          roomId: activeRoom.id,
          userId: user.id,
          seatIndex: showSeatOptions,
          isMutedByUser: !micEnabled,
        });
      } else if (action === "leave") {
        socketRef.current.emit("seat:leave", {
          roomId: activeRoom.id,
          userId: user.id,
        });
      } else if (action === "toggle_mic") {
        socketRef.current.emit("seat:toggle_mic", {
          roomId: activeRoom.id,
          userId: user.id,
        });
      } else if (action === "toggle_lock") {
        socketRef.current.emit("seat:toggle_lock", {
          roomId: activeRoom.id,
          requesterId: user.id,
          seatIndex: showSeatOptions,
        });
      } else if (action === "toggle_owner_mute") {
        socketRef.current.emit("seat:toggle_owner_mute", {
          roomId: activeRoom.id,
          requesterId: user.id,
          seatIndex: showSeatOptions,
        });
      } else if (action === "request") {
        socketRef.current.emit("seat:request", {
          roomId: activeRoom.id,
          userId: user.id,
          seatIndex: showSeatOptions,
        });
        triggerGlobalError("Seat request submitted to room admin queue.");
      }
    } else {
      if (action === "take" || action === "leave" || action === "toggle_mic") {
        actionOnSeat(action as any);
      } else {
        triggerGlobalError("Real-time socket connection is initializing...");
      }
    }
    setShowSeatOptions(null);
  };

  const handleRequestAction = (
    targetUserId: string,
    action: "accept" | "decline",
  ) => {
    if (!activeRoom || !user || showSeatOptions === null) return;
    if (socketRef.current) {
      socketRef.current.emit("seat:request_action", {
        roomId: activeRoom.id,
        adminUserId: user.id,
        seatIndex: showSeatOptions,
        targetUserId,
        action,
      });
    }
    setShowSeatOptions(null);
  };

  const handleInviteUser = (targetUserId: string) => {
    if (!activeRoom || !user || showSeatOptions === null) return;
    if (socketRef.current) {
      socketRef.current.emit("seat:invite", {
        roomId: activeRoom.id,
        adminUserId: user.id,
        seatIndex: showSeatOptions,
        targetUserId,
      });
      triggerGlobalError(
        `Voice seat invite dispatched to user ID: ${targetUserId}`,
      );
    }
    setShowSeatOptions(null);
  };

  const triggerVisualStickers = (senderId: string, emoji: string) => {
    // 1. Spawn floating emoji bubble
    const id = Math.random().toString();
    setFloatingEmojis((prev) => [
      ...prev,
      {
        id,
        emoji,
        left: 15 + Math.random() * 70,
        duration: 2.0 + Math.random() * 1.5,
      },
    ]);

    // 2. Spawn seat aura effect
    setAvatarEffects((prev) => ({
      ...prev,
      [senderId]: { emoji, expiry: Date.now() + 1800 },
    }));
  };

  // Real-Time Socket.IO Client Activation Effect
  useEffect(() => {
    if (!activeRoom || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      cleanupAllPeerConnections();
      return;
    }

    const socket = io();
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket.IO client connected:", socket.id);
      socket.emit("room:join", { roomId: activeRoom.id, userId: user.id });
    });

    socket.on(
      "room:sync",
      ({
        room,
        messages: sMsgs,
      }: {
        room: ChatRoom;
        messages: ChatMessage[];
      }) => {
        setActiveRoom(room);
        setRoomMessages(sMsgs);
      },
    );

    socket.on("room:update", (updatedRoom: ChatRoom) => {
      setActiveRoom(updatedRoom);
    });

    socket.on("room:pk_update", (updatedPk: PKBattle) => {
      setActivePk(updatedPk);
    });

    socket.on("room:seats_layout_changed", ({ seatLayout, seats }) => {
      setActiveRoom(prev => prev ? { ...prev, seatLayout, seats } : null);
    });

    socket.on("admin:vip_levels_updated", (vipLevels: any[]) => {
      setAdminVipList(vipLevels);
    });

    socket.on("admin:gift_catalog_updated", (gifts: GiftItem[]) => {
      setGiftsCatalog(gifts);
    });

    const playVipEntrySound = (soundType: string) => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        if (soundType === "emperor" || soundType === "cosmic") {
          // Magnificent high-pitch synth chord rising
          const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C major chord
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            osc.type = "sine";
            
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.2 + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.5);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.08);
            osc.stop(ctx.currentTime + 2.5);
          });
        } else if (soundType === "gold" || soundType === "diamond") {
          // Golden bright harp arpeggio
          const notes = [392.00, 493.88, 587.33, 783.99]; // G major arpeggio
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            osc.type = "triangle";
            
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.1 + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.06);
            osc.stop(ctx.currentTime + 1.8);
          });
        } else {
          // Soft chime
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.type = "sine";
          
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 1.2);
        }
      } catch (err) {
        console.error("Audio synth error:", err);
      }
    };

    socket.on("room:vip_entrance_alert", (alert: any) => {
      setRoyalEntrance(alert);
      if (alert.entrySound) {
        playVipEntrySound(alert.entrySound);
      } else if (alert.level === 95 || alert.level === 10) {
        playVipEntrySound("emperor");
      } else {
        playVipEntrySound("bronze");
      }
      setTimeout(() => {
        setRoyalEntrance(null);
      }, 6000);
    });

    socket.on("room:gift_broadcast", (gift: any) => {
      onBroadcastGift(gift);
      // Play brief high pitch synth chime for incoming gift!
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 chime
        osc.type = "sine";
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } catch (e) {}
    });

    socket.on("message:received", (newMsg: ChatMessage) => {
      setRoomMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      if (newMsg.type === "sticker") {
        triggerVisualStickers(newMsg.senderId, newMsg.content);
      }
    });

    socket.on("private:message_received", (payload: any) => {
      const { senderId, senderName, avatarUrl, message } = payload;
      setPrivateThreads(prev => {
        const exists = prev.some(t => t.id === senderId);
        const incomingMsg = {
          id: message.id || "msg_" + Date.now(),
          senderId: senderId,
          senderName: senderName,
          avatarUrl: avatarUrl,
          content: message.content,
          photoUrl: message.photoUrl,
          timestamp: "Just Now"
        };

        if (!exists) {
          return [
            ...prev,
            {
              id: senderId,
              name: senderName,
              avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
              unread: true,
              messages: [incomingMsg]
            }
          ];
        }

        return prev.map(t => {
          if (t.id === senderId) {
            return {
              ...t,
              unread: true,
              messages: [...t.messages, incomingMsg]
            };
          }
          return t;
        });
      });
    });

    socket.on("message:deleted", ({ messageId }: { messageId: string }) => {
      setRoomMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    socket.on("room:error", ({ error }: { error: string }) => {
      triggerGlobalError(error);
    });

    socket.on(
      "room:kicked",
      ({
        roomId,
        userId,
        reason,
      }: {
        roomId: string;
        userId: string;
        reason: string;
      }) => {
        if (user && userId === user.id) {
          triggerGlobalError(`Kicked: You have been ${reason} from this room!`);
          handleLeaveRoom();
        }
      },
    );

    socket.on(
      "seat:invite_received",
      ({ roomId, seatIndex, inviterId, inviterName }: any) => {
        setSeatInvite({ roomId, seatIndex, inviterId, inviterName });
      },
    );

    socket.on(
      "seat:invite_rejected",
      ({ roomId, userId, username }: any) => {
        triggerGlobalError(`❌ ${username} (ID: ${userId}) has rejected your seat invitation!`);
      },
    );

    socket.on("webrtc:signal", async ({ fromUserId, signal }: any) => {
      await handleIncomingRtcSignal(fromUserId, signal);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      cleanupAllPeerConnections();
    };
  }, [activeRoom?.id, user?.id]);

  // Monitor when our seating state changes to trigger resetting WebRTC peers cleanly
  const currentSeatCalculatedVal = !!(
    activeRoom && activeRoom.seats.some((s) => s.userId === user?.id)
  );
  useEffect(() => {
    isCurrentUserSeatedRef.current = currentSeatCalculatedVal;
    if (currentSeatCalculatedVal !== isCurrentUserSeated) {
      setIsCurrentUserSeated(currentSeatCalculatedVal);
      cleanupAllPeerConnections();
    }
  }, [currentSeatCalculatedVal, isCurrentUserSeated]);

  // WebRTC Mesh Coordination Effect (Audiences + Speakers fully combined live)
  const seatedIdsStr = activeRoom?.seats.map((s) => s.userId || "empty").join(",") || "";
  const audienceIdsStr = (activeRoom as any)?.audience?.map((u: any) => u.id).join(",") || "";

  useEffect(() => {
    if (!activeRoom || !user) {
      cleanupAllPeerConnections();
      return;
    }

    const seatedUserIds = activeRoom.seats
      .filter((s) => s.userId && s.userId !== user.id)
      .map((s) => s.userId!);

    const audienceIds = (activeRoom as any).audience?.map((u: any) => u.id) || [];
    const onlineUserIds = Array.from(new Set([...audienceIds, ...seatedUserIds]));

    // Close connections to users who left
    peerConnectionsRef.current.forEach((pc, targetUserId) => {
      const isTargetStillInRoom = onlineUserIds.includes(targetUserId);
      const isTargetStillSeated = seatedUserIds.includes(targetUserId);

      let shouldClose = false;
      if (!isTargetStillInRoom) {
        // If they left the room entirely, close the connection
        shouldClose = true;
      } else if (!isCurrentUserSeated) {
        // If we are an audience member, we only connect to seated users.
        // If they left the seats, close the connection.
        if (!isTargetStillSeated) {
          shouldClose = true;
        }
      }

      if (shouldClose) {
        pc.close();
        peerConnectionsRef.current.delete(targetUserId);
        const audioEl = document.getElementById(`audio_${targetUserId}`);
        if (audioEl) audioEl.remove();
      }
    });

    // Establish connections with newly seated users
    seatedUserIds.forEach((targetUserId) => {
      if (!peerConnectionsRef.current.has(targetUserId)) {
        const isInitiator = !isCurrentUserSeated || user.id < targetUserId;
        getOrCreatePeerConnection(targetUserId, isInitiator);
      }
    });
  }, [seatedIdsStr, audienceIdsStr, user?.id, isCurrentUserSeated]);

  // Auto scroll down room chat
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [roomMessages.length]);

  const syncRoomDynamics = async () => {
    if (!activeRoom) return;
    try {
      const res = await fetch(
        `/api/rooms/${activeRoom.id}?requestingUserId=${user?.id || ""}`,
      );
      if (!res.ok) return;
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) return;
      const updated = await res.json();
      setActiveRoom(updated);

      // Fetch Chat Logs
      const msgRes = await fetch(`/api/rooms/${activeRoom.id}/messages`);
      if (msgRes.ok) {
        const msgCt = msgRes.headers.get("content-type");
        if (msgCt && msgCt.includes("application/json")) {
          const msgs = await msgRes.json();
          setRoomMessages(msgs);
        }
      }

      // Fetch Battle details
      if (updated.activePkBattleId) {
        const pkRes = await fetch(`/api/pk/battle/${updated.activePkBattleId}`);
        if (pkRes.ok) {
          const pkCt = pkRes.headers.get("content-type");
          if (pkCt && pkCt.includes("application/json")) {
            const pkObj = await pkRes.json();
            setActivePk(pkObj);
          }
        }
      } else {
        setActivePk(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await fetch(`/api/rooms?requestingUserId=${user?.id || ""}`);
      if (res.ok) {
        const ct = res.headers.get("content-type");
        if (ct && ct.includes("application/json")) {
          setRoomsList(await res.json());
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchGifts = async () => {
    try {
      const res = await fetch("/api/gifts/catalog");
      if (res.ok) {
        const ct = res.headers.get("content-type");
        if (ct && ct.includes("application/json")) {
          setGiftsCatalog(await res.json());
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchVipLevels = async () => {
    try {
      const res = await fetch("/api/gifts/vip-levels");
      if (res.ok) {
        const ct = res.headers.get("content-type");
        if (ct && ct.includes("application/json")) {
          setAdminVipList(await res.json());
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFamilies = async () => {
    try {
      const res = await fetch("/api/families");
      if (res.ok) {
        const ct = res.headers.get("content-type");
        if (ct && ct.includes("application/json")) {
          setFamiliesCatalog(await res.json());
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Auth Operations
  const generateId = () => {
    const num = Math.floor(100000 + Math.random() * 900000);
    return num.toString();
  };

  const calculateAge = (dobString: string): number => {
    if (!dobString) return 21;
    try {
      const birthDate = new Date(dobString);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return isNaN(age) ? 21 : age;
    } catch {
      return 21;
    }
  };

  const handleGoogleLogin = async () => {
    const savedEmail = localStorage.getItem("last_google_account_email");
    if (savedEmail) {
      // Direct login with saved email!
      const simulatedUid = savedEmail === "ebadulhoque1234567890@gmail.com"
        ? "782446"
        : "google_user_" + savedEmail.replace(/[@.]/g, "_");
      const userRef = doc(db, "users", simulatedUid);
      
      try {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const existingData = userSnap.data();
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(existingData),
          });
          const data = await res.json();
          if (data.success) {
            onSetUser(data.profile);
            setMobileRoute("explore");
            triggerGlobalError(`Welcome back! Logged in directly via Google as ${data.profile.displayName}! ✅`);
            return;
          }
        }
      } catch (err: any) {
        console.error("Direct google login fail, falling back to real popup:", err);
      }
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const fUser = result.user;
      
      if (!fUser || !fUser.email) {
        triggerGlobalError("Google sign-in did not return email.");
        return;
      }
      
      const email = fUser.email;
      const simulatedUid = email === "ebadulhoque1234567890@gmail.com"
        ? "782446"
        : "google_user_" + email.replace(/[@.]/g, "_");
      
      // Check if user exists in Firestore!
      const userRef = doc(db, "users", simulatedUid);
      let existingData: any = null;
      try {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          existingData = userSnap.data();
        }
      } catch (err) {
        console.error("Error checking existing user:", err);
      }
      
      // If user exists and already completed onboarding:
      if (existingData && existingData.displayName && existingData.gender && existingData.dob) {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(existingData),
          });
          const data = await res.json();
          if (data.success) {
            onSetUser(data.profile);
            localStorage.setItem("last_google_account_email", email);
            setMobileRoute("explore");
            triggerGlobalError(`Logged in beautifully as ${data.profile.displayName}! ✅`);
            setAuthModalType("none");
            return;
          }
        } catch (err: any) {
          console.error("Direct login on select Google account failed:", err);
        }
      }
      
      // Prefill onboarding fields with Google account details
      setOnboardingEmail(email);
      setOnboardingDisplayName(existingData?.displayName || fUser.displayName || email.split("@")[0]);
      setOnboardingAvatarUrl(existingData?.avatarUrl || fUser.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80");
      setOnboardingGender(existingData?.gender || "");
      setOnboardingDob(existingData?.dob || "");
      setShowProfileOnboarding(true);
      
    } catch (err: any) {
      console.error("Firebase Google Auth Sign-in failed:", err);
      if (err.code === "auth/popup-blocked") {
        triggerGlobalError("Google popup was blocked. Please allow popups or open the app in a new tab to sign in!");
      } else if (err.code === "auth/unauthorized-domain") {
        triggerGlobalError("This domain is not authorized for Google Sign-In. Please add it to Firebase Console authorized domains.");
      } else {
        triggerGlobalError(`Google Sign-In error: ${err.message || err}`);
      }
    }
  };

  const handleSelectGoogleAccount = async (account: any) => {
    setShowGooglePickerModal(false);
    
    // Check if user already exists in Firestore!
    const simulatedUid = account.email === "ebadulhoque1234567890@gmail.com"
      ? "782446"
      : "google_user_" + account.email.replace(/[@.]/g, "_");
    const userRef = doc(db, "users", simulatedUid);
    
    let existingData: any = null;
    try {
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        existingData = userSnap.data();
      }
    } catch (err) {
      console.error("Error checking existing user:", err);
    }

    // Direct login if the user already completed onboarding previously!
    if (existingData && existingData.displayName && existingData.gender && existingData.dob) {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(existingData),
        });
        const data = await res.json();
        if (data.success) {
          onSetUser(data.profile);
          localStorage.setItem("last_google_account_email", account.email);
          setMobileRoute("explore");
          triggerGlobalError(`Logged in beautifully as ${data.profile.displayName}! ✅`);
          setAuthModalType("none");
          return;
        }
      } catch (err: any) {
        console.error("Direct login on select Google account failed:", err);
      }
    }

    // Prefill onboarding fields with either existingData or Google preset details,
    // so they can view, edit, or customize them before logging in!
    setOnboardingEmail(account.email);
    setOnboardingDisplayName(existingData?.displayName || account.displayName);
    setOnboardingAvatarUrl(existingData?.avatarUrl || account.avatarUrl);
    setOnboardingGender(existingData?.gender || "");
    setOnboardingDob(existingData?.dob || "");
    setShowProfileOnboarding(true);
  };

  const handleCompleteOnboarding = async () => {
    if (!onboardingDisplayName.trim()) {
      triggerGlobalError("Please enter your display name.");
      return;
    }
    if (!onboardingGender) {
      triggerGlobalError("Please select your gender (Male/Female).");
      return;
    }
    if (!onboardingDob) {
      triggerGlobalError("Please select your date of birth.");
      return;
    }

    const calculatedAge = calculateAge(onboardingDob);
    const simulatedUid = onboardingEmail === "ebadulhoque1234567890@gmail.com"
      ? "782446"
      : "google_user_" + onboardingEmail.replace(/[@.]/g, "_");
    
    const isOwner = onboardingEmail === "ebadulhoque1234567890@gmail.com";
    
    const profileData = {
      id: simulatedUid,
      username: onboardingEmail.split("@")[0],
      displayName: onboardingDisplayName.trim(),
      avatarUrl: onboardingAvatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
      bio: isOwner 
        ? "Welcome to EbadulChat Fun! Built with pure luxury." 
        : "Verified EbadulChat Elite user!",
      gender: onboardingGender as Gender,
      age: calculatedAge,
      dob: onboardingDob,
      country: "Bangladesh 🇧🇩",
      level: isOwner ? 95 : 1,
      xp: 0,
      xpNextLevel: 100,
      vipLevel: isOwner ? VipLevel.EMPEROR : VipLevel.NONE,
      vipLevelNumeric: isOwner ? 20 : 0,
      isVerified: true,
      coins: isOwner ? 999999 : 1000,
      diamonds: isOwner ? 999999 : 0,
      followersCount: 0,
      followingCount: 3,
      isOnline: true,
      badges: isOwner 
        ? ["god_admin", "vip_95", "creator"]
        : ["google_verified"],
      createdAt: new Date().toISOString(),
      email: onboardingEmail,
    };

    try {
      const userRef = doc(db, "users", simulatedUid);
      // Store user profile in Firestore database
      await setDoc(userRef, profileData);

      // Log in / sync with local Express server Map
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });
      const data = await res.json();
      if (data.success) {
        onSetUser(data.profile);
        localStorage.setItem("last_google_account_email", onboardingEmail);
        setShowProfileOnboarding(false);
        setMobileRoute("explore");
        triggerGlobalError(`Profile registered and logged in successfully as ${data.profile.displayName}! ✅`);
      } else {
        triggerGlobalError("Failed to synchronize user session with server.");
      }
    } catch (err: any) {
      console.error("Onboarding Error:", err);
      triggerGlobalError(err.message || "Failed to complete profile registration.");
    }
  };

  const handleFacebookLogin = () => {
    const width = 500;
    const height = 620;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const popup = window.open(
      "/auth/facebook",
      "facebook_oauth_popup",
      `width=${width},height=${height},top=${top},left=${left}`,
    );
    if (!popup) {
      triggerGlobalError(
        "Pop-up blocker active! Please allow pop-ups for authentication.",
      );
    }
  };

  const handleSendOtp = async () => {
    if (!phoneInput.trim()) {
      triggerGlobalError("Mobile number is required.");
      return;
    }

    // Format the phone number properly
    let formattedPhone = phoneInput.trim();
    if (!formattedPhone.startsWith("+")) {
      if (formattedPhone.startsWith("0")) {
        // Prepend Bangladesh country code +88
        formattedPhone = "+88" + formattedPhone;
      } else if (formattedPhone.startsWith("880")) {
        formattedPhone = "+" + formattedPhone;
      } else {
        triggerGlobalError("Please include your country code (e.g. +88017...)");
        return;
      }
    }

    try {
      // Clear old recaptcha container if exists or recreate
      let container = document.getElementById("recaptcha-container");
      if (!container) {
        container = document.createElement("div");
        container.id = "recaptcha-container";
        document.body.appendChild(container);
      } else {
        container.innerHTML = "";
      }

      // Create hidden/invisible RecaptchaVerifier
      const appVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible"
      });

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      triggerGlobalError("Security verification SMS OTP sent successfully!");
    } catch (err: any) {
      console.error("Firebase Phone OTP Send Error:", err);
      let errorMsg = err.message || "Failed to send OTP.";
      if (err.code === "auth/invalid-phone-number") {
        errorMsg = "Incorrect mobile number format. Please enter a valid number (e.g. +88017XXXXXXXX).";
      }
      triggerGlobalError(errorMsg);
    }
  };

  const handleVerifyOtp = async () => {
    if (!smsCode.trim()) {
      triggerGlobalError("Please enter the verification OTP code.");
      return;
    }

    if (!confirmationResult) {
      triggerGlobalError("No active verification session. Please request OTP first.");
      return;
    }

    try {
      const result = await confirmationResult.confirm(smsCode.trim());
      const fUser = result.user;

      // Look up existing user in Firestore
      const userRef = doc(db, "users", fUser.uid);
      const userSnap = await getDoc(userRef);

      let profileData: any;
      const phoneNum = fUser.phoneNumber || phoneInput.trim();
      if (userSnap.exists()) {
        profileData = userSnap.data();
        profileData.isOnline = true;
      } else {
        profileData = {
          id: fUser.uid,
          username: `phone_${phoneNum.slice(-4)}`,
          displayName: `Mobile ${phoneNum.slice(-4)}`,
          avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
          coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
          bio: "Verified Mobile Elite user!",
          gender: Gender.MALE,
          age: 21,
          country: "Bangladesh 🇧🇩",
          level: 1,
          xp: 0,
          xpNextLevel: 100,
          vipLevel: VipLevel.NONE,
          isVerified: true,
          coins: 1000,
          diamonds: 0,
          followersCount: 0,
          followingCount: 3,
          isOnline: true,
          badges: ["mobile_verified"],
          createdAt: new Date().toISOString(),
          mobile: phoneNum,
        };
      }

      // Store user profile in Firestore database
      await setDoc(userRef, profileData);

      // Log in / sync with local Express server Map
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });
      const data = await res.json();
      if (data.success) {
        onSetUser(data.profile);
        setMobileRoute("explore");
        triggerGlobalError("Identity successfully verified and logged in!");
      } else {
        triggerGlobalError("Failed to synchronize user session with server.");
      }
    } catch (err: any) {
      console.error("Firebase Phone OTP Verify Error:", err);
      let errorMsg = err.message || "Verification failed.";
      if (err.code === "auth/invalid-verification-code") {
        errorMsg = "Incorrect verification OTP code. Please try again.";
      }
      triggerGlobalError(errorMsg);
    }
  };

  // Room Creation & Navigation Actions
  const handleCreateMobileRoom = async () => {
    if (!user) {
      triggerGlobalError("Please register or log in first.");
      return;
    }
    if (!newMobRoomName.trim()) {
      triggerGlobalError("Please provide a valid room name.");
      return;
    }

    try {
      const res = await fetch("/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newMobRoomName.trim(),
          description:
            "Created directly inside standard mobile emulator dashboard.",
          ownerId: user.id,
          category: newMobRoomCategory,
          layout: newMobRoomLayout,
          backgroundUrl: newMobRoomBg,
        }),
      });

      if (res.ok) {
        const body = await res.json();
        setNewMobRoomName("");
        setShowCreateRoomModal(false);
        triggerGlobalError("Luxurious Sound Room successfully established!");
        await fetchRooms();

        // Auto enter the room
        if (body.room?.id) {
          handleJoinRoom(body.room.id);
        }
      } else {
        const errJson = await res.json();
        triggerGlobalError(errJson.error || "Establishment rejected.");
      }
    } catch (e) {
      console.error(e);
      triggerGlobalError("Network timeout during room creation.");
    }
  };

  const getFilteredRooms = () => {
    // Keep showing all available rooms but let the user select tabs
    const otherRooms = roomsList;
    let sortedList = [...otherRooms];

    switch (discoverTab) {
      case "trending":
        sortedList.sort(
          (a, b) => (b.onlineUsersCount || 0) - (a.onlineUsersCount || 0),
        );
        break;
      case "popular":
        sortedList.sort(
          (a, b) => (b.totalGiftsReceived || 0) - (a.totalGiftsReceived || 0),
        );
        break;
      case "new":
        sortedList.sort((a, b) =>
          String(b.id).localeCompare(String(a.id)),
        );
        break;
      case "recommended":
        // curated high-quality or randomized list
        sortedList.sort((a, b) => (b.level || 0) - (a.level || 0));
        break;
      case "family":
        sortedList = otherRooms.filter((r) => r.category === "family");
        break;
      case "music":
        sortedList = otherRooms.filter((r) => r.category === "music");
        break;
      case "gaming":
        sortedList = otherRooms.filter((r) => r.category === "gaming");
        break;
      case "couple":
        sortedList = otherRooms.filter((r) => r.category === "couple");
        break;
      default:
        break;
    }

    // Always sort official/Ebadul rooms to the top of any tab list!
    return sortedList.sort((a, b) => {
      const aOfficial = a.isOfficial || a.ownerId === "ebadul" || a.ownerName === "Ebadul" || a.ownerName?.toLowerCase().includes("ebadul") || a.ownerId === "ebadulhoque1234567890@gmail.com";
      const bOfficial = b.isOfficial || b.ownerId === "ebadul" || b.ownerName === "Ebadul" || b.ownerName?.toLowerCase().includes("ebadul") || b.ownerId === "ebadulhoque1234567890@gmail.com";
      if (aOfficial && !bOfficial) return -1;
      if (!aOfficial && bOfficial) return 1;
      return 0;
    });
  };

  const handleExecuteGlobalSearch = async () => {
    if (!searchQueryId.trim()) {
      setSearchError("Please enter a valid search ID.");
      return;
    }
    setSearchError("");
    setSearchResultRoom(null);
    setSearchResultProfile(null);
    setSearchLoading(true);

    try {
      const q = searchQueryId.trim();
      if (searchType === "room") {
        const res = await fetch(`/api/rooms/${q}`);
        if (res.ok) {
          const room = await res.json();
          setSearchResultRoom(room);
        } else {
          setSearchError("Room not found. Check the Room ID and try again.");
        }
      } else {
        const res = await fetch(`/api/users/${q}`);
        if (res.ok) {
          const profile = await res.json();
          setSearchResultProfile(profile);
        } else {
          setSearchError("User profile not found. Check the Profile ID.");
        }
      }
    } catch (err) {
      console.error("Search error:", err);
      setSearchError("An error occurred while performing search.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    try {
      const res = await fetch(
        `/api/rooms/${roomId}?requestingUserId=${user?.id || ""}`,
      );
      if (res.ok) {
        const target = await res.json();
        setActiveRoom(target);

        // Add to recent rooms list (last 10 unique rooms)
        setRecentRooms(prev => {
          const filtered = prev.filter(r => r.id !== target.id);
          const updated = [{
            id: target.id,
            name: target.name,
            coverUrl: target.coverUrl,
            backgroundUrl: target.backgroundUrl
          }, ...filtered].slice(0, 10);
          localStorage.setItem("recent_visited_rooms", JSON.stringify(updated));
          return updated;
        });

        // Load initial chats
        const msgRes = await fetch(`/api/rooms/${roomId}/messages`);
        if (msgRes.ok) setRoomMessages(await msgRes.json());

        // Default receiver
        setSelectedReceiverId(target.ownerId);
        setMobileRoute("room");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // SECURE SETTINGS HANDLERS
  const loadRoomSettings = async () => {
    if (!activeRoom || !user) return;
    setLoadingSettings(true);
    try {
      const res = await fetch(
        `/api/rooms/${activeRoom.id}/settings?requestingUserId=${user.id}`,
      );
      if (res.ok) {
        const data = await res.json();
        setRoomSettingsData(data);

        // Populate inputs
        setSettingsName(data.name || "");
        setSettingsAnnouncement(data.announcement || "");
        setSettingsBackgroundUrl(data.backgroundUrl || "");
        setSettingsCoverUrl(data.coverUrl || "");
        setSettingsCategory(data.category || RoomCategory.PUBLIC);
        setSettingsPassword(data.password || "");
        setSettingsEntrySetting(data.entrySetting || "free");
        setSettingsEntryFee(data.entryFee || 0);
        setSettingsMinLevelRequired(data.minLevelRequired || 0);
        setSettingsVipRequired(data.vipRequired || false);
        setSettingsFollowRequired(data.followRequired || false);

        setSettingsChatTextRestriction(data.chatTextRestriction || false);
        setSettingsChatMediaRestriction(data.chatMediaRestriction || false);
        setSettingsChatLinkRestriction(data.chatLinkRestriction || false);
        setSettingsChatBadWordFilter(data.chatBadWordFilter || false);

        setSettingsSkipEntranceEffects(data.skipEntranceEffects || false);
        setSettingsDisableBulletScreen(data.disableBulletScreen || false);
        setSettingsDisableGiftAnimation(data.disableGiftAnimation || false);
        setSettingsDisableJoinNotification(
          data.disableJoinNotification || false,
        );

        setSettingsIsPrivate(data.isPrivate || false);
        setSettingsAntiSpam(data.antiSpam || false);
        setSettingsAntiAbuse(data.antiAbuse || false);
        setSettingsSeatLayout(data.seatLayout || 8);
      } else {
        const err = await res.json();
        triggerGlobalError(
          "Failed to load settings: " + (err.error || "Access Denied"),
        );
        setShowRoomSettings(false);
      }
    } catch (e: any) {
      console.error(e);
      triggerGlobalError("Error loading room settings.");
    } finally {
      setLoadingSettings(false);
    }
  };

  const saveRoomSettings = async (overrides = {}) => {
    if (!activeRoom || !user) return;
    try {
      const payload = {
        requestingUserId: user.id,
        name: settingsName,
        announcement: settingsAnnouncement,
        backgroundUrl: settingsBackgroundUrl,
        coverUrl: settingsCoverUrl,
        category: settingsCategory,
        password: settingsPassword,
        entrySetting: settingsEntrySetting,
        entryFee: settingsEntryFee,
        minLevelRequired: settingsMinLevelRequired,
        vipRequired: settingsVipRequired,
        followRequired: settingsFollowRequired,
        chatTextRestriction: settingsChatTextRestriction,
        chatMediaRestriction: settingsChatMediaRestriction,
        chatLinkRestriction: settingsChatLinkRestriction,
        chatBadWordFilter: settingsChatBadWordFilter,
        skipEntranceEffects: settingsSkipEntranceEffects,
        disableBulletScreen: settingsDisableBulletScreen,
        disableGiftAnimation: settingsDisableGiftAnimation,
        disableJoinNotification: settingsDisableJoinNotification,
        isPrivate: settingsIsPrivate,
        antiSpam: settingsAntiSpam,
        antiAbuse: settingsAntiAbuse,
        seatLayout: settingsSeatLayout,
        ...overrides,
      };

      const res = await fetch(`/api/rooms/${activeRoom.id}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        triggerGlobalError("Room settings saved successfully!");
        await syncRoomDynamics();
        await loadRoomSettings();
      } else {
        const err = await res.json();
        triggerGlobalError("Failed to save: " + err.error);
      }
    } catch (e) {
      console.error(e);
      triggerGlobalError("Error updating settings.");
    }
  };

  const handleRoomAdminAction = async (action: string, targetId: string) => {
    if (!activeRoom || !user) return;
    if (!targetId.trim()) {
      triggerGlobalError("Please enter User ID");
      return;
    }
    try {
      const res = await fetch(`/api/rooms/${activeRoom.id}/settings/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestingUserId: user.id,
          action,
          targetUserId: targetId.trim(),
        }),
      });

      if (res.ok) {
        triggerGlobalError(`Action completed: ${action}`);
        setSettingsActionUserId("");
        await syncRoomDynamics();
        await loadRoomSettings();
      } else {
        const err = await res.json();
        triggerGlobalError("Action failed: " + err.error);
      }
    } catch (e) {
      console.error(e);
      triggerGlobalError("Server error executing request.");
    }
  };

  const handleBackNavigation = () => {
    if (!activeRoom) {
      if (mobileRoute !== "explore" && mobileRoute !== "login") {
        setMobileRoute("explore");
      }
      return;
    }

    const now = Date.now();
    if (mobileRoute === "room") {
      // If they back twice in 3 seconds, trigger exit confirmation
      if (now - lastBackPress < 3000) {
        setShowRoomExitConfirm(true);
      } else {
        setMobileRoute("explore");
        triggerGlobalError("Room Minimized! Tap Back again to Exit Room.");
        setLastBackPress(now);
      }
    } else {
      setShowRoomExitConfirm(true);
    }
  };

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (activeRoom) {
        e.preventDefault();
        // Push state to avoid leaving the physical browser tab
        window.history.pushState({ inRoom: true }, "");
        handleBackNavigation();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeRoom) {
          e.preventDefault();
          handleBackNavigation();
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("keydown", handleKeyDown);

    if (activeRoom && mobileRoute === "room") {
      window.history.pushState({ inRoom: true }, "");
    }

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeRoom, mobileRoute, lastBackPress]);

  const handleLeaveRoom = async () => {
    if (!activeRoom || !user) return;
    try {
      // Leave seats automatically
      await fetch(`/api/rooms/${activeRoom.id}/seat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave", userId: user.id }),
      });
      setActiveRoom(null);
      setActivePk(null);
      setMobileRoute("explore");
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    if (activeRoom && user) {
      try {
        await fetch(`/api/rooms/${activeRoom.id}/seat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "leave", userId: user.id }),
        });
      } catch (e) {
        console.error("Error leaving room on logout:", e);
      }
    }
    setActiveRoom(null);
    setActivePk(null);
    
    if (user && user.email) {
      localStorage.setItem("last_google_account_email", user.email);
    }
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Firebase SignOut error:", e);
    }
    onSetUser(null);
    setMobileRoute("login");
    setUserProfileView(null);
  };

  const handleRoomModeration = async (action: string, targetUserId: string) => {
    if (!activeRoom || !user) return;
    try {
      const res = await fetch(
        `/api/rooms/${activeRoom.id}/moderation?requestingUserId=${user.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            targetUserId,
            requestingUserId: user.id,
          }),
        },
      );
      if (res.ok) {
        const body = await res.json();
        setActiveRoom(body.room);
        triggerGlobalError(`Action completed successfully.`);
        if (
          action === "kick_user" ||
          action === "ban" ||
          action === "remove_seat"
        ) {
          setUserProfileView(null);
        }
      } else {
        const err = await res.json();
        triggerGlobalError(err.error || "Moderation action failed.");
      }
    } catch (e) {
      console.error(e);
      triggerGlobalError("Moderation call failed.");
    }
  };

  const fetchRoomFollowers = async () => {
    if (!activeRoom) return;
    setLoadingRoomFollowers(true);
    try {
      const res = await fetch(`/api/rooms/${activeRoom.id}/followers`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setRoomFollowersData(data.followers);
        }
      }
    } catch (err) {
      console.error("Error fetching room followers:", err);
    } finally {
      setLoadingRoomFollowers(false);
    }
  };

  useEffect(() => {
    if (showRoomSettings && activeRoom) {
      fetchRoomFollowers();
    }
  }, [showRoomSettings, activeRoom?.id]);

  const handleToggleOfficial = async () => {
    if (!activeRoom || !user) return;
    try {
      const res = await fetch("/api/admin/toggle-official-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUserId: user.id,
          roomId: activeRoom.id,
          isOfficial: !activeRoom.isOfficial
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerGlobalError(`Official status successfully updated! 👑`);
        await syncRoomDynamics();
      } else {
        triggerGlobalError(data.error || "Action failed.");
      }
    } catch (err: any) {
      triggerGlobalError(err.message || "Request failed.");
    }
  };

  const handleGrantReward = async () => {
    if (!user) return;
    try {
      const targetId = adminRewardTarget === "me" ? user.id : adminRewardTarget;
      const res = await fetch("/api/admin/give-rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUserId: user.id,
          targetUserId: targetId,
          amount: adminRewardAmount,
          type: adminRewardType
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerGlobalError(`Successfully updated ${adminRewardType} to ${adminRewardAmount}! ✨`);
        if (targetId === user.id) {
          onSetUser({
            ...user,
            coins: adminRewardType === "coins" ? user.coins + parseInt(adminRewardAmount) : user.coins,
            diamonds: adminRewardType === "diamonds" ? user.diamonds + parseInt(adminRewardAmount) : user.diamonds,
            level: adminRewardType === "level" ? parseInt(adminRewardAmount) : (user.level || 1),
            vipLevel: adminRewardType === "vipLevel" ? data.profile.vipLevel : (user.vipLevel || "none")
          });
        }
      } else {
        triggerGlobalError(data.error || "Action failed.");
      }
    } catch (err: any) {
      triggerGlobalError(err.message || "Request failed.");
    }
  };

  const handleSendDiamondGift = async () => {
    if (!user) return;
    if (!diamondGiftTargetId.trim()) {
      triggerGlobalError("Please enter a target ID or username.");
      return;
    }
    if (!diamondGiftAmount.trim() || isNaN(Number(diamondGiftAmount)) || Number(diamondGiftAmount) <= 0) {
      triggerGlobalError("Please enter a valid diamond amount.");
      return;
    }

    setIsSubmittingDiamondGift(true);
    try {
      const res = await fetch("/api/admin/send-diamond-gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUserId: user.id,
          targetInput: diamondGiftTargetId.trim(),
          diamondAmount: diamondGiftAmount.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerGlobalError(`Divine Gift Sent! ${data.targetName} received ${data.diamondCount.toLocaleString()} Diamonds 💎✨`);
        setDiamondGiftTargetId("");
        setDiamondGiftAmount("");
        setDiamondGiftStep(1);
        setIsDiamondGiftOpen(false);
      } else {
        triggerGlobalError(data.error || "Diamond gift sending failed.");
      }
    } catch (err: any) {
      triggerGlobalError(err.message || "Failed to send diamond gift.");
    } finally {
      setIsSubmittingDiamondGift(false);
    }
  };

  const handleInstantModerate = async (targetId: string, actionType: string) => {
    if (!activeRoom || !user) return;
    try {
      const res = await fetch(`/api/rooms/${activeRoom.id}/moderation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestingUserId: user.id,
          targetUserId: targetId,
          action: actionType
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerGlobalError(`Successfully executed ${actionType}! 🚫`);
        await syncRoomDynamics();
      } else {
        triggerGlobalError(data.error || "Action failed.");
      }
    } catch (err: any) {
      triggerGlobalError(err.message || "Request failed.");
    }
  };

  // Seats controller
  const handleSeatClick = (seat: VoiceSeat) => {
    if (!activeRoom || !user) return;

    // If occupied, open user profile directly!
    if (seat.userId && seat.userProfile) {
      setUserProfileView(seat.userProfile);
      return;
    }

    const isHost =
      activeRoom.ownerId === user.id ||
      activeRoom.admins?.includes(user.id) ||
      activeRoom.moderators?.includes(user.id);

    if (isHost) {
      // Host / Admin manages empty seat options
      setShowSeatOptions(seat.index);
    } else {
      // Normal user: sit immediately if unlocked, request seat if locked
      if (!seat.isLocked) {
        // Sit immediately
        setShowSeatOptions(seat.index);
        setTimeout(() => {
          handleSocketSeatAction("take");
        }, 10);
      } else {
        // Request seat
        setShowSeatOptions(seat.index);
        setTimeout(() => {
          handleSocketSeatAction("request");
        }, 10);
      }
    }
  };

  const actionOnSeat = async (
    action:
      | "take"
      | "leave"
      | "toggle_mic"
      | "lock_seat"
      | "mute_seat"
      | "kick_user",
  ) => {
    if (!activeRoom || !user || !showSeatOptions) return;
    const index = showSeatOptions;
    setShowSeatOptions(null);

    const isHost =
      activeRoom.ownerId === user.id || activeRoom.admins.includes(user.id);

    try {
      if (action === "take" || action === "leave" || action === "toggle_mic") {
        const res = await fetch(`/api/rooms/${activeRoom.id}/seat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            userId: user.id,
            seatIndex: index,
            isMutedByUser: !micEnabled,
          }),
        });
        if (res.ok) {
          const body = await res.json();
          setActiveRoom(body.room);
        }
      } else if (isHost) {
        // Moderation
        const seat = activeRoom.seats.find((s) => s.index === index);
        const res = await fetch(
          `/api/rooms/${activeRoom.id}/moderation?requestingUserId=${user?.id || ""}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action,
              seatIndex: index,
              targetUserId: seat?.userId || "",
            }),
          },
        );
        if (res.ok) {
          const body = await res.json();
          setActiveRoom(body.room);
        }
      } else {
        triggerGlobalError(
          "Only room host and admins can configure locks/mutes inside seats.",
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Chat messengers
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeRoom || !user) return;
    if (socketRef.current) {
      socketRef.current.emit("message:send", {
        roomId: activeRoom.id,
        senderId: user.id,
        type: MessageType.TEXT,
        content: messageInput,
      });
      setMessageInput("");
    } else {
      try {
        const res = await fetch(`/api/rooms/${activeRoom.id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderId: user.id,
            type: MessageType.TEXT,
            content: messageInput,
          }),
        });
        if (res.ok) {
          setMessageInput("");
          setRefreshTicks((c) => c + 1);
        } else {
          const errVal = await res.json();
          triggerGlobalError(errVal.error || "Muted by Administrator.");
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDeleteRoomMessage = async (msgId: string) => {
    if (!activeRoom || !user) return;
    try {
      const res = await fetch(`/api/rooms/${activeRoom.id}/messages/${msgId}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        setRoomMessages((prev) => prev.filter((m) => m.id !== msgId));
      } else {
        triggerGlobalError(data.error || "Failed to delete message");
      }
    } catch (err) {
      console.error("Delete message error:", err);
    }
  };

  // Direct Private Chat Actions
  const handleSendPrivateMessage = (contactId: string, photoUrl?: string) => {
    if (!privateInput.trim() && !photoUrl) return;
    if (!user) return;
    const userMessage = {
      id: "usr_" + Date.now(),
      senderId: user.id,
      senderName: user.displayName,
      avatarUrl: user.avatarUrl,
      content: privateInput || (photoUrl ? "📷 Shared a photo" : ""),
      photoUrl: photoUrl || undefined,
      timestamp: "Just Now"
    };

    setPrivateThreads(prev => {
      const exists = prev.some(t => t.id === contactId);
      if (!exists) {
        return [
          ...prev,
          {
            id: contactId,
            name: currentChatUser?.displayName || "User",
            avatarUrl: currentChatUser?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
            unread: false,
            messages: [userMessage]
          }
        ];
      }
      return prev.map(t => {
        if (t.id === contactId) {
          return {
            ...t,
            messages: [...t.messages, userMessage]
          };
        }
        return t;
      });
    });

    const textToSend = privateInput;
    setPrivateInput("");

    // POST private message to the backend server so the other user actually receives it!
    fetch("/api/private-chats/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: user.id,
        targetId: contactId,
        content: textToSend || (photoUrl ? "📷 Shared a photo" : ""),
        type: photoUrl ? "photo" : "text"
      })
    }).catch(err => console.error("Error sending private message to server:", err));

    // Only auto-reply for mock bot/system accounts
    const isSystemBot = ["ebadul", "rahul", "sarah", "nabila", "mod"].includes(contactId);
    if (isSystemBot) {
      setTimeout(() => {
        let replyText = "Understood! Let's build together.";
        if (contactId === "ebadul") {
          replyText = "Assalamu Alaikum brother! EbadulChat is fully updated now with Greedy Gold 🎡 and custom tools. Let's make it the best social network!";
        } else if (contactId === "rahul") {
          replyText = "Hahaha awesome! Let's get more friends on voice seats and play Ludo or Greedy together. I'm ready to roll!";
        } else if (contactId === "sarah") {
          replyText = "Ooh that's sweet! Thank you! Join my live audio stream and let's win coin drops & exclusive badges.";
        } else if (contactId === "nabila") {
          replyText = "Aww thanks. Let's speak on the mic inside the voice seats. I've got my sound option active!";
        } else if (contactId === "mod") {
          replyText = "Your notification of private engagement has been registered. EbadulChat platform security protocol remains fully active.";
        }

        const botReply = {
          id: "bot_" + Date.now(),
          senderId: contactId,
          senderName: contactId,
          avatarUrl: "",
          content: replyText,
          timestamp: "Just Now"
        };

        setPrivateThreads(prev => {
          const exists = prev.some(t => t.id === contactId);
          if (!exists) {
            return [
              ...prev,
              {
                id: contactId,
                name: currentChatUser?.displayName || "User",
                avatarUrl: currentChatUser?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
                unread: true,
                messages: [botReply]
              }
            ];
          }
          return prev.map(t => {
            if (t.id === contactId) {
              botReply.avatarUrl = t.avatarUrl;
              return {
                ...t,
                unread: currentChatUser?.id === contactId && mobileRoute === "chats" ? false : true,
                messages: [...t.messages, botReply]
              };
            }
            return t;
          });
        });
      }, 1200);
    }
  };

  const handleBubbleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    isDraggingBubbleRef.current = false;
    
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    
    dragStartRef.current = { x: clientX, y: clientY };
    bubbleStartRef.current = { x: bubblePos.x, y: bubblePos.y };
    
    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      const curX = "touches" in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const curY = "touches" in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      
      const deltaX = curX - dragStartRef.current.x;
      const deltaY = curY - dragStartRef.current.y;
      
      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        isDraggingBubbleRef.current = true;
      }
      
      let newX = bubbleStartRef.current.x + deltaX;
      let newY = bubbleStartRef.current.y + deltaY;
      
      newX = Math.max(5, Math.min(newX, 290));
      newY = Math.max(5, Math.min(newY, 640));
      
      setBubblePos({ x: newX, y: newY });
    };
    
    const onEnd = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onEnd);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
    
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
  };

  const sendSticker = async (sticker: string) => {
    if (!activeRoom || !user) return;
    setShowStickerPanel(false);
    if (socketRef.current) {
      socketRef.current.emit("message:send", {
        roomId: activeRoom.id,
        senderId: user.id,
        type: MessageType.STICKER,
        content: sticker,
      });
    } else {
      try {
        await fetch(`/api/rooms/${activeRoom.id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderId: user.id,
            type: MessageType.STICKER,
            content: sticker,
          }),
        });
        setRefreshTicks((c) => c + 1);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Helper to extract all room occupants (owner, seated users, audience, member profiles)
  const getRoomOccupants = () => {
    if (!activeRoom) return [];
    const occupantsMap = new Map<string, { id: string; displayName: string; avatarUrl?: string; role: string; vipLevel?: number }>();

    // 1. Room Owner
    if (activeRoom.ownerId) {
      occupantsMap.set(activeRoom.ownerId, {
        id: activeRoom.ownerId,
        displayName: activeRoom.ownerName || "Owner",
        avatarUrl: activeRoom.ownerAvatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
        role: "Owner 👑",
        vipLevel: 10
      });
    }

    // 2. Seated Users
    activeRoom.seats.forEach((seat) => {
      if (seat.userId && seat.userProfile) {
        occupantsMap.set(seat.userId, {
          id: seat.userId,
          displayName: seat.userProfile.displayName || seat.userId,
          avatarUrl: seat.userProfile.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
          role: `Seat #${seat.index} 🎤`,
          vipLevel: seat.userProfile.vipLevelNumeric || 0
        });
      }
    });

    // 3. Audience / Active Room Members
    if (Array.isArray(activeRoom.audience)) {
      activeRoom.audience.forEach((aud: any) => {
        if (aud && aud.id) {
          occupantsMap.set(aud.id, {
            id: aud.id,
            displayName: aud.displayName || aud.username || `Audience ${aud.id.substring(0, 5)}`,
            avatarUrl: aud.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
            role: "Audience 👥",
            vipLevel: aud.vipLevelNumeric || aud.vipLevel || 0
          });
        }
      });
    }

    // 4. Fallback Member Profiles
    if (Array.isArray(activeRoom.memberProfiles)) {
      activeRoom.memberProfiles.forEach((m: any) => {
        if (m && m.id && !occupantsMap.has(m.id)) {
          occupantsMap.set(m.id, {
            id: m.id,
            displayName: m.displayName || m.username || `Member ${m.id.substring(0, 5)}`,
            avatarUrl: m.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
            role: "Member ✨",
            vipLevel: m.vipLevelNumeric || m.vipLevel || 0
          });
        }
      });
    }

    return Array.from(occupantsMap.values());
  };

  // Multi-Recipient Gift Sending Engine
  const handleSendGift = async (giftId: string, combo: number = 1) => {
    if (!activeRoom || !user) return;

    // Get active targets: multi-recipient selection or single select fallback
    const targetIds = selectedReceiverIds.length > 0 
      ? selectedReceiverIds 
      : (selectedReceiverId ? [selectedReceiverId] : [activeRoom.ownerId]);

    if (targetIds.length === 0) {
      triggerGlobalError("Please select at least one recipient to send the gift.");
      return;
    }

    let successCount = 0;
    let latestSenderCoins = user.coins;
    let totalSpentPoints = 0;

    for (const targetId of targetIds) {
      try {
        const res = await fetch("/api/gifts/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId: activeRoom.id,
            senderId: user.id,
            targetUserId: targetId,
            giftId: giftId,
            comboCount: combo,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          successCount++;
          latestSenderCoins = data.senderCoins;
          totalSpentPoints += data.giftDetails.cost * combo;

          // Find recipient details for dynamic flight overlay
          const occupants = getRoomOccupants();
          const recipient = occupants.find(o => o.id === targetId);

          // Trigger visual flight overlay on frontend immediately for this recipient!
          onBroadcastGift({
            id: Math.random().toString(),
            senderName: user.displayName,
            receiverName: recipient?.displayName || "User",
            giftName: data.giftDetails.name,
            giftImageUrl: data.giftDetails.imageUrl,
            cost: data.giftDetails.cost,
            animationType: data.giftDetails.animationType,
            timestamp: Date.now(),
            senderId: user.id,
            receiverId: targetId,
            senderAvatarUrl: user.avatarUrl,
            receiverAvatarUrl: recipient?.avatarUrl || activeRoom.ownerAvatarUrl,
            comboCount: combo,
          });
        } else {
          triggerGlobalError(`Gift send failed for recipient: ${data.error || "insufficient balance"}`);
        }
      } catch (e) {
        console.error("Error sending gift to target:", targetId, e);
      }
    }

    if (successCount > 0) {
      // Update local session leaderboards with sum of points
      setGiftLeaderboard((prev) => {
        const found = prev.find((item) => item.name === user.displayName);
        let nextList;
        if (found) {
          nextList = prev.map((item) =>
            item.name === user.displayName
              ? { ...item, score: item.score + totalSpentPoints }
              : item,
          );
        } else {
          nextList = [
            ...prev,
            { name: user.displayName, score: totalSpentPoints, rank: 0 },
          ];
        }
        return nextList
          .sort((a, b) => b.score - a.score)
          .map((item, index) => ({ ...item, rank: index + 1 }));
      });

      // Update local state coins instantly
      onSetUser({ ...user, coins: latestSenderCoins });
      setShowGiftStore(false);
      setRefreshTicks((c) => c + 1);
    }
  };

  // PK Battle controllers
  const handleTogglePK = async () => {
    if (!activeRoom || !user) return;
    const isOwner = activeRoom.ownerId === user.id;
    if (!isOwner) {
      triggerGlobalError(
        "Only Room Organizer can instantiate 1v1 challenger PK.",
      );
      return;
    }

    // Capture someone else sitting down from seats to compete with
    const opponentSeat = activeRoom.seats.find(
      (s) => s.userId && s.userId !== user.id,
    );
    if (!opponentSeat || !opponentSeat.userId) {
      triggerGlobalError(
        "To initiate PK Battle, at least one other participant must sit on and activate voice seats.",
      );
      return;
    }

    try {
      const res = await fetch("/api/pk/battle/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: activeRoom.id,
          leftUserId: user.id,
          rightUserId: opponentSeat.userId,
        }),
      });
      if (res.ok) {
        const payload = await res.json();
        setActivePk(payload.battle);
        setRefreshTicks((c) => c + 1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Earning controllers
  const handleDailyCheckIn = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/earn/daily-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) {
        const body = await res.json();
        onSetUser({ ...user, coins: body.currentCoins });
        triggerGlobalError(`Success! Daily reward of +150 Coins transferred.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLuckySpin = async () => {
    if (!user) return;
    const isAdmin = user.email === "ebadulhoque1234567890@gmail.com" || user.isGlobalAdmin;
    if (user.coins < 50 && !isAdmin) {
      triggerGlobalError(
        "Spin Costs 50 Gold Coins. Please recharge to proceed!",
      );
      return;
    }
    try {
      const res = await fetch("/api/earn/lucky-spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (res.ok) {
        onSetUser({ ...user, coins: data.walletCoins });
        triggerGlobalError(
          `Result: ${data.message} (${data.payout >= 0 ? "+" + data.payout : data.payout} Coins)`,
        );
      } else {
        triggerGlobalError(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Join Family helper
  const handleJoinFamilyCircle = async (id: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/families/${id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) {
        const body = await res.json();
        onSetUser({
          ...user,
          familyId: body.family.id,
          familyName: body.family.name,
        });
        triggerGlobalError(
          `Welcome! Welcomed into ${body.family.name} family.`,
        );
        setRefreshTicks((c) => c + 1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Recharge coins sandbox helper
  const handleRechargeSandbox = async (coins: number, usd: number) => {
    if (!user) return;
    try {
      const res = await fetch("/api/wallet/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, coins, costUsd: usd }),
      });
      if (res.ok) {
        const body = await res.json();
        onSetUser(body.profile);
        triggerGlobalError(
          `Sandbox rechargeable gateway successful! Coin balance updated to ${body.profile.coins}.`,
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Premium Diamond Pricing Plans in INR (₹100 to ₹5000)
  const DIAMOND_PRICING_PLANS = [
    { id: "d100", inr: 100, diamonds: 20000, coins: 5000, description: "Starter Pack" },
    { id: "d200", inr: 200, diamonds: 42000, coins: 12000, description: "Value Pack (+10% Bonus!)" },
    { id: "d500", inr: 500, diamonds: 110000, coins: 35000, description: "Master Chest (+10% Bonus!)" },
    { id: "d1000", inr: 1000, diamonds: 230000, coins: 80000, description: "Royal Fortune (+15% Bonus!)" },
    { id: "d2000", inr: 2000, diamonds: 480000, coins: 200000, description: "Imperial Vault (+20% Bonus!)" },
    { id: "d5000", inr: 5000, diamonds: 1300000, coins: 600000, description: "Ultimate Wealth (+30% Offer!)" }
  ];

  const handleSelectDiamondPlan = async (plan: typeof DIAMOND_PRICING_PLANS[0]) => {
    if (!user) return;
    
    // Bypass payment for creator account ebadulhoque1234567890@gmail.com
    if (user.email === "ebadulhoque1234567890@gmail.com") {
      triggerGlobalError(`✨ Creator instant transfer: Adding ${plan.diamonds.toLocaleString()} Diamonds...`);
      try {
        const res = await fetch("/api/wallet/recharge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            userId: user.id, 
            coins: plan.coins, 
            diamonds: plan.diamonds, 
            costUsd: plan.inr / 80 
          }),
        });
        if (res.ok) {
          const body = await res.json();
          onSetUser(body.profile);
          triggerGlobalError(`🎉 Success! ${plan.diamonds.toLocaleString()} Diamonds and ${plan.coins.toLocaleString()} Coins added instantly!`);
        }
      } catch (e) {
        console.error(e);
      }
      return;
    }

    // Standard user opens payment modal with UPI options
    setSelectedPaymentPlan(plan);
    setSelectedPaymentMethod("phonepe");
    setCustomUpiId("");
    setPaymentProcessing(false);
    setPaymentSuccess(false);
    setShowPaymentModal(true);
  };

  const handleConfirmUPIPayment = async () => {
    if (!user || !selectedPaymentPlan) return;

    if (selectedPaymentMethod === "upi_id" && !customUpiId.trim()) {
      triggerGlobalError("Please enter a valid UPI ID (e.g. user@ybl)");
      return;
    }

    setPaymentProcessing(true);
    setTimeout(async () => {
      try {
        const res = await fetch("/api/wallet/recharge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            userId: user.id, 
            coins: selectedPaymentPlan.coins, 
            diamonds: selectedPaymentPlan.diamonds, 
            costUsd: selectedPaymentPlan.inr / 80 
          }),
        });
        if (res.ok) {
          const body = await res.json();
          onSetUser(body.profile);
          setPaymentProcessing(false);
          setPaymentSuccess(true);
          triggerGlobalError("🎉 UPI Payment Authorized successfully!");
        } else {
          setPaymentProcessing(false);
          triggerGlobalError("Transaction failed, please try again.");
        }
      } catch (err) {
        setPaymentProcessing(false);
        console.error(err);
        triggerGlobalError("Network timeout during UPI verification.");
      }
    }, 2200);
  };

  // Facebook simulated oauth flow
  const handleFacebookLoginSubmit = async () => {
    if (!facebookName.trim()) {
      triggerGlobalError("Please enter your Facebook Name.");
      return;
    }
    const finalUsername =
      facebookUsername.trim() || `fb_${generateId().substring(0, 5)}`;
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: facebookName.trim(),
          username: finalUsername.toLowerCase(),
          avatarUrl: facebookAvatar,
          facebookId: `fb_id_${Math.floor(Math.random() * 100000)}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSetUser(data.profile);
        setAuthModalType("none");
        setMobileRoute("explore");
        triggerGlobalError(
          `Logged in successfully via Facebook as ${data.profile.displayName}!`,
        );
      }
    } catch (err: any) {
      triggerGlobalError(err.message);
    }
  };

  // Google simulated oauth flow
  const handleGmailLoginSubmit = async () => {
    if (!gmailName.trim()) {
      triggerGlobalError("Please enter your Google Display Name.");
      return;
    }
    const finalEmail =
      gmailEmail.trim() ||
      `${gmailName.trim().replace(/\s+/g, "").toLowerCase()}@gmail.com`;
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: gmailName.trim(),
          email: finalEmail,
          avatarUrl: gmailAvatar,
          googleId: `google_id_${Math.floor(Math.random() * 100000)}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSetUser(data.profile);
        setAuthModalType("none");
        setMobileRoute("explore");
        triggerGlobalError(
          `Logged in successfully via Google Gmail as ${data.profile.displayName}!`,
        );
      }
    } catch (err: any) {
      triggerGlobalError(err.message);
    }
  };

  // Traditional Email/Password signup/signin
  const handleEmailLoginSubmit = async () => {
    if (!emailAddress.trim()) {
      triggerGlobalError("Email Address is required.");
      return;
    }
    const finalName = emailName.trim() || emailAddress.split("@")[0];
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: finalName,
          email: emailAddress.trim(),
          username: emailAddress.split("@")[0].toLowerCase(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSetUser(data.profile);
        setAuthModalType("none");
        setMobileRoute("explore");
        triggerGlobalError(
          `Logged in successfully via Email Address as ${data.profile.displayName}!`,
        );
      }
    } catch (err: any) {
      triggerGlobalError(err.message);
    }
  };

  // Profile Save Changes Operation
  const handleSaveProfileDetails = async () => {
    if (!user) return;
    if (!editDisplayName.trim()) {
      triggerGlobalError("Display Name cannot be empty.");
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestingUserId: user.id,
          displayName: editDisplayName.trim(),
          bio: editBio.trim(),
          gender: editGender,
          age: editAge,
          country: editCountry.trim(),
          avatarUrl: editAvatarUrl.trim(),
          coverUrl: editCoverUrl.trim(),
          vipLevel: editVipLevel,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSetUser(data.profile);
        triggerGlobalError("Success: Profile updated successfully!");
        setMobileRoute("explore"); // Return to home explored
      } else {
        triggerGlobalError(data.error || "Failed to update profile.");
      }
    } catch (e: any) {
      triggerGlobalError(e.message || "Error updating profile details.");
    }
  };

  return (
    <div className="relative w-full h-[100dvh] lg:w-[345px] lg:h-[710px] bg-slate-950 rounded-none lg:rounded-[44px] p-0 lg:p-2.5 shadow-none lg:shadow-2xl border-0 lg:border-[11px] border-slate-900 overflow-hidden flex flex-col justify-between">
      {/* 1. STATUS BAR */}
      <div className="hidden lg:flex items-center justify-between px-5 pt-1 pb-2 text-[10px] text-gray-400 font-mono select-none">
        <span>14:21</span>
        <div className="w-14 h-4 bg-slate-900 rounded-full border border-slate-800 flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-slate-950 rounded-full"></div>
        </div>
        <div className="flex items-center gap-1">
          <span>📶</span>
          <span>4G</span>
          <span className="text-emerald-400">🔋 98%</span>
        </div>
      </div>

      {/* 2. MAIN APP CONTAINER FRAME */}
      <div className="flex-1 bg-slate-900/40 rounded-none lg:rounded-[28px] overflow-hidden flex flex-col justify-between relative">
        {/* GLOBAL VIP Gifting Announcement Banner Overlays */}
        {latestVipAlert && (
          <div 
            onClick={async () => {
              await handleJoinRoom(latestVipAlert.roomId);
              setLatestVipAlert(null);
            }}
            className="absolute top-2 inset-x-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-rose-500 text-slate-950 p-2.5 rounded-2xl shadow-[0_12px_24px_rgba(0,0,0,0.8)] z-50 flex items-center justify-between gap-2 border border-white/45 cursor-pointer transition hover:scale-[1.02] active:scale-95 animate-scale-up"
          >
            <div className="flex items-center gap-2 overflow-hidden flex-1">
              <span className="text-base select-none animate-bounce">👑</span>
              <div className="text-[9px] font-black leading-tight truncate">
                <span className="text-indigo-950 font-black">{latestVipAlert.senderName}</span>
                <span className="text-slate-900 font-semibold font-sans"> sent </span>
                <span className="text-rose-950 font-black">{latestVipAlert.giftImageUrl} {latestVipAlert.giftName}</span>
                <span className="text-slate-900 font-semibold font-sans"> inside </span>
                <span className="text-purple-950 font-black">Room: {latestVipAlert.roomName}</span>
              </div>
            </div>
            <button 
              className="bg-slate-950 hover:bg-slate-900 text-yellow-400 font-black text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-lg border border-yellow-500/50 flex items-center gap-0.5 whitespace-nowrap active:scale-90 transition"
            >
              Join ⚡
            </button>
          </div>
        )}

        {/* ROUTE: LOGIN SCREEN */}
        {mobileRoute === "login" && (
          loadingAuth ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 font-sans p-6 text-center animate-pulse">
              <span className="text-5xl text-yellow-500 animate-spin duration-[3000ms] inline-block mb-4">
                🎙️
              </span>
              <h2 className="text-xl font-extrabold text-white tracking-tight bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                EbadulChat Fun
              </h2>
              <p className="text-[10px] text-slate-400 uppercase font-mono tracking-widest mt-1">
                Restoring secure session...
              </p>
              <div className="mt-6 flex items-center gap-1.5 justify-center">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          ) : (
            <div className="flex-1 px-4 py-5 flex flex-col justify-between overflow-y-auto bg-slate-950 font-sans">
            <div className="text-center mt-3 animate-fade-in">
              <span className="text-4xl text-yellow-500 animate-pulse duration-1000 inline-block">
                🎙️
              </span>
              <h2 className="text-xl font-extrabold text-white tracking-tight mt-1 bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                EbadulChat Fun
              </h2>
              <p className="text-[10px] text-slate-400 uppercase font-mono tracking-widest mt-0.5">
                Secure Dynamic Client
              </p>
            </div>

            <div className="flex-1 flex flex-col justify-center my-6 gap-3 max-w-[280px] mx-auto w-full">
              <div className="text-center mb-1">
                <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
                  Welcome! Choose access provider
                </span>
              </div>

              {/* Real Google Account Picker Button */}
              <button
                onClick={handleGoogleLogin}
                className="w-full py-2.5 bg-white hover:bg-gray-50 text-slate-900 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95 text-center border border-gray-200"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22-.19-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
                {localStorage.getItem("last_google_account_email") ? `Direct Gmail Login (${localStorage.getItem("last_google_account_email")?.split("@")[0]})` : "Continue with Google"}
              </button>

              {localStorage.getItem("last_google_account_email") && (
                <div className="text-center -mt-1.5 mb-1.5">
                  <button
                    onClick={() => {
                      localStorage.removeItem("last_google_account_email");
                      handleGoogleLogin();
                    }}
                    className="text-[10px] text-yellow-500 hover:text-yellow-400 font-extrabold underline cursor-pointer select-none"
                  >
                    Login with a different Google account
                  </button>
                </div>
              )}

              {/* Real Facebook Account Picker Button */}
              <button
                onClick={handleFacebookLogin}
                className="w-full py-2.5 bg-[#1877F2] hover:bg-[#166FE5] text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95 text-center"
              >
                <svg
                  className="w-4 h-4 fill-white"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Continue with Facebook
              </button>

              <div className="relative flex items-center justify-center my-1.5">
                <div className="absolute w-full border-t border-slate-800"></div>
                <span className="relative bg-[#020617] px-2 text-[9px] text-gray-500 font-extrabold uppercase tracking-wide">
                  Or Secure SMS Access
                </span>
              </div>

              {/* Mobile OTP SMS Segment */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 shadow-inner">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5 text-center">
                  Mobile SMS Auth
                </span>

                {!otpSent ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="tel"
                      placeholder="+88017XXXXXXXX"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white text-center tracking-wider focus:outline-none focus:border-yellow-500 placeholder-slate-600 transition-colors w-full"
                    />
                    <button
                      onClick={handleSendOtp}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-1.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow transition-transform active:scale-95"
                    >
                      🚀 Request Security SMS
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Enter codes (1234)"
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white text-center tracking-widest focus:outline-none focus:border-emerald-500 transition-colors w-full font-bold"
                    />
                    <button
                      onClick={handleVerifyOtp}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-1.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow transition-all duration-100"
                    >
                      🔑 Confirm Identity
                    </button>
                    <div className="text-[8px] text-gray-400 text-center uppercase tracking-wide">
                      Real SMS sent securely via Firebase Phone Authentication.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-[9px] text-gray-500 text-center leading-normal max-w-[270px] mx-auto border-t border-slate-900 pt-3">
              This app conforms strictly to Google Play OAuth guidelines. No
              guest logs or unauthenticated operations permitted. EbadulChat
              Fun.
            </div>
          </div>
          )
        )}

        {/* ROUTE: SEQUENTIAL PERMISSION REQUESTS */}
        {mobileRoute === "permissions" && (
          <div className="flex-1 p-4 flex flex-col justify-between bg-slate-950 text-white font-sans overflow-y-auto">
            {/* Header Steps Tracker */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 justify-center mt-3">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`w-10 h-1.5 rounded-full transition-all duration-500 ${
                      step <= permissionStep
                        ? "bg-gradient-to-r from-yellow-400 to-amber-500 shadow-md shadow-yellow-500/10"
                        : "bg-slate-800"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-2">
                Permission Sequence • Step {permissionStep} of 4
              </span>
            </div>

            {/* Interactive Step Content */}
            <div className="my-auto flex flex-col items-center text-center px-2 animate-fade-in">
              {permissionStep === 1 && (
                <>
                  <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center mb-5 animate-pulse">
                    <Mic className="w-8 h-8" />
                  </div>
                  <h3 className="text-sm font-black tracking-tight text-white">
                    1. Microphone Access
                  </h3>
                  <p className="text-[11px] text-slate-300 leading-normal mt-2.5 max-w-[240px] font-medium">
                    "Voice chat rooms require microphone access."
                  </p>
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 text-[10px] text-slate-400 mt-4 leading-normal text-left max-w-[230px]">
                    🎙️ <strong>Required For:</strong> Seat participation in chat
                    lobbies, speaking with community users, and streaming
                    dynamic voice battles.
                  </div>
                </>
              )}

              {permissionStep === 2 && (
                <>
                  <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-5 animate-pulse">
                    <Bell className="w-8 h-8" />
                  </div>
                  <h3 className="text-sm font-black tracking-tight text-white">
                    2. Notification Delivery
                  </h3>
                  <p className="text-[11px] text-slate-300 leading-normal mt-2.5 max-w-[240px] font-medium">
                    "Messages, calls and room notifications."
                  </p>
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 text-[10px] text-slate-400 mt-4 leading-normal text-left max-w-[230px]">
                    🔔 <strong>Required For:</strong> Direct notifications for
                    personal mentions, alerts for invited room activities, and
                    incoming call alerts.
                  </div>
                </>
              )}

              {permissionStep === 3 && (
                <>
                  <div className="w-16 h-16 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mb-5 animate-pulse">
                    <Image className="w-8 h-8" />
                  </div>
                  <h3 className="text-sm font-black tracking-tight text-white">
                    3. Storage & Media Library
                  </h3>
                  <p className="text-[11px] text-slate-300 leading-normal mt-2.5 max-w-[240px] font-medium">
                    "Profile photos, gifts, uploads."
                  </p>
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 text-[10px] text-slate-400 mt-4 leading-normal text-left max-w-[230px]">
                    📁 <strong>Required For:</strong> Uploading customizable
                    profile covers, exchanging photos in chats, and caching
                    unique gift assets.
                  </div>
                </>
              )}

              {permissionStep === 4 && (
                <>
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-5 animate-pulse">
                    <Camera className="w-8 h-8" />
                  </div>
                  <h3 className="text-sm font-black tracking-tight text-white">
                    4. Camera Capture
                  </h3>
                  <p className="text-[11px] text-slate-300 leading-normal mt-2.5 max-w-[240px] font-medium">
                    "Profile photo and video calls."
                  </p>
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 text-[10px] text-slate-400 mt-4 leading-normal text-left max-w-[230px]">
                    📷 <strong>Required For:</strong> Capturing live avatar
                    profiles directly, hosting private video streams, and
                    participating in seat videos.
                  </div>
                </>
              )}
            </div>

            {/* Simulated Native System Alert overlay */}
            <div className="flex flex-col gap-2 select-none">
              <button
                onClick={() => {
                  // Beautiful confirmation overlay triggers when they click Grant
                  const confirmPrompt = confirm(
                    permissionStep === 1
                      ? `"EbadulChat Fun" Would Like to Access the Microphone\n\nVoice chat rooms require microphone access.`
                      : permissionStep === 2
                        ? `"EbadulChat Fun" Would Like to Send You Notifications\n\nMessages, calls and room notifications.`
                        : permissionStep === 3
                          ? `"EbadulChat Fun" Would Like to Access Your Photos and Media\n\nProfile photos, gifts, uploads.`
                          : `"EbadulChat Fun" Would Like to Access the Camera\n\nProfile photo and video calls.`,
                  );

                  if (confirmPrompt) {
                    if (permissionStep === 1) {
                      // Request real navigator media permission for micro to make it fully authentic!
                      navigator.mediaDevices
                        ?.getUserMedia?.({ audio: true })
                        .catch(() => {});
                    } else if (permissionStep === 4) {
                      // Camera real media trigger
                      navigator.mediaDevices
                        ?.getUserMedia?.({ video: true })
                        .catch(() => {});
                    }

                    if (permissionStep < 4) {
                      setPermissionStep((prev) => prev + 1);
                    } else {
                      setMobileRoute("explore");
                      triggerGlobalError(
                        "All permissions successfully logged, welcome inside EbadulChat Fun!",
                      );
                    }
                  } else {
                    alert(
                      "Highly recommended to grant this permission to utilize all unique room features!",
                    );
                  }
                }}
                className="w-full py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all duration-100 flex items-center justify-center gap-1.5 shadow-md shadow-yellow-500/10"
              >
                🔒 Grant Access Securely
              </button>

              <div className="text-[8px] text-center text-slate-500 max-w-[240px] mx-auto">
                Securely mediated by client system container sandbox rules.
              </div>
            </div>
          </div>
        )}

        {/* ROUTE: EXPLORE PAGE HOME */}
        {mobileRoute === "explore" && user && (
          <div className="flex-1 overflow-y-auto pb-12 flex flex-col">
            {/* Header profile greeting */}
            <div className="p-4 bg-gradient-to-b from-slate-950 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setExploreTab("all")}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition ${
                    exploreTab === "all"
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md border border-purple-400/35"
                      : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:bg-slate-850 hover:text-white"
                  }`}
                >
                  🌐 Rooms
                </button>
                <button
                  onClick={() => setExploreTab("main")}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1 ${
                    exploreTab === "main"
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md border border-purple-400/35"
                      : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:bg-slate-850 hover:text-white"
                  }`}
                >
                  🏠 Main
                </button>
              </div>

              {/* Wallet and Search */}
              <div className="flex items-center gap-1.5">
                <div
                  onClick={() => setMobileRoute("wallet")}
                  className="flex items-center gap-1 bg-slate-950/60 px-2.5 py-1 rounded-full cursor-pointer hover:bg-slate-900"
                >
                  <Coins className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-[10px] font-mono font-bold text-yellow-400">
                    {(user.email === "ebadulhoque1234567890@gmail.com" || user.isGlobalAdmin) ? "∞" : user.coins}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setSearchQueryId("");
                    setSearchResultRoom(null);
                    setSearchResultProfile(null);
                    setSearchError("");
                    setShowGlobalSearchModal(true);
                  }}
                  className="p-1.5 bg-slate-950/60 hover:bg-slate-900 border border-slate-850 text-white rounded-full transition flex items-center justify-center cursor-pointer"
                  title="Search Room or Profile"
                >
                  <Search className="w-4 h-4 text-purple-400" />
                </button>
              </div>
            </div>

            {exploreTab === "main" ? (
              /* MAIN TAB VIEW: OWN ROOM + LAST 10 VISIT ROOM HISTORY */
              <div className="px-4 flex flex-col gap-5 text-left">
                {/* Own Room Area */}
                <div>
                  <h3 className="text-[10px] font-black text-rose-300 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
                    My Room Area
                  </h3>
                  {(() => {
                    const myOwnedRoom = roomsList.find(
                      (r) => r.ownerId === user.id,
                    );
                    if (myOwnedRoom) {
                      return (
                        <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border-2 border-purple-500/30 rounded-2xl p-3 shadow-xl relative overflow-hidden text-left">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-purple-900/50 flex-shrink-0 flex items-center justify-center text-xl border border-purple-500/25 relative overflow-hidden">
                              <img
                                src={
                                  myOwnedRoom.coverUrl || myOwnedRoom.backgroundUrl
                                }
                                alt="Room"
                                className="w-full h-full object-cover absolute inset-0"
                                referrerPolicy="no-referrer"
                              />
                              <span className="relative z-10 drop-shadow-md">
                                👑
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="bg-yellow-500 text-slate-950 font-black text-[8px] px-1.5 py-0.25 rounded-md">
                                  LVL {myOwnedRoom.level || 5}
                                </span>
                                <span className="text-[9px] text-purple-300 font-mono font-bold tracking-wide">
                                  ID: {myOwnedRoom.id}
                                </span>
                              </div>
                              <h4 className="text-xs font-black text-white truncate max-w-[180px] mt-1">
                                {myOwnedRoom.name}
                              </h4>
                              <span className="text-[8.5px] text-zinc-400 font-bold uppercase tracking-wider block">
                                Owner Room
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800/80">
                            <div className="flex flex-col">
                              <span className="text-[8px] text-gray-400 uppercase tracking-wider font-bold">
                                Room Members
                              </span>
                              <span className="text-[10px] font-bold text-indigo-400">
                                {(myOwnedRoom.members || [user.id]).length}{" "}
                                registered
                              </span>
                            </div>
                            <button
                              onClick={() => handleJoinRoom(myOwnedRoom.id)}
                              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-450 text-white font-black text-[10px] px-3 py-1.5 rounded-xl shadow-lg transition-all"
                            >
                              Enter Room
                            </button>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="bg-slate-900/60 border border-dashed border-slate-800/80 rounded-2xl p-4 text-center flex flex-col items-center justify-center gap-1.5">
                          <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 text-sm">
                            🎙️
                          </div>
                          <div className="max-w-[220px]">
                            <h4 className="text-xs font-black text-white leading-tight">
                              Host Your Own Voice Space
                            </h4>
                            <p className="text-[8.5px] text-gray-500 mt-0.5">
                              Unlock custom level perks, run PK battle segments, and
                              hold virtual microphones.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setNewMobRoomName(`${user.displayName}'s Lounge`);
                              setNewMobRoomCategory("public");
                              setNewMobRoomLayout(8);
                              setShowCreateRoomModal(true);
                            }}
                            className="mt-1 py-1 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-550 text-white text-[10px] font-black rounded-lg uppercase tracking-wider shadow-md"
                          >
                            + Create Room
                          </button>
                        </div>
                      );
                    }
                  })()}
                </div>

                {/* Recent Rooms list */}
                <div className="mt-1 pb-4">
                  <h3 className="text-[10px] font-black text-amber-300 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                    Recent Visited Rooms
                  </h3>
                  {recentRooms.length === 0 ? (
                    <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-6 text-center text-slate-500 text-[10px] font-bold">
                      No recently visited rooms yet.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {recentRooms.map((r) => (
                        <div
                          key={r.id}
                          onClick={() => handleJoinRoom(r.id)}
                          className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-850 hover:border-purple-500/25 rounded-xl cursor-pointer transition-all active:scale-98"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-purple-900/40 flex-shrink-0 relative overflow-hidden border border-slate-800">
                              <img
                                src={r.coverUrl || r.backgroundUrl || "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=150&q=80"}
                                alt="Room"
                                className="w-full h-full object-cover absolute inset-0"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-black text-white truncate">
                                {r.name}
                              </h4>
                              <span className="text-[8.5px] text-purple-400 font-mono font-bold">
                                ID: {r.id}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJoinRoom(r.id);
                            }}
                            className="bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white font-extrabold text-[9px] px-2.5 py-1 rounded-lg uppercase tracking-wider transition-all border border-purple-500/20"
                          >
                            Re-join
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ALL DISCOVER VIEW: Banners, Services and Discover Feed */
              <>
                {/* Banner Sliding */}
                <div className="px-4 mb-4">
              <div className="h-24 rounded-2xl bg-gradient-to-r from-purple-800 via-rose-800 to-amber-700 p-3 shadow-lg flex flex-col justify-between relative overflow-hidden">
                <span className="text-[10px] font-bold text-yellow-300 tracking-widest uppercase">
                  GRAND PK CHAMPIONSHIP
                </span>
                <span className="text-sm font-black text-white leading-tight">
                  Bangladesh vs Riyadh Club Battle Lounge
                </span>

                <span className="absolute bottom-2 right-2 text-3xl animate-bounce">
                  🏆
                </span>
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
              </div>
            </div>

            {/* Horizontal Services Grid */}
            <div className="grid grid-cols-4 gap-2 px-4 mb-4 text-center">
              <div
                onClick={() => setMobileRoute("wallet")}
                className="flex flex-col items-center p-2 bg-slate-950/45 rounded-xl cursor-pointer hover:bg-slate-950"
              >
                <span className="text-lg">💎</span>
                <span className="text-[9px] text-gray-300 font-bold mt-1">
                  Wallet
                </span>
              </div>
              <div
                onClick={() => setMobileRoute("spin")}
                className="flex flex-col items-center p-2 bg-slate-950/45 rounded-xl cursor-pointer hover:bg-slate-950"
              >
                <span className="text-lg">🎡</span>
                <span className="text-[9px] text-gray-300 font-bold mt-1">
                  Lucky
                </span>
              </div>
              <div
                onClick={() => setMobileRoute("family")}
                className="flex flex-col items-center p-2 bg-slate-950/45 rounded-xl cursor-pointer hover:bg-slate-950"
              >
                <span className="text-lg">🦁</span>
                <span className="text-[9px] text-gray-300 font-bold mt-1">
                  Family
                </span>
              </div>
              <div
                onClick={() => setMobileRoute("explore")}
                className="flex flex-col items-center p-2 bg-slate-950/45 rounded-xl cursor-pointer bg-purple-900/20 border border-purple-500/20"
              >
                <span className="text-lg">🔊</span>
                <span className="text-[9px] text-yellow-400 font-bold mt-1">
                  Voice
                </span>
              </div>
            </div>

            {/* SECTION 1: MY ROOM AREA */}
            <div className="px-4 mb-5">
              <h3 className="text-[10px] font-black text-rose-300 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
                Section 1: My Room Area
              </h3>
              {(() => {
                const myOwnedRoom = roomsList.find(
                  (r) => r.ownerId === user.id,
                );
                if (myOwnedRoom) {
                  return (
                    <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border-2 border-purple-500/30 rounded-2xl p-3 shadow-xl relative overflow-hidden text-left">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-purple-900/50 flex-shrink-0 flex items-center justify-center text-xl border border-purple-500/25 relative overflow-hidden">
                          <img
                            src={
                              myOwnedRoom.coverUrl || myOwnedRoom.backgroundUrl
                            }
                            alt="Room"
                            className="w-full h-full object-cover absolute inset-0"
                            referrerPolicy="no-referrer"
                          />
                          <span className="relative z-10 drop-shadow-md">
                            👑
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-yellow-500 text-slate-950 font-black text-[8px] px-1.5 py-0.25 rounded-md">
                              LVL {myOwnedRoom.level || 5}
                            </span>
                            <span className="text-[9px] text-purple-300 font-mono font-bold tracking-wide">
                              ID: {myOwnedRoom.id}
                            </span>
                          </div>
                          <h4 className="text-xs font-black text-white truncate max-w-[180px] mt-1">
                            {myOwnedRoom.name}
                          </h4>
                          <span className="text-[8.5px] text-zinc-400 font-bold uppercase tracking-wider block">
                            Owner Room
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800/80">
                        <div className="flex flex-col">
                          <span className="text-[8px] text-gray-400 uppercase tracking-wider font-bold">
                            Room Members
                          </span>
                          <span className="text-[10px] font-bold text-indigo-400">
                            {(myOwnedRoom.members || [user.id]).length}{" "}
                            registered
                          </span>
                        </div>
                        <button
                          onClick={() => handleJoinRoom(myOwnedRoom.id)}
                          className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-450 text-white font-black text-[10px] px-3 py-1.5 rounded-xl shadow-lg transition-all"
                        >
                          Enter Room
                        </button>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-slate-900/60 border border-dashed border-slate-800/80 rounded-2xl p-4 text-center flex flex-col items-center justify-center gap-1.5">
                      <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 text-sm">
                        🎙️
                      </div>
                      <div className="max-w-[220px]">
                        <h4 className="text-xs font-black text-white leading-tight">
                          Host Your Own Voice Space
                        </h4>
                        <p className="text-[8.5px] text-gray-500 mt-0.5">
                          Unlock custom level perks, run PK battle segments, and
                          hold virtual microphones.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setNewMobRoomName(`${user.displayName}'s Lounge`);
                          setNewMobRoomCategory("public");
                          setNewMobRoomLayout(8);
                          setShowCreateRoomModal(true);
                        }}
                        className="mt-1 py-1 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-550 text-white text-[10px] font-black rounded-lg uppercase tracking-wider shadow-md"
                      >
                        + Create Room
                      </button>
                    </div>
                  );
                }
              })()}
            </div>

            {/* SECTION 2: DISCOVER ROOMS */}
            <div className="px-4 mb-4">
              <h3 className="text-[10px] font-black text-amber-300 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                Section 2: Discover Rooms
              </h3>

              {/* Horizontally scrollable slick navigation tabs bar for the requested 8 items */}
              <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none snap-x">
                {[
                  { id: "trending", label: "🔥 Trending" },
                  { id: "popular", label: "💎 Popular" },
                  { id: "new", label: "🆕 New" },
                  { id: "recommended", label: "👍 Curated" },
                  { id: "family", label: "🦁 Family" },
                  { id: "music", label: "🎵 Music" },
                  { id: "gaming", label: "🎮 Gaming" },
                  { id: "couple", label: "💖 Couple" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setDiscoverTab(tab.id)}
                    className={`flex-shrink-0 snap-align-start px-2.5 py-1 rounded-full text-[9px] font-bold uppercase transition-all border ${discoverTab === tab.id ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400/35" : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-white"}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Discovery Feed Column of Room List Cards */}
              <div className="flex flex-col gap-2.5 mt-2.5">
                {(() => {
                  const filtered = getFilteredRooms();
                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-6 text-slate-500 text-[10px] font-bold">
                        No active sound rooms found in this category.
                      </div>
                    );
                  }

                  return filtered.map((r) => {
                    const isVipOfficial = r.isOfficial || r.ownerId === "ebadul" || r.ownerName === "Ebadul" || r.ownerName?.toLowerCase().includes("ebadul") || r.ownerId === "ebadulhoque1234567890@gmail.com";
                    return (
                      <div
                        key={r.id}
                        onClick={() => handleJoinRoom(r.id)}
                        className={`relative rounded-xl overflow-hidden cursor-pointer shadow-lg transition-all hover:scale-[1.015] flex flex-col text-left ${
                          isVipOfficial
                            ? "bg-gradient-to-r from-slate-950 via-yellow-950/30 to-slate-950 border-2 border-yellow-500/85 shadow-[0_0_18px_rgba(234,179,8,0.35)]"
                            : "bg-slate-950 border border-slate-800 hover:border-purple-500/20"
                        }`}
                      >
                        {isVipOfficial && (
                          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 animate-[pulse_2s_infinite]"></div>
                        )}
                        <div className="h-16 w-full relative">
                          <img
                            src={r.coverUrl || r.backgroundUrl}
                            alt={r.name}
                            className="w-full h-full object-cover brightness-[0.70]"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-white/5">
                            <span className="w-1 h-1 bg-rose-500 rounded-full"></span>
                            <span className="text-[8px] font-mono font-bold text-rose-400">
                              {r.onlineUsersCount || 0} online
                            </span>
                          </div>
                          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1">
                            {getRoomLevelBadgeAndLogo(r.level || 1)}
                            <span className="bg-purple-900/80 text-purple-200 font-bold text-[7px] px-1 rounded-sm uppercase tracking-wide">
                              {r.category}
                            </span>
                            {isVipOfficial && (
                              <span className="bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 font-black text-[7px] px-1.5 py-0.2 rounded-sm uppercase tracking-wider animate-pulse shadow">
                                👑 VIP OFFICIAL
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-2 flex flex-col gap-1">
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="min-w-0">
                              <h4 className="text-[11px] font-black text-white truncate leading-tight flex items-center gap-1">
                                <span className="truncate max-w-[120px]">{r.name}</span>
                                {getRoomLevelBadgeAndLogo(r.level || 1)}
                                {r.isOfficial && (
                                  <span className="text-yellow-400 font-black text-[9px] select-none" title="Official Verified Room">👑</span>
                                )}
                              </h4>
                              <p className="text-[8.5px] text-gray-500">
                                ID:{" "}
                                <span className="font-mono text-purple-400 font-bold">
                                  {r.id}
                                </span>{" "}
                                • Owner:{" "}
                                <span className="text-gray-400 font-semibold">
                                  {r.ownerName}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-800/60 text-[8.5px]">
                            <span className="text-gray-400">
                              Members{" "}
                              <strong className="text-indigo-400">
                                {
                                  (r.members || ["ebadul", "u1", "u2", "u3"])
                                    .length
                                }
                              </strong>
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJoinRoom(r.id);
                              }}
                              className="bg-purple-600 hover:bg-purple-500 text-white font-black text-[9px] px-3 py-1 rounded-md transition-all uppercase tracking-wide"
                            >
                              Join Room
                            </button>
                          </div>
                        </div>
                    </div>
                  );
                });
                })()}
              </div>
            </div>
            </>
            )}
          </div>
        )}

        {/* ROUTE: ACTIVE AUDIO VOICE CHAT ROOM */}
        {mobileRoute === "room" && activeRoom && user && (
          <div
            className={`flex-1 flex flex-col justify-between relative bg-cover bg-center overflow-hidden h-full pb-[64px]`}
            style={{
              backgroundImage: `linear-gradient(to bottom, rgba(5,5,15,0.75), rgba(9,9,18,0.92)), url('${activeRoom.backgroundUrl}')`,
            }}
          >
            {/* Room Header Info */}
            <div className="px-2 py-1.5 bg-slate-950/55 backdrop-blur-md flex items-center justify-between border-b border-white/5 sticky top-0 z-40 animate-slide-down">
              <div className="flex items-center gap-1.5">
                {/* Minimize (Back) Button */}
                <button
                  onClick={handleBackNavigation}
                  className="p-1.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                  title="Minimize Room"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {/* Leave Room Button */}
                <button
                  onClick={handleLeaveRoom}
                  className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors"
                  title="Leave Room"
                >
                  <LogOut className="w-4 h-4" />
                </button>
                <div
                  className="min-w-0 cursor-pointer group hover:bg-white/5 p-1 rounded-md transition-colors"
                  id="btn-open-room-details-header"
                  onClick={async () => {
                    setShowRoomDetails(true);
                    // Make sure we have latest room info
                    await syncRoomDynamics();
                  }}
                >
                  <h3 className="text-xs font-black text-white truncate max-w-[170px] group-hover:text-amber-400 transition-colors flex items-center gap-1">
                    <span className="truncate max-w-[100px]">{activeRoom.name}</span>
                    {getRoomLevelBadgeAndLogo(activeRoom.level || 1)}
                    {activeRoom.isOfficial && (
                      <span className="text-[7.5px] bg-amber-500 text-slate-950 border border-amber-400 px-1 rounded-sm py-0.2 font-black uppercase tracking-wider animate-pulse" title="Official Verified Room">
                        ⭐ Official
                      </span>
                    )}
                    {activeRoom.isRoomLocked && (
                      <span className="text-[7px] bg-rose-500/25 text-rose-400 border border-rose-500/30 px-1 rounded-sm py-0.2 font-black uppercase tracking-wider animate-pulse">
                        Locked
                      </span>
                    )}
                    <span className="text-[7.5px] bg-purple-500/30 text-purple-200 border border-purple-500/20 px-1 rounded-sm py-0.2 scale-90">
                      Info ℹ️
                    </span>
                  </h3>
                  <p className="text-[8px] text-purple-300 truncate tracking-wide uppercase">
                    Owner: {activeRoom.ownerName}
                  </p>
                </div>

                {/* ROOM FOLLOW BUTTON */}
                {(() => {
                  const isFollowingRoom = activeRoom.roomFollowers?.includes(user.id);
                  return (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const res = await fetch(`/api/rooms/${activeRoom.id}/follow`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ userId: user.id })
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setActiveRoom(prev => prev ? {
                              ...prev,
                              roomFollowers: data.roomFollowers,
                              followersCount: data.followersCount
                            } : null);
                            triggerGlobalError(data.isFollowing ? "You followed this room! ❤️" : "Unfollowed this room.");
                          }
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className={`text-[8.5px] font-black uppercase px-2.5 py-1 rounded-full border flex items-center gap-1 transition-all active:scale-95 cursor-pointer ml-1 shrink-0 ${
                        isFollowingRoom 
                          ? "bg-rose-500/15 border-rose-500/35 text-rose-400" 
                          : "bg-rose-500 hover:bg-rose-600 text-white border-rose-450 animate-pulse shadow-md"
                      }`}
                    >
                      {isFollowingRoom ? "❤️ Following" : "❤️ Follow"}
                    </button>
                  );
                })()}
              </div>

              <div className="flex items-center gap-1.5 text-[11px]">
                {(() => {
                  const isHost =
                    activeRoom.ownerId === user.id ||
                    activeRoom.admins?.includes(user.id) ||
                    activeRoom.moderators?.includes(user.id);
                  if (!isHost) return null;
                  return (
                    <button
                      onClick={async () => {
                        const updatedAction = activeRoom.isRoomLocked
                          ? "unlock_room"
                          : "lock_room";
                        await handleRoomModeration(updatedAction, "");
                      }}
                      className={`font-extrabold px-2 py-1 rounded-full text-[8.5px] border cursor-pointer transition-all ${
                        activeRoom.isRoomLocked
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                          : "bg-teal-500/10 border-teal-500/30 text-teal-400 hover:bg-teal-500/20"
                      }`}
                      title={
                        activeRoom.isRoomLocked ? "Unlock Room" : "Lock Room"
                      }
                      id="room-lock-toggle-btn"
                    >
                      {activeRoom.isRoomLocked ? "🔓 Unlock" : "🔒 Lock"}
                    </button>
                  );
                })()}

                <button
                  onClick={handleTogglePK}
                  className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-extrabold px-2.5 py-1 rounded-full text-[9px] shadow-sm flex items-center gap-1 animate-pulse"
                >
                  ⚔️ PK Battle
                </button>
              </div>
            </div>

            {/* Announcement scrolling marquee */}
            <div className="bg-yellow-400/15 border-b border-yellow-500/10 py-1 px-2.5 text-[8.5px] text-yellow-300 font-medium overflow-hidden whitespace-nowrap text-ellipsis flex items-center gap-1.5 shrink-0">
              <span className="bg-yellow-500 text-slate-950 px-1 py-0.2 rounded-xs font-bold font-mono scale-90">
                ANNOUNCE
              </span>
              <span className="animate-pulse">{activeRoom.announcement}</span>
            </div>

            {/* Room Content Middle pane */}
            <div className="flex-grow flex flex-col gap-1 px-2 py-0.5 overflow-hidden min-h-0">
              {/* Conditional 1v1 PK battle details */}
              {activePk && (
                <div className="animate-scale-up">
                  <PKBattleView
                    battle={activePk}
                    currentUserId={user.id}
                    onSendQuickGift={(targetUserId, giftId) => {
                      setSelectedReceiverId(targetUserId);
                      handleSendGift(giftId, 1);
                    }}
                    onOpenGiftStore={(targetUserId) => {
                      setSelectedReceiverId(targetUserId);
                      setShowGiftStore(true);
                    }}
                    isRoomOwner={activeRoom.ownerId === user.id}
                    onEndEarly={async () => {
                      try {
                        const res = await fetch("/api/pk/battle/end-early", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            roomId: activeRoom.id,
                            userId: user.id
                          })
                        });
                        if (res.ok) {
                          const payload = await res.json();
                          setActivePk(payload.battle);
                          triggerGlobalError("PK Battle ended early! Winner calculated.");
                        } else {
                          const err = await res.json();
                          triggerGlobalError(err.error || "Failed to end battle.");
                        }
                      } catch (err: any) {
                        triggerGlobalError(err.message || "Failed to end battle.");
                      }
                    }}
                  />
                </div>
              )}



              {/* Voice Seats Grid Layout */}
              <div className="bg-slate-950/45 p-1.5 rounded-xl border border-white/5 shrink-0">
                <div className="text-[9px] text-gray-450 font-extrabold tracking-wider mb-1 uppercase flex items-center justify-between select-none">
                  <span>🎙️ Voice Seats ({activeRoom.seats.filter((s) => s.userId).length}/{activeRoom.seatLayout})</span>
                  <span className="text-amber-400 font-bold animate-pulse">On Mic</span>
                </div>

                <div className={`grid gap-x-1 gap-y-1.5 ${
                  activeRoom.seatLayout <= 8 ? "grid-cols-4" :
                  activeRoom.seatLayout === 10 ? "grid-cols-5" :
                  activeRoom.seatLayout === 12 ? "grid-cols-4" :
                  activeRoom.seatLayout === 16 ? "grid-cols-4" :
                  activeRoom.seatLayout === 20 ? "grid-cols-5" :
                  activeRoom.seatLayout === 24 ? "grid-cols-6" :
                  activeRoom.seatLayout === 30 ? "grid-cols-6" :
                  activeRoom.seatLayout === 35 ? "grid-cols-7" : "grid-cols-4"
                }`}>
                  {activeRoom.seats.map((seat) => {
                    const isOccupied = !!seat.userId;
                    const avatar = seat.userProfile?.avatarUrl;
                    const isMicLocked = seat.isLocked;
                    const isMuted = seat.isMutedByOwner || seat.isMutedByUser;

                    const isRoomOwner =
                      isOccupied && seat.userId === activeRoom.ownerId;
                    const isRoomAdmin =
                      isOccupied && activeRoom.admins?.includes(seat.userId!);
                    const isRoomMod =
                      isOccupied &&
                      activeRoom.moderators?.includes(seat.userId!);

                    // Determine border & halo glow classes based on role & active voice stream
                    let boundaryClass = "";
                    if (isOccupied) {
                      if (isRoomOwner) {
                        boundaryClass = seat.streamActive
                          ? "border-2 border-amber-400 bg-slate-900 shadow-[0_0_12px_rgba(245,158,11,0.7)] animate-pulse scale-105"
                          : "border-2 border-amber-500 bg-amber-950/20 shadow-[0_0_6px_rgba(245,158,11,0.4)]";
                      } else if (isRoomAdmin) {
                        boundaryClass = seat.streamActive
                          ? "border-2 border-violet-400 bg-slate-900 shadow-[0_0_10px_rgba(167,139,250,0.6)] animate-pulse scale-102"
                          : "border-2 border-violet-500/80 bg-violet-950/20";
                      } else if (isRoomMod) {
                        boundaryClass = seat.streamActive
                          ? "border-2 border-teal-450 bg-slate-900 shadow-[0_0_8px_rgba(45,212,191,0.5)] animate-pulse"
                          : "border-2 border-teal-500/80 bg-teal-950/20";
                      } else {
                        boundaryClass = seat.streamActive
                          ? "border-2 border-emerald-400 animate-pulse bg-slate-900 shadow-[0_0_8px_rgba(52,211,153,0.4)]"
                          : "border-2 border-slate-700 bg-slate-950";
                      }
                    } else {
                      boundaryClass = isMicLocked
                        ? "bg-red-950/50 border border-red-500/20"
                        : "bg-slate-950 border border-dashed border-gray-650 hover:border-gray-500 hover:scale-102";
                    }

                    return (
                      <div
                        key={seat.index}
                        onClick={() => handleSeatClick(seat)}
                        id={
                          seat.userId
                            ? `seat-card-${seat.userId}`
                            : `seat-empty-${seat.index}`
                        }
                        className="flex flex-col items-center cursor-pointer relative group transition-all"
                      >
                        {/* Circle Boundary */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center relative shadow-md transition-all ${boundaryClass} ${(isOccupied && seat.userProfile?.vipLevelNumeric && seat.userProfile?.vipLevelNumeric > 0)
                            ? (seat.userProfile?.profileFrameUrl || (seat.userProfile?.vipLevelNumeric >= 10 
                                ? "ring-2 ring-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.8)]" 
                                : seat.userProfile?.vipLevelNumeric >= 7 
                                  ? "ring-2 ring-purple-500 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.7)]" 
                                  : seat.userProfile?.vipLevelNumeric >= 4 
                                    ? "ring-2 ring-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" 
                                    : "ring-2 ring-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.5)]"))
                            : ""} ${
                            isOccupied &&
                            avatarEffects[seat.userId!] &&
                            Date.now() < avatarEffects[seat.userId!].expiry
                              ? "animate-avatar-effect ring-2 ring-purple-500/85 ring-offset-1 ring-offset-slate-950 scale-102"
                              : ""
                          }`}
                        >
                          {/* Crown or Status visual overlays above circle */}
                          {isOccupied && (
                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none drop-shadow-md flex items-center gap-0.5 whitespace-nowrap">
                              {seat.userProfile?.vipLevelNumeric && seat.userProfile?.vipLevelNumeric > 0 && (
                                <span className="text-[10px] filter drop-shadow animate-pulse block">
                                  {seat.userProfile.vipLevelNumeric >= 10 ? "👑" : seat.userProfile.vipLevelNumeric >= 7 ? "✨" : "⭐"}
                                </span>
                              )}
                              {isRoomOwner && (
                                <span className="text-[12px] filter drop-shadow font-bold animate-bounce block">
                                  👑
                                </span>
                              )}
                              {isRoomAdmin && !isRoomOwner && (
                                <span className="text-[9px] block">🛡️</span>
                              )}
                              {isRoomMod && !isRoomAdmin && !isRoomOwner && (
                                <span className="text-[9px] block">🔰</span>
                              )}
                            </div>
                          )}

                          {/* Green volume aura log if streaming */}
                          {isOccupied && seat.streamActive && (
                            <span className="absolute inset-0 rounded-full border-2 border-emerald-400/50 animate-ping"></span>
                          )}

                          {isOccupied ? (
                            <div className="relative w-full h-full rounded-full flex items-center justify-center">
                              <VipAvatarFrame
                                avatarUrl={avatar!}
                                level={seat.userProfile?.vipLevelNumeric}
                                sizeClass="w-full h-full"
                                customFrameId={seat.userProfile?.activeFrameId}
                              />
                              {/* Avatar Emoji cover effect */}
                              {avatarEffects[seat.userId!] &&
                                Date.now() <
                                  avatarEffects[seat.userId!].expiry && (
                                  <div className="absolute inset-0 rounded-full select-none z-25 pointer-events-none">
                                    {renderAvatarEffectOverlay(
                                      avatarEffects[seat.userId!].emoji,
                                    )}
                                  </div>
                                )}
                            </div>
                          ) : isMicLocked ? (
                            <Lock className="w-4 h-4 text-rose-500" />
                          ) : (
                            <Plus className="w-4 h-4 text-gray-500" />
                          )}

                          {/* Floating sticker overlay balloon above active seat */}
                          {isOccupied &&
                            avatarEffects[seat.userId!] &&
                            Date.now() < avatarEffects[seat.userId!].expiry && (
                              <div className="absolute -top-6 bg-slate-900 border border-purple-400 text-sm px-1.5 py-0.5 rounded-full shadow-2xl animate-bounce z-50 select-none">
                                {avatarEffects[seat.userId!].emoji}
                              </div>
                            )}

                          {/* Index Badge */}
                          <span className="absolute -bottom-1 -right-1 bg-slate-900 border border-slate-800 text-slate-100 text-[8px] font-bold font-mono px-1 rounded-full">
                            {seat.index}
                          </span>

                          {/* Mic status logo */}
                          {isOccupied && seat.isMutedByOwner && (
                            <span
                              className="absolute -top-1 -right-1 bg-red-650 text-white p-0.5 rounded-full border border-red-500 animate-pulse shadow-sm"
                              title="Muted by Host/Admin font-mono"
                            >
                              <MicOff className="w-2.5 h-2.5 text-white" />
                            </span>
                          )}
                          {isOccupied &&
                            !seat.isMutedByOwner &&
                            seat.isMutedByUser && (
                              <span
                                className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 p-0.5 rounded-full border border-yellow-300 shadow-sm"
                                title="Muted by User"
                              >
                                <MicOff className="w-2.5 h-2.5 text-slate-950" />
                              </span>
                            )}
                        </div>

                        {/* Nick name label and Roles badges */}
                        <div className="flex flex-col items-center mt-0.5 w-full overflow-hidden">
                          <span
                            className={`text-[8px] truncate w-full text-center max-w-[58px] font-bold leading-tight ${
                              (isOccupied && (
                                (seat.userProfile?.vipLevelNumeric && seat.userProfile.vipLevelNumeric > 0) || 
                                (seat.userProfile?.vipLevel && seat.userProfile.vipLevel !== VipLevel.NONE)
                              ))
                                ? getVipNameStyle(seat.userProfile?.vipLevelNumeric, seat.userProfile?.vipLevel)
                                : isRoomOwner
                                  ? "text-amber-300 font-black"
                                  : isRoomAdmin
                                    ? "text-violet-300 font-extrabold"
                                    : "text-gray-405 font-semibold"
                            }`}
                          >
                            {isOccupied
                              ? seat.userProfile?.displayName
                              : "Empty"}
                          </span>

                          {/* Role Badges */}
                          {isOccupied && (
                            <div className="flex flex-wrap justify-center gap-0.5 mt-0.5 z-10">
                              {isRoomOwner && (
                                <span className="text-[6.5px] font-extrabold uppercase tracking-widest px-1 py-0.25 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-sm">
                                  Owner
                                </span>
                              )}
                              {isRoomAdmin && !isRoomOwner && (
                                <span className="text-[6.5px] font-extrabold uppercase tracking-widest px-1 py-0.25 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-sm">
                                  Admin
                                </span>
                              )}
                              {isRoomMod && !isRoomAdmin && !isRoomOwner && (
                                <span className="text-[6.5px] font-extrabold uppercase tracking-widest px-1 py-0.25 bg-teal-500/10 border border-teal-500/30 text-teal-350 rounded-sm">
                                  Mod
                                </span>
                              )}
                              {isOccupied && activeRoom.members?.includes(seat.userId!) && (
                                <span className="text-[5px] font-black uppercase tracking-tight px-1 py-0.25 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 rounded-xs shadow-sm border border-teal-300">
                                  ROOM JOINED
                                </span>
                              )}
                            </div>
                          )}

                          {isOccupied && seat.isMutedByOwner && (
                            <span className="text-[7px] text-rose-450 font-extrabold uppercase tracking-wide leading-none mt-0.5 animate-pulse border border-rose-500/20 bg-rose-500/10 px-1 py-0.25 rounded-xs">
                              Admin Mute
                            </span>
                          )}
                          {isOccupied &&
                            !seat.isMutedByOwner &&
                            seat.isMutedByUser &&
                            !isRoomOwner &&
                            !isRoomAdmin &&
                            !isRoomMod && (
                              <span className="text-[7.5px] text-amber-500 font-bold uppercase tracking-wider leading-none mt-0.5 border border-amber-500/20 bg-amber-500/5 px-1 py-0.25 rounded-sm">
                                Mic Off
                              </span>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Room Homies Row (Lined up, max 20 slots) */}
              <div className="bg-slate-950/40 p-2 rounded-xl border border-white/5 flex flex-col gap-1.5 shrink-0 select-none">
                <div className="flex items-center justify-between text-[8px] font-black uppercase text-pink-400 tracking-wider px-0.5">
                  <div className="flex items-center gap-1">
                    <span>🤝 Room Homies Line</span>
                    <span className="bg-pink-500/20 text-pink-300 px-1 py-0.2 rounded font-mono text-[7px]">
                      {userRelationships?.length || 0}/20
                    </span>
                  </div>
                  <span className="text-[7.5px] text-gray-500 normal-case">Scroll horizontally →</span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  {Array.from({ length: 20 }).map((_, idx) => {
                    const rel = userRelationships?.[idx];
                    if (rel) {
                      const partnerName = rel.user1Id === user?.id ? rel.user2Name : rel.user1Name;
                      const partnerAvatar = rel.user1Id === user?.id ? rel.user2Avatar : rel.user1Avatar;
                      const partnerId = rel.user1Id === user?.id ? rel.user2Id : rel.user1Id;
                      const level = rel.level || 1;
                      const type = rel.type || "homies";
                      const typeIcon = type === "couple" || type === "soulmate" ? "❤️" : type === "homies" ? "🤝" : "💙";

                      return (
                        <div
                          key={rel.id}
                          onClick={() => {
                            const foundProfile = {
                              id: partnerId,
                              displayName: partnerName,
                              avatarUrl: partnerAvatar,
                              vipLevel: "none",
                              level: 1,
                              diamonds: 100
                            };
                            setUserProfileView(foundProfile as any);
                            setAutoOpenRelationship(true);
                          }}
                          className="flex flex-col items-center gap-1 shrink-0 bg-slate-900/60 hover:bg-slate-900/95 border border-white/5 hover:border-pink-500/30 p-1.5 rounded-lg w-[58px] transition-all cursor-pointer relative"
                        >
                          <div className="relative w-7 h-7 rounded-full border border-pink-500/25">
                            <img
                              src={partnerAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                              className="w-full h-full rounded-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <span className="absolute -bottom-1 -right-1 bg-pink-500 text-white text-[6px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-slate-950">
                              {typeIcon}
                            </span>
                          </div>
                          <span className="text-[7.5px] font-extrabold truncate w-full text-center text-gray-200">
                            {partnerName}
                          </span>
                          <span className="text-[6.5px] font-mono text-pink-400 font-bold scale-90">
                            LVL {level}
                          </span>
                        </div>
                      );
                    } else {
                      return (
                        <div
                          key={`empty-${idx}`}
                          onClick={() => {
                            triggerGlobalError("Propose to any online friend in room to add them to your Homies line! 🤝");
                          }}
                          className="flex flex-col items-center justify-center gap-1 shrink-0 bg-slate-950/40 border border-dashed border-white/5 hover:border-white/20 p-1.5 rounded-lg w-[58px] h-[64px] transition-all cursor-pointer group"
                        >
                          <span className="text-[10px] text-gray-500 group-hover:text-gray-400 font-bold">
                            #{idx + 1}
                          </span>
                          <span className="text-[12px] text-gray-700 group-hover:text-gray-500">
                            ➕
                          </span>
                          <span className="text-[6.5px] text-gray-500 group-hover:text-gray-400">
                            Seat
                          </span>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>

              {/* Chat room message log list */}
              <div className="flex-1 min-h-0 bg-slate-950/25 rounded-xl border border-white/5 p-1.5 flex flex-col justify-end overflow-hidden">
                <div className="overflow-y-auto flex-1 flex flex-col gap-1.5 pr-1">
                  {roomMessages.map((msg) => {
                    const isSystem = msg.type === MessageType.SYSTEM;
                    const isGift = msg.type === MessageType.GIFT_ALERT;
                    const isSticker = msg.type === MessageType.STICKER;
                    const isImage = msg.type === MessageType.IMAGE;

                    const isMentioned = !!(user && !isSystem && !isGift && (
                      msg.content.toLowerCase().includes(`@${(user.displayName || "").toLowerCase()}`) ||
                      msg.content.toLowerCase().includes(`@${(user.username || "").toLowerCase()}`) ||
                      msg.content.toLowerCase().includes(`@${user.id.toLowerCase()}`)
                    ));

                    return (
                      <div
                        key={msg.id}
                        onClick={async (e) => {
                          if (isSystem || isGift) return;
                          if ((e.target as HTMLElement).closest(".msg-delete-btn")) return;
                          try {
                            const res = await fetch(
                              `/api/users/${msg.senderId}?requestingUserId=${user?.id || ""}`,
                            );
                            if (res.ok) {
                              const data = await res.json();
                              setUserProfileView(data);
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className={`text-[10px] p-1.5 rounded-lg max-w-[95%] border transition-all duration-300 relative ${
                          !isSystem && !isGift ? "cursor-pointer hover:bg-white/[0.03]" : ""
                        } ${
                            isSystem
                              ? "bg-purple-950/30 border-purple-500/20 text-purple-200"
                              : isGift
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-300 font-semibold"
                                : isMentioned
                                  ? "bg-gradient-to-r from-amber-500/20 via-purple-950/20 to-slate-900 border-amber-400 ring-1 ring-amber-400/30 text-amber-100 shadow-[0_0_12px_rgba(245,158,11,0.25)] animate-pulse"
                                  : msg.chatBubbleStyle
                                    ? `border-yellow-500/30 shadow-[0_0_8px_rgba(234,179,8,0.15)] ${msg.chatBubbleStyle}`
                                    : (msg.vipLevelNumeric && msg.vipLevelNumeric >= 10)
                                      ? "bg-gradient-to-r from-red-950/40 to-yellow-950/40 border-yellow-500/40 text-yellow-100 shadow-[0_0_10px_rgba(234,179,8,0.2)]"
                                      : (msg.vipLevelNumeric && msg.vipLevelNumeric >= 7)
                                        ? "bg-gradient-to-r from-purple-950/45 to-slate-900 border-purple-500/35 text-purple-100"
                                        : (msg.vipLevelNumeric && msg.vipLevelNumeric >= 4)
                                          ? "bg-gradient-to-r from-blue-950/45 to-slate-900 border-blue-500/35 text-blue-100"
                                          : "bg-black/35 border-white/5 text-gray-300"
                          }`}
                        >
                          {!isSystem && !isGift && (
                            <div
                              className="flex items-center justify-between border-b border-white/5 pb-0.5 mb-1"
                            >
                              <div className="flex items-center gap-1">
                                {(() => {
                                  const activeColor = msg.senderActiveIdColorId;
                                  let colorClass = getVipNameStyle(msg.senderVipLevelNumeric || msg.vipLevelNumeric, msg.senderVip);
                                  if (activeColor === "color_fiery_amber") {
                                    colorClass = "text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-400 to-red-500 font-extrabold drop-shadow-[0_2px_4px_rgba(249,115,22,0.4)]";
                                  } else if (activeColor === "color_vaporwave_hologram") {
                                    colorClass = "text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-cyan-300 to-purple-400 font-extrabold drop-shadow-[0_2px_4px_rgba(192,132,252,0.4)]";
                                  } else if (activeColor === "color_diamond_platinum") {
                                    colorClass = "text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-blue-300 font-extrabold drop-shadow-[0_2px_4px_rgba(255,255,255,0.4)]";
                                  }
                                  return (
                                    <span className={`truncate max-w-[80px] uppercase font-black ${colorClass}`}>
                                      {msg.senderName}
                                    </span>
                                  );
                                })()}
                                <span className="bg-yellow-500/25 border border-yellow-500/30 text-yellow-500 text-[7px] font-bold px-0.5 rounded-xs">
                                  LVL {msg.senderLevel}
                                </span>
                                {/* Animated VIP crown tag */}
                                {(() => {
                                  const lvlVal = msg.senderVipLevelNumeric || msg.vipLevelNumeric || (msg.senderVip === "emperor" ? 20 : msg.senderVip === "royal" ? 15 : msg.senderVip === "svip" ? 10 : msg.senderVip === "vip" ? 5 : 0);
                                  if (lvlVal > 0) {
                                    return (
                                      <span className="bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500 text-white text-[7.5px] font-black px-1.5 py-0.2 rounded-xs flex items-center gap-0.5 animate-pulse shadow-md border border-yellow-400/30 font-mono tracking-wider select-none shrink-0">
                                        👑 VIP {lvlVal}
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                              <div className="flex items-center gap-1.5">
                                {isMentioned && (
                                  <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 text-[6.5px] font-black px-1.5 py-0.2 rounded-xs animate-bounce flex items-center gap-0.5 uppercase tracking-wider shadow">
                                    🔔 MENTIONED YOU
                                  </span>
                                )}
                                {activeRoom && user && (activeRoom.ownerId === user.id || activeRoom.admins?.includes(user.id)) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteRoomMessage(msg.id);
                                    }}
                                    className="msg-delete-btn bg-red-500/15 hover:bg-red-500/35 text-red-400 border border-red-500/25 px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-0.5 shrink-0 z-20"
                                    title="Delete Message"
                                  >
                                    🗑️ Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {isSticker ? (
                            <span className="text-3xl inline-block transition-transform duration-300 scale-105">
                              {msg.content}
                            </span>
                          ) : isImage ? (
                            <img
                              src={msg.content}
                              alt="Shared Media Pic"
                              className="max-w-[130px] rounded-lg mt-0.5 border border-white/10 shadow object-cover block"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <p className="leading-normal break-words">
                              {msg.content.includes("@") ? (
                                msg.content.split(/(\s+)/).map((word, i) => {
                                  if (word.startsWith("@") && word.length > 1) {
                                    return (
                                      <span key={i} className="bg-amber-500/20 text-yellow-300 font-extrabold border border-yellow-500/20 px-0.5 rounded mr-0.5 text-[9.5px]">
                                        {word}
                                      </span>
                                    );
                                  }
                                  return word;
                                })
                              ) : (
                                msg.content
                              )}
                            </p>
                          )}
                        </div>
                      );
                    })}
                    <div ref={messageEndRef} />
                </div>
              </div>
            </div>

            {/* Quick Gifting / Seating Drawers overlay */}
            {showSeatOptions !== null &&
              (() => {
                const selectedSeat = activeRoom.seats.find(
                  (s) => s.index === showSeatOptions,
                );
                const isOccupied = !!selectedSeat?.userId;
                const isMeOnSeat = selectedSeat?.userId === user.id;
                const isHost =
                  activeRoom.ownerId === user.id ||
                  activeRoom.admins.includes(user.id);
                const requests = selectedSeat?.requestingUsers || [];

                return (
                  <div className="absolute inset-0 bg-slate-950/65 flex items-end z-50 animate-fade-in">
                    <div className="w-full bg-slate-900 border-t-2 border-purple-500 rounded-t-3xl p-4 pb-[68px] flex flex-col gap-3 animate-slide-up">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white">
                          Mic Seat #{showSeatOptions} Setup
                        </span>
                        <button
                          onClick={() => setShowSeatOptions(null)}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex flex-col gap-2 mt-1">
                        {isMeOnSeat ? (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() =>
                                handleSocketSeatAction("toggle_mic")
                              }
                              className="py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-xs font-extrabold rounded-xl"
                            >
                              Mute/Unmute Mic
                            </button>
                            <button
                              onClick={() => handleSocketSeatAction("leave")}
                              className="py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold rounded-xl"
                            >
                              Leave Seat
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {!isOccupied && (
                              <div className="flex flex-col gap-2.5">
                                {isHost ? (
                                  <div className="flex flex-col gap-3">
                                    <div className="grid grid-cols-2 gap-2">
                                      <button
                                        onClick={() => {
                                          handleSocketSeatAction("take");
                                          setShowSeatOptions(null);
                                        }}
                                        className="py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-white text-xs font-black rounded-xl uppercase shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                                        id="take-seat-btn"
                                      >
                                        🛋️ Sit On Seat
                                      </button>
                                      <button
                                        onClick={() => {
                                          triggerGlobalError(
                                            "Choose an audience member below to dispatch invitation.",
                                          );
                                        }}
                                        className="py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 text-white text-xs font-black rounded-xl uppercase shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                                      >
                                        ✉️ Invite User
                                      </button>
                                    </div>

                                    {/* Active spectators invitation selector */}
                                    <div className="border-t border-white/5 pt-2 flex flex-col gap-1.5">
                                      <span className="text-[10px] text-yellow-400 font-extrabold uppercase tracking-widest block mb-1">
                                        👥 Invite Active Spectators (Audience)
                                      </span>
                                      {(() => {
                                        const audience =
                                          activeRoom.audience || [];
                                        const candidates = audience.filter(
                                          (u: any) =>
                                            !activeRoom.seats.some(
                                              (s: any) => s.userId === u.id,
                                            ),
                                        );

                                        if (candidates.length === 0) {
                                          return (
                                            <span className="text-[10px] text-gray-500 italic block py-2 text-center bg-slate-950/40 rounded-xl">
                                              No potential invite candidates
                                              currently in the audience list.
                                            </span>
                                          );
                                        }

                                        return (
                                          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                                            {candidates.map((cand: any) => (
                                              <div
                                                key={cand.id}
                                                className="flex items-center justify-between bg-slate-950/80 border border-slate-800 p-2 rounded-xl hover:border-purple-500/50 transition-all duration-200"
                                              >
                                                <div className="flex items-center gap-2.5">
                                                  <div className="relative">
                                                    <img
                                                      src={
                                                        cand.avatarUrl ||
                                                        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"
                                                      }
                                                      alt=""
                                                      className="w-8 h-8 rounded-full border border-purple-500/40 object-cover shadow-inner"
                                                      referrerPolicy="no-referrer"
                                                    />
                                                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-slate-950"></span>
                                                  </div>
                                                  <div className="flex flex-col text-left">
                                                    <span className="text-[10px] font-black text-white leading-tight">
                                                      {cand.displayName || cand.username}
                                                    </span>
                                                    <span className="text-[8px] text-yellow-500 font-mono tracking-wider">
                                                      @{cand.username || cand.id}
                                                    </span>
                                                    <span className="text-[8px] text-gray-400 font-mono">
                                                      ID: {cand.id}
                                                    </span>
                                                  </div>
                                                </div>

                                                <button
                                                  onClick={() => {
                                                    handleInviteUser(cand.id);
                                                    setShowSeatOptions(null);
                                                  }}
                                                  className="px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[9.5px] font-extrabold rounded-lg cursor-pointer transition-all shadow uppercase tracking-wider"
                                                >
                                                  Invite
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    {selectedSeat?.isLocked ? (
                                      <button
                                        onClick={() =>
                                          handleSocketSeatAction("request")
                                        }
                                        className="py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl uppercase shadow-md flex items-center justify-center gap-2"
                                        id="request-seat-btn"
                                      >
                                        🔒 Locked: Request Seat Approval
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() =>
                                          handleSocketSeatAction("take")
                                        }
                                        className="py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-black rounded-xl uppercase shadow-md animate-pulse"
                                        id="take-seat-btn"
                                      >
                                        Take Seat (Sit Down)
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Seat requests rendering */}
                        {isHost && requests.length > 0 && (
                          <div className="border-t border-slate-800 pt-2">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                              Pending Seat Requests
                            </span>
                            <div className="flex flex-col gap-1.5 max-h-24 overflow-y-auto">
                              {requests.map((reqUserId) => (
                                <div
                                  key={reqUserId}
                                  className="flex items-center justify-between bg-slate-950 p-1.5 rounded-lg border border-slate-800"
                                >
                                  <span className="text-[10px] text-gray-300 font-medium">
                                    User ID: {reqUserId}
                                  </span>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() =>
                                        handleRequestAction(reqUserId, "accept")
                                      }
                                      className="px-2 py-0.5 bg-emerald-500 text-slate-950 text-[9px] font-black rounded"
                                    >
                                      Accept
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleRequestAction(
                                          reqUserId,
                                          "decline",
                                        )
                                      }
                                      className="px-2 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded"
                                    >
                                      Decline
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Host panels locking/muting */}
                        {isHost && (
                          <div className="border-t border-slate-800 pt-2 mt-1 flex flex-col gap-2">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                              Host & Admin Panel
                            </span>

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() =>
                                  handleSocketSeatAction("toggle_lock")
                                }
                                className="py-2 bg-slate-950 border border-red-500/30 text-rose-400 text-[10px] font-bold rounded-lg"
                              >
                                Toggle Lock (Empty seat)
                              </button>
                              <button
                                onClick={() =>
                                  handleSocketSeatAction("toggle_owner_mute")
                                }
                                className="py-2 bg-slate-950 border border-slate-800 text-yellow-400 text-[10px] font-bold rounded-lg"
                              >
                                Toggle Host Mute
                              </button>
                            </div>

                            {!isOccupied && (
                              <div className="flex gap-1.5 items-center bg-slate-950 p-2 rounded-lg border border-slate-800 mt-1">
                                <input
                                  type="text"
                                  placeholder="Enter User ID to Invite"
                                  id="invite-userId-input"
                                  className="flex-1 text-[10px] bg-slate-900 border border-slate-800 text-white rounded px-2 py-1 outline-none"
                                />
                                <button
                                  onClick={() => {
                                    const input = document.getElementById(
                                      "invite-userId-input",
                                    ) as HTMLInputElement;
                                    if (input && input.value.trim()) {
                                      handleInviteUser(input.value.trim());
                                      input.value = "";
                                    } else {
                                      triggerGlobalError(
                                        "Please enter a User ID to invite.",
                                      );
                                    }
                                  }}
                                  className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold px-3 py-1 rounded"
                                >
                                  Invite User
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

            {/* Real-time Room Audience List */}
            {(() => {
              const audience = activeRoom.audience || [];
              return (
                <div className="px-2 py-0.5 bg-slate-950/50 border-t border-white/5 flex flex-col gap-0.5 select-none shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[8.5px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1">
                      👥 Audience ({audience.length})
                    </span>
                    <span className="text-[7.5px] text-emerald-400 font-bold uppercase animate-pulse flex items-center gap-0.5">
                      <span className="w-1 h-1 bg-emerald-500 rounded-full inline-block"></span>{" "}
                      Sync
                    </span>
                  </div>
                  {audience.length === 0 ? (
                    <span className="text-[8.5px] text-gray-500 italic py-0.5">
                      No audience in this room yet.
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none scroll-smooth">
                      {audience.map((u: any) => (
                        <div
                          key={u.id}
                          onClick={() => {
                            // Easily click audience member to view profile!
                            setUserProfileView(u);
                          }}
                          className="flex items-center gap-1 shrink-0 bg-white/5 border border-white/5 rounded-full pl-0.5 pr-2 py-0.5 cursor-pointer hover:bg-white/10 transition-colors"
                        >
                          <div className="relative">
                            <img
                              src={
                                u.avatarUrl ||
                                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"
                              }
                              alt={u.displayName}
                              className="w-5 h-5 rounded-full border border-slate-700/50 object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-emerald-500 border border-slate-950 rounded-full"></span>
                          </div>
                          <span className="text-[8px] text-gray-300 font-bold truncate max-w-[45px]">
                            {u.displayName}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Primary Room bottom footer controller tray */}
            <div className="p-1 px-2 bg-slate-950/95 border-t border-white/10 flex items-center justify-between gap-1.5 z-30 shrink-0 select-none shadow-[0_-3px_15px_rgba(0,0,0,0.6)]">
              {/* Emoji/Smile Trigger */}
              <button
                onClick={() => setShowStickerPanel(!showStickerPanel)}
                className="p-1 bg-slate-800 hover:bg-slate-705 text-yellow-400 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 w-7 h-7"
                title="Stickers & Emojis"
                id="sticker-btn"
              >
                <Smile className="w-4 h-4" />
              </button>

              {/* Chat Input Field */}
              <div className="flex-1 flex gap-1 relative min-w-0">
                <input
                  type="text"
                  placeholder="Message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-full pl-3 pr-7 py-1 text-[10px] placeholder-gray-500 focus:outline-none focus:border-purple-500 truncate h-7"
                  id="chat-input"
                />
                <button
                  onClick={handleSendMessage}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 bg-purple-600 rounded-full hover:bg-purple-505 text-white flex items-center justify-center cursor-pointer"
                  id="chat-send-btn"
                >
                  <Send className="w-2.5 h-2.5" />
                </button>
              </div>



              {/* Mic On/Off Button with Gold/Red indicators */}
              {(() => {
                const mySeat = activeRoom
                  ? activeRoom.seats.find((s) => s.userId === user?.id)
                  : null;
                if (!mySeat) return null;
                const isAdminMuted = mySeat?.isMutedByOwner;

                return (
                  <button
                    onClick={() => {
                      if (isAdminMuted) {
                        triggerGlobalError(
                          "🚫 You have been admin-muted and cannot toggle your mic.",
                        );
                        return;
                      }
                      setMicEnabled(!micEnabled);
                    }}
                    className={`p-1 rounded-full flex items-center justify-center cursor-pointer transition-all border shrink-0 w-7 h-7 ${
                      isAdminMuted
                        ? "bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/40 animate-pulse"
                        : micEnabled
                          ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/35 shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse"
                          : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                    }`}
                    title={
                      isAdminMuted
                        ? "Muted by Host"
                        : micEnabled
                          ? "Mic is ON (Streaming)"
                          : "Mic is OFF (Self)"
                    }
                    id="mic-toggle-btn"
                  >
                    {isAdminMuted ? (
                      <MicOff className="w-3.5 h-3.5 text-red-505" />
                    ) : (
                      <Mic className={`w-3.5 h-3.5 ${micEnabled ? "text-emerald-400" : "text-amber-500"}`} />
                    )}
                  </button>
                );
              })()}

              {/* Speaker / Sound On/Off Button */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1 rounded-full flex items-center justify-center cursor-pointer transition-all border shrink-0 w-7 h-7 ${
                  soundEnabled
                    ? "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/35"
                    : "bg-slate-800 hover:bg-slate-750 text-gray-400 border-slate-755"
                }`}
                title={soundEnabled ? "Sound is ON" : "Sound is OFF"}
                id="speaker-toggle-btn"
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-gray-455" />
                )}
              </button>

              {/* Tools Button System */}
              <button
                onClick={() => {
                  setShowToolsMenu(!showToolsMenu);
                }}
                className={`p-1 rounded-full flex items-center justify-center cursor-pointer transition-all border shrink-0 w-7 h-7 ${
                  showToolsMenu
                    ? "bg-purple-500/20 text-purple-400 border-purple-500/45 scale-105"
                    : "bg-slate-800 hover:bg-slate-750 text-gray-400 border-slate-755"
                }`}
                title="Tools Menu"
                id="tools-menu-toggle-btn"
              >
                <Wrench className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sticker panel overlay */}
            {showStickerPanel && (
              <div className="absolute inset-x-0 bottom-[104px] bg-slate-950 border-t-2 border-purple-500 p-2.5 z-55 animate-slide-up flex flex-col gap-2 shadow-[0_-5px_25px_rgba(0,0,0,0.85)] max-h-[220px]">
                {/* Horizontal Category Tab Picker */}
                <div className="flex gap-1.5 overflow-x-auto pb-1.5 border-b border-white/5 scrollbar-none select-none animate-fade-in">
                  {EMOJI_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveEmojiTab(cat.id)}
                      className={`px-3 py-1 text-[9.5px] font-black rounded-lg shrink-0 transition-all cursor-pointer ${
                        activeEmojiTab === cat.id
                          ? "bg-purple-600 text-white"
                          : "bg-slate-900 text-gray-400 hover:bg-slate-850 hover:text-white"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Emojis Grid for current category */}
                <div className="grid grid-cols-7 gap-1 overflow-y-auto max-h-[160px] pr-1 py-1 font-sans">
                  {(
                    EMOJI_CATEGORIES.find((c) => c.id === activeEmojiTab)
                      ?.emojis || []
                  ).map((st) => (
                    <button
                      key={st}
                      onClick={() => sendSticker(st)}
                      className="text-2xl hover:scale-130 active:scale-95 transition-all p-1 text-center cursor-pointer select-none"
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Room Tools Station Menu popup */}
            {showToolsMenu && (
              <div className="absolute bottom-[104px] right-2 bg-slate-900 border border-slate-700/80 rounded-2xl p-3 shadow-[0_10px_35px_rgba(0,0,0,0.8)] z-55 w-72 flex flex-col gap-2.5 bg-opacity-95 backdrop-blur-md animate-slide-up select-none">
                <div className="text-[10px] text-purple-400 font-extrabold tracking-widest uppercase border-b border-white/5 pb-1.5 flex items-center justify-between">
                  <span>🛠️ Room Tools Station</span>
                  <button
                    onClick={() => setShowToolsMenu(false)}
                    className="text-gray-500 hover:text-white cursor-pointer select-none text-[11px]"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1 text-xs font-semibold scrollbar-none">
                  {/* Game Option */}
                  <button
                    onClick={() => {
                      setShowToolsMenu(false);
                      setShowGameCenter(true);
                    }}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-500 hover:text-amber-400 transition-all text-center border border-slate-850 cursor-pointer gap-1"
                  >
                    <span className="text-xl">🎮</span>
                    <span className="font-bold text-[10px] leading-tight text-white">Games</span>
                  </button>

                  {/* Music Option */}
                  <button
                    onClick={() => {
                      setShowToolsMenu(false);
                      const isHost = activeRoom.ownerId === user?.id || activeRoom.admins?.includes(user?.id || "") || activeRoom.moderators?.includes(user?.id || "");
                      if (!isHost) {
                        triggerGlobalError("You are not the Room Owner or Admin. Only Room Owners and Admins can access the Music Station.");
                        return;
                      }
                      setShowMusicPlayer(true);
                    }}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-purple-400 hover:text-purple-300 transition-all text-center border border-slate-850 cursor-pointer gap-1"
                  >
                    <span className="text-xl">🎵</span>
                    <span className="font-bold text-[10px] leading-tight text-white">Music</span>
                  </button>

                  {/* Pic Option */}
                  <button
                    onClick={() => {
                      setShowToolsMenu(false);
                      setShowPicUploadPanel(true);
                    }}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-teal-400 hover:text-teal-300 transition-all text-center border border-slate-850 cursor-pointer gap-1"
                  >
                    <span className="text-xl">📸</span>
                    <span className="font-bold text-[10px] leading-tight text-white">Pic Share</span>
                  </button>

                  {/* Virtual Gifts */}
                  <button
                    onClick={() => {
                      setShowToolsMenu(false);
                      setSelectedReceiverId(
                        activeRoom.seats.find((s) => s.userId)?.userId ||
                          activeRoom.ownerId,
                      );
                      setShowGiftStore(true);
                    }}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-pink-400 hover:text-pink-300 transition-all text-center border border-slate-850 cursor-pointer gap-1"
                  >
                    <span className="text-xl">🎁</span>
                    <span className="font-bold text-[10px] leading-tight text-white">Gifts Vault</span>
                  </button>

                  {/* Lucky Spin */}
                  <button
                    onClick={() => {
                      setShowToolsMenu(false);
                      setMobileRoute("spin");
                    }}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 transition-all text-center border border-slate-850 cursor-pointer gap-1"
                  >
                    <span className="text-xl">🎡</span>
                    <span className="font-bold text-[10px] leading-tight text-white">Lucky Spin</span>
                  </button>

                  {/* Room Events */}
                  <button
                    onClick={() => {
                      setShowToolsMenu(false);
                      setShowRoomEventsModal(true);
                    }}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-cyan-400 hover:text-cyan-350 transition-all text-center border border-slate-850 cursor-pointer gap-1"
                  >
                    <span className="text-xl">📅</span>
                    <span className="font-bold text-[10px] leading-tight text-white">Events</span>
                  </button>

                  {/* Interactive Mini Apps */}
                  <button
                    onClick={() => {
                      setShowToolsMenu(false);
                      setShowMiniAppsModal(true);
                    }}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-fuchsia-400 hover:text-fuchsia-350 transition-all text-center border border-slate-850 cursor-pointer gap-1"
                  >
                    <span className="text-xl">📱</span>
                    <span className="font-bold text-[10px] leading-tight text-white">Mini Apps</span>
                  </button>

                  {/* Security Reports */}
                  <button
                    onClick={async () => {
                      setShowToolsMenu(false);
                      setShowReportsPanel(true);
                      try {
                        const res = await fetch(
                          `/api/rooms/${activeRoom.id}/reports?requestingUserId=${user?.id}`,
                        );
                        const data = await res.json();
                        if (data.success) {
                          setActiveReports(data.reports);
                        }
                      } catch (err) {
                        console.error("Failed fetching reports", err);
                      }
                    }}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-red-400 hover:text-red-300 transition-all text-center border border-slate-850 cursor-pointer gap-1"
                  >
                    <span className="text-xl">🛡️</span>
                    <span className="font-bold text-[10px] leading-tight text-white">Reports</span>
                  </button>

                  {/* PK Battle */}
                  <button
                    onClick={() => {
                      setShowToolsMenu(false);
                      handleTogglePK();
                    }}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-rose-400 hover:text-rose-300 transition-all text-center border border-slate-850 cursor-pointer gap-1 col-span-2"
                  >
                    <span className="text-xl">⚔️</span>
                    <span className="font-bold text-[10px] leading-tight text-white">Start 1v1 PK Battle</span>
                  </button>

                  {/* Creator Admin Bypass Trigger Panel */}
                  {(user.email === "ebadulhoque1234567890@gmail.com" || user.isGlobalAdmin) && (
                    <button
                      onClick={() => {
                        setShowToolsMenu(false);
                        setShowAdminBypassPanel(true);
                      }}
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-r from-yellow-500/10 to-amber-500/10 hover:from-yellow-500/20 hover:to-amber-500/20 text-yellow-400 border border-yellow-500/20 cursor-pointer text-center gap-1 col-span-2 shadow-sm"
                    >
                      <span className="text-lg">👑</span>
                      <span className="font-bold text-[10px] leading-tight text-white">Creator Bypass Panel</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Simulated Pic Upload / Selection Drawer Panel */}
            {showPicUploadPanel && (
              <div className="absolute bottom-[104px] right-2 bg-slate-900 border border-teal-500/30 rounded-2xl p-4 flex flex-col gap-3 bg-opacity-95 backdrop-blur-md z-55 w-60 shadow-[0_10px_35px_rgba(0,0,0,0.85)] select-none">
                <div className="text-[10px] text-teal-400 font-extrabold tracking-widest uppercase border-b border-white/5 pb-1.5 flex items-center justify-between">
                  <span>📸 Share Pic to Chat</span>
                  <button
                    onClick={() => setShowPicUploadPanel(false)}
                    className="text-gray-500 hover:text-white cursor-pointer select-none text-[11px]"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-[8px] text-gray-400 mt-0.5 leading-tight">
                  Choose a picture to instantly message into the voice chat room for all members:
                </p>

                {/* Preconfigured Beautiful Photo Grid */}
                <div className="grid grid-cols-2 gap-1.5 max-h-[165px] overflow-y-auto">
                  {[
                    { name: "🎉 Party Night", url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=300&q=80" },
                    { name: "🎮 Gaming Setup", url: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=300&q=80" },
                    { name: "🌅 Travel Coast", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80" },
                    { name: "🏆 Victory Cup", url: "https://images.unsplash.com/photo-1578269174936-2709b5a5e023?auto=format&fit=crop&w=300&q=80" },
                    { name: "🐱 Cute Kitten", url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=300&q=80" },
                    { name: "🍕 Pizza Feast", url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80" },
                  ].map((p) => (
                    <button
                      key={p.url}
                      onClick={async () => {
                        setShowPicUploadPanel(false);
                        try {
                          await fetch(`/api/rooms/${activeRoom.id}/messages`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              senderId: user.id,
                              type: MessageType.IMAGE,
                              content: p.url,
                            }),
                          });
                          setRefreshTicks((c) => c + 1);
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="group relative h-14 rounded-lg overflow-hidden border border-white/5 hover:border-teal-500 transition-all cursor-pointer active:scale-95 text-left"
                    >
                      <img
                        src={p.url}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-end p-1">
                        <span className="text-[7px] text-white font-black truncate w-full">{p.name}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Custom HTTP Image Link Input */}
                <div className="flex flex-col gap-1 border-t border-white/5 pt-2">
                  <span className="text-[7.5px] uppercase font-black text-gray-500">Or enter any Image URL:</span>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      id="custom-pic-url-input"
                      placeholder="https://example.com/pic.jpg"
                      className="flex-1 bg-slate-950 text-[8px] text-white rounded p-1 outline-none border border-slate-800 placeholder-slate-600"
                    />
                    <button
                      onClick={async () => {
                        const el = document.getElementById("custom-pic-url-input") as HTMLInputElement;
                        if (el && el.value.trim()) {
                          const urlVal = el.value.trim();
                          el.value = "";
                          setShowPicUploadPanel(false);
                          try {
                            await fetch(`/api/rooms/${activeRoom.id}/messages`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                senderId: user.id,
                                type: MessageType.IMAGE,
                                content: urlVal,
                              }),
                            });
                            setRefreshTicks((c) => c + 1);
                          } catch (e) {
                            console.error(e);
                          }
                        }
                      }}
                      className="bg-teal-600 text-slate-950 font-black text-[8px] px-2 py-1 rounded cursor-pointer hover:bg-teal-505"
                    >
                      SEND
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Room Scheduled Events Overlay */}
            {showRoomEventsModal && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-55">
                <div className="bg-slate-900 border border-cyan-500/20 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-up text-left">
                  <div className="bg-gradient-to-r from-cyan-950 to-indigo-950 p-3.5 border-b border-cyan-500/30 flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-black text-cyan-400 uppercase tracking-widest">
                        Scheduled voice events
                      </h4>
                      <p className="text-[8px] text-gray-400 uppercase">
                        EbadulChat Club Group
                      </p>
                    </div>
                    <button
                      onClick={() => setShowRoomEventsModal(false)}
                      className="text-gray-400 hover:text-white cursor-pointer font-bold font-sans"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-3.5 flex flex-col gap-2.5 max-h-[300px] overflow-y-auto">
                    <div className="p-2.5 bg-slate-950 border border-slate-850 rounded-xl relative overflow-hidden">
                      <span className="absolute top-2 right-2 text-[7px] font-black uppercase text-cyan-400 bg-cyan-950 border border-cyan-500/20 px-1 rounded-sm animate-pulse">
                        Live Soon
                      </span>
                      <h5 className="text-[10px] font-black text-white">
                        🎙️ DJ Ebadul Talk Show Special
                      </h5>
                      <p className="text-[8px] text-gray-400">
                        Join Creator Ebadul on mic for exclusive developer logs
                        discussions and songs playing giveaways!
                      </p>
                      <p className="text-[7.5px] text-cyan-400 mt-1 font-semibold">
                        📅 Friday, June 12 • 8:00 PM EST
                      </p>
                    </div>
                    <div className="p-2.5 bg-slate-950 border border-slate-850 rounded-xl">
                      <h5 className="text-[10px] font-black text-white">
                        🔥 Weekly Clan PK Championship
                      </h5>
                      <p className="text-[8px] text-gray-400">
                        Sylhet Elite Family vs Dhaka Beats Club. Maximize coin
                        votes and secure exclusive legendary gifts!
                      </p>
                      <p className="text-[7.5px] text-indigo-400 mt-1 font-semibold">
                        📅 Saturday, June 13 • 10:00 PM EST
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mini Apps Modal Overlay */}
            {showMiniAppsModal && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-55">
                <div className="bg-slate-900 border border-pink-500/20 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-up text-left">
                  <div className="bg-gradient-to-r from-pink-950 to-purple-950 p-3.5 border-b border-pink-500/30 flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-black text-pink-400 uppercase tracking-widest">
                        Interactive Mini Apps
                      </h4>
                      <p className="text-[8px] text-gray-400 uppercase">
                        Interactive Widgets
                      </p>
                    </div>
                    <button
                      onClick={() => setShowMiniAppsModal(false)}
                      className="text-gray-400 hover:text-white cursor-pointer font-bold font-sans"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-3.5 flex flex-col gap-2.5 max-h-[300px] overflow-y-auto font-sans">
                    <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🏆</span>
                        <div>
                          <h5 className="text-[10px] font-black text-white">
                            VIP Elite Achievement Levels
                          </h5>
                          <p className="text-[8px] text-gray-400">
                            Total Coins: {(user.email === "ebadulhoque1234567890@gmail.com" || user.isGlobalAdmin) ? "∞ Unlimited" : user.coins} • Level XP:{" "}
                            {user.xp || 150}
                          </p>
                        </div>
                      </div>
                      <span className="text-[8px] font-black text-pink-400 uppercase bg-pink-950 border border-pink-400/20 px-1 rounded-sm">
                        Active
                      </span>
                    </div>

                    <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl">
                      <h5 className="text-[10px] font-black text-white mb-1">
                        💰 Premium Family Coin Converter
                      </h5>
                      <div className="grid grid-cols-2 gap-1.5 text-center text-[9px]">
                        <button
                          onClick={() =>
                            triggerGlobalError("Exchange pending validation")
                          }
                          className="py-1 px-2 bg-slate-900 hover:bg-slate-850 rounded border border-white/5 text-slate-200"
                        >
                          100 Gems ➔ conversion
                        </button>
                        <button
                          onClick={() =>
                            triggerGlobalError("Wallet connection required")
                          }
                          className="py-1 px-2 bg-purple-600 hover:bg-purple-500 text-white rounded"
                        >
                          Link Stripe Card
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Synchronized Music Player overlay */}
            {showMusicPlayer && activeRoom && (
              <div className="absolute inset-x-0 bottom-[104px] bg-slate-950/98 backdrop-blur-2xl border-t border-purple-500/40 rounded-t-[32px] p-5 flex flex-col gap-4 z-50 animate-slide-up text-slate-100 max-h-[460px] overflow-y-auto shadow-[0_-12px_40px_rgba(168,85,247,0.25)] select-none font-sans">
                {/* CSS styles for rotating vinyl and soundwave */}
                <style>{`
                  @keyframes vinylSpin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                  @keyframes audioWaveBar {
                    0%, 100% { height: 4px; }
                    50% { height: 24px; }
                  }
                  .spin-vinyl-active {
                    animation: vinylSpin 8s linear infinite;
                  }
                  .animate-wave-1 { animation: audioWaveBar 0.5s ease-in-out infinite alternate; }
                  .animate-wave-2 { animation: audioWaveBar 0.7s ease-in-out infinite alternate; }
                  .animate-wave-3 { animation: audioWaveBar 0.4s ease-in-out infinite alternate; }
                  .animate-wave-4 { animation: audioWaveBar 0.6s ease-in-out infinite alternate; }
                `}</style>

                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                      <Music className="w-4.5 h-4.5 text-white animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                        📻 InFriends Stereo Deck
                        <span className="flex h-1.5 w-1.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-pink-500"></span>
                        </span>
                      </h3>
                      <p className="text-[7.5px] text-purple-400 font-mono font-bold tracking-wide">
                        Synchronized Studio Audio Engine
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMusicPlayer(false)}
                    className="text-gray-400 hover:text-white p-1.5 hover:bg-white/5 rounded-full transition-all active:scale-95 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Background Upload Progress Bar - Subtle, Sleek, Non-blocking */}
                {backgroundUploads.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-500/30 rounded-2xl p-3 flex flex-col gap-1.5 animate-pulse shadow-md">
                    <div className="flex items-center justify-between text-[8px] font-bold text-blue-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                        </span>
                        Background Uploading Song
                      </span>
                      <span>Ready to play soon</span>
                    </div>
                    <p className="text-[8px] text-gray-300 truncate font-medium">
                      📁 {backgroundUploads[0].name}
                    </p>
                    <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full w-2/3 animate-pulse rounded-full"></div>
                    </div>
                  </div>
                )}

                {/* MAIN IN-FRIENDS MUSIC PLAYER STAGE */}
                <div className="bg-gradient-to-b from-slate-900/90 via-slate-950/90 to-slate-950/95 rounded-3xl p-4 border border-purple-500/20 shadow-xl flex flex-col gap-4 relative overflow-hidden">
                  
                  {/* Decorative glowing ambient backdrops */}
                  <div className="absolute -top-12 -left-12 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
                  <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>

                  <div className="flex gap-4 items-center">
                    {/* Glowing CD Vinyl Disc with rotating dynamic gradient */}
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-md animate-pulse"></div>
                      <div className={`w-20 h-20 rounded-full border-2 border-slate-800 bg-slate-950 flex items-center justify-center relative shadow-2xl overflow-hidden ${activeRoom.musicState?.isPlaying ? "spin-vinyl-active" : ""}`}>
                        {/* Realistic glossy groove texture */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,transparent_70%)]"></div>
                        <div className="absolute inset-0 border border-white/5 rounded-full"></div>
                        
                        {/* Spinning colored record label */}
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${
                          activeRoom.musicState?.currentSongId ? getAlbumArtwork(activeRoom.musicState.currentSongId) : "from-pink-500 via-purple-600 to-indigo-700"
                        } flex items-center justify-center border border-slate-900 shadow-inner`}>
                          <span className="text-[14px]">🎵</span>
                        </div>
                        
                        {/* Center spindle hole */}
                        <div className="absolute w-3 h-3 rounded-full bg-slate-950 border border-slate-800 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] flex items-center justify-center">
                          <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                        </div>
                      </div>
                    </div>

                    {/* Metadata & Bouncing Soundwave */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[7px] px-2 py-0.5 rounded-full uppercase font-black tracking-widest border shadow-sm ${
                          activeRoom.musicState?.isPlaying 
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 animate-pulse" 
                            : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                        }`}>
                          {activeRoom.musicState?.isPlaying ? "⚡ LIVE DECK" : "⏸️ PAUSED"}
                        </span>
                        {activeRoom.musicState?.startedByName && (
                          <span className="text-[7px] bg-purple-500/15 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full font-bold">
                            🎧 DJ: {activeRoom.musicState.startedByName}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-black text-white truncate uppercase tracking-wide leading-tight mt-0.5">
                        {activeRoom.musicState?.currentSongName || "Silent Channel"}
                      </h4>
                      <p className="text-[9px] text-purple-300/80 font-medium truncate flex items-center gap-1">
                        👤 {activeRoom.musicState?.currentSongArtist || "No source track selected"}
                      </p>

                      {/* Animated spectrum bar visualizer */}
                      <div className="flex items-end gap-[2px] h-4 mt-1.5">
                        <div className={`w-[2.5px] bg-pink-500 rounded-full ${activeRoom.musicState?.isPlaying ? 'animate-wave-1' : 'h-[3px]'}`}></div>
                        <div className={`w-[2.5px] bg-purple-500 rounded-full ${activeRoom.musicState?.isPlaying ? 'animate-wave-2' : 'h-[3px]'}`}></div>
                        <div className={`w-[2.5px] bg-indigo-500 rounded-full ${activeRoom.musicState?.isPlaying ? 'animate-wave-3' : 'h-[3px]'}`}></div>
                        <div className={`w-[2.5px] bg-fuchsia-500 rounded-full ${activeRoom.musicState?.isPlaying ? 'animate-wave-4' : 'h-[3px]'}`}></div>
                      </div>
                    </div>
                  </div>

                  {/* SEEK BAR / PROGRESS PROGRESSION */}
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center justify-between text-[8px] font-mono text-gray-400">
                      <span>{formatTime(musicCurrentTime)}</span>
                      <span>{formatTime(musicDuration || (activeRoom.musicState?.durationMs ? activeRoom.musicState.durationMs / 1000 : 180))}</span>
                    </div>
                    <div className="relative group flex items-center">
                      <input
                        type="range"
                        min="0"
                        max={musicDuration || (activeRoom.musicState?.durationMs ? activeRoom.musicState.durationMs / 1000 : 180)}
                        value={musicCurrentTime}
                        onChange={async (e) => {
                          const targetTime = Number(e.target.value);
                          setMusicCurrentTime(targetTime);
                          if (bgMusicRef.current) {
                            bgMusicRef.current.currentTime = targetTime;
                          }
                          const isHost = activeRoom.ownerId === user?.id || activeRoom.admins?.includes(user?.id || "") || activeRoom.moderators?.includes(user?.id || "");
                          if (isHost) {
                            await fetch(`/api/rooms/${activeRoom.id}/music`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                action: "seek",
                                requestingUserId: user?.id,
                                progressMs: targetTime * 1000
                              })
                            });
                          }
                        }}
                        className="w-full accent-purple-500 h-1 bg-slate-800 rounded-full cursor-pointer appearance-none outline-none transition-all group-hover:h-1.5"
                      />
                    </div>
                  </div>

                  {/* CONTROL BUTTONS DECK */}
                  <div className="flex items-center justify-between gap-2 px-1">
                    
                    {/* Shuffle Toggle */}
                    <button
                      onClick={() => setMusicShuffle(prev => !prev)}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        musicShuffle 
                          ? "bg-purple-500/15 text-purple-400 border border-purple-500/30 shadow-lg shadow-purple-500/10" 
                          : "text-gray-500 hover:text-white hover:bg-white/5 border border-transparent"
                      }`}
                      title={musicShuffle ? "Shuffle ON" : "Shuffle OFF"}
                    >
                      <Shuffle className="w-4 h-4" />
                    </button>

                    {/* Previous Track Button */}
                    <button
                      onClick={triggerPrevSong}
                      disabled={!activeRoom.songs || activeRoom.songs.length === 0}
                      className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 active:scale-90 transition-all cursor-pointer disabled:opacity-40"
                      title="Previous Track"
                    >
                      <SkipBack className="w-4 h-4 fill-current" />
                    </button>

                    {/* Central Play/Pause button */}
                    {(() => {
                      const isHost = activeRoom.ownerId === user?.id || activeRoom.admins?.includes(user?.id || "") || activeRoom.moderators?.includes(user?.id || "");
                      const isPlaying = activeRoom.musicState?.isPlaying;

                      return (
                        <button
                          onClick={async () => {
                            if (!isHost) {
                              triggerGlobalError("Only Room Hosts or Admins can control track playback.");
                              return;
                            }
                            try {
                              const action = isPlaying ? "pause" : "resume";
                              const res = await fetch(`/api/rooms/${activeRoom.id}/music`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ action, requestingUserId: user?.id })
                              });
                              if (res.ok) {
                                const body = await res.json();
                                setActiveRoom(body.room);
                              } else {
                                const errData = await res.json();
                                triggerGlobalError(errData.error || `Failed to ${action} music.`);
                              }
                            } catch (err) { console.error(err); }
                          }}
                          className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 text-slate-950 flex items-center justify-center shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 active:scale-95 transition-all cursor-pointer relative"
                        >
                          <div className="absolute inset-0 rounded-full border border-white/20"></div>
                          {isPlaying ? (
                            <Pause className="w-5 h-5 text-white fill-current" />
                          ) : (
                            <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                          )}
                        </button>
                      );
                    })()}

                    {/* Next Track Button */}
                    <button
                      onClick={triggerNextSong}
                      disabled={!activeRoom.songs || activeRoom.songs.length === 0}
                      className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 active:scale-90 transition-all cursor-pointer disabled:opacity-40"
                      title="Next Track"
                    >
                      <SkipForward className="w-4 h-4 fill-current" />
                    </button>

                    {/* Repeat Toggle */}
                    <button
                      onClick={() => {
                        setMusicRepeat(prev => {
                          if (prev === 'none') return 'all';
                          if (prev === 'all') return 'one';
                          return 'none';
                        });
                      }}
                      className={`p-2 rounded-xl transition-all cursor-pointer relative ${
                        musicRepeat !== 'none' 
                          ? "bg-purple-500/15 text-purple-400 border border-purple-500/30 shadow-lg shadow-purple-500/10" 
                          : "text-gray-500 hover:text-white hover:bg-white/5 border border-transparent"
                      }`}
                      title={`Repeat: ${musicRepeat.toUpperCase()}`}
                    >
                      <Repeat className="w-4 h-4" />
                      {musicRepeat === 'one' && (
                        <span className="absolute -top-0.5 -right-0.5 text-[6px] font-black bg-purple-500 text-slate-950 rounded-full w-3 h-3 flex items-center justify-center border border-slate-950">1</span>
                      )}
                    </button>
                  </div>

                  {/* SEPARATE VOLUME SLIDER CONTROLS */}
                  <div className="border-t border-white/5 pt-3 flex items-center justify-between gap-4 px-1">
                    <span className="text-[8px] font-black tracking-widest text-purple-400 uppercase">
                      🔊 Music Volume
                    </span>
                    <div className="flex items-center gap-2 flex-1 max-w-[180px]">
                      <button 
                        onClick={() => setBgMusicVolume(v => v > 0 ? 0 : 0.8)}
                        className="text-purple-400 hover:text-white transition-all cursor-pointer"
                      >
                        {bgMusicVolume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={bgMusicVolume}
                        onChange={(e) => setBgMusicVolume(Number(e.target.value))}
                        className="w-full accent-purple-500 h-1 bg-slate-800 rounded-full cursor-pointer appearance-none outline-none"
                      />
                      <span className="text-[8px] font-mono font-bold text-gray-400 w-6 text-right">
                        {Math.round(bgMusicVolume * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* FULLY RESTORED MUSIC STATION TOOLS */}
                <div className="flex flex-col gap-3 mt-0.5 font-sans">
                  
                  {/* OPTION 1: UPLOAD MUSIC FROM DEVICE */}
                  <div className="bg-slate-900/90 p-3 text-[9.5px] rounded-2xl border border-blue-500/25 flex flex-col gap-1.5 shadow-md">
                    <span className="font-extrabold uppercase tracking-wider text-blue-400 flex items-center gap-1.5 font-sans text-[10px]">
                      📁 Option 1: Choose & Play Music from Phone (Audio Only)
                    </span>
                    <p className="text-[7.5px] text-gray-400 leading-tight">
                      This will only show audio files (MP3, WAV, etc.) from your device storage. Upload and play immediately!
                    </p>

                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="file"
                        id="mobile-media-uploader"
                        accept=".mp3,.m4a,.aac,.wav,.ogg,audio/mp3,audio/mpeg,audio/m4a,audio/x-m4a,audio/aac,audio/wav,audio/x-wav,audio/ogg,audio/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          const isHost = activeRoom.ownerId === user?.id || activeRoom.admins?.includes(user?.id || "") || activeRoom.moderators?.includes(user?.id || "");
                          if (!isHost) {
                            triggerGlobalError("Only Room Hosts or Admins can upload and play music streams.");
                            return;
                          }

                          // Frontend Duplicate Check to prevent adding same song twice
                          const cleanTitle = file.name.replace(/\.[^/.]+$/, "");
                          const isDuplicate = activeRoom.songs?.some((s: any) => 
                            s.name.toLowerCase().trim() === cleanTitle.toLowerCase().trim()
                          );

                          if (isDuplicate) {
                            triggerGlobalError(`Duplicate song! "${cleanTitle}" is already in the playlist. Please remove the existing one before uploading.`);
                            e.target.value = ""; // reset
                            return;
                          }

                          try {
                            const songId = "uploaded_" + Date.now();
                            const blobUrl = URL.createObjectURL(file);
                            
                            // Save to IndexedDB (Mobile Storage) instantly!
                            await saveSongToLocalDB(songId, cleanTitle, file);
                            
                            // Dynamically detect file duration using Audio object
                            const tempAudio = new Audio(blobUrl);
                            tempAudio.addEventListener("loadedmetadata", () => {
                              const detectedDurationMs = Math.round(tempAudio.duration * 1000) || 300000;
                              const minutes = Math.floor(detectedDurationMs / 60000);
                              const seconds = Math.floor((detectedDurationMs % 60000) / 1000);
                              const durationStr = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

                              // Add to local tracks list for instant latency-free local playback
                              const newTrack = {
                                id: songId,
                                name: cleanTitle,
                                blobUrl: blobUrl,
                                artist: "Mobile Cache",
                                durMs: detectedDurationMs
                              };
                              setLocalTracks(prev => [...prev, newTrack]);
                              setLocalMusicFileName(file.name);
                              
                              triggerGlobalError(`✨ "${cleanTitle}" loaded from storage and playing instantly! Syncing with server in background...`);

                              // Register background upload tracking state
                              setBackgroundUploads(prev => [...prev, { id: songId, name: file.name, progress: 10 }]);

                              // Upload to server in background so other users can listen, without blocking the UI!
                              handleAudioFileUpload(file).then(async (url) => {
                                // 1. Add persistently to room's playlist
                                const addRes = await fetch(`/api/rooms/${activeRoom.id}/music`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    action: "add_persistent_song",
                                    requestingUserId: user?.id,
                                    songId: songId,
                                    songName: cleanTitle,
                                    songArtist: "Uploaded Audio",
                                    songUrl: url,
                                    durationMs: detectedDurationMs,
                                    duration: durationStr
                                  })
                                });

                                if (addRes.ok) {
                                  // 2. Play immediately
                                  const playRes = await fetch(`/api/rooms/${activeRoom.id}/music`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      action: "play",
                                      requestingUserId: user?.id,
                                      songId: songId,
                                      songName: cleanTitle,
                                      songArtist: "Uploaded Audio",
                                      songUrl: url,
                                      durationMs: detectedDurationMs
                                    })
                                  });
                                  if (playRes.ok) {
                                    const playBody = await playRes.json();
                                    setActiveRoom(playBody.room);
                                    triggerGlobalError(`🎵 "${cleanTitle}" successfully uploaded and synced to room playlist!`);
                                  }
                                }
                                // Remove background upload track
                                setBackgroundUploads(prev => prev.filter(item => item.id !== songId));
                              }).catch(err => {
                                console.error("Background upload failed:", err);
                                triggerGlobalError(`"${cleanTitle}" plays locally, but server sync failed.`);
                                setBackgroundUploads(prev => prev.filter(item => item.id !== songId));
                              });
                            });
                          } catch (err: any) {
                            console.error(err);
                            triggerGlobalError(err.message || "Failed uploading/playing track.");
                          }
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="mobile-media-uploader"
                        className="flex-1 py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-550 hover:to-indigo-600 active:scale-95 rounded-xl text-[8.5px] font-black text-white text-center cursor-pointer uppercase tracking-wider select-none transition-all duration-150 animate-pulse flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/15 border border-blue-400/20"
                      >
                        📼 {localMusicFileName ? `Uploading: ${localMusicFileName.substring(0, 18)}...` : "Select & Stream Audio Track"}
                      </label>
                      {localMusicFileName && (
                        <button
                          onClick={() => {
                            setLocalMusicFileName("");
                            triggerGlobalError("Cleared local track indicator.");
                          }}
                          className="p-1.5 px-2 text-[9px] bg-slate-950 border border-slate-800 text-gray-400 hover:text-white rounded-xl transition-all"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* OPTION 2: MUSIC STATION CATALOG & SEARCH */}
                  <div className="bg-slate-900/90 p-3 text-[9.5px] rounded-2xl border border-purple-500/25 flex flex-col gap-2 shadow-md">
                    <span className="font-extrabold uppercase tracking-wider text-purple-400 flex items-center gap-1.5 font-sans text-[10px]">
                      🎶 Option 2: Room's Persistent Playlist
                    </span>
                    
                    {/* Search Songs Input Bar */}
                    <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 px-3 py-1">
                      <Search className="w-3.5 h-3.5 text-gray-500 mr-2" />
                      <input
                        type="text"
                        placeholder="Search songs in room playlist..."
                        value={songSearchQuery}
                        onChange={(e) => setSongSearchQuery(e.target.value)}
                        className="w-full bg-transparent text-[9.5px] text-white outline-none placeholder-gray-500 font-medium h-5"
                      />
                      {songSearchQuery && (
                        <button
                          onClick={() => setSongSearchQuery("")}
                          className="text-gray-400 hover:text-white text-xs select-none"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Playlist items */}
                    <div className="flex flex-col gap-1.5 max-h-[150px] overflow-y-auto font-sans pr-0.5 scrollbar-thin">
                      {(!activeRoom.songs || activeRoom.songs.length === 0) ? (
                        <div className="p-4 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-[8px] text-gray-500 font-medium leading-relaxed">
                          No songs in Room Playlist. Choose an audio file in Option 1 to upload and play, or add one in Option 4!
                        </div>
                      ) : (
                        activeRoom.songs
                          .filter((song: any) => {
                            return (
                              song.name.toLowerCase().includes(songSearchQuery.toLowerCase()) ||
                              (song.artist && song.artist.toLowerCase().includes(songSearchQuery.toLowerCase()))
                            );
                          })
                          .map((song: any) => {
                            const isHost = activeRoom.ownerId === user?.id || activeRoom.admins?.includes(user?.id || "") || activeRoom.moderators?.includes(user?.id || "");
                            const isCurrentPlaying = activeRoom.musicState?.currentSongId === song.id;
                            return (
                              <div
                                key={song.id}
                                className={`flex justify-between items-center p-2 rounded-xl border transition-all ${
                                  isCurrentPlaying 
                                    ? "border-purple-500 bg-purple-950/25 shadow-sm shadow-purple-500/10" 
                                    : "border-slate-850 bg-slate-950/40 hover:bg-slate-950/70"
                                }`}
                              >
                                <div className="min-w-0 flex-1 pr-2 flex items-center gap-2">
                                  {isCurrentPlaying ? (
                                    <span className="text-[9px] animate-bounce">🎵</span>
                                  ) : (
                                    <span className="text-[8px] text-gray-600">▪</span>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[9.5px] text-gray-100 font-bold truncate leading-snug">
                                      {song.name}
                                    </p>
                                    <p className="text-[7.5px] text-purple-400/80 truncate font-medium">
                                      👤 {song.artist || "Uploaded Audio"} ({song.duration || "05:00"})
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-1.5 flex-shrink-0 font-sans items-center">
                                  {isHost && (
                                    <>
                                      {isCurrentPlaying ? (
                                        <button
                                          onClick={async () => {
                                            try {
                                              const res = await fetch(`/api/rooms/${activeRoom.id}/music`, {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({
                                                  action: "stop",
                                                  requestingUserId: user?.id,
                                                }),
                                              });
                                              if (res.ok) {
                                                const body = await res.json();
                                                setActiveRoom(body.room);
                                                triggerGlobalError(`Stopped streaming: "${song.name}"`);
                                              } else {
                                                const errData = await res.json();
                                                triggerGlobalError(errData.error || "Failed to stop song streaming.");
                                              }
                                            } catch (err) {
                                              console.error("Stop song error:", err);
                                            }
                                          }}
                                          className="px-2 py-0.5 text-[8px] font-black rounded-lg uppercase cursor-pointer bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-sm shadow-rose-600/15"
                                        >
                                          Stop
                                        </button>
                                      ) : (
                                        <button
                                          onClick={async () => {
                                            try {
                                              const res = await fetch(`/api/rooms/${activeRoom.id}/music`, {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({
                                                  action: "play",
                                                  requestingUserId: user?.id,
                                                  songId: song.id,
                                                  songName: song.name,
                                                  songArtist: song.artist || "Uploaded Audio",
                                                  songUrl: song.url,
                                                  durationMs: song.durMs || 300000,
                                                }),
                                              });
                                              if (res.ok) {
                                                const body = await res.json();
                                                setActiveRoom(body.room);
                                                triggerGlobalError(`Started streaming: "${song.name}"!`);
                                              } else {
                                                const errData = await res.json();
                                                triggerGlobalError(errData.error || "Failed to start song streaming.");
                                              }
                                            } catch (err) {
                                              console.error("Play song error:", err);
                                            }
                                          }}
                                          className="px-2 py-0.5 text-[8px] font-black rounded-lg uppercase cursor-pointer bg-emerald-500 hover:bg-emerald-450 text-slate-950 transition-all shadow-sm shadow-emerald-500/15"
                                        >
                                          Play
                                        </button>
                                      )}
                                      <button
                                        onClick={async () => {
                                          try {
                                            const res = await fetch(`/api/rooms/${activeRoom.id}/music`, {
                                              method: "POST",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify({
                                                action: "remove_persistent_song",
                                                requestingUserId: user?.id,
                                                songId: song.id,
                                              }),
                                            });
                                            if (res.ok) {
                                              const body = await res.json();
                                              setActiveRoom(body.room);
                                              triggerGlobalError(`Removed "${song.name}" from room playlist!`);
                                            } else {
                                              const errData = await res.json();
                                              triggerGlobalError(errData.error || "Failed to remove song.");
                                            }
                                          } catch (err) {
                                            console.error("Remove custom song error:", err);
                                          }
                                        }}
                                        className="p-1 text-[8.5px] bg-slate-950 border border-slate-800 text-red-400 hover:text-red-300 rounded-lg cursor-pointer transition-all hover:border-red-900"
                                        title="Remove from room playlist"
                                      >
                                        🗑️
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>

                  {/* OPTION 4: CREATE PLAYLIST CUSTOM SONG FORM FOR HOSTS/ADMINS */}
                  {(() => {
                    const isHost = activeRoom.ownerId === user?.id || activeRoom.admins?.includes(user?.id || "") || activeRoom.moderators?.includes(user?.id || "");
                    if (!isHost) return null;
                    return (
                      <div className="p-3 bg-slate-900/90 rounded-2xl border border-purple-500/25 text-xs flex flex-col gap-2 shadow-md">
                        <span className="text-[9px] font-extrabold tracking-wider text-purple-400 uppercase">
                          🎵 Option 3: Add New Song manually (Host Only)
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Song Title"
                            id="add-song-name-node"
                            className="bg-slate-950 border border-slate-800 p-1.5 text-[9px] text-white rounded-xl outline-none focus:border-purple-500/40 transition-all placeholder:text-gray-600 font-medium"
                          />
                          <input
                            type="text"
                            placeholder="Artist Name"
                            id="add-song-artist-node"
                            className="bg-slate-950 border border-slate-800 p-1.5 text-[9px] text-white rounded-xl outline-none focus:border-purple-500/40 transition-all placeholder:text-gray-600 font-medium"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Duration (e.g., 03:00)"
                            id="add-song-duration-node"
                            defaultValue="03:00"
                            className="bg-slate-950 border border-slate-800 p-1.5 text-[9px] text-white rounded-xl outline-none focus:border-purple-500/40 transition-all placeholder:text-gray-600 font-medium"
                          />
                          <input
                            type="text"
                            placeholder="Audio MP3 URL"
                            id="add-song-url-node"
                            defaultValue="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3"
                            className="bg-slate-950 border border-slate-800 p-1.5 text-[9px] text-white rounded-xl outline-none focus:border-purple-500/40 transition-all placeholder:text-gray-600 font-medium"
                          />
                        </div>
                        <button
                          onClick={async () => {
                            const nameEl = document.getElementById("add-song-name-node") as HTMLInputElement;
                            const artistEl = document.getElementById("add-song-artist-node") as HTMLInputElement;
                            const durEl = document.getElementById("add-song-duration-node") as HTMLInputElement;
                            const urlEl = document.getElementById("add-song-url-node") as HTMLInputElement;

                            if (nameEl && nameEl.value.trim() && artistEl && artistEl.value.trim()) {
                              const songNameVal = nameEl.value.trim();
                              const songArtistVal = artistEl.value.trim();
                              const songUrlVal = urlEl?.value.trim() || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3";

                              // Frontend duplicate song validation
                              const isDuplicate = activeRoom.songs?.some((s: any) => 
                                (s.url && s.url === songUrlVal) ||
                                (s.name.toLowerCase().trim() === songNameVal.toLowerCase().trim() && 
                                 s.artist.toLowerCase().trim() === songArtistVal.toLowerCase().trim())
                              );

                              if (isDuplicate) {
                                triggerGlobalError(`Duplicate song! "${songNameVal}" by "${songArtistVal}" already exists in Room Playlist. Remove it first.`);
                                return;
                              }

                              const parts = (durEl?.value || "03:00").split(":");
                              const durMs = ((parseInt(parts[0]) || 3) * 60 + (parseInt(parts[1]) || 0)) * 1000;
                              try {
                                const res = await fetch(`/api/rooms/${activeRoom.id}/music`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    action: "add_persistent_song",
                                    requestingUserId: user?.id,
                                    songId: "custom_" + Date.now(),
                                    songName: songNameVal,
                                    songArtist: songArtistVal,
                                    songUrl: songUrlVal,
                                    durationMs: durMs,
                                    duration: durEl?.value.trim() || "03:00"
                                  }),
                                });
                                if (res.ok) {
                                  const body = await res.json();
                                  setActiveRoom(body.room);
                                  triggerGlobalError(`Saved "${songNameVal}" persistently to Room's Playlist!`);
                                  nameEl.value = "";
                                  artistEl.value = "";
                                } else {
                                  const errData = await res.json();
                                  triggerGlobalError(errData.error || "Failed to add song.");
                                }
                              } catch (err) {
                                console.error("Add song error:", err);
                              }
                            } else {
                              triggerGlobalError("Song Title and Artist are required parameters.");
                            }
                          }}
                          className="w-full bg-gradient-to-r from-purple-650 to-indigo-650 hover:from-purple-550 hover:to-indigo-600 active:scale-95 font-extrabold text-[8px] uppercase tracking-wider py-2 rounded-xl text-white cursor-pointer transition-all border border-purple-500/20 shadow-md shadow-purple-500/10"
                        >
                          Add to Room Playlist (Persistent)
                        </button>
                      </div>
                    );
                  })()}

                </div>
              </div>
            )}

            {/* Dynamic Room Entertainment Game Center overlay */}
            {showGameCenter && activeRoom && (
              <div className="absolute inset-x-0 bottom-[104px] bg-slate-900 border-t border-amber-500 rounded-t-3xl p-4 flex flex-col gap-3.5 z-50 animate-slide-up text-slate-100 max-h-[380px] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      🎮 Room Entertainment Game Center
                    </h3>
                    <p className="text-[8px] text-gray-400 font-mono">
                      Live social party, board games and quizzes
                    </p>
                  </div>
                  <button
                    onClick={() => setShowGameCenter(false)}
                    className="text-gray-400 hover:text-white cursor-pointer p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Sub-panels for individual games based on state: selectedGame */}
                {(() => {
                  if (!selectedGame) {
                    return (
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {[
                          {
                            id: "ludo",
                            name: "🎲 Ludo Dice",
                            desc: "Roll dice & token boards",
                            color: "from-red-500 to-orange-500",
                          },
                          {
                            id: "ttt",
                            name: "❌ Tic Tac Toe",
                            desc: "Classic 3x3 strategy grid",
                            color: "from-blue-500 to-indigo-500",
                          },
                          {
                            id: "spin",
                            name: "🎡 Spin Wheel",
                            desc: "Spin to claim lucky points",
                            color: "from-yellow-500 to-amber-600",
                          },
                          {
                            id: "tod",
                            name: "🔥 Truth or Dare",
                            desc: "Social party challenge cards",
                            color: "from-rose-500 to-pink-600",
                          },
                          {
                            id: "draw",
                            name: "🎰 Lucky Draw",
                            desc: "Simulate cash sweepstakes",
                            color: "from-teal-500 to-emerald-600",
                          },
                          {
                            id: "quiz",
                            name: "🧠 Trivia Quiz",
                            desc: "Bangladesh and general facts",
                            color: "from-purple-500 to-fuchsia-600",
                          },
                          {
                            id: "greedy",
                            name: "🎡 Greedy Game",
                            desc: "Bet coins on fruit items",
                            color: "from-amber-500 to-yellow-600",
                          },
                        ].map((g) => (
                          <button
                            key={g.id}
                            onClick={() => setSelectedGame(g.id)}
                            className={`p-3 bg-gradient-to-br ${g.color} text-white rounded-2xl flex flex-col items-start gap-1 text-left transition-all hover:scale-103 active:scale-97 shadow-md border border-white/10 cursor-pointer`}
                          >
                            <span className="text-xs font-black uppercase tracking-wide leading-none">
                              {g.name}
                            </span>
                            <span className="text-[8.5px] opacity-80 leading-none">
                              {g.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    );
                  }

                  // Render Selected Game Box
                  return (
                    <div className="bg-slate-950 p-3 rounded-2xl border border-amber-500/15 flex flex-col gap-2 relative">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1">
                        <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider">
                          Active: {selectedGame.toUpperCase()} Game
                        </span>
                        <button
                          onClick={() => setSelectedGame(null)}
                          className="text-[8.5px] bg-slate-800 hover:bg-slate-700 text-gray-300 px-1.5 py-0.5 rounded font-black uppercase cursor-pointer"
                        >
                          ← Choose games
                        </button>
                      </div>

                      {/* GAME ENGINES */}

                      {/* 1. Ludo Engine */}
                      {selectedGame === "ludo" && <LudoGame />}

                      {/* 2. Tic Tac Toe Engine */}
                      {selectedGame === "ttt" && <TicTacToeGame />}

                      {/* 3. Spin Wheel Engine */}
                      {selectedGame === "spin" && <SpinWheelGame />}

                      {/* 4. Truth or Dare Engine */}
                      {selectedGame === "tod" && <TruthOrDareGame />}

                      {/* 5. Lucky Draw Engine */}
                      {selectedGame === "draw" && <LuckyDrawGame />}

                      {/* 6. Quiz Trivia Engine */}
                      {selectedGame === "quiz" && <QuizGame />}

                      {/* 7. Greedy Betting Engine */}
                      {selectedGame === "greedy" && (
                        <div className="p-4 text-center bg-slate-900/60 rounded-xl border border-amber-500/15 space-y-2">
                          <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">🎡 Greedy Pro Game is Open!</p>
                          <p className="text-[9px] text-gray-400">The game is currently running in a full-screen overlay so you can enjoy high-fidelity multiplayer betting without losing the voice room audio.</p>
                          <button
                            onClick={() => setSelectedGame(null)}
                            className="px-3 py-1 bg-red-950 hover:bg-red-900 text-red-400 border border-red-500/20 text-[9px] font-black uppercase rounded-lg transition-all active:scale-95 cursor-pointer"
                          >
                            Minimize Game
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ROYAL SUPREME VIP 95 ENTRANCE OVERLAY */}
            {royalEntrance && (
              <div className="absolute inset-0 bg-slate-950/90 z-50 flex flex-col items-center justify-center p-4 overflow-hidden animate-fade-in text-center">
                {/* Dynamic background aura rings */}
                {(() => {
                  const lvl = (royalEntrance as any).level || 1;
                  let borderCol = "border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.4)]";
                  let badgeGlow = "from-yellow-500 via-amber-500 to-yellow-300 shadow-yellow-500/20";
                  let subText = `"A noble guest has entered our room. Welcome!"`;
                  let crownEmoji = "👑";

                  if (lvl >= 10) {
                    borderCol = "border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.5)]";
                    badgeGlow = "from-red-600 via-yellow-500 to-rose-500 shadow-red-500/30";
                    subText = `"The Ultimate Emperor has descended. The entire room yields to absolute authority!"`;
                    crownEmoji = "🔥👑🔥";
                  } else if (lvl >= 7) {
                    borderCol = "border-purple-500 shadow-[0_0_35px_rgba(168,85,247,0.45)]";
                    badgeGlow = "from-purple-600 via-pink-500 to-cyan-400 shadow-purple-500/25";
                    subText = `"A magnificent Cosmic Star has arrived in our sky!"`;
                    crownEmoji = "🪐✨";
                  } else if (lvl >= 4) {
                    borderCol = "border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.4)]";
                    badgeGlow = "from-blue-600 via-indigo-500 to-yellow-500 shadow-blue-500/20";
                    subText = `"A premium VIP Guardian of EbadulChat has graced our room!"`;
                    crownEmoji = "⚡👑";
                  } else {
                    borderCol = "border-amber-700 shadow-[0_0_20px_rgba(180,83,9,0.3)]";
                    badgeGlow = "from-amber-700 via-slate-400 to-amber-500 shadow-amber-600/15";
                    subText = `"Welcome to the room! Thank you for gracing us with your presence."`;
                    crownEmoji = "🛡️";
                  }

                  return (
                    <>
                      <div className="absolute inset-0 bg-slate-950/80 z-[-1]"></div>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.95)_0%,rgba(2,6,23,0.99)_100%)] z-[-2]"></div>
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping"></div>
                        <div className="absolute top-1/3 right-1/4 w-3.5 h-3.5 bg-pink-500 rounded-full animate-bounce"></div>
                        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-purple-400 rounded-full animate-ping"></div>
                        <div className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-cyan-400 rounded-full animate-bounce"></div>
                      </div>

                      {/* Rotating crown halo */}
                      <div className="relative w-36 h-36 flex items-center justify-center mb-6">
                        <div className={`absolute inset-0 rounded-full border-4 border-dashed animate-[spin_10s_linear_infinite] ${borderCol}`}></div>
                        <div className="absolute -top-8 text-4xl animate-bounce">{crownEmoji}</div>
                        <div className="w-26 h-26 rounded-full overflow-hidden border-4 border-amber-400 p-1 bg-slate-900 shadow-xl relative z-10">
                          <img 
                            src={royalEntrance.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} 
                            alt="VIP Avatar" 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover rounded-full animate-pulse"
                          />
                        </div>
                      </div>

                      {/* Greetings and Titles */}
                      <div className="space-y-3 relative z-10 px-2 max-w-sm">
                        <span className={`bg-gradient-to-r text-slate-950 text-[11px] font-black uppercase px-4 py-1.5 rounded-full tracking-widest shadow-lg inline-block animate-pulse ${badgeGlow}`}>
                          ⚡️ { (royalEntrance as any).title || `${ (royalEntrance as any).vipLevel || 'VIP' } MEMBER` } ⚡️
                        </span>
                        
                        <h2 className="text-2xl font-black text-white tracking-tight uppercase leading-tight drop-shadow-md">
                          {royalEntrance.displayName}
                        </h2>
                        
                        <p className="text-yellow-400 text-sm font-black tracking-widest font-mono uppercase">
                          { (royalEntrance as any).entryBanner || "🔥 VIP User Entered The Room 🔥" }
                        </p>

                        <div className="w-56 h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent mx-auto mt-3"></div>

                        <p className="text-xs text-gray-300 font-medium italic pt-2 leading-relaxed">
                          {subText}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Luxury Gift store display inside active room */}
            {showGiftStore && (
              <div className="absolute inset-0 bg-slate-950/75 z-50 flex items-end animate-fade-in">
                <div className="w-full bg-slate-900 border-t border-yellow-500 rounded-t-3xl p-3.5 pb-[68px] max-h-[360px] overflow-y-auto flex flex-col gap-3 animate-slide-up">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-white">
                        Virtual Gift Vault
                      </h4>
                      <p className="text-[8px] text-gray-400 font-mono">
                        Your Gold: {(user.email === "ebadulhoque1234567890@gmail.com" || user.isGlobalAdmin) ? "∞ Unlimited" : `${user.coins} C`}
                      </p>
                    </div>

                    {/* Multi-Recipient Selectors */}
                    <div className="relative">
                      <button
                        onClick={() => setShowRecipientDropdown(!showRecipientDropdown)}
                        className="bg-slate-950 text-amber-400 font-bold hover:bg-slate-850 rounded-lg text-[9px] px-2.5 py-1.5 border border-slate-800 flex items-center gap-1 cursor-pointer select-none"
                      >
                        Recipients: {selectedReceiverIds.length === 0 ? "1 (Owner)" : `${selectedReceiverIds.length} Selected`} 👥
                      </button>

                      {showRecipientDropdown && (
                        <div className="absolute right-0 bottom-full mb-2 w-56 bg-slate-950 border border-amber-500/30 rounded-xl shadow-2xl p-2 z-55 flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                            <span className="text-[8px] font-black text-gray-400 uppercase">Select Recipients</span>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => {
                                  const allIds = getRoomOccupants().map(o => o.id);
                                  setSelectedReceiverIds(allIds);
                                }}
                                className="text-[7.5px] bg-slate-800 hover:bg-slate-700 text-white px-1.5 py-0.5 rounded font-bold cursor-pointer"
                              >
                                Select All
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedReceiverIds([]);
                                }}
                                className="text-[7.5px] bg-slate-800 hover:bg-slate-700 text-white px-1.5 py-0.5 rounded font-bold cursor-pointer"
                              >
                                Clear
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-1 max-h-[140px] overflow-y-auto pr-1">
                            {getRoomOccupants().map((occ) => {
                              const isChecked = selectedReceiverIds.includes(occ.id);
                              return (
                                <label key={occ.id} className="flex items-center gap-2 p-1 rounded hover:bg-slate-900 cursor-pointer text-left select-none">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setSelectedReceiverIds(prev => prev.filter(id => id !== occ.id));
                                      } else {
                                        setSelectedReceiverIds(prev => [...prev, occ.id]);
                                      }
                                    }}
                                    className="rounded border-slate-800 text-yellow-500 focus:ring-0 w-3 h-3 cursor-pointer"
                                  />
                                  <div className="flex flex-col leading-tight min-w-0 flex-1">
                                    <span className="text-[9.5px] text-gray-200 truncate font-semibold">
                                      {occ.displayName}
                                    </span>
                                    <span className="text-[6.5px] text-gray-400 uppercase tracking-tight">
                                      {occ.role}
                                    </span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setShowGiftStore(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  {/* Grid of gift item catalog */}
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {giftsCatalog.map((g) => (
                      <div
                        key={g.id}
                        onClick={() => handleSendGift(g.id)}
                        className="bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl p-2.5 flex flex-col items-center justify-between text-center cursor-pointer transition-all active:scale-95"
                      >
                        <span className="text-3xl animate-pulse">
                          {g.imageUrl}
                        </span>
                        <div className="mt-1.5">
                          <h5 className="text-[10px] text-gray-100 font-bold leading-none">
                            {g.name}
                          </h5>
                          <span className="text-[8.5px] text-yellow-400 font-mono font-bold mt-0.5 block">
                            {g.cost} Gold
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* EBADUL CREATOR ADMIN BYPASS MODAL OVERLAY */}
            {showAdminBypassPanel && (
              <div className="absolute inset-0 bg-slate-950/85 z-55 flex items-end animate-fade-in text-left">
                <div className="w-full bg-slate-900 border-t-2 border-yellow-500 rounded-t-3xl p-4 pb-[68px] max-h-[500px] overflow-y-auto flex flex-col gap-4 animate-slide-up">
                  {/* Header Title bar */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl">👑</span>
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-wider">
                          Creator Bypass Dashboard
                        </h4>
                        <p className="text-[8px] text-yellow-500 font-bold uppercase tracking-widest">
                          Limitless Super Admin Panel
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowAdminBypassPanel(false)}
                      className="text-gray-400 hover:text-white font-mono text-[10px] bg-slate-850 px-2 py-0.5 rounded border border-white/5"
                    >
                      Close ✕
                    </button>
                  </div>

                  {/* Tab Selector */}
                  <div className="flex gap-2 border-b border-white/5 pb-1">
                    <button
                      onClick={() => setActiveAdminTab("general")}
                      className={`text-[9px] font-black uppercase px-2.5 py-1 rounded transition-colors ${
                        activeAdminTab === "general"
                          ? "bg-yellow-500 text-slate-950"
                          : "bg-slate-950 hover:bg-slate-850 text-gray-400"
                      }`}
                    >
                      General & Rewards
                    </button>
                    <button
                      onClick={() => setActiveAdminTab("gifts")}
                      className={`text-[9px] font-black uppercase px-2.5 py-1 rounded transition-colors ${
                        activeAdminTab === "gifts"
                          ? "bg-yellow-500 text-slate-950"
                          : "bg-slate-950 hover:bg-slate-850 text-gray-400"
                      }`}
                    >
                      Manage Gifts
                    </button>
                    <button
                      onClick={() => setActiveAdminTab("vip")}
                      className={`text-[9px] font-black uppercase px-2.5 py-1 rounded transition-colors ${
                        activeAdminTab === "vip"
                          ? "bg-yellow-500 text-slate-950"
                          : "bg-slate-950 hover:bg-slate-850 text-gray-400"
                      }`}
                    >
                      Manage VIPs
                    </button>
                  </div>

                  {/* TAB 1: GENERAL */}
                  {activeAdminTab === "general" && (
                    <div className="space-y-4">
                      {/* Section 1: Official Room configuration toggle */}
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5 space-y-2">
                        <span className="text-[8.5px] text-yellow-400 font-black uppercase tracking-wider block">
                          Room Status Configuration
                        </span>
                        <div className="flex items-center justify-between gap-2 bg-slate-900 p-2 rounded-lg border border-white/5">
                          <div>
                            <p className="text-[10px] text-white font-bold">
                              Official Room Designation
                            </p>
                            <p className="text-[8px] text-gray-500 font-medium">
                              Status: {activeRoom.isOfficial ? "🌟 OFFICIAL ACTIVE" : "⚠️ REGULAR USER ROOM"}
                            </p>
                          </div>
                          <button
                            onClick={handleToggleOfficial}
                            className={`text-[9px] font-black uppercase px-2.5 py-1 rounded transition-colors ${
                              activeRoom.isOfficial 
                                ? "bg-rose-500 hover:bg-rose-600 text-white" 
                                : "bg-amber-500 hover:bg-amber-600 text-slate-950"
                            }`}
                          >
                            {activeRoom.isOfficial ? "Remove Official ⚠️" : "Make Official 👑"}
                          </button>
                        </div>
                      </div>

                      {/* Section 2: Give Free Rewards */}
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5 space-y-2.5">
                        <span className="text-[8.5px] text-cyan-400 font-black uppercase tracking-wider block">
                          Divine Rewards Machine (Free Gems/Coins)
                        </span>
                        
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-[9px]">
                            <div>
                              <label className="text-gray-400 block mb-1">Target Account:</label>
                              <select
                                value={adminRewardTarget}
                                onChange={(e) => setAdminRewardTarget(e.target.value)}
                                className="w-full bg-slate-900 text-white text-[9.5px] p-1 rounded border border-white/5"
                              >
                                <option value="me">Myself ({user.displayName})</option>
                                {/* Online members in room */}
                                {activeRoom.seats
                                  .filter(s => s.userId && s.userId !== user.id)
                                  .map(s => (
                                    <option key={s.index} value={s.userId!}>
                                      {s.userProfile?.displayName} (Seat {s.index + 1})
                                    </option>
                                  ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-gray-400 block mb-1">Reward Type:</label>
                              <select
                                value={adminRewardType}
                                onChange={(e: any) => setAdminRewardType(e.target.value)}
                                className="w-full bg-slate-900 text-white text-[9.5px] p-1 rounded border border-white/5"
                              >
                                <option value="diamonds">Diamonds 💎</option>
                                <option value="coins">Coins 🪙</option>
                                <option value="level">User Level ⭐</option>
                                <option value="vipLevel">VIP Level 👑</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex gap-2 text-[9px] items-center">
                            <div className="flex-1">
                              <label className="text-gray-400 block mb-1">Reward Amount:</label>
                              <input
                                type="number"
                                value={adminRewardAmount}
                                onChange={(e) => setAdminRewardAmount(e.target.value)}
                                className="w-full bg-slate-900 text-white text-[9.5px] p-1 rounded border border-white/5"
                              />
                            </div>
                            <button
                              onClick={handleGrantReward}
                              className="mt-4 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 text-white font-black uppercase text-[9.5px] px-3.5 py-1.5 rounded-lg border border-cyan-400/20 active:scale-95 transition-all"
                            >
                              Send Reward 🚀
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Force Moderation list */}
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5 space-y-2">
                        <span className="text-[8.5px] text-rose-400 font-black uppercase tracking-wider block">
                          Limitless Moderation Control (Bypass any Host!)
                        </span>

                        <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                          {/* Active audience list */}
                          {activeRoom.seats
                            .filter(s => s.userProfile && s.userId !== user.id)
                            .map(s => (
                              <div key={s.index} className="flex items-center justify-between p-1.5 bg-slate-900 rounded border border-white/5 animate-fade-in">
                                <span className="text-[9.5px] text-white font-bold truncate max-w-[120px]">
                                  {s.userProfile?.displayName} (Seat {s.index + 1})
                                </span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleInstantModerate(s.userId!, "kick_user")}
                                    className="text-[8px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/25"
                                  >
                                    Kick 🚫
                                  </button>
                                  <button
                                    onClick={() => handleInstantModerate(s.userId!, "ban")}
                                    className="text-[8px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/25"
                                  >
                                    Ban ❌
                                  </button>
                                </div>
                              </div>
                            ))}
                          {!activeRoom.seats.some(s => s.userProfile && s.userId !== user.id) && (
                            <p className="text-[8px] text-gray-500 italic text-center py-1">No other participants currently seated in this room.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: MANAGE GIFTS */}
                  {activeAdminTab === "gifts" && (
                    <div className="space-y-4">
                      {/* Add/Edit Gift Form */}
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5 space-y-2">
                        <span className="text-[9px] text-yellow-400 font-black uppercase tracking-wider block">
                          {editingGiftId ? "📝 Edit Gift" : "➕ Add New Gift Item"}
                        </span>
                        
                        <div className="grid grid-cols-2 gap-2 text-[9px]">
                          <div>
                            <label className="text-gray-400 block mb-1">Gift ID (Optional):</label>
                            <input
                              type="text"
                              value={editingGiftId}
                              onChange={(e) => setEditingGiftId(e.target.value)}
                              placeholder="e.g. custom_car"
                              disabled={!!editingGiftId}
                              className="w-full bg-slate-900 text-white text-[9.5px] p-1.5 rounded border border-white/5"
                            />
                          </div>
                          <div>
                            <label className="text-gray-400 block mb-1">Gift Name:</label>
                            <input
                              type="text"
                              value={editingGiftName}
                              onChange={(e) => setEditingGiftName(e.target.value)}
                              placeholder="e.g. Space Ship"
                              className="w-full bg-slate-900 text-white text-[9.5px] p-1.5 rounded border border-white/5"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-[9px]">
                          <div>
                            <label className="text-gray-400 block mb-1">Cost (Coins):</label>
                            <input
                              type="number"
                              value={editingGiftCost}
                              onChange={(e) => setEditingGiftCost(e.target.value)}
                              placeholder="100"
                              className="w-full bg-slate-900 text-white text-[9.5px] p-1.5 rounded border border-white/5"
                            />
                          </div>
                          <div>
                            <label className="text-gray-400 block mb-1">Image/Emoji:</label>
                            <input
                              type="text"
                              value={editingGiftImageUrl}
                              onChange={(e) => setEditingGiftImageUrl(e.target.value)}
                              placeholder="🚀"
                              className="w-full bg-slate-900 text-white text-[9.5px] p-1.5 rounded border border-white/5"
                            />
                          </div>
                          <div>
                            <label className="text-gray-400 block mb-1">Anim Type:</label>
                            <select
                              value={editingGiftAnimType}
                              onChange={(e) => setEditingGiftAnimType(e.target.value)}
                              className="w-full bg-slate-900 text-white text-[9.5px] p-1.5 rounded border border-white/5"
                            >
                              <option value="2d">Standard (2D)</option>
                              <option value="flying">Flying Particle</option>
                              <option value="luxury">Luxury Car Slide</option>
                              <option value="full_screen">Full Screen Special</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[9px]">
                          <div>
                            <label className="text-gray-400 block mb-1">Category:</label>
                            <select
                              value={editingGiftCategory}
                              onChange={(e) => setEditingGiftCategory(e.target.value)}
                              className="w-full bg-slate-900 text-white text-[9.5px] p-1.5 rounded border border-white/5"
                            >
                              <option value="small">Small Gift</option>
                              <option value="couple">Couple Gift</option>
                              <option value="premium">Premium Reward</option>
                              <option value="luxury">Luxury Elite</option>
                              <option value="festival">Festival Special</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-gray-400 block mb-1">CSS Class Effect:</label>
                            <input
                              type="text"
                              value={editingGiftEffectClass}
                              onChange={(e) => setEditingGiftEffectClass(e.target.value)}
                              placeholder="animate-rose / animate-car"
                              className="w-full bg-slate-900 text-white text-[9.5px] p-1.5 rounded border border-white/5"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-1">
                          {editingGiftId && (
                            <button
                              onClick={() => {
                                setEditingGiftId("");
                                setEditingGiftName("");
                                setEditingGiftCost("");
                                setEditingGiftImageUrl("");
                                setEditingGiftAnimType("2d");
                                setEditingGiftCategory("small");
                                setEditingGiftEffectClass("");
                              }}
                              className="text-[9px] bg-slate-800 text-white px-2.5 py-1 rounded"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              if (!editingGiftName || !editingGiftCost) {
                                triggerGlobalError("Name and Cost are required!");
                                return;
                              }
                              try {
                                const res = await fetch("/api/admin/gifts", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    adminUserId: user.id,
                                    id: editingGiftId || undefined,
                                    name: editingGiftName,
                                    cost: parseInt(editingGiftCost) || 1,
                                    imageUrl: editingGiftImageUrl,
                                    animationType: editingGiftAnimType,
                                    category: editingGiftCategory,
                                    effectClass: editingGiftEffectClass
                                  })
                                });
                                if (res.ok) {
                                  triggerGlobalError("Gift saved successfully! Real-time clients updated.");
                                  setEditingGiftId("");
                                  setEditingGiftName("");
                                  setEditingGiftCost("");
                                  setEditingGiftImageUrl("");
                                  setEditingGiftAnimType("2d");
                                  setEditingGiftCategory("small");
                                  setEditingGiftEffectClass("");
                                  fetchGifts();
                                } else {
                                  const d = await res.json();
                                  triggerGlobalError(d.error || "Failed to save gift.");
                                }
                              } catch (err: any) {
                                triggerGlobalError(err.message);
                              }
                            }}
                            className="text-[9px] bg-yellow-500 text-slate-950 font-bold px-3.5 py-1 rounded hover:bg-yellow-400"
                          >
                            {editingGiftId ? "Save Changes" : "Create Gift Item"}
                          </button>
                        </div>
                      </div>

                      {/* Gifts Catalog List */}
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5 space-y-2">
                        <span className="text-[9px] text-cyan-400 font-black uppercase tracking-wider block">
                          Current Active Gifts Store ({giftsCatalog.length})
                        </span>
                        <div className="space-y-1 max-h-[140px] overflow-y-auto">
                          {giftsCatalog.map(g => (
                            <div key={g.id} className="flex items-center justify-between p-1.5 bg-slate-900 rounded border border-white/5 text-[9.5px]">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm">{g.imageUrl}</span>
                                <div>
                                  <p className="text-white font-bold">{g.name} <span className="text-gray-500 font-normal">({g.id})</span></p>
                                  <p className="text-yellow-500 font-semibold">{g.cost} coins • {g.animationType} • {g.category}</p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setEditingGiftId(g.id);
                                    setEditingGiftName(g.name);
                                    setEditingGiftCost(g.cost.toString());
                                    setEditingGiftImageUrl(g.imageUrl);
                                    setEditingGiftAnimType(g.animationType || "2d");
                                    setEditingGiftCategory(g.category || "small");
                                    setEditingGiftEffectClass(g.effectClass || "");
                                  }}
                                  className="text-[8px] font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/25"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!confirm(`Are you sure you want to delete ${g.name}?`)) return;
                                    try {
                                      const res = await fetch(`/api/admin/gifts/${g.id}?adminUserId=${user.id}`, {
                                        method: "DELETE"
                                      });
                                      if (res.ok) {
                                        triggerGlobalError(`Gift ${g.name} deleted successfully!`);
                                        fetchGifts();
                                      }
                                    } catch (err: any) {
                                      triggerGlobalError(err.message);
                                    }
                                  }}
                                  className="text-[8px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded border border-rose-500/25"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: MANAGE VIPS */}
                  {activeAdminTab === "vip" && (
                    <div className="space-y-4">
                      {/* Add/Edit VIP Level Form */}
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5 space-y-2">
                        <span className="text-[9px] text-yellow-400 font-black uppercase tracking-wider block">
                          ➕ Create or Update VIP Tier (Levels 1 to 10)
                        </span>
                        
                        <div className="grid grid-cols-2 gap-2 text-[9px]">
                          <div>
                            <label className="text-gray-400 block mb-1">VIP Numeric Level (1-10):</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={editingVipLevel}
                              onChange={(e) => setEditingVipLevel(e.target.value)}
                              placeholder="e.g. 5"
                              className="w-full bg-slate-900 text-white text-[9.5px] p-1.5 rounded border border-white/5"
                            />
                          </div>
                          <div>
                            <label className="text-gray-400 block mb-1">VIP Title / Name:</label>
                            <input
                              type="text"
                              value={editingVipTitle}
                              onChange={(e) => setEditingVipTitle(e.target.value)}
                              placeholder="e.g. Gold Sovereign"
                              className="w-full bg-slate-900 text-white text-[9.5px] p-1.5 rounded border border-white/5"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-[9px]">
                          <div>
                            <label className="text-gray-400 block mb-1">Recharge (USD):</label>
                            <input
                              type="number"
                              value={editingVipMinRecharge}
                              onChange={(e) => setEditingVipMinRecharge(e.target.value)}
                              placeholder="250"
                              className="w-full bg-slate-900 text-white text-[9.5px] p-1.5 rounded border border-white/5"
                            />
                          </div>
                          <div>
                            <label className="text-gray-400 block mb-1">Badge Icon:</label>
                            <input
                              type="text"
                              value={editingVipBadge}
                              onChange={(e) => setEditingVipBadge(e.target.value)}
                              placeholder="👑🥇"
                              className="w-full bg-slate-900 text-white text-[9.5px] p-1.5 rounded border border-white/5"
                            />
                          </div>
                          <div>
                            <label className="text-gray-400 block mb-1">Entry Sound:</label>
                            <select
                              value={editingVipEntrySound}
                              onChange={(e) => setEditingVipEntrySound(e.target.value)}
                              className="w-full bg-slate-900 text-white text-[9.5px] p-1.5 rounded border border-white/5"
                            >
                              <option value="bronze">Bronze Chime</option>
                              <option value="silver">Silver Harp</option>
                              <option value="gold">Golden Arpeggio</option>
                              <option value="diamond">Diamond Bright</option>
                              <option value="cosmic">Cosmic Rising</option>
                              <option value="emperor">Ultimate Emperor</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[9px]">
                          <div>
                            <label className="text-gray-400 block mb-1">Avatar Frame Glow CSS:</label>
                            <input
                              type="text"
                              value={editingVipFrameStyle}
                              onChange={(e) => setEditingVipFrameStyle(e.target.value)}
                              placeholder="border-yellow-400 animate-pulse"
                              className="w-full bg-slate-900 text-white text-[9.5px] p-1.5 rounded border border-white/5"
                            />
                          </div>
                          <div>
                            <label className="text-gray-400 block mb-1">Chat Bubble Bg CSS:</label>
                            <input
                              type="text"
                              value={editingVipChatStyle}
                              onChange={(e) => setEditingVipChatStyle(e.target.value)}
                              placeholder="bg-yellow-950/30 text-yellow-100"
                              className="w-full bg-slate-900 text-white text-[9.5px] p-1.5 rounded border border-white/5"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-gray-400 block mb-1 text-[9px]">Fullscreen Entry Banner Msg:</label>
                          <input
                            type="text"
                            value={editingVipEntryBanner}
                            onChange={(e) => setEditingVipEntryBanner(e.target.value)}
                            placeholder="🔥 VIP User Entered The Room 🔥"
                            className="w-full bg-slate-900 text-white text-[9.5px] p-1.5 rounded border border-white/5"
                          />
                        </div>

                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            onClick={async () => {
                              if (!editingVipLevel || !editingVipTitle) {
                                triggerGlobalError("VIP Level (number) and VIP Title are required!");
                                return;
                              }
                              try {
                                const res = await fetch("/api/admin/vip-levels", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    adminUserId: user.id,
                                    level: parseInt(editingVipLevel),
                                    title: editingVipTitle,
                                    minRechargeUsd: parseInt(editingVipMinRecharge) || 0,
                                    badgeIcon: editingVipBadge,
                                    profileFrameStyle: editingVipFrameStyle,
                                    chatBubbleStyle: editingVipChatStyle,
                                    entryBanner: editingVipEntryBanner,
                                    entrySound: editingVipEntrySound
                                  })
                                });
                                if (res.ok) {
                                  triggerGlobalError("VIP Level configuration saved! Real-time clients updated.");
                                  setEditingVipLevel("");
                                  setEditingVipTitle("");
                                  setEditingVipMinRecharge("");
                                  setEditingVipBadge("");
                                  setEditingVipFrameStyle("");
                                  setEditingVipChatStyle("");
                                  setEditingVipEntryBanner("");
                                  setEditingVipEntrySound("bronze");
                                  fetchVipLevels();
                                } else {
                                  const d = await res.json();
                                  triggerGlobalError(d.error || "Failed to save VIP level.");
                                }
                              } catch (err: any) {
                                triggerGlobalError(err.message);
                              }
                            }}
                            className="text-[9px] bg-yellow-500 text-slate-950 font-bold px-3.5 py-1 rounded hover:bg-yellow-400"
                          >
                            Save VIP Configuration
                          </button>
                        </div>
                      </div>

                      {/* VIP Levels List */}
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5 space-y-2">
                        <span className="text-[9px] text-cyan-400 font-black uppercase tracking-wider block">
                          Current Active VIP Tiers ({adminVipList.length})
                        </span>
                        <div className="space-y-1 max-h-[140px] overflow-y-auto">
                          {adminVipList.map(v => (
                            <div key={v.level} className="flex items-center justify-between p-1.5 bg-slate-900 rounded border border-white/5 text-[9.5px]">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm">{v.badgeIcon || "👑"}</span>
                                <div>
                                  <p className="text-white font-bold">Level {v.level}: {v.title}</p>
                                  <p className="text-gray-400 font-medium">${v.minRechargeUsd} USD • Sound: {v.entrySound}</p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setEditingVipLevel(v.level.toString());
                                    setEditingVipTitle(v.title);
                                    setEditingVipMinRecharge(v.minRechargeUsd.toString());
                                    setEditingVipBadge(v.badgeIcon || "");
                                    setEditingVipFrameStyle(v.profileFrameStyle || "");
                                    setEditingVipChatStyle(v.chatBubbleStyle || "");
                                    setEditingVipEntryBanner(v.entryBanner || "");
                                    setEditingVipEntrySound(v.entrySound || "bronze");
                                  }}
                                  className="text-[8px] font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/25"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!confirm(`Are you sure you want to delete Level ${v.level}?`)) return;
                                    try {
                                      const res = await fetch(`/api/admin/vip-levels/${v.level}?adminUserId=${user.id}`, {
                                        method: "DELETE"
                                      });
                                      if (res.ok) {
                                        triggerGlobalError(`VIP Level ${v.level} deleted successfully!`);
                                        fetchVipLevels();
                                      }
                                    } catch (err: any) {
                                      triggerGlobalError(err.message);
                                    }
                                  }}
                                  className="text-[8px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded border border-rose-500/25"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Seat Invite Notification Banner / Popup */}
            {seatInvite && (
              <div className="absolute inset-x-2 bottom-16 bg-slate-900 border-2 border-purple-500 rounded-2xl p-3.5 shadow-2xl z-55 animate-bounce">
                <div className="flex flex-col gap-2 font-sans">
                  <span className="text-[11px] text-slate-200 font-bold flex items-center gap-1.5">
                    💌{" "}
                    <span className="text-purple-400 font-black">
                      Seat Invitation
                    </span>{" "}
                    from {seatInvite.inviterName}:
                  </span>
                  <p className="text-[10px] text-gray-300">
                    You have been invited to sit on locked voice mic **Seat #
                    {seatInvite.seatIndex}**. Accept the request to start
                    streaming?
                  </p>
                  <div className="flex justify-end gap-2 text-[10px] mt-1">
                    <button
                      onClick={() => {
                        if (socketRef.current && user && seatInvite.inviterId) {
                          socketRef.current.emit("seat:invite_reject", {
                            roomId: seatInvite.roomId,
                            userId: user.id,
                            inviterUserId: seatInvite.inviterId,
                          });
                        }
                        setSeatInvite(null);
                      }}
                      className="px-3 py-1 bg-slate-950 text-rose-400 hover:text-rose-300 font-bold rounded-lg cursor-pointer transition-all border border-rose-950"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        if (socketRef.current && user) {
                          socketRef.current.emit("seat:invite_accept", {
                            roomId: seatInvite.roomId,
                            userId: user.id,
                            seatIndex: seatInvite.seatIndex,
                          });
                        }
                        setSeatInvite(null);
                      }}
                      className="px-4 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black rounded-lg uppercase cursor-pointer"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* FULL SCREEN OVERLAY FOR GREEDY PRO GAME */}
            {selectedGame === "greedy" && (
              <div className="absolute inset-0 bg-slate-950/95 z-[100] flex flex-col p-3 animate-slide-up h-full w-full overflow-y-auto">
                <GreedyProGame
                  roomId={activeRoom.id}
                  user={user}
                  onUpdateDiamonds={(newBalance) => {
                    if (user) {
                      onSetUser({ ...user, diamonds: newBalance });
                    }
                  }}
                  onClose={() => setSelectedGame(null)}
                />
              </div>
            )}

            {/* IN-ROOM CHAT OVERLAY */}
            {roomPrivateChatOverlay && (
              <div className="absolute inset-0 bg-slate-950 z-[90] flex flex-col p-3 pb-[70px] animate-in slide-in-from-bottom duration-200">
                {/* Overlay Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2 shrink-0">
                  <span className="text-[10px] font-black text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                    💬 Private Message Overlay
                  </span>
                  <button
                    onClick={() => {
                      setRoomPrivateChatOverlay(false);
                      setCurrentChatUser(null);
                    }}
                    className="p-1 px-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-[9px] font-black uppercase transition-colors"
                  >
                    Close ✕
                  </button>
                </div>

                {currentChatUser ? (
                  <div className="flex-1 flex flex-col justify-between h-full bg-slate-950 overflow-hidden">
                    {/* Chat window Header */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-2.5 shrink-0">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setCurrentChatUser(null);
                            setShowPrivatePhotoPicker(false);
                          }}
                          className="p-1 hover:bg-slate-900 rounded-full text-gray-300"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="relative">
                          <img
                            src={currentChatUser.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                            alt={currentChatUser.displayName}
                            className="w-8 h-8 rounded-full object-cover border border-slate-800"
                          />
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-950"></span>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold leading-none text-white">
                            {currentChatUser.displayName}
                          </h4>
                          <span className="text-[8px] text-emerald-400 font-mono">Active on Chat</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setAutoOpenRelationship(true);
                            setUserProfileView(currentChatUser);
                          }}
                          className="w-7 h-7 rounded-lg bg-pink-500/15 hover:bg-pink-500/30 border border-pink-500/40 flex items-center justify-center text-pink-400 hover:text-pink-300 transition-all active:scale-90 shadow-[0_0_8px_rgba(236,72,153,0.2)] cursor-pointer animate-pulse"
                          title="Connect Relationship 💞"
                        >
                          <Heart className="w-3.5 h-3.5 fill-pink-500/30 text-pink-400" />
                        </button>
                        <span className="text-[7px] uppercase font-bold text-slate-500 tracking-widest font-mono hidden min-[360px]:inline">SECURE</span>
                      </div>
                    </div>

                    {/* Relationship Progress Bar Banner */}
                    {activeRelationshipForChat && activeRelationshipForChat.type && (
                      <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/20 p-2 rounded-lg mb-2.5 flex items-center justify-between text-[10px] shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">
                            {activeRelationshipForChat.type === "couple" ? "❤️" :
                             activeRelationshipForChat.type === "homies" ? "🤝" :
                             activeRelationshipForChat.type === "best_friend" ? "💙" :
                             activeRelationshipForChat.type === "brother" ? "🛡️" :
                             activeRelationshipForChat.type === "sister" ? "🌸" :
                             activeRelationshipForChat.type === "family" ? "👨‍👩‍👧" : "💖"}
                          </span>
                          <div>
                            <span className="font-extrabold text-pink-400 capitalize block leading-none">
                              {activeRelationshipForChat.type.replace("_", " ")} Bond
                            </span>
                            <span className="text-[8px] text-gray-400">Level {activeRelationshipForChat.level}</span>
                          </div>
                        </div>

                        <div className="flex-1 max-w-[120px] mx-3">
                          <div className="flex justify-between text-[8px] text-gray-400 mb-0.5 font-mono">
                            <span>Streak: 🔥 {activeRelationshipForChat.streakDays || 0}d</span>
                            <span>{activeRelationshipForChat.points} / {activeRelationshipForChat.pointsNextLevel} XP</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="h-full bg-pink-500 rounded-full transition-all" 
                              style={{ width: `${Math.min(100, Math.max(5, (activeRelationshipForChat.points / activeRelationshipForChat.pointsNextLevel) * 100))}%` }}
                            ></div>
                          </div>
                        </div>

                        <span className="text-[8px] bg-pink-500/20 text-pink-400 px-1.5 py-0.5 rounded font-black uppercase">
                          +{activeRelationshipForChat.level} Perks
                        </span>
                      </div>
                    )}

                    {/* Message logs list scroll area */}
                    <div className="flex-1 overflow-y-auto px-1 flex flex-col gap-2 pb-3 font-sans scrollbar-thin">
                      {(() => {
                        const thread = privateThreads.find(t => t.id === currentChatUser.id);
                        const messages = thread ? thread.messages : [
                          { id: "wel1", senderId: currentChatUser.id, senderName: currentChatUser.displayName, avatarUrl: currentChatUser.avatarUrl, content: "Hello! Let's connect on EbadulChat and play games!", timestamp: "Just Now" }
                        ];
                        return messages.map((m: any) => {
                          const isMe = m.senderId === user.id || m.senderId === "me";
                          return (
                            <div
                              key={m.id}
                              className={`flex gap-1.5 max-w-[85%] ${isMe ? "self-end flex-row-reverse" : "self-start"}`}
                            >
                              {!isMe && (
                                <img
                                  src={m.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                                  className="w-5 h-5 rounded-full object-cover mt-0.5 cursor-pointer hover:scale-105 hover:opacity-90 transition-all"
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(
                                        `/api/users/${currentChatUser.id}?requestingUserId=${user?.id || ""}`,
                                      );
                                      if (res.ok) {
                                        const data = await res.json();
                                        setUserProfileView(data);
                                      }
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }}
                                />
                              )}
                              <div>
                                <div
                                  onClick={async () => {
                                    if (isMe) return;
                                    try {
                                      const res = await fetch(
                                        `/api/users/${currentChatUser.id}?requestingUserId=${user?.id || ""}`,
                                      );
                                      if (res.ok) {
                                        const data = await res.json();
                                        setUserProfileView(data);
                                      }
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }}
                                  className={`p-2.5 rounded-2xl text-[10.5px] leading-normal ${
                                    isMe
                                      ? "bg-indigo-600 text-white rounded-tr-none shadow"
                                      : "bg-slate-900 text-slate-100 rounded-tl-none border border-white/5 cursor-pointer hover:bg-slate-805 transition-colors"
                                  }`}
                                >
                                  {m.photoUrl && (
                                    <img
                                      src={m.photoUrl}
                                      alt="Attached shared"
                                      className="max-w-[150px] rounded-lg mb-1 object-cover border border-white/10"
                                      referrerPolicy="no-referrer"
                                    />
                                  )}
                                  {m.content && <p className="whitespace-pre-wrap break-all">{m.content}</p>}
                                </div>
                                <span className="text-[7.5px] text-gray-500 block mt-0.5 px-1 uppercase font-mono text-right">
                                  {m.timestamp}
                                </span>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {(() => {
                      const weFollowTarget = user.badges?.includes(`following_${currentChatUser.id}`);
                      const isFriend = ["ebadul", "rahul", "sarah", "nabila", "mod"].includes(currentChatUser.id) || weFollowTarget;
                      
                      return (
                        <>
                          {/* PHOTO PICKER DRAWER */}
                          {showPrivatePhotoPicker && isFriend && (
                            <div className="bg-slate-900 border border-white/10 p-2.5 rounded-xl mb-2 flex flex-col gap-2 shrink-0 animate-scale-up">
                              <div className="flex items-center justify-between">
                                <span className="text-[9.5px] font-black text-teal-400 uppercase tracking-wider flex items-center gap-1">
                                  📷 Choose Photo to Send
                                </span>
                                <button
                                  onClick={() => setShowPrivatePhotoPicker(false)}
                                  className="text-gray-400 hover:text-white text-[10px] uppercase font-bold"
                                >
                                  Close
                                </button>
                              </div>

                              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                                {[
                                  { name: "Crown 👑", url: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=300&q=80" },
                                  { name: "Gaming 🎮", url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=80" },
                                  { name: "Bouquet 💐", url: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=300&q=80" },
                                  { name: "Sunset 🌅", url: "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=300&q=80" },
                                  { name: "Cute Cat 🐱", url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=300&q=80" },
                                ].map((img, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      handleSendPrivateMessage(currentChatUser.id, img.url);
                                      setShowPrivatePhotoPicker(false);
                                      triggerGlobalError("Photo sent successfully! ✅");
                                    }}
                                    className="flex flex-col items-center gap-1 shrink-0 group border border-white/5 p-1 rounded-lg hover:border-teal-400 transition-colors bg-slate-950/60"
                                  >
                                    <img
                                      src={img.url}
                                      alt={img.name}
                                      className="w-12 h-12 rounded object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                    <span className="text-[8px] text-gray-300 font-bold group-hover:text-teal-400">{img.name}</span>
                                  </button>
                                ))}
                              </div>

                              {/* Custom URL Input */}
                              <div className="flex gap-1.5 items-center">
                                <input
                                  type="text"
                                  id="custom-img-url-input-overlay"
                                  placeholder="Or paste any custom image URL..."
                                  className="flex-1 bg-slate-950 text-[9px] text-white rounded border border-slate-800 px-2 py-1 focus:border-teal-400 outline-none"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      const val = (e.currentTarget as HTMLInputElement).value;
                                      if (val.trim()) {
                                        handleSendPrivateMessage(currentChatUser.id, val.trim());
                                        e.currentTarget.value = "";
                                        setShowPrivatePhotoPicker(false);
                                        triggerGlobalError("Custom Photo sent! ✅");
                                      }
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    const input = document.getElementById("custom-img-url-input-overlay") as HTMLInputElement;
                                    if (input && input.value.trim()) {
                                      handleSendPrivateMessage(currentChatUser.id, input.value.trim());
                                      input.value = "";
                                      setShowPrivatePhotoPicker(false);
                                      triggerGlobalError("Custom Photo sent! ✅");
                                    }
                                  }}
                                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-2.5 py-1 rounded text-[8.5px] font-black uppercase"
                                >
                                  Send
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Message typed Input text */}
                          <div className="flex gap-1.5 items-center bg-slate-900/60 p-1.5 rounded-xl border border-white/5 shrink-0 mt-2">
                            <button
                              onClick={() => {
                                if (!isFriend) {
                                  triggerGlobalError("❌ Only Friends can send photos! Please follow them first from their Profile.");
                                } else {
                                  setShowPrivatePhotoPicker(prev => !prev);
                                }
                              }}
                              className={`p-1.5 rounded-lg transition-colors flex items-center justify-center shrink-0 ${
                                isFriend 
                                  ? "text-teal-400 hover:text-teal-300 hover:bg-slate-800" 
                                  : "text-gray-600 hover:text-gray-500"
                              }`}
                              title="Send Photo (Friends Only)"
                            >
                              <Image className="w-4 h-4" />
                            </button>

                            <input
                              type="text"
                              value={privateInput}
                              onChange={(e) => setPrivateInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSendPrivateMessage(currentChatUser.id);
                                }
                              }}
                              placeholder={`Type message to ${currentChatUser.displayName}...`}
                              className="flex-1 bg-slate-950 text-[10.5px] text-white rounded-lg border border-slate-800 focus:border-amber-500 outline-none px-2.5 py-1.5 placeholder-slate-600"
                            />
                            <button
                              onClick={() => handleSendPrivateMessage(currentChatUser.id)}
                              className="p-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:from-amber-400 hover:to-yellow-405 font-black uppercase text-[10.5px] rounded-lg shadow cursor-pointer flex items-center justify-center transition-transform active:scale-95 shrink-0"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 h-full overflow-hidden">
                    {/* Inbox header */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                        📬 Personal Inbox Messages
                      </h3>
                      <p className="text-[7.5px] text-gray-500 font-mono uppercase font-bold">
                        EbadulChat Encrypted Communication Network
                      </p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative shrink-0">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-gray-500">
                        <Search className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="text"
                        placeholder="Search direct threads, admins or hosts..."
                        className="w-full bg-slate-900 text-[10px] text-white rounded-xl pl-8 pr-3 py-2 outline-none border border-slate-850 focus:border-indigo-500 placeholder-slate-500 transition-colors"
                      />
                    </div>

                    {/* Inbox Threads Cards List */}
                    <div className="flex-1 overflow-y-auto flex flex-col gap-2 mt-1 pb-16 scrollbar-thin">
                      {privateThreads.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-xs">No private threads yet.</div>
                      ) : (
                        privateThreads.map((thread) => {
                          const lastMsg = thread.messages[thread.messages.length - 1];
                          return (
                            <div
                              key={thread.id}
                              onClick={() => {
                                setPrivateThreads(prev =>
                                  prev.map(t => (t.id === thread.id ? { ...t, unread: false } : t))
                                );
                                setCurrentChatUser({
                                  id: thread.id,
                                  displayName: thread.name,
                                  avatarUrl: thread.avatarUrl
                                } as any);
                              }}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-850 hover:bg-slate-900 hover:border-indigo-500/20 transition-all cursor-pointer relative"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="relative shrink-0">
                                  <img
                                    src={thread.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                                    alt={thread.name}
                                    className="w-9 h-9 rounded-full object-cover border border-slate-850"
                                    referrerPolicy="no-referrer"
                                  />
                                  {thread.unread && (
                                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
                                  )}
                                </div>
                                <div className="min-w-0 text-left">
                                  <h4 className="text-xs font-black text-white leading-tight flex items-center gap-1.5">
                                    {thread.name}
                                    {thread.unread && (
                                      <span className="text-[7px] bg-rose-500/20 text-rose-400 font-extrabold px-1 rounded uppercase">NEW</span>
                                    )}
                                  </h4>
                                  <p className="text-[9px] text-gray-400 truncate mt-0.5 max-w-[150px]">
                                    {lastMsg?.photoUrl ? "📷 Shared Photo" : lastMsg?.content}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[7.5px] font-mono text-gray-500 shrink-0 uppercase">{lastMsg?.timestamp || "Just Now"}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ROUTE: WALLET STORE COIN/DIAMOND MENUS */}
        {mobileRoute === "wallet" && user && (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
              <button
                onClick={() => setMobileRoute("explore")}
                className="p-1.5 text-gray-300 hover:text-white bg-slate-950/50 rounded-full"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-xs font-black text-white tracking-widest uppercase">
                EbadulChat Gifting Wallet
              </h3>
            </div>

            {/* Big Wallet Cards */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-gradient-to-br from-yellow-600 via-amber-700 to-amber-900 border border-amber-500/20 p-3.5 rounded-2xl shadow-md text-white flex flex-col justify-between h-24">
                <span className="text-[9px] uppercase tracking-wider font-extrabold">
                  Gold Coins Wallet
                </span>
                <div>
                  <div className="text-sm font-mono font-black">
                    {(user.email === "ebadulhoque1234567890@gmail.com" || user.isGlobalAdmin) ? "∞ Unlimited" : user.coins.toLocaleString()}
                  </div>
                  <span className="text-[8px] text-yellow-100">
                    For sending virtual gifts
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-cyan-600 via-blue-700 to-indigo-900 border border-cyan-500/20 p-3.5 rounded-2xl shadow-md text-white flex flex-col justify-between h-24">
                <span className="text-[9px] uppercase tracking-wider font-extrabold">
                  Received Diamonds
                </span>
                <div>
                  <div className="text-sm font-mono font-black">
                    {(user.email === "ebadulhoque1234567890@gmail.com" || user.isGlobalAdmin) ? "∞ Unlimited" : user.diamonds.toLocaleString()}
                  </div>
                  <span className="text-[8px] text-cyan-100">
                    Can cash out to cash
                  </span>
                </div>
              </div>
            </div>

            {/* DIVINE DIAMOND GIFT EXCLUSIVE ADMIN FORM */}
            {(user.email === "ebadulhoque1234567890@gmail.com" || user.isGlobalAdmin) && (
              <div className="mb-5">
                {!isDiamondGiftOpen ? (
                  <div
                    onClick={() => {
                      setIsDiamondGiftOpen(true);
                      setDiamondGiftStep(1);
                      setDiamondGiftAmount("");
                      setDiamondGiftTargetId("");
                    }}
                    className="p-3.5 bg-gradient-to-r from-yellow-500/20 via-amber-500/10 to-transparent border border-yellow-500/40 rounded-2xl cursor-pointer hover:bg-yellow-500/35 transition-all flex items-center justify-between shadow-lg text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl animate-bounce">🎁</span>
                      <div>
                        <h4 className="text-xs font-black text-yellow-400 uppercase tracking-wider">
                          Diamond Gift
                        </h4>
                        <p className="text-[8.5px] text-gray-300">
                          Send free unlimited diamonds to any user ID instantly!
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-yellow-500 font-extrabold">OPEN ➜</span>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-slate-900 via-purple-950/20 to-slate-900 p-4 rounded-2xl border-2 border-yellow-500/60 shadow-[0_0_20px_rgba(234,179,8,0.25)] text-left relative overflow-hidden">
                    <div className="absolute -right-8 -top-8 w-20 h-20 bg-yellow-500/10 rounded-full blur-xl pointer-events-none"></div>
                    
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">💎</span>
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider">
                            Diamond Gift Portal
                          </h4>
                          <span className="text-[7.5px] text-yellow-500 font-bold uppercase tracking-widest font-mono">
                            Step {diamondGiftStep} of 2 • Free Gifting Console
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsDiamondGiftOpen(false)}
                        className="text-gray-400 hover:text-white text-[9px] font-bold uppercase tracking-wider bg-slate-950 px-2 py-1 rounded border border-white/5"
                      >
                        Cancel ✕
                      </button>
                    </div>

                    {/* Step 1: Input Diamond Amount */}
                    {diamondGiftStep === 1 && (
                      <div className="space-y-3.5">
                        <div>
                          <label className="text-[9px] font-black text-yellow-400 uppercase block mb-1">
                            Enter Diamond Amount
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              placeholder="e.g. 5000"
                              value={diamondGiftAmount}
                              onChange={(e) => setDiamondGiftAmount(e.target.value)}
                              className="w-full bg-slate-950 text-white text-xs p-2.5 rounded-xl border border-slate-800 focus:border-yellow-500 outline-none pr-12 font-bold"
                              autoFocus
                            />
                            <span className="absolute right-3 top-3 text-[10px] font-black text-cyan-400">
                              DIAMONDS
                            </span>
                          </div>
                          <p className="text-[8px] text-gray-400 leading-normal mt-1.5 uppercase font-medium">
                            Enter how many diamonds you want to give away for free. No payment or bank details required!
                          </p>
                        </div>

                        {/* Next Button only appears once a valid amount is entered */}
                        {Number(diamondGiftAmount) > 0 && (
                          <button
                            onClick={() => setDiamondGiftStep(2)}
                            className="w-full py-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-[0_4px_12px_rgba(234,179,8,0.2)] flex items-center justify-center gap-1"
                          >
                            Next Option ➜
                          </button>
                        )}
                      </div>
                    )}

                    {/* Step 2: Input Receiver ID */}
                    {diamondGiftStep === 2 && (
                      <div className="space-y-3.5">
                        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 mb-1 flex items-center justify-between">
                          <span className="text-[9px] font-bold text-gray-400 uppercase">Selected Gift:</span>
                          <span className="text-xs font-black text-cyan-400 font-mono">💎 {Number(diamondGiftAmount).toLocaleString()} Diamonds</span>
                        </div>

                        <div>
                          <label className="text-[9px] font-black text-yellow-400 uppercase block mb-1">
                            Receiver Profile ID (Username or ID Number)
                          </label>
                          <input
                            type="text"
                            placeholder="Enter username or numeric ID..."
                            value={diamondGiftTargetId}
                            onChange={(e) => setDiamondGiftTargetId(e.target.value)}
                            className="w-full bg-slate-950 text-white text-xs p-2.5 rounded-xl border border-slate-800 focus:border-yellow-500 outline-none font-bold"
                            autoFocus
                          />
                          <p className="text-[8px] text-gray-400 leading-normal mt-1.5 uppercase font-medium">
                            Paste the exact unique profile ID of the person who should receive these diamonds.
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setDiamondGiftStep(1)}
                            className="flex-1 py-2 bg-slate-950 hover:bg-slate-900 text-gray-400 hover:text-white text-[9.5px] font-black uppercase rounded-xl border border-slate-800 transition-all"
                          >
                            ⬅ Back
                          </button>
                          <button
                            onClick={handleSendDiamondGift}
                            disabled={isSubmittingDiamondGift || !diamondGiftTargetId.trim()}
                            className="flex-[2] py-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-black uppercase text-[10px] tracking-wider rounded-xl transition-all shadow-[0_4px_12px_rgba(234,179,8,0.2)] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5"
                          >
                            {isSubmittingDiamondGift ? "Processing Gifting... 🚀" : "Submit & Send 💎🚀"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Premium UPI Diamond Store */}
            <div className="mb-5 bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 p-4 rounded-2xl border-2 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] text-left">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">💎</span>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      Premium Diamond Store
                    </h4>
                    <p className="text-[7.5px] text-cyan-400 font-bold uppercase tracking-widest font-mono">
                      Secure UPI Payments • instant delivery
                    </p>
                  </div>
                </div>
                <span className="bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">
                  AUTO COIN BONUS
                </span>
              </div>

              {/* Creator Account Warning / Badge */}
              {user.email === "ebadulhoque1234567890@gmail.com" && (
                <div className="mb-3.5 p-2 bg-yellow-500/10 border border-yellow-500/35 rounded-xl flex items-center gap-2">
                  <span className="text-base animate-pulse">👑</span>
                  <div>
                    <span className="text-[8.5px] font-black text-yellow-400 uppercase block font-sans">
                      Creator Account Detected!
                    </span>
                    <p className="text-[7.5px] text-gray-300">
                      All diamond plans are 100% FREE. Tap any pack to credit instantly without payment!
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                {DIAMOND_PRICING_PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => handleSelectDiamondPlan(plan)}
                    className="flex items-center justify-between p-3 bg-slate-950 hover:bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl cursor-pointer active:scale-95 transition-all relative overflow-hidden"
                  >
                    {/* Hot offer badge on specific plans */}
                    {(plan.id === "d500" || plan.id === "d1000" || plan.id === "d2000" || plan.id === "d5000") && (
                      <div className="absolute right-0 top-0 bg-rose-600 text-[6.5px] font-black text-white px-2 py-0.5 rounded-bl-lg uppercase tracking-widest">
                        HOT OFFER
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                        <span className="text-base">💎</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white">
                            {plan.diamonds.toLocaleString()} Diamonds
                          </span>
                          <span className="text-[7.5px] text-gray-400 font-bold">
                            (+{plan.coins.toLocaleString()} Coins)
                          </span>
                        </div>
                        <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block">
                          {plan.description}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black px-3 py-1.5 rounded-lg text-[10px] shadow-md flex items-center gap-0.5">
                        ₹{plan.inr}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ROUTE: LUCKY SPIN SCREEN */}
        {mobileRoute === "spin" && user && (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
            <div className="w-full flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
              <button
                onClick={() => setMobileRoute("explore")}
                className="p-1.5 text-gray-300 hover:text-white bg-slate-950/50 rounded-full"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Lucky Wheel Rewards
              </h3>
            </div>

            <div className="text-center mt-3 max-w-xs flex flex-col items-center">
              <span className="text-[80px] leading-none animate-spin-slow inline-block my-5 select-none font-sans drop-shadow-[0_10px_25px_rgba(245,158,11,0.4)]">
                🎡
              </span>

              <h4 className="text-sm font-black text-white">
                Daily Attendance & Spin Area
              </h4>
              <p className="text-[10px] text-gray-400 mt-1 mb-5">
                Spin costs 50 gold. Maximum payout up to 1,000 premium Gold
                Coins instantly!
              </p>

              <button
                onClick={handleLuckySpin}
                className="w-full py-3.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-xs uppercase shadow-xl tracking-widest active:scale-95 transition-all mb-4"
              >
                🎯 SPIN THE WHEEL! (50 Coins)
              </button>

              <button
                onClick={handleDailyCheckIn}
                className="w-full py-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-white text-[11px] rounded-xl font-bold transition-all"
              >
                📅 CLAIM DAILY CHECK-IN REWARD (+150 Coins)
              </button>
            </div>
          </div>
        )}

        {/* ROUTE: ELITE FAMILIES CENTER */}
        {mobileRoute === "family" && user && (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
              <button
                onClick={() => setMobileRoute("explore")}
                className="p-1.5 text-gray-300 hover:text-white bg-slate-950/50 rounded-full"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                EbadulChat Elite Families
              </h3>
            </div>

            {user.familyId ? (
              <div className="p-4 bg-gradient-to-br from-indigo-900/60 to-purple-950/60 rounded-2xl border border-indigo-500/20 text-center flex flex-col items-center">
                <span className="text-5xl my-2">🦁</span>
                <h4 className="text-sm font-black text-yellow-400 uppercase">
                  {user.familyName}
                </h4>
                <p className="text-[10px] text-purple-200 mt-1 max-w-[200px]">
                  Active family. High perforamce singing and top hierarchy
                  ranking.
                </p>
                <div className="bg-slate-950 px-3 py-1 rounded-full text-[9px] font-mono font-bold mt-3 border border-indigo-500/30">
                  MEMBER STATUS: VERIFIED
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-[10px] text-gray-400">
                  Join a majestic performance family circle to get exclusive
                  entrance effects and special group chat permissions.
                </p>

                <h4 className="text-xs font-black text-white uppercase border-b border-slate-800 pb-1 mt-2">
                  Available Families
                </h4>

                <div className="flex flex-col gap-2.5">
                  {familiesCatalog.map((fam) => (
                    <div
                      key={fam.id}
                      className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{fam.logoUrl}</span>
                        <div>
                          <h5 className="text-[11px] text-gray-100 font-bold">
                            {fam.name}
                          </h5>
                          <span className="text-[8.5px] text-gray-400 font-medium">
                            Rank #{fam.ranking} • {fam.memberCount} MBRS
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleJoinFamilyCircle(fam.id)}
                        className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-[10px] font-bold px-3 py-1 rounded-full uppercase"
                      >
                        Join
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ROUTE: DIRECT PRIVATE CHATS INBOX */}
        {mobileRoute === "chats" && user && (
          <div className="flex-1 overflow-hidden p-3 pb-[70px] flex flex-col bg-slate-950 text-slate-100 font-sans h-full relative">
            {currentChatUser ? (
              <div className="flex-1 flex flex-col justify-between h-full bg-slate-950 overflow-hidden">
                {/* Chat window Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-2.5 shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCurrentChatUser(null);
                        setShowPrivatePhotoPicker(false);
                      }}
                      className="p-1 hover:bg-slate-900 rounded-full text-gray-300"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="relative">
                      <img
                        src={currentChatUser.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                        alt={currentChatUser.displayName}
                        className="w-8 h-8 rounded-full object-cover border border-slate-800"
                      />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-950"></span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold leading-none text-white">
                        {currentChatUser.displayName}
                      </h4>
                      <span className="text-[8px] text-emerald-400 font-mono">Active on Chat</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setAutoOpenRelationship(true);
                        setUserProfileView(currentChatUser);
                      }}
                      className="w-7 h-7 rounded-lg bg-pink-500/15 hover:bg-pink-500/30 border border-pink-500/40 flex items-center justify-center text-pink-400 hover:text-pink-300 transition-all active:scale-90 shadow-[0_0_8px_rgba(236,72,153,0.2)] cursor-pointer animate-pulse"
                      title="Connect Relationship 💞"
                    >
                      <Heart className="w-3.5 h-3.5 fill-pink-500/30 text-pink-400" />
                    </button>
                    <span className="text-[7px] uppercase font-bold text-slate-500 tracking-widest font-mono hidden min-[360px]:inline">SECURE</span>
                  </div>
                </div>

                {/* Message logs list scroll area */}
                <div className="flex-1 overflow-y-auto px-1 flex flex-col gap-2 pb-3 font-sans scrollbar-thin">
                  {(() => {
                    const thread = privateThreads.find(t => t.id === currentChatUser.id);
                    const messages = thread ? thread.messages : [
                      { id: "wel1", senderId: currentChatUser.id, senderName: currentChatUser.displayName, avatarUrl: currentChatUser.avatarUrl, content: "Hello! Let's connect on EbadulChat and play games!", timestamp: "Just Now" }
                    ];
                    return messages.map((m: any) => {
                      const isMe = m.senderId === user.id || m.senderId === "me";
                      return (
                        <div
                          key={m.id}
                          className={`flex gap-1.5 max-w-[85%] ${isMe ? "self-end flex-row-reverse" : "self-start"}`}
                        >
                          {!isMe && (
                            <img
                              src={m.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                              className="w-5 h-5 rounded-full object-cover mt-0.5 cursor-pointer hover:scale-105 hover:opacity-90 transition-all"
                              onClick={async () => {
                                try {
                                  const res = await fetch(
                                    `/api/users/${currentChatUser.id}?requestingUserId=${user?.id || ""}`,
                                  );
                                  if (res.ok) {
                                    const data = await res.json();
                                    setUserProfileView(data);
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                            />
                          )}
                          <div>
                            <div
                              onClick={async () => {
                                if (isMe) return;
                                try {
                                  const res = await fetch(
                                    `/api/users/${currentChatUser.id}?requestingUserId=${user?.id || ""}`,
                                  );
                                  if (res.ok) {
                                    const data = await res.json();
                                    setUserProfileView(data);
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className={`p-2.5 rounded-2xl text-[10.5px] leading-normal ${
                                isMe
                                  ? "bg-indigo-600 text-white rounded-tr-none shadow"
                                  : "bg-slate-900 text-slate-100 rounded-tl-none border border-white/5 cursor-pointer hover:bg-slate-805 transition-colors"
                              }`}
                            >
                              {m.photoUrl && (
                                <img
                                  src={m.photoUrl}
                                  alt="Attached shared"
                                  className="max-w-[150px] rounded-lg mb-1 object-cover border border-white/10"
                                  referrerPolicy="no-referrer"
                                />
                              )}
                              {m.content && <p className="whitespace-pre-wrap break-all">{m.content}</p>}
                            </div>
                            <span className="text-[7.5px] text-gray-500 block mt-0.5 px-1 uppercase font-mono text-right">
                              {m.timestamp}
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {(() => {
                  const weFollowTarget = user.badges?.includes(`following_${currentChatUser.id}`);
                  const isFriend = ["ebadul", "rahul", "sarah", "nabila", "mod"].includes(currentChatUser.id) || weFollowTarget;
                  
                  return (
                    <>
                      {/* PHOTO PICKER DRAWER */}
                      {showPrivatePhotoPicker && isFriend && (
                        <div className="bg-slate-900 border border-white/10 p-2.5 rounded-xl mb-2 flex flex-col gap-2 shrink-0 animate-scale-up">
                          <div className="flex items-center justify-between">
                            <span className="text-[9.5px] font-black text-teal-400 uppercase tracking-wider flex items-center gap-1">
                              📷 Choose Photo to Send
                            </span>
                            <button
                              onClick={() => setShowPrivatePhotoPicker(false)}
                              className="text-gray-400 hover:text-white text-[10px] uppercase font-bold"
                            >
                              Close
                            </button>
                          </div>

                          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                            {[
                              { name: "Crown 👑", url: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=300&q=80" },
                              { name: "Gaming 🎮", url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=80" },
                              { name: "Bouquet 💐", url: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=300&q=80" },
                              { name: "Sunset 🌅", url: "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=300&q=80" },
                              { name: "Cute Cat 🐱", url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=300&q=80" },
                            ].map((img, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  handleSendPrivateMessage(currentChatUser.id, img.url);
                                  setShowPrivatePhotoPicker(false);
                                  triggerGlobalError("Photo sent successfully! ✅");
                                }}
                                className="flex flex-col items-center gap-1 shrink-0 group border border-white/5 p-1 rounded-lg hover:border-teal-400 transition-colors bg-slate-950/60"
                              >
                                <img
                                  src={img.url}
                                  alt={img.name}
                                  className="w-12 h-12 rounded object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <span className="text-[8px] text-gray-300 font-bold group-hover:text-teal-400">{img.name}</span>
                              </button>
                            ))}
                          </div>

                          {/* Custom URL Input */}
                          <div className="flex gap-1.5 items-center">
                            <input
                              type="text"
                              id="custom-img-url-input"
                              placeholder="Or paste any custom image URL..."
                              className="flex-1 bg-slate-950 text-[9px] text-white rounded border border-slate-800 px-2 py-1 focus:border-teal-400 outline-none"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  const val = (e.currentTarget as HTMLInputElement).value;
                                  if (val.trim()) {
                                    handleSendPrivateMessage(currentChatUser.id, val.trim());
                                    e.currentTarget.value = "";
                                    setShowPrivatePhotoPicker(false);
                                    triggerGlobalError("Custom Photo sent! ✅");
                                  }
                                }
                              }}
                            />
                            <button
                              onClick={() => {
                                const input = document.getElementById("custom-img-url-input") as HTMLInputElement;
                                if (input && input.value.trim()) {
                                  handleSendPrivateMessage(currentChatUser.id, input.value.trim());
                                  input.value = "";
                                  setShowPrivatePhotoPicker(false);
                                  triggerGlobalError("Custom Photo sent! ✅");
                                }
                              }}
                              className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-2.5 py-1 rounded text-[8.5px] font-black uppercase"
                            >
                              Send
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Message typed Input text */}
                      <div className="flex gap-1.5 items-center bg-slate-900/60 p-1.5 rounded-xl border border-white/5 shrink-0 mt-2">
                        <button
                          onClick={() => {
                            if (!isFriend) {
                              triggerGlobalError("❌ Only Friends can send photos! Please follow them first from their Profile.");
                            } else {
                              setShowPrivatePhotoPicker(prev => !prev);
                            }
                          }}
                          className={`p-1.5 rounded-lg transition-colors flex items-center justify-center shrink-0 ${
                            isFriend 
                              ? "text-teal-400 hover:text-teal-300 hover:bg-slate-800" 
                              : "text-gray-600 hover:text-gray-500"
                          }`}
                          title="Send Photo (Friends Only)"
                        >
                          <Image className="w-4 h-4" />
                        </button>

                        <input
                          type="text"
                          value={privateInput}
                          onChange={(e) => setPrivateInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSendPrivateMessage(currentChatUser.id);
                            }
                          }}
                          placeholder={`Type message to ${currentChatUser.displayName}...`}
                          className="flex-1 bg-slate-950 text-[10.5px] text-white rounded-lg border border-slate-800 focus:border-amber-500 outline-none px-2.5 py-1.5 placeholder-slate-600"
                        />
                        <button
                          onClick={() => handleSendPrivateMessage(currentChatUser.id)}
                          className="p-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:from-amber-400 hover:to-yellow-405 font-black uppercase text-[10.5px] rounded-lg shadow cursor-pointer flex items-center justify-center transition-transform active:scale-95 shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="flex flex-col gap-3 h-full overflow-hidden">
                {/* Inbox header */}
                <div className="flex flex-col gap-1 shrink-0">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    📬 Personal Inbox Messages
                  </h3>
                  <p className="text-[7.5px] text-gray-500 font-mono uppercase font-bold">
                    EbadulChat Encrypted Communication Network
                  </p>
                </div>

                {/* Search Bar */}
                <div className="relative shrink-0">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-gray-500">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search direct threads, admins or hosts..."
                    className="w-full bg-slate-900 text-[10px] text-white rounded-xl pl-8 pr-3 py-2 outline-none border border-slate-850 focus:border-indigo-500 placeholder-slate-500 transition-colors"
                  />
                </div>

                {/* Inbox Threads Cards List */}
                <div className="flex-1 overflow-y-auto flex flex-col gap-2 mt-1 pb-16 scrollbar-thin">
                  {privateThreads.map((thread) => {
                    const lastMsg = thread.messages[thread.messages.length - 1];
                    return (
                      <div
                        key={thread.id}
                        onClick={() => {
                          setPrivateThreads(prev =>
                            prev.map(t => (t.id === thread.id ? { ...t, unread: false } : t))
                          );
                          setCurrentChatUser({
                            id: thread.id,
                            displayName: thread.name,
                            avatarUrl: thread.avatarUrl
                          } as any);
                        }}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all hover:bg-slate-900/60 ${
                          thread.unread
                            ? "bg-slate-900/80 border-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.05)]"
                            : "bg-slate-900/30 border-slate-850"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative shrink-0">
                            <img
                              src={thread.avatarUrl}
                              alt={thread.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-800"
                            />
                            {thread.status === "online" && (
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950"></span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-[11px] font-black text-gray-100 truncate flex items-center gap-1">
                              {thread.name}
                            </h4>
                            <p className="text-[9px] text-gray-400 truncate mt-0.5 pr-2">
                              {lastMsg ? lastMsg.content : "No messages yet"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0 gap-1 font-mono">
                          <span className="text-[7.5px] text-gray-500 uppercase">
                            {lastMsg ? lastMsg.timestamp : ""}
                          </span>
                          {thread.unread && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ROUTE: PROFILE EDIT SETUP SCREEN */}
        {mobileRoute === "profile" && user && (
          <UserProfileModal
            profile={user}
            loggedInUser={user}
            startOpenRelationshipCenter={autoOpenRelationship}
            onClose={() => {
              setMobileRoute("explore");
              setAutoOpenRelationship(false);
            }}
            onSetUser={onSetUser}
            onInitiatePrivateChat={(targetUser) => {
              setCurrentChatUser(targetUser);
              if (mobileRoute === "room") {
                setRoomPrivateChatOverlay(true);
              } else {
                setMobileRoute("chats");
              }
            }}
            onTeleportToRoom={(roomId) => {
              handleJoinRoom(roomId);
            }}
            onGlobalMessage={(txt) => {
              triggerGlobalError(txt);
            }}
            activeRoom={activeRoom}
            onModerationAction={handleRoomModeration}
            onLogout={handleLogout}
            onMentionUser={(mentionName) => {
              setMessageInput((prev) => {
                const trimmed = prev.trim();
                return trimmed ? `@${mentionName} ${trimmed}` : `@${mentionName} `;
              });
              setTimeout(() => {
                const el = document.getElementById("chat-input");
                if (el) {
                  el.focus();
                }
              }, 120);
            }}
          />
        )}

        {/* BOTTOM INTEGRATED MOBILE NAVIGATION BAR */}
        {mobileRoute !== "login" && mobileRoute !== "permissions" && user && (
          <div className="absolute bottom-6 inset-x-0 h-10 bg-slate-950 border-t border-white/5 flex items-center justify-around text-gray-400 select-none z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.5)]">
            {/* Rooms button */}
            <button
              onClick={() => {
                setRoomPrivateChatOverlay(false);
                setMobileRoute("explore");
              }}
              className={`flex-1 py-1 flex flex-col items-center justify-center transition-all cursor-pointer ${
                mobileRoute === "explore"
                  ? "text-yellow-400 scale-105"
                  : "hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="text-[7.5px] font-black uppercase tracking-wider mt-0.5">Rooms</span>
            </button>

            {/* Room button (Active Room) */}
            {activeRoom && (
              <button
                onClick={() => {
                  setRoomPrivateChatOverlay(false);
                  setMobileRoute("room");
                }}
                className={`flex-1 py-1 flex flex-col items-center justify-center transition-all cursor-pointer ${
                  mobileRoute === "room" && !roomPrivateChatOverlay
                    ? "text-yellow-400 scale-105"
                    : "hover:text-white"
                }`}
              >
                <Mic className="w-4 h-4" />
                <span className="text-[7.5px] font-black uppercase tracking-wider mt-0.5">Room</span>
              </button>
            )}

            {/* Message button */}
            <button
              onClick={() => {
                if (mobileRoute === "room") {
                  setRoomPrivateChatOverlay(true);
                } else {
                  setMobileRoute("chats");
                }
              }}
              className={`flex-1 py-1 flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                mobileRoute === "chats" || (mobileRoute === "room" && roomPrivateChatOverlay)
                  ? "text-yellow-400 scale-105"
                  : "hover:text-white"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
                {privateThreads.filter(t => t.unread).length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-sans text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-slate-950 animate-bounce">
                    {privateThreads.filter(t => t.unread).length}
                  </span>
                )}
              </div>
              <span className="text-[7.5px] font-black uppercase tracking-wider mt-0.5">Message</span>
            </button>

            {/* Me button */}
            <button
              onClick={() => {
                setRoomPrivateChatOverlay(false);
                setMobileRoute("profile");
              }}
              className={`flex-1 py-1 flex flex-col items-center justify-center transition-all cursor-pointer ${
                mobileRoute === "profile"
                  ? "text-yellow-400 scale-105"
                  : "hover:text-white"
              }`}
            >
              <User className="w-4 h-4" />
              <span className="text-[7.5px] font-black uppercase tracking-wider mt-0.5">Me</span>
            </button>
          </div>
        )}

        {/* SIMULATED DEVICE SOFT/HARDWARE NAVIGATION BAR */}
        {mobileRoute !== "login" && mobileRoute !== "permissions" && user && (
          <div className="absolute bottom-0 inset-x-0 h-6 bg-slate-950/90 backdrop-blur-md flex items-center justify-around border-t border-white/5 text-gray-400 select-none z-40">
            {/* Back Icon */}
            <button
              onClick={handleBackNavigation}
              className="px-6 py-1 hover:text-white transition-colors active:scale-95 flex items-center justify-center cursor-pointer"
              title="Back / Minimize"
            >
              <ChevronLeft className="w-4 h-4 text-gray-400 hover:text-white transition-colors" />
            </button>
            {/* Home Icon */}
            <button
              onClick={() => {
                if (mobileRoute !== "explore") {
                  setMobileRoute("explore");
                }
              }}
              className="px-6 py-1 hover:text-white transition-colors active:scale-95 flex items-center justify-center cursor-pointer"
              title="Home (Explore)"
            >
              <div className="w-3 h-3 rounded-full border border-gray-400 hover:border-white transition-colors"></div>
            </button>
            {/* Recents Icon */}
            <button
              onClick={() => {
                triggerGlobalError(`System Online • ${activeRoom ? "Voice Room Minimized" : "Lobby Active"}`);
              }}
              className="px-6 py-1 hover:text-white transition-colors active:scale-95 flex items-center justify-center cursor-pointer"
              title="System Status"
            >
              <div className="w-2.5 h-2.5 border border-gray-400 hover:border-white transition-colors rounded-sm"></div>
            </button>
          </div>
        )}

        {/* FLOATING MINIMIZED ROOM BUBBLE */}
        {activeRoom && mobileRoute !== "room" && (
          <div
            style={{ left: `${bubblePos.x}px`, top: `${bubblePos.y}px` }}
            className="absolute z-50 flex flex-col items-center select-none"
            onMouseDown={handleBubbleDragStart}
            onTouchStart={handleBubbleDragStart}
          >
            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLeaveRoom();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="absolute -top-1 -right-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-1 shadow-lg z-50 transition-all border border-white/10 cursor-pointer"
              title="Close & Leave Room"
            >
              <X className="w-2.5 h-2.5 font-bold" />
            </button>

            {/* Main Bubble */}
            <div
              onClick={(e) => {
                if (isDraggingBubbleRef.current) {
                  e.stopPropagation();
                  e.preventDefault();
                  return;
                }
                setMobileRoute("room");
              }}
              className="w-14 h-14 rounded-full bg-slate-900 border-2 border-yellow-400 p-0.5 cursor-pointer shadow-[0_4px_20px_rgba(250,204,21,0.3)] relative group overflow-hidden flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            >
              {/* Glowing background ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 animate-spin-slow opacity-70"></div>

              {/* Inner image container */}
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-950 relative z-10 flex items-center justify-center">
                {activeRoom.backgroundUrl || activeRoom.ownerAvatarUrl ? (
                  <img
                    src={activeRoom.backgroundUrl || activeRoom.ownerAvatarUrl}
                    alt={activeRoom.name}
                    className="w-full h-full object-cover animate-spin-extra-slow"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white uppercase tracking-wider">
                    {activeRoom.name.slice(0, 2)}
                  </div>
                )}

                {/* Microphone icon / Wave animation */}
                <div className="absolute bottom-1 right-1 bg-yellow-400 text-slate-950 rounded-full p-0.5 shadow-md">
                  <Mic className="w-2.5 h-2.5 animate-pulse" />
                </div>

                {/* Spinning music note */}
                <div className="absolute top-1 left-1 bg-purple-500 text-white rounded-full p-0.5 shadow-md">
                  <Music className="w-2 h-2 animate-bounce" />
                </div>
              </div>
            </div>

            {/* Small room status tag */}
            <div className="mt-1 bg-slate-950/90 border border-yellow-400/30 text-yellow-400 text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full backdrop-blur-sm shadow-md truncate max-w-[80px]">
              {activeRoom.name}
            </div>
          </div>
        )}

        {showGlobalSearchModal && (
          <div className="absolute inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3.5 shadow-2xl animate-scale-up font-sans text-left">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-black text-purple-400 flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-purple-400 animate-pulse" />
                  Search Room or Profile
                </span>
                <button
                  onClick={() => {
                    setShowGlobalSearchModal(false);
                    setSearchQueryId("");
                    setSearchResultRoom(null);
                    setSearchResultProfile(null);
                    setSearchError("");
                  }}
                  className="p-1 text-gray-400 hover:text-white hover:bg-slate-800 rounded-full transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Toggle Search Type */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setSearchType("room");
                    setSearchQueryId("");
                    setSearchResultRoom(null);
                    setSearchResultProfile(null);
                    setSearchError("");
                  }}
                  className={`py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                    searchType === "room"
                      ? "bg-purple-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  🎙️ Room ID
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchType("profile");
                    setSearchQueryId("");
                    setSearchResultRoom(null);
                    setSearchResultProfile(null);
                    setSearchError("");
                  }}
                  className={`py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                    searchType === "profile"
                      ? "bg-purple-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  👤 Profile ID
                </button>
              </div>

              {/* Query ID Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchQueryId}
                  onChange={(e) => setSearchQueryId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleExecuteGlobalSearch();
                    }
                  }}
                  placeholder={
                    searchType === "room"
                      ? "Enter Room ID (e.g. general, support, ebadul)"
                      : "Enter Profile ID (e.g. ebadul, user1)"
                  }
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  autoFocus
                />
                <button
                  onClick={handleExecuteGlobalSearch}
                  disabled={searchLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center min-w-[70px]"
                >
                  {searchLoading ? "..." : "Search"}
                </button>
              </div>

              {/* Search Result Feedback */}
              {searchError && (
                <div className="p-2.5 bg-red-950/40 border border-red-500/20 text-red-400 text-[10px] font-bold rounded-lg leading-relaxed">
                  ⚠️ {searchError}
                </div>
              )}

              {searchResultRoom && (
                <div className="flex flex-col gap-2.5 p-3 bg-slate-950 border border-slate-850 rounded-xl animate-fade-in text-left">
                  <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest block">
                    Result Found: Room
                  </span>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex-shrink-0 relative overflow-hidden">
                      <img
                        src={searchResultRoom.coverUrl || searchResultRoom.backgroundUrl}
                        alt={searchResultRoom.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="bg-yellow-500 text-slate-950 font-black text-[7.5px] px-1 rounded-sm">
                          LVL {searchResultRoom.level || 5}
                        </span>
                        <span className="text-[9px] text-purple-400 font-mono font-bold">
                          ID: {searchResultRoom.id}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-white truncate mt-0.5">
                        {searchResultRoom.name}
                      </h4>
                      <p className="text-[8.5px] text-gray-500 truncate">
                        Owner: {searchResultRoom.ownerName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowGlobalSearchModal(false);
                      handleJoinRoom(searchResultRoom.id);
                    }}
                    className="w-full py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-550 text-white font-black text-[10px] uppercase rounded-lg transition-all"
                  >
                    Enter Room 🎙️
                  </button>
                </div>
              )}

              {searchResultProfile && (
                <div className="flex flex-col gap-2.5 p-3 bg-slate-950 border border-slate-850 rounded-xl animate-fade-in text-left">
                  <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest block">
                    Result Found: User Profile
                  </span>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex-shrink-0 relative overflow-hidden">
                      <img
                        src={searchResultProfile.avatarUrl}
                        alt={searchResultProfile.displayName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="bg-yellow-500 text-slate-950 font-black text-[7.5px] px-1 rounded-sm">
                          LVL {searchResultProfile.level || 1}
                        </span>
                        <span className="bg-purple-600 text-white text-[7.5px] px-1 rounded-sm uppercase tracking-wide">
                          {searchResultProfile.vipLevel}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-white truncate mt-0.5">
                        {searchResultProfile.displayName}
                      </h4>
                      <p className="text-[8.5px] text-gray-500 font-mono">
                        ID: {searchResultProfile.id}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowGlobalSearchModal(false);
                      setUserProfileView(searchResultProfile);
                    }}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-850 text-white border border-slate-800 font-black text-[10px] uppercase rounded-lg transition-all"
                  >
                    View User Details 👤
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {userProfileView && (
          <UserProfileModal
            profile={userProfileView}
            loggedInUser={user}
            startOpenRelationshipCenter={autoOpenRelationship}
            onClose={() => {
              setUserProfileView(null);
              setAutoOpenRelationship(false);
            }}
            onSetUser={onSetUser}
            onInitiatePrivateChat={(targetUser) => {
              setCurrentChatUser(targetUser);
              if (mobileRoute === "room") {
                setRoomPrivateChatOverlay(true);
                setUserProfileView(null);
              } else {
                setMobileRoute("chats");
              }
            }}
            onTeleportToRoom={(roomId) => {
              handleJoinRoom(roomId);
            }}
            onGlobalMessage={(txt) => {
              triggerGlobalError(txt);
            }}
            activeRoom={activeRoom}
            onModerationAction={handleRoomModeration}
            onLogout={handleLogout}
            onMentionUser={(mentionName) => {
              setMessageInput((prev) => {
                const trimmed = prev.trim();
                return trimmed ? `@${mentionName} ${trimmed}` : `@${mentionName} `;
              });
              setTimeout(() => {
                const el = document.getElementById("chat-input");
                if (el) {
                  el.focus();
                }
              }, 120);
            }}
          />
        )}

        {showReportsPanel && (
          <div className="absolute inset-0 bg-slate-950/90 z-60 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl p-4 flex flex-col gap-3 shadow-2xl animate-scale-up max-h-[85%] font-sans">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs font-black text-rose-500 flex items-center gap-1">
                  🛡️ Active Room Incident Reports
                </span>
                <button
                  onClick={() => setShowReportsPanel(false)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[10px] text-gray-400 leading-normal">
                Only Room Owners and Admins have permission to review filed
                report logs:
              </p>

              <div className="flex flex-col gap-2 overflow-y-auto pr-1 flex-1 min-h-[180px] max-h-[300px]">
                {activeReports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-500 gap-1.5">
                    <span className="text-2xl">🌱</span>
                    <span className="text-[10px] font-bold uppercase">
                      No active incident reports
                    </span>
                  </div>
                ) : (
                  activeReports.map((rep) => (
                    <div
                      key={rep.id}
                      className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl flex flex-col gap-1.5 transition-all hover:border-slate-700"
                    >
                      <div className="flex items-center gap-1.5 justify-between">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={rep.reportedUserAvatar}
                            alt=""
                            className="w-6 h-6 rounded-full border border-rose-500/30"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-white">
                              {rep.reportedUserName}
                            </span>
                            <span className="text-[9px] text-gray-500">
                              ID: {rep.reportedUserId}
                            </span>
                          </div>
                        </div>
                        <span className="text-[8px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1 py-0.5 rounded font-bold uppercase">
                          {rep.reason}
                        </span>
                      </div>

                      <div className="text-[10px] text-gray-400 border-l-2 border-slate-700 pl-1.5 leading-normal italic">
                        Reported by {rep.reporterName} (
                        {new Date(rep.timestamp).toLocaleTimeString()})
                      </div>

                      <div className="flex items-center gap-1.5 mt-1">
                        <button
                          onClick={async () => {
                            // Dismiss report
                            try {
                              const res = await fetch(
                                `/api/rooms/${activeRoom.id}/reports/dismiss`,
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    reportId: rep.id,
                                    requestingUserId: user?.id,
                                  }),
                                },
                              );
                              if (res.ok) {
                                setActiveReports((prev) =>
                                  prev.filter((r) => r.id !== rep.id),
                                );
                                triggerGlobalError("Report dismissed.");
                              }
                            } catch (err) {
                              console.error("Dismiss failed", err);
                            }
                          }}
                          className="flex-1 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-gray-700 text-gray-400 hover:text-white text-[9px] font-black rounded-lg uppercase"
                        >
                          Dismiss / IGNORE
                        </button>

                        <button
                          onClick={async () => {
                            // Kick user as moderation choice
                            const res = await fetch(
                              `/api/rooms/${activeRoom.id}/moderation`,
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  action: "kick_user",
                                  targetUserId: rep.reportedUserId,
                                  requestingUserId: user?.id,
                                }),
                              },
                            );
                            if (res.ok) {
                              // Auto dismiss report too
                              await fetch(
                                `/api/rooms/${activeRoom.id}/reports/dismiss`,
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    reportId: rep.id,
                                    requestingUserId: user?.id,
                                  }),
                                },
                              );
                              setActiveReports((prev) =>
                                prev.filter((r) => r.id !== rep.id),
                              );
                              triggerGlobalError(
                                `User @${rep.reportedUserName} kicked and report resolved!`,
                              );
                            }
                          }}
                          className="flex-1 py-1 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[9px] font-black rounded-lg uppercase"
                        >
                          KICK & RESOLVE
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => setShowReportsPanel(false)}
                className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-800 text-gray-300 font-extrabold text-xs py-2 rounded-xl mt-1 cursor-pointer"
              >
                Close Panel
              </button>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* ROOM DETAILS OVERLAY SHEET */}
        {/* ========================================== */}
        {showRoomDetails && activeRoom && user && (
          <div className="absolute inset-x-0 top-0 bottom-0 bg-slate-950/98 z-50 flex flex-col focus-scroll-none select-none text-slate-100 animate-fade-in font-sans">
            {/* Header */}
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRoomDetails(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-sm font-black tracking-wide text-white">
                    Room Information
                  </h2>
                  <span className="text-[9px] text-slate-400 font-mono">
                    ID: {activeRoom.id}
                  </span>
                </div>
              </div>

              {/* Conditional Settings Button: Only for Host or Admin */}
              {activeRoom.ownerId === user.id ||
              activeRoom.admins?.includes(user.id) ? (
                <button
                  onClick={async () => {
                    setShowRoomDetails(false);
                    setShowRoomSettings(true);
                    await loadRoomSettings();
                  }}
                  id="btn-settings-room-admin"
                  className="p-2 text-yellow-400 hover:bg-slate-800 rounded-full border border-yellow-500/10 shadow-lg cursor-pointer flex items-center gap-1.5 transition"
                >
                  <Settings className="w-4 h-4 animate-spin-slow" />
                  <span className="text-[9px] font-black uppercase tracking-wider">
                    Settings
                  </span>
                </button>
              ) : (
                <div className="w-6"></div> // Spacer to keep title centered
              )}
            </div>

            {/* Scrollable Room Information Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Cover Card */}
              <div
                className="relative h-28 w-full rounded-xl bg-cover bg-center overflow-hidden border border-slate-800 flex flex-col justify-end p-3 shadow-inner"
                style={{
                  backgroundImage: `linear-gradient(to top, rgba(15,23,42,0.95), rgba(15,23,42,0.2)), url('${activeRoom.coverUrl || activeRoom.backgroundUrl}')`,
                }}
              >
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-[8px] bg-yellow-500 text-slate-950 font-black px-1.5 py-0.5 rounded-full uppercase mr-1.5 tracking-wider">
                      LEVEL {activeRoom.level || 5}
                    </span>
                    <h1 className="text-sm font-bold text-white tracking-tight mt-1">
                      {activeRoom.name}
                    </h1>
                    <p className="text-[10px] text-purple-300 flex items-center gap-1 mt-0.5 leading-none">
                      <Award className="w-3 h-3 text-yellow-400" />
                      Badge:{" "}
                      <span className="font-bold text-white">
                        {activeRoom.badge || "BD Golden Star"}
                      </span>
                    </p>
                  </div>
                  <span className="text-[8.5px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/25 px-2 py-0.5 rounded-full font-bold uppercase">
                    {activeRoom.category?.toUpperCase() || "PK"}
                  </span>
                </div>
              </div>

              {/* EXP Progress Slider */}
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                <div className="flex justify-between text-[9px] font-mono font-bold">
                  <span className="text-slate-400">ROOM EXP PROGRESS</span>
                  <span className="text-yellow-400">
                    {activeRoom.exp || 2400} / {activeRoom.expNext || 5000}
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, ((activeRoom.exp || 2400) / (activeRoom.expNext || 5000)) * 100)}%`,
                    }}
                  ></div>
                </div>
                <p className="text-[8px] text-slate-500">
                  Send voice activity or high coins gifts to raise room level
                  unlock backgrounds.
                </p>
              </div>

              {/* ROOM LEVEL UP TASKS & BENEFITS */}
              <div className="bg-slate-900 border border-purple-500/10 p-3 flex flex-col gap-3 rounded-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">🎯</span>
                    <h3 className="text-[10px] font-black tracking-wide text-white uppercase">
                      Room Level Tasks & Benefits
                    </h3>
                  </div>
                  <span className="text-[8px] bg-purple-600/20 text-purple-300 font-extrabold px-1.5 py-0.5 rounded border border-purple-500/25 uppercase font-mono">
                    LEVEL {activeRoom.level || 1}
                  </span>
                </div>

                {/* Level Up Tasks Checklist */}
                <div className="space-y-2">
                  <h4 className="text-[8.5px] text-purple-400 font-extrabold uppercase tracking-wider pl-0.5">
                    Daily Level Tasks
                  </h4>

                  {/* Task 1: New joins */}
                  <div className="bg-slate-950 p-2 rounded-lg border border-white/5 space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-300 font-bold flex items-center gap-1 text-[9.5px]">
                        👥 New Users Join ({activeRoom.roomTasks?.newJoins || 0}/{activeRoom.roomTasks?.newJoinsTarget || 5})
                      </span>
                      {activeRoom.roomTasks?.completed?.includes("joins") ? (
                        <span className="text-emerald-400 font-black text-[8.5px] uppercase">Completed ✓</span>
                      ) : (
                        <span className="text-yellow-400 font-black text-[8.5px] font-mono">+50 EXP</span>
                      )}
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-500 h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (((activeRoom.roomTasks?.newJoins || 0) / (activeRoom.roomTasks?.newJoinsTarget || 5)) * 100))}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Task 2: Regular user mic minutes */}
                  <div className="bg-slate-950 p-2 rounded-lg border border-white/5 space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-300 font-bold flex items-center gap-1 text-[9.5px]">
                        🎙️ Users on Seats ({Math.floor(activeRoom.roomTasks?.micMinutes || 0)}/10 mins)
                      </span>
                      {activeRoom.roomTasks?.completed?.includes("mic") ? (
                        <span className="text-emerald-400 font-black text-[8.5px] uppercase">Completed ✓</span>
                      ) : (
                        <span className="text-yellow-400 font-black text-[8.5px] font-mono">+80 EXP</span>
                      )}
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (((activeRoom.roomTasks?.micMinutes || 0) / 10) * 100))}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Task 3: Owner mic minutes */}
                  <div className="bg-slate-950 p-2 rounded-lg border border-white/5 space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-300 font-bold flex items-center gap-1 text-[9.5px]">
                        👑 Owner on Seats ({Math.floor(activeRoom.roomTasks?.ownerMicMinutes || 0)}/10 mins)
                      </span>
                      {activeRoom.roomTasks?.completed?.includes("owner") ? (
                        <span className="text-emerald-400 font-black text-[8.5px] uppercase">Completed ✓</span>
                      ) : (
                        <span className="text-yellow-400 font-black text-[8.5px] font-mono">+80 EXP</span>
                      )}
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (((activeRoom.roomTasks?.ownerMicMinutes || 0) / 10) * 100))}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Task 4: Diamonds gifted */}
                  <div className="bg-slate-950 p-2 rounded-lg border border-white/5 space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-300 font-bold flex items-center gap-1 text-[9.5px]">
                        💎 Diamonds Gifted ({activeRoom.roomTasks?.diamondsGifted || 0}/{activeRoom.roomTasks?.diamondsGiftedTarget || 100})
                      </span>
                      {activeRoom.roomTasks?.completed?.includes("gifts") ? (
                        <span className="text-emerald-400 font-black text-[8.5px] uppercase">Completed ✓</span>
                      ) : (
                        <span className="text-yellow-400 font-black text-[8.5px] font-mono">+100 EXP</span>
                      )}
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-pink-500 h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (((activeRoom.roomTasks?.diamondsGifted || 0) / (activeRoom.roomTasks?.diamondsGiftedTarget || 100)) * 100))}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Level Perks Section */}
                <div className="pt-2.5 space-y-2 border-t border-slate-800">
                  <h4 className="text-[8.5px] text-yellow-400 font-extrabold uppercase tracking-wider pl-0.5 flex items-center gap-1">
                    🚀 Level Benefits & Unlocked Logo
                  </h4>
                  
                  <div className="bg-slate-950 p-2 rounded-lg border border-white/5 flex gap-2.5 items-center">
                    <div className="w-10 h-10 rounded-full bg-slate-900 border border-yellow-500/40 flex items-center justify-center relative select-none shrink-0">
                      <span className="text-lg">
                        {(activeRoom.level || 1) >= 20 ? "🔥" : (activeRoom.level || 1) >= 15 ? "👑" : (activeRoom.level || 1) >= 10 ? "💎" : (activeRoom.level || 1) >= 5 ? "🛡️" : "✨"}
                      </span>
                      <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-slate-950 text-[7px] font-black px-1 rounded-full uppercase scale-90">
                        LV.{(activeRoom.level || 1)}
                      </div>
                    </div>
                    
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-[9.5px] text-white font-extrabold uppercase tracking-wide truncate">
                        {(activeRoom.level || 1) >= 20 ? "Emperor Crown Room Badge" : (activeRoom.level || 1) >= 15 ? "Royal Crest Room Badge" : (activeRoom.level || 1) >= 10 ? "SVIP Platinum Room Badge" : (activeRoom.level || 1) >= 5 ? "Vip Silver Room Badge" : "Starter Bronze Badge"}
                      </p>
                      <p className="text-[8px] text-slate-400 leading-normal">
                        {(activeRoom.level || 1) >= 20 ? "Unlocked: 20 seats, Elite Emperor logo wrapper." : (activeRoom.level || 1) >= 15 ? "Unlocked: 16 seats, Royal theme, Gold badge." : (activeRoom.level || 1) >= 10 ? "Unlocked: 12 seats, Platinum layout theme." : (activeRoom.level || 1) >= 5 ? "Unlocked: 10 seats, Silver badge, Vip controls." : "Unlock 10 seats at Room Level 5!"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Announcement Bulletin */}
              <div className="bg-yellow-500/5 p-3 rounded-xl border border-yellow-500/10 space-y-1">
                <span className="text-[9px] text-yellow-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                  📢 Room Announcement
                </span>
                <p className="text-[11px] text-yellow-250/90 leading-relaxed font-medium">
                  {activeRoom.announcement ||
                    "No active announcements currently posted by admin."}
                </p>
              </div>

              {/* SUPREME CREATOR SPECIAL ROOM CONTROLS */}
              {(user.email === "ebadulhoque1234567890@gmail.com" || user.isGlobalAdmin) && (
                <div className="bg-slate-900 border border-yellow-500/30 p-3 rounded-xl space-y-2.5 shadow-[0_0_15px_rgba(234,179,8,0.15)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-yellow-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                      👑 Supreme Admin Actions
                    </span>
                    <span className="text-[8px] bg-yellow-500 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase font-mono">
                      FOUNDER BYPASS
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 bg-slate-950 p-2 rounded-lg border border-white/5">
                    <div>
                      <p className="text-[10px] text-white font-bold">
                        Official Status
                      </p>
                      <p className="text-[8px] text-gray-400">
                        {activeRoom.isOfficial ? "🌟 Currently Marked as Official" : "⚠️ Currently Regular Room"}
                      </p>
                    </div>
                    <button
                      onClick={handleToggleOfficial}
                      className={`text-[9px] font-black uppercase px-3 py-1.5 rounded transition-all active:scale-95 ${
                        activeRoom.isOfficial 
                          ? "bg-rose-500 hover:bg-rose-600 text-white" 
                          : "bg-amber-500 hover:bg-amber-600 text-slate-950"
                      }`}
                    >
                      {activeRoom.isOfficial ? "Remove Official ⚠️" : "Make Official 👑"}
                    </button>
                  </div>
                </div>
              )}

              {/* Multi-Badge Grid Statistics Section */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-850 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-sm">
                    📈
                  </div>
                  <div>
                    <p className="text-[8px] text-slate-400">WEEKLY RANKING</p>
                    <p className="text-[11px] font-mono font-bold text-pink-400">
                      {activeRoom.ranking || "#4 Weekly Rank"}
                    </p>
                  </div>
                </div>
                <div 
                  onClick={async () => {
                    setShowRoomFollowersList(true);
                    await fetchRoomFollowers();
                  }}
                  className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-850 flex items-center gap-2 hover:bg-slate-800/60 cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-sm">
                    👥
                  </div>
                  <div>
                    <p className="text-[8px] text-slate-400">FOLLOWERS COUNT</p>
                    <p className="text-[11px] font-mono font-bold text-blue-400">
                      {activeRoom.followersCount || 450} Fans
                    </p>
                  </div>
                </div>
                <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-850 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-sm">
                    👁️
                  </div>
                  <div>
                    <p className="text-[8px] text-slate-400">ROOM VISITORS</p>
                    <p className="text-[11px] font-mono font-bold text-emerald-450">
                      {activeRoom.visitorsCount || 2150}
                    </p>
                  </div>
                </div>
                <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-850 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-sm">
                    📅
                  </div>
                  <div>
                    <p className="text-[8px] text-slate-400">CREATION DATE</p>
                    <p className="text-[10px] font-bold text-purple-400">
                      Jan 12, 2026
                    </p>
                  </div>
                </div>
              </div>

              {/* Host Section */}
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-2">
                <h3 className="text-xs font-black tracking-wide text-white border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>{" "}
                  Host Info
                </h3>
                <div
                  onClick={() => {
                    // Open Host profile
                    const hostMock: UserProfile = {
                      id: activeRoom.ownerId,
                      username:
                        activeRoom.ownerId === "ebadul"
                          ? "ebadul_owner"
                          : "host_" + activeRoom.ownerId,
                      displayName: activeRoom.ownerName,
                      avatarUrl:
                        activeRoom.ownerAvatarUrl ||
                        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
                      coverUrl: activeRoom.backgroundUrl,
                      bio: "Official Room Promoter & Host.",
                      gender: Gender.MALE,
                      age: 24,
                      country: "Bangladesh 🇧🇩",
                      level: 80,
                      xp: 99000,
                      xpNextLevel: 100000,
                      vipLevel: VipLevel.ROYAL,
                      isVerified: true,
                      coins: 52000,
                      diamonds: 12000,
                      followersCount: 1500,
                      followingCount: 30,
                      isOnline: true,
                      badges: ["host_certified", "voice_king"],
                      createdAt: new Date().toISOString(),
                    };
                    setUserProfileView(hostMock);
                    setShowRoomDetails(false);
                  }}
                  className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-lg border border-slate-850 cursor-pointer hover:bg-slate-850 transition"
                >
                  <img
                    src={
                      activeRoom.ownerAvatarUrl ||
                      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
                    }
                    alt={activeRoom.ownerName}
                    className="w-10 h-10 rounded-full border border-purple-500 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-white truncate flex items-center gap-1">
                      <span>{activeRoom.ownerName}</span>
                      <span className="text-[7.5px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-1 rounded-sm uppercase tracking-wider scale-90">
                        Host
                      </span>
                    </p>
                    <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                      ID: {activeRoom.ownerId}
                    </p>
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold bg-slate-900 border border-slate-800 px-2 py-1 rounded-md">
                    View Profile 👤
                  </span>
                </div>
              </div>

              {/* Room Privileges Highlights */}
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                <h3 className="text-xs font-black tracking-wide text-white border-b border-slate-800 pb-1.5 mb-2.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>{" "}
                  Room Privileges & Highlights
                </h3>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-900 flex justify-between">
                    <span className="text-slate-400">Online Users</span>
                    <span className="text-amber-400 font-mono font-bold">
                      {activeRoom.onlineUsersCount}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-900 flex justify-between">
                    <span className="text-slate-400">Members Priv</span>
                    <span className="text-purple-400 font-mono font-bold">
                      {activeRoom.members?.length || 4} Count
                    </span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-900 flex justify-between">
                    <span className="text-slate-400">Admins Count</span>
                    <span className="text-indigo-400 font-mono font-bold">
                      {activeRoom.admins?.length} Staff
                    </span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-900 flex justify-between">
                    <span className="text-slate-400">Seat Count</span>
                    <span className="text-pink-400 font-mono font-bold">
                      {activeRoom.seatLayout} Seats
                    </span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-900 flex justify-between">
                    <span className="text-slate-400">Room Theme Level</span>
                    <span className="text-emerald-400 font-bold">
                      Lvl 5 Theme
                    </span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-900 flex justify-between">
                    <span className="text-slate-400">Popularity Level</span>
                    <span className="text-yellow-400 font-bold">
                      Lvl 3 Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Room Data Analytics Section */}
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                <h3 className="text-xs font-black tracking-wide text-white border-b border-slate-800 pb-1.5 mb-2.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>{" "}
                  Room Data & Financial Metrics
                </h3>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-900">
                    <span className="text-slate-400 block text-[8px] uppercase font-bold">
                      Daily Visitors
                    </span>
                    <span className="text-slate-200 text-xs font-mono font-black">
                      {activeRoom.dailyVisitors || 84}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-900">
                    <span className="text-slate-400 block text-[8px] uppercase font-bold">
                      Total Visitors
                    </span>
                    <span className="text-slate-200 text-xs font-mono font-black">
                      {activeRoom.totalVisitors || 3290}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-900">
                    <span className="text-slate-400 block text-[8px] uppercase font-bold">
                      Daily Gifts
                    </span>
                    <span className="text-yellow-400 text-xs font-mono font-black">
                      {activeRoom.dailyGifts || 1400} 🪙
                    </span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-900">
                    <span className="text-slate-400 block text-[8px] uppercase font-bold">
                      Total Gifts Cash
                    </span>
                    <span className="text-purple-400 text-xs font-mono font-black">
                      {activeRoom.totalGifts || 84500} 💎
                    </span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-900 col-span-2 flex justify-between items-center">
                    <div>
                      <span className="text-slate-400 block text-[8px] uppercase font-bold">
                        Popularity Points
                      </span>
                      <span className="text-pink-400 text-xs font-mono font-black">
                        {activeRoom.popularityPoints || 14976} pts
                      </span>
                    </div>
                    <span className="text-[11px] bg-pink-500/10 text-pink-400 px-2 py-0.5 rounded border border-pink-500/20 uppercase font-black tracking-wide">
                      Epic Popularity 🔥
                    </span>
                  </div>
                </div>
              </div>

              {/* Members Tabs Section */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-850 p-1 flex border-b border-slate-800 text-[10px]">
                  <button
                    onClick={() => setDetailsTab("members")}
                    className={`flex-1 py-1.5 rounded-lg font-black transition ${detailsTab === "members" ? "bg-slate-950 text-white shadow-sm border border-slate-800" : "text-slate-400 hover:text-white"}`}
                  >
                    Members ({activeRoom.members?.length || 4})
                  </button>
                  <button
                    onClick={() => setDetailsTab("admins")}
                    className={`flex-1 py-1.5 rounded-lg font-black transition ${detailsTab === "admins" ? "bg-slate-950 text-white shadow-sm border border-slate-800" : "text-slate-400 hover:text-white"}`}
                  >
                    Staff ({activeRoom.admins?.length || 1})
                  </button>
                  <button
                    onClick={() => setDetailsTab("muted")}
                    className={`flex-1 py-1.5 rounded-lg font-black transition ${detailsTab === "muted" ? "bg-slate-950 text-white shadow-sm border border-slate-800" : "text-slate-400 hover:text-white"}`}
                  >
                    Mutes ({activeRoom.mutedUsers?.length || 0})
                  </button>
                  <button
                    onClick={() => setDetailsTab("banned")}
                    className={`flex-1 py-1.5 rounded-lg font-black transition ${detailsTab === "banned" ? "bg-slate-950 text-white shadow-sm border border-slate-800" : "text-slate-400 hover:text-white"}`}
                  >
                    Blocked ({activeRoom.bannedUsers?.length || 0})
                  </button>
                </div>

                <div className="p-3 max-h-48 overflow-y-auto space-y-2">
                  {detailsTab === "members" && (
                    <div className="space-y-2">
                      {(!activeRoom.memberProfiles || activeRoom.memberProfiles.length === 0) ? (
                        <div className="text-center py-4 bg-slate-950/40 rounded-xl border border-slate-900">
                          <p className="text-[10px] text-gray-400 italic">
                            No official members joined this room yet.
                          </p>
                          <p className="text-[8.5px] text-purple-400 mt-1 uppercase font-semibold">
                            Be the first to click "Join Room" below!
                          </p>
                        </div>
                      ) : (
                        activeRoom.memberProfiles.map((mProfile: any) => (
                          <div
                            key={mProfile.id}
                            className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/80 border border-slate-850 hover:border-purple-550/20 transition-all cursor-pointer"
                          >
                            <img
                              src={
                                mProfile.avatarUrl ||
                                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"
                              }
                              alt=""
                              className="w-6 h-6 rounded-full border border-purple-500/30 object-cover shadow-sm"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex flex-col text-left">
                              <span className="text-xs text-white font-black leading-tight">
                                {mProfile.displayName}
                              </span>
                              <span className="text-[8px] text-purple-300 font-mono tracking-wider">
                                @{mProfile.username}
                              </span>
                            </div>
                            <span className="text-[8px] bg-slate-900 border border-slate-800 text-slate-400 rounded-sm px-1.5 py-0.5 ml-auto font-mono">
                              ID: {mProfile.id}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {detailsTab === "admins" && (
                    <div className="space-y-2">
                      {activeRoom.admins?.map((adminId) => (
                        <div
                          key={adminId}
                          className="flex items-center gap-2.5 p-1 px-2 rounded bg-indigo-950/20 border border-indigo-900/10"
                        >
                          <span className="text-xs">🛡️</span>
                          <span className="text-xs text-slate-300 font-black">
                            {adminId === "ebadul"
                              ? "Creator Ebadul"
                              : "Admin ID: " + adminId}
                          </span>
                          <span className="text-[7.5px] bg-indigo-500 text-white font-black px-1.5 py-0.2 rounded uppercase ml-auto">
                            ADMIN
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {detailsTab === "muted" && (
                    <div className="space-y-2">
                      {activeRoom.mutedUsers &&
                      activeRoom.mutedUsers.length > 0 ? (
                        activeRoom.mutedUsers.map((mu) => (
                          <div
                            key={mu}
                            className="flex items-center gap-2 p-1 bg-yellow-950/10 rounded border border-yellow-905/10"
                          >
                            <span className="text-xs text-yellow-400">
                              🔇 {mu}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-500 text-center py-2 italic">
                          No users are currently muted.
                        </p>
                      )}
                    </div>
                  )}

                  {detailsTab === "banned" && (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {activeRoom.bannedUsers &&
                      activeRoom.bannedUsers.length > 0 ? (
                        activeRoom.bannedUsers.map((buId) => {
                          const detailed = activeRoom.bannedUsersDetails?.find(d => d.id === buId);
                          return (
                            <div
                              key={buId}
                              className="flex items-center gap-2.5 p-1.5 bg-red-950/25 rounded-lg border border-red-900/15"
                            >
                              <img
                                src={detailed?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"}
                                alt="DP"
                                className="w-6 h-6 rounded-full object-cover border border-red-500/10"
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-slate-200 truncate">
                                  {detailed?.displayName || `User ID ${buId}`}
                                </p>
                                <p className="text-[9px] text-slate-450 font-mono">
                                  ID: {buId}
                                </p>
                              </div>
                              <span className="text-[9px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 font-black uppercase tracking-wider">
                                Banned
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-[10px] text-slate-500 text-center py-2 italic">
                          No users are currently banned.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* OFFICIALLY JOIN ROOM CARD BANNER */}
              <div className="bg-gradient-to-r from-purple-950/30 via-indigo-950/30 to-slate-900 border border-purple-500/25 p-3 rounded-xl space-y-2 shadow-lg mt-1 select-none">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-purple-300 uppercase tracking-widest flex items-center gap-1.5">
                      <span>👥 Official Room Membership</span>
                    </h4>
                    <p className="text-[8.5px] text-slate-400 mt-0.5">
                      Join the official members list to receive special seat tags, chat status, and staff eligibility.
                    </p>
                  </div>
                  {activeRoom.members?.includes(user.id) ? (
                    <span className="text-[9px] font-black text-emerald-450 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/35">
                      ✓ JOINED
                    </span>
                  ) : (
                    <span className="text-[8px] font-extrabold text-amber-400 bg-amber-955/20 px-2 py-0.5 rounded-full border border-amber-500/15 animate-pulse">
                      WAITING
                    </span>
                  )}
                </div>

                {activeRoom.members?.includes(user.id) ? (
                  <div className="bg-slate-950/50 p-2 rounded-lg border border-indigo-950/40 text-center">
                    <p className="text-[10px] font-extrabold text-indigo-200">
                      🎉 You are an Official Member!
                    </p>
                    <p className="text-[8.5px] text-slate-400 mt-0.2">
                      Now you are registered. Seat hosts can grant you staff roles.
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (socketRef.current) {
                        socketRef.current.emit("room:join_official", {
                          roomId: activeRoom.id,
                          userId: user.id,
                        });
                      }
                    }}
                    className="w-full py-2 bg-gradient-to-r from-purple-700 via-indigo-700 to-indigo-805 hover:from-purple-600 hover:via-indigo-650 hover:to-indigo-750 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-[0_3px_8px_rgba(139,92,246,0.35)]"
                  >
                    👥 Click to Official Join Room
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* ROOM FOLLOWERS LIST MODAL */}
        {/* ========================================== */}
        {showRoomFollowersList && activeRoom && user && (
          <div className="absolute inset-x-0 top-0 bottom-0 bg-slate-950/98 z-50 flex flex-col focus-scroll-none select-none text-slate-100 animate-slide-up font-sans">
            {/* Header */}
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRoomFollowersList(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">
                    Room Followers 👥
                  </h2>
                  <p className="text-[9px] text-slate-400 font-bold uppercase font-sans">
                    Fans of {activeRoom.name}
                  </p>
                </div>
              </div>
              
              <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono font-bold">
                {activeRoom.followersCount || 0} Total
              </span>
            </div>

            {/* Followers list area */}
            <div className="flex-grow overflow-y-auto p-3 space-y-2">
              {loadingRoomFollowers ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-blue-500/10 border-t-blue-500 animate-spin"></div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">Loading Followers...</span>
                </div>
              ) : roomFollowersData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
                  <span className="text-4xl animate-bounce">👥</span>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">No followers found</h4>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest leading-relaxed text-center">
                      Follow this room from the header<br />to appear here first!
                    </p>
                  </div>
                </div>
              ) : (
                roomFollowersData.map((fUser: any) => {
                  const isRoomOwner = activeRoom.ownerId === fUser.id;
                  const isRoomAdmin = activeRoom.admins?.includes(fUser.id);
                  const isRoomMod = activeRoom.moderators?.includes(fUser.id);
                  
                  return (
                    <div
                      key={fUser.id}
                      onClick={() => {
                        setUserProfileView(fUser);
                        setShowRoomFollowersList(false);
                      }}
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900 border border-slate-850 hover:border-blue-500/20 transition-all cursor-pointer"
                    >
                      <img
                        src={fUser.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"}
                        alt={fUser.displayName}
                        className="w-8 h-8 rounded-full border border-purple-500/30 object-cover shadow-sm animate-fade-in"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex flex-col text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-white font-black leading-tight">
                            {fUser.displayName}
                          </span>
                          <span className="text-[8px] bg-yellow-500 text-slate-950 font-black px-1.5 py-0.2 rounded scale-90">
                            LV {fUser.level || 1}
                          </span>
                        </div>
                        <span className="text-[8px] text-slate-400 font-mono tracking-wider">
                          ID: {fUser.id}
                        </span>
                      </div>
                      
                      {/* Role labels */}
                      <div className="ml-auto flex items-center gap-1">
                        {isRoomOwner && (
                          <span className="text-[8px] bg-yellow-500 text-slate-950 border border-yellow-400 font-black px-1.5 py-0.5 rounded uppercase">
                            Room Owner 👑
                          </span>
                        )}
                        {isRoomAdmin && !isRoomOwner && (
                          <span className="text-[8px] bg-blue-500 text-white font-black px-1.5 py-0.5 rounded uppercase">
                            Admin 🛡️
                          </span>
                        )}
                        {isRoomMod && !isRoomOwner && !isRoomAdmin && (
                          <span className="text-[8px] bg-purple-500 text-white font-black px-1.5 py-0.5 rounded uppercase">
                            Moderator ⚔️
                          </span>
                        )}
                        {!isRoomOwner && !isRoomAdmin && !isRoomMod && (
                          <span className="text-[8px] bg-slate-850 text-slate-400 font-black px-1.5 py-0.5 rounded uppercase">
                            Follower ❤️
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* ROOM SETTINGS MODAL (OWNERS/ADMINS ONLY) */}
        {/* ========================================== */}
        {showRoomSettings && activeRoom && user && (
          <div className="absolute inset-x-0 top-0 bottom-0 bg-slate-950 z-50 flex flex-col focus-scroll-none select-none text-slate-100 animate-slide-up font-sans">
            {/* Header */}
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowRoomSettings(false);
                    setShowRoomDetails(true);
                  }}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-sm font-black text-white">
                    Room Settings & Rules
                  </h2>
                  <span className="text-[9px] text-rose-400 font-mono italic">
                    Policy Administrator Panel
                  </span>
                </div>
              </div>

              <button
                onClick={async () => {
                  await saveRoomSettings();
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-md cursor-pointer flex items-center gap-1 transition-all active:scale-95"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Save Changes
              </button>
            </div>

            {/* Sub-Navigation Tabs Bar */}
            <div className="bg-slate-900/80 p-1 flex overflow-x-auto whitespace-nowrap border-b border-slate-800 text-[10px]">
              <button
                onClick={() => setSettingsTab("general")}
                className={`py-2 px-3.5 rounded-lg font-black transition-all ${settingsTab === "general" ? "bg-slate-950 text-white shadow-sm border border-slate-800" : "text-slate-400"}`}
              >
                ⚙️ General
              </button>
              <button
                onClick={() => setSettingsTab("entry")}
                className={`py-2 px-3.5 rounded-lg font-black transition-all ${settingsTab === "entry" ? "bg-slate-950 text-white shadow-sm border border-slate-800" : "text-slate-400"}`}
              >
                🔑 Entry
              </button>
              <button
                onClick={() => setSettingsTab("admins")}
                className={`py-2 px-3.5 rounded-lg font-black transition-all ${settingsTab === "admins" ? "bg-slate-950 text-white shadow-sm border border-slate-800" : "text-slate-400"}`}
              >
                🛡️ Admins
              </button>
              <button
                onClick={() => setSettingsTab("members")}
                className={`py-2 px-3.5 rounded-lg font-black transition-all ${settingsTab === "members" ? "bg-slate-950 text-white shadow-sm border border-slate-800" : "text-slate-400"}`}
              >
                👥 Members
              </button>
              <button
                onClick={() => setSettingsTab("seats")}
                className={`py-2 px-3.5 rounded-lg font-black transition-all ${settingsTab === "seats" ? "bg-slate-950 text-white shadow-sm border border-slate-800" : "text-slate-400"}`}
              >
                🎤 Seats
              </button>
              <button
                onClick={() => setSettingsTab("chat_seq")}
                className={`py-2 px-3.5 rounded-lg font-black transition-all ${settingsTab === "chat_seq" ? "bg-slate-950 text-white shadow-sm border border-slate-800" : "text-slate-400"}`}
              >
                🔒 Chat & Rules
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
              {/* TAB 1: GENERAL */}
              {settingsTab === "general" && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest pl-1">
                      Room Title Name
                    </label>
                    <input
                      type="text"
                      value={settingsName}
                      onChange={(e) => setSettingsName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-purple-500 transition shadow-inner"
                      placeholder="Room name..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest pl-1">
                      Billboard Announcement
                    </label>
                    <textarea
                      value={settingsAnnouncement}
                      onChange={(e) => setSettingsAnnouncement(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-medium text-slate-100 focus:outline-none focus:border-purple-500 transition shadow-inner"
                      placeholder="Enter new marquee bulletin..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest pl-1">
                      Background Image URL
                    </label>
                    <input
                      type="text"
                      value={settingsBackgroundUrl}
                      onChange={(e) => setSettingsBackgroundUrl(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-indigo-300 font-mono focus:outline-none focus:border-purple-500 transition"
                    />
                    <div className="mt-1 flex gap-1.5 overflow-x-auto py-1">
                      {[
                        {
                          name: "Gold Club",
                          url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80",
                        },
                        {
                          name: "Acoustic",
                          url: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=600&q=80",
                        },
                        {
                          name: "Neon Space",
                          url: "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=600&q=80",
                        },
                        {
                          name: "Tech Blue",
                          url: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&q=80",
                        },
                      ].map((bg) => (
                        <button
                          key={bg.name}
                          onClick={() => setSettingsBackgroundUrl(bg.url)}
                          className={`px-2.5 py-1 text-[8.5px] font-black rounded border whitespace-nowrap transition-all ${settingsBackgroundUrl === bg.url ? "bg-purple-600 text-white border-purple-400" : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"}`}
                        >
                          {bg.name}
                        </button>
                      ))}
                    </div>

                    {/* Direct Upload Background */}
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 mt-1 flex flex-col gap-1">
                      <span className="text-[8px] font-extrabold text-purple-400 uppercase">
                        📸 Upload Custom Background (Gallery)
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          id="settings-bg-upload"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                triggerGlobalError("Uploading background image...");
                                const url = await handleImageFileUpload(file);
                                setSettingsBackgroundUrl(url);
                                triggerGlobalError("Success: Custom background selected!");
                              } catch (err: any) {
                                triggerGlobalError(err.message || "Failed to upload image");
                              }
                            }
                          }}
                        />
                        <label
                          htmlFor="settings-bg-upload"
                          className="cursor-pointer bg-purple-600 hover:bg-purple-550 text-white px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-wide"
                        >
                          Upload BG
                        </label>
                        <span className="text-[7.5px] text-gray-400 truncate flex-1 font-mono">
                          {settingsBackgroundUrl ? (settingsBackgroundUrl.startsWith("/uploads/") ? "✓ Uploaded Background" : "✓ Using Default/URL") : "No file uploaded"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest pl-1">
                      Room Cover Image Card URL
                    </label>
                    <input
                      type="text"
                      value={settingsCoverUrl}
                      onChange={(e) => setSettingsCoverUrl(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-indigo-300 font-mono focus:outline-none focus:border-purple-500 transition"
                      placeholder="Custom portrait URL..."
                    />

                    {/* Direct Upload Cover */}
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 mt-1 flex flex-col gap-1">
                      <span className="text-[8px] font-extrabold text-purple-400 uppercase">
                        🖼️ Upload Custom Room Cover (Gallery)
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          id="settings-cover-upload"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                triggerGlobalError("Uploading cover image...");
                                const url = await handleImageFileUpload(file);
                                setSettingsCoverUrl(url);
                                triggerGlobalError("Success: Custom cover selected!");
                              } catch (err: any) {
                                triggerGlobalError(err.message || "Failed to upload image");
                              }
                            }
                          }}
                        />
                        <label
                          htmlFor="settings-cover-upload"
                          className="cursor-pointer bg-purple-600 hover:bg-purple-550 text-white px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-wide"
                        >
                          Upload Cover
                        </label>
                        <span className="text-[7.5px] text-gray-400 truncate flex-1 font-mono">
                          {settingsCoverUrl ? (settingsCoverUrl.startsWith("/uploads/") ? "✓ Uploaded Cover" : "✓ Using Preset/URL") : "No file uploaded"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ENTRY CONTROLS */}
              {settingsTab === "entry" && (
                <div className="space-y-4">
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850 space-y-2.5">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest pl-0.5">
                      Doors Policy Preference
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "free", label: "🆓 Free Entry" },
                        { id: "coins", label: "🪙 Coin Fee" },
                        { id: "vip", label: "👑 VIP Only" },
                        { id: "password", label: "🔒 Password Require" },
                      ].map((policy) => (
                        <button
                          key={policy.id}
                          onClick={() =>
                            setSettingsEntrySetting(policy.id as any)
                          }
                          className={`p-2.5 text-xs font-bold rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${settingsEntrySetting === policy.id ? "bg-purple-600/25 text-purple-300 border-purple-500" : "bg-slate-950 text-slate-400 border-slate-850 hover:text-white"}`}
                        >
                          {policy.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dependent fields */}
                  {settingsEntrySetting === "coins" && (
                    <div className="space-y-1 animate-scale-up">
                      <label className="text-[10px] text-yellow-400 font-extrabold uppercase tracking-widest pl-1">
                        Door Fee Amount (Coins)
                      </label>
                      <input
                        type="number"
                        value={settingsEntryFee}
                        onChange={(e) =>
                          setSettingsEntryFee(
                            Math.max(0, Number(e.target.value)),
                          )
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-yellow-500"
                        placeholder="e.g. 50 coins"
                      />
                    </div>
                  )}

                  {settingsEntrySetting === "password" && (
                    <div className="space-y-1 animate-scale-up">
                      <label className="text-[10px] text-red-400 font-extrabold uppercase tracking-widest pl-1">
                        Room Entrance Password Code
                      </label>
                      <input
                        type="text"
                        value={settingsPassword}
                        onChange={(e) => setSettingsPassword(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-red-500"
                        placeholder="e.g. 12345"
                      />
                    </div>
                  )}

                  {/* Joining Requirements checkboxes */}
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850 space-y-3">
                    <label className="text-[10px] text-slate-450 font-extrabold uppercase tracking-widest pl-0.5">
                      Additional Entry Bars
                    </label>

                    <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                      <div>
                        <p className="text-xs font-bold text-slate-200">
                          Minimum User level restriction
                        </p>
                        <p className="text-[9px] text-slate-500">
                          Only user profiles showing this level or higher may
                          request entries.
                        </p>
                      </div>
                      <select
                        value={settingsMinLevelRequired}
                        onChange={(e) =>
                          setSettingsMinLevelRequired(Number(e.target.value))
                        }
                        className="bg-slate-900 border border-slate-850 text-slate-300 font-extrabold text-xs px-2 py-1.5 rounded-lg"
                      >
                        {[0, 5, 10, 15, 20, 30, 50, 90].map((lvl) => (
                          <option key={lvl} value={lvl}>
                            Level {lvl}+
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                      <div>
                        <p className="text-xs font-bold text-slate-200">
                          VIP Badge Required
                        </p>
                        <p className="text-[9px] text-slate-500">
                          Enable this to refuse entry to users without an active
                          VIP badge.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingsVipRequired}
                        onChange={(e) =>
                          setSettingsVipRequired(e.target.checked)
                        }
                        className="w-4 h-4 rounded border-slate-800 focus:ring-purple-500 transition-all text-purple-600 bg-slate-900"
                      />
                    </div>

                    <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                      <div>
                        <p className="text-xs font-bold text-slate-200">
                          Must Follow Host
                        </p>
                        <p className="text-[9px] text-slate-500">
                          Reject entry attempts of users who do not follow the
                          host creator's account.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingsFollowRequired}
                        onChange={(e) =>
                          setSettingsFollowRequired(e.target.checked)
                        }
                        className="w-4 h-4 rounded border-slate-800 focus:ring-purple-500 transition-all text-purple-600 bg-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ADMIN LIST & AUTHORIZATIONS */}
              {settingsTab === "admins" && (() => {
                const combinedCandidatesMap = new Map();

                if (activeRoom.ownerId) {
                  combinedCandidatesMap.set(activeRoom.ownerId, {
                    id: activeRoom.ownerId,
                    displayName: activeRoom.ownerName || "Primary Owner",
                    avatarUrl: activeRoom.ownerAvatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
                    username: activeRoom.ownerId === "ebadul" ? "ebadul" : `owner_${activeRoom.ownerId.substring(0, 5)}`,
                    vipLevel: 10,
                    level: 99
                  });
                }

                if (activeRoom.memberProfiles && Array.isArray(activeRoom.memberProfiles)) {
                  activeRoom.memberProfiles.forEach((m: any) => {
                    combinedCandidatesMap.set(m.id, m);
                  });
                }

                if (activeRoom.audience && Array.isArray(activeRoom.audience)) {
                  activeRoom.audience.forEach((m: any) => {
                    combinedCandidatesMap.set(m.id, {
                      id: m.id,
                      displayName: m.displayName || m.username || `User ${m.id.substring(0, 5)}`,
                      avatarUrl: m.avatarUrl,
                      username: m.username || `user_${m.id.substring(0, 5)}`,
                      vipLevel: m.vipLevel ?? 0,
                      level: m.level ?? 1
                    });
                  });
                }

                if (roomFollowersData && Array.isArray(roomFollowersData)) {
                  roomFollowersData.forEach((m: any) => {
                    combinedCandidatesMap.set(m.id, {
                      id: m.id,
                      displayName: m.displayName || m.username || `User ${m.id.substring(0, 5)}`,
                      avatarUrl: m.avatarUrl,
                      username: m.username || `user_${m.id.substring(0, 5)}`,
                      vipLevel: m.vipLevel ?? 0,
                      level: m.level ?? 1
                    });
                  });
                }

                const allCandidates = Array.from(combinedCandidatesMap.values());
                const eligibleCandidates = allCandidates.filter(
                  (cand: any) => !activeRoom.admins?.includes(cand.id) && cand.id !== activeRoom.ownerId
                );

                return (
                  <div className="space-y-4">
                    {/* Selected Admin target details & interactive prompt */}
                    {selectedAdminTarget && (() => {
                      const isAdmin = activeRoom.admins?.includes(selectedAdminTarget.id);
                      const isOwner = selectedAdminTarget.id === activeRoom.ownerId;
                      return (
                        <div className="bg-slate-950 p-4.5 rounded-2xl border border-purple-500/30 shadow-2xl space-y-4 relative overflow-hidden animate-in fade-in zoom-in duration-150">
                          <button
                            onClick={() => setSelectedAdminTarget(null)}
                            className="absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-gray-400 hover:text-white text-xs select-none cursor-pointer"
                          >
                            ✕
                          </button>
                          
                          <div className="flex flex-col items-center text-center space-y-2">
                            <div className="relative">
                              <img
                                src={selectedAdminTarget.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                                alt=""
                                className="w-14 h-14 rounded-full border-2 border-purple-500/50 object-cover shadow-md"
                                referrerPolicy="no-referrer"
                              />
                              {isAdmin && (
                                <span className="absolute -bottom-1 -right-1 bg-purple-600 text-white text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full border border-slate-950 shadow">
                                  🛡️ ADMIN
                                </span>
                              )}
                              {isOwner && (
                                <span className="absolute -bottom-1 -right-1 bg-yellow-500 text-slate-950 text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full border border-slate-950 shadow">
                                  👑 OWNER
                                </span>
                              )}
                            </div>
                            
                            <div>
                              <h4 className="text-[12px] font-extrabold text-white tracking-wide">
                                {selectedAdminTarget.displayName}
                              </h4>
                              <p className="text-[9px] text-gray-400 font-mono">
                                @{selectedAdminTarget.username || selectedAdminTarget.id}
                              </p>
                              <p className="text-[8px] text-purple-400/80 font-mono mt-0.5 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/10 inline-block">
                                User ID: {selectedAdminTarget.id}
                              </p>
                            </div>
                          </div>

                          {/* Options / Actions section */}
                          <div className="space-y-2 pt-1">
                            {isOwner ? (
                              <div className="text-center p-2 rounded bg-slate-900 border border-slate-800 text-[9px] text-yellow-400 font-medium">
                                Primary Room Creator has permanent absolute privileges.
                              </div>
                            ) : activeRoom.ownerId !== user?.id ? (
                              <div className="text-center p-2 rounded bg-slate-900 border border-slate-800 text-[9px] text-red-400 font-medium">
                                Only the primary room owner (Creator) can manage admin privileges.
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2">
                                {isAdmin ? (
                                  <button
                                    onClick={async () => {
                                      await handleRoomAdminAction("remove_admin", selectedAdminTarget.id);
                                      setSelectedAdminTarget(null);
                                    }}
                                    className="w-full bg-gradient-to-r from-red-600 to-rose-650 hover:from-red-500 hover:to-rose-550 text-white font-black text-[10px] py-2 rounded-xl shadow uppercase tracking-wider transition cursor-pointer"
                                  >
                                    ❌ Remove Admin Role
                                  </button>
                                ) : (
                                  <button
                                    onClick={async () => {
                                      await handleRoomAdminAction("add_admin", selectedAdminTarget.id);
                                      setSelectedAdminTarget(null);
                                    }}
                                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-500 hover:to-indigo-550 text-white font-black text-[10px] py-2 rounded-xl shadow uppercase tracking-wider transition cursor-pointer"
                                  >
                                    🛡️ Promote to Admin
                                  </button>
                                )}
                              </div>
                            )}
                            
                            <button
                              onClick={() => setSelectedAdminTarget(null)}
                              className="w-full bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white font-bold text-[9px] py-1.5 rounded-lg border border-slate-800 uppercase tracking-wide transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850 space-y-2">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest pl-1">
                        Promote New Administrator Staff (Candidates List)
                      </label>
                      
                      {eligibleCandidates.length === 0 ? (
                        <div className="bg-slate-950/80 p-3.5 rounded-lg border border-red-950/60 text-center">
                          <p className="text-[10.5px] font-black text-rose-400 uppercase">
                            ⚠️ No Eligible Joined Members or Live Audience Found
                          </p>
                          <p className="text-[8.5px] text-slate-400 mt-1">
                            Koi bhi eligible member ya audience me available nahi hai jo already admin na ho! Unko room enter karne ko bolein.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {eligibleCandidates.map((cand: any) => (
                            <div
                              key={cand.id}
                              onClick={() => setSelectedAdminTarget(cand)}
                              className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-850 hover:border-purple-500/20 hover:bg-slate-900/60 transition-all shadow-sm cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <img
                                  src={cand.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                                  alt=""
                                  className="w-6 h-6 rounded-full border border-slate-700 object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="text-left">
                                  <p className="text-[10px] font-black text-white leading-tight">
                                    {cand.displayName}
                                  </p>
                                  <p className="text-[8px] text-purple-300 font-mono leading-none mt-0.5">
                                    @{cand.username} (ID: {cand.id})
                                  </p>
                                </div>
                              </div>
                              <span className="text-[7.5px] font-extrabold text-indigo-400 bg-indigo-950/40 border border-indigo-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider">
                                Promote 🛡️
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {activeRoom.ownerId !== user?.id && (
                        <p className="text-[8px] text-red-400 italic">
                          Only the Primary Owner (Creator Ebadul) holds privileges
                          to modify administrators.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest pl-1">
                        Active Staff List ({activeRoom.admins?.length})
                      </label>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {activeRoom.admins?.map((adm) => {
                          const cand = combinedCandidatesMap.get(adm) || {
                            id: adm,
                            displayName: adm === "ebadul" ? "Creator Ebadul" : (adm === activeRoom.ownerId ? activeRoom.ownerName : `Staff ID: ${adm}`),
                            avatarUrl: adm === activeRoom.ownerId ? (activeRoom.ownerAvatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80") : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
                            username: adm
                          };
                          return (
                            <div
                              key={adm}
                              onClick={() => setSelectedAdminTarget(cand)}
                              className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-850 hover:border-purple-500/20 hover:bg-slate-950/60 transition-all shadow-sm cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <img
                                  src={cand.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                                  alt=""
                                  className="w-6 h-6 rounded-full border border-slate-750 object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="text-left">
                                  <p className="text-[10px] font-black text-indigo-400 leading-tight flex items-center gap-1">
                                    🛡️ {cand.displayName}
                                    {adm === activeRoom.ownerId && (
                                      <span className="text-[7px] font-black bg-yellow-500/25 text-yellow-400 px-1 py-0.2 rounded uppercase">Owner</span>
                                    )}
                                  </p>
                                  <p className="text-[8px] text-gray-500 font-mono leading-none mt-0.5">
                                    @{cand.username || cand.id} (ID: {cand.id})
                                  </p>
                                </div>
                              </div>
                              
                              <span className="text-[7.5px] font-extrabold text-purple-400 bg-purple-950/40 border border-purple-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                Click to Manage
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* TAB 4: MEMBER MANAGEMENT (KICK, BANS, BLOCKERS) */}
              {settingsTab === "members" && (
                <div className="space-y-4">
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-2">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest pl-1">
                      Interactive Moderation Actions
                    </label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={settingsActionUserId}
                        onChange={(e) =>
                          setSettingsActionUserId(e.target.value)
                        }
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                        placeholder="Target User ID (e.g. u2, u3)..."
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() =>
                            handleRoomAdminAction("kick", settingsActionUserId)
                          }
                          className="bg-yellow-650/20 text-yellow-400 border border-yellow-500/25 py-2 rounded text-xs font-bold hover:bg-yellow-600 hover:text-slate-950 transition active:scale-95 cursor-pointer"
                        >
                          Kick From Seats 🥾
                        </button>
                        <button
                          onClick={() =>
                            handleRoomAdminAction("ban", settingsActionUserId)
                          }
                          className="bg-red-650/20 text-red-400 border border-red-500/25 py-2 rounded text-xs font-bold hover:bg-red-650 hover:text-white transition active:scale-95 cursor-pointer"
                        >
                          Ban (Blocked ID) 🚫
                        </button>
                        <button
                          onClick={() =>
                            handleRoomAdminAction("mute", settingsActionUserId)
                          }
                          className="bg-purple-650/20 text-purple-450 border border-purple-500/25 py-2 rounded text-xs font-bold hover:bg-purple-600 hover:text-white transition active:scale-95 cursor-pointer"
                        >
                          Mute Voice Chat 🔇
                        </button>
                        <button
                          onClick={() =>
                            handleRoomAdminAction(
                              "add_member",
                              settingsActionUserId,
                            )
                          }
                          className="bg-blue-650/20 text-blue-400 border border-blue-500/25 py-2 rounded text-xs font-bold hover:bg-blue-600 hover:text-white transition active:scale-95 cursor-pointer"
                        >
                          Add Official Member 👥
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Banned lists */}
                  <div className="space-y-2 bg-slate-900 border border-slate-800 p-3 rounded-xl">
                    <label className="text-[10px] text-red-400 font-extrabold uppercase tracking-widest">
                      Banned Users list ({activeRoom.bannedUsers?.length || 0})
                    </label>
                    {activeRoom.bannedUsers &&
                    activeRoom.bannedUsers.length > 0 ? (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {activeRoom.bannedUsers.map((buId) => {
                          const detailed = activeRoom.bannedUsersDetails?.find(d => d.id === buId);
                          return (
                            <div
                              key={buId}
                              className="flex justify-between items-center p-2 bg-slate-950 rounded border border-slate-850"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <img
                                  src={detailed?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"}
                                  alt="DP"
                                  className="w-6 h-6 rounded-full object-cover border border-slate-800"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="min-w-0">
                                  <p className="text-[11px] font-bold text-slate-200 truncate font-sans">
                                    {detailed?.displayName || `User ID ${buId}`}
                                  </p>
                                  <p className="text-[9px] text-slate-500 font-mono">
                                    ID: {buId}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRoomAdminAction("unban", buId)}
                                className="text-[9px] text-emerald-450 font-extrabold bg-emerald-500/10 px-2 py-1 rounded hover:bg-emerald-500 hover:text-slate-950 transition ml-2"
                              >
                                UNBAN
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500 italic text-center py-1">
                        No blocked lists currently registered on this room.
                      </p>
                    )}
                  </div>

                  {/* Muted list */}
                  <div className="space-y-2 bg-slate-900 border border-slate-800 p-3 rounded-xl">
                    <label className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest font-mono">
                      Muted Users list ({activeRoom.mutedUsers?.length || 0})
                    </label>
                    {activeRoom.mutedUsers &&
                    activeRoom.mutedUsers.length > 0 ? (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {activeRoom.mutedUsers.map((mu) => (
                          <div
                            key={mu}
                            className="flex justify-between items-center p-1.5 px-2 bg-slate-950 rounded border border-slate-850 font-mono text-[11px]"
                          >
                            <span className="text-slate-350">{mu}</span>
                            <button
                              onClick={() =>
                                handleRoomAdminAction("unmute", mu)
                              }
                              className="text-[9px] text-emerald-450 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded hover:bg-emerald-500 hover:text-slate-950 transition"
                            >
                              UNMUTE
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500 italic text-center py-1">
                        No users currently in muted list.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: SEAT MODERATION & NUMBER OF SEATS */}
              {settingsTab === "seats" && (
                <div className="space-y-4">
                  {/* Seat size options */}
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850 space-y-2.5">
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest pl-0.5">
                        Seat Layout Dimension
                      </label>
                      <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider pl-0.5">
                        Room Level: {activeRoom.level || 1} • {activeRoom.isOfficial ? "Official Status Active ✓" : "Standard Status"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {[8, 10, 12, 16, 20, 24, 30, 35].filter((s) => {
                        const isGlobalAdmin = user?.email === "ebadulhoque1234567890@gmail.com" || user?.isGlobalAdmin === true;
                        if (!isGlobalAdmin && s > 20) return false;
                        return true;
                      }).map((size) => {
                        // Inline check for unlocked seat layout size
                        const roomLvl = activeRoom.level || 1;
                        const isGlobalAdmin = user?.email === "ebadulhoque1234567890@gmail.com" || user?.isGlobalAdmin === true;
                        let unlocked = false;

                        if (isGlobalAdmin) {
                          unlocked = true;
                        } else if (size === 8) {
                          unlocked = true;
                        } else if (activeRoom.isOfficial) {
                          unlocked = size <= 20;
                        } else {
                          if (size === 10) unlocked = roomLvl >= 5;
                          else if (size === 12) unlocked = roomLvl >= 10;
                          else if (size === 16) unlocked = roomLvl >= 15;
                          else if (size === 20) unlocked = roomLvl >= 20;
                        }

                        const isSelected = settingsSeatLayout === size;
                        
                        let reqLabel = "";
                        if (size === 10) reqLabel = "Lvl 5";
                        else if (size === 12) reqLabel = "Lvl 10";
                        else if (size === 16) reqLabel = "Lvl 15";
                        else if (size === 20) reqLabel = "Lvl 20";
                        else if (size >= 24) reqLabel = "Global Admin";

                        return (
                          <button
                            key={size}
                            disabled={!unlocked}
                            onClick={() => {
                              setSettingsSeatLayout(size);
                              saveRoomSettings({ seatLayout: size });
                            }}
                            className={`p-2 py-2.5 rounded-lg border text-xs font-black transition relative flex flex-col items-center justify-center gap-1 ${
                              !unlocked
                                ? "bg-slate-950/40 text-slate-650 border-slate-900/60 cursor-not-allowed"
                                : isSelected
                                  ? "bg-purple-600/30 text-purple-300 border-purple-500 shadow-md ring-1 ring-purple-500/20"
                                  : "bg-slate-950 text-slate-300 border-slate-850 hover:border-slate-750 hover:text-white"
                            }`}
                          >
                            <span className="flex items-center gap-1 uppercase tracking-wider font-extrabold text-[10.5px]">
                              {size} Voice Seats
                              {!unlocked && <span className="text-[9px] filter grayscale opacity-70">🔒</span>}
                            </span>
                            
                            {!unlocked ? (
                              <span className="text-[8px] text-rose-500/90 font-black uppercase tracking-wider">
                                Requires {reqLabel}
                              </span>
                            ) : (
                              <span className={`text-[8px] font-black uppercase tracking-wider ${isSelected ? "text-amber-400" : "text-emerald-400"}`}>
                                {isSelected ? "● Active" : "Unlocks ✓"}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Individual Seat lock / unlocks list */}
                  <div className="space-y-2 bg-slate-900 border border-slate-800 p-3 rounded-xl">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
                      Active Mic Seats Controls ({activeRoom.seats?.length})
                    </label>
                    <div className="space-y-1.5 max-h-56 overflow-y-auto">
                      {activeRoom.seats?.map((st) => (
                        <div
                          key={st.index}
                          className="flex justify-between items-center p-2 bg-slate-950 rounded border border-slate-850 text-xs"
                        >
                          <div>
                            <span className="font-extrabold text-white mr-2">
                              Mic {st.index}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              [
                              {st.userId
                                ? `Occupied ID: ${st.userId}`
                                : "Empty Node"}
                              ]
                            </span>
                          </div>

                          <div className="flex gap-2">
                            {/* Toggle Lock */}
                            <button
                              onClick={async () => {
                                await fetch(
                                  `/api/rooms/${activeRoom.id}/moderation`,
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      requestingUserId: user.id,
                                      action: "lock_seat",
                                      seatIndex: st.index,
                                    }),
                                  },
                                );
                                await syncRoomDynamics();
                              }}
                              className={`px-2 py-0.5 rounded text-[9.5px] font-black uppercase transition-all ${st.isLocked ? "bg-red-500 text-slate-950" : "bg-slate-850 text-slate-400 hover:text-white"}`}
                            >
                              {st.isLocked ? "LOCKED 🔒" : "UNLOCK 🔓"}
                            </button>

                            {/* Toggle Mute */}
                            <button
                              onClick={async () => {
                                await fetch(
                                  `/api/rooms/${activeRoom.id}/moderation`,
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      requestingUserId: user.id,
                                      action: "mute_seat",
                                      seatIndex: st.index,
                                    }),
                                  },
                                );
                                await syncRoomDynamics();
                              }}
                              className={`px-2 py-0.5 rounded text-[9.5px] font-black uppercase transition-all ${st.isMutedByOwner ? "bg-purple-600 text-white" : "bg-slate-850 text-slate-400 hover:text-white"}`}
                            >
                              {st.isMutedByOwner ? "MUTED 🔇" : "ACTIVE 🎙️"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: CHAT SETTINGS, CODES, GENERAL RULES */}
              {settingsTab === "chat_seq" && (
                <div className="space-y-4">
                  {/* Chat restrictions */}
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-3">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest pl-0.5">
                      Text & Chat Flow restrictions
                    </label>

                    <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                      <div>
                        <p className="text-xs font-bold text-slate-250">
                          Disable Normal Text Restriction
                        </p>
                        <p className="text-[9px] text-slate-500">
                          Enable this to block all chat participants from typing
                          text message logs.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingsChatTextRestriction}
                        onChange={(e) =>
                          setSettingsChatTextRestriction(e.target.checked)
                        }
                        className="w-4 h-4 rounded border-slate-800 focus:ring-purple-500 text-purple-600 bg-slate-900"
                      />
                    </div>

                    <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                      <div>
                        <p className="text-xs font-bold text-slate-250">
                          Media/Sticker Restriction
                        </p>
                        <p className="text-[9px] text-slate-500">
                          Prevent uploading custom layout photos, gallery logs,
                          and dynamic voice nodes.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingsChatMediaRestriction}
                        onChange={(e) =>
                          setSettingsChatMediaRestriction(e.target.checked)
                        }
                        className="w-4 h-4 rounded border-slate-800 focus:ring-purple-500 text-purple-600 bg-slate-900"
                      />
                    </div>

                    <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                      <div>
                        <p className="text-xs font-bold text-slate-250">
                          Block All Hyperlinks / URL Ads
                        </p>
                        <p className="text-[9px] text-slate-500">
                          Instantly deletes advertisements links, discord URLs
                          or external spam logs.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingsChatLinkRestriction}
                        onChange={(e) =>
                          setSettingsChatLinkRestriction(e.target.checked)
                        }
                        className="w-4 h-4 rounded border-slate-800 focus:ring-purple-500 text-purple-600 bg-slate-900"
                      />
                    </div>

                    <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                      <div>
                        <p className="text-xs font-bold text-slate-250">
                          Bad Words Filter Algorithm
                        </p>
                        <p className="text-[9px] text-slate-500">
                          Automatically masks slurs and abusive language with
                          stars ***.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingsChatBadWordFilter}
                        onChange={(e) =>
                          setSettingsChatBadWordFilter(e.target.checked)
                        }
                        className="w-4 h-4 rounded border-slate-800 focus:ring-purple-500 text-purple-600 bg-slate-900"
                      />
                    </div>
                  </div>

                  {/* Effects Settings */}
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-3">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest pl-0.5">
                      Effects & Animation Settings
                    </label>

                    <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                      <div>
                        <p className="text-xs font-bold text-slate-250">
                          Skip Entrance Visual Effects
                        </p>
                        <p className="text-[9px] text-slate-500">
                          Removes the luxury entrance slides and custom flyovers
                          in chat room.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingsSkipEntranceEffects}
                        onChange={(e) =>
                          setSettingsSkipEntranceEffects(e.target.checked)
                        }
                        className="w-4 h-4 rounded border-slate-800 focus:ring-purple-500 text-purple-600 bg-slate-900"
                      />
                    </div>

                    <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                      <div>
                        <p className="text-xs font-bold text-slate-250">
                          Disable Bullet Screen / Floating Texts
                        </p>
                        <p className="text-[9px] text-slate-500">
                          Stops showing bullet streams floating over seats
                          during high speed discussions.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingsDisableBulletScreen}
                        onChange={(e) =>
                          setSettingsDisableBulletScreen(e.target.checked)
                        }
                        className="w-4 h-4 rounded border-slate-800 focus:ring-purple-500 text-purple-600 bg-slate-900"
                      />
                    </div>

                    <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                      <div>
                        <p className="text-xs font-bold text-slate-250">
                          Turn Off Gift Animations
                        </p>
                        <p className="text-[9px] text-slate-500">
                          Disable heavy 3D floating and flash gift layouts to
                          prevent lag on weak systems.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingsDisableGiftAnimation}
                        onChange={(e) =>
                          setSettingsDisableGiftAnimation(e.target.checked)
                        }
                        className="w-4 h-4 rounded border-slate-800 focus:ring-purple-500 text-purple-600 bg-slate-900"
                      />
                    </div>

                    <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                      <div>
                        <p className="text-xs font-bold text-slate-250">
                          Disable Join Notification Popups
                        </p>
                        <p className="text-[9px] text-slate-500">
                          Mutes system establishing logs when users join.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingsDisableJoinNotification}
                        onChange={(e) =>
                          setSettingsDisableJoinNotification(e.target.checked)
                        }
                        className="w-4 h-4 rounded border-slate-800 focus:ring-purple-500 text-purple-600 bg-slate-900"
                      />
                    </div>
                  </div>

                  {/* Security Settings */}
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-3">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest pl-0.5">
                      High Security Safeguards
                    </label>

                    <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                      <div>
                        <p className="text-xs font-bold text-slate-250">
                          Invisible Private Room
                        </p>
                        <p className="text-[9px] text-slate-500">
                          Removes this room from lists. Users can only join by
                          inputting direct IDs.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingsIsPrivate}
                        onChange={(e) => setSettingsIsPrivate(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-800 focus:ring-purple-500 text-purple-600 bg-slate-900"
                      />
                    </div>

                    <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                      <div>
                        <p className="text-xs font-bold text-slate-250">
                          Enable Anti-Spam protection
                        </p>
                        <p className="text-[9px] text-slate-500">
                          Requires 3 seconds wait time between sending serial
                          message lines.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingsAntiSpam}
                        onChange={(e) => setSettingsAntiSpam(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-800 focus:ring-purple-500 text-purple-600 bg-slate-900"
                      />
                    </div>

                    <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                      <div>
                        <p className="text-xs font-bold text-slate-250">
                          Anti-Abuse moderation bot
                        </p>
                        <p className="text-[9px] text-slate-500">
                          Auto kick or mute callers flagged for continuous
                          extreme audio levels.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingsAntiAbuse}
                        onChange={(e) => setSettingsAntiAbuse(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-800 focus:ring-purple-500 text-purple-600 bg-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showCreateRoomModal && !roomsList.some(r => r.ownerId === user?.id) && (
        <div className="absolute inset-x-2 top-24 bottom-14 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="w-full bg-slate-900 border border-purple-500/35 rounded-3xl p-4.5 flex flex-col gap-3 max-w-xs animate-scale-up text-left shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[11px] font-black text-white uppercase tracking-wider">
                Establish Voice Room
              </span>
              <button
                onClick={() => setShowCreateRoomModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5 mt-1">
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-bold text-gray-400 uppercase">
                  Room Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bangladesh Chat Masters"
                  value={newMobRoomName}
                  onChange={(e) => setNewMobRoomName(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-700 outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-bold text-gray-400 uppercase">
                    Category
                  </label>
                  <select
                    value={newMobRoomCategory}
                    onChange={(e) =>
                      setNewMobRoomCategory(e.target.value as any)
                    }
                    className="bg-slate-950 border border-slate-800 rounded-lg px-1 py-1 text-xs text-white outline-none"
                  >
                    <option value="public">📢 Public</option>
                    <option value="music">🎵 Music</option>
                    <option value="gaming">🎮 Gaming</option>
                    <option value="couple">💖 Couple</option>
                    <option value="family">🦁 Family</option>
                    <option value="pk">🔥 PK Battle</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-bold text-gray-400 uppercase">
                    Microphones
                  </label>
                  <select
                    value={newMobRoomLayout}
                    onChange={(e) =>
                      setNewMobRoomLayout(Number(e.target.value) as any)
                    }
                    className="bg-slate-950 border border-slate-800 rounded-lg px-1 py-1 text-xs text-white outline-none"
                  >
                    {[8, 10, 12, 16, 20, 24, 30, 35].filter((size) => {
                      const isGlobalAdmin = user?.email === "ebadulhoque1234567890@gmail.com" || user?.isGlobalAdmin === true;
                      if (!isGlobalAdmin && size > 20) return false;
                      return true;
                    }).map((size) => {
                      const isGlobalAdmin = user?.email === "ebadulhoque1234567890@gmail.com" || user?.isGlobalAdmin === true;
                      let isLocked = false;
                      if (!isGlobalAdmin) {
                        // At room creation, normal user room starts at Level 1, so sizes > 8 are locked.
                        if (size > 8) isLocked = true;
                      }
                      return (
                        <option key={size} value={size} disabled={isLocked}>
                          {size} Seats {isLocked ? "🔒 (Lvl Locked)" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-bold text-gray-400 uppercase">
                  Choose Cover Accent
                </label>
                <div className="grid grid-cols-4 gap-1.5 mt-1">
                  {[
                    "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=150&q=80",
                    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=150&q=80",
                    "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=150&q=80",
                    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=150&q=80",
                  ].map((url, idx) => (
                    <button
                      key={url}
                      onClick={() => setNewMobRoomBg(url)}
                      className={`h-8 rounded-lg overflow-hidden border-2 transition-all relative ${newMobRoomBg === url ? "border-purple-500 scale-95" : "border-transparent opacity-60"}`}
                    >
                      <img
                        src={url}
                        alt={`Preset ${idx}`}
                        className="w-full h-full object-cover"
                      />
                      {newMobRoomBg === url && (
                        <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center text-white text-[9px]">
                          ✓
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Direct Gallery Upload Option for Room Creation */}
                <div className="mt-2 p-2 bg-slate-950/50 rounded-xl border border-slate-800 flex flex-col gap-1">
                  <span className="text-[8px] font-bold text-purple-400 uppercase flex items-center gap-1">
                    🖼️ Custom Cover (Gallery/Phone)
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="room-creation-cover-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            triggerGlobalError("Uploading custom room cover...");
                            const url = await handleImageFileUpload(file);
                            setNewMobRoomBg(url);
                            triggerGlobalError("Success: Custom room cover uploaded!");
                          } catch (err: any) {
                            triggerGlobalError(err.message || "Failed to upload image");
                          }
                        }
                      }}
                    />
                    <label
                      htmlFor="room-creation-cover-upload"
                      className="cursor-pointer bg-purple-600 hover:bg-purple-550 text-white px-2.5 py-1 rounded text-[8px] font-black uppercase select-none tracking-wide"
                    >
                      Upload Image
                    </label>
                    <span className="text-[7.5px] text-gray-400 truncate flex-1 font-mono">
                      {newMobRoomBg ? (newMobRoomBg.startsWith("/uploads/") ? "✓ Custom Cover Selected" : "✓ Preset Selected") : "No file chosen"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setShowCreateRoomModal(false)}
                className="flex-1 py-1.5 bg-slate-950 border border-slate-800 text-gray-400 font-bold rounded-lg text-[10px] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMobileRoom}
                className="flex-1 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-lg text-[10px] uppercase"
              >
                Build
              </button>
            </div>
          </div>
        </div>
      )}

      {showGooglePickerModal && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[110] p-4">
          <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col gap-4 max-w-xs animate-scale-up text-left shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22-.19-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-wider">
                  Choose Google Account
                </span>
              </div>
              <button
                onClick={() => setShowGooglePickerModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[9px] text-gray-400 font-medium">
              to continue to <span className="text-yellow-400 font-bold">EbadulChat Fun</span>
            </p>

            {!showAddGoogleAccount ? (
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                {googlePresets.map((preset) => (
                  <button
                    key={preset.email}
                    onClick={() => handleSelectGoogleAccount(preset)}
                    className="w-full flex items-center gap-2.5 p-2 bg-slate-950 hover:bg-slate-800/80 border border-slate-850 hover:border-yellow-400/40 rounded-xl transition-all text-left"
                  >
                    <img
                      src={preset.avatarUrl}
                      alt={preset.displayName}
                      className="w-8 h-8 rounded-full border border-white/5 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{preset.displayName}</p>
                      <p className="text-[9px] text-gray-500 truncate">{preset.email}</p>
                    </div>
                  </button>
                ))}

                <button
                  onClick={() => setShowAddGoogleAccount(true)}
                  className="w-full flex items-center gap-3 p-2.5 bg-slate-950/40 hover:bg-slate-800/50 border border-dashed border-slate-800 hover:border-slate-700 rounded-xl transition-all text-left mt-1"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-300">Add another Google Account</p>
                    <p className="text-[9px] text-gray-500">Sign in with a different email address</p>
                  </div>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-bold text-gray-400 uppercase">Gmail Address</label>
                  <input
                    type="email"
                    placeholder="example@gmail.com"
                    value={addGoogleEmail}
                    onChange={(e) => setAddGoogleEmail(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-700 outline-none focus:border-yellow-500"
                  />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-bold text-gray-400 uppercase">Full Name</label>
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={addGoogleName}
                    onChange={(e) => setAddGoogleName(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-700 outline-none focus:border-yellow-500"
                  />
                </div>

                <div className="flex gap-2.5 mt-1">
                  <button
                    onClick={() => {
                      setShowAddGoogleAccount(false);
                      setAddGoogleEmail("");
                      setAddGoogleName("");
                    }}
                    className="flex-1 py-1.5 bg-slate-950 border border-slate-850 text-gray-400 font-bold rounded-lg text-[10px] hover:text-white"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      if (!addGoogleEmail.trim() || !addGoogleName.trim()) {
                        triggerGlobalError("Please enter both email and name.");
                        return;
                      }
                      if (!addGoogleEmail.toLowerCase().endsWith("@gmail.com")) {
                        triggerGlobalError("Please enter a valid Gmail address.");
                        return;
                      }
                      const newAccount = {
                        email: addGoogleEmail.trim().toLowerCase(),
                        displayName: addGoogleName.trim(),
                        avatarUrl: addGoogleAvatar
                      };
                      setGooglePresets(prev => [...prev, newAccount]);
                      setShowAddGoogleAccount(false);
                      setAddGoogleEmail("");
                      setAddGoogleName("");
                      handleSelectGoogleAccount(newAccount);
                    }}
                    className="flex-1 py-1.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 font-black rounded-lg text-[10px] uppercase"
                  >
                    Add & Select
                  </button>
                </div>
              </div>
            )}

            <div className="text-[8px] text-gray-500 text-center leading-normal mt-1 border-t border-slate-850 pt-2 font-mono">
              Google Account Sign-In safely simulated inside the sandbox device environment.
            </div>
          </div>
        </div>
      )}

      {showRoomExitConfirm && activeRoom && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[200] p-4 font-sans">
          <div className="w-full bg-slate-900 border border-red-500/35 rounded-3xl p-5 flex flex-col gap-4 max-w-xs animate-scale-up text-left shadow-2xl relative">
            <div className="text-center border-b border-slate-800 pb-3">
              <span className="text-xs font-black text-rose-500 uppercase tracking-widest block mb-1">
                🚪 LEAVE VOICE ROOM?
              </span>
              <p className="text-[9.5px] text-gray-400 leading-normal font-medium">
                Are you sure you want to completely exit and disconnect from <span className="text-white font-bold">{activeRoom.name}</span>?
              </p>
            </div>

            <div className="flex flex-col gap-2.5 mt-1">
              <button
                type="button"
                onClick={() => {
                  setShowRoomExitConfirm(false);
                  handleLeaveRoom();
                }}
                className="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-red-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Yes, Leave Room 🚪
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowRoomExitConfirm(false);
                  if (mobileRoute === "room") {
                    setMobileRoute("explore");
                  }
                }}
                className="w-full py-2.5 bg-slate-950 border border-slate-850 text-gray-300 hover:text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                No, Keep Minimized 🎧
              </button>
            </div>
          </div>
        </div>
      )}

      {showProfileOnboarding && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-[110] p-4 font-sans">
          <div className="w-full bg-slate-900 border-2 border-yellow-400/20 rounded-3xl p-5 flex flex-col gap-4 max-w-xs animate-scale-up text-left shadow-2xl relative max-h-[85vh] overflow-y-auto">
            
            <div className="text-center border-b border-slate-800 pb-3">
              <span className="text-xs font-black text-yellow-400 uppercase tracking-widest block mb-1">
                ✨ COMPLETE PROFILE ✨
              </span>
              <p className="text-[9px] text-gray-400 leading-normal font-medium">
                Choose your gender, birthday, and verify details to complete EbadulChat registration
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <svg className="w-3 h-3 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.133 9.21l8.2-1.192z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider">Synced Google ID</p>
                <p className="text-[9.5px] text-gray-500 truncate font-mono">{onboardingEmail}</p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-1.5 mt-1">
              <div className="relative group">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-yellow-400 relative">
                  <img
                    src={onboardingAvatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                    alt="Selected Avatar"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setOnboardingPresetAvatarSelector(true)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[8px] font-black uppercase tracking-wider"
                  >
                    <Camera className="w-4 h-4 mb-0.5" />
                    Change
                  </button>
                </div>
                
                <button
                  type="button"
                  onClick={() => setOnboardingPresetAvatarSelector(true)}
                  className="absolute bottom-0 right-0 bg-yellow-400 hover:bg-yellow-300 text-slate-950 rounded-full p-1 shadow-md transition-transform active:scale-95"
                >
                  <Wrench className="w-3 h-3" />
                </button>
              </div>
              <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Profile Photo</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-wider">Display Name</label>
              <input
                type="text"
                placeholder="Name"
                value={onboardingDisplayName}
                onChange={(e) => setOnboardingDisplayName(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-700 outline-none focus:border-yellow-500 font-semibold"
              />
              {/* STYLISH SUGGESTIONS */}
              {onboardingDisplayName.trim() && (
                <div className="mt-1 flex flex-col gap-1">
                  <span className="text-[7px] font-black text-yellow-500 uppercase tracking-widest block">
                    ✨ Tap to apply stylish style:
                  </span>
                  <div className="flex gap-1.5 overflow-x-auto py-1.5 scrollbar-none select-none max-w-full">
                    {generateStylishOptions(onboardingDisplayName).map((style, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => setOnboardingDisplayName(style)}
                        className="bg-slate-950 hover:bg-slate-800 text-[8.5px] font-extrabold text-white px-2 py-1 rounded-lg border border-slate-800 whitespace-nowrap active:scale-95 transition-transform shrink-0"
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-wider">Date of Birth</label>
                {onboardingDob && (
                  <span className="text-[8.5px] font-black text-yellow-400 uppercase">
                    Age: {calculateAge(onboardingDob)} years old
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={onboardingDob}
                  onChange={(e) => setOnboardingDob(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-yellow-500 font-semibold uppercase tracking-wider text-center"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-wider block mb-1">Select Gender</label>
              <div className="grid grid-cols-2 gap-3">
                
                <button
                  type="button"
                  onClick={() => setOnboardingGender(Gender.MALE)}
                  className={`py-2 px-3 rounded-2xl flex flex-col items-center justify-center border transition-all cursor-pointer ${
                    onboardingGender === Gender.MALE
                      ? "bg-indigo-600/20 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.2)] text-white scale-102"
                      : "bg-slate-950 border-slate-850 hover:border-slate-800 text-gray-400 hover:text-slate-200"
                  }`}
                >
                  <span className="text-lg mb-1">🙋‍♂️</span>
                  <span className="text-xs font-bold uppercase tracking-wider">Male</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOnboardingGender(Gender.FEMALE)}
                  className={`py-2 px-3 rounded-2xl flex flex-col items-center justify-center border transition-all cursor-pointer ${
                    onboardingGender === Gender.FEMALE
                      ? "bg-pink-600/20 border-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.2)] text-white scale-102"
                      : "bg-slate-950 border-slate-850 hover:border-slate-800 text-gray-400 hover:text-slate-200"
                  }`}
                >
                  <span className="text-lg mb-1">🙋‍♀️</span>
                  <span className="text-xs font-bold uppercase tracking-wider">Female</span>
                </button>

              </div>
            </div>

            <div className="flex gap-3 mt-1.5">
              <button
                type="button"
                onClick={() => {
                  setShowProfileOnboarding(false);
                  triggerGlobalError("Profile completion canceled.");
                }}
                className="flex-1 py-2 bg-slate-950 border border-slate-800 text-gray-400 font-extrabold rounded-xl text-xs hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteOnboarding}
                className="flex-1 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-yellow-500/10"
              >
                Let's Enter 🚀
              </button>
            </div>

          </div>

          {onboardingPresetAvatarSelector && (
            <div className="absolute inset-0 bg-slate-950/90 flex items-center justify-center z-[120] p-4">
              <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-4.5 flex flex-col gap-3.5 max-w-xs text-left animate-scale-up shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-black text-white uppercase tracking-wider">Select Premium Avatar</span>
                  <button onClick={() => setOnboardingPresetAvatarSelector(false)} className="text-gray-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                  {[
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
                    "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80",
                    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
                    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
                    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80",
                  ].map((url, idx) => (
                    <button
                      key={url}
                      onClick={() => {
                        setOnboardingAvatarUrl(url);
                        setOnboardingPresetAvatarSelector(false);
                      }}
                      className="h-12 w-12 rounded-xl overflow-hidden border border-slate-800 hover:border-yellow-400 transition-colors relative"
                    >
                      <img src={url} alt={`Avatar Preset ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-800 pt-3">
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Upload Custom Image</span>
                  <input
                    type="file"
                    id="onboarding-custom-avatar"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          triggerGlobalError("Uploading selected photo...");
                          const url = await handleImageFileUpload(file, "avatars");
                          setOnboardingAvatarUrl(url);
                          setOnboardingPresetAvatarSelector(false);
                          triggerGlobalError("Success: Custom profile photo uploaded!");
                        } catch (err: any) {
                          triggerGlobalError(err.message || "Failed to upload image");
                        }
                      }
                    }}
                  />
                  <label
                    htmlFor="onboarding-custom-avatar"
                    className="cursor-pointer bg-purple-600 hover:bg-purple-550 text-white w-full py-1.5 rounded-xl text-[9px] font-black uppercase text-center block tracking-wide select-none transition-colors"
                  >
                    Select Photo from Gallery
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {showPaymentModal && selectedPaymentPlan && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-[150] p-4 font-sans">
          <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col gap-4 max-w-xs animate-scale-up text-left shadow-2xl relative">
            
            {/* Header */}
            {!paymentProcessing && !paymentSuccess && (
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💳</span>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      UPI Payment Gateway
                    </h4>
                    <span className="text-[7px] text-cyan-400 font-bold uppercase tracking-widest font-mono">
                      Secure Instant Settlement
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* MAIN INTERACTIVE STATE */}
            {!paymentProcessing && !paymentSuccess ? (
              <div className="flex flex-col gap-3.5">
                {/* Summary Box */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                  <span className="text-[7px] font-black text-gray-500 uppercase tracking-wider block mb-1">
                    ORDER SUMMARY
                  </span>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-black text-white">
                      💎 {selectedPaymentPlan.diamonds.toLocaleString()} Diamonds
                    </span>
                    <span className="text-xs font-black text-yellow-400">
                      ₹{selectedPaymentPlan.inr}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[8px] text-gray-400 uppercase font-black tracking-wide">
                    <span>Bonus Coins Included:</span>
                    <span className="text-cyan-400">+{selectedPaymentPlan.coins.toLocaleString()} Coins</span>
                  </div>
                </div>

                {/* Method selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">
                    Choose Payment App:
                  </label>
                  
                  {/* PhonePe */}
                  <div
                    onClick={() => setSelectedPaymentMethod("phonepe")}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      selectedPaymentMethod === "phonepe"
                        ? "bg-purple-950/20 border-purple-500 text-purple-300"
                        : "bg-slate-950/60 border-slate-850 text-gray-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">🟣</span>
                      <span className="text-[10px] font-black uppercase tracking-wider">PhonePe UPI</span>
                    </div>
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      selectedPaymentMethod === "phonepe" ? "border-purple-400 bg-purple-500" : "border-slate-700"
                    }`}>
                      {selectedPaymentMethod === "phonepe" && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                    </div>
                  </div>

                  {/* Google Pay */}
                  <div
                    onClick={() => setSelectedPaymentMethod("gpay")}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      selectedPaymentMethod === "gpay"
                        ? "bg-blue-950/20 border-blue-500 text-blue-300"
                        : "bg-slate-950/60 border-slate-850 text-gray-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">🔵</span>
                      <span className="text-[10px] font-black uppercase tracking-wider">Google Pay (GPay)</span>
                    </div>
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      selectedPaymentMethod === "gpay" ? "border-blue-400 bg-blue-500" : "border-slate-700"
                    }`}>
                      {selectedPaymentMethod === "gpay" && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                    </div>
                  </div>

                  {/* Paytm */}
                  <div
                    onClick={() => setSelectedPaymentMethod("paytm")}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      selectedPaymentMethod === "paytm"
                        ? "bg-cyan-950/20 border-cyan-500 text-cyan-300"
                        : "bg-slate-950/60 border-slate-850 text-gray-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">🌐</span>
                      <span className="text-[10px] font-black uppercase tracking-wider">Paytm Wallet / UPI</span>
                    </div>
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      selectedPaymentMethod === "paytm" ? "border-cyan-400 bg-cyan-500" : "border-slate-700"
                    }`}>
                      {selectedPaymentMethod === "paytm" && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                    </div>
                  </div>

                  {/* Custom UPI ID */}
                  <div
                    onClick={() => setSelectedPaymentMethod("upi_id")}
                    className={`flex flex-col gap-1.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      selectedPaymentMethod === "upi_id"
                        ? "bg-emerald-950/20 border-emerald-500 text-emerald-300"
                        : "bg-slate-950/60 border-slate-850 text-gray-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">🟢</span>
                        <span className="text-[10px] font-black uppercase tracking-wider">Enter Custom UPI ID</span>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        selectedPaymentMethod === "upi_id" ? "border-emerald-400 bg-emerald-500" : "border-slate-700"
                      }`}>
                        {selectedPaymentMethod === "upi_id" && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                      </div>
                    </div>

                    {selectedPaymentMethod === "upi_id" && (
                      <input
                        type="text"
                        placeholder="e.g. user@ybl, ebadul@okaxis"
                        value={customUpiId}
                        onChange={(e) => setCustomUpiId(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] text-white placeholder-slate-700 outline-none focus:border-emerald-500 font-bold"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </div>
                </div>

                {/* Confirm Pay Button */}
                <button
                  type="button"
                  onClick={handleConfirmUPIPayment}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black uppercase tracking-widest text-xs rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-1 cursor-pointer"
                >
                  Pay ₹{selectedPaymentPlan.inr} Now 🔒
                </button>
              </div>
            ) : paymentProcessing ? (
              /* PROCESSING STATE */
              <div className="flex flex-col items-center justify-center text-center py-6 gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-4 border-cyan-500/10 border-t-cyan-500 animate-spin"></div>
                  <span className="absolute inset-0 flex items-center justify-center text-lg animate-pulse">🔒</span>
                </div>
                <div>
                  <h5 className="text-xs font-black text-white uppercase tracking-wider">
                    Authorizing UPI Request
                  </h5>
                  <p className="text-[8.5px] text-gray-400 mt-1 leading-relaxed max-w-[200px]">
                    Simulating secure checkout with <span className="text-cyan-400 font-bold uppercase">{selectedPaymentMethod}</span>. Do not close or press back.
                  </p>
                </div>
              </div>
            ) : (
              /* SUCCESS STATE */
              <div className="flex flex-col items-center justify-center text-center py-5 gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/40 rounded-full flex items-center justify-center text-2xl text-emerald-400 animate-bounce">
                  ✓
                </div>
                <div>
                  <h5 className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                    Payment Successful!
                  </h5>
                  <p className="text-[9px] text-gray-300 mt-1 leading-normal max-w-[210px]">
                    ₹{selectedPaymentPlan.inr} has been successfully settled. Added <span className="text-white font-bold">{selectedPaymentPlan.diamonds.toLocaleString()} Diamonds</span> & <span className="text-white font-bold">{selectedPaymentPlan.coins.toLocaleString()} Coins</span> to your wallet!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs font-extrabold uppercase tracking-wide hover:bg-slate-800 transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
