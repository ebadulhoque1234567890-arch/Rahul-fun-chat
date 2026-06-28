/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { LocaleStrings } from "../locales.js";
import { 
  UserProfile, 
  ChatRoom, 
  LeaderboardEntry, 
  FamilyLeaderboardEntry, 
  TransactionRecord, 
  GiftItem,
  VipLevel,
  Gender,
  RoomCategory
} from "../types.js";
import { 
  BarChart3, 
  Plus, 
  Tv, 
  Trophy, 
  Coins, 
  Sparkles, 
  Activity, 
  Lock, 
  BookOpen, 
  CheckCircle, 
  Trash2, 
  Clock, 
  Smile, 
  Languages, 
  Cpu, 
  ShieldCheck 
} from "lucide-react";

interface DesktopDashboardProps {
  strings: LocaleStrings;
  user: UserProfile | null;
  lang: string;
  onSelectLang: (lang: string) => void;
  logsCount: number;
}

export default function DesktopDashboard({ strings, user, lang, onSelectLang, logsCount }: DesktopDashboardProps) {
  // Tabs: 'analytics' | 'catalog' | 'leaderboards' | 'transactions' | 'admin'
  const [activeTab, setActiveTab] = useState<string>("analytics");

  // Leaderboard data states
  const [leaderboardData, setLeaderboardData] = useState<{
    gifters: LeaderboardEntry[];
    earners: LeaderboardEntry[];
    families: FamilyLeaderboardEntry[];
  }>({ gifters: [], earners: [], families: [] });

  // Creation params for rooms
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomCategory, setNewRoomCategory] = useState<RoomCategory>(RoomCategory.PUBLIC);
  const [newRoomLayout, setNewRoomLayout] = useState<8 | 12>(8);
  const [newRoomBg, setNewRoomBg] = useState("");

  // System status metrics
  const [systemUptime, setSystemUptime] = useState("00:00:00");
  const [systemAlert, setSystemAlert] = useState<string | null>(null);

  // Gemini console states
  const [geminiQuery, setGeminiQuery] = useState("");
  const [geminiAction, setGeminiAction] = useState("moderate");
  const [geminiOutput, setGeminiOutput] = useState("");
  const [geminiLoading, setGeminiLoading] = useState(false);

  // Administrative listing states
  const [adminUsers, setAdminUsers] = useState<UserProfile[]>([]);
  const [adminRooms, setAdminRooms] = useState<ChatRoom[]>([]);
  const [historyLogs, setHistoryLogs] = useState<TransactionRecord[]>([]);
  const [giftCatalog, setGiftCatalog] = useState<GiftItem[]>([]);

  useEffect(() => {
    fetchLeaderboards();
    fetchSystemDetails();
    fetchCatalog();
  }, [user?.id, activeTab]);

  useEffect(() => {
    // Dynamic uptime count ticker
    const start = Date.now();
    const interval = setInterval(() => {
      const diff = Date.now() - start;
      const hours = Math.floor(diff / 3600000).toString().padStart(2, "0");
      const mins = Math.floor((diff % 3600000) / 60000).toString().padStart(2, "0");
      const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, "0");
      setSystemUptime(`${hours}:${mins}:${secs}`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboards = async () => {
    try {
      const res = await fetch("/api/leaderboards");
      if (res.ok) setLeaderboardData(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCatalog = async () => {
    try {
      const res = await fetch("/api/gifts/catalog");
      if (res.ok) setGiftCatalog(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSystemDetails = async () => {
    try {
      const roomsRes = await fetch("/api/rooms");
      if (roomsRes.ok) setAdminRooms(await roomsRes.json());

      // Simulating user profiles pulling for analytics with security query param
      const userRes1 = await fetch(`/api/users/ebadul?requestingUserId=${user?.id || ""}`);
      if (userRes1.ok) {
        const uEbadul = await userRes1.json();
        setAdminUsers([uEbadul]);
      }

      if (user) {
        const txnRes = await fetch(`/api/wallet/transactions/${user.id}?requestingUserId=${user.id}`);
        if (txnRes.ok) setHistoryLogs(await txnRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create room web portal
  const handleCreateRoomWeb = async () => {
    if (!user) {
      setSystemAlert("Error: Please log in using the mobile phone simulation on the right first!");
      return;
    }
    if (!newRoomName.trim()) {
      setSystemAlert("Error: Room name cannot be empty.");
      return;
    }

    try {
      const res = await fetch("/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoomName.trim(),
          description: "Created via EbadulChat Web Portal console.",
          ownerId: user.id,
          category: newRoomCategory,
          layout: newRoomLayout,
          backgroundUrl: newRoomBg || undefined
        })
      });

      if (res.ok) {
        setNewRoomName("");
        setNewRoomBg("");
        setSystemAlert("Success: Voice chat room officially established in server directories!");
        fetchSystemDetails();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Test server-side Gemini Moderator
  const handleTestGeminiModeration = async () => {
    if (!geminiQuery.trim()) return;
    setGeminiLoading(true);
    setGeminiOutput("");

    try {
      const res = await fetch("/api/gemini/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: geminiQuery.trim(),
          action: geminiAction
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGeminiOutput(data.result || data.warning || "Check cleared!");
      } else {
        setGeminiOutput("AI Server check returned a null output. Is Gemini key configured?");
      }
    } catch (err: any) {
      setGeminiOutput(`Err: ${err.message}`);
    } finally {
      setGeminiLoading(false);
    }
  };

  return (
    <div className="flex-1 min-w-0 bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 flex flex-col justify-between shadow-2xl">
      
      {/* HEADER SECTION WITH BRANDING */}
      <div>
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl animate-bounce">🦁</span>
              <h1 className="text-2xl font-black text-white tracking-widest uppercase">
                {strings.title} <span className="text-rose-500 text-xs lowercase font-mono">web dashboard</span>
              </h1>
            </div>
            <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-wider">{strings.subtitle}</p>
          </div>

          {/* Localization language dropdown selection */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            <Languages className="w-4 h-4 text-purple-400" />
            <select
              value={lang}
              onChange={(e) => onSelectLang(e.target.value)}
              className="bg-transparent text-gray-200 text-xs font-bold focus:outline-none"
            >
              <option value="en">English (US)</option>
              <option value="bn">বাংলা (Bengali)</option>
              <option value="ar">العربية (Arabic)</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
          </div>
        </div>

        {/* Global stats bar metrics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between shadow-md">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Engine Uptime</span>
              <div className="text-sm font-black text-yellow-400 font-mono mt-1">{systemUptime}</div>
            </div>
            <Clock className="w-7 h-7 text-yellow-500/30" />
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between shadow-md">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Sound Rooms</span>
              <div className="text-sm font-black text-rose-500 font-mono mt-1">{adminRooms.length} Active</div>
            </div>
            <Tv className="w-7 h-7 text-rose-500/30" />
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between shadow-md">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Gemini Shield</span>
              <div className="text-sm font-black text-emerald-400 font-mono mt-1">ACTIVE</div>
            </div>
            <ShieldCheck className="w-7 h-7 text-emerald-500/30" />
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between shadow-md">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Gift Store Vault</span>
              <div className="text-sm font-black text-fuchsia-400 font-mono mt-1">{giftCatalog.length} Items</div>
            </div>
            <Coins className="w-7 h-7 text-fuchsia-500/30" />
          </div>
        </div>

        {/* TABS CONTROLLER */}
        <div className="flex border-b border-slate-800 pb-2 mb-5 gap-1">
          {["analytics", "leaderboards", "catalog", "transactions", "admin"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                activeTab === tab 
                  ? "bg-purple-900 text-white shadow-lg border border-purple-500/50" 
                  : "text-gray-400 hover:text-gray-200 hover:bg-slate-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Alert Notifications center */}
        {systemAlert && (
          <div className="mb-4 p-3 rounded-xl bg-purple-900/40 text-purple-200 border border-purple-500/30 text-xs font-semibold flex items-center justify-between animate-scale-up">
            <span>{systemAlert}</span>
            <button onClick={() => setSystemAlert(null)} className="text-purple-300 hover:text-white">✕</button>
          </div>
        )}

        {/* TAB CONTROLLERS */}

        {/* TAB 1: ANALYTICS & ROOM CREATION */}
        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Create Room box */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1">
                <Plus className="w-4 h-4 text-rose-500" />
                Establish Voice Chat Room
              </h3>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Room Title Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Bangladesh Royal Singing Lounge"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Category</label>
                    <select
                      value={newRoomCategory}
                      onChange={(e) => setNewRoomCategory(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
                    >
                      <option value={RoomCategory.PUBLIC}>Public</option>
                      <option value={RoomCategory.PRIVATE}>Private</option>
                      <option value={RoomCategory.PK}>PK Battle Room</option>
                      <option value={RoomCategory.MUSIC}>Music Live</option>
                      <option value={RoomCategory.GAMING}>Gaming Arena</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Seats Count</label>
                    <select
                      value={newRoomLayout}
                      onChange={(e) => setNewRoomLayout(Number(e.target.value) as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
                    >
                      <option value={8}>8 Seats</option>
                      <option value={12}>12 Seats</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Wallpaper URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={newRoomBg}
                    onChange={(e) => setNewRoomBg(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleCreateRoomWeb}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-800 to-indigo-800 text-white text-xs font-black rounded-xl shadow-lg hover:from-purple-700 hover:to-indigo-700 transition"
                >
                  🎯 CONFIGURE & OPEN ROOM
                </button>
              </div>
            </div>

            {/* Quick tips & info card */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  EbadulChat Fun Guidelines
                </h3>
                <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
                  This system integrates a fully functioning in-memory server database replicating real-time updates of voice locks, mic states, and pk battles.
                </p>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-[10px] font-mono text-purple-300">
                  - <strong>Real Estate Mode</strong>: Simulated mic signals bounce. <br />
                  - <strong>Gifting Sync</strong>: Sender coins degrade, receiver diamond logs surge. <br />
                  - <strong>Referees</strong>: PK Battle timers count down in synchronization chunks.
                </div>
              </div>

              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl mt-4 flex items-center gap-2">
                <span className="text-lg">🎡</span>
                <span className="text-[10px] text-yellow-300 font-semibold leading-normal">
                  Hot Tip: Use the Lucky Spin on the phone emulator to earn coins sandbox rewards and level up your speaker card!
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EXQUISITE LEADERBOARDS (GIFTERS, EARNERS, FAMILIES) */}
        {activeTab === "leaderboards" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Top Gifters List */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
              <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <Trophy className="w-4 h-4" /> Top Elite Gifters
              </h3>
              
              <div className="flex flex-col gap-2 max-h-[190px] overflow-y-auto pr-1">
                {leaderboardData.gifters.map(u => (
                  <div key={u.userId} className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-gray-500 w-3">#{u.rank}</span>
                      <img src={u.avatarUrl} alt="Gifter avatar" className="w-6 h-6 rounded-full object-cover" />
                      <span className="text-[10px] font-bold text-white truncate max-w-[100px]">{u.displayName}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-yellow-400">{u.value} C</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Diamond Earners */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
              <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <Sparkles className="w-4 h-4" /> Top Performers (Earners)
              </h3>

              <div className="flex flex-col gap-2 max-h-[190px] overflow-y-auto pr-1">
                {leaderboardData.earners.map(u => (
                  <div key={u.userId} className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-gray-500 w-3">#{u.rank}</span>
                      <img src={u.avatarUrl} alt="Earner avatar" className="w-6 h-6 rounded-full object-cover" />
                      <span className="text-[10px] font-bold text-white truncate max-w-[100px]">{u.displayName}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-cyan-400">{u.value} 💎</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Families */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
              <h3 className="text-xs font-black text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <Activity className="w-4 h-4" /> Top Family Stars
              </h3>

              <div className="flex flex-col gap-2 max-h-[190px] overflow-y-auto pr-1">
                {leaderboardData.families.map(f => (
                  <div key={f.familyId} className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-gray-500 w-3">#{f.rank}</span>
                      <span className="text-lg">{f.logoUrl}</span>
                      <span className="text-[10px] font-bold text-white truncate max-w-[100px]">{f.familyName}</span>
                    </div>
                    <span className="text-[9px] font-mono font-semibold text-purple-400">LVL {f.level}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: GIFT STORE CATALOG */}
        {activeTab === "catalog" && (
          <div>
            <h3 className="text-xs font-bold text-white uppercase mb-3 text-center tracking-widest">
              Available Gifts & Interactive Animation Presets
            </h3>
            
            <div className="grid grid-cols-5 gap-3 max-h-[220px] overflow-y-auto pr-1">
              {giftCatalog.map(g => (
                <div key={g.id} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-between text-center relative group">
                  <span className="text-3xl filter drop-shadow-md group-hover:scale-125 transition-all">{g.imageUrl}</span>
                  <h4 className="text-[10px] text-gray-200 font-bold mt-1.5">{g.name}</h4>
                  <span className="text-[9px] font-mono font-extrabold text-yellow-400">{g.cost} gold</span>

                  <span className="absolute top-1 right-1 px-1 bg-purple-950 text-purple-300 text-[6.5px] rounded-xs font-bold uppercase font-mono">
                    {g.animationType}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: TRANSACTION RECORDS HISTORY */}
        {activeTab === "transactions" && (
          <div>
            <h3 className="text-xs font-bold text-white uppercase mb-3 tracking-widest flex items-center gap-1">
              <Clock className="w-4 h-4 text-purple-400" /> Wallet Balance Sheets
            </h3>

            <div className="flex flex-col gap-2 max-h-[210px] overflow-y-auto pr-1.5">
              {historyLogs.length === 0 ? (
                <p className="text-[10px] text-gray-500 italic text-center p-4">No financial audits recorded. Trigger payments inside the phone emulator first.</p>
              ) : (
                historyLogs.map(log => (
                  <div key={log.id} className="p-2 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-bold text-white">{log.description}</span>
                      <p className="text-[8.5px] text-gray-500 font-mono mt-0.5">{new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                    
                    <div className="text-right">
                      {log.amountCoins !== 0 && (
                        <span className={`font-mono font-bold mr-2 ${log.amountCoins > 0 ? "text-emerald-400" : "text-rose-500"}`}>
                          {log.amountCoins > 0 ? "+" : ""}{log.amountCoins} Coins
                        </span>
                      )}
                      {log.amountDiamonds !== 0 && (
                        <span className={`font-mono font-bold ${log.amountDiamonds > 0 ? "text-cyan-400" : "text-rose-400"}`}>
                          {log.amountDiamonds > 0 ? "+" : ""}{log.amountDiamonds} 💎
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: CENTRAL MODERATION PANEL & GEMINI CHECKER */}
        {activeTab === "admin" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* AI Moderator console */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <h4 className="text-[11px] font-black text-rose-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-3 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-400" /> Gemini AI Host Console
              </h4>

              <div className="flex flex-col gap-2.5">
                <textarea
                  placeholder="Enter message to test review..."
                  value={geminiQuery}
                  onChange={(e) => setGeminiQuery(e.target.value)}
                  rows={2}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400/55"
                />

                <div className="flex items-center gap-2 justify-between">
                  {/* Mode select */}
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setGeminiAction("moderate")}
                      className={`px-2 py-1 rounded text-[9px] font-bold ${geminiAction === "moderate" ? "bg-emerald-600 text-white" : "bg-slate-950 text-gray-400"}`}
                    >
                      Check Safety
                    </button>
                    <button
                      onClick={() => setGeminiAction("translate")}
                      className={`px-2 py-1 rounded text-[9px] font-bold ${geminiAction === "translate" ? "bg-emerald-600 text-white" : "bg-slate-950 text-gray-400"}`}
                    >
                      Translate
                    </button>
                  </div>

                  <button
                    onClick={handleTestGeminiModeration}
                    disabled={geminiLoading}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-45 text-slate-950 font-black px-3 py-1 rounded-lg text-[10px]"
                  >
                    {geminiLoading ? "Verifying..." : "RUN AI SHIELD"}
                  </button>
                </div>

                {/* Response console log */}
                {geminiOutput && (
                  <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-2 font-mono text-[9.5px] text-emerald-400 max-h-[80px] overflow-y-auto leading-normal">
                    {geminiOutput}
                  </div>
                )}
              </div>
            </div>

            {/* Room blacklist management in Dashboard */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between">
              <div>
                <h4 className="text-[11px] font-black text-rose-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-2">
                  Dispatcher Room Controls
                </h4>
                <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto">
                  {adminRooms.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded-lg text-[10px]">
                      <span className="font-bold text-gray-200 truncate max-w-[130px]">{r.name}</span>
                      <span className="bg-rose-500/25 border border-rose-500/30 text-rose-400 px-1.5 py-0.2 rounded font-bold">
                        SEAT {r.seatLayout}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[9px] text-gray-500 mt-2 text-center italic">
                EbadulChat Dispatchers are bound directly.
              </div>
            </div>

          </div>
        )}

      </div>

      {/* FOOTER DEVELOPMENT CREATIVITY DETAILS */}
      <div className="border-t border-slate-800/80 pt-3 mt-4 text-center">
        <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
          EbadulChat Fun v1.2 Sandbox Environment • AI Studio Workspace
        </span>
      </div>

    </div>
  );
}
