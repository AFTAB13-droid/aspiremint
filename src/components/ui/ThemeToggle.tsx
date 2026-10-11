"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

interface ThemeToggleProps {
  variant?: "icon" | "pill" | "button";
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ variant = "icon", className = "", showLabel = false }: ThemeToggleProps) {
  const { theme, resolvedTheme, isDark, toggleTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render placeholder with same dimensions to prevent layout shift during hydration
    return (
      <div
        className={`${
          variant === "pill"
            ? "h-11 w-44 rounded-2xl bg-slate-100 dark:bg-slate-800"
            : "h-11 w-11 md:h-12 md:w-12 rounded-2xl bg-slate-100 dark:bg-slate-800"
        } ${className}`}
      />
    );
  }

  // --- 1. PILL SWITCH VARIANT (Ideal for Mobile Drawer & Settings) ---
  if (variant === "pill") {
    return (
      <div
        className={`flex items-center p-1.5 bg-slate-100 dark:bg-[#1A2338] rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-inner w-full justify-between gap-1 transition-colors ${className}`}
      >
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={`relative flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
            !isDark ? "text-amber-600 font-black" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {!isDark && (
            <motion.div
              layoutId="themePillIndicator"
              className="absolute inset-0 bg-white shadow-md rounded-xl border border-amber-100"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
            </svg>
            <span>Light</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={`relative flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
            isDark ? "text-indigo-400 font-black" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {isDark && (
            <motion.div
              layoutId="themePillIndicator"
              className="absolute inset-0 bg-[#0B0F19] shadow-lg rounded-xl border border-indigo-500/30"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
            </svg>
            <span>Dark</span>
          </span>
        </button>
      </div>
    );
  }

  // --- 2. ICON TOGGLE VARIANT (Header Web & Mobile) ---
  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.88 }}
      title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
      aria-label={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
      className={`relative h-11 w-11 md:h-12 md:w-12 rounded-2xl flex items-center justify-center transition-all duration-300 overflow-hidden group select-none ${
        isDark
          ? "bg-[#162035] text-indigo-300 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.25)] hover:border-indigo-400"
          : "bg-white/80 hover:bg-white text-amber-500 border border-amber-200/70 shadow-sm shadow-amber-500/10 hover:shadow-amber-500/20"
      } ${className}`}
    >
      {/* Background Radial Glow */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 pointer-events-none rounded-2xl ${
          isDark
            ? "bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-cyan-500/10 opacity-100"
            : "bg-gradient-to-tr from-amber-400/20 via-yellow-200/20 to-orange-400/10 opacity-70 group-hover:opacity-100"
        }`}
      />

      {/* Morphing Sun / Moon Physics Container */}
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="dark-moon"
            initial={{ rotate: -90, scale: 0.2, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0.2, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 20
            }}
            className="relative z-10 flex items-center justify-center"
          >
            {/* Crescent Moon Icon */}
            <svg
              className="w-5 h-5 md:w-6 md:h-6 text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.6)]"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                fillRule="evenodd"
                d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"
                clipRule="evenodd"
              />
            </svg>

            {/* Micro Sparkling Stars */}
            <motion.span
              animate={{
                scale: [0.8, 1.2, 0.8],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
              className="absolute -top-1.5 -right-1 text-[8px] text-cyan-300 font-bold select-none pointer-events-none"
            >
              ✦
            </motion.span>
            <motion.span
              animate={{
                scale: [1, 0.6, 1],
                opacity: [0.8, 0.3, 0.8]
              }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut", delay: 0.4 }}
              className="absolute -bottom-1 -left-1 text-[7px] text-purple-300 font-bold select-none pointer-events-none"
            >
              ★
            </motion.span>
          </motion.div>
        ) : (
          <motion.div
            key="light-sun"
            initial={{ rotate: 90, scale: 0.2, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: -90, scale: 0.2, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 20
            }}
            className="relative z-10 flex items-center justify-center"
          >
            {/* Radiant Sun Icon with Rotating Beams */}
            <motion.svg
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
              className="w-5 h-5 md:w-6 md:h-6 text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.2}
            >
              <circle cx="12" cy="12" r="4" fill="#F59E0B" />
              <path
                strokeLinecap="round"
                d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m14.14-14.14l-1.41 1.41"
              />
            </motion.svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ripple/Ping Effect on Hover */}
      <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 pointer-events-none" />
    </motion.button>
  );
}
