"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { splashSoundEngine } from "@/utils/splashSound";

interface SplashProps {
  containerMode?: boolean;
  soundEnabled?: boolean;
  onComplete?: () => void;
  isMobilePreview?: boolean;
}

export const HolographicCardSplash: React.FC<SplashProps> = ({
  containerMode = false,
  soundEnabled = true,
  onComplete,
  isMobilePreview = false,
}) => {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const t1 = setTimeout(() => {
      setPhase(2);
      if (soundEnabled) {
        splashSoundEngine.playHolographicCardSound();
      }
    }, 750);

    const t2 = setTimeout(() => {
      setPhase(3);
    }, 1600);

    const t3 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [soundEnabled, onComplete]);

  // Subtle interactive tilt on mouse movement
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const containerClasses = containerMode
    ? "absolute inset-0 w-full h-full overflow-hidden select-none"
    : "fixed inset-0 z-[9999] w-screen h-screen overflow-hidden select-none";

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`${containerClasses} flex flex-col items-center justify-center bg-[#090d16] text-white font-sans`}
      style={{ perspective: 1200 }}
    >
      {/* 1. EXECUTIVE SLATE & NEON AURA */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-600/15 via-indigo-600/10 to-teal-500/15 rounded-full blur-[130px]" />
      </div>

      {/* 2. 3D FLOATING HOLOGRAPHIC VIP CARD */}
      <div className="relative flex flex-col items-center z-10">
        <motion.div
          style={{ transformStyle: "preserve-3d" }}
          initial={{ rotateY: -180, rotateX: 30, scale: 0.7, opacity: 0 }}
          animate={{
            rotateY: phase === 1 ? -180 : mousePos.x * 25,
            rotateX: phase === 1 ? 30 : -mousePos.y * 25,
            scale: phase >= 2 ? (isMobilePreview ? 0.95 : 1.1) : 0.8,
            opacity: 1,
          }}
          transition={{
            rotateY: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
            rotateX: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
            scale: { duration: 0.5, ease: "backOut" },
            opacity: { duration: 0.3 },
          }}
          className="relative cursor-pointer"
        >
          {/* Card Verification Flash */}
          <AnimatePresence>
            {phase === 2 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 1 }}
                animate={{ scale: 2.2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-300 blur-xl pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* Luxury Card Dimensions: 310px x 195px */}
          <div
            className={`${
              isMobilePreview ? "w-64 h-40" : "w-80 h-48"
            } rounded-2xl p-[2px] bg-gradient-to-br from-white/30 via-emerald-400/50 to-amber-400/40 shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(16,185,129,0.25)] relative overflow-hidden`}
          >
            {/* Card Surface */}
            <div className="w-full h-full rounded-2xl bg-[#0b101e] p-5 flex flex-col justify-between relative overflow-hidden border border-white/10">
              {/* Iridescent Foil Ribbon */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-emerald-400/30 via-teal-300/20 to-transparent rounded-full blur-xl pointer-events-none" />

              {/* Card Top Row: Brand & EMV Chip */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
                    ASPIREMINT
                  </span>
                  <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    VIP
                  </span>
                </div>

                {/* Metallic Gold EMV Chip */}
                <div className="w-9 h-7 rounded-md bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 border border-amber-300/80 shadow-sm relative overflow-hidden flex items-center justify-center">
                  <div className="w-full h-[1px] bg-amber-700/60" />
                  <div className="absolute w-[1px] h-full bg-amber-700/60" />
                </div>
              </div>

              {/* Card Center: Holographic Pass Number */}
              <div className="relative z-10 flex flex-col gap-1">
                <p className="text-[10px] tracking-[0.3em] uppercase text-slate-400 font-mono">
                  MEMBER ID: 8840 · 9201 · AMINT
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-emerald-400">100% CASHBACK PASS</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
              </div>

              {/* Card Bottom: Contactless symbol & Verified Badge */}
              <div className="flex items-center justify-between relative z-10">
                <span className="text-[9px] uppercase tracking-[0.15em] text-slate-400 font-semibold">
                  PREMIUM DEAL SUITE
                </span>
                {/* Contactless waves */}
                <svg className="w-5 h-5 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8.5 16.5a5 5 0 0 1 0-9" />
                  <path d="M12 19a8.5 8.5 0 0 0 0-14" />
                </svg>
              </div>

              {/* Shimmer sweep */}
              <motion.div
                animate={{ x: ["-150%", "200%"] }}
                transition={{
                  repeat: Infinity,
                  duration: 2.4,
                  repeatDelay: 1.5,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-30deg] pointer-events-none"
              />
            </div>
          </div>
        </motion.div>

        {/* 3. EXECUTIVE STATUS TYPOGRAPHY */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{
            opacity: phase >= 2 ? 1 : 0,
            y: phase >= 2 ? 0 : 15,
          }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-8 flex flex-col items-center text-center"
        >
          <div className="flex items-center gap-2 text-emerald-400">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-xs font-black uppercase tracking-[0.25em]">
              Security Protocol Verified
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 tracking-[0.2em] uppercase font-mono">
            Entering AspireMint Ecosystem...
          </p>
        </motion.div>
      </div>

      {/* 4. EXECUTIVE PROGRESS HORIZON */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 sm:w-64 h-[3px] bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.3, ease: [0.65, 0, 0.35, 1] }}
          className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]"
        />
      </div>
    </div>
  );
};
