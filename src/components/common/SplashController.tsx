"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { SplashScreen } from "./SplashScreen";

export default function SplashController({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // Check if splash was already shown in this session
    const hasShownSplash = sessionStorage.getItem("aspireMint_splash_shown");
    
    if (!hasShownSplash) {
      setShowSplash(true);
      
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem("aspireMint_splash_shown", "true");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen key="splash" />}
      </AnimatePresence>
      
      {/* 
        We keep the children rendered but hidden (or just render them after) 
        to ensure background loading doesn't cause a jarring flash 
      */}
      <div className={showSplash ? "hidden" : "block"}>
        {children}
      </div>
    </>
  );
}
