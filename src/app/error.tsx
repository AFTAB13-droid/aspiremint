"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import animationError from "../../public/animations/error.json";

const LottieAnimation = dynamic(() => import("@/components/ui/LottieAnimation"), { ssr: false });

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center"
      >
        {/* Lottie Animation Hub */}
        <div className="relative mb-6 h-64 w-full sm:h-80 lg:h-96">
           <LottieAnimation animationData={animationError} className="h-full w-full" />
        </div>

        <h1 className="mb-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl uppercase">
           SYSTEM <span className="text-red-600">MALFUNCTION</span>
        </h1>
        
        <p className="mb-8 max-w-md text-lg font-medium text-slate-500">
           A fatal error occurred in the system core. Our mediators have been notified. Please try to re-sync or return to home.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
           <button 
              onClick={() => reset()}
              className="rounded-2xl bg-indigo-600 px-10 py-4 text-sm font-black uppercase tracking-widest text-white shadow-2xl shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-95"
           >
              Try to Re-Sync
           </button>
           <Link href="/dashboard">
              <button className="rounded-2xl border border-slate-200 bg-white px-10 py-4 text-sm font-black uppercase tracking-widest text-slate-500 transition-all hover:bg-slate-50 active:scale-95">
                 Emergency Home
              </button>
           </Link>
        </div>
        
        {error.digest && (
           <p className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
              Error Hash: {error.digest}
           </p>
        )}
      </motion.div>

      {/* Grid Pattern Background */}
      <div className="fixed inset-0 -z-50 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '40px 40px' }} />
    </div>
  );
}
