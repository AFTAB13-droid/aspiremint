"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface EditAmountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newAmount: number) => Promise<void>;
  currentAmount: number;
  baseAmount: number;
  orderId: string;
}

export function EditAmountModal({
  isOpen,
  onClose,
  onConfirm,
  currentAmount,
  baseAmount,
  orderId,
}: EditAmountModalProps) {
  const [newAmount, setNewAmount] = useState(currentAmount.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewAmount(currentAmount.toString());
    }
  }, [currentAmount, isOpen]);

  const updatedRefund = Number(baseAmount || 0) + Number(newAmount || 0);

  const handleConfirm = async () => {
    if (isNaN(Number(newAmount))) return;
    setIsSubmitting(true);
    try {
      await onConfirm(Number(newAmount));
      onClose();
    } catch (err) {
      console.error("Failed to sync amount:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-[40px] bg-white p-8 shadow-2xl border border-white"
          >
            <div className="absolute top-0 right-0 h-32 w-32 bg-blue-50/50 rounded-bl-[80px] -mr-8 -mt-8" />
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Sync Adjustment</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                    Ref: {orderId}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-6 bg-slate-50/80 rounded-[32px] border border-slate-100/50 shadow-inner group transition-all focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-600/5 focus-within:border-blue-600/20">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2.5 ml-1">New Commission/Less Amount</label>
                  <div className="relative">
                    <span className={`absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-black transition-colors duration-500 ${Number(newAmount) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>₹</span>
                    <input 
                      type="number"
                      step="0.01"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      className={`w-full bg-transparent pl-8 text-3xl font-black outline-none placeholder:text-slate-200 transition-colors duration-500 ${Number(newAmount) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                      placeholder="0.00"
                      autoFocus
                    />
                  </div>
                  <div className="mt-4 flex items-center gap-2 px-1">
                     <div className={`h-1.5 w-1.5 rounded-full transition-colors ${Number(newAmount) >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                        Note: <span className="text-emerald-500">Positive</span> for commission, <span className="text-rose-500">Negative (-)</span> for less deduction.
                     </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-5 rounded-[28px] bg-indigo-50/40 border border-indigo-100/50">
                      <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">Base Price</p>
                      <p className="text-lg font-black text-slate-900 tracking-tight leading-none">₹{baseAmount.toLocaleString()}</p>
                   </div>
                   <div className="p-5 rounded-[28px] bg-emerald-50/40 border border-emerald-100/50">
                      <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1.5">New Refund</p>
                      <p className="text-lg font-black text-emerald-600 tracking-tight leading-none">₹{updatedRefund.toLocaleString()}</p>
                   </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-16 rounded-[24px] bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 border border-slate-100/50"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleConfirm}
                  disabled={isSubmitting || isNaN(Number(newAmount))}
                  className="flex-[2] h-16 rounded-[24px] bg-slate-900 text-[10px] font-black text-white uppercase tracking-widest shadow-2xl shadow-slate-900/20 active:scale-95 transition-all disabled:opacity-50 group relative overflow-hidden"
                >
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    )}
                    {isSubmitting ? "SYNCHRONIZING..." : "CONFIRM UPDATE"}
                  </div>
                </button>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-50">
               <p className="text-[8px] font-bold text-slate-400 text-center uppercase tracking-[0.2em] italic">
                  Changes will trigger global earnings and refund amount recalculation.
               </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
