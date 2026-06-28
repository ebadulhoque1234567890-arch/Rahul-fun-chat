/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { GiftFlyover } from "../types.js";

interface GiftAnimationLayerProps {
  activeGifts: GiftFlyover[];
  onFinishAnimation: (id: string) => void;
}

export default function GiftAnimationLayer({ activeGifts, onFinishAnimation }: GiftAnimationLayerProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {activeGifts.map((gift) => (
        <SingleGiftAnimation
          key={gift.id}
          gift={gift}
          onComplete={() => onFinishAnimation(gift.id)}
        />
      ))}
    </div>
  );
}

interface SingleGiftProps {
  key?: string | number;
  gift: GiftFlyover;
  onComplete: () => void;
}

function SingleGiftAnimation({ gift, onComplete }: SingleGiftProps) {
  const [phase, setPhase] = useState<"flying" | "exploding" | "luxury" | "full_screen" | "done">("flying");
  const [coords, setCoords] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  useEffect(() => {
    // Play majestic VIP trumpet fanfare/chime for high-premium/luxury gifts
    if (gift.animationType === "luxury" || gift.animationType === "full_screen" || gift.cost >= 500) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          const nameLower = (gift.giftName || "").toLowerCase();
          
          if (nameLower.includes("roadster") || nameLower.includes("sports car") || nameLower.includes("car")) {
            // === 1. VIP ROADSTER / SPORTS CAR SOUND ENGINE ===
            // Simulate sports car revving engine zoom!
            const osc1 = audioCtx.createOscillator();
            const gain1 = audioCtx.createGain();
            osc1.type = "sawtooth";
            osc1.connect(gain1);
            gain1.connect(audioCtx.destination);
            
            // Engine RPM sweep
            osc1.frequency.setValueAtTime(80, audioCtx.currentTime);
            osc1.frequency.exponentialRampToValueAtTime(380, audioCtx.currentTime + 0.6);
            osc1.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.8);
            osc1.frequency.exponentialRampToValueAtTime(750, audioCtx.currentTime + 1.8);
            
            gain1.gain.setValueAtTime(0.01, audioCtx.currentTime);
            gain1.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.3);
            gain1.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 0.8);
            gain1.gain.linearRampToValueAtTime(0.09, audioCtx.currentTime + 1.5);
            gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.2);
            
            // Sub frequency rumble
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.type = "triangle";
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.frequency.setValueAtTime(40, audioCtx.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 1.8);
            gain2.gain.setValueAtTime(0.04, audioCtx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.2);
            
            osc1.start(audioCtx.currentTime);
            osc1.stop(audioCtx.currentTime + 2.3);
            osc2.start(audioCtx.currentTime);
            osc2.stop(audioCtx.currentTime + 2.3);
            
          } else if (nameLower.includes("raja") || nameLower.includes("king") || nameLower.includes("crown")) {
            // === 2. RAJA KING DELUXE / CROWN FANFARE ===
            // Majestic, fast-tempo royal double trumpet brass
            const notes = [
              { f: 261.63, d: 0.15 }, // C4
              { f: 329.63, d: 0.15 }, // E4
              { f: 392.00, d: 0.15 }, // G4
              { f: 523.25, d: 0.25 }, // C5
              { f: 659.25, d: 0.25 }, // E5
              { f: 783.99, d: 0.60 }  // G5 (Majestic peak!)
            ];
            notes.forEach((note, idx) => {
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.type = "sawtooth";
              osc.frequency.setValueAtTime(note.f, audioCtx.currentTime + idx * 0.16);
              gain.gain.setValueAtTime(0.07, audioCtx.currentTime + idx * 0.16);
              gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.16 + note.d);
              
              osc.start(audioCtx.currentTime + idx * 0.16);
              osc.stop(audioCtx.currentTime + idx * 0.16 + note.d);
            });
            
          } else if (nameLower.includes("taj mahal") || nameLower.includes("palace") || nameLower.includes("castle")) {
            // === 3. TAJ MAHAL / CASTLE AMBIENT DING CHIMES ===
            // Heavenly temple brass bells, rich multi-resonance tones
            const frequencies = [523.25, 659.25, 783.99, 987.77, 1174.66]; // beautiful major 7th chord arpeggio
            frequencies.forEach((freq, idx) => {
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              
              osc.type = "sine";
              osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.22);
              
              // Bell ringing envelope with high persistence decay
              gain.gain.setValueAtTime(0.07, audioCtx.currentTime + idx * 0.22);
              gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.22 + 2.5);
              
              osc.start(audioCtx.currentTime + idx * 0.22);
              osc.stop(audioCtx.currentTime + idx * 0.22 + 2.6);
            });
            
          } else if (nameLower.includes("khan") || nameLower.includes("star") || nameLower.includes("wings") || nameLower.includes("angel")) {
            // === 4. BOLLYWOOD SUPERSTAR SHAH RUKH KHAN / WINGS SYNTH UP ===
            // Rhythmic super-fast dance scale up
            const scale = [440.00, 554.37, 659.25, 880.00, 1108.73, 1318.51, 1760.00]; 
            scale.forEach((freq, idx) => {
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              
              osc.type = "sawtooth";
              osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.08);
              gain.gain.setValueAtTime(0.06, audioCtx.currentTime + idx * 0.08);
              gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.08 + 0.35);
              
              osc.start(audioCtx.currentTime + idx * 0.08);
              osc.stop(audioCtx.currentTime + idx * 0.08 + 0.4);
            });
            
          } else if (nameLower.includes("taj hotel") || nameLower.includes("president") || nameLower.includes("hotel")) {
            // === 5. TAJ HOTEL PRESIDENT CELEBRATION CHIME ===
            // High crystal elegant concierge bell "Ding!" followed by warm flute crescendo
            const oscBell = audioCtx.createOscillator();
            const gainBell = audioCtx.createGain();
            oscBell.type = "sine";
            oscBell.connect(gainBell);
            gainBell.connect(audioCtx.destination);
            oscBell.frequency.setValueAtTime(2048, audioCtx.currentTime); 
            gainBell.gain.setValueAtTime(0.10, audioCtx.currentTime);
            gainBell.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
            oscBell.start(audioCtx.currentTime);
            oscBell.stop(audioCtx.currentTime + 1.3);
            
            // Warm rich suite entry tune (Triangle wave)
            const suiteMelody = [
              { f: 659.25, d: 0.3, t: 0.15 }, // E5
              { f: 830.61, d: 0.3, t: 0.35 }, // G#5
              { f: 987.77, d: 0.3, t: 0.55 }, // B5
              { f: 1318.51, d: 0.6, t: 0.75 } // E6
            ];
            suiteMelody.forEach((note) => {
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.type = "triangle";
              osc.frequency.setValueAtTime(note.f, audioCtx.currentTime + note.t);
              gain.gain.setValueAtTime(0.07, audioCtx.currentTime + note.t);
              gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + note.t + note.d);
              osc.start(audioCtx.currentTime + note.t);
              osc.stop(audioCtx.currentTime + note.t + note.d + 0.1);
            });
            
          } else {
            // === DEFAULT LUXURY MAJESTIC trumpet fanfares ===
            const notes = [
              { f: 523.25, d: 0.22 }, // C5
              { f: 659.25, d: 0.22 }, // E5
              { f: 783.99, d: 0.22 }, // G5
              { f: 1046.50, d: 0.70 } // C6
            ];
            notes.forEach((note, index) => {
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.type = "sawtooth"; 
              osc.frequency.setValueAtTime(note.f, audioCtx.currentTime + index * 0.18);
              gain.gain.setValueAtTime(0.06, audioCtx.currentTime + index * 0.18);
              gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + index * 0.18 + note.d);
              osc.start(audioCtx.currentTime + index * 0.18);
              osc.stop(audioCtx.currentTime + index * 0.18 + note.d);
            });
          }
        }
      } catch (err) {
        console.warn("Audio Context celebration blocked or unsupported:", err);
      }
    }

    // Determine the animation setup based on category
    if (gift.animationType === "luxury") {
      setPhase("luxury");
      const timer = setTimeout(() => {
        onComplete();
      }, 4500);
      return () => clearTimeout(timer);
    }

    if (gift.animationType === "full_screen") {
      setPhase("full_screen");
      const timer = setTimeout(() => {
        onComplete();
      }, 5000);
      return () => clearTimeout(timer);
    }

    // Coordinates translation behavior: Sender Avatar -> Flying -> Receiver Avatar -> Explosion
    const delayTimer = setTimeout(() => {
      let senderEl = document.getElementById("seat-card-" + gift.senderId);
      let receiverEl = document.getElementById("seat-card-" + gift.receiverId);

      // Default off-screen coordinates if seats aren't visible
      let x1 = window.innerWidth * 0.15;
      let y1 = window.innerHeight * 0.8;
      let x2 = window.innerWidth * 0.85;
      let y2 = window.innerHeight * 0.3;

      if (senderEl) {
        const rect = senderEl.getBoundingClientRect();
        x1 = rect.left + rect.width / 2;
        y1 = rect.top + rect.height / 2;
      }
      if (receiverEl) {
        const rect = receiverEl.getBoundingClientRect();
        x2 = rect.left + rect.width / 2;
        y2 = rect.top + rect.height / 2;
      }

      setCoords({ x1, y1, x2, y2 });

      // Fly duration: 1.4 seconds, then transition to explosion
      const flyTimer = setTimeout(() => {
        setPhase("exploding");
        // Explosion/combo lifespan 1.6 seconds, then complete
        const explodeTimer = setTimeout(() => {
          onComplete();
        }, 1600);
        return () => clearTimeout(explodeTimer);
      }, 1400);

      return () => clearTimeout(flyTimer);
    }, 50);

    return () => clearTimeout(delayTimer);
  }, [gift, onComplete]);

  // Luxury / Sports Car Overlay rendering
  if (phase === "luxury") {
    return (
      <div className="absolute inset-x-0 bottom-1/4 flex flex-col items-center justify-center pointer-events-none z-50">
        <div className="bg-gradient-to-r from-amber-500 via-rose-600 to-purple-600 text-white font-extrabold px-5 py-2 rounded-full text-xs shadow-2xl flex items-center gap-2 max-w-sm border-2 border-amber-300 animate-pulse uppercase tracking-widest">
          <span className="text-sm">👑 LUXURY GIFT ALERT 👑</span>
        </div>
        <div className="text-white text-xs font-black mt-2 bg-slate-950/80 px-4 py-1 rounded-md text-center border border-yellow-500/20 shadow-md">
          <span className="text-amber-400">{gift.senderName}</span> sent <span className="text-purple-400 font-bold">{gift.giftName}</span> to <span className="text-emerald-400">{gift.receiverName}</span>
        </div>
        <div className="relative mt-8 flex flex-col items-center animate-luxury-drive">
          <span className="text-8xl filter drop-shadow-[0_15px_25px_rgba(245,158,11,0.7)] select-none">
            {gift.giftImageUrl}
          </span>
          <div className="w-48 h-3.5 bg-yellow-400/50 rounded-full blur-sm mt-2 animate-ping"></div>
          <span className="text-yellow-300 text-xs font-black uppercase tracking-widest mt-1.5 bg-slate-900 px-3 py-0.5 rounded border border-yellow-500/30">
            ★ VIP ROADSTER ★
          </span>
        </div>
      </div>
    );
  }

  // Full Screen / Royal Palace Overlay rendering
  if (phase === "full_screen") {
    const isUltraVip = gift.cost >= 1500;

    return (
      <div className="absolute inset-x-0 top-0 bottom-16 bg-gradient-to-b from-slate-950/98 via-slate-950/80 to-transparent flex flex-col items-center justify-center backdrop-blur-xs pointer-events-none z-50 animate-fade-in">
        {/* Animated Background Rays / Orbit Lines */}
        <div className="absolute w-[380px] h-[380px] rounded-full border border-yellow-500/10 animate-spin-slow"></div>
        <div className="absolute w-[300px] h-[300px] rounded-full border-2 border-dashed border-purple-500/10 animate-reverse-spin"></div>
        
        {/* Cinematic Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none pb-20">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute text-yellow-400 text-lg animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 80}%`, // Stay mostly in the upper 80% of screen
                animationDelay: `${Math.random() * 2.5}s`,
                animationDuration: `${2.0 + Math.random() * 2.5}s`,
                opacity: 0.8
              }}
            >
              {i % 3 === 0 ? "★" : i % 3 === 1 ? "✨" : "✧"}
            </div>
          ))}
        </div>

        {/* The Grand Central Screen Showstage Card */}
        <div className="text-center px-5 py-5 rounded-[32px] bg-gradient-to-b from-slate-950 via-purple-950/30 to-slate-950 border-[2.5px] border-amber-400 shadow-[0_0_80px_rgba(245,158,11,0.6)] max-w-xs w-[85%] animate-scale-up relative overflow-hidden -mt-6">
          {/* Inner Light Ring */}
          <div className="absolute inset-1.5 rounded-[26px] border border-yellow-500/20 pointer-events-none"></div>
          
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-5xl animate-bounce">
            👑
          </div>

          <p className="text-yellow-400 text-[9px] font-black tracking-widest uppercase mb-1.5 animate-pulse mt-1">
            ✨ SUPER VIP GRAND MASSIVE ALERT ✨
          </p>
          <div className="text-white font-extrabold text-xs leading-relaxed py-1 flex flex-col items-center gap-2">
            {/* Double Profile Avatar Presentation Node! */}
            <div className="flex items-center justify-center gap-3 my-1 relative">
              {/* Sender node */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-11 h-11 rounded-full border-2 border-amber-400 bg-slate-900 overflow-hidden p-0.5 shadow-lg relative">
                  <img 
                    src={gift.senderAvatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} 
                    alt="Sender" 
                    className="w-full h-full object-cover rounded-full" 
                  />
                  <span className="absolute -top-1 -right-1 bg-yellow-500 text-slate-950 font-black text-[6px] px-1 rounded-full border border-white">SENDER</span>
                </div>
                <span className="text-[8.5px] text-amber-400 max-w-[65px] truncate block uppercase font-black">{gift.senderName}</span>
              </div>

              {/* Connecting Grand Crown Arrow */}
              <div className="flex flex-col items-center justify-center animate-pulse">
                <span className="text-amber-400 text-xs font-serif font-black">🎁</span>
                <div className="w-8 h-0.5 bg-gradient-to-r from-amber-400 to-purple-400"></div>
                <span className="text-[6px] text-purple-300 font-mono tracking-widest uppercase mt-0.5">BESTOWED</span>
              </div>

              {/* Receiver node */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-11 h-11 rounded-full border-2 border-emerald-400 bg-slate-900 overflow-hidden p-0.5 shadow-lg relative">
                  <img 
                    src={gift.receiverAvatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"} 
                    alt="Receiver" 
                    className="w-full h-full object-cover rounded-full" 
                  />
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-slate-950 font-black text-[6px] px-1 rounded-full border border-white">RECV</span>
                </div>
                <span className="text-[8.5px] text-emerald-400 max-w-[65px] truncate block uppercase font-black">{gift.receiverName}</span>
              </div>
            </div>

            {/* Visual Display labels */}
            <div className="border-t border-b border-white/10 w-full py-1 mb-1 bg-slate-950/80 rounded-xl px-2">
              <span className="text-[9px] text-gray-400 block font-medium">Behold The Cosmic Luxury Masterpiece</span>
              <span className="text-yellow-400 font-black text-sm uppercase tracking-wide">{gift.giftName}</span>
            </div>
          </div>

          {/* Huge grand rotating gift representation */}
          <div className="relative my-5 flex justify-center items-center">
            {/* Radiant glowing golden aura ring */}
            <div className="absolute w-28 h-28 rounded-full bg-yellow-500/20 blur-md animate-ping"></div>
            <div className="absolute w-24 h-24 rounded-full border-4 border-dashed border-yellow-400/30 animate-spin-slow"></div>
            
            <div className="text-7xl drop-shadow-[0_15px_30px_rgba(241,194,50,1.0)] filter select-none animate-bounce duration-[1400ms]">
              {gift.giftImageUrl}
            </div>
          </div>

          <div className="text-[8px] bg-gradient-to-r from-yellow-500 via-purple-600 to-yellow-500 text-transparent bg-clip-text font-black tracking-widest uppercase animate-pulse">
            👑 GRAND UNIVERSE CELEBRATION SPECTACLE 👑
          </div>
          {gift.comboCount && gift.comboCount > 1 && (
            <div className="mt-1.5 bg-gradient-to-tr from-yellow-500 to-rose-500 text-slate-950 font-black px-2.5 py-0.5 rounded-full text-[9px] inline-block uppercase tracking-widest shadow-lg animate-bounce">
              🔥 x{gift.comboCount} COMBO STREAK!
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!coords) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-55">
      {/* 1. Flying Path Stage */}
      {phase === "flying" && (
        <>
          {/* Flying gift in flight path - Emerges organically from starting profile directly to ending profile coordinate */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-[1250ms] cubic-bezier(0.25, 1, 0.5, 1) flex flex-col items-center z-55"
            style={{
              left: coords.x2,
              top: coords.y2,
              transform: `translate3d(${coords.x1 - coords.x2}px, ${coords.y1 - coords.y2}px, 0)`,
              animation: "none",
              transitionProperty: "transform",
            }}
            ref={(el) => {
              if (el) {
                // Force triggering reflow to run flight transition
                el.getBoundingClientRect();
                el.style.transform = "translate3d(0, 0, 0) scale(1.45)";
              }
            }}
          >
            {/* Pulsing glow particle ring */}
            <span className="absolute inset-0 w-16 h-16 bg-purple-500/35 rounded-full blur-md animate-pulse scale-120"></span>
            <span className="absolute inset-0 w-12 h-12 bg-amber-500/25 rounded-full blur-xs animate-ping"></span>
            
            <span className="text-6xl drop-shadow-[0_12px_20px_rgba(234,179,8,0.85)] animate-bounce select-none">
              {gift.giftImageUrl}
            </span>
            <span className="text-[7.5px] bg-gradient-to-r from-purple-900 to-indigo-900 border border-purple-500/40 text-purple-100 px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider mt-1 shadow-md whitespace-nowrap">
              {gift.giftName}
            </span>
          </div>
        </>
      )}

      {/* 2. Explosion and Combo multiplier Stage - Circular wrapping design around actual profile */}
      {phase === "exploding" && (
        <div 
          className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-55"
          style={{ left: coords.x2, top: coords.y2 }}
        >
          {/* Outer glowing circular border that sits perfectly on top of / wraps the target profile */}
          <div className="absolute w-14 h-14 rounded-full border-[3px] border-dashed border-amber-400 bg-amber-500/10 shadow-[0_0_20px_rgba(251,191,36,0.9)] animate-spin-slow"></div>
          
          {/* Dynamic scaling ripple halo */}
          <div className="absolute w-16 h-16 rounded-full border-2 border-purple-500/70 animate-ping"></div>
          <div className="absolute w-20 h-20 rounded-full border border-pink-500/40 animate-pulse"></div>

          {/* Golden background aura */}
          <div className="absolute w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-500/20 via-purple-500/25 to-pink-500/20 animate-pulse"></div>

          {/* Centered Gift Symbol with dynamic entry pop */}
          <div className="relative z-20 flex flex-col items-center justify-center animate-scale-up">
            <span className="text-4xl filter drop-shadow-[0_6px_12px_rgba(234,179,8,1)] select-none">
              {gift.giftImageUrl}
            </span>
          </div>

          {/* Gorgeous circular combo multiplier bubble at the top-right corner of the profile circle */}
          <div className="absolute -top-3.5 -right-3.5 bg-gradient-to-tr from-yellow-400 via-amber-500 to-rose-500 text-slate-950 font-black w-8 h-8 rounded-full border-2 border-white flex flex-col items-center justify-center text-[8.5px] shadow-[0_4px_10px_rgba(0,0,0,0.5)] animate-bounce select-none leading-none">
            <span className="text-[9px]">x{gift.comboCount || 1}</span>
            <span className="text-[4.5px] uppercase font-black tracking-tighter mt-0.5">Combo</span>
          </div>

          {/* Elegant curved label overlay mapping below the circle */}
          <div className="absolute -bottom-6 bg-slate-950/95 border border-yellow-500/40 text-yellow-400 px-2.5 py-0.5 rounded-full shadow-[0_3px_10px_rgba(0,0,0,0.8)] text-[7px] font-black uppercase tracking-widest select-none whitespace-nowrap animate-scale-up">
            🎁 Got {gift.giftName}!
          </div>

          {/* Swarn of magic circular sparkles flying outwards in 360 layout */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * Math.PI) / 6;
            const distance = 35 + Math.random() * 25;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;
            return (
              <span
                key={i}
                className="absolute text-yellow-300 text-xs font-bold transition-all duration-750 opacity-0 transform translate-x-0 translate-y-0 select-none z-10"
                style={{
                  transform: `translate3d(${dx}px, ${dy}px, 0) scale(1.3)`,
                  opacity: 1,
                  transitionProperty: "transform, opacity",
                  transitionTimingFunction: "cubic-bezier(0.1, 0.8, 0.3, 1)"
                }}
                ref={(el) => {
                  if (el) {
                    el.getBoundingClientRect();
                    el.style.opacity = "0";
                    el.style.transform = `translate3d(${dx * 1.5}px, ${dy * 1.5}px, 0) scale(0.2)`;
                  }
                }}
              >
                ✦
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
