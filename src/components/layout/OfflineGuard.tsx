"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import animationOffline from "../../../public/animations/offline.json";

const LottieAnimation = dynamic(() => import("@/components/ui/LottieAnimation"), { ssr: false });

export default function OfflineGuard({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    if (!navigator.onLine) setIsOffline(true);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white p-6 text-center"
          >
            <motion.div 
               initial={{ scale: 0.9 }} 
               animate={{ scale: 1 }}
               className="flex w-full max-w-lg flex-col items-center"
            >
               <div className="h-64 w-full sm:h-80">
                  <LottieAnimation animationData={animationOffline} className="h-full w-full" />
               </div>
               
               <h2 className="mb-4 text-3xl font-black tracking-tight text-slate-900 uppercase">
                  CONNECTION <span className="text-blue-600">SEVERED</span>
               </h2>
               
               <p className="mb-8 text-lg font-medium text-slate-500">
                  Your device lost sync with AspireMint. Please check your internet connection to resume active management.
               </p>

               <div className="flex items-center gap-3 rounded-2xl bg-blue-50 px-6 py-3 text-sm font-bold text-blue-600 animate-pulse">
                  <div className="h-2 w-2 rounded-full bg-blue-600" />
                  Attempting to Re-Sync...
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}
