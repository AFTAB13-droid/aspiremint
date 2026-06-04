"use client";

import React from "react";
import { PremiumLoader } from "@/components/common/PremiumLoader";

export default function LoaderTestPage() {
  return (
    <div className="fixed inset-0 z-[100]">
      <PremiumLoader />
      
      {/* Small UI hint to go back */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[110] animate-bounce">
        <a 
          href="/app"
          className="px-6 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-full shadow-2xl hover:scale-105 transition-all"
        >
          ← Exit Preview
        </a>
      </div>
    </div>
  );
}
