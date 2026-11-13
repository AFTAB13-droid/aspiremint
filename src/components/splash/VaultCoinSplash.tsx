"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { splashSoundEngine } from "@/utils/splashSound";

interface SplashProps {
  containerMode?: boolean; // If true, renders within parent frame; if false, fixed full screen
  soundEnabled?: boolean;
  onComplete?: () => void;
  isMobilePreview?: boolean;
}

export const VaultCoinSplash: React.FC<SplashProps> = ({
  containerMode = false,
  soundEnabled = true,
  onComplete,
  isMobilePreview = false,
}) => {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [showRipples, setShowRipples] = useState(false);

  useEffect(() => {
    // Phase 1 -> Phase 2 (Coin lock & chime)
    const t1 = setTimeout(() => {
      setPhase(2);
      setShowRipples(true);
      if (soundEnabled) {
        splashSoundEngine.playVaultCoinSound();
      }
    }, 900);

    // Phase 2 -> Phase 3 (Typography lock & settled)
    const t2 = setTimeout(() => {
      setPhase(3);
    }, 1700);

    // Completion callback
    const t3 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [soundEnabled, onComplete]);

  const containerClasses = containerMode
    ? "absolute inset-0 w-full h-full overflow-hidden select-none"
    : "fixed inset-0 z-[9999] w-screen h-screen overflow-hidden select-none";

  return (
    <div
      className={`${containerClasses} flex flex-col items-center justify-center bg-gradient-to-b from-[#f8fafc] via-white to-[#f1f5f9] text-slate-900 font-sans`}
      style={{ perspective: 1200 }}
    >
      {/* Optional Quick Skip for returning users */}
      {onComplete && !containerMode && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={onComplete}
          className="absolute top-5 right-5 z-30 px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white border border-slate-200/90 shadow-sm text-[11px] font-black text-slate-500 hover:text-slate-900 backdrop-blur-md transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
        >
          <span>Skip</span>
          <span className="text-emerald-600 font-bold">›</span>
        </motion.button>
      )}

      {/* 1. CINEMATIC LUXURY PEARL LIGHT BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft Radial Mint & Warm Champagne Gold Aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-emerald-100/70 via-teal-50/60 to-amber-100/50 rounded-full blur-[110px]" />
        
        {/* Subtle Geometric Ambient Grid */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(#0f172a 1px, transparent 1px), linear-gradient(90deg, #0f172a 1px, transparent 1px)",
            backgroundSize: "36px 36px"
          }}
        />

        {/* Floating Luminous Gold & Emerald Micro-Dust */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: (i % 2 === 0 ? 1 : -1) * (60 + (i * 18)),
              y: (i % 3 === 0 ? 1 : -1) * (40 + (i * 14)),
              opacity: 0,
              scale: 0.5,
            }}
            animate={{
              y: [(i % 3 === 0 ? 1 : -1) * (40 + (i * 14)), (i % 3 === 0 ? 1 : -1) * (20 + (i * 10))],
              opacity: [0, 0.75, 0],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: 2 + (i % 3) * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.15,
            }}
            className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-emerald-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
          />
        ))}
      </div>

      {/* 2. HYPER-REALISTIC 3D MINTED COIN ASSEMBLY (LIGHT FINISH) */}
      <div className="relative flex flex-col items-center z-10">
        <motion.div
          style={{ transformStyle: "preserve-3d" }}
          initial={{ rotateY: 0, rotateX: 25, scale: 0.6, opacity: 0 }}
          animate={{
            rotateY: phase === 1 ? 720 : 0,
            rotateX: phase >= 2 ? 0 : [20, -10, 20],
            scale: phase >= 2 ? (isMobilePreview ? 1.05 : 1.15) : 0.9,
            opacity: 1,
          }}
          transition={{
            rotateY: { duration: 1.1, ease: [0.25, 1, 0.5, 1] },
            rotateX: { duration: 1.2, ease: "easeInOut" },
            scale: { duration: 0.5, ease: "backOut" },
            opacity: { duration: 0.3 },
          }}
          className="relative flex items-center justify-center cursor-pointer group"
        >
          {/* Shockwave Energy Ripple on Coin Lock (Phase 2) */}
          <AnimatePresence>
            {showRipples && (
              <>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.9 }}
                  animate={{ scale: 2.8, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full border-2 border-emerald-400/80 shadow-[0_0_35px_rgba(16,185,129,0.4)] pointer-events-none"
                />
                <motion.div
                  initial={{ scale: 0.6, opacity: 0.8 }}
                  animate={{ scale: 2.1, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full border border-amber-400/70 shadow-[0_0_25px_rgba(245,158,11,0.3)] pointer-events-none"
                />
              </>
            )}
          </AnimatePresence>

          {/* 3D Coin Body (Polished Gold & Mint Enamel) */}
          <div
            className={`relative ${
              isMobilePreview ? "w-28 h-28" : "w-36 h-36"
            } rounded-full p-[3px] bg-gradient-to-tr from-amber-400 via-yellow-200 to-emerald-400 shadow-[0_20px_45px_rgba(16,185,129,0.22),0_10px_25px_rgba(0,0,0,0.08)]`}
          >
            {/* Outer Coin Rim Ridges */}
            <div className="w-full h-full rounded-full bg-white p-2 flex items-center justify-center relative overflow-hidden border border-amber-300 shadow-inner">
              {/* Pearl Enamel Radial Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-emerald-50/50" />
              
              {/* Circular Coin Bevel Track */}
              <div className="absolute inset-2 rounded-full border border-dashed border-emerald-500/30 animate-[spin_20s_linear_infinite]" />

              {/* Embossed AspireMint Geometric Crown / Peak Logo */}
              <svg
                viewBox="0 0 100 100"
                className="w-16 h-16 relative z-10 drop-shadow-[0_4px_10px_rgba(5,150,105,0.3)]"
                fill="none"
              >
                {/* 3D Minted Structural Peaks */}
                <motion.path
                  d="M14 78L36 22L52 62L68 22L86 78"
                  stroke="url(#coinGoldGradLight)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.9, ease: "easeInOut" }}
                />
                {/* Horizontal Mint Bar */}
                <motion.path
                  d="M24 56H42"
                  stroke="#059669"
                  strokeWidth="8"
                  strokeLinecap="round"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                  style={{ originX: 0 }}
                />
                <defs>
                  <linearGradient id="coinGoldGradLight" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#d97706" />
                    <stop offset="45%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Dynamic Metallic Glint Sweep */}
              <motion.div
                animate={{ x: ["-150%", "200%"] }}
                transition={{
                  repeat: Infinity,
                  duration: 2.2,
                  repeatDelay: 1.5,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/70 to-transparent skew-x-[-30deg] pointer-events-none"
              />
            </div>
          </div>
        </motion.div>

        {/* 3. LUXURY TYPOGRAPHY (LIGHT FINISH) */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{
            opacity: phase >= 2 ? 1 : 0,
            y: phase >= 2 ? 0 : 25,
          }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 flex flex-col items-center text-center"
        >
          {/* Main Title: ASPIRE·MINT */}
          <div className="flex items-center gap-1.5">
            <span
              className={`${
                isMobilePreview ? "text-2xl" : "text-4xl"
              } font-black tracking-[0.25em] text-slate-900 drop-shadow-sm`}
            >
              ASPIRE
            </span>
            <span
              className={`${
                isMobilePreview ? "text-2xl" : "text-4xl"
              } font-black tracking-[0.25em] bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-700 drop-shadow-[0_2px_12px_rgba(16,185,129,0.3)]`}
            >
              MINT
            </span>
          </div>

          {/* Subtitle Badge (Light Pearl Pill) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: phase === 3 ? 1 : 0,
              scale: phase === 3 ? 1 : 0.9,
            }}
            transition={{ duration: 0.4 }}
            className="mt-3 flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/90 shadow-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800">
              100% CashBack · Exclusive Deals
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* 4. EXECUTIVE PROGRESS HORIZON BAR (LIGHT) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 sm:w-64 h-[3px] bg-slate-200/90 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.4, ease: [0.65, 0, 0.35, 1] }}
          className="h-full bg-gradient-to-r from-amber-400 via-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
        />
      </div>
    </div>
  );
};
