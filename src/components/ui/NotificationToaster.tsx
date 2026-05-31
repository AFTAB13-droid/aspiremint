"use client";

import React, { useEffect, useState } from "react";
import { Toaster, toast, Toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, CheckCircle2, AlertCircle, ShieldCheck, Info } from "lucide-react";

const Timeline = ({ duration, onComplete }: { duration: number, onComplete: () => void }) => {
  return (
    <motion.div 
      initial={{ width: "100%" }}
      animate={{ width: "0%" }}
      transition={{ duration: duration / 1000, ease: "linear" }}
      onAnimationComplete={onComplete}
      className="absolute bottom-0 left-0 h-1.5 bg-white/30 backdrop-blur-sm"
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
                /* 🔔 SYSTEM NOTIFICATION STYLE */
                <div className="relative overflow-hidden flex w-full max-w-[440px] bg-slate-900/95 backdrop-blur-3xl shadow-[0_40px_80px_rgba(0,0,0,0.4)] rounded-[32px] border border-white/10 ring-1 ring-white/5 mx-4">
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
                  {/* Timeline Strip (Fail-safe dismiss) */}
                  <Timeline 
                    duration={t.duration || 6000} 
                    onComplete={() => toast.dismiss(t.id)} 
                  />
                </div>
              ) : (
                /* ✅/❌ ACTION TOAST STYLE (Compact, Colored, Timeline) */
                <div className={`
                  relative overflow-hidden w-full max-w-[380px] mx-4
                  rounded-[24px] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.25)] p-4 md:p-5
                  flex items-center gap-4
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
                   
                   {/* Timeline Strip (Fail-safe dismiss) */}
                   <Timeline 
                     duration={t.duration || 4000} 
                     onComplete={() => toast.dismiss(t.id)} 
                   />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </Toaster>
  );
}
