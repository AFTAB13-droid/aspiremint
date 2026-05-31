"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import animation404 from "../../public/animations/404.json";

const LottieAnimation = dynamic(() => import("@/components/ui/LottieAnimation"), { ssr: false });

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center"
      >
        {/* Lottie Animation Hub */}
        <div className="relative mb-8 h-64 w-full sm:h-80 lg:h-96">
           <LottieAnimation animationData={animation404} className="h-full w-full" />
        </div>

        {/* Branding Overlay */}
        <div className="absolute top-1/2 left-1/2 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-[100px]" />

        <h1 className="mb-4 text-5xl font-black tracking-tight text-slate-900 sm:text-6xl">
           LOST IN <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">CYBERSPACE</span>?
        </h1>
        
        <p className="mb-10 max-w-md text-lg font-medium text-slate-500">
           The page you are looking for has been moved, deleted, or never existed in the first place. Let's get you back home.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
           <Link href="/dashboard">
              <button className="rounded-2xl bg-slate-900 px-10 py-4 text-sm font-black uppercase tracking-widest text-white shadow-2xl shadow-slate-900/20 transition-all hover:bg-black active:scale-95">
                 Return to Base
              </button>
           </Link>
           <button 
              onClick={() => window.history.back()}
              className="rounded-2xl border border-slate-200 bg-white px-10 py-4 text-sm font-black uppercase tracking-widest text-slate-500 transition-all hover:bg-slate-50 active:scale-95"
           >
              Previous Sync
           </button>
        </div>
      </motion.div>

      {/* Floating Elements Background */}
      <div className="fixed inset-0 -z-50 pointer-events-none">
         <div className="absolute top-1/4 left-1/4 h-2 w-2 rounded-full bg-blue-400/20 animate-pulse" />
         <div className="absolute bottom-1/4 right-1/4 h-3 w-3 rounded-full bg-indigo-400/20 animate-pulse delay-700" />
         <div className="absolute top-1/2 right-1/3 h-1 w-1 rounded-full bg-slate-400/20 animate-pulse delay-300" />
      </div>
    </div>
  );
}
