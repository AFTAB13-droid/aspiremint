"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CustomDropdown } from "@/components/ui/CustomDropdown";

interface BulkPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  count: number;
  totalAmount: number;
  onConfirm: (transactionId: string, paidBy: string) => void;
  loading: boolean;
  payers: { _id: string, name: string }[];
}

export function BulkPaymentModal({ 
  isOpen, 
  onClose,
  count,
  totalAmount, 
  onConfirm, 
  loading,
  payers = [] 
}: BulkPaymentModalProps) {
  const [transactionId, setTransactionId] = useState("");
  const [paidBy, setPaidBy] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(transactionId, paidBy);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 50 }}
        className="relative w-full max-w-xl bg-white rounded-[32px] md:rounded-[40px] shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
      >
        {/* Header Design */}
        <div className="bg-indigo-600 p-8 md:p-10 text-white relative shrink-0">
          <div className="absolute top-0 right-0 h-32 w-32 bg-white/10 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none" />
          
          <button 
            onClick={onClose}
            className="md:hidden absolute top-6 left-6 h-8 w-8 flex items-center justify-center rounded-full bg-white/10 border border-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all z-10"
          >
             <svg className="w-4 h-4 pr-[1px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
          </button>

          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-2 text-center md:text-left mt-6 md:mt-0">Payout Authorization</h2>
          <div className="flex flex-row items-center justify-center md:justify-start gap-4 md:gap-6 mt-4 md:mt-6 relative z-10">
             <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 md:px-5 py-3 flex-1 md:flex-none">
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-indigo-100 block mb-1">Items</span>
                <span className="text-lg md:text-xl font-black">{count}</span>
             </div>
             <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 md:px-5 py-3 flex-1 md:flex-none text-right md:text-left">
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-indigo-100 block mb-1">Refund Sum</span>
                <span className="text-lg md:text-xl font-black">₹{totalAmount.toLocaleString()}</span>
             </div>
          </div>
        </div>

        <div className="p-8 md:p-10 space-y-8 overflow-y-auto custom-scrollbar">
           <div className="space-y-6">
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Universal Transaction ID (Optional)</label>
                 <input 
                    type="text" 
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter Shared UTR / Transaction Reference"
                    className="w-full h-16 bg-slate-50 border border-slate-100 rounded-[22px] px-6 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all"
                 />
                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-2 ml-1">If empty, a batch-specific ID will be auto-generated</p>
              </div>

              <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Paid By (Refund Payer)</label>
                  <CustomDropdown 
                    options={payers.map(p => p.name)}
                    value={paidBy}
                    onChange={setPaidBy}
                    placeholder="Select Payer"
                    className="h-16"
                  />
               </div>
           </div>

           <div className="flex flex-col-reverse md:flex-row gap-3 md:gap-4 mt-2 md:mt-0">
              <button 
                onClick={onClose}
                className="w-full md:flex-1 h-14 md:h-16 bg-slate-50 text-slate-400 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all"
              >
                Abort
              </button>
              <button 
                disabled={loading || !paidBy}
                onClick={handleConfirm}
                className="w-full md:flex-[2] h-14 md:h-16 bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    <span>Authorize Batch Payment</span>
                  </>
                )}
              </button>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
