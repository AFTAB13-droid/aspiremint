"use client";

import React, { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

export function InstallPWA({ variant = "sidebar" }: { variant?: "sidebar" | "mobile" | "desktop_collapsed" }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker for PWA compliance
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration('/').then((reg) => {
        if (!reg) {
            navigator.serviceWorker.register('/sw.js').catch((err) => console.log('SW registration skipped: ', err));
        }
      });
    }

    // 2. Check if already installed & running in standalone mode
    if (
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
    }

    // 3. Detect iOS Safari to show manual instructions sheet
    const ua = window.navigator.userAgent.toLowerCase();
    const isIpad = /ipad/.test(ua) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /macintosh/.test(ua));
    const isIphone = /iphone|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/crios|fxios|opios|twitter|fbios/.test(ua);
    
    setIsIOS(!!((isIphone || isIpad) && isSafari));

    // 4. Listen for native browser PWA install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setIsInstalled(true);
    };
    
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstalled) {
      toast.success("App is already installed! Check your home screen.");
      return;
    }

    // If Apple iOS user, show beautiful manual instruction sheet instead of throwing error toast
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      toast.error("Browser install prompt unavailable. Try installing via browser menu.");
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
        toast.success("Installation started successfully!");
      }
    } catch (err) {
      console.error("Native installation error:", err);
    }
  };

  // --- Resilient Visibility Guards ---
  // Hide if already running in PWA standalone mode
  if (isInstalled) return null;
  
  // Hide completely if direct install is unsupported AND it's not iOS Safari
  // This keeps the site UI 100% clean and prevents showing non-functional buttons on incompatible browsers
  if (!isInstallable && !isIOS) return null;

  return (
    <>
      {/* 1. RENDER INSTALL BUTTON CORRESPONDING TO UI VARIANT */}
      {variant === "mobile" ? (
        <button 
          onClick={handleInstallClick}
          className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-600/20 mb-3"
        >
          <Download className="w-4 h-4 animate-pulse" />
          Install App
        </button>
      ) : variant === "desktop_collapsed" ? (
        <motion.button 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={handleInstallClick}
          title="Install App"
          className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg transition-all hover:scale-110 mb-2 cursor-pointer"
        >
          <Download className="h-5 w-5 animate-pulse" />
        </motion.button>
      ) : (
        <motion.button 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleInstallClick}
          className="group relative flex w-full items-center justify-center rounded-2xl py-4 transition-all duration-300 bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-[0_10px_25px_-5px_rgba(79,70,229,0.3)] hover:shadow-[0_15px_30px_-5px_rgba(79,70,229,0.4)] hover:-translate-y-0.5 mb-2 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Download className="w-4 h-4 shrink-0 group-hover:animate-bounce" />
            <span className="text-[12px] font-black tracking-[0.1em] uppercase">
              Install App
            </span>
          </div>
        </motion.button>
      )}

      {/* 2. Apple iOS Safari Custom PWA Instructions Modal */}
      <AnimatePresence>
        {showIOSInstructions && (
          <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIOSInstructions(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-sm rounded-[34px] bg-white p-6 shadow-3xl text-slate-800 border border-slate-100 flex flex-col gap-5 z-10"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Install AspireMint</h3>
                <button 
                  onClick={() => setShowIOSInstructions(false)}
                  className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold hover:bg-slate-200 transition-all text-xs"
                >
                  ✕
                </button>
              </div>
              <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-wide">
                iOS Safari does not support direct installation. Add it manually to your home screen:
              </p>
              <div className="space-y-4 pt-1 font-sans">
                <div className="flex gap-4 items-start">
                  <span className="h-7 w-7 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 font-black text-xs flex items-center justify-center shrink-0 font-mono">1</span>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-700 leading-snug">
                    Tap the <span className="text-indigo-600 font-extrabold">Share</span> button <span className="inline-block p-1 bg-slate-100 rounded-md">📤</span> in your Safari toolbar.
                  </p>
                </div>
                <div className="flex gap-4 items-start">
                  <span className="h-7 w-7 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 font-black text-xs flex items-center justify-center shrink-0 font-mono">2</span>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-700 leading-snug">
                    Scroll down the share sheet menu and select <span className="text-indigo-600 font-extrabold">Add to Home Screen</span> <span className="inline-block px-1.5 py-0.5 bg-slate-100 rounded-md">➕</span>.
                  </p>
                </div>
                <div className="flex gap-4 items-start">
                  <span className="h-7 w-7 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 font-black text-xs flex items-center justify-center shrink-0 font-mono">3</span>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-700 leading-snug">
                    Tap <span className="text-indigo-600 font-extrabold">Add</span> in the top-right corner to complete!
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowIOSInstructions(false)}
                className="w-full h-12 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all mt-2 cursor-pointer shadow-lg hover:bg-slate-800"
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
