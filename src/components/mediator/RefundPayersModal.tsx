"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface Payer {
  _id: string;
  name: string;
  detail?: string;
}

interface RefundPayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  payers: Payer[];
  onAdd: (name: string, detail: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

export function RefundPayersModal({ 
  isOpen, 
  onClose, 
  payers, 
  onAdd, 
  onRemove 
}: RefundPayersModalProps) {
  const [newName, setNewName] = useState("");
  const [newDetail, setNewDetail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim()) return toast.error("Name is required");
    setLoading(true);
    try {
      await onAdd(newName, newDetail);
      setNewName("");
      setNewDetail("");
      toast.success("Payer added");
    } catch (err) {
      toast.error("Failed to add payer");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
      />
      
      <motion.div 
        initial={typeof window !== 'undefined' && window.innerWidth < 768 ? { y: "100%" } : { scale: 0.9, opacity: 0, y: 50 }}
        animate={typeof window !== 'undefined' && window.innerWidth < 768 ? { y: 0 } : { scale: 1, opacity: 1, y: 0 }}
        exit={typeof window !== 'undefined' && window.innerWidth < 768 ? { y: "100%" } : { scale: 0.9, opacity: 0, y: 50 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-lg bg-white rounded-t-[40px] md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] pt-4 md:pt-0"
      >
        <div className="bg-emerald-600 p-8 md:p-10 text-white relative shrink-0">
          <div className="absolute top-0 right-0 h-32 w-32 bg-white/10 blur-3xl rounded-full -mr-10 -mt-10" />
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-center md:text-left relative z-10">Payer Registry</h2>
          <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100 mt-1 text-center md:text-left relative z-10">Account Management • Settlements</p>
        </div>

        <div className="p-6 md:p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
          {/* Add New Payer */}
          <div className="space-y-4 bg-slate-50/50 p-6 rounded-[32px] border border-slate-100">
             <div className="grid grid-cols-1 gap-4">
                <div>
                   <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Payer Identity</label>
                   <input 
                      type="text" 
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-5 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100 transition-all"
                   />
                </div>
                <div>
                   <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Account Detail</label>
                   <input 
                      type="text" 
                      value={newDetail}
                      onChange={(e) => setNewDetail(e.target.value)}
                      placeholder="UPI / Bank / Note"
                      className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-5 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100 transition-all"
                   />
                </div>
             </div>
             <button 
                onClick={handleAdd}
                disabled={loading}
                className="w-full h-14 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
             >
                Register Account
             </button>
          </div>

          {/* List Payers */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Payers</h3>
               <span className="text-[9px] font-black text-slate-300 uppercase">{payers.length} TOTAL</span>
            </div>
            <div className="space-y-3">
              {payers.length === 0 ? (
                <div className="py-12 text-center bg-white rounded-[32px] border border-dashed border-slate-200">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No accounts registered</p>
                </div>
              ) : (
                payers.map((p) => (
                  <motion.div 
                    layout
                    key={p._id} 
                    className="group flex items-center justify-between p-5 bg-white rounded-[24px] border border-slate-100 hover:border-emerald-200 shadow-sm transition-all"
                  >
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">{p.name}</p>
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1.5">{p.detail || "NO DETAILS"}</p>
                    </div>
                    <button 
                      onClick={() => onRemove(p._id)}
                      className="h-10 w-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all md:opacity-0 group-hover:opacity-100"
                    >
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 pt-0 mt-auto shrink-0">
           <button 
              onClick={onClose}
              className="w-full h-14 md:h-16 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-900/10 hover:bg-black transition-all"
           >
              Dismiss
           </button>
        </div>
      </motion.div>
    </div>
  );
}
