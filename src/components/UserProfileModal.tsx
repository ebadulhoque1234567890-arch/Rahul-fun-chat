import React, { useState, useEffect, useRef } from "react";
import { 
  X, CheckCircle, Shield, Award, Sparkles, Heart, Users, Calendar, 
  MapPin, Gift, Image, Star, Volume2, ShieldAlert, Ban, Share2, 
  UserPlus, UserMinus, MessageSquare, Phone, Video, Send, 
  Coins, Trophy, ChevronRight, Lock, Eye, Bell, ShieldOff, CreditCard, Play,
  Home, PlusCircle
} from "lucide-react";
import { UserProfile, VipLevel, Gender, GiftItem, Family } from "../types";

const getVipNameStyle = (level?: number, vipEnum?: string) => {
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

const getVipIdStyle = (level?: number, vipEnum?: string) => {
  let lvl = level || 0;
  if (!lvl && vipEnum) {
    if (vipEnum === "emperor" || vipEnum === VipLevel.EMPEROR) lvl = 20;
    else if (vipEnum === "royal" || vipEnum === VipLevel.ROYAL) lvl = 15;
    else if (vipEnum === "svip" || vipEnum === VipLevel.SVIP) lvl = 10;
    else if (vipEnum === "vip" || vipEnum === VipLevel.VIP) lvl = 5;
  }
  if (lvl === 0) return "text-gray-500 text-[8px]";
  if (lvl <= 5) return "text-yellow-300 font-bold bg-yellow-950/40 px-1 rounded text-[8px] border border-yellow-800/30 shadow-sm";
  if (lvl <= 7) return "text-indigo-300 font-medium bg-indigo-950/40 px-1 rounded text-[8px] border border-indigo-900/30";
  if (lvl <= 9) return "text-pink-300 font-bold bg-pink-950/40 px-1.5 py-0.2 rounded text-[8px] border border-pink-900/30 shadow-sm";
  if (lvl <= 12) return "text-cyan-300 font-bold bg-cyan-950/40 px-1.5 py-0.2 rounded text-[8px] border border-cyan-800/40 shadow-sm animate-pulse";
  if (lvl <= 15) return "text-blue-200 font-black bg-blue-950/60 px-1.5 py-0.5 rounded-sm text-[8px] border border-blue-500/30 shadow-[0_0_6px_rgba(59,130,246,0.3)]";
  if (lvl <= 18) return "text-fuchsia-200 font-black bg-fuchsia-950/60 px-1.5 py-0.5 rounded-sm text-[8.5px] border border-fuchsia-500/40 shadow-[0_0_8px_rgba(217,70,239,0.4)] animate-pulse";
  return "text-amber-100 font-black bg-gradient-to-r from-amber-900/40 to-slate-900 px-2 py-0.5 rounded-md text-[9px] border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.6)] font-mono tracking-wide animate-pulse";
};

const VipAvatarFrame = ({
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

// Animated Avatar Frames presets
const AVATAR_FRAMES = [
  { id: "gold_halo", name: "Imperial Gold Halo 🌟", borderClass: "border-gradient-to-r from-yellow-400 via-amber-500 to-yellow-300 shadow-yellow-500/50" },
  { id: "ruby_spark", name: "Fiery Ruby Spark 🔥", borderClass: "border-gradient-to-r from-red-500 via-rose-600 to-orange-500 shadow-rose-500/50" },
  { id: "ocean_sapphire", name: "Mystic Ocean Sapphire 🌊", borderClass: "border-gradient-to-r from-blue-400 via-indigo-500 to-cyan-400 shadow-blue-500/50" },
  { id: "emperor_royal", name: "Lord Emperor Royal 👑", borderClass: "border-gradient-to-r from-purple-500 via-pink-600 to-yellow-400 shadow-pink-500/50 animate-pulse" },
];

// Custom Medals list for Achievement Tab
const ACHIEVEMENT_MEDALS = [
  { id: "m1", title: "Diamond Mic 🎙️", desc: "Top voice performer with 50+ hours of continuous voice streams.", color: "text-cyan-400 border-cyan-400/30" },
  { id: "m2", title: "Grand Whale 🐳", desc: "Sent over 100,000+ coins in luxury room gifts.", color: "text-amber-400 border-amber-400/30" },
  { id: "m3", title: "Eid Gold Hero 🌙", desc: "Exclusive limited-edition winner of the Grand Eid Party.", color: "text-yellow-400 border-yellow-400/30" },
  { id: "m4", title: "PK Terminator 🗡️", desc: "Won 15+ consecutive room PK battles without defeat.", color: "text-red-400 border-red-400/30" },
];

interface UserProfileModalProps {
  profile: UserProfile;
  loggedInUser: UserProfile | null;
  onClose: () => void;
  onSetUser: (u: UserProfile) => void; // Sync state to parent
  onInitiatePrivateChat?: (targetUser: UserProfile) => void;
  onTeleportToRoom?: (roomId: string) => void;
  onGlobalMessage?: (msg: string) => void;
  activeRoom?: any;
  onModerationAction?: (action: string, targetUserId: string) => void;
  onMentionUser?: (name: string) => void;
  onLogout?: () => void;
  startOpenRelationshipCenter?: boolean;
}

export default function UserProfileModal({
  profile,
  loggedInUser,
  onClose,
  onSetUser,
  onInitiatePrivateChat,
  onTeleportToRoom,
  onGlobalMessage,
  activeRoom,
  onModerationAction,
  onMentionUser,
  onLogout,
  startOpenRelationshipCenter = false
}: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [showAdminMenu, setShowAdminMenu] = useState<boolean>(false);
  const [showReportReasons, setShowReportReasons] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  
  // Real-time fetched profile for fresh metrics and updates
  const [liveProfile, setLiveProfile] = useState<UserProfile>(profile);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isFriend, setIsFriend] = useState<boolean>(false);
  const [activeFrame, setActiveFrame] = useState<string>("gold_halo");

  // Social Lists States
  const [showSocialList, setShowSocialList] = useState<"followers" | "following" | null>(null);
  const [socialUsers, setSocialUsers] = useState<UserProfile[]>([]);
  const [loadingSocial, setLoadingSocial] = useState<boolean>(false);
  
  // Premium Store States
  const [storeItems, setStoreItems] = useState<any[]>([]);
  const [loadingStore, setLoadingStore] = useState<boolean>(false);
  const [buyingItemId, setBuyingItemId] = useState<string | null>(null);
  const [equippingItemId, setEquippingItemId] = useState<string | null>(null);

  // Relationship system states
  const [relationshipData, setRelationshipData] = useState<{
    active: any[];
    requests: any[];
    history: any[];
    rewards: any[];
    levelConfigs: any[];
    dailyTasks: any[];
  } | null>(null);
  const [showRelationshipCenter, setShowRelationshipCenter] = useState(startOpenRelationshipCenter);
  const [relationshipLoading, setRelationshipLoading] = useState(false);

  const fetchRelationshipData = async () => {
    if (!liveProfile?.id) return;
    try {
      setRelationshipLoading(true);
      const res = await fetch(`/api/relationships/user/${liveProfile.id}`);
      if (res.ok) {
        const data = await res.json();
        setRelationshipData(data);
      }
    } catch (err) {
      console.error("Error fetching relationship data:", err);
    } finally {
      setRelationshipLoading(false);
    }
  };

  useEffect(() => {
    fetchRelationshipData();
  }, [liveProfile?.id]);

  const [relActiveTab, setRelActiveTab] = useState<string>("active");

  const handleSendRequest = async (type: string, useDiamonds = false) => {
    if (!loggedInUser) {
      triggerMessage("Auth required!");
      return;
    }
    try {
      const res = await fetch("/api/relationships/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: loggedInUser.id,
          receiverId: liveProfile.id,
          type,
          useDiamonds
        })
      });
      const data = await res.json();
      if (!res.ok) {
        if (!useDiamonds && data.error && (data.error.includes("Unlock conditions") || data.error.includes("Requires") || data.error.includes("Must be friends") || data.error.includes("level"))) {
          const confirmBypass = window.confirm(
            `${data.error}\n\nWould you like to spend 10,000 Diamonds to bypass these requirements and send your relationship request immediately?`
          );
          if (confirmBypass) {
            handleSendRequest(type, true);
          }
        } else {
          triggerMessage(data.error || "Failed to send proposal.");
        }
      } else {
        triggerMessage(useDiamonds ? "Proposal sent using 10,000 Diamonds! 💎💖" : "Proposal sent successfully! 💖");
        fetchRelationshipData();
        if (onSetUser && data.userDiamonds !== undefined) {
          onSetUser({ ...loggedInUser, diamonds: data.userDiamonds });
        }
      }
    } catch (err) {
      console.error(err);
      triggerMessage("Network error sending request.");
    }
  };

  const handleRequestAction = async (requestId: string, action: string) => {
    if (!loggedInUser) return;
    try {
      const res = await fetch("/api/relationships/request/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          userId: loggedInUser.id,
          action
        })
      });
      const data = await res.json();
      if (!res.ok) {
        triggerMessage(data.error || "Action failed.");
      } else {
        triggerMessage(`Proposal ${action}ed!`);
        fetchRelationshipData();
      }
    } catch (err) {
      console.error(err);
      triggerMessage("Network error handling request.");
    }
  };

  const handleRemoveRelationship = async (targetId: string) => {
    if (!loggedInUser) return;
    if (!confirm("Are you sure you want to dissolve this relationship? Level progress and streak stats will be lost!")) return;
    try {
      const res = await fetch("/api/relationships/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: loggedInUser.id,
          targetId
        })
      });
      if (res.ok) {
        triggerMessage("Relationship dissolved.");
        fetchRelationshipData();
      } else {
        const data = await res.json();
        triggerMessage(data.error || "Failed to dissolve.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckIn = async (partnerId: string) => {
    if (!loggedInUser) return;
    try {
      const res = await fetch("/api/relationships/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: loggedInUser.id,
          partnerId
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerMessage("Daily check-in success! +20 Relationship Points 🎉");
        fetchRelationshipData();
      } else {
        triggerMessage(data.error || "Failed check-in.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClaimReward = async (rewardId: string) => {
    if (!loggedInUser) return;
    try {
      const res = await fetch("/api/relationships/rewards/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: loggedInUser.id,
          rewardId
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerMessage("Reward claimed successfully! 🎉");
        fetchRelationshipData();
      } else {
        triggerMessage(data.error || "Failed claiming reward.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminAction = async (relationshipId: string, action: string) => {
    if (!loggedInUser) return;
    try {
      const res = await fetch("/api/admin/relationships/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestingUserId: loggedInUser.id,
          relationshipId,
          action
        })
      });
      if (res.ok) {
        triggerMessage(`Admin override action: ${action} executed successfully!`);
        fetchRelationshipData();
      } else {
        const data = await res.json();
        triggerMessage(data.error || "Admin action failed.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin Creator States
  const [adminTargetUserId, setAdminTargetUserId] = useState<string>("");
  const [adminDiamondAmount, setAdminDiamondAmount] = useState<number>(0);
  const [adminStoreTargetUserId, setAdminStoreTargetUserId] = useState<string>("");
  const [adminStoreSelectedItemId, setAdminStoreSelectedItemId] = useState<string>("");
  const [isMoreGiftOpen, setIsMoreGiftOpen] = useState<boolean>(false);
  const [giftingInProgress, setGiftingInProgress] = useState<boolean>(false);

  // Supreme Admin Dashboard States
  const [adminStats, setAdminStats] = useState<any>(null);
  const [loadingAdminStats, setLoadingAdminStats] = useState<boolean>(false);
  const [adminSearchQuery, setAdminSearchQuery] = useState<string>("");
  const [customRoomIdSearch, setCustomRoomIdSearch] = useState<string>("");
  const [adminSelectedUserId, setAdminSelectedUserId] = useState<string>("");
  const [adminActionAmount, setAdminActionAmount] = useState<number>(0);
  const [adminActionSelection, setAdminActionSelection] = useState<string>("permanent_ban");
  const [adminActionDuration, setAdminActionDuration] = useState<number>(24);
  const [adminActionRole, setAdminActionRole] = useState<string>("staff");

  const fetchAdminDashboardStats = async () => {
    if (!loggedInUser) return;
    setLoadingAdminStats(true);
    try {
      const res = await fetch(`/api/admin/system-stats?adminUserId=${loggedInUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setAdminStats(data);
      } else {
        const err = await res.json();
        triggerMessage("Stats Error: " + err.error);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoadingAdminStats(false);
    }
  };

  const handleAdminActionSubmit = async () => {
    if (!loggedInUser) return;
    if (!adminSelectedUserId.trim()) {
      triggerMessage("Error: Target user ID cannot be empty.");
      return;
    }
    
    try {
      const res = await fetch("/api/admin/manage-user-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUserId: loggedInUser.id,
          targetUserId: adminSelectedUserId.trim(),
          action: adminActionSelection,
          durationHours: adminActionDuration,
          officialAccess: adminActionRole
        })
      });

      const data = await res.json();
      if (res.ok) {
        triggerMessage(`SUCCESS: ${data.message} ✅`);
        fetchAdminDashboardStats(); // refresh statistics and online lists
      } else {
        triggerMessage(`ERROR: ${data.error || "Failed to execute administrative command."}`);
      }
    } catch (e: any) {
      triggerMessage("Server error: " + e.message);
    }
  };

  const handleToggleRoomOfficial = async (roomIdToMod: string, setOfficial: boolean) => {
    if (!loggedInUser) return;
    try {
      const res = await fetch("/api/admin/grant-official-room-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUserId: loggedInUser.id,
          roomSearchId: roomIdToMod,
          isOfficial: setOfficial
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerMessage(`SUCCESS: ${data.message} ✅`);
        fetchAdminDashboardStats();
      } else {
        triggerMessage(`ERROR: ${data.error || "Failed to update official status."}`);
      }
    } catch (e: any) {
      triggerMessage("Server error: " + e.message);
    }
  };

  const isProfileMe = loggedInUser?.id === liveProfile.id;
  const isMe = loggedInUser?.id === liveProfile.id;

  useEffect(() => {
    if (activeTab === "app_admin" && isProfileMe) {
      fetchAdminDashboardStats();
    }
  }, [activeTab, isProfileMe]);

  useEffect(() => {
    const isCreator = loggedInUser?.id === "782446" || loggedInUser?.email === "ebadulhoque1234567890@gmail.com";
    if (activeTab === "store" || activeTab === "gifts" || (activeTab === "wallet" && isCreator)) {
      setLoadingStore(true);
      fetch("/api/store-items")
        .then(res => res.json())
        .then(data => {
          setStoreItems(data);
          setLoadingStore(false);
        })
        .catch(err => {
          console.error("Failed to load store items:", err);
          setLoadingStore(false);
        });
    }
  }, [activeTab, loggedInUser]);
  
  // Tabs Lists
  const tabs = [
    { id: "overview", label: "Overview" },
    ...(liveProfile.level < 5 ? [{ id: "newbie", label: "🔰 Newbie" }] : []),
    ...(isProfileMe ? [{ id: "wallet", label: "Wallet" }, { id: "store", label: "💎 Store" }] : []),
    { id: "gifts", label: "Gifts" },
    { id: "gallery", label: "Gallery" },
    { id: "achievements", label: "Achievements" },
    { id: "family", label: "Family" },
    { id: "visitors", label: "Visitors" },
    { id: "activity", label: "Activity" },
    ...(isProfileMe ? [{ id: "settings", label: "Settings" }] : []),
    ...(isProfileMe && (liveProfile.email === "ebadulhoque1234567890@gmail.com" || liveProfile.isGlobalAdmin || liveProfile.isOfficialStaff) ? [{ id: "app_admin", label: "⚡ App Admin" }] : [])
  ];

  // Simulated Dialer state for Voice / Video Call
  const [dialerState, setDialerState] = useState<{
    isActive: boolean;
    type: "voice" | "video" | null;
    status: "ringing" | "connected" | "disconnected";
    seconds: number;
  }>({
    isActive: false,
    type: null,
    status: "ringing",
    seconds: 0
  });

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isCameraMuted, setIsCameraMuted] = useState<boolean>(false);

  // Simulator for Custom Moment Posting in Gallery
  const [moments, setMoments] = useState([
    { id: "sh1", content: "Had an amazing karaoke night in Ebadul's Palace room! 🎤✨", likes: 24, comments: 3, timestamp: "Today 10:24 AM", img: "https://images.unsplash.com/photo-1516280440614-37939bbacd6a?auto=format&fit=crop&w=400&q=80" },
    { id: "sh2", content: "Check out my new Golden Frame! VIP level upgrade! 👑🏆", likes: 58, comments: 12, timestamp: "Yesterday", img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80" },
  ]);
  const [newMomentText, setNewMomentText] = useState<string>("");

  const [withdrawDiamondsAmount, setWithdrawDiamondsAmount] = useState<number>(0);
  const [paymentAccount, setPaymentAccount] = useState<string>("");
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);

  const refreshTransactionsLog = async () => {
    if (!loggedInUser) return;
    try {
      const res = await fetch(`/api/wallet/transactions/${loggedInUser.id}?requestingUserId=${loggedInUser.id}`);
      if (res.ok) {
        const txs = await res.json();
        setTransactionHistory(txs);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
  };

  const handleRechargeSandboxModal = async (coins: number, usd: number) => {
    if (!loggedInUser) return;
    try {
      const res = await fetch("/api/wallet/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: loggedInUser.id, 
          requestingUserId: loggedInUser.id,
          coins, 
          costUsd: usd 
        })
      });
      if (res.ok) {
        const body = await res.json();
        onSetUser(body.profile);
        setLiveProfile(body.profile);
        triggerMessage(`Sandbox recharge successful! Coin balance updated to ${body.profile.coins}.`);
        refreshTransactionsLog();
      } else {
        const err = await res.json();
        triggerMessage("Failed to recharge: " + err.error);
      }
    } catch (e: any) {
      console.error(e);
      triggerMessage("Recharge error: " + e.message);
    }
  };

  const handleWithdrawModal = async () => {
    if (!loggedInUser) return;
    if (withdrawDiamondsAmount <= 0) {
      triggerMessage("Please key in a valid amount of diamonds to cash out.");
      return;
    }
    if (liveProfile.diamonds < withdrawDiamondsAmount) {
      triggerMessage("Insufficient diamond balance.");
      return;
    }
    if (!paymentAccount.trim()) {
      triggerMessage("Please enter your bKash/Bank payment account number.");
      return;
    }
    try {
      const computedBdt = Math.floor(withdrawDiamondsAmount * 1.5);
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: loggedInUser.id, 
          requestingUserId: loggedInUser.id,
          diamonds: withdrawDiamondsAmount, 
          bdtAmount: computedBdt
        })
      });
      if (res.ok) {
        const body = await res.json();
        onSetUser(body.profile);
        setLiveProfile(body.profile);
        triggerMessage(`Withdrawal request processed! BDT ${computedBdt} will be credited to ${paymentAccount}.`);
        setWithdrawDiamondsAmount(0);
        refreshTransactionsLog();
      } else {
        const err = await res.json();
        triggerMessage("Failed to withdraw: " + err.error);
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  // Edit fields for active owner configuration
  const [editName, setEditName] = useState<string>(profile.displayName);
  const [editBioText, setEditBioText] = useState<string>(profile.bio);
  const [editAgeNum, setEditAgeNum] = useState<number>(profile.age);
  const [editCountryName, setEditCountryName] = useState<string>(profile.country);
  const [editAvatar, setEditAvatar] = useState<string>(profile.avatarUrl);
  const [editCover, setEditCover] = useState<string>(profile.coverUrl);
  const [editVip, setEditVip] = useState<VipLevel>(profile.vipLevel);
  const [editGenderType, setEditGenderType] = useState<Gender>(profile.gender);

  const [isEditingNameInline, setIsEditingNameInline] = useState<boolean>(false);
  const [inlineNameValue, setInlineNameValue] = useState<string>(liveProfile.displayName);

  // Synchronize inlineNameValue when liveProfile's displayName updates
  useEffect(() => {
    setInlineNameValue(liveProfile.displayName);
  }, [liveProfile.displayName]);

  const handleDirectAvatarUpload = async (file: File) => {
    try {
      triggerMessage("Uploading photo from gallery...");
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const response = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: base64, filename: file.name, bucket: "avatars" }),
          });
          if (response.ok) {
            const result = await response.json();
            const uploadedUrl = result.url;
            
            // Now update the profile using /api/users/:id/update
            const updateRes = await fetch(`/api/users/${liveProfile.id}/update`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                requestingUserId: loggedInUser?.id,
                avatarUrl: uploadedUrl,
              })
            });
            if (updateRes.ok) {
              const body = await updateRes.json();
              if (body.success) {
                setLiveProfile(body.profile);
                onSetUser(body.profile);
                setEditAvatar(uploadedUrl);
                triggerMessage("Success: Profile photo updated!");
              }
            }
          } else {
            const err = await response.json();
            triggerMessage("Failed to upload image: " + (err.error || ""));
          }
        } catch (err: any) {
          triggerMessage("Failed to upload image: " + err.message);
        }
      };
      reader.onerror = () => triggerMessage("File reading failed");
      reader.readAsDataURL(file);
    } catch (err: any) {
      triggerMessage("Failed to process upload: " + err.message);
    }
  };

  const handleSaveInlineName = async () => {
    if (!inlineNameValue.trim()) {
      triggerMessage("Name cannot be empty.");
      return;
    }
    setIsEditingNameInline(false);
    try {
      const res = await fetch(`/api/users/${liveProfile.id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestingUserId: loggedInUser?.id,
          displayName: inlineNameValue.trim(),
        })
      });
      if (res.ok) {
        const body = await res.json();
        if (body.success) {
          setLiveProfile(body.profile);
          onSetUser(body.profile);
          setEditName(body.profile.displayName);
          triggerMessage("Display name updated successfully! ✅");
        }
      }
    } catch (e: any) {
      triggerMessage("Failed to update name: " + e.message);
    }
  };

  // Settings Toggles
  const [allowPrivateChats, setAllowPrivateChats] = useState<boolean>(true);
  const [hideOnlineStatus, setHideOnlineStatus] = useState<boolean>(false);
  const [notifyDailyCheckin, setNotifyDailyCheckin] = useState<boolean>(true);

  // Gift Store item checklist (pulling or listing)
  const [giftCatalog, setGiftCatalog] = useState<GiftItem[]>([
    { id: "g_flower", name: "Rose Spark ❤️", cost: 10, imageUrl: "🌹", effectClass: "rose-pulse", category: "small", animationType: "2d" },
    { id: "g_crown", name: "Royal Crown 👑", cost: 199, imageUrl: "👑", effectClass: "golden-shine", category: "premium", animationType: "3d" },
    { id: "g_sports", name: "Supercar SF90 🏎️", cost: 999, imageUrl: "🏎️", effectClass: "car-accel", category: "luxury", animationType: "luxury" },
    { id: "g_castle", name: "Neon Palace 🏰", cost: 4999, imageUrl: "🏰", effectClass: "bg-aurora", category: "luxury", animationType: "full_screen" },
    { id: "g_lion", name: "Lion roar 🦁", cost: 2500, imageUrl: "🦁", effectClass: "lion-alert", category: "luxury", animationType: "luxury" }
  ]);
  
  // List of received gifts tracker
  const [giftWall, setGiftWall] = useState([
    { id: "g_flower", name: "Rose Spark", count: 18, icon: "🌹" },
    { id: "g_crown", name: "Royal Crown", count: 4, icon: "👑" },
    { id: "g_sports", name: "Supercar SF90", count: 1, icon: "🏎️" },
  ]);

  // Synchronize profile prop with state
  useEffect(() => {
    setLiveProfile(profile);
    setActiveTab("overview");
    setShowSocialList(null);
    if (loggedInUser) {
      setIsFollowing(loggedInUser.badges.includes(`following_${profile.id}`));
    }
  }, [profile]);

  // Synchronize edit form fields with liveProfile updates
  useEffect(() => {
    setEditName(liveProfile.displayName);
    setEditBioText(liveProfile.bio);
    setEditAgeNum(liveProfile.age);
    setEditCountryName(liveProfile.country);
    setEditAvatar(liveProfile.avatarUrl);
    setEditCover(liveProfile.coverUrl);
    setEditVip(liveProfile.vipLevel);
    setEditGenderType(liveProfile.gender);
  }, [liveProfile]);

  // Load fresh status from API
  const refreshProfileData = async () => {
    try {
      const res = await fetch(`/api/users/${liveProfile.id}?requestingUserId=${loggedInUser?.id || ""}`);
      if (res.ok) {
        const data = await res.json();
        setLiveProfile(data);
        // Is following check
        if (loggedInUser) {
          setIsFollowing(loggedInUser.badges.includes(`following_${liveProfile.id}`));
        }
      }
    } catch (e) {
      console.error("Error refreshing profile detail: ", e);
    }
  };

  const handleCreatePersonalRoom = async () => {
    if (!loggedInUser) {
      triggerMessage("Auth needed to create room!");
      return;
    }
    try {
      const roomName = prompt("Enter your personal room name:", `${liveProfile.displayName}'s Fun Zone`);
      if (!roomName) return;
      const res = await fetch("/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: roomName,
          description: "My personal chat room. Welcome!",
          ownerId: loggedInUser.id,
          category: "public"
        })
      });
      if (res.ok) {
        triggerMessage("🎉 Personal room created successfully!");
        refreshProfileData();
      } else {
        const errorData = await res.json();
        triggerMessage("Failed to create room: " + (errorData.error || "unknown error"));
      }
    } catch (err: any) {
      triggerMessage("Error creating personal room: " + err.message);
    }
  };

  // Social Lists fetcher
  const fetchSocialLists = async (type: "followers" | "following") => {
    setLoadingSocial(true);
    try {
      const res = await fetch(`/api/users/${liveProfile.id}/social-lists?requestingUserId=${loggedInUser?.id || ""}`);
      if (res.ok) {
        const data = await res.json();
        setSocialUsers(type === "followers" ? data.followers : data.following);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSocial(false);
    }
  };

  useEffect(() => {
    if (showSocialList) {
      fetchSocialLists(showSocialList);
    }
  }, [showSocialList, liveProfile.id]);

  const handleViewOtherProfile = async (targetUserId: string) => {
    try {
      const res = await fetch(`/api/users/${targetUserId}?requestingUserId=${loggedInUser?.id || ""}`);
      if (res.ok) {
        const data = await res.json();
        setLiveProfile(data);
        setActiveTab("overview");
        setShowSocialList(null);
        if (loggedInUser) {
          setIsFollowing(loggedInUser.badges.includes(`following_${targetUserId}`));
        }
      }
    } catch (e) {
      console.error("Error viewing profile:", e);
    }
  };

  const handleSocialFollowToggle = async (targetUser: UserProfile) => {
    if (!loggedInUser) {
      triggerMessage("Auth needed. Please enter guest or OTP login first!");
      return;
    }
    if (loggedInUser.id === targetUser.id) {
      triggerMessage("You cannot follow yourself!");
      return;
    }
    try {
      const res = await fetch(`/api/users/${loggedInUser.id}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: targetUser.id })
      });
      if (res.ok) {
        const body = await res.json();
        if (body.success) {
          // Sync changes to parent
          onSetUser(body.me);
          
          // Re-fetch social list to get latest state
          if (showSocialList) {
            fetchSocialLists(showSocialList);
          }
          
          // If the target is the currently viewed profile, update its followersCount
          if (liveProfile.id === targetUser.id) {
            setLiveProfile(prev => ({
              ...prev,
              followersCount: body.target.followersCount
            }));
            setIsFollowing(body.followState);
          }
          
          triggerMessage(body.followState ? `Successfully followed ${targetUser.displayName}! ✅` : `Unfollowed ${targetUser.displayName}.`);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshProfileData();
  }, [liveProfile.id, loggedInUser?.followersCount, loggedInUser?.followingCount]);

  useEffect(() => {
    if (activeTab === "wallet" && isMe) {
      refreshTransactionsLog();
    }
  }, [activeTab, isMe]);

  // Handle follow click
  const handleFollowAction = async () => {
    if (!loggedInUser) {
      triggerMessage("Auth needed. Please enter guest or OTP login first!");
      return;
    }
    if (loggedInUser.id === liveProfile.id) {
      triggerMessage("You cannot follow yourself!");
      return;
    }
    try {
      const res = await fetch(`/api/users/${loggedInUser.id}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: liveProfile.id })
      });
      if (res.ok) {
        const body = await res.json();
        if (body.success) {
          setIsFollowing(body.followState);
          // Sync changes
          onSetUser(body.me);
          // Auto update live metrics
          setLiveProfile(prev => ({
            ...prev,
            followersCount: body.target.followersCount
          }));
          triggerMessage(body.followState ? `Successfully followed ${liveProfile.displayName}! ✅` : `Unfollowed ${liveProfile.displayName}.`);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add friend simulator
  const handleAddFriend = () => {
    if (!isFriend) {
      setIsFriend(true);
      triggerMessage(`Friend invitation request sent to ${liveProfile.displayName}! 🌟`);
      // Simulate friendship acceptance in real time
      setTimeout(() => {
        triggerMessage(`🎉 ${liveProfile.displayName} accepted your friend request! You are now accepted friends. You can call each other!`);
      }, 1500);
    } else {
      setIsFriend(false);
      triggerMessage(`Removed ${liveProfile.displayName} from Friends.`);
    }
  };

  // Camera capture and media stream stream management
  useEffect(() => {
    if (dialerState.isActive && dialerState.type === "video") {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          setLocalStream(stream);
        })
        .catch(err => {
          console.warn("Failed to get local camera for call simulation:", err);
        });
    } else {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
    }
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [dialerState.isActive, dialerState.type]);

  // Assign local stream to local video element when stream is ready
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, dialerState.isActive]);

  // Dial Timer setup
  useEffect(() => {
    let interval: any = null;
    if (dialerState.isActive && dialerState.status === "connected") {
      interval = setInterval(() => {
        setDialerState(prev => ({ ...prev, seconds: prev.seconds + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [dialerState.isActive, dialerState.status]);

  // Custom feedback triggers
  const triggerMessage = (text: string) => {
    if (onGlobalMessage) onGlobalMessage(text);
    else alert(text);
  };

  const handleSendReport = async (reason: string) => {
    if (!loggedInUser || !activeRoom) return;
    try {
      const res = await fetch(`/api/rooms/${activeRoom.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterId: loggedInUser.id,
          reportedUserId: liveProfile.id,
          reason
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerMessage(`Report submitted: "${reason}". Room administrators will review this shortly! 🛡️`);
      } else {
        triggerMessage(data.error || "Failed to submit report.");
      }
    } catch (e: any) {
      triggerMessage("Reporting failed: " + e.message);
    }
    setShowReportReasons(false);
  };

  // Dial trigger simulation
  const initiateCallSim = (type: "voice" | "video") => {
    if (!isFriend) {
      triggerMessage(`🔒 Private calling is secure: you can only call accepted friends! Please click the Heart button 💖 to add ${liveProfile.displayName} as a friend first.`);
      return;
    }

    setDialerState({
      isActive: true,
      type,
      status: "ringing",
      seconds: 0
    });
    // Trigger Ringing connection in 3 seconds
    setTimeout(() => {
      setDialerState(prev => {
        if (prev.isActive) {
          return { ...prev, status: "connected" };
        }
        return prev;
      });
    }, 2800);
  };

  // Close Call
  const hangUpCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setDialerState({ isActive: false, type: null, status: "disconnected", seconds: 0 });
    triggerMessage("Call terminated securely. Code: SECURE_PEER_OK");
  };

  // Moment submittor
  const handlePostMoment = () => {
    if (!newMomentText.trim()) return;
    const newM = {
      id: "moment_" + Date.now(),
      content: newMomentText.trim(),
      likes: 1,
      comments: 0,
      timestamp: "Just now",
      img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80"
    };
    setMoments([newM, ...moments]);
    setNewMomentText("");
    triggerMessage("New Moment posted perfectly onto EbadulChat moments stream!");
  };

  // Fast Gift sending inside showcase
  const handleGiftPurchaseSim = async (gift: GiftItem) => {
    if (!loggedInUser) {
      triggerMessage("Please log in to send virtual gifts!");
      return;
    }
    if (loggedInUser.coins < gift.cost) {
      triggerMessage("Insufficient coins! Recharge your balance in the Settings/Wallet panel.");
      return;
    }

    try {
      // Deduct coins and send
      const res = await fetch("/api/gifts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: loggedInUser.id,
          receiverId: liveProfile.id,
          giftId: gift.id,
          roomId: "ebadul" // default room simulation fallback
        })
      });
      if (res.ok) {
        const body = await res.json();
        if (body.success) {
          // Sync currency to parent loggedIn state
          onSetUser(body.sender);
          
          // Refresh receiving profile totals
          setLiveProfile(prev => ({
            ...prev,
            coins: prev.id === body.sender.id ? body.sender.coins : prev.coins,
            diamonds: prev.id === body.receiver.id ? body.receiver.diamonds : prev.diamonds
          }));

          // Local updates on Gift Wall lists
          setGiftWall(prev => {
            const hasGift = prev.find(g => g.id === gift.id);
            if (hasGift) {
              return prev.map(g => g.id === gift.id ? { ...g, count: g.count + 1 } : g);
            } else {
              return [...prev, { id: gift.id, name: gift.name, count: 1, icon: gift.imageUrl }];
            }
          });

          triggerMessage(`Surprise! Sent ${gift.imageUrl} ${gift.name} to ${liveProfile.displayName}!`);
        }
      }
    } catch (e: any) {
      triggerMessage("Transaction aborted: " + e.message);
    }
  };

  // Handle owner database save
  const handleOwnerSaveConfig = async () => {
    try {
      const res = await fetch(`/api/users/${liveProfile.id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestingUserId: loggedInUser?.id,
          displayName: editName,
          bio: editBioText,
          age: editAgeNum,
          country: editCountryName,
          avatarUrl: editAvatar,
          coverUrl: editCover,
          vipLevel: editVip,
          gender: editGenderType
        })
      });
      if (res.ok) {
        const body = await res.json();
        if (body.success) {
          setLiveProfile(body.profile);
          onSetUser(body.profile); // Sync parent state
          triggerMessage("Success: Your Elite Profile Card config updated database successfully!");
          setActiveTab("overview");
        }
      }
    } catch (e: any) {
      triggerMessage("Failure updating credentials: " + e.message);
    }
  };

  // Simulate copy UID
  const handleCopyId = () => {
    navigator.clipboard.writeText(liveProfile.id);
    triggerMessage("UID copied to clipboard! (ID: " + liveProfile.id + ")");
  };

  // Determine Zodiac
  const getZodiacSign = (age: number) => {
    const signs = [
      "Leo 🦁", "Scorpio 🦂", "Aries 🐏", "Gemini ♊", "Taurus ♉", 
      "Cancer 🦀", "Sagittarius 🏹", "Capricorn 🐐", "Pisces 🐟", "Aquarius 🏺"
    ];
    return signs[age % signs.length];
  };

  const currentFrameClass = AVATAR_FRAMES.find(f => f.id === activeFrame)?.borderClass || AVATAR_FRAMES[0].borderClass;

  return (
    <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between z-50 text-white animate-fade-in text-sans overflow-hidden">
      <input
        type="file"
        id="profile-modal-avatar-upload"
        className="hidden"
        accept="image/*"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) {
            await handleDirectAvatarUpload(file);
          }
        }}
      />
      
      {/* DIALER INTERACTION MODAL SECTION */}
      {dialerState.isActive && (
        <div className="absolute inset-0 bg-slate-950 z-55 flex flex-col justify-between items-center p-6 text-center">
          {dialerState.type === "video" ? (
            /* Video Calling Interface */
            <div className="absolute inset-0 flex flex-col justify-between items-center bg-slate-900 p-6 overflow-hidden">
              {/* Main Feed: represents the remote friend */}
              <div className="absolute inset-0 w-full h-full">
                {dialerState.status === "ringing" ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10 gap-4">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-500">
                        <img src={liveProfile.avatarUrl} alt="Remote user avatar" className="w-full h-full object-cover" />
                      </div>
                      <span className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-ping opacity-60"></span>
                    </div>
                    <div className="text-center px-4">
                      <h3 className="text-xl font-bold text-white tracking-wide">{liveProfile.displayName}</h3>
                      <p className="text-xs text-emerald-400 animate-pulse mt-1">Requesting Peer Video...</p>
                    </div>
                  </div>
                ) : (
                  /* Friend's active stream simulation: full screen image with beautiful overlay effects */
                  <div className="w-full h-full relative bg-slate-950">
                    <img src={liveProfile.avatarUrl} alt="Remote video stream" className="w-full h-full object-cover opacity-50" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/30" />
                    {/* Simulated subtle scanning line or camera HUD overlay */}
                    <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 bg-slate-950/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-[10px] font-mono font-bold tracking-wider text-white">LIVE • 1080P HD</span>
                        </div>
                        <span className="text-[10px] font-mono text-gray-400">FPS: 60 • SECURE</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-gray-500">
                        <span>L-AES256 ENCRYPTED</span>
                        <span>00:{dialerState.seconds.toString().padStart(2, "0")}s</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Local User PIP (Picture-In-Picture) Camera Preview */}
              <div className="absolute right-4 top-4 w-28 h-40 rounded-xl overflow-hidden border-2 border-emerald-500/80 bg-slate-950 shadow-2xl z-20 flex flex-col justify-center items-center">
                {isCameraMuted ? (
                  <div className="text-center p-2">
                    <Video className="w-5 h-5 text-gray-500 mx-auto mb-1" />
                    <span className="text-[8px] text-gray-500 uppercase">Muted</span>
                  </div>
                ) : (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover bg-black"
                  />
                )}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-slate-950/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-mono text-white tracking-widest whitespace-nowrap">
                  YOU (SELF)
                </div>
              </div>

              {/* Top info header */}
              <div className="z-10 w-full text-left mt-4">
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase font-bold tracking-widest">
                  🔒 Friends Video Calling
                </span>
                <h3 className="text-lg font-black text-white mt-1.5 uppercase tracking-wide">{liveProfile.displayName}</h3>
              </div>

              {/* Bottom Video controls */}
              <div className="z-10 w-full mb-4 px-4 flex flex-col items-center gap-4">
                <div className="flex gap-4 items-center">
                  <button 
                    onClick={() => setIsCameraMuted(!isCameraMuted)}
                    className={`p-3 rounded-full border transition-all ${
                      isCameraMuted 
                        ? "bg-rose-500/20 border-rose-500 text-rose-400" 
                        : "bg-slate-950/60 border-white/10 text-white hover:bg-slate-900"
                    }`}
                    title={isCameraMuted ? "Enable camera feed" : "Disable camera feed"}
                  >
                    <Video className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={hangUpCall}
                    className="p-4 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg hover:shadow-red-600/30 transition-all transform hover:scale-105"
                    title="End Call"
                  >
                    <Phone className="w-6 h-6 fill-white rotate-135" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Voice Calling Interface */
            <>
              <div className="mt-12 flex flex-col items-center">
                <span className="text-[10px] text-yellow-500 uppercase font-bold tracking-widest animate-pulse">
                  {dialerState.status === "ringing" ? "🔒 Peer Secure Connecting..." : "📱 Live Voice Call Active"}
                </span>
                
                {/* Pulsating avatar in center of phone stream dialer */}
                <div className="relative mt-8">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-yellow-500 relative">
                    <img src={liveProfile.avatarUrl} alt="Dial avatar" className="w-full h-full object-cover" />
                  </div>
                  {dialerState.status === "ringing" && (
                    <span className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-ping opacity-60"></span>
                  )}
                </div>

                <h3 className="text-xl font-bold mt-4 text-white uppercase tracking-wide">{liveProfile.displayName}</h3>
                <span className="text-xs text-gray-400 mt-2">@username ID: {liveProfile.username}</span>
                
                {/* Simulating voice waveform bars */}
                {dialerState.status === "connected" && (
                  <div className="flex gap-1 items-center justify-center mt-6 h-8">
                    <div className="w-1 bg-yellow-400 h-6 animate-pulse rounded-full"></div>
                    <div className="w-1 bg-yellow-400 h-10 animate-bounce rounded-full"></div>
                    <div className="w-1 bg-yellow-400 h-12 animate-pulse rounded-full"></div>
                    <div className="w-1 bg-yellow-400 h-7 animate-bounce rounded-full"></div>
                    <div className="w-1 bg-yellow-400 h-4 animate-pulse rounded-full"></div>
                  </div>
                )}
              </div>

              <div className="mb-12 w-full px-6 flex flex-col items-center gap-4">
                <div className="text-sm font-mono text-gray-300">
                  {dialerState.status === "ringing" ? (
                    <span className="flex items-center gap-2">Connecting peer line...</span>
                  ) : (
                    <span>STREAM: 00:{dialerState.seconds.toString().padStart(2, "0")}s</span>
                  )}
                </div>

                <button 
                  onClick={hangUpCall}
                  className="py-3 px-8 bg-red-600 hover:bg-red-500 text-white font-bold rounded-full w-4/5 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4 fill-white" />
                  Hang Up Connection
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* HEADER SECTION - COVER IMAGE */}
      <div className="relative h-44 shrink-0 overflow-hidden">
        {liveProfile.email === "ebadulhoque1234567890@gmail.com" ? (
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 via-amber-800 to-purple-900 animate-[pulse_4s_infinite] flex items-center justify-center overflow-hidden">
            {/* Sparkling premium nebula stars */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-300/10 via-slate-950/40 to-slate-950/80"></div>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 animate-pulse"></div>
            {/* Glowing circular backdrop for creator */}
            <div className="absolute w-72 h-72 rounded-full bg-yellow-500/15 blur-3xl animate-[pulse_6s_infinite]"></div>
            <div className="text-[10px] font-black tracking-widest text-yellow-300 uppercase animate-bounce mt-4 select-none drop-shadow-[0_4px_12px_rgba(234,179,8,0.8)]">
              ✨ 👑 PLATFORM CREATOR & FOUNDER 👑 ✨
            </div>
          </div>
        ) : (
          <img 
            src={liveProfile.coverUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"} 
            alt="Profile cover banner" 
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

        {/* TOP BUTTON RAIL */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-950/60 hover:bg-slate-950 border border-slate-800 flex items-center justify-center text-gray-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex gap-1.5 items-center">
            {/* Real-time Room Admin Menu controls */}
            {(() => {
              const isRoomAdmin = activeRoom && loggedInUser && (
                activeRoom.ownerId === loggedInUser.id || 
                activeRoom.admins?.includes(loggedInUser.id) || 
                activeRoom.moderators?.includes(loggedInUser.id)
              );
              const isTargetOwner = activeRoom && activeRoom.ownerId === liveProfile.id;
              const showAdminMenuFeature = isRoomAdmin && !isTargetOwner && liveProfile.id !== loggedInUser?.id && liveProfile.email !== "ebadulhoque1234567890@gmail.com";

              if (!showAdminMenuFeature) return null;

              return (
                <div className="relative">
                  <button 
                    onClick={() => setShowAdminMenu(!showAdminMenu)}
                    className="w-8 h-8 rounded-full bg-slate-950/60 hover:bg-slate-950 border border-slate-800 flex items-center justify-center text-purple-400 hover:text-purple-300 font-bold"
                    title="Room Administration Menu"
                    id="admin-profile-menu-btn"
                  >
                    ⋮
                  </button>

                  {showAdminMenu && (
                    <div className="absolute right-0 top-9 w-40 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1.5 z-55 flex flex-col focus-scroll-none text-left">
                      <button 
                        onClick={() => {
                          setShowReportReasons(true);
                          setShowAdminMenu(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-rose-500 hover:bg-slate-800 font-semibold"
                      >
                        🚩 Report User
                      </button>
                      <button 
                        onClick={() => {
                          if (onModerationAction) onModerationAction("kick_user", liveProfile.id);
                          setShowAdminMenu(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-slate-800 font-semibold"
                      >
                        🚫 Kick Out (10m)
                      </button>
                      <button 
                        onClick={() => {
                          if (onModerationAction) onModerationAction("ban", liveProfile.id);
                          setShowAdminMenu(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-slate-800 font-semibold"
                      >
                        🔒 Room Block
                      </button>
                      <button 
                        onClick={() => {
                          if (onModerationAction) onModerationAction("remove_seat", liveProfile.id);
                          setShowAdminMenu(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-amber-500 hover:bg-slate-800 font-semibold"
                      >
                        🛋️ Leave Seat
                      </button>
                      <button 
                        onClick={() => {
                          if (onModerationAction) onModerationAction("mute_user_mic", liveProfile.id);
                          setShowAdminMenu(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-slate-800 font-semibold"
                      >
                        🔇 Mute Mic
                      </button>
                      <button 
                        onClick={() => {
                          if (onModerationAction) onModerationAction("unmute_user_mic", liveProfile.id);
                          setShowAdminMenu(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-emerald-400 hover:bg-slate-800 font-semibold"
                      >
                        🔊 Unmute Mic
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            <button 
              onClick={() => {
                navigator.clipboard.writeText(`https://ebadulchat.fun/users/${liveProfile.id}`);
                triggerMessage("Profile Link Copied to Share! 🚀");
              }}
              className="w-8 h-8 rounded-full bg-slate-950/60 hover:bg-slate-950 border border-slate-800 flex items-center justify-center text-gray-300 hover:text-white"
              title="Share profile card URL"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {liveProfile.email !== "ebadulhoque1234567890@gmail.com" && (
              <button 
                onClick={() => setShowReportReasons(true)}
                className="w-8 h-8 rounded-full bg-slate-950/60 hover:bg-slate-950 border border-slate-800 flex items-center justify-center text-rose-500 hover:text-rose-400 cursor-pointer"
                title="Report user behaviors"
              >
                <ShieldAlert className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* BOTTOM COVER TITLE METRIC HERO GREETINGS */}
        <div className="absolute bottom-2 left-4 right-4 flex items-end gap-3.5 z-10">
          
          {/* Avatar Area with Custom Frames and Online Signal */}
          <div 
            onClick={() => {
              if (isMe) {
                document.getElementById("profile-modal-avatar-upload")?.click();
              }
            }}
            className={`relative shrink-0 select-none group ${isMe ? "cursor-pointer hover:scale-105 active:scale-95 transition-all duration-150" : ""}`}
            title={isMe ? "Click to change profile picture" : undefined}
          >
            <VipAvatarFrame
              avatarUrl={liveProfile.avatarUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80"}
              level={liveProfile.vipLevelNumeric}
              sizeClass="w-20 h-20"
              badgeSizeClass="text-[8.5px]"
              customFrameId={liveProfile.activeFrameId}
            />
            {isMe && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <span className="text-[8px] font-black text-yellow-400 uppercase tracking-wider text-center leading-none">Change</span>
                <span className="text-[12px] mt-0.5">📸</span>
              </div>
            )}

            {/* Glowing Online/In-Room indicator ring */}
            <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-slate-950 flex items-center justify-center ${
              !liveProfile.isOnline 
                ? "bg-gray-400" 
                : liveProfile.activeRoom 
                  ? "bg-purple-500 shadow-lg shadow-purple-500/60" 
                  : "bg-emerald-500 shadow-lg shadow-emerald-500/50"
            }`} title={!liveProfile.isOnline ? "Offline" : liveProfile.activeRoom ? `In Room: ${liveProfile.activeRoom.name}` : "Online"}>
              <span className={`w-1.5 h-1.5 rounded-full bg-white ${(liveProfile.isOnline || liveProfile.activeRoom) && "animate-ping"}`}></span>
            </span>
          </div>

          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-1.5">
              {isEditingNameInline && isMe ? (
                <input
                  type="text"
                  value={inlineNameValue}
                  onChange={(e) => setInlineNameValue(e.target.value)}
                  onBlur={handleSaveInlineName}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSaveInlineName();
                    } else if (e.key === "Escape") {
                      setInlineNameValue(liveProfile.displayName);
                      setIsEditingNameInline(false);
                    }
                  }}
                  className="bg-slate-900 border border-yellow-500 rounded px-1.5 py-0.5 text-xs text-white max-w-[140px] focus:outline-none"
                  autoFocus
                />
              ) : (
                <h2 
                  onClick={() => {
                    if (isMe) {
                      setIsEditingNameInline(true);
                    }
                  }}
                  className={`text-sm tracking-wide truncate max-w-[140px] uppercase font-black ${getVipNameStyle(liveProfile.vipLevelNumeric)} ${isMe ? "cursor-pointer hover:text-yellow-400 flex items-center gap-1 group" : ""}`}
                  title={isMe ? "Click to edit name" : undefined}
                >
                  <span>{liveProfile.displayName}</span>
                  {isMe && <span className="text-[10px] text-gray-500 group-hover:text-yellow-400 transition-colors">✏️</span>}
                </h2>
              )}
              {liveProfile.isVerified && (
                <CheckCircle className="w-3.5 h-3.5 text-blue-400 fill-blue-900/30 shrink-0" title="Verified Voice Channel Host" />
              )}
            </div>

            <p className="text-[10px] text-gray-400 truncate mt-0.5 flex items-center gap-1">
              <span>@{liveProfile.username}</span>
              <span className="text-gray-600">|</span>
              <button onClick={handleCopyId} className="hover:text-yellow-400 font-mono text-[9px] flex items-center gap-1">
                {((liveProfile.vipLevel && liveProfile.vipLevel !== VipLevel.NONE) || (liveProfile.vipLevelNumeric && liveProfile.vipLevelNumeric > 0)) && (
                  <span className="bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500 text-white text-[7.5px] font-black px-1 rounded-xs flex items-center gap-0.5 animate-pulse shadow border border-yellow-400/20 shrink-0 select-none">
                    👑 VIP{liveProfile.vipLevelNumeric || ""}
                  </span>
                )}
                <span className={getVipIdStyle(liveProfile.vipLevelNumeric, liveProfile.vipLevel)}>ID: {liveProfile.id}</span>
                <span className="text-[7.5px] uppercase bg-slate-800 px-1 rounded">Copy</span>
              </button>
            </p>

            <div className="flex items-center gap-1.5 mt-1.5">
              {/* Country Flag Flag Label */}
              <span className="text-xs shrink-0" title={`Country: ${liveProfile.country}`}>
                {liveProfile.country.includes("🇧🇩") ? "🇧🇩" : liveProfile.country.includes("🇸🇦") ? "🇸🇦" : liveProfile.country.includes("🇬🇧") ? "🇬🇧" : "🇮🇳"}
              </span>

              {/* Gender Age representation */}
              <span className={`text-[8.5px] px-1.5 py-0.5 rounded-full font-extrabold flex items-center gap-0.5 shrink-0 ${
                liveProfile.gender === Gender.FEMALE ? "bg-pink-500/20 text-pink-400 border border-pink-500/30" : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              }`}>
                {liveProfile.gender === Gender.FEMALE ? "♀️" : "♂️"} {liveProfile.age}
              </span>

              {/* Zodiac calculated icon badge */}
              <span className="text-[8.5px] bg-[#2E3192]/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded-full font-bold">
                {getZodiacSign(liveProfile.age)}
              </span>

              {/* New User Badge */}
              {liveProfile.level < 5 && (
                <span className="text-[8.5px] font-black uppercase bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-400 text-slate-950 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 scale-95 shadow-sm animate-pulse border border-teal-300/30 shrink-0 select-none">
                  🆕 NEW
                </span>
              )}

              {/* User VIP Emblem badge */}
              {liveProfile.vipLevel !== VipLevel.NONE && (
                <span className="text-[8px] font-black uppercase bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-300 text-slate-950 px-1.5 rounded flex items-center gap-0.5 scale-95 shadow-sm shadow-yellow-500/20 shrink-0">
                  👑 {liveProfile.vipLevel} {liveProfile.vipLevelNumeric ? `VIP${liveProfile.vipLevelNumeric}` : ""}
                </span>
              )}
            </div>
          </div>

          {/* Real-time Presence Status / Room Teleportation on the Right */}
          <div className="flex flex-col items-end gap-1 shrink-0 font-sans select-none pb-1 z-25">
            {!liveProfile.isOnline ? (
              <div className="px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-800 text-[8px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1 shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                Offline
              </div>
            ) : liveProfile.activeRoom ? (
              <button
                onClick={() => {
                  if (onTeleportToRoom && liveProfile.activeRoom?.id) {
                    onTeleportToRoom(liveProfile.activeRoom.id);
                    onClose();
                  }
                }}
                className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-purple-650 via-indigo-650 to-pink-600 hover:from-purple-550 hover:to-pink-500 border border-purple-400/40 text-[8.5px] font-black text-white uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.5)] active:scale-95 transition-all cursor-pointer animate-pulse"
                title={`Click to join room: ${liveProfile.activeRoom.name}`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                </span>
                <span className="max-w-[75px] truncate">
                  📻 In Room: {liveProfile.activeRoom.name}
                </span>
                <span className="text-[7.5px] bg-white/20 px-1 rounded font-black text-yellow-300 flex items-center gap-0.5">
                  JOIN 🚀
                </span>
              </button>
            ) : (
              <div className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-[8px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1 shadow-md">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Online
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QUICK STATS HORIZONTAL GRID */}
      <div className="bg-slate-950/80 border-y border-white/5 py-2.5 px-4 shrink-0">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div 
            onClick={() => {
              if (isMe) {
                setShowSocialList("followers");
              } else {
                triggerMessage("You can only view your own social lists.");
              }
            }}
            className={`flex flex-col p-1 rounded-xl transition-all ${isMe ? "cursor-pointer hover:bg-white/5" : "opacity-80"}`}
          >
            <span className="text-[12px] font-black font-mono text-yellow-400">{liveProfile.followersCount}</span>
            <span className="text-[8.5px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-center gap-0.5">
              Followers 👥
            </span>
          </div>
          <div 
            onClick={() => {
              if (isMe) {
                setShowSocialList("following");
              } else {
                triggerMessage("You can only view your own social lists.");
              }
            }}
            className={`flex flex-col border-l border-white/5 p-1 rounded-xl transition-all ${isMe ? "cursor-pointer hover:bg-white/5" : "opacity-80"}`}
          >
            <span className="text-[12px] font-black font-mono text-gray-200">{liveProfile.followingCount}</span>
            <span className="text-[8.5px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-center gap-0.5">
              Following 🔗
            </span>
          </div>
          <div 
            onClick={() => {
              if (isMe) {
                setShowSocialList("following");
              } else {
                triggerMessage("You can only view your own social lists.");
              }
            }}
            className={`flex flex-col border-l border-white/5 p-1 rounded-xl transition-all ${isMe ? "cursor-pointer hover:bg-white/5" : "opacity-80"}`}
          >
            <span className="text-[12px] font-black font-mono text-gray-200">{liveProfile.badges.filter(b => b && b.includes("following_")).length + 3}</span>
            <span className="text-[8.5px] text-gray-400 font-bold uppercase tracking-wider">Friends 💖</span>
          </div>
          <div className="flex flex-col border-l border-white/5 pb-0.5">
            <span className="text-[12px] font-black font-mono text-yellow-400">LVL {liveProfile.level}</span>
            <div className="w-[85%] mx-auto bg-slate-800 h-1 rounded-full mt-1 overflow-hidden" title={`${liveProfile.xp} / ${liveProfile.xpNextLevel} XP`}>
              <div 
                className="bg-yellow-400 h-full rounded-full" 
                style={{ width: `${Math.min(100, (liveProfile.xp / liveProfile.xpNextLevel) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* TABS CONTROLLERS SELECTOR */}
      <div className="bg-slate-950 shrink-0 border-b border-white/5 overflow-x-auto scrollbar-none scroll-smooth">
        <div className="flex px-2 space-x-1 min-w-[500px]">
          {tabs.map(t => {
            if (t.id === "settings" && !isMe) return null; // Only show Settings if Me
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`py-2.5 px-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                  isActive 
                    ? "text-yellow-400 border-yellow-400 font-semibold" 
                    : "text-gray-400 border-transparent hover:text-white"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN DYNAMIC CONTENT SCROLL AREA */}
      <div className="flex-1 overflow-y-auto px-4 py-3 bg-gradient-to-b from-slate-900/60 to-slate-950/95">
        
        {/* TAB: NEWBIE */}
        {activeTab === "newbie" && (
          <div className="flex flex-col gap-4 pb-6">
            <div className="bg-gradient-to-r from-teal-950/50 via-slate-900/60 to-emerald-950/50 p-4 rounded-2xl border border-teal-500/30 shadow-[0_4px_20px_rgba(20,184,166,0.15)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl animate-pulse"></div>
              <span className="text-[9px] text-teal-400 font-black uppercase tracking-widest block mb-1">
                🔰 New User VIP Status Rule
              </span>
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                👑 VIP Level Unlock Condition
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed font-medium">
                Welcome to EbadulChat! To keep our premium elite status fair and secure, <strong className="text-yellow-400">VIP features & badges only activate after you reach Profile Level 5</strong>. 
                Even if you recharge coins/diamonds, your VIP level will display once your level is 5 or above. Keep chatting and gifting to earn XP!
              </p>
              
              <div className="mt-3.5 flex items-center justify-between bg-slate-950/70 p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-gray-400 font-bold">Your Current Profile Level:</span>
                <span className="text-xs font-black text-yellow-400 uppercase bg-yellow-400/10 px-2.5 py-1 rounded-lg border border-yellow-400/20">
                  Level {liveProfile.level} / 5
                </span>
              </div>
            </div>

            {/* Newbie Special Growth Tasks */}
            <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5">
              <span className="text-[9.5px] text-teal-400 font-black uppercase tracking-widest block mb-3">
                🎯 Newbie Fast-Track XP Tasks
              </span>
              
              <div className="flex flex-col gap-2.5">
                {/* Task 1 */}
                <div className="flex items-center justify-between bg-slate-900/40 p-3 rounded-xl border border-white/5 hover:border-teal-500/20 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-base">📝</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">Complete Profile Bio</h4>
                      <p className="text-[9px] text-gray-400">Tell everyone about yourself</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                    liveProfile.bio ? "bg-teal-500/15 text-teal-400 border border-teal-500/20" : "bg-gray-800 text-gray-400"
                  }`}>
                    {liveProfile.bio ? "Completed ✅" : "+50 XP"}
                  </span>
                </div>

                {/* Task 2 */}
                <div className="flex items-center justify-between bg-slate-900/40 p-3 rounded-xl border border-white/5 hover:border-teal-500/20 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-base">💬</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">First Voice Room Chat</h4>
                      <p className="text-[9px] text-gray-400">Join a voice channel and interact</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase bg-teal-500/15 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded-full">
                    Active 🚀
                  </span>
                </div>

                {/* Task 3 */}
                <div className="flex items-center justify-between bg-slate-900/40 p-3 rounded-xl border border-white/5 hover:border-teal-500/20 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-base">👥</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">Follow a Host / Friend</h4>
                      <p className="text-[9px] text-gray-400">Follow any creator or voice host</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                    liveProfile.followingCount > 0 ? "bg-teal-500/15 text-teal-400 border border-teal-500/20" : "bg-gray-800 text-gray-400"
                  }`}>
                    {liveProfile.followingCount > 0 ? "Completed ✅" : "+50 XP"}
                  </span>
                </div>
              </div>
            </div>

            {/* New User Perks Section */}
            <div className="bg-gradient-to-r from-purple-950/20 to-pink-950/20 p-3.5 rounded-2xl border border-purple-500/20 flex flex-col gap-2">
              <span className="text-[9.5px] text-purple-400 font-black uppercase tracking-widest block">
                🎁 New User Welcome Perks
              </span>
              <ul className="text-[10px] text-gray-300 space-y-1.5 list-disc pl-4 font-medium">
                <li>Free virtual scratch card daily in active voice rooms.</li>
                <li>Access to the community public text stream.</li>
                <li>Exclusive entry greetings in standard public rooms.</li>
              </ul>
            </div>
          </div>
        )}
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-3.5 pb-6">
            
            {/* Bio/About me Card */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
              <span className="text-[9px] text-yellow-500 font-black uppercase tracking-widest block mb-1">About Me & Biography</span>
              <p className="text-xs text-gray-200 leading-normal font-medium italic">
                "{liveProfile.bio || 'This user is mysterious and has left no signature bio.'}"
              </p>
            </div>

            {/* Real-time Current Location Card (In Room Info) */}
            {liveProfile.isOnline && liveProfile.activeRoom && (
              <div className="bg-gradient-to-r from-purple-900/30 via-indigo-950/20 to-pink-900/30 p-3 rounded-xl border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)] flex items-center justify-between transition-all duration-300 hover:border-purple-400/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/40 flex items-center justify-center animate-pulse">
                    <span className="text-xl">🎙️</span>
                  </div>
                  <div>
                    <span className="text-[8px] tracking-widest text-purple-400 uppercase font-black block animate-pulse">
                      ⚡ Currently In Room ⚡
                    </span>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      {liveProfile.activeRoom.name}
                    </h4>
                    <span className="text-[9px] text-gray-400 block mt-0.5">
                      Tap JOIN to talk with {liveProfile.displayName}
                    </span>
                  </div>
                </div>
                {onTeleportToRoom && (
                  <button
                    onClick={() => {
                      if (liveProfile.activeRoom?.id) {
                        onTeleportToRoom(liveProfile.activeRoom.id);
                        onClose();
                      }
                    }}
                    className="text-[10px] font-black uppercase text-slate-950 bg-gradient-to-r from-yellow-400 to-yellow-300 hover:from-yellow-300 hover:to-yellow-200 py-1.5 px-3 rounded-lg flex items-center gap-1 shadow-[0_2px_10px_rgba(234,179,8,0.3)] active:scale-95 cursor-pointer transition-all shrink-0"
                  >
                    JOIN ROOM 🚀
                  </button>
                )}
              </div>
            )}

            {/* Owner's Personal Room Card */}
            <div className="bg-gradient-to-r from-teal-950/40 via-slate-900/40 to-emerald-950/40 p-3.5 rounded-2xl border border-teal-500/35 shadow-[0_4px_20px_rgba(20,184,166,0.15)] flex flex-col gap-3 transition-all duration-300 hover:border-teal-400/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
                    <Home className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <span className="text-[8.5px] tracking-widest text-teal-400 uppercase font-extrabold block">
                      🏠 {isMe ? "My Personal Voice Room" : "User's Personal Voice Room"}
                    </span>
                    <h4 className="text-[11.5px] font-black text-white uppercase tracking-wide mt-0.5">
                      {liveProfile.ownedRoom ? liveProfile.ownedRoom.name : "No Room Created Yet"}
                    </h4>
                  </div>
                </div>

                {liveProfile.ownedRoom ? (
                  onTeleportToRoom && (
                    <button
                      onClick={() => {
                        if (liveProfile.ownedRoom?.id) {
                          onTeleportToRoom(liveProfile.ownedRoom.id);
                          onClose();
                        }
                      }}
                      className="text-[10px] font-black uppercase text-slate-950 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 py-1.5 px-3 rounded-xl flex items-center gap-1 shadow-[0_3px_12px_rgba(20,184,166,0.4)] active:scale-95 cursor-pointer transition-all shrink-0"
                    >
                      ENTER ROOM 🚀
                    </button>
                  )
                ) : isMe ? (
                  <button
                    onClick={handleCreatePersonalRoom}
                    className="text-[9.5px] font-black uppercase text-slate-950 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 py-1.5 px-3 rounded-xl flex items-center gap-1 shadow-[0_3px_12px_rgba(234,179,8,0.4)] active:scale-95 cursor-pointer transition-all shrink-0 animate-pulse"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    CREATE ROOM 🛠️
                  </button>
                ) : (
                  <span className="text-[8.5px] text-gray-500 font-extrabold uppercase italic bg-slate-950/40 px-2 py-1 rounded-lg border border-slate-800">
                    Not Created
                  </span>
                )}
              </div>
              
              {liveProfile.ownedRoom && (
                <div className="text-[9px] text-gray-400 bg-slate-950/40 px-2.5 py-1.5 rounded-xl border border-white/5 flex items-center justify-between">
                  <span>Room Host: <strong className="text-gray-300">@{liveProfile.username}</strong></span>
                  <span className="text-teal-400 font-bold">Free Access • open 24/7 📻</span>
                </div>
              )}
            </div>

            {/* Highlighted Relationship Box */}
            <div className="bg-gradient-to-br from-pink-950/40 via-slate-900/50 to-rose-950/40 p-4 rounded-2xl border border-pink-500/35 shadow-[0_4px_25px_rgba(244,63,94,0.15)] flex flex-col gap-3.5 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center">
                    <Heart className="w-4 h-4 fill-pink-500/20 text-pink-400 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[8.5px] tracking-widest text-pink-400 uppercase font-black block">
                      💞 Premium Bond Status 💞
                    </span>
                    <h4 className="text-[11.5px] font-black text-white uppercase tracking-wide mt-0.5">
                      Relationship Center
                    </h4>
                  </div>
                </div>

                <button
                  onClick={() => setShowRelationshipCenter(true)}
                  className="text-[9px] font-black uppercase text-white bg-pink-600 hover:bg-pink-500 py-1.5 px-3 rounded-lg flex items-center gap-1 shadow-[0_2px_10px_rgba(219,39,119,0.3)] active:scale-95 transition-all shrink-0 cursor-pointer"
                >
                  Manage / Propose 💖
                </button>
              </div>

              {relationshipData?.active && relationshipData.active.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {relationshipData?.active?.map(r => {
                    const partnerId = r.user1Id === liveProfile.id ? r.user2Id : r.user1Id;
                    const partnerName = r.user1Id === liveProfile.id ? r.user2Name : r.user1Name;
                    const partnerAvatar = r.user1Id === liveProfile.id ? r.user2Avatar : r.user1Avatar;

                    let icon = "❤️";
                    let label = "Couple";
                    let colorClass = "text-pink-400 border-pink-500/30 bg-pink-500/10";
                    let themeGradient = "from-pink-500 to-rose-500";

                    if (r.type === "homies") {
                      icon = "🤝"; label = "Homies";
                      colorClass = "text-blue-400 border-blue-500/30 bg-blue-500/10";
                      themeGradient = "from-blue-500 to-cyan-500";
                    } else if (r.type === "best_friend") {
                      icon = "💙"; label = "Best Friend";
                      colorClass = "text-cyan-400 border-cyan-500/30 bg-cyan-500/10";
                      themeGradient = "from-cyan-500 to-teal-500";
                    } else if (r.type === "brother") {
                      icon = "🛡️"; label = "Brother";
                      colorClass = "text-amber-400 border-amber-500/30 bg-amber-500/10";
                      themeGradient = "from-amber-500 to-yellow-500";
                    } else if (r.type === "sister") {
                      icon = "🌸"; label = "Sister";
                      colorClass = "text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-500/10";
                      themeGradient = "from-fuchsia-500 to-purple-500";
                    } else if (r.type === "family") {
                      icon = "👨‍👩‍👧"; label = "Family";
                      colorClass = "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
                      themeGradient = "from-emerald-500 to-teal-500";
                    } else if (r.type === "soulmate") {
                      icon = "💖"; label = "Soulmate";
                      colorClass = "text-rose-400 border-rose-500/30 bg-rose-500/10";
                      themeGradient = "from-rose-500 to-pink-500";
                    }

                    const pct = Math.min(100, Math.max(5, (r.points / r.pointsNextLevel) * 100));
                    const todayStr = new Date().toDateString();
                    const checkedInToday = r.lastCheckIn && new Date(r.lastCheckIn).toDateString() === todayStr;

                    return (
                      <div key={r.id} className="bg-slate-950/50 border border-white/5 rounded-xl p-3 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <img 
                                src={partnerAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80"} 
                                className="w-9 h-9 rounded-full object-cover border border-white/10" 
                              />
                              <span className="absolute -bottom-1 -right-1 bg-slate-900 border border-white/10 p-0.5 rounded-full text-[10px]">{icon}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-[11px] text-gray-100">{partnerName}</span>
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border ${colorClass}`}>{label}</span>
                              </div>
                              <span className="text-[8.5px] text-gray-500 block">Anniversary: {r.anniversaryDate}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {loggedInUser && (loggedInUser.id === r.user1Id || loggedInUser.id === r.user2Id) && (
                              <button
                                onClick={() => handleCheckIn(partnerId)}
                                disabled={checkedInToday}
                                className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all ${
                                  checkedInToday 
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default" 
                                    : "bg-pink-600 hover:bg-pink-500 text-white active:scale-95 shadow-md shadow-pink-600/10 cursor-pointer"
                                }`}
                              >
                                {checkedInToday ? "✓ Checked" : "Check-In"}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="bg-slate-900/40 p-2 rounded-lg border border-white/5">
                          <div className="flex justify-between text-[9px] mb-1">
                            <span className="font-bold text-pink-300">Relationship Level {r.level}</span>
                            <span className="font-mono text-gray-400">{r.points} / {r.pointsNextLevel} XP</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                            <div className={`h-full bg-gradient-to-r ${themeGradient} rounded-full transition-all`} style={{ width: `${pct}%` }}></div>
                          </div>
                          <div className="flex justify-between items-center mt-1.5 text-[8.5px]">
                            <span className="text-yellow-400 font-bold">Streak: 🔥 {r.streakDays || 0} Days</span>
                            <span className="text-gray-500">Exchange PMs to earn more points!</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-950/40 border border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center gap-3 text-center">
                  {/* Elegant Split Avatar UI with beating heart */}
                  <div className="flex items-center gap-4 py-2">
                    <img 
                      src={liveProfile.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80"} 
                      className="w-12 h-12 rounded-full object-cover border-2 border-pink-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]" 
                    />
                    
                    <span className="text-2xl animate-pulse filter drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]">❤️</span>

                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/20 bg-slate-900/50 flex flex-col items-center justify-center text-gray-500 relative">
                      <span className="text-sm font-black">?</span>
                      <span className="absolute -bottom-1 bg-slate-900 border border-white/5 px-1 py-0.5 rounded-full text-[6.5px] font-bold text-gray-400 uppercase tracking-widest">Empty</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] text-gray-400 max-w-xs font-medium leading-relaxed">
                      No active relationship bond established. Propose a connection under the Relationship Center to begin earning level titles, profile frames, and streak badges together!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* SPECIAL CELESTIAL GOD-TIER LOCK REPRESENTATION FOR ADMIN */}
            {(liveProfile.email === "ebadulhoque1234567890@gmail.com" || liveProfile.isGlobalAdmin) && (
              <div className="bg-gradient-to-r from-slate-950 via-yellow-950/40 to-slate-950 p-4 rounded-xl border border-yellow-500/30 shadow-[inset_0_0_12px_rgba(234,179,8,0.15),0_4px_16px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col gap-2.5 animate-pulse">
                {/* Laser scan lines */}
                <div className="absolute inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent top-0 animate-[bounce_4s_infinite] opacity-60"></div>
                
                <div className="flex items-center gap-2.5 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/10 border border-yellow-500/40 flex items-center justify-center animate-[spin_10s_linear_infinite] shadow-[0_0_8px_rgba(234,179,8,0.2)]">
                    <Lock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <span className="text-[8px] tracking-widest text-yellow-400 uppercase font-black block animate-pulse">
                      ⚡️ CELESTIAL IMMORTAL SHIELD (LOCKED) ⚡️
                    </span>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      ADMIN SECURE ID VAULT • VIP 95
                    </h4>
                  </div>
                  <span className="ml-auto text-[10px] bg-yellow-500 text-slate-950 px-2 py-0.5 rounded font-black font-mono animate-bounce shadow">
                    BYPASS ACTIVE
                  </span>
                </div>

                <div className="text-[9px] text-gray-300 bg-slate-900/65 p-2 rounded-lg border border-white/5 space-y-1 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-semibold">Account Level:</span>
                    <span className="font-bold text-yellow-400">SUPREME ADMIN LEVEL 95</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-semibold">Protection Status:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span>● IMMUNE TO KICKS & BANS</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-semibold">System Access Keys:</span>
                    <span className="text-cyan-400 font-bold">100% LIMITLESS BYPASS (CREATOR)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Popularity Metrics Score and Room Contributions */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 flex flex-col gap-3">
              <span className="text-[9px] text-purple-400 font-black uppercase tracking-widest block">Premium Network Statistics</span>
              
              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-slate-900/50 p-2.5 border border-white/5 rounded-lg">
                  <span className="text-[8px] uppercase tracking-wide text-gray-400 font-bold block mb-0.5">Popularity Score</span>
                  <span className="text-sm font-black font-mono text-yellow-400">
                    {Math.floor(liveProfile.followersCount * 1.5 + liveProfile.level * 400 + 4500)}
                  </span>
                </div>
                <div className="bg-slate-900/50 p-2.5 border border-white/5 rounded-lg">
                  <span className="text-[8px] uppercase tracking-wide text-gray-400 font-bold block mb-0.5">Contributors Index</span>
                  <span className="text-sm font-black font-mono text-cyan-400">
                    {Math.floor(liveProfile.level * 180 + liveProfile.diamonds * 1.2 + 820)}
                  </span>
                </div>
              </div>

              {/* Coins & Diamonds indicators row */}
              {isMe && (
                <div className="grid grid-cols-2 gap-3.5 border-t border-white/5 pt-2.5 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-400" />
                    <div>
                      <span className="text-[8px] uppercase text-gray-400 font-bold block">Coins Owned</span>
                      <span className="text-xs font-mono font-black text-yellow-300">{liveProfile.coins}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-purple-400" />
                    <div>
                      <span className="text-[8px] uppercase text-gray-400 font-bold block">Diamonds Earned</span>
                      <span className="text-xs font-mono font-black text-purple-300">{liveProfile.diamonds}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Personal Details Information section */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 flex flex-col gap-2.5">
              <span className="text-[9px] text-pink-400 font-black uppercase tracking-widest block">Personal Attributes</span>
              
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <span className="text-gray-400">Relationship:</span>
                  <div className="flex flex-col items-end gap-1">
                    {relationshipData?.active && relationshipData.active.length > 0 ? (
                      relationshipData.active.map((r: any) => {
                        const partnerName = r.user1Id === liveProfile.id ? r.user2Name : r.user1Name;
                        let icon = "❤️";
                        let label = "Couple";
                        let colorClass = "text-pink-400";
                        if (r.type === "homies") { icon = "🤝"; label = "Homies"; colorClass = "text-blue-400"; }
                        else if (r.type === "best_friend") { icon = "💙"; label = "Best Friend"; colorClass = "text-cyan-400"; }
                        else if (r.type === "brother") { icon = "🛡️"; label = "Brother"; colorClass = "text-amber-400"; }
                        else if (r.type === "sister") { icon = "🌸"; label = "Sister"; colorClass = "text-fuchsia-400"; }
                        else if (r.type === "family") { icon = "👨‍👩‍👧"; label = "Family"; colorClass = "text-emerald-400"; }
                        else if (r.type === "soulmate") { icon = "💖"; label = "Soulmate"; colorClass = "text-rose-400"; }

                        return (
                          <span key={r.id} className={`font-bold text-[10px] ${colorClass}`}>
                            {icon} {label} with {partnerName} (Lvl {r.level})
                          </span>
                        );
                      })
                    ) : (
                      <span className="font-bold text-gray-500">None</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <span className="text-gray-400">Hobbies:</span>
                  <span className="font-mono text-yellow-400">Singing 🎤, Guitar 🎸, PK Battle 🗡️</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <span className="text-gray-400">Languages:</span>
                  <span className="font-bold text-gray-200">Bengali, English, Arabic 🇸🇦</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <span className="text-gray-400">Location:</span>
                  <span className="font-bold text-gray-200 flex items-center gap-0.5 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    Dhaka, Bangladesh 🇧🇩
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Member Since:</span>
                  <span className="font-bold text-gray-200 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    June 2026
                  </span>
                </div>
              </div>
            </div>

            {/* Simulated Live Frame Selection Card for owner */}
            {isMe && (
              <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 flex flex-col gap-2">
                <span className="text-[9px] text-yellow-400 font-extrabold uppercase tracking-wide">Change Active Avatar Frame (Owner Perk)</span>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {AVATAR_FRAMES.map(f => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setActiveFrame(f.id);
                        triggerMessage(`Equipped ${f.name} avatar halo!`);
                      }}
                      className={`p-2 rounded-lg text-left border shrink-0 transition-all ${
                        activeFrame === f.id 
                          ? "bg-yellow-500/10 border-yellow-500 text-yellow-300" 
                          : "bg-slate-900 border-white/5 text-gray-400 hover:text-white"
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {isMe && onLogout && (
              <div className="bg-slate-950/60 p-4 rounded-xl border border-rose-500/10 flex flex-col gap-2 mt-4">
                <span className="text-[9px] text-rose-500 font-black uppercase tracking-widest block mb-1">🚪 Account Actions</span>
                
                {!showLogoutConfirm ? (
                  <>
                    <p className="text-[10px] text-gray-400 mb-1 leading-normal">
                      You are logged in as <span className="text-gray-200 font-bold">{liveProfile.displayName}</span>. Logging out will securely exit any active voice room and close your session on this device.
                    </p>
                    <button
                      onClick={() => setShowLogoutConfirm(true)}
                      className="w-full py-2.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                    >
                      Log Out Account
                    </button>
                  </>
                ) : (
                  <div className="bg-rose-950/30 p-3 rounded-lg border border-rose-500/20 flex flex-col gap-2.5 animate-fade-in">
                    <p className="text-xs text-rose-200 font-bold leading-snug">
                      ⚠️ Are you sure you want to log out?
                    </p>
                    <div className="flex gap-2 mt-0.5">
                      <button
                        onClick={() => {
                          setShowLogoutConfirm(false);
                          onLogout();
                        }}
                        className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs uppercase transition-all active:scale-95"
                      >
                        Yes, Log Out
                      </button>
                      <button
                        onClick={() => setShowLogoutConfirm(false)}
                        className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-gray-300 font-bold rounded-lg text-xs uppercase transition-all border border-white/5 active:scale-95"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
          </div>
        )}

        {/* SECURE INTERACTIVE WALLET TAB */}
        {activeTab === "wallet" && isMe && (
          <div className="flex flex-col gap-4 pb-6 animate-fade-in">
            {/* Quick Balances Grid */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-gradient-to-br from-amber-500/20 to-yellow-600/10 p-3.5 rounded-xl border border-yellow-500/30">
                <div className="flex items-center gap-2 mb-1.5">
                  <Coins className="w-5 h-5 text-yellow-400" />
                  <span className="text-[10px] text-yellow-300 font-bold uppercase tracking-wider">Gold Coins</span>
                </div>
                <div className="text-2xl font-black font-mono text-yellow-300">
                  {liveProfile.coins.toLocaleString()}
                </div>
                <p className="text-[9px] text-gray-400 mt-1 leading-normal">
                  Use coins to send interactive virtual gifts and support stream hosts.
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-500/20 to-indigo-600/10 p-3.5 rounded-xl border border-purple-500/30">
                <div className="flex items-center gap-2 mb-1.5">
                  <Trophy className="w-5 h-5 text-purple-400" />
                  <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">Diamonds</span>
                </div>
                <div className="text-2xl font-black font-mono text-purple-300">
                  {liveProfile.diamonds.toLocaleString()}
                </div>
                <p className="text-[9px] text-gray-400 mt-1 leading-normal">
                  Earned when you receive gifts. Convert or withdraw to cash securely.
                </p>
              </div>
            </div>

            {/* OFFICIAL CREATOR CONSOLE */}
            {(loggedInUser?.id === "782446" || loggedInUser?.email === "ebadulhoque1234567890@gmail.com") && (
              <div className="bg-gradient-to-br from-yellow-500/10 via-slate-950 to-purple-500/10 p-4 rounded-xl border border-yellow-500/30 flex flex-col gap-3.5 relative overflow-hidden shadow-xl shadow-yellow-950/20">
                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-xl pointer-events-none"></div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">👑</span>
                    <div>
                      <span className="text-[10px] text-yellow-400 font-black uppercase tracking-wider block">Official Creator Console</span>
                      <span className="text-[8px] text-gray-400">Exclusive tools authorized for Ebadul official ID</span>
                    </div>
                  </div>
                  <span className="text-[7.5px] bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 font-extrabold px-1.5 py-0.5 rounded uppercase">
                    Creator Mode
                  </span>
                </div>

                {/* Option 1: Direct Diamond Gifting */}
                <div className="flex flex-col gap-2 bg-slate-900/60 p-3 rounded-lg border border-white/5">
                  <span className="text-[9.5px] text-purple-300 font-black uppercase tracking-wider block">💎 Direct Diamond Gift Tool</span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8px] text-gray-400 font-extrabold uppercase block mb-1">Target User ID or Username</label>
                      <input
                        type="text"
                        placeholder="e.g. 10002 or username"
                        value={adminTargetUserId}
                        onChange={(e) => setAdminTargetUserId(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg py-1 px-2 text-[10px] font-bold text-white focus:outline-none focus:border-yellow-500"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] text-gray-400 font-extrabold uppercase block mb-1">Diamond Amount</label>
                      <input
                        type="number"
                        placeholder="e.g. 5000"
                        value={adminDiamondAmount || ""}
                        onChange={(e) => setAdminDiamondAmount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg py-1 px-2 text-[10px] font-bold text-white focus:outline-none focus:border-yellow-500 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      if (!adminTargetUserId.trim()) {
                        triggerMessage("Please provide a valid Target User ID or Username!");
                        return;
                      }
                      if (adminDiamondAmount <= 0) {
                        triggerMessage("Please provide a diamond amount greater than zero!");
                        return;
                      }

                      try {
                        setGiftingInProgress(true);
                        const res = await fetch("/api/admin/gift-diamonds", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            adminUserId: loggedInUser?.id,
                            targetUserId: adminTargetUserId,
                            amount: adminDiamondAmount
                          })
                        });
                        const data = await res.json();
                        if (data.success) {
                          triggerMessage(data.message || "Gifted successfully!");
                          setAdminTargetUserId("");
                          setAdminDiamondAmount(0);
                        } else {
                          triggerMessage(data.error || "Gifting failed.");
                        }
                      } catch (err: any) {
                        console.error(err);
                        triggerMessage("Error: " + err.message);
                      } finally {
                        setGiftingInProgress(false);
                      }
                    }}
                    disabled={giftingInProgress}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-[9px] uppercase py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5"
                  >
                    {giftingInProgress ? (
                      <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span>Gift Diamonds Instantly</span>
                        <span>💎</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Option 2: More Gift - Premium Store Gifter */}
                <div className="flex flex-col gap-2 bg-slate-900/60 p-3 rounded-lg border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] text-yellow-400 font-black uppercase tracking-wider block">🎁 More Gift (Store Items Gifter)</span>
                    <button
                      onClick={() => setIsMoreGiftOpen(!isMoreGiftOpen)}
                      className="text-[8.5px] text-cyan-400 font-black uppercase bg-cyan-500/10 border border-cyan-400/20 px-2 py-0.5 rounded hover:bg-cyan-500/20 transition-all"
                    >
                      {isMoreGiftOpen ? "Collapse [-]" : "Expand [+]"}
                    </button>
                  </div>

                  {isMoreGiftOpen && (
                    <div className="flex flex-col gap-3 mt-2 border-t border-white/5 pt-2 animate-fade-in">
                      <div>
                        <label className="text-[8px] text-gray-400 font-extrabold uppercase block mb-1">Recipient User ID or Username</label>
                        <input
                          type="text"
                          placeholder="Enter recipient user ID or username"
                          value={adminStoreTargetUserId}
                          onChange={(e) => setAdminStoreTargetUserId(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-lg py-1 px-2 text-[10px] font-bold text-white focus:outline-none focus:border-yellow-500"
                        />
                      </div>

                      <div>
                        <label className="text-[8px] text-gray-400 font-extrabold uppercase block mb-1">Select Store Item (Frame, Entry, Color, Bubble)</label>
                        <div className="max-h-40 overflow-y-auto pr-1 flex flex-col gap-1.5 mt-1 border border-white/5 p-1.5 rounded-lg bg-slate-950">
                          {storeItems.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => setAdminStoreSelectedItemId(item.id)}
                              className={`flex items-center gap-2 p-1.5 rounded-md border text-left transition-all ${
                                adminStoreSelectedItemId === item.id
                                  ? "bg-yellow-500/10 border-yellow-500"
                                  : "bg-slate-900 border-white/5 hover:border-white/10"
                              }`}
                            >
                              <div className="w-6 h-6 rounded bg-slate-950 border border-white/10 flex items-center justify-center font-black text-xs select-none">
                                {item.category === "frame" ? (
                                  <div className="relative w-5 h-5 flex items-center justify-center">
                                    <VipAvatarFrame
                                      avatarUrl={liveProfile.avatarUrl}
                                      sizeClass="w-5 h-5"
                                      badgeSizeClass="hidden"
                                      customFrameId={item.id}
                                    />
                                  </div>
                                ) : (
                                  <span>{item.icon}</span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="text-[9px] font-bold text-white block uppercase leading-none">{item.name}</span>
                                <span className="text-[7px] text-gray-400 block truncate mt-0.5">{item.description}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          if (!adminStoreTargetUserId.trim()) {
                            triggerMessage("Please provide a Recipient User ID!");
                            return;
                          }
                          if (!adminStoreSelectedItemId) {
                            triggerMessage("Please select a store item to send!");
                            return;
                          }

                          try {
                            setGiftingInProgress(true);
                            const res = await fetch("/api/admin/gift-store-item", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                adminUserId: loggedInUser?.id,
                                targetUserId: adminStoreTargetUserId,
                                itemId: adminStoreSelectedItemId
                              })
                            });
                            const data = await res.json();
                            if (data.success) {
                              triggerMessage(data.message || "Store item gifted successfully!");
                              setAdminStoreTargetUserId("");
                              setAdminStoreSelectedItemId("");
                            } else {
                              triggerMessage(data.error || "Gifting failed.");
                            }
                          } catch (err: any) {
                            console.error(err);
                            triggerMessage("Error: " + err.message);
                          } finally {
                            setGiftingInProgress(false);
                          }
                        }}
                        disabled={giftingInProgress}
                        className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-black text-[9px] uppercase py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md shadow-yellow-950/20"
                      >
                        {giftingInProgress ? (
                          <span className="w-3 h-3 border border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <>
                            <span>Send Store Premium Gift</span>
                            <span>🎁</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sandbox Recharge Hub */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
              <div>
                <span className="text-[10px] text-yellow-400 font-black uppercase tracking-widest block">Sandbox Coins Recharge Center</span>
                <span className="text-[9px] text-gray-400">Instantly buy coins in sandbox to send premium gifts in voice channels.</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { coins: 1000, cost: 0.99 },
                  { coins: 5000, cost: 4.99 },
                  { coins: 12000, cost: 9.99 },
                  { coins: 25000, cost: 19.99 },
                ].map((pkg, idx) => (
                  <button
                    key={idx}
                    id={`btn-recharge-pkg-${idx}`}
                    onClick={() => handleRechargeSandboxModal(pkg.coins, pkg.cost)}
                    className="flex flex-col items-center justify-between p-2.5 bg-slate-900/40 hover:bg-yellow-400/10 border border-white/5 hover:border-yellow-400/30 rounded-lg transition-all text-center"
                  >
                    <span className="text-xs font-black font-mono text-yellow-300">+{pkg.coins.toLocaleString()}</span>
                    <span className="text-[9px] text-gray-300 bg-white/5 py-0.5 px-2 rounded mt-1 font-bold">
                      ${pkg.cost} USD
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Diamond Cashout Conversion tool */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
              <div>
                <span className="text-[10px] text-purple-400 font-black uppercase tracking-widest block">Premium Diamond Cashout Portal</span>
                <span className="text-[9px] text-gray-400">Withdraw your earned diamonds directly to cash. Conversion rate: 1 Diamond = BDT 1.50</span>
              </div>

              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Diamonds to Cashout</label>
                    <input
                      type="number"
                      id="input-cashout-diamonds"
                      placeholder="0"
                      value={withdrawDiamondsAmount || ""}
                      onChange={(e) => setWithdrawDiamondsAmount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg py-1.5 px-3 text-xs font-bold text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Est. Cashout Amount</label>
                    <div className="w-full bg-slate-900/50 border border-white/5 rounded-lg py-1.5 px-3 text-xs font-black text-green-400 font-mono flex items-center justify-between">
                      <span>BDT</span>
                      <span>{(withdrawDiamondsAmount * 1.5).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block mb-1">bKash / Bank Account Number</label>
                  <input
                    type="text"
                    id="input-cashout-account"
                    placeholder="Enter account number"
                    value={paymentAccount}
                    onChange={(e) => setPaymentAccount(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg py-1.5 px-3 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <button
                  id="btn-trigger-cashout-withdraw"
                  onClick={handleWithdrawModal}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 py-2 rounded-lg text-xs font-bold text-white shadow-lg shadow-purple-500/20 active:scale-98 transition-all"
                >
                  Initiate Secure Diamond Cashout
                </button>
              </div>
            </div>

            {/* Wallet Settings */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5 flex flex-col gap-2.5">
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block">Wallet Security Settings</span>
              <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                <span className="text-gray-300">Enforce Wallet Conversion PIN</span>
                <input type="checkbox" defaultChecked className="accent-purple-500" />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300">Auto-convert Received Diamonds</span>
                <input type="checkbox" className="accent-purple-500" />
              </div>
            </div>

            {/* Secure Transaction Log History */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-[10px] text-cyan-400 font-black uppercase tracking-widest">Live Transaction Security History</span>
                <span className="text-[8px] uppercase tracking-wider text-gray-500 font-extrabold">ID verified logs</span>
              </div>

              <div className="max-h-40 overflow-y-auto pr-1 flex flex-col gap-2">
                {transactionHistory.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-500">
                    No transactions registered. Recharges and cashouts will appear here.
                  </div>
                ) : (
                  transactionHistory.map((tx) => (
                    <div key={tx.id} className="p-2 bg-slate-900/50 border border-white/5 rounded-lg flex items-center justify-between text-xs">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-gray-200">{tx.description}</span>
                        <span className="text-[9px] text-gray-500">
                          {new Date(tx.timestamp).toLocaleString("en-US", { hour: "numeric", minute: "numeric", hour12: true })} • {tx.id}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`font-black font-mono text-[11px] ${
                          tx.type === "recharge" ? "text-yellow-400" : "text-purple-400"
                        }`}>
                          {tx.type === "recharge" ? `+${tx.amountCoins} Coins` : `${tx.amountDiamonds} Diamonds`}
                        </span>
                        <span className="text-[8px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded font-black mt-0.5">
                          Success
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GIFTS SHOWCASE */}
        {activeTab === "gifts" && (
          <div className="flex flex-col gap-3.5 pb-6">
            
            {/* Surprise interactive instructions */}
            {!isMe && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-2.5 rounded-lg text-[10px] text-yellow-400 leading-normal flex items-start gap-2">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-extrabold">Sandbox Direct Surprise:</strong> Click any luxury gift catalog card below to instantly purchase it using your coin wallet balance and send it directly to <strong className="font-extrabold">{liveProfile.displayName}</strong>!
                </div>
              </div>
            )}

            {/* Gift Wall Grid totals */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
              <span className="text-[9px] text-yellow-400 font-black uppercase tracking-wider block mb-2">🎁 User Received Gift Wall</span>
              
              <div className="grid grid-cols-3 gap-2">
                {giftWall.map(item => (
                  <div key={item.id} className="bg-slate-900/60 p-2 border border-white/5 rounded-lg text-center font-mono">
                    <span className="text-2xl block mb-1">{item.icon}</span>
                    <span className="text-[9px] text-gray-400 block truncate">{item.name}</span>
                    <span className="text-[11px] text-yellow-400 font-black">x{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Gift Catalog purchase */}
            {!isMe && (
              <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
                <span className="text-[9px] text-cyan-400 font-black uppercase tracking-wider block mb-2.5">Launcher Surprise Catalog</span>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {giftCatalog.map(g => (
                    <button
                      key={g.id}
                      onClick={() => handleGiftPurchaseSim(g)}
                      className="bg-slate-900/80 hover:bg-slate-900 p-2 rounded-xl border border-white/5 hover:border-yellow-500/50 flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-1.5 text-left min-w-0">
                        <span className="text-xl shrink-0">{g.imageUrl}</span>
                        <div className="min-w-0">
                          <span className="font-bold text-gray-200 block truncate text-[10px] uppercase">{g.name}</span>
                          <span className="text-[8.5px] text-yellow-400 font-mono font-bold flex items-center gap-0.5">
                            🪙 {g.cost} No
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Premium Store Gifting Catalog */}
            {!isMe && (
              <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 flex flex-col gap-2">
                <div>
                  <span className="text-[9px] text-purple-400 font-black uppercase tracking-wider block">💎 Gift Premium Store Items</span>
                  <span className="text-[8.5px] text-gray-400 block mt-0.5">Surprise them with frames, entry effects, colors, and bubbles using your diamonds! When gifted, they get the item forever or for its duration!</span>
                </div>

                {loadingStore ? (
                  <div className="py-6 flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border border-t-purple-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin"></div>
                    <span className="text-[8.5px] text-gray-500 font-bold uppercase tracking-widest animate-pulse">Loading Store Gifts...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {storeItems.map((item) => {
                      const isGifterCreator = loggedInUser?.id === "782446" || loggedInUser?.email === "ebadulhoque1234567890@gmail.com";
                      const cost = isGifterCreator ? 0 : item.price;
                      const isGiftedAlready = liveProfile.ownedStoreItems && liveProfile.ownedStoreItems.includes(item.id);

                      return (
                        <div 
                          key={item.id} 
                          className={`bg-slate-900/60 p-2.5 rounded-xl border border-white/5 flex flex-col justify-between gap-2.5 transition-all relative overflow-hidden ${
                            isGiftedAlready ? "border-purple-500/20 bg-purple-950/5" : "hover:border-purple-500/30"
                          }`}
                        >
                          <div className="flex gap-2 min-w-0">
                            <div className="w-10 h-10 shrink-0 bg-slate-950 rounded-lg border border-white/5 flex items-center justify-center text-xl relative shadow-inner font-black select-none">
                              {item.category === "frame" ? (
                                <div className="relative w-7 h-7 flex items-center justify-center">
                                  <VipAvatarFrame
                                    avatarUrl={liveProfile.avatarUrl}
                                    sizeClass="w-7 h-7"
                                    badgeSizeClass="hidden"
                                    customFrameId={item.id}
                                  />
                                </div>
                              ) : (
                                <span>{item.icon}</span>
                              )}
                              {!item.isPermanent && (
                                <span className="absolute -top-1 -right-1 bg-cyan-500/20 border border-cyan-400/30 text-cyan-400 text-[5.5px] font-black px-1 rounded-sm uppercase">
                                  {item.durationDays}D
                                </span>
                              )}
                              {item.isPermanent && (
                                <span className="absolute -top-1 -right-1 bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[5.5px] font-black px-1 rounded-sm uppercase">
                                  Perm
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="font-extrabold text-white block truncate text-[10px] uppercase">{item.name}</span>
                              <span className="text-[7.5px] text-gray-400 block line-clamp-1 mt-0.5 leading-normal">{item.description}</span>
                            </div>
                          </div>

                          <button
                            onClick={async () => {
                              if (!loggedInUser) {
                                triggerMessage("Please log in to send virtual gifts!");
                                return;
                              }
                              try {
                                setBuyingItemId(item.id);
                                const res = await fetch(`/api/users/${loggedInUser.id}/store/buy`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ itemId: item.id, targetUserId: liveProfile.id })
                                });
                                const data = await res.json();
                                if (data.success) {
                                  // Update the profile display of the target user!
                                  setLiveProfile(data.recipient);
                                  triggerMessage(`🎁 Sent ${item.name} premium gift to ${liveProfile.displayName} successfully!`);
                                } else {
                                  triggerMessage(data.error || "Gifting failed");
                                }
                              } catch (e) {
                                console.error(e);
                              } finally {
                                setBuyingItemId(null);
                              }
                            }}
                            disabled={buyingItemId !== null}
                            className={`w-full text-center text-[9px] font-bold uppercase py-1 px-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
                              isGiftedAlready 
                                ? "bg-slate-800 text-purple-300 border border-purple-500/15 cursor-not-allowed"
                                : "bg-gradient-to-r from-purple-700 to-pink-700 hover:from-purple-600 hover:to-pink-600 text-white shadow-md shadow-purple-950/40"
                            }`}
                          >
                            {buyingItemId === item.id ? (
                              <span className="w-2 h-2 border border-white border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                              <>
                                <span>{isGiftedAlready ? "Gifted Already" : "Gift"}</span>
                                {!isGiftedAlready && (
                                  <span className="font-mono text-[9px]">({cost} 💎)</span>
                                )}
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Top Gifters Ranking */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
              <span className="text-[9px] text-purple-400 font-black uppercase tracking-wider block mb-2.5">👑 Top Backers / Supporters</span>
              
              <div className="flex flex-col gap-2">
                <div className="bg-slate-900/40 p-2 rounded-lg flex items-center justify-between border border-white/5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold font-mono">#1</span>
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-950">
                      <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=50&q=80" alt="Supporter" />
                    </div>
                    <span className="font-medium text-gray-200 text-[11px]">Creator Ebadul ⚜️</span>
                  </div>
                  <span className="text-yellow-400 font-mono font-bold text-[10px]">100K 🪙</span>
                </div>
                
                <div className="bg-slate-900/40 p-2 rounded-lg flex items-center justify-between border border-white/5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-bold font-mono">#2</span>
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-950">
                      <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=50&q=80" alt="Supporter" />
                    </div>
                    <span className="font-medium text-gray-200 text-[11px]">Rahul Knight 🕺</span>
                  </div>
                  <span className="text-yellow-400 font-mono font-bold text-[10px]">24K 🪙</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: GALLERY & MOMENTS */}
        {activeTab === "gallery" && (
          <div className="flex flex-col gap-3.5 pb-6">
            
            {/* Story highlights slider row */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <div className="bg-slate-900 p-1 rounded-xl border border-white/5 shrink-0 w-20 text-center font-sans">
                <div className="h-16 rounded-lg bg-pink-900/30 flex items-center justify-center border border-pink-500/20 mb-1 text-xl relative overflow-hidden">
                  👩‍🎤
                  <span className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent"></span>
                </div>
                <span className="text-[9px] text-gray-300 block truncate">Live Stream</span>
              </div>
              <div className="bg-slate-900 p-1 rounded-xl border border-white/5 shrink-0 w-20 text-center font-sans">
                <div className="h-16 rounded-lg bg-yellow-900/30 flex items-center justify-center border border-yellow-500/20 mb-1 text-xl relative overflow-hidden">
                  🏎️
                  <span className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent"></span>
                </div>
                <span className="text-[9px] text-gray-300 block truncate">My Luxury</span>
              </div>
              <div className="bg-slate-900 p-1 rounded-xl border border-white/5 shrink-0 w-20 text-center font-sans">
                <div className="h-16 rounded-lg bg-purple-900/30 flex items-center justify-center border border-purple-500/20 mb-1 text-xl relative overflow-hidden">
                  🏖️
                  <span className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent"></span>
                </div>
                <span className="text-[9px] text-gray-300 block truncate">Moments Log</span>
              </div>
            </div>

            {/* Post new moment option if is me */}
            {isMe && (
              <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
                <span className="text-[9px] text-yellow-500 font-black uppercase block mb-1.5">Create New Moment Highlight</span>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="What's happening? Post onto gallery stream..."
                    value={newMomentText}
                    onChange={(e) => setNewMomentText(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                  />
                  <button
                    onClick={handlePostMoment}
                    className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs"
                  >
                    Post Log
                  </button>
                </div>
              </div>
            )}

            {/* Gallery Moments list */}
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Moment posts ({moments.length})</span>
            <div className="flex flex-col gap-3">
              {moments.map(m => (
                <div key={m.id} className="bg-slate-950/60 p-3 border border-white/5 rounded-xl flex gap-3">
                  <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-900">
                    <img src={m.img} alt="Moment snapshot" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[9px] text-gray-400 mb-1">
                      <span className="font-black text-yellow-500 font-mono">POST</span>
                      <span>{m.timestamp}</span>
                    </div>
                    <p className="text-xs text-gray-200 font-medium leading-normal mb-2">{m.content}</p>
                    
                    <div className="flex gap-3 text-[10px] text-gray-400 font-bold">
                      <button 
                        onClick={() => {
                          setMoments(prev => prev.map(pt => pt.id === m.id ? { ...pt, likes: pt.likes + 1 } : pt));
                          triggerMessage("Liked this gallery moment!");
                        }}
                        className="flex items-center gap-1 hover:text-rose-500 transition-colors"
                      >
                        ❤️ {m.likes} Likes
                      </button>
                      <span>💬 {m.comments} Comments</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 4: ACHIEVEMENTS & MEDALS */}
        {activeTab === "achievements" && (
          <div className="flex flex-col gap-3.5 pb-6">
            
            {/* Medals grid list */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
              <span className="text-[9px] text-yellow-400 font-black uppercase tracking-wider block mb-2.5">🎖️ Grand Event & Achievement Medals</span>
              
              <div className="grid grid-cols-2 gap-2">
                {ACHIEVEMENT_MEDALS.map(med => (
                  <div 
                    key={med.id} 
                    onClick={() => triggerMessage(`${med.title}: ${med.desc}`)}
                    className="bg-slate-900 hover:bg-slate-900 border border-white/5 hover:border-yellow-500/50 p-2.5 rounded-lg text-center cursor-pointer transition-all"
                  >
                    <span className="text-3xl block filter drop-shadow"></span >
                    <span className="text-[11px] font-black text-gray-200 block truncate">{med.title}</span>
                    <span className="text-[9px] text-gray-500 block truncate mt-0.5 mt-0.5 leading-none">{med.desc.substring(0, 30)}...</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges checklist */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 flex flex-col gap-2">
              <span className="text-[9px] text-cyan-400 font-black uppercase tracking-wider">Honor Badges Active</span>
              <div className="flex flex-wrap gap-1.5">
                {liveProfile.badges.length === 0 ? (
                  <span className="text-[10px] text-gray-500 font-medium font-mono">No elite honor badge equipped yet.</span>
                ) : (
                  liveProfile.badges.filter(b => !b.includes("following_")).map(b => (
                    <span key={b} className="text-[9px] bg-slate-900 border border-white/5 text-yellow-300 font-bold font-mono px-2 py-0.5 rounded-full uppercase">
                      ⭐ {b.replace("_", " ")}
                    </span>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: FAMILY */}
        {activeTab === "family" && (
          <div className="flex flex-col gap-3.5 pb-6">
            
            {/* Family overview */}
            <div className="bg-gradient-to-r from-yellow-950/40 via-slate-950/60 to-slate-950/60 p-4 border border-yellow-500/20 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 text-6xl text-yellow-500/10 font-bold select-none">🦁</div>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border border-yellow-500 bg-yellow-900/10 flex items-center justify-center text-3xl">
                  🦁
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wide">Ebadul Royals BD</h4>
                  <span className="text-[10px] text-yellow-400 font-mono font-bold block mt-0.5">National Level 10 Family 🏆</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-300 leading-normal mt-3">
                "The grand national family of elite voice performers and top tournament players of EbadulChat."
              </p>

              <div className="grid grid-cols-3 gap-2 text-center mt-4 pt-4 border-t border-white/5 text-[10px]">
                <div>
                  <span className="text-xs font-mono font-black text-gray-200">224</span>
                  <span className="text-[8.5px] text-gray-400 block uppercase">Members</span>
                </div>
                <div>
                  <span className="text-xs font-mono font-black text-yellow-400">#2 Rank</span>
                  <span className="text-[8.5px] text-gray-400 block uppercase">Bangladesh</span>
                </div>
                <div>
                  <span className="text-xs font-mono font-black text-cyan-400">45,900 PK</span>
                  <span className="text-[8.5px] text-gray-400 block uppercase">Rating Score</span>
                </div>
              </div>

              {/* Functional join family */}
              <button 
                onClick={() => triggerMessage("Congratulations! Your application to Ebadul Royals BD family has been sent. The family elder will approve shortly!")}
                className="w-full py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 font-black rounded-lg text-xs mt-4 uppercase tracking-wider uppercase"
              >
                Apply to Join Family
              </button>
            </div>

          </div>
        )}

        {/* TAB 6: VISITORS */}
        {activeTab === "visitors" && (
          <div className="flex flex-col gap-3.5 pb-6">
            
            {/* Total Visitors metrics details */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 text-center py-4">
              <span className="text-3xl">👥</span>
              <h3 className="text-lg font-black text-white mt-1">452 visitors</h3>
              <p className="text-[10px] text-gray-400 uppercase font-mono tracking-widest mt-0.5">Total Live Profile Card Inspects</p>
            </div>

            {/* Visitors list */}
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Recent profile visitor history (explore clicks!)</span>
            <div className="flex flex-col gap-2">
              
              <div className="bg-slate-950/50 p-2.5 border border-white/5 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-900 border border-yellow-500/50">
                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80" alt="Sarah VIP" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-200 block text-[11px]">Sarah 🌸 VIP</span>
                    <span className="text-[8.5px] text-gray-500">Visited 10 mins ago</span>
                  </div>
                </div>
                <span className="text-[8px] uppercase tracking-wider font-extrabold bg-[#2E3192]/20 text-purple-400 py-0.5 px-2 rounded-full border border-purple-500/20">
                  SVIP
                </span>
              </div>

              <div className="bg-slate-950/50 p-2.5 border border-white/5 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-900 border border-slate-700">
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80" alt="Rahul" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-200 block text-[11px]">Rahul Knight 🕺</span>
                    <span className="text-[8.5px] text-gray-500">Visited 2 hours ago</span>
                  </div>
                </div>
                <span className="text-[8px] uppercase tracking-wider font-extrabold bg-amber-500/10 text-yellow-500 py-0.5 px-2 rounded-full border border-yellow-500/20">
                  VIP
                </span>
              </div>

            </div>

          </div>
        )}

        {/* TAB 7: ACTIVITY & ROOMS */}
        {activeTab === "activity" && (
          <div className="flex flex-col gap-3.5 pb-6">
            
            {/* Live Hosted/Favorite room details */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 flex flex-col gap-2">
              <span className="text-[9px] text-yellow-400 font-extrabold uppercase block mb-1">Active Hosted Lounge Room</span>
              
              <div className="bg-slate-900/40 p-2.5 rounded-lg border border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎙️</span>
                  <div>
                    <strong className="font-bold text-gray-100 block text-[11px] uppercase">
                      {liveProfile.displayName}'s Fun Zone
                    </strong>
                    <span className="text-[9px] text-gray-400 block mt-0.5">Seat layout: 8 Seats available</span>
                  </div>
                </div>
                {onTeleportToRoom && (
                  <button
                    onClick={() => {
                      onTeleportToRoom("ebadul"); // Send home
                      onClose();
                    }}
                    className="text-[9px] font-black uppercase text-slate-950 bg-yellow-400 hover:bg-yellow-300 py-1 px-2.5 rounded-lg flex items-center gap-1"
                  >
                    Teleport join
                  </button>
                )}
              </div>
            </div>

            {/* Favorite lounge references */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 flex flex-col gap-2">
              <span className="text-[9px] text-cyan-400 font-extrabold uppercase">Favorite Stream Lounges</span>
              
              <div className="flex flex-col gap-2 text-[11px]">
                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <span className="text-gray-300">BD Voice Star Lounge 🎙️</span>
                  <span className="text-gray-500 font-mono">1.2K Visitors</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <span className="text-gray-300">Riyadh Coffee Chat ☕</span>
                  <span className="text-gray-500 font-mono">820 Visitors</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB: STORE */}
        {activeTab === "store" && isMe && (
          <div className="flex flex-col gap-4 pb-6 text-xs">
            <div className="bg-gradient-to-r from-purple-900/40 via-slate-900/80 to-purple-950/40 p-4 rounded-2xl border border-purple-500/20 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-purple-400">💎</span> EbadulChat Premium Store
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-1 max-w-[280px]">
                    Customize your profile with elite animated frames, neon entry effects, custom color names, and premium chat bubbles!
                  </p>
                </div>
                <div className="text-right bg-slate-950/70 py-1.5 px-3 rounded-xl border border-white/5 select-none shrink-0">
                  <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Your Balance</div>
                  <div className="text-sm font-black text-purple-400 flex items-center gap-1 mt-0.5 justify-end">
                    <span>{liveProfile.diamonds.toLocaleString()}</span>
                    <span>💎</span>
                  </div>
                </div>
              </div>

              {/* Creator notice easter egg */}
              {(liveProfile.id === "782446" || liveProfile.email === "ebadulhoque1234567890@gmail.com") && (
                <div className="mt-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-2.5 flex items-center gap-2 text-yellow-400 select-none">
                  <span className="text-base">👑</span>
                  <div>
                    <div className="text-[9px] font-black uppercase">Creator Privilege Unlocked</div>
                    <div className="text-[8px] text-gray-400 mt-0.5">All premium items are 100% free for Ebadul. Get anything you want!</div>
                  </div>
                </div>
              )}
            </div>

            {loadingStore ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-2 border-t-purple-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin"></div>
                <span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest animate-pulse">Loading Premium Catalog...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* Categories */}
                {["frame", "entry", "color", "bubble"].map((cat) => {
                  const catItems = storeItems.filter(item => item.category === cat);
                  const catLabel = cat === "frame" ? "DP Avatar Frames"
                                  : cat === "entry" ? "Lounge Entry Effects"
                                  : cat === "color" ? "Nickname Text Colors"
                                  : "Message Chat Bubbles";
                  const catDesc = cat === "frame" ? "Round animated glowing border around your avatar"
                                : cat === "entry" ? "Stunning banner announcements when you join rooms"
                                : cat === "color" ? "Custom gradients and text effects for your display name"
                                : "Futuristic neon borders for your room chat bubbles";

                  if (catItems.length === 0) return null;

                  return (
                    <div key={cat} className="flex flex-col gap-2.5">
                      <div className="border-l-2 border-purple-500 pl-2">
                        <h4 className="text-[11px] font-extrabold text-white uppercase tracking-wider">{catLabel}</h4>
                        <p className="text-[8.5px] text-gray-400 mt-0.5">{catDesc}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        {catItems.map((item) => {
                          const isCreator = liveProfile.id === "782446" || liveProfile.email === "ebadulhoque1234567890@gmail.com";
                          const owns = isCreator || (liveProfile.ownedStoreItems && liveProfile.ownedStoreItems.includes(item.id));
                          
                          let isEquipped = false;
                          if (cat === "frame") isEquipped = liveProfile.activeFrameId === item.id;
                          else if (cat === "entry") isEquipped = liveProfile.activeEntryEffectId === item.id;
                          else if (cat === "color") isEquipped = liveProfile.activeIdColorId === item.id;
                          else if (cat === "bubble") isEquipped = liveProfile.activeMessageEffectId === item.id;

                          return (
                            <div 
                              key={item.id} 
                              className={`bg-slate-950/60 border rounded-2xl p-3 flex flex-col justify-between gap-3.5 transition-all relative overflow-hidden ${
                                isEquipped ? "border-purple-500/50 bg-gradient-to-b from-purple-950/20 to-slate-950/60" : "border-white/5 hover:border-white/10"
                              }`}
                            >
                              <div className="flex gap-2.5">
                                {/* Visual representation container */}
                                <div className="w-12 h-12 shrink-0 bg-slate-900 rounded-xl border border-white/5 flex items-center justify-center text-2xl relative shadow-inner">
                                  {cat === "frame" ? (
                                    <div className="relative w-9 h-9 flex items-center justify-center">
                                      <VipAvatarFrame
                                        avatarUrl={liveProfile.avatarUrl}
                                        sizeClass="w-9 h-9"
                                        badgeSizeClass="hidden"
                                        customFrameId={item.id}
                                      />
                                    </div>
                                  ) : (
                                    <span>{item.icon}</span>
                                  )}
                                  {!item.isPermanent && (
                                    <span className="absolute -top-1 -right-1 bg-cyan-500/20 border border-cyan-400/30 text-cyan-400 text-[6.5px] font-black px-1 rounded-md uppercase">
                                      {item.durationDays}D
                                    </span>
                                  )}
                                  {item.isPermanent && (
                                    <span className="absolute -top-1 -right-1 bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[6.5px] font-black px-1 rounded-md uppercase">
                                      Perm
                                    </span>
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <div className="font-extrabold text-white text-[10.5px] truncate">{item.name}</div>
                                  <div className="text-[8px] text-gray-400 mt-0.5 line-clamp-2 leading-normal">{item.description}</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 mt-auto">
                                {owns ? (
                                  <>
                                    {isEquipped ? (
                                      <button
                                        onClick={async () => {
                                          try {
                                            setEquippingItemId(item.id);
                                            const res = await fetch(`/api/users/${liveProfile.id}/store/unequip`, {
                                              method: "POST",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify({ category: cat })
                                            });
                                            const data = await res.json();
                                            if (data.success) {
                                              setLiveProfile(data.profile);
                                              onSetUser(data.profile);
                                              triggerMessage(`Unequipped ${item.name}!`);
                                            } else {
                                              triggerMessage(data.error || "Unequip failed");
                                            }
                                          } catch (e) {
                                            console.error(e);
                                          } finally {
                                            setEquippingItemId(null);
                                          }
                                        }}
                                        disabled={equippingItemId !== null}
                                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-gray-300 text-[9px] font-extrabold uppercase py-1.5 px-2 rounded-xl transition-all"
                                      >
                                        Unequip
                                      </button>
                                    ) : (
                                      <button
                                        onClick={async () => {
                                          try {
                                            setEquippingItemId(item.id);
                                            const res = await fetch(`/api/users/${liveProfile.id}/store/equip`, {
                                              method: "POST",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify({ itemId: item.id })
                                            });
                                            const data = await res.json();
                                            if (data.success) {
                                              setLiveProfile(data.profile);
                                              onSetUser(data.profile);
                                              triggerMessage(`Equipped ${item.name} successfully! ✅`);
                                            } else {
                                              triggerMessage(data.error || "Equip failed");
                                            }
                                          } catch (e) {
                                            console.error(e);
                                          } finally {
                                            setEquippingItemId(null);
                                          }
                                        }}
                                        disabled={equippingItemId !== null}
                                        className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[9px] font-extrabold uppercase py-1.5 px-2 rounded-xl transition-all shadow-md shadow-purple-950/40"
                                      >
                                        Use/Equip
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <button
                                    onClick={async () => {
                                      try {
                                        setBuyingItemId(item.id);
                                        const res = await fetch(`/api/users/${liveProfile.id}/store/buy`, {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ itemId: item.id })
                                        });
                                        const data = await res.json();
                                        if (data.success) {
                                          setLiveProfile(data.recipient);
                                          onSetUser(data.recipient);
                                          triggerMessage(data.message || "Purchase successful!");
                                        } else {
                                          triggerMessage(data.error || "Purchase failed");
                                        }
                                      } catch (e) {
                                        console.error(e);
                                      } finally {
                                        setBuyingItemId(null);
                                      }
                                    }}
                                    disabled={buyingItemId !== null}
                                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-black uppercase py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1 shadow-md shadow-purple-950/40"
                                  >
                                    {buyingItemId === item.id ? (
                                      <span className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    ) : (
                                      <>
                                        <span>Buy</span>
                                        <span className="font-mono text-[10px]">({isCreator ? "0" : item.price} 💎)</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 8: SETTINGS & WALLET */}
        {activeTab === "settings" && isMe && (
          <div className="flex flex-col gap-3.5 pb-6 text-xs">
            
            {/* Edit Credentials fields details */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 flex flex-col gap-3">
              <span className="text-[9px] text-yellow-500 font-black uppercase tracking-wider block">Configure Elite Profile details</span>
              
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-bold text-gray-400 uppercase">Screen Display Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white focus:outline-none focus:border-yellow-500 text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-bold text-gray-400 uppercase">Screen Bio Signature</label>
                  <textarea
                    value={editBioText}
                    onChange={(e) => setEditBioText(e.target.value)}
                    rows={2}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-yellow-500 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-bold text-gray-400 uppercase">Age</label>
                    <input
                      type="number"
                      value={editAgeNum}
                      onChange={(e) => setEditAgeNum(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-bold text-gray-400 uppercase">Location flag</label>
                    <input
                      type="text"
                      value={editCountryName}
                      onChange={(e) => setEditCountryName(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-bold text-gray-400 uppercase">VIP Target Level</label>
                    <select
                      value={editVip}
                      onChange={(e) => setEditVip(e.target.value as VipLevel)}
                      className="bg-slate-900 border border-slate-800 rounded-lg py-1 text-white text-xs"
                    >
                      <option value={VipLevel.NONE}>None</option>
                      <option value={VipLevel.VIP}>VIP Member</option>
                      <option value={VipLevel.SVIP}>SVIP Royalty</option>
                      <option value={VipLevel.ROYAL}>Royal Majestic</option>
                      <option value={VipLevel.EMPEROR}>Emperor Lord</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-bold text-gray-400 uppercase">Gender Icon</label>
                    <select
                      value={editGenderType}
                      onChange={(e) => setEditGenderType(e.target.value as Gender)}
                      className="bg-slate-900 border border-slate-800 rounded-lg py-1 text-white text-xs"
                    >
                      <option value={Gender.MALE}>Male ♂️</option>
                      <option value={Gender.FEMALE}>Female ♀️</option>
                      <option value={Gender.OTHER}>Other ⚛️</option>
                    </select>
                  </div>
                </div>

                {/* Avatar & Cover Link settings */}
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-bold text-gray-400 uppercase">Avatar Picture Link</label>
                  <input
                    type="text"
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white font-mono text-[9px] text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-bold text-gray-400 uppercase">Profile Cover Link</label>
                  <input
                    type="text"
                    value={editCover}
                    onChange={(e) => setEditCover(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white font-mono text-[9px] text-xs"
                  />
                </div>
                
              </div>

              <button
                onClick={handleOwnerSaveConfig}
                className="w-full py-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all mt-2"
              >
                Save Profile Changes
              </button>
            </div>

            {/* Privacy toggles */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 flex flex-col gap-2.5">
              <span className="text-[9px] text-pink-400 font-black uppercase tracking-wider">Privacy & Security Options</span>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300">Allow direct private messages</span>
                <input
                  type="checkbox"
                  checked={allowPrivateChats}
                  onChange={(e) => setAllowPrivateChats(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-800 text-yellow-500"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300">Hide my online status from friends</span>
                <input
                  type="checkbox"
                  checked={hideOnlineStatus}
                  onChange={(e) => setHideOnlineStatus(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-800 text-yellow-500"
                />
              </div>
            </div>

            {/* Account security status info */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 text-[10px] text-gray-400">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-extrabold text-gray-300 uppercase">Dynamic Account Shield Active</span>
              </div>
              Logged in successfully. Secure tokens managed properly server-side in index memory. Device: AI Studio Emulator.
            </div>

            {isMe && onLogout && (
              <div className="w-full mt-2">
                {!showLogoutConfirm ? (
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full py-2.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                  >
                    🚪 Log Out Account
                  </button>
                ) : (
                  <div className="bg-rose-950/30 p-3 rounded-xl border border-rose-500/25 flex flex-col gap-2.5 animate-fade-in">
                    <p className="text-xs text-rose-200 font-bold leading-snug">
                      ⚠️ Are you sure you want to log out?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowLogoutConfirm(false);
                          onLogout();
                        }}
                        className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs uppercase transition-all active:scale-95"
                      >
                        Yes, Log Out
                      </button>
                      <button
                        onClick={() => setShowLogoutConfirm(false)}
                        className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-gray-300 font-bold rounded-lg text-xs uppercase transition-all border border-white/5 active:scale-95"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* TAB 9: APP ADMIN (SUPREME CREATOR COMMAND CENTER) */}
        {activeTab === "app_admin" && isMe && (liveProfile.email === "ebadulhoque1234567890@gmail.com" || liveProfile.isGlobalAdmin || liveProfile.isOfficialStaff) && (
          <div className="flex flex-col gap-4 pb-12 text-xs font-sans text-left">
            
            {/* Animated Laser Creator Header Banner */}
            <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 p-3.5 rounded-xl border border-yellow-300/30 shadow-[inset_0_0_12px_rgba(255,255,255,0.2)] relative overflow-hidden select-none animate-pulse">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
              <div className="flex items-center gap-2.5 relative z-10">
                <span className="text-xl">⚡</span>
                <div>
                  <h3 className="text-xs font-black text-slate-950 uppercase tracking-widest leading-none">SUPREME COMMAND CENTER</h3>
                  <p className="text-[8px] text-yellow-950 font-extrabold uppercase mt-1 tracking-wider">AUTHORISED PERSONNEL SYSTEM ACCESS KEYS ONLY</p>
                </div>
                <span className="ml-auto text-[7px] bg-slate-950 text-yellow-400 px-1.5 py-0.5 rounded font-black font-mono">
                  SECURE_SESSION_OK
                </span>
              </div>
            </div>

            {loadingAdminStats ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2.5">
                <div className="w-8 h-8 rounded-full border-2 border-yellow-500/10 border-t-yellow-500 animate-spin"></div>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest animate-pulse">Synchronizing Core Database...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                
                {/* 1. Live Platform Statistics Overview Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
                    <span className="text-[8px] uppercase tracking-wider text-gray-500 font-extrabold block">Live Connected Sockets</span>
                    <span className="text-base font-black font-mono text-emerald-400 mt-1 block">
                      {adminStats?.activeUsersCount || 0} <span className="text-[8px] text-gray-400 uppercase font-semibold">Online</span>
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
                    <span className="text-[8px] uppercase tracking-wider text-gray-500 font-extrabold block">Total Registered Users</span>
                    <span className="text-base font-black font-mono text-cyan-400 mt-1 block">
                      {adminStats?.totalUsers || 0} <span className="text-[8px] text-gray-400 uppercase font-semibold">Profiles</span>
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
                    <span className="text-[8px] uppercase tracking-wider text-gray-500 font-extrabold block">Total Rooms Active</span>
                    <span className="text-base font-black font-mono text-purple-400 mt-1 block">
                      {adminStats?.totalRooms || 0} <span className="text-[8px] text-gray-400 uppercase font-semibold">Rooms</span>
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
                    <span className="text-[8px] uppercase tracking-wider text-gray-500 font-extrabold block">Active Ledger Transactions</span>
                    <span className="text-base font-black font-mono text-amber-500 mt-1 block">
                      {adminStats?.allTransactions?.length || 0} <span className="text-[8px] text-gray-400 uppercase font-semibold">Logs</span>
                    </span>
                  </div>
                </div>

                {/* 2. User Moderation Commands Panel */}
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-white/5 flex flex-col gap-3 relative">
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-[9px] text-yellow-400 font-black uppercase tracking-wider block">🛠️ Platform Ban & Access Panel</span>
                    <span className="text-[8px] text-gray-400">Perform instant DB actions on any user profile ID</span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    
                    {/* Select Action */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] text-gray-400 font-black uppercase tracking-wider">Select Command Action</label>
                      <select
                        value={adminActionSelection}
                        onChange={(e) => setAdminActionSelection(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs font-semibold focus:outline-none focus:border-yellow-500"
                      >
                        <option value="permanent_ban">🚫 Permanent Account Ban (Hard Lock)</option>
                        <option value="undo_permanent_ban">✅ Lift Permanent Account Ban</option>
                        <option value="temporary_ban">⏳ Temporary Account Suspension</option>
                        <option value="undo_temporary_ban">✅ Lift Temporary Suspension</option>
                        <option value="device_ban">📱 Hardware/Device Ban (IP/Device Block)</option>
                        <option value="undo_device_ban">✅ Lift Device & IP Ban</option>
                        <option value="set_official_staff">👑 Grant/Revoke Official Administrative Role</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Target ID Input */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] text-gray-400 font-black uppercase tracking-wider">Target Profile ID</label>
                        <input
                          type="text"
                          placeholder="e.g. 10023"
                          value={adminSelectedUserId}
                          onChange={(e) => setAdminSelectedUserId(e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-white font-black font-mono text-xs focus:outline-none focus:border-yellow-500"
                        />
                      </div>

                      {/* Contextual Options Field */}
                      {adminActionSelection === "temporary_ban" ? (
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] text-gray-400 font-black uppercase tracking-wider">Suspension Duration</label>
                          <select
                            value={adminActionDuration}
                            onChange={(e) => setAdminActionDuration(Number(e.target.value))}
                            className="bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-white font-bold text-xs"
                          >
                            <option value={24}>24 Hours (1 Day)</option>
                            <option value={48}>48 Hours (2 Days)</option>
                            <option value={72}>72 Hours (3 Days)</option>
                            <option value={168}>168 Hours (1 Week)</option>
                          </select>
                        </div>
                      ) : adminActionSelection === "set_official_staff" ? (
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] text-gray-400 font-black uppercase tracking-wider">Access Privilege Level</label>
                          <select
                            value={adminActionRole}
                            onChange={(e) => setAdminActionRole(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-white font-bold text-xs"
                          >
                            <option value="none">❌ Regular User (Demote)</option>
                            <option value="staff">🛡️ Official Staff (Limited Panel)</option>
                            <option value="full_admin">👑 Full Co-Admin (Supreme Access)</option>
                          </select>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1 opacity-40">
                          <label className="text-[8px] text-gray-400 font-black uppercase tracking-wider">System Arguments</label>
                          <input
                            type="text"
                            disabled
                            value="N/A (Default Payload)"
                            className="bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-gray-500 text-xs font-mono select-none"
                          />
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleAdminActionSubmit}
                      className="w-full py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black uppercase tracking-wider rounded-lg transition-all active:scale-98 shadow-md border border-white/5 flex items-center justify-center gap-1 mt-2 cursor-pointer"
                    >
                      <span>🚀 Execute Administrative Command</span>
                    </button>

                  </div>
                </div>

                {/* 3. Official Room Status Manager Panel */}
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-white/5 flex flex-col gap-3">
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-[9px] text-yellow-400 font-black uppercase tracking-wider block">👑 Official Public Room status</span>
                    <span className="text-[8px] text-gray-400">Award dynamic official gold star tags to rooms</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] text-gray-400 font-black uppercase tracking-wider">Room ID Number</label>
                        <input
                          type="text"
                          placeholder="e.g. room_124"
                          value={customRoomIdSearch}
                          onChange={(e) => setCustomRoomIdSearch(e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-white font-black font-mono text-xs focus:outline-none"
                        />
                      </div>

                      <div className="flex gap-1.5 items-end">
                        <button
                          onClick={() => handleToggleRoomOfficial(customRoomIdSearch, true)}
                          className="flex-1 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black uppercase tracking-wide rounded-lg text-[9px] transition-all cursor-pointer"
                        >
                          🌟 Make Official
                        </button>
                        <button
                          onClick={() => handleToggleRoomOfficial(customRoomIdSearch, false)}
                          className="flex-1 py-1.5 bg-slate-850 hover:bg-slate-800 text-rose-500 font-black uppercase tracking-wide rounded-lg text-[9px] transition-all border border-rose-950/50 cursor-pointer"
                        >
                          Remove Tag
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Live Online User Monitor with Search */}
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-white/5 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div>
                      <span className="text-[9px] text-emerald-400 font-black uppercase tracking-wider block">● Live Online User directory</span>
                      <span className="text-[8px] text-gray-400">Click any user to load their ID directly into the commands tool</span>
                    </div>
                    <span className="text-[8px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black px-2 py-0.5 rounded-full uppercase">
                      {adminStats?.onlineUsers?.length || 0} active
                    </span>
                  </div>

                  {/* Directory Search Field */}
                  <input
                    type="text"
                    placeholder="Search online users display name or username..."
                    value={adminSearchQuery}
                    onChange={(e) => setAdminSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-yellow-500"
                  />

                  {/* Scroller online user list */}
                  <div className="max-h-48 overflow-y-auto flex flex-col gap-2 focus-scroll-none">
                    {(adminStats?.onlineUsers || [])
                      .filter((u: any) => {
                        const q = adminSearchQuery.toLowerCase().trim();
                        if (!q) return true;
                        return (
                          u.displayName?.toLowerCase().includes(q) ||
                          u.username?.toLowerCase().includes(q) ||
                          u.id?.toString().includes(q)
                        );
                      })
                      .map((u: any) => (
                        <div 
                          key={u.id}
                          className="flex items-center justify-between p-2.5 bg-slate-900/60 hover:bg-slate-900 rounded-xl border border-white/5 hover:border-yellow-500/20 transition-all select-none"
                        >
                          <div className="flex items-center gap-2">
                            <VipAvatarFrame
                              avatarUrl={u.avatarUrl}
                              level={u.level}
                              sizeClass="w-7 h-7"
                              badgeSizeClass="hidden"
                              customFrameId={u.activeFrameId}
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-gray-200 block truncate max-w-[120px]">{u.displayName}</span>
                              <span className="text-[7.5px] text-gray-500 font-mono">
                                ID: {u.id} {u.isOfficialStaff && <span className="text-yellow-400 font-bold ml-1">ADMIN</span>}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {u.activeRoom ? (
                              <span className="text-[7.5px] bg-purple-500/10 border border-purple-500/20 text-purple-400 font-extrabold px-1.5 py-0.5 rounded max-w-[80px] truncate" title={`Active in Room ID: ${u.activeRoom.id}`}>
                                Room: {u.activeRoom.name}
                              </span>
                            ) : (
                              <span className="text-[7.5px] bg-slate-800 text-gray-500 font-bold px-1.5 py-0.5 rounded">
                                Lobby
                              </span>
                            )}
                            <button
                              onClick={() => {
                                setAdminSelectedUserId(u.id);
                                triggerMessage(`Target ID ${u.id} (${u.displayName}) loaded! Click Execute above to apply action.`);
                              }}
                              className="text-[8px] bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase"
                            >
                              Manage
                            </button>
                          </div>
                        </div>
                    ))}
                    {(adminStats?.onlineUsers || []).length === 0 && (
                      <span className="text-center text-[9px] text-gray-500 uppercase font-black py-4">No users are currently online</span>
                    )}
                  </div>
                </div>

                {/* 5. Live Recharge & spend Ledger Transactions */}
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-white/5 flex flex-col gap-2.5">
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-[9px] text-yellow-400 font-black uppercase tracking-wider block">📊 Real-time Transaction Ledger</span>
                    <span className="text-[8px] text-gray-400">All recharge and cashing ledger entries tracked in memory</span>
                  </div>

                  <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5 focus-scroll-none font-mono text-[8px]">
                    {(adminStats?.allTransactions || []).map((txn: any) => (
                      <div 
                        key={txn.id}
                        className="p-2 bg-slate-900/50 rounded-lg border border-white/5 flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-black uppercase ${
                            txn.type === "recharge" ? "text-emerald-400" 
                            : txn.type === "withdrawal" ? "text-rose-400" 
                            : "text-purple-400"
                          }`}>
                            [{txn.type}] ID: {txn.userId}
                          </span>
                          <span className="text-gray-500 text-[7px]">{new Date(txn.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-gray-400 leading-normal text-[8.5px]">{txn.description}</p>
                        <div className="flex items-center justify-between text-gray-500 border-t border-white/5 pt-1 mt-0.5">
                          <span>TxID: {txn.id}</span>
                          <span className="text-yellow-500 font-extrabold">+{txn.amountCoins} C / +{txn.amountDiamonds} D</span>
                        </div>
                      </div>
                    ))}
                    {(adminStats?.allTransactions || []).length === 0 && (
                      <span className="text-center text-gray-500 uppercase font-black py-4">No transactions processed in this session yet</span>
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </div>

      {/* FOOTER ACTION BUTTONS - FOR PEERS / SOCIAL CHANGER */}
      {!isMe && (
        <div className="p-3 bg-slate-950/90 border-t border-white/5 shrink-0 flex items-center gap-2 z-20">
          
          {/* Follow toggle button */}
          <button
            onClick={handleFollowAction}
            className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide flex items-center justify-center gap-1 transition-all ${
              isFollowing 
                ? "bg-slate-900 text-yellow-400 border border-yellow-500/20" 
                : "bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950"
            }`}
          >
            {isFollowing ? (
              <>
                <UserMinus className="w-3.5 h-3.5" />
                Following
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                Follow
              </>
            )}
          </button>

          {/* Add Friend or Chat dial triggers */}
          <button
            onClick={handleAddFriend}
            className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${
              isFriend 
                ? "bg-rose-950/30 border-rose-500 text-rose-400" 
                : "bg-slate-900 border-white/5 text-gray-300 hover:text-white"
            }`}
            title="Add to Friends circle"
          >
            <Heart className={`w-4 h-4 ${isFriend && "fill-rose-400"}`} />
          </button>

          {/* Private inbox messenger toggle */}
          {onInitiatePrivateChat && (
            <button
              onClick={() => {
                onInitiatePrivateChat(liveProfile);
                onClose();
              }}
              className="w-9 h-9 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center text-gray-300 hover:text-white"
              title="Send direct private message"
            >
              <MessageSquare className="w-4 h-4 fill-gray-300/15" />
            </button>
          )}

          {/* Mention Tag shortcut */}
          {onMentionUser && (
            <button
              onClick={() => {
                onMentionUser(liveProfile.displayName || liveProfile.username || liveProfile.id);
                onClose();
              }}
              className="w-9 h-9 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20 active:scale-90 transition-all font-black font-sans text-xs"
              title="Tag / Mention user in room chat"
            >
              @
            </button>
          )}

          {/* Voice dialer launcher triggers */}
          <button
            onClick={() => initiateCallSim("voice")}
            className="w-9 h-9 rounded-lg bg-[#2E3192]/20 border border-purple-500/20 flex items-center justify-center text-purple-400 hover:text-purple-300"
            title="Launch Voice Telephone call"
          >
            <Phone className="w-4 h-4" />
          </button>

          {/* Relationship Center Launcher Button */}
          <button
            onClick={() => setShowRelationshipCenter(true)}
            className="w-9 h-9 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 hover:text-pink-300 hover:bg-pink-500/20 active:scale-90 transition-all"
            title="Relationship Center"
          >
            <Heart className="w-4 h-4 fill-pink-500/10 text-pink-400 animate-pulse" />
          </button>

          <button
            onClick={() => initiateCallSim("video")}
            className="w-9 h-9 rounded-lg bg-emerald-600/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400 hover:text-emerald-300"
            title="Launch Video Call simulation"
          >
            <Video className="w-4 h-4" />
          </button>

        </div>
      )}

      {showReportReasons && (
        <div className="absolute inset-0 bg-slate-950/90 z-60 flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-700 rounded-2xl p-4 flex flex-col gap-3 py-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-black text-rose-400 flex items-center gap-1">
                🛡️ Report Reason Listing
              </span>
              <button 
                onClick={() => setShowReportReasons(false)} 
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-[10px] text-gray-400 leading-normal">
              Please choose a reason for reporting @{liveProfile.username || liveProfile.id}:
            </p>

            <div className="flex flex-col gap-1.5 font-sans">
              {[
                "Abuse / Bad Lang",
                "Child Voice",
                "Inappropriate Profile Photo",
                "Fake Account",
                "Spam"
              ].map((reason, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendReport(reason)}
                  className="w-full text-left bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-gray-200 py-2.5 px-3 rounded-xl transition-all font-semibold cursor-pointer"
                >
                  {idx + 1}. {reason}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowReportReasons(false)}
              className="w-full border border-slate-800 bg-slate-900 text-gray-300 font-extrabold hover:text-white text-xs py-2 rounded-xl mt-1.5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showSocialList && (
        <div className="absolute inset-0 bg-slate-950/95 z-60 flex flex-col font-sans text-left animate-fade-in">
          {/* Header */}
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xl">{showSocialList === "followers" ? "👥" : "🔗"}</span>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  {showSocialList === "followers" ? "Followers" : "Following"} List
                </h3>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                  Of {liveProfile.displayName}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSocialList(null)}
              className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {loadingSocial ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-yellow-500/10 border-t-yellow-500 animate-spin"></div>
                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest font-mono">Loading Users...</span>
              </div>
            ) : socialUsers.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-3">
                <span className="text-3xl">🏜️</span>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">No users found</h4>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">List is empty</p>
                </div>
              </div>
            ) : (
              socialUsers.map((u) => {
                const isUserMe = loggedInUser?.id === u.id;
                const loggedInFollowsThisUser = loggedInUser?.badges.includes(`following_${u.id}`);
                
                return (
                  <div
                    key={u.id}
                    onClick={() => handleViewOtherProfile(u.id)}
                    className="flex items-center justify-between p-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-2xl cursor-pointer transition-all active:scale-98"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <VipAvatarFrame
                          avatarUrl={u.avatarUrl}
                          level={u.vipLevelNumeric}
                          sizeClass="w-10 h-10"
                          badgeSizeClass="text-[6.5px]"
                          customFrameId={u.activeFrameId}
                        />
                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-slate-950 ${
                          u.isOnline ? "bg-emerald-500" : "bg-gray-500"
                        }`} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-black uppercase truncate ${getVipNameStyle(u.vipLevelNumeric)}`}>
                            {u.displayName}
                          </span>
                          {u.isVerified && (
                            <CheckCircle className="w-3 text-blue-400 fill-blue-900/20" />
                          )}
                        </div>
                        <span className="text-[8.5px] text-gray-500 font-mono block">
                          ID: {u.id} • @{u.username}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {!isUserMe && loggedInUser && (
                        <button
                          onClick={() => handleSocialFollowToggle(u)}
                          className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                            loggedInFollowsThisUser
                              ? "bg-slate-950 text-yellow-400 border border-yellow-500/20"
                              : "bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 hover:opacity-90"
                          }`}
                        >
                          {loggedInFollowsThisUser ? "Unfollow" : "Follow"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ----------------- RELATIONSHIP CENTER MODAL OVERLAY ----------------- */}
      {showRelationshipCenter && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col p-4 text-white overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-400 animate-pulse" />
              <div>
                <h3 className="font-extrabold text-sm tracking-wide text-gray-100">Relationship Center</h3>
                <p className="text-[10px] text-gray-400">Manage categories, levels, daily tasks & claim premium rewards</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowRelationshipCenter(false);
                fetchRelationshipData();
              }}
              className="p-1 rounded-full bg-slate-900 border border-white/10 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Relationship Center Tabs */}
          <div className="flex gap-1 bg-slate-900/60 p-1 rounded-lg border border-white/5 mb-4 text-xs overflow-x-auto scrollbar-none">
            {[
              { id: "active", label: "Active" },
              { id: "requests", label: "Requests" },
              { id: "levels", label: "Rewards" },
              { id: "history", label: "History" },
              { id: "admin", label: "Admin" }
            ].map(tab => {
              if (tab.id === "admin" && !loggedInUser?.badges.includes("admin")) return null;
              const isActive = relActiveTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setRelActiveTab(tab.id)}
                  className={`flex-1 py-1.5 px-3 rounded-md font-bold transition-all text-center whitespace-nowrap ${
                    isActive 
                      ? "bg-pink-500 text-white shadow-md shadow-pink-500/20" 
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Contents */}
          {relationshipLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-gray-400">Syncing database...</span>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              {/* TAB 1: ACTIVE RELATIONSHIPS */}
              {relActiveTab === "active" && (
                <div className="flex-1 flex flex-col gap-4">
                  {/* Category cards */}
                  {relationshipData?.active && relationshipData.active.length > 0 ? (
                    relationshipData.active.map((r: any) => {
                      const partnerId = r.user1Id === liveProfile.id ? r.user2Id : r.user1Id;
                      const partnerName = r.user1Id === liveProfile.id ? r.user2Name : r.user1Name;
                      const partnerAvatar = r.user1Id === liveProfile.id ? r.user2Avatar : r.user1Avatar;
                      
                      let icon = "❤️";
                      let label = "Couple";
                      let colorStyle = "from-pink-500/10 to-rose-500/10 border-pink-500/30";
                      let badgeStyle = "bg-pink-500 text-white";
                      let themeGradient = "from-pink-500 to-rose-500";

                      if (r.type === "homies") {
                        icon = "🤝"; label = "Homies";
                        colorStyle = "from-blue-500/10 to-cyan-500/10 border-blue-500/30";
                        badgeStyle = "bg-blue-500 text-white";
                        themeGradient = "from-blue-500 to-cyan-500";
                      } else if (r.type === "best_friend") {
                        icon = "💙"; label = "Best Friend";
                        colorStyle = "from-cyan-500/10 to-teal-500/10 border-cyan-500/30";
                        badgeStyle = "bg-cyan-500 text-white";
                        themeGradient = "from-cyan-500 to-teal-500";
                      } else if (r.type === "brother") {
                        icon = "🛡️"; label = "Brother";
                        colorStyle = "from-amber-500/10 to-yellow-500/10 border-amber-500/30";
                        badgeStyle = "bg-amber-500 text-slate-950";
                        themeGradient = "from-amber-500 to-yellow-500";
                      } else if (r.type === "sister") {
                        icon = "🌸"; label = "Sister";
                        colorStyle = "from-fuchsia-500/10 to-purple-500/10 border-fuchsia-500/30";
                        badgeStyle = "bg-fuchsia-500 text-white";
                        themeGradient = "from-fuchsia-500 to-purple-500";
                      } else if (r.type === "family") {
                        icon = "👨‍👩‍👧"; label = "Family";
                        colorStyle = "from-emerald-500/10 to-teal-500/10 border-emerald-500/30";
                        badgeStyle = "bg-emerald-500 text-white";
                        themeGradient = "from-emerald-500 to-teal-500";
                      } else if (r.type === "soulmate") {
                        icon = "💖"; label = "Soulmate";
                        colorStyle = "from-rose-500/10 to-pink-500/10 border-rose-500/30";
                        badgeStyle = "bg-rose-500 text-white";
                        themeGradient = "from-rose-500 to-pink-500";
                      }

                      // Level progression calculations
                      const pct = Math.min(100, Math.max(2, (r.points / r.pointsNextLevel) * 100));

                      const todayStr = new Date().toDateString();
                      const checkedInToday = r.lastCheckIn && new Date(r.lastCheckIn).toDateString() === todayStr;

                      return (
                        <div key={r.id} className={`bg-gradient-to-br ${colorStyle} border p-4 rounded-xl flex flex-col gap-3 relative overflow-hidden`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="relative">
                                <img src={partnerAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80"} className="w-10 h-10 rounded-full border border-white/20 object-cover" />
                                <span className="absolute -bottom-1.5 -right-1.5 text-xs bg-slate-950/80 p-0.5 rounded-full">{icon}</span>
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-sm">{partnerName}</span>
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${badgeStyle}`}>{label}</span>
                                </div>
                                <span className="text-[9px] text-gray-400">Anniversary: {r.anniversaryDate}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Daily check-in button */}
                              {loggedInUser && (loggedInUser.id === r.user1Id || loggedInUser.id === r.user2Id) && (
                                <button
                                  onClick={() => handleCheckIn(partnerId)}
                                  disabled={checkedInToday}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                    checkedInToday 
                                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default" 
                                      : "bg-pink-600 hover:bg-pink-500 text-white active:scale-95 shadow-md shadow-pink-600/10"
                                  }`}
                                >
                                  {checkedInToday ? "✓ Checked" : "Check-In"}
                                </button>
                              )}

                              {/* Dissolve Relationship action */}
                              {loggedInUser && (loggedInUser.id === r.user1Id || loggedInUser.id === r.user2Id) && (
                                <button
                                  onClick={() => handleRemoveRelationship(partnerId)}
                                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400"
                                  title="Dissolve Relationship"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Level Progress bar */}
                          <div className="bg-slate-950/50 p-2.5 rounded-lg border border-white/5">
                            <div className="flex items-center justify-between mb-1 text-[10px]">
                              <span className="font-bold text-pink-300">Relationship Level {r.level}</span>
                              <span className="font-mono text-gray-400">{r.points} / {r.pointsNextLevel} XP</span>
                            </div>
                            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                              <div className={`h-full bg-gradient-to-r ${themeGradient} rounded-full transition-all`} style={{ width: `${pct}%` }}></div>
                            </div>
                            <div className="flex justify-between items-center mt-2 text-[9px] text-gray-400">
                              <span>Streak: <strong className="text-yellow-400 font-mono">🔥 {r.streakDays || 0} Days</strong></span>
                              <span>Earn points by checking in or exchanging private messages!</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="bg-slate-900/30 border border-white/5 rounded-xl p-6 text-center flex flex-col items-center justify-center gap-2">
                      <Sparkles className="w-8 h-8 text-gray-600" />
                      <span className="text-xs text-gray-400 font-bold">No active relationships established.</span>
                      <p className="text-[10px] text-gray-500 max-w-xs">Send a relationship proposal under the requests tab once you meet the conditions.</p>
                    </div>
                  )}

                  {/* Daily Tasks Panel */}
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                    <span className="text-[10px] font-black uppercase text-pink-400 tracking-wider">Daily Tasks together</span>
                    <div className="flex flex-col gap-2">
                      {relationshipData?.dailyTasks?.map(task => (
                        <div key={task.id} className="bg-slate-900/40 p-2.5 rounded-lg border border-white/5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold block text-gray-200">{task.title}</span>
                            <span className="text-[9px] text-gray-400">Reward: <strong className="text-yellow-400 font-mono">+{task.pointsReward} XP</strong></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-gray-400">{task.progress} / {task.target}</span>
                            {task.completed ? (
                              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[8.5px] font-bold">Completed</span>
                            ) : (
                              <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-1.5 py-0.5 rounded text-[8.5px]">In Progress</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: REQUESTS MANAGEMENT */}
              {relActiveTab === "requests" && (
                <div className="flex-1 flex flex-col gap-4">
                  {/* Proposal Panel */}
                  {loggedInUser && loggedInUser.id !== liveProfile.id && (
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                      <div className="flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-pink-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-pink-400">Propose Category to {liveProfile.displayName}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {[
                          { type: "couple", label: "Couple ❤️", bg: "bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/30" },
                          { type: "homies", label: "Homies 🤝", bg: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30" },
                          { type: "best_friend", label: "Best Friend 💙", bg: "bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30" },
                          { type: "brother", label: "Brother 🛡️", bg: "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30" },
                          { type: "sister", label: "Sister 🌸", bg: "bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border-fuchsia-500/30" },
                          { type: "family", label: "Family 👨‍👩‍👧", bg: "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30" },
                          { type: "soulmate", label: "Soulmate 💖", bg: "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30" },
                        ].map(c => (
                          <button
                            key={c.type}
                            onClick={() => handleSendRequest(c.type as any)}
                            className={`p-2.5 rounded-lg border text-left flex flex-col gap-0.5 transition-all active:scale-95 ${c.bg}`}
                          >
                            <span className="font-black text-gray-200">{c.label}</span>
                            <span className="text-[8px] text-gray-400">Unlock requirements apply</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Unlock conditions list */}
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 flex flex-col gap-2">
                    <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Unlock Requirements Guide</span>
                    <div className="text-[10px] text-gray-300 flex flex-col gap-1.5">
                      <div className="flex justify-between">
                        <strong className="text-pink-400">Couple ❤️:</strong>
                        <span>Exchange 1,000 Private Messages, reach Friendship Level 5, and send each other gifts.</span>
                      </div>
                      <div className="flex justify-between border-t border-white/5 pt-1.5">
                        <strong className="text-blue-400">Homies 🤝:</strong>
                        <span>Exchange 500 Private Messages OR spend 10,000 Diamonds together.</span>
                      </div>
                      <div className="flex justify-between border-t border-white/5 pt-1.5">
                        <strong className="text-cyan-400">Best Friend 💙 / Brother 🛡️ / Sister 🌸:</strong>
                        <span>Friendship Level 2 & 100 Private Messages.</span>
                      </div>
                      <div className="flex justify-between border-t border-white/5 pt-1.5">
                        <strong className="text-emerald-400">Family 👨‍👩‍👧 / Soulmate 💖:</strong>
                        <span>Friendship Level 3/4 & 200/300 Private Messages.</span>
                      </div>
                    </div>
                  </div>

                  {/* Pending Incoming / Outgoing Requests List */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase text-pink-400 tracking-wider">Pending Proposals ({relationshipData?.requests?.length || 0})</span>
                    {relationshipData?.requests && relationshipData.requests.length > 0 ? (
                      relationshipData.requests.map((reqObj: any) => {
                        const isIncoming = reqObj.receiverId === loggedInUser?.id;
                        return (
                          <div key={reqObj.id} className="bg-slate-900/60 border border-white/10 p-3 rounded-xl flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <img src={isIncoming ? reqObj.senderAvatar : reqObj.receiverAvatar} className="w-8 h-8 rounded-full border border-white/10 object-cover" />
                              <div>
                                <span className="font-bold block text-gray-200">
                                  {isIncoming ? reqObj.senderName : reqObj.receiverName}
                                </span>
                                <span className="text-[9px] text-pink-400">
                                  {isIncoming ? "Wants to be your" : "Proposed to be your"} <strong className="uppercase font-extrabold">{reqObj.type}</strong>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {isIncoming ? (
                                <>
                                  <button
                                    onClick={() => handleRequestAction(reqObj.id, "accept")}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px]"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleRequestAction(reqObj.id, "reject")}
                                    className="px-2.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/20 font-bold text-[10px]"
                                  >
                                    Reject
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleRequestAction(reqObj.id, "cancel")}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 font-bold text-[10px]"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-[10px] text-gray-500 text-center py-2">No pending incoming or outgoing proposals.</span>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: RELATIONSHIP REWARDS & LEVELS */}
              {relActiveTab === "levels" && (
                <div className="flex-1 flex flex-col gap-4">
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 flex flex-col gap-2">
                    <span className="text-[11px] font-black uppercase text-pink-400 tracking-wider">Level Up Rewards Tracker</span>
                    <p className="text-[10px] text-gray-400">Unlock custom profile frames, luxury entrance badges, free coins and diamonds as you progress your relationship levels!</p>
                  </div>

                  <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[300px] pr-1">
                    {relationshipData?.levelConfigs?.map(conf => {
                      const rewardsForLevel = relationshipData?.rewards?.filter((r: any) => r.level === conf.level) || [];
                      const isUnlocking = (relationshipData?.active?.[0]?.level || 1) >= conf.level;

                      return (
                        <div key={conf.level} className={`border p-3 rounded-lg flex items-center justify-between text-xs ${
                          isUnlocking 
                            ? "bg-pink-950/10 border-pink-500/20 text-gray-200" 
                            : "bg-slate-900/40 border-white/5 text-gray-500"
                        }`}>
                          <div>
                            <span className="font-extrabold block text-gray-200">Level {conf.level}</span>
                            <span className="text-[9px] text-gray-400">Title reward: <strong className="text-pink-400">{conf.title}</strong></span>
                            {conf.rewards.map((r, i) => (
                              <span key={i} className="text-[9.5px] text-yellow-400 font-bold block">★ {r}</span>
                            ))}
                          </div>

                          <div className="flex flex-col items-end gap-1.5">
                            {isUnlocking ? (
                              rewardsForLevel.some(r => r.claimed) ? (
                                <span className="bg-gray-500/10 text-gray-500 px-2 py-1 rounded text-[9px] font-bold">Claimed</span>
                              ) : rewardsForLevel.length > 0 ? (
                                <button
                                  onClick={() => handleClaimReward(rewardsForLevel[0].id)}
                                  className="bg-pink-600 hover:bg-pink-500 active:scale-95 text-white font-bold px-3 py-1.5 rounded-lg text-[10px]"
                                >
                                  Claim
                                </button>
                              ) : (
                                <span className="text-[10px] text-emerald-400 font-bold">Unlocked</span>
                              )
                            ) : (
                              <span className="text-[10px] text-gray-600 flex items-center gap-1"><Lock className="w-3 h-3" /> Locked</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: RELATIONSHIP EVENT HISTORY */}
              {relActiveTab === "history" && (
                <div className="flex-1 flex flex-col gap-3">
                  <span className="text-[10px] font-black uppercase text-pink-400 tracking-wider">Relationship Event Logs</span>
                  <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
                    {relationshipData?.history && relationshipData.history.length > 0 ? (
                      relationshipData.history.map((hist: any) => (
                        <div key={hist.id} className="bg-slate-900/60 p-2.5 rounded-lg border border-white/5 text-xs">
                          <span className="font-bold text-gray-200 block">{hist.details}</span>
                          <span className="text-[8.5px] text-gray-500 font-mono block mt-1">
                            {new Date(hist.timestamp).toLocaleString()} • Category: {hist.type}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-[10px] text-gray-500 text-center py-4">No recent history events found.</span>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: ADMIN SYSTEM CONTROLS */}
              {relActiveTab === "admin" && (
                <div className="flex-1 flex flex-col gap-4">
                  <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-400" />
                    <div>
                      <span className="text-xs font-black block text-red-400">ADMIN CONTROL CENTER</span>
                      <p className="text-[9px] text-gray-400">Override and manage active relationships and requests globally.</p>
                    </div>
                  </div>

                  {/* Relationship list overrides */}
                  <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                    {relationshipData?.active && relationshipData.active.length > 0 ? (
                      relationshipData.active.map((r: any) => (
                        <div key={r.id} className="bg-slate-950/80 p-3 rounded-xl border border-white/5 flex flex-col gap-2">
                          <div className="flex justify-between items-center text-xs">
                            <div>
                              <span className="font-extrabold block text-gray-200">ID: {r.id}</span>
                              <span className="text-[10px] text-gray-400">{r.user1Name} & {r.user2Name} ({r.type})</span>
                              <span className="text-[10px] text-pink-400 block font-bold">Level {r.level} • {r.points} XP</span>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleAdminAction(r.id, "reset_level")}
                                className="px-2 py-1 rounded bg-yellow-500 text-slate-950 font-bold text-[9px]"
                              >
                                Reset Lvl
                              </button>
                              <button
                                onClick={() => handleAdminAction(r.id, "dissolve")}
                                className="px-2 py-1 rounded bg-red-600 text-white font-bold text-[9px]"
                              >
                                Dissolve
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-[10px] text-gray-500 text-center">No relationships to override.</span>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}

    </div>
  );
}
