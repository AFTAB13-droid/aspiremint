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

export const GlassPrismSplash: React.FC<SplashProps> = ({
  containerMode = false,
  soundEnabled = true,
  onComplete,
  isMobilePreview = false,
}) => {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    // Sound & Prism lock
    const t1 = setTimeout(() => {
      setPhase(2);
      if (soundEnabled) {
        splashSoundEngine.playGlassPrismSound();
      }
    }, 850);

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

  const containerClasses = containerMode
    ? "absolute inset-0 w-full h-full overflow-hidden select-none"
    : "fixed inset-0 z-[9999] w-screen h-screen overflow-hidden select-none";

  return (
    <div
      className={`${containerClasses} flex flex-col items-center justify-center bg-[#020617] text-white font-sans`}
      style={{ perspective: 1400 }}
    >
      {/* 1. DEEP SAPPHIRE & SPECTRAL CAUSTIC BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Prismatic Radial Flare */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-cyan-500/20 via-sky-600/10 to-indigo-500/20 rounded-full blur-[140px]" />
        
        {/* Soft Volumetric Light Beams */}
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-15"
          style={{
            background: "conic-gradient(from 0deg, transparent 0deg, #38bdf8 30deg, transparent 70deg, #34d399 150deg, transparent 210deg, #818cf8 300deg, transparent 360deg)",
            filter: "blur(40px)",
          }}
        />
      </div>

      {/* 2. 3D FROSTED GLASS PRISM / CAUSTIC EMBLEM */}
      <div className="relative flex flex-col items-center z-10">
        <motion.div
          style={{ transformStyle: "preserve-3d" }}
          initial={{ rotateY: -60, rotateX: 30, scale: 0.7, opacity: 0 }}
          animate={{
            rotateY: phase >= 2 ? 0 : [ -60, 40, -20 ],
            rotateX: phase >= 2 ? 0 : [ 30, -15, 10 ],
            scale: phase >= 2 ? (isMobilePreview ? 1.05 : 1.15) : 0.85,
            opacity: 1,
          }}
          transition={{
            rotateY: { duration: 1.0, ease: [0.16, 1, 0.3, 1] },
            rotateX: { duration: 1.0, ease: "easeInOut" },
            scale: { duration: 0.6, ease: "backOut" },
            opacity: { duration: 0.4 },
          }}
          className="relative flex items-center justify-center"
        >
          {/* Prismatic Light Blast on Lock */}
          <AnimatePresence>
            {phase === 2 && (
              <motion.div
                initial={{ scale: 0.5, opacity: 1 }}
                animate={{ scale: 2.4, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.85, ease: "easeOut" }}
                className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 blur-2xl pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* 3D Glass Prism Container */}
          <div
            className={`relative ${
              isMobilePreview ? "w-28 h-28" : "w-36 h-36"
            } rounded-3xl p-[1px] bg-gradient-to-br from-white/40 via-cyan-400/30 to-white/5 backdrop-blur-2xl shadow-[0_20px_50px_rgba(6,182,212,0.3)] flex items-center justify-center`}
            style={{
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            {/* Inner Glass Prism Facet */}
            <div className="w-full h-full rounded-3xl bg-gradient-to-br from-white/10 via-cyan-950/20 to-black/40 border border-white/20 flex items-center justify-center relative overflow-hidden">
              {/* Specular Diagonal Reflection */}
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

              {/* Minimalist 3D Laser-cut AspireMint Peak Logo */}
              <svg
                viewBox="0 0 100 100"
                className="w-16 h-16 relative z-10 drop-shadow-[0_0_20px_rgba(56,189,248,0.9)]"
                fill="none"
              >
                <motion.path
                  d="M16 80L36 24L52 64L68 24L84 80"
                  stroke="url(#prismGrad)"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.85, ease: "easeInOut" }}
                />
                <motion.path
                  d="M26 58H44"
                  stroke="#38bdf8"
                  strokeWidth="7"
                  strokeLinecap="round"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  style={{ originX: 0 }}
                />
                <defs>
                  <linearGradient id="prismGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#e0f2fe" />
                    <stop offset="50%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#818cf8" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Continuous Prismatic Light Sweep */}
              <motion.div
                animate={{ x: ["-100%", "200%"] }}
                transition={{
                  repeat: Infinity,
                  duration: 2.0,
                  repeatDelay: 1.8,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent skew-x-[-25deg] pointer-events-none"
              />
            </div>
          </div>
        </motion.div>

        {/* 3. MINIMALIST APPLE-STYLE TYPOGRAPHY */}
        <motion.div
          initial={{ opacity: 0, filter: "blur(12px)", y: 15 }}
          animate={{
            opacity: phase >= 2 ? 1 : 0,
            filter: phase >= 2 ? "blur(0px)" : "blur(12px)",
            y: phase >= 2 ? 0 : 15,
          }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 flex flex-col items-center text-center"
        >
          <h1
            className={`${
              isMobilePreview ? "text-2xl tracking-[0.3em]" : "text-3xl tracking-[0.35em]"
            } font-semibold uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-sky-100 to-slate-400`}
          >
            AspireMint
          </h1>
          <p className="mt-2 text-[10px] tracking-[0.3em] uppercase text-cyan-400/80 font-medium">
            Intelligence · Precision · Cashback
          </p>
        </motion.div>
      </div>

      {/* 4. SLEEK HORIZON BEAM */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 sm:w-60 h-[2px] bg-slate-900 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.3, ease: [0.65, 0, 0.35, 1] }}
          className="h-full bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400 shadow-[0_0_10px_rgba(56,189,248,0.8)]"
        />
      </div>
    </div>
  );
};
