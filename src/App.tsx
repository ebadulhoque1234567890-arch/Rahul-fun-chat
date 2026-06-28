/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import DesktopDashboard from "./components/DesktopDashboard.js";
import EmulatorFrame from "./components/EmulatorFrame.js";
import GiftAnimationLayer from "./components/GiftAnimationLayer.js";
import { locales } from "./locales.js";
import { UserProfile, GiftFlyover, Gender, VipLevel } from "./types.js";
import { AlertCircle, Terminal, HelpCircle, Sparkles } from "lucide-react";
import { auth, db, doc, getDoc, setDoc } from "./lib/firebase.js";
import { onAuthStateChanged } from "firebase/auth";

export default function App() {
  // Global localization selection
  const [lang, setLang] = useState<string>("en");
  const strings = locales[lang] || locales.en;

  // Connected profile state
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem("ebadul_chat_logged_in_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loadingAuth, setLoadingAuth] = useState<boolean>(() => {
    try {
      return !localStorage.getItem("ebadul_chat_logged_in_user");
    } catch {
      return true;
    }
  });

  // Custom setter that syncs with localStorage for direct load persistence
  const handleSetUser = (u: UserProfile | null) => {
    setUser(u);
    try {
      if (u) {
        localStorage.setItem("ebadul_chat_logged_in_user", JSON.stringify(u));
      } else {
        localStorage.removeItem("ebadul_chat_logged_in_user");
      }
    } catch (e) {
      console.error("Failed to save user session to localStorage:", e);
    }
  };

  // Active flyover gifts animations array
  const [activeGifts, setActiveGifts] = useState<GiftFlyover[]>([]);

  // Console metrics logs
  const [devLogs, setDevLogs] = useState<string[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    addDevLog("EbadulChat Fun sandbox initialization complete.");
    addDevLog("Server-side Gemini Moderation shield running.");
    addDevLog("WebRTC / Zego audio mock pipeline ready.");

    // Refresh existing localStorage user on boot
    const syncSavedUser = async () => {
      try {
        const saved = localStorage.getItem("ebadul_chat_logged_in_user");
        if (saved) {
          const parsed = JSON.parse(saved);
          const res = await fetch(`/api/users/${parsed.id}?requestingUserId=${parsed.id}`);
          if (res.ok) {
            const freshProfile = await res.json();
            // Sync with express backend
            const loginRes = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(freshProfile),
            });
            const loginData = await loginRes.json();
            if (loginData.success) {
              handleSetUser(loginData.profile);
              addDevLog(`Persistent profile synchronized: ${loginData.profile.displayName}`);
            }
          }
        }
      } catch (err) {
        console.error("Failed to sync localStorage user:", err);
      }
    };
    syncSavedUser();

    // Restore persistent session via Firebase Authentication
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      if (fUser) {
        addDevLog(`Persistent session detected: ${fUser.displayName || fUser.email || fUser.phoneNumber || fUser.uid}`);
        try {
          // Look up existing user in Firestore
          const userRef = doc(db, "users", fUser.uid);
          const userSnap = await getDoc(userRef);

          let profileData: UserProfile;
          if (userSnap.exists()) {
            profileData = userSnap.data() as UserProfile;
          } else {
            // Fallback profile creation if Firestore record didn't exist yet
            const emailPrefix = fUser.email ? fUser.email.split("@")[0] : `user_${fUser.uid.slice(0, 5)}`;
            profileData = {
              id: fUser.uid,
              username: emailPrefix,
              displayName: fUser.displayName || `User ${fUser.uid.slice(0, 5)}`,
              avatarUrl: fUser.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
              coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
              bio: "Verified EbadulChat user!",
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
              badges: ["auth_saved"],
              createdAt: new Date().toISOString(),
              email: fUser.email || undefined,
            };
            await setDoc(userRef, profileData);
          }

          // Force Ebadul Super Creator credentials if login matches their email
          if (fUser.email === "ebadulhoque1234567890@gmail.com" || profileData.email === "ebadulhoque1234567890@gmail.com") {
            profileData.isGlobalAdmin = true;
            profileData.level = 95;
            profileData.vipLevel = VipLevel.EMPEROR;
            profileData.isVerified = true;
            if (!profileData.badges) profileData.badges = [];
            if (!profileData.badges.includes("god_admin")) profileData.badges.push("god_admin");
            if (!profileData.badges.includes("vip_95")) profileData.badges.push("vip_95");
            if (!profileData.badges.includes("creator")) profileData.badges.push("creator");
          }

          // Register or sync session with server Map
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(profileData),
          });
          const data = await res.json();
          if (data.success) {
            handleSetUser(data.profile);
            addDevLog(`Profile successfully synchronized: ${data.profile.displayName}`);
          } else {
            handleSetUser(profileData);
            addDevLog(`Loaded profile offline: ${profileData.displayName}`);
          }
        } catch (err: any) {
          console.error("Session restoration failed:", err);
          addDevLog(`Session load failed: ${err.message || err}`);
        }
      } else {
        // Only clear if we don't have a valid localStorage user
        if (!localStorage.getItem("ebadul_chat_logged_in_user")) {
          setUser(null);
          addDevLog("No active session found. Redirecting to login screen.");
        }
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const addDevLog = (str: string) => {
    const time = new Date().toLocaleTimeString();
    setDevLogs(prev => [`[${time}] ${str}`, ...prev].slice(0, 50));
  };

  const triggerGlobalError = (msg: string) => {
    setGlobalError(msg);
    addDevLog(`Warn: ${msg}`);
    
    // Auto clear error in 5 seconds
    setTimeout(() => {
      setGlobalError(null);
    }, 5000);
  };

  // Callback when phone emulator triggers gift flyover
  const handleBroadcastGift = (gift: GiftFlyover) => {
    setActiveGifts(prev => [...prev, gift]);
    addDevLog(`Gift Sent: ${gift.senderName} gifted ${gift.giftName} to ${gift.receiverName} (${gift.cost} coins)`);
  };

  const handleFinishAnimation = (id: string) => {
    setActiveGifts(prev => prev.filter(g => g.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 flex flex-col justify-between font-sans selection:bg-purple-600/30">
      
      {/* GLOBAL TOAST BANNER */}
      {globalError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-950 border-2 border-red-500/40 text-red-100 px-5 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2.5 max-w-sm animate-scale-up">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 animate-pulse" />
          <p className="text-xs font-black tracking-wide leading-snug">{globalError}</p>
        </div>
      )}

      {/* BACKGROUND DECORATIONS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-30%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-900/15 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-pink-950/15 blur-[120px]"></div>
      </div>

      {/* FLYOVER ANIMATION CANVAS OVERLAY */}
      <GiftAnimationLayer 
        activeGifts={activeGifts} 
        onFinishAnimation={handleFinishAnimation} 
      />

      {/* MAIN LAYOUT */}
      <div className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-0 lg:p-6 flex flex-col lg:flex-row gap-6 items-stretch justify-center">
        
        {/* LEFT COMPONENT: ADMIN DASBOARD & LEADERBOARDS */}
        <div className="hidden lg:flex flex-1 flex-col items-stretch">
          <DesktopDashboard 
            strings={strings}
            user={user}
            lang={lang}
            onSelectLang={setLang}
            logsCount={devLogs.length}
          />
        </div>

        {/* RIGHT COMPONENT: INTERACTIVE ANDROID EMULATOR */}
        <div className="w-full lg:w-auto flex flex-col items-center justify-center">
          <div className="mb-2 text-center select-none hidden lg:block">
            <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              Live Android Client Simulation
            </span>
          </div>

          <EmulatorFrame 
            strings={strings}
            user={user}
            onSetUser={handleSetUser}
            lang={lang}
            onBroadcastGift={handleBroadcastGift}
            logsCount={devLogs.length}
            triggerGlobalError={triggerGlobalError}
            loadingAuth={loadingAuth}
          />
        </div>
      </div>

      {/* DEV CONSOLE DRAWER BOTTOM */}
      <div className="hidden lg:flex relative z-10 bg-slate-900 border-t border-slate-800 p-4 max-w-7xl w-full mx-auto rounded-t-3xl shadow-2xl flex flex-col md:flex-row gap-4 items-stretch overflow-hidden">
        <div className="md:w-1/3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-yellow-300 font-extrabold text-sm uppercase tracking-wider mb-2">
              <Terminal className="w-4 h-4" />
              <span>Sandbox Console logs</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-normal">
              Track the state transitions of user levels, diamond wallets, and PK battles as they sync through the express backend server pipeline.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-400 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
            <span>Built by EbadulChat and Gemini AI APIs</span>
          </div>
        </div>

        {/* Terminal logs list */}
        <div className="flex-1 bg-slate-950 p-3 rounded-2xl border border-slate-800/80 font-mono text-[10px] text-purple-300/80 max-h-[110px] overflow-y-auto leading-normal min-h-[90px]">
          {devLogs.length === 0 ? (
            <span className="text-gray-600">Initializing simulator streams...</span>
          ) : (
            devLogs.map((log, index) => (
              <div key={index} className="truncate border-b border-white/5 pb-1 mb-1 last:border-0 last:mb-0 last:pb-0">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
