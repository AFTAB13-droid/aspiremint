"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const SplashScreen = () => {
  // Start at phase 1 to ensure instant visibility on first render
  const [phase, setPhase] = useState(1);
  const [loadingText, setLoadingText] = useState("Initializing Core...");

  useEffect(() => {
    const t2 = setTimeout(() => setPhase(2), 600);
    const t3 = setTimeout(() => setPhase(3), 1600);

    const texts = [
      "Initialising Core...",
      "Syncing Secure Protocol...",
      "Preparing Sky-High UX...",
      "Ready to Fly."
    ];
    let currentIdx = 0;
    const interval = setInterval(() => {
      currentIdx = (currentIdx + 1) % texts.length;
      setLoadingText(texts[currentIdx]);
    }, 700);

    return () => {
      clearTimeout(t2);
      clearTimeout(t3);
      clearInterval(interval);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1, ease: [0.43, 0.13, 0.23, 0.96] } }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white overflow-hidden"
    >
      {/* CINEMATIC SKY & CLOUDS BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden bg-gradient-to-b from-[#7dd3fc] via-[#bae6fd] to-white">
        
        {/* Layered Floating Clouds (Premium Parallax) - Starts Visible */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: "-20%", y: `${20 + (i * 15)}%`, opacity: 0.6 }}
            animate={{ 
              x: ["-20%", "120%"],
              opacity: [0, 0.6, 0.6, 0],
            }}
            transition={{
              duration: 20 + (i * 5),
              repeat: Infinity,
              ease: "linear",
              delay: i * -4
            }}
            className="absolute"
            style={{ scale: 1 + (i * 0.2) }}
          >
            <div className="w-[300px] h-[100px] bg-white rounded-full blur-[40px] opacity-80" />
            <div className="w-[150px] h-[150px] bg-white rounded-full blur-[50px] opacity-70 absolute -top-10 left-10" />
          </motion.div>
        ))}

        {/* Subtle Lens Flare / Sun Glow */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-yellow-100/30 rounded-full blur-[100px]" />
      </div>

      <div className="relative flex flex-col items-center">
        {/* HYPER-ADVANCED 3D LOGO ASSEMBLY */}
        <motion.div
           style={{ transformStyle: "preserve-3d", perspective: 1200 }}
           animate={{ 
             rotateY: phase >= 1 ? 360 : 0, 
             rotateX: phase >= 1 ? [0, 10, -10, 0] : 0,
             scale: phase >= 2 ? 1.05 : 1
           }}
           transition={{ 
             rotateY: { duration: 1.5, ease: [0.22, 1, 0.36, 1] },
             rotateX: { repeat: Infinity, duration: 6, ease: "easeInOut" },
             scale: { duration: 0.5 }
           }}
           className="relative"
        >
          {/* logo Glow Pulse */}
          <AnimatePresence>
            {phase === 2 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 2.2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute inset-0 rounded-full bg-white ring-2 ring-blue-200/20 blur-xl"
              />
            )}
          </AnimatePresence>

          <div className="relative group">
            <svg width="150" height="150" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_20px_40px_rgba(0,0,0,0.15)]">
              {/* Main Structural Peaks */}
              <motion.path 
                d="M10 85L35 15L55 65L75 15L95 85" 
                stroke="#075985" 
                strokeWidth="11" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                initial={{ pathLength: 0, filter: "blur(8px)" }}
                animate={{ pathLength: 1, filter: "blur(0px)" }}
                transition={{ duration: 1.6, ease: "circInOut" }}
              />
              {/* Highlight Overlay */}
              <motion.path 
                d="M10 85L35 15L55 65L75 15L95 85" 
                stroke="#bae6fd" 
                strokeWidth="4" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.8, delay: 0.1, ease: "easeInOut" }}
                className="opacity-40"
              />
              {/* Dynamic Action Bar */}
              <motion.path 
                d="M20 60H35" 
                stroke="#0ea5e9" 
                strokeWidth="9" 
                strokeLinecap="round"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5, ease: "backOut" }}
                style={{ originX: 0 }}
              />
            </svg>

            {/* Cinematic Glint Sweep */}
            <motion.div 
              animate={{ left: ["-100%", "200%"] }}
              transition={{ repeat: Infinity, duration: 2.5, repeatDelay: 2.5, ease: "circIn" }}
              className="absolute top-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[35deg] pointer-events-none mix-blend-overlay"
            />
          </div>
        </motion.div>

        {/* HYPER-ADVANCED BRANDING TYPOGRAPHY */}
        <div className="mt-16 flex flex-col items-center">
          <motion.div 
            className="flex items-center gap-1.5 overflow-hidden h-12"
          >
            {"ASPIREMINT".split("").map((letter, i) => (
              <motion.span
                key={i}
                initial={{ y: 50, opacity: 0, filter: "blur(10px)", scale: 0.5 }}
                animate={{ 
                  y: phase >= 2 ? 0 : 50, 
                  opacity: phase >= 2 ? 1 : 0, 
                  filter: phase >= 2 ? "blur(0px)" : "blur(10px)",
                  scale: phase >= 2 ? 1 : 0.5,
                  color: phase >= 3 ? ["#075985", "#0ea5e9", "#075985"] : "#0c4a6e"
                }}
                transition={{ 
                  y: { delay: (i * 0.04), duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
                  opacity: { delay: (i * 0.04), duration: 0.5 },
                  filter: { delay: (i * 0.04), duration: 0.5 },
                  scale: { delay: (i * 0.04), duration: 0.5 },
                  color: { delay: (i * 0.04), duration: 0.3 }
                }}
                className="text-4xl font-black text-slate-900 tracking-wider uppercase inline-block drop-shadow-lg cursor-default"
              >
                {letter}
              </motion.span>
            ))}
          </motion.div>

          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: phase >= 2 ? 240 : 0, opacity: 1 }}
            className="h-[2px] bg-gradient-to-r from-transparent via-sky-600/30 to-transparent mt-6 rounded-full relative overflow-hidden"
          >
             <motion.div 
               animate={{ left: ["-100%", "100%"] }}
               transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
               className="absolute inset-0 w-1/3 bg-white/80 blur-md"
             />
          </motion.div>
          
          <div className="h-8 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={loadingText}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 0.7, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="text-[11px] font-black text-sky-700 uppercase tracking-[0.5em] mt-4 italic"
              >
                {loadingText}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Cinematic Horizon Scanner (Sky Style) */}
      <motion.div 
        className="absolute bottom-0 left-0 w-full h-2 bg-slate-50 overflow-hidden"
      >
        <motion.div 
          className="h-full bg-gradient-to-r from-sky-700 via-sky-400 to-sky-700 shadow-[0_-4px_20px_rgba(14,165,233,0.5)]"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 3.5, ease: [0.65, 0, 0.35, 1] }}
        />
      </motion.div>
    </motion.div>
  );
};
