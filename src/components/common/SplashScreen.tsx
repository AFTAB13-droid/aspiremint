"use client";

import React from "react";
import { VaultCoinSplash } from "@/components/splash/VaultCoinSplash";
import { GlassPrismSplash } from "@/components/splash/GlassPrismSplash";
import { ParticleVortexSplash } from "@/components/splash/ParticleVortexSplash";
import { HolographicCardSplash } from "@/components/splash/HolographicCardSplash";
import { motion, AnimatePresence } from "framer-motion";

export type SplashOptionType = "option1" | "option2" | "option3" | "option4" | "legacy";

interface SplashScreenProps {
  activeOption?: SplashOptionType;
  soundEnabled?: boolean;
  onComplete?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  activeOption = "option1",
  soundEnabled = true,
  onComplete,
}) => {
  // Render chosen next-gen 3D animation
  if (activeOption === "option1") {
    return <VaultCoinSplash soundEnabled={soundEnabled} onComplete={onComplete} />;
  }
  if (activeOption === "option2") {
    return <GlassPrismSplash soundEnabled={soundEnabled} onComplete={onComplete} />;
  }
  if (activeOption === "option3") {
    return <ParticleVortexSplash soundEnabled={soundEnabled} onComplete={onComplete} />;
  }
  if (activeOption === "option4") {
    return <HolographicCardSplash soundEnabled={soundEnabled} onComplete={onComplete} />;
  }

  // Legacy fallback (Original Sky & Clouds)
  return <LegacySplashScreen onComplete={onComplete} />;
};

// Legacy fallback component
const LegacySplashScreen = ({ onComplete }: { onComplete?: () => void }) => {
  const [phase, setPhase] = React.useState(1);
  const [loadingText, setLoadingText] = React.useState("Initializing Core...");

  React.useEffect(() => {
    const t2 = setTimeout(() => setPhase(2), 600);
    const t3 = setTimeout(() => setPhase(3), 1600);

    const texts = [
      "Initialising Core...",
      "Syncing Secure Protocol...",
      "Preparing Sky-High UX...",
      "Ready to Fly.",
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
      exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] } }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden bg-gradient-to-b from-[#7dd3fc] via-[#bae6fd] to-white">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: "-20%", y: `${20 + i * 15}%`, opacity: 0.6 }}
            animate={{
              x: ["-20%", "120%"],
              opacity: [0, 0.6, 0.6, 0],
            }}
            transition={{
              duration: 20 + i * 5,
              repeat: Infinity,
              ease: "linear",
              delay: i * -4,
            }}
            className="absolute"
            style={{ scale: 1 + i * 0.2 }}
          >
            <div className="w-[300px] h-[100px] bg-white rounded-full blur-[40px] opacity-80" />
            <div className="w-[150px] h-[150px] bg-white rounded-full blur-[50px] opacity-70 absolute -top-10 left-10" />
          </motion.div>
        ))}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-yellow-100/30 rounded-full blur-[100px]" />
      </div>

      <div className="relative flex flex-col items-center">
        <motion.div
          style={{ transformStyle: "preserve-3d", perspective: 1200 }}
          animate={{
            rotateY: phase >= 1 ? 360 : 0,
            rotateX: phase >= 1 ? [0, 10, -10, 0] : 0,
            scale: phase >= 2 ? 1.05 : 1,
          }}
          transition={{
            rotateY: { duration: 1.5, ease: [0.22, 1, 0.36, 1] },
            rotateX: { repeat: Infinity, duration: 6, ease: "easeInOut" },
            scale: { duration: 0.5 },
          }}
          className="relative"
        >
          <div className="relative group">
            <svg
              width="140"
              height="140"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
            >
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
          </div>
        </motion.div>

        <div className="mt-12 flex flex-col items-center">
          <div className="flex items-center gap-1.5 overflow-hidden h-12">
            {"ASPIREMINT".split("").map((letter, i) => (
              <motion.span
                key={i}
                initial={{ y: 50, opacity: 0, scale: 0.5 }}
                animate={{
                  y: phase >= 2 ? 0 : 50,
                  opacity: phase >= 2 ? 1 : 0,
                  scale: phase >= 2 ? 1 : 0.5,
                  color: phase >= 3 ? ["#075985", "#0ea5e9", "#075985"] : "#0c4a6e",
                }}
                transition={{
                  y: { delay: i * 0.04, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
                  opacity: { delay: i * 0.04, duration: 0.5 },
                  scale: { delay: i * 0.04, duration: 0.5 },
                  color: { delay: i * 0.04, duration: 0.3 },
                }}
                className="text-3xl font-black text-slate-900 tracking-wider uppercase inline-block drop-shadow-lg cursor-default"
              >
                {letter}
              </motion.span>
            ))}
          </div>

          <div className="h-8 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={loadingText}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 0.7, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="text-[10px] font-black text-sky-700 uppercase tracking-[0.4em] mt-3 italic"
              >
                {loadingText}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
