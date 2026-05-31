"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function RegistrationPendingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full bg-white rounded-[40px] p-8 md:p-12 shadow-2xl border border-slate-100 text-center"
      >
        <div className="mb-8 flex justify-center">
          <div className="h-20 w-20 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
            <svg className="w-10 h-10 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-4">
          Application Received
        </h1>
        
        <p className="text-lg font-medium text-slate-500 leading-relaxed mb-8">
          Welcome to the AspireMint specialist network. Your registration as a <span className="text-indigo-600 font-bold">Mediator</span> is currently under manual review by our administration team.
        </p>

        <div className="bg-indigo-50/50 rounded-3xl p-6 mb-8 text-left border border-indigo-100/50">
          <h2 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-3">Next Steps:</h2>
          <ul className="space-y-3">
            {[
              "Profile verification by AspireMint Admin",
              "Compliance and background audit",
              "Account activation via email notification"
            ].map((step, i) => (
              <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                {step}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm font-bold text-slate-400 mb-8 italic">
          Typical review time is 12-24 business hours. You will not be able to log in until your account is approved.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/login" className="flex-1">
            <button className="w-full py-4 px-8 rounded-2xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95">
              Back to Login
            </button>
          </Link>
          <button className="flex-1 py-4 px-8 rounded-2xl bg-white border border-slate-200 text-slate-600 font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95">
            Contact Support
          </button>
        </div>
      </motion.div>
    </div>
  );
}
