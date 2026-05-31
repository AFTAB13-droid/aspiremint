"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "./Logo";

export function PremiumLoader() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full bg-[#f8fafc] relative overflow-hidden">
      
      {/* --- ADVANCED ATMOSPHERE: Floating Ambient Blobs --- */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          animate={{ 
            x: [0, 40, -40, 0], 
            y: [0, -60, 60, 0],
            scale: [1, 1.2, 0.9, 1] 
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[10%] left-[20%] w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ 
            x: [0, -30, 30, 0], 
            y: [0, 50, -50, 0],
            scale: [1, 0.8, 1.1, 1] 
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[10%] right-[20%] w-[350px] h-[350px] bg-indigo-400/10 rounded-full blur-[100px]"
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-0">
        
        {/* --- ULTRA-ADVANCED LOGO: SVG Drawing & Elastic Physics --- */}
        <div style={{ perspective: '1200px' }}>
          <motion.div
             animate={{ 
               y: [0, -12, 0],
               scale: [1, 1.05, 1],
               rotateY: [0, 10, 0, -10, 0]
             }}
             transition={{ 
               duration: 3, 
               repeat: Infinity, 
               ease: "easeInOut" 
             }}
             className="relative"
          >
             <div className="w-28 h-28 md:w-36 md:h-36 bg-white rounded-[40px] shadow-[0_25px_60px_rgba(37,99,235,0.18)] flex items-center justify-center border border-slate-50 relative overflow-hidden">
                {/* Internal Shimmer Glow */}
                <motion.div 
                  animate={{ 
                    rotate: [0, 360],
                    opacity: [0.1, 0.3, 0.1] 
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-[-50%] bg-gradient-conic from-blue-500/20 via-transparent to-blue-500/20 z-0"
                />

                <svg 
                  width="72" 
                  height="72" 
                  viewBox="0 0 100 100" 
                  className="relative z-10 drop-shadow-2xl md:scale-125"
                >
                  <motion.path 
                    d="M10 85L35 15L55 65L75 15L95 85" 
                    stroke="#075985" 
                    strokeWidth="11" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      repeatType: "reverse",
                      ease: "easeInOut"
                    }}
                  />
                  <motion.path 
                    d="M20 60H35" 
                    stroke="#0ea5e9" 
                    strokeWidth="9" 
                    strokeLinecap="round" 
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ 
                      duration: 1.5, 
                      delay: 0.5,
                      repeat: Infinity, 
                      repeatType: "reverse",
                      ease: "easeInOut"
                    }}
                  />
                </svg>
             </div>
          </motion.div>
        </div>

        {/* Dynamic Floor Shadow */}
        <motion.div 
           animate={{ 
              scale: [1, 0.6, 1], 
              opacity: [0.2, 0.1, 0.2] 
           }}
           transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
           className="w-24 h-2.5 bg-slate-400 rounded-full blur-[6px] mt-4 opacity-20"
        />
      </div>
    </div>
  );
}
