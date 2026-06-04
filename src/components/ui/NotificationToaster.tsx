"use client";

import React, { useEffect, useState } from "react";
import { Toaster, toast, Toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, CheckCircle2, AlertCircle, ShieldCheck, Info } from "lucide-react";

const Timeline = ({ duration, onComplete, className = "bg-white/30" }: { duration: number, onComplete: () => void, className?: string }) => {
  return (
    <motion.div 
      initial={{ width: "100%" }}
      animate={{ width: "0%" }}
      transition={{ duration: duration / 1000, ease: "linear" }}
      onAnimationComplete={onComplete}
      className={`absolute bottom-0 left-0 h-1 ${className} backdrop-blur-sm`}
    />
  );
};

export function NotificationToaster() {
  return (
    <Toaster 
      position="top-right" 
      toastOptions={{
         duration: 4000,
         style: { background: 'transparent', boxShadow: 'none', padding: 0 }
      }}
    >
      {(t) => (
        <AnimatePresence mode="wait">
          {t.visible && (
            <motion.div
              layout
              initial={{ 
                opacity: 0, 
                x: typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : 80,
                y: typeof window !== 'undefined' && window.innerWidth < 768 ? -50 : 0,
                scale: 0.9 
              }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ 
                opacity: 0, 
                x: typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : 80,
                scale: 0.8, 
                transition: { duration: 0.15 } 
              }}
              className="pointer-events-auto w-full flex justify-end"
            >
              {t.type === 'blank' ? (
                /* 🔔 SYSTEM/BLANK NOTIFICATION STYLE */
                <div className="w-full flex justify-end">
                  {/* DESKTOP LAYOUT (Clean Dark Theme) */}
                  <div className="hidden md:flex relative overflow-hidden w-full max-w-[440px] bg-slate-900/95 backdrop-blur-3xl shadow-[0_40px_80px_rgba(0,0,0,0.4)] rounded-[32px] border border-white/10 ring-1 ring-white/5 mx-4">
                    <div className="p-7 flex items-start gap-6 w-full relative">
                      <div className="flex-shrink-0">
                        <div className="w-14 h-14 rounded-[22px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30">
                           <Bell className="w-7 h-7" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        {typeof t.message === 'string' && t.message.includes('|') ? (
                          <>
                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-1.5">Notification</h4>
                            <p className="text-base font-black text-white uppercase tracking-tight mb-1 leading-tight">{t.message.split('|')[0]}</p>
                            <p className="text-xs font-bold text-slate-400 leading-snug">{t.message.split('|')[1]}</p>
                          </>
                        ) : (
                          <p className="text-base font-black text-white tracking-tight leading-tight">
                            {t.message as any}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => toast.dismiss(t.id)}
                        className="absolute top-5 right-5 h-10 w-10 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <Timeline 
                      duration={t.duration || 6000} 
                      onComplete={() => toast.dismiss(t.id)} 
                    />
                  </div>

                  {/* MOBILE LAYOUT (Premium iOS-style Frosted Glass Push Banner) */}
                  <div className="flex md:hidden relative overflow-hidden w-[90vw] max-w-[390px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-[0_16px_36px_rgba(0,0,0,0.15)] rounded-[26px] border border-slate-200/60 dark:border-white/15 p-4 flex-col gap-2.5 mx-auto">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-sm">
                          <Bell className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">AspireMint</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black opacity-55">now</span>
                        <button 
                          onClick={() => toast.dismiss(t.id)}
                          className="h-6 w-6 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white active:scale-90 transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200/30 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Bell className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-2">
                        {typeof t.message === 'string' && t.message.includes('|') ? (
                          <>
                            <p className="text-xs font-black text-slate-900 dark:text-white tracking-tight leading-snug">{t.message.split('|')[0]}</p>
                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-snug mt-0.5">{t.message.split('|')[1]}</p>
                          </>
                        ) : (
                          <p className="text-xs font-black text-slate-900 dark:text-white tracking-tight leading-snug break-words">
                            {t.message as any}
                          </p>
                        )}
                      </div>
                    </div>
                    <Timeline 
                      duration={t.duration || 6000} 
                      onComplete={() => toast.dismiss(t.id)} 
                      className="bg-indigo-600/20 dark:bg-white/20"
                    />
                  </div>
                </div>
              ) : (
                /* ✅/❌ ACTION TOAST STYLE */
                <div className="w-full flex justify-end">
                  {/* DESKTOP LAYOUT (Compact Colored Background Alert) */}
                  <div className={`
                    hidden md:flex relative overflow-hidden w-full max-w-[380px] mx-4
                    rounded-[24px] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.25)] p-4 md:p-5
                    items-center gap-4
                    ${t.type === 'success' ? 'bg-emerald-600' : t.type === 'error' ? 'bg-rose-600' : 'bg-blue-600'}
                    text-white border-2 border-white/20
                  `}>
                     <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                           {t.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : t.type === 'error' ? <AlertCircle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                        </div>
                     </div>
                     <div className="flex-1 min-w-0">
                        <h4 className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60 mb-0.5">
                          {t.type === 'success' ? 'Validated' : t.type === 'error' ? 'Security Alert' : 'System Notice'}
                        </h4>
                        <p className="text-sm font-black uppercase tracking-tight leading-snug break-words">
                          {t.message as any}
                        </p>
                     </div>
                     <button 
                       onClick={() => toast.dismiss(t.id)}
                       className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all flex-shrink-0"
                     >
                        <X className="w-4 h-4" />
                     </button>
                     <Timeline 
                       duration={t.duration || 4000} 
                       onComplete={() => toast.dismiss(t.id)} 
                     />
                  </div>

                  {/* MOBILE LAYOUT (Premium iOS-style Frosted Glass with Colored Themed Border & Icon) */}
                  <div className={`
                    flex md:hidden relative overflow-hidden w-[90vw] max-w-[390px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl 
                    shadow-[0_16px_36px_rgba(0,0,0,0.15)] rounded-[26px] border border-slate-200/60 dark:border-white/15 p-4 flex-col gap-2.5 mx-auto
                    border-l-4 ${t.type === 'success' ? 'border-l-emerald-500' : t.type === 'error' ? 'border-l-rose-500' : 'border-l-blue-500'}
                  `}>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white shadow-sm
                          ${t.type === 'success' ? 'bg-emerald-600' : t.type === 'error' ? 'bg-rose-600' : 'bg-blue-600'}
                        `}>
                          {t.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : t.type === 'error' ? <AlertCircle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                          {t.type === 'success' ? 'AspireMint Alert' : t.type === 'error' ? 'Security Alert' : 'System Alert'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black opacity-55">now</span>
                        <button 
                          onClick={() => toast.dismiss(t.id)}
                          className="h-6 w-6 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white active:scale-90 transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center
                        ${t.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100/30 dark:border-emerald-500/20 text-emerald-500' : 
                          t.type === 'error' ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-100/30 dark:border-rose-500/20 text-rose-500' : 
                          'bg-blue-50 dark:bg-blue-500/10 border-blue-100/30 dark:border-blue-500/20 text-blue-500'}
                      `}>
                        {t.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : t.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug break-words">
                          {t.message as any}
                        </p>
                      </div>
                    </div>
                    <Timeline 
                      duration={t.duration || 4000} 
                      onComplete={() => toast.dismiss(t.id)} 
                      className={t.type === 'success' ? 'bg-emerald-500/20' : t.type === 'error' ? 'bg-rose-500/20' : 'bg-blue-500/20'}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </Toaster>
  );
}
