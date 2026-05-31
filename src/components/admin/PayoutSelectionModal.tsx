"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PayoutSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: any[];
  onConfirm: (selectedIds: string[]) => void;
}

export function PayoutSelectionModal({ 
  isOpen, 
  onClose, 
  orders, 
  onConfirm 
}: PayoutSelectionModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const payoutReadyOrders = useMemo(() => {
    return orders.filter(o => 
      o.status === "REFUND_APPROVED" && 
      (
        (o.aspireOrderId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.userOrderId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.brandName || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [orders, searchQuery]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === payoutReadyOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(payoutReadyOrders.map(o => o._id));
    }
  };

  const totalAmount = useMemo(() => {
    return payoutReadyOrders
      .filter(o => selectedIds.includes(o._id))
      .reduce((acc, curr) => acc + (curr.refundDetails?.expectedPayout || 0), 0);
  }, [payoutReadyOrders, selectedIds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
        className="relative w-full max-w-4xl bg-[#F8FAFC] rounded-t-[40px] md:rounded-[40px] shadow-2xl flex flex-col overflow-hidden max-h-[95vh] md:max-h-[90vh]"
      >
        {/* Header Hook */}
        <div className="bg-white px-6 md:px-10 py-6 md:py-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0 relative">
           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
           <div className="text-center md:text-left relative z-10 flex items-center md:block gap-4">
              <button 
                onClick={onClose}
                className="md:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-900 active:scale-90 transition-transform"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="flex flex-col text-left md:block">
                 <div className="flex items-center gap-3 mb-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900 leading-none">Payout Hub</h2>
                 </div>
                 <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Verified Refunds • Ready for Batch</p>
              </div>
           </div>
           
           <div className="relative w-full md:w-80 z-10">
              <input 
                type="text" 
                placeholder="Search ready orders..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-12 text-[10px] font-black uppercase tracking-widest outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all"
              />
              <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
           </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-3 custom-scrollbar">
           {payoutReadyOrders.length > 0 ? (
             <>
               <div className="flex items-center justify-between px-4 mb-6">
                  <button 
                    onClick={toggleSelectAll}
                    className="flex items-center gap-3 group"
                  >
                     <div className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedIds.length === payoutReadyOrders.length ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200 group-hover:border-indigo-400'}`}>
                        {selectedIds.length === payoutReadyOrders.length && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                     </div>
                     <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Select All Ready ({payoutReadyOrders.length})</span>
                  </button>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedIds.length} Selected</span>
               </div>

               {payoutReadyOrders.map((order) => {
                 const isSelected = selectedIds.includes(order._id);
                 return (
                   <motion.div 
                     layout
                     key={order._id}
                     onClick={() => toggleSelect(order._id)}
                     className={`p-5 rounded-[24px] border transition-all cursor-pointer flex items-center justify-between gap-4 group ${isSelected ? 'bg-white border-indigo-200 shadow-md translate-x-1' : 'bg-white/50 border-slate-100 hover:border-slate-200'}`}
                   >
                      <div className="flex items-center gap-5">
                         <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-300 group-hover:bg-slate-200'}`}>
                            {isSelected && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                         </div>
                         <div>
                            <p className={`text-sm font-black uppercase tracking-tight leading-none ${isSelected ? 'text-indigo-600' : 'text-slate-900'}`}>{order.userOrderId || order.aspireOrderId}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{order.brandName || "DEAL"}</span>
                               <span className="h-1 w-1 rounded-full bg-slate-200" />
                               <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{order.productCode || "N/A"}</span>
                            </div>
                         </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                         <p className="text-[11px] font-black text-slate-900 leading-none">₹{(order.refundDetails?.expectedPayout || 0).toLocaleString()}</p>
                         <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-1">Verified</p>
                      </div>
                   </motion.div>
                 );
               })}
             </>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-200 mb-6">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest">No orders ready for payout</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 max-w-xs">All verified refunds have either been settled or are pending review.</p>
             </div>
           )}
        </div>

        {/* Footer Design */}
        <div className="bg-white p-6 md:p-10 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8 shrink-0 relative overflow-hidden mt-auto">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-100 to-transparent" />
           <div className="flex items-center justify-between md:justify-start w-full md:w-auto gap-10">
              <div className="flex flex-col">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Total Value</span>
                 <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">₹{totalAmount.toLocaleString()}</p>
              </div>
              <div className="h-8 w-px bg-slate-100 hidden md:block" />
              <div className="flex flex-col text-right md:text-left">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Items</span>
                 <p className="text-lg md:text-xl font-black text-indigo-600 leading-none">{selectedIds.length}</p>
              </div>
           </div>

           <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
              <button 
                onClick={onClose}
                className="w-full md:w-auto h-14 px-8 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-100"
              >
                Close Hub
              </button>
              <button 
                disabled={selectedIds.length === 0}
                onClick={() => onConfirm(selectedIds)}
                className="w-full md:w-auto h-16 px-12 bg-slate-900 text-white rounded-[22px] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/40 active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale"
              >
                Continue to Payment
              </button>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
