"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { SplashScreen, SplashOptionType } from "./SplashScreen";
import { splashSoundEngine } from "@/utils/splashSound";

export default function SplashController({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false);
  const [activeOption, setActiveOption] = useState<SplashOptionType>("option1");
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    // Check if splash was already shown in this session
    const hasShownSplash = sessionStorage.getItem("aspireMint_splash_shown");

    if (!hasShownSplash) {
      setShowSplash(true);

      // Attempt to unlock audio context on earliest touch/click
      const unlockAudio = () => {
        splashSoundEngine.unlock();
      };
      window.addEventListener("pointerdown", unlockAudio, { once: true });
      window.addEventListener("keydown", unlockAudio, { once: true });

      // Fetch dynamic configuration from API
      fetch("/api/splash-config")
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && data.config?.activeOption) {
            setActiveOption(data.config.activeOption as SplashOptionType);
            if (data.config.soundEnabled !== undefined) {
              setSoundEnabled(data.config.soundEnabled);
            }
          }
        })
        .catch(() => {});

      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem("aspireMint_splash_shown", "true");
      }, 2600);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("pointerdown", unlockAudio);
        window.removeEventListener("keydown", unlockAudio);
      };
    }
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen
            key="active-splash"
            activeOption={activeOption}
            soundEnabled={soundEnabled}
            onComplete={() => {
              setShowSplash(false);
              sessionStorage.setItem("aspireMint_splash_shown", "true");
            }}
          />
        )}
      </AnimatePresence>

      <div className={showSplash ? "hidden" : "block"}>{children}</div>
    </>
  );
}
