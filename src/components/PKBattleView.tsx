/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { PKBattle } from "../types.js";
import { Trophy } from "lucide-react";

interface PKBattleViewProps {
  battle: PKBattle;
  onSendQuickGift: (targetUserId: string, giftId: string) => void;
  currentUserId: string;
  onOpenGiftStore?: (targetUserId: string) => void;
  isRoomOwner?: boolean;
  onEndEarly?: () => void;
}

export default function PKBattleView({
  battle,
  onSendQuickGift,
  currentUserId,
  onOpenGiftStore,
  isRoomOwner,
  onEndEarly
}: PKBattleViewProps) {
  const total = battle.leftScore + battle.rightScore;
  const leftPct = total > 0 ? Math.round((battle.leftScore / total) * 100) : 50;
  const rightPct = 100 - leftPct;

  // Format countdown mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" + s : s}`;
  };

  return (
    <div className="w-full bg-gradient-to-b from-slate-900 via-rose-950/20 to-slate-900 rounded-xl p-3 border border-pink-500/20 shadow-[0_4px_20px_rgba(236,72,153,0.15)] relative">
      {/* Header Countdown & Control */}
      <div className="flex items-center justify-between mb-2.5 px-1 flex-wrap gap-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
          <span className="text-[10px] text-pink-400 font-black uppercase tracking-wider font-mono">
            PK Arena Live (15m)
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Countdown timer */}
          <div className="bg-rose-650 border border-rose-500/30 text-white font-mono text-xs px-3 py-0.5 rounded-full font-black shadow-md animate-pulse">
            {battle.status === "active" ? formatTime(battle.timeLeftSeconds) : "ENDED"}
          </div>

          {/* End early option for room owner */}
          {isRoomOwner && battle.status === "active" && onEndEarly && (
            <button
              onClick={onEndEarly}
              className="px-2.5 py-0.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-550 text-white text-[9px] font-black rounded-full uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-95"
              title="Declare early winner"
            >
              🏁 Stop PK
            </button>
          )}
        </div>

        <div className="text-[9px] text-yellow-500 font-extrabold uppercase tracking-wider font-mono">
          🏆 Referee Ebadul
        </div>
      </div>

      {/* Blue vs Red Progress Bar */}
      <div className="relative w-full h-5 bg-slate-950 rounded-full overflow-hidden flex shadow-inner border border-slate-800">
        <div 
          className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 transition-all duration-500 ease-out flex items-center pl-3 font-mono text-[10px] font-bold text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]"
          style={{ width: `${leftPct}%` }}
        >
          {leftPct > 15 && `${battle.leftScore}`}
        </div>
        
        {/* VS badge center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-400 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-md italic shadow-md border border-yellow-300 z-10">
          VS
        </div>

        <div 
          className="h-full bg-gradient-to-r from-rose-500 to-pink-600 transition-all duration-500 ease-out flex items-center justify-end pr-3 font-mono text-[10px] font-bold text-white shadow-[0_0_10px_rgba(244,63,94,0.5)]"
          style={{ width: `${rightPct}%` }}
        >
          {rightPct > 15 && `${battle.rightScore}`}
        </div>
      </div>

      {/* Dual Avatars Grid */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        {/* Left Competitor (Blue Arena) */}
        <div className="flex flex-col items-center p-2 rounded-xl bg-blue-950/20 border border-blue-500/10">
          <div className="relative">
            <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-cyan-400 to-blue-500 shadow-lg animate-pulse">
              <img 
                src={battle.leftAvatar} 
                alt={battle.leftUsername}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            {/* Team Label */}
            <span className="absolute -bottom-1 -right-1 bg-cyan-500 text-white text-[8px] font-black px-1 rounded uppercase font-mono shadow-sm">
              BLUE
            </span>
          </div>
          <span className="text-[11px] text-gray-200 font-bold mt-1.5 truncate w-full text-center">
            {battle.leftUsername}
          </span>
          <span className="text-[10px] text-cyan-400 font-black font-mono">
            {battle.leftScore} PTS
          </span>

          {/* Quick Support / Store Triggers */}
          {battle.status === "active" && (
            <div className="flex flex-col gap-1 w-full mt-2">
              <button
                onClick={() => onSendQuickGift(battle.leftUserId, "g1")}
                className="px-2 py-0.5 bg-gradient-to-r from-cyan-650 to-blue-650 hover:from-cyan-550 hover:to-blue-550 text-white rounded-full text-[8.5px] font-black shadow-md active:scale-95 transition-all text-center flex items-center justify-center gap-0.5 cursor-pointer"
              >
                🌹 Send Rose (1)
              </button>
              {onOpenGiftStore && (
                <button
                  onClick={() => onOpenGiftStore(battle.leftUserId)}
                  className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/25 rounded-full text-[8.5px] font-bold shadow-sm active:scale-95 transition-all text-center flex items-center justify-center gap-0.5 cursor-pointer"
                >
                  🎁 Gift Store
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Competitor (Red Arena) */}
        <div className="flex flex-col items-center p-2 rounded-xl bg-rose-950/20 border border-rose-500/10">
          <div className="relative">
            <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-rose-400 to-pink-500 shadow-lg">
              <img 
                src={battle.rightAvatar} 
                alt={battle.rightUsername}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 bg-rose-500 text-white text-[8px] font-black px-1 rounded uppercase font-mono shadow-sm">
              RED
            </span>
          </div>
          <span className="text-[11px] text-gray-200 font-bold mt-1.5 truncate w-full text-center">
            {battle.rightUsername}
          </span>
          <span className="text-[10px] text-rose-400 font-black font-mono">
            {battle.rightScore} PTS
          </span>

          {/* Quick Support / Store Triggers */}
          {battle.status === "active" && (
            <div className="flex flex-col gap-1 w-full mt-2">
              <button
                onClick={() => onSendQuickGift(battle.rightUserId, "g1")}
                className="px-2 py-0.5 bg-gradient-to-r from-rose-650 to-pink-650 hover:from-rose-550 hover:to-pink-550 text-white rounded-full text-[8.5px] font-black shadow-md active:scale-95 transition-all text-center flex items-center justify-center gap-0.5 cursor-pointer"
              >
                🌹 Send Rose (1)
              </button>
              {onOpenGiftStore && (
                <button
                  onClick={() => onOpenGiftStore(battle.rightUserId)}
                  className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-500/25 rounded-full text-[8.5px] font-bold shadow-sm active:scale-95 transition-all text-center flex items-center justify-center gap-0.5 cursor-pointer"
                >
                  🎁 Gift Store
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Winner Splash Overlay (if ended) */}
      {battle.status === "ended" && (
        <div className="mt-2.5 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-center gap-2 animate-scale-up">
          <Trophy className="text-yellow-400 w-4 h-4 animate-bounce shrink-0" />
          <span className="text-[11px] text-yellow-300 font-black tracking-wide">
            WINNER: {battle.winnerUserId ? (battle.winnerUserId === battle.leftUserId ? battle.leftUsername : battle.rightUsername) : "Draw Duel!"}
          </span>
        </div>
      )}
    </div>
  );
}
