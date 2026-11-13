"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { splashSoundEngine } from "@/utils/splashSound";

interface SplashProps {
  containerMode?: boolean;
  soundEnabled?: boolean;
  onComplete?: () => void;
  isMobilePreview?: boolean;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  color: string;
  angle: number;
  distance: number;
  speed: number;
  size: number;
  alpha: number;
}

export const ParticleVortexSplash: React.FC<SplashProps> = ({
  containerMode = false,
  soundEnabled = true,
  onComplete,
  isMobilePreview = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [ignited, setIgnited] = useState(false);

  useEffect(() => {
    // 1. Particle Canvas Simulation for Light Mode
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const particles: Particle[] = [];
    // High-contrast, rich vibrant colors calibrated for white canvas
    const colors = ["#059669", "#10b981", "#0284c7", "#0ea5e9", "#d97706", "#f59e0b"];
    const count = isMobilePreview ? 100 : 160;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: width / 2,
        y: height / 2,
        radius: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        angle: Math.random() * Math.PI * 2,
        distance: Math.random() * (Math.max(width, height) * 0.45) + 40,
        speed: 0.02 + Math.random() * 0.04,
        size: Math.random() * 2.8 + 1.2,
        alpha: Math.random() * 0.7 + 0.3,
      });
    }

    let startTime = performance.now();
    let isCollapsing = false;

    const render = (time: number) => {
      const elapsed = time - startTime;
      if (elapsed > 700) {
        isCollapsing = true;
      }

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      particles.forEach((p) => {
        if (!isCollapsing) {
          // Normal vortex swirling
          p.angle += p.speed;
          p.distance -= 0.35;
        } else {
          // Rapid gravitational collapse to center
          p.angle += p.speed * 2.5;
          p.distance = Math.max(0, p.distance - (p.distance * 0.12 + 1.5));
          p.alpha = Math.max(0, p.alpha - 0.015);
        }

        const px = centerX + Math.cos(p.angle) * p.distance;
        const py = centerY + Math.sin(p.angle) * p.distance;

        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();
      });

      if (elapsed < 2400) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    // 2. Audio & Phase Triggers
    const t1 = setTimeout(() => {
      setIgnited(true);
      setPhase(2);
      if (soundEnabled) {
        splashSoundEngine.playParticleVortexSound();
      }
    }, 800);

    const t2 = setTimeout(() => {
      setPhase(3);
    }, 1600);

    const t3 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2500);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [soundEnabled, onComplete, isMobilePreview]);

  const containerClasses = containerMode
    ? "absolute inset-0 w-full h-full overflow-hidden select-none"
    : "fixed inset-0 z-[9999] w-screen h-screen overflow-hidden select-none";

  return (
    <div className={`${containerClasses} flex flex-col items-center justify-center bg-gradient-to-b from-[#f8fafc] via-white to-[#f1f5f9] text-slate-900 font-sans`}>
      {/* 1. Dynamic Canvas Vortex */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

      {/* 2. Ignition Flash & Center Crest (Light Mode) */}
      <div className="relative flex flex-col items-center z-10">
        <AnimatePresence>
          {ignited && (
            <motion.div
              initial={{ scale: 0.2, opacity: 1 }}
              animate={{ scale: 3.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="absolute w-44 h-44 rounded-full bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 blur-2xl pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* 3D Glowing Peak Emblem (Pearl Porcelain Disk) */}
        <motion.div
          initial={{ scale: 0, rotate: -45, opacity: 0 }}
          animate={{
            scale: phase >= 2 ? (isMobilePreview ? 1.0 : 1.15) : 0,
            rotate: phase >= 2 ? 0 : -45,
            opacity: phase >= 2 ? 1 : 0,
          }}
          transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
          className="relative"
        >
          <div
            className={`${
              isMobilePreview ? "w-24 h-24" : "w-32 h-32"
            } rounded-full bg-white border-2 border-emerald-400 p-3 shadow-[0_20px_45px_rgba(5,150,105,0.25),0_4px_12px_rgba(0,0,0,0.06)] flex items-center justify-center backdrop-blur-md`}
          >
            <svg viewBox="0 0 100 100" className="w-16 h-16" fill="none">
              <motion.path
                d="M14 78L36 22L52 62L68 22L86 78"
                stroke="#059669"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8 }}
              />
              <motion.path
                d="M24 56H42"
                stroke="#d97706"
                strokeWidth="8"
                strokeLinecap="round"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                style={{ originX: 0 }}
              />
            </svg>
          </div>
        </motion.div>

        {/* 3. Celestial Typography (Light) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{
            opacity: phase >= 2 ? 1 : 0,
            scale: phase >= 2 ? 1 : 0.85,
            y: phase >= 2 ? 0 : 20,
          }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 flex flex-col items-center text-center"
        >
          <h1
            className={`${
              isMobilePreview ? "text-2xl" : "text-4xl"
            } font-black uppercase tracking-[0.25em] text-slate-900 drop-shadow-sm`}
          >
            AspireMint
          </h1>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-700">
            Celestial Speed · 100% Guaranteed Payouts
          </p>
        </motion.div>
      </div>

      {/* 4. Glowing Progress Track (Light) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 sm:w-60 h-[2.5px] bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.4, ease: "easeInOut" }}
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-500 shadow-[0_0_8px_rgba(5,150,105,0.6)]"
        />
      </div>
    </div>
  );
};
