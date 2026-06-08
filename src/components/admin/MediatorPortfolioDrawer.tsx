"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/Skeleton";
import formatDate from "@/utils/formatDate";

interface MediatorPortfolioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mediator: any;
}

export function MediatorPortfolioDrawer({ isOpen, onClose, mediator }: MediatorPortfolioDrawerProps) {
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<any[]>([]);
  const [portfolioTab, setPortfolioTab] = useState<"live" | "completed">("live");

  useEffect(() => {
    if (isOpen && mediator) {
      const fetchDeals = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/orders?mediatorId=${mediator._id}`);
          const json = await res.json();
          if (json.success) setDeals(json.data);
        } catch (err) {
          console.error("Failed to load portfolio deals");
        } finally {
          setLoading(false);
        }
      };
      fetchDeals();
    }
  }, [isOpen, mediator]);

  const filteredDeals = useMemo(() => {
    if (portfolioTab === "live") {
      return deals.filter(d => d.status !== "COMPLETED" && d.status !== "CANCELLED");
    }
    return deals.filter(d => d.status === "COMPLETED");
  }, [deals, portfolioTab]);

  return (
    <AnimatePresence>
      {isOpen && mediator && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-indigo-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-[101] w-full max-w-2xl bg-slate-50 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Advanced Header */}
            <div className="relative bg-white border-b border-slate-100 overflow-hidden">
               {/* Aesthetic Background Elements */}
               <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-600 to-purple-700 opacity-90" />
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 mix-blend-overlay" />
               
               <button onClick={onClose} className="absolute right-6 top-6 h-10 w-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/40 transition-all z-10 border border-white/10">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>

               <div className="px-8 pb-8 pt-20 relative z-10 flex items-end gap-6">
                  {/* Large Avatar with Glow */}
                  <div className="relative group">
                     <div className="absolute inset-0 bg-indigo-500 rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
                     <div className="relative h-28 w-28 rounded-3xl bg-white border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                           <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-purple-600 uppercase">
                              {(mediator.systemDisplayName || mediator.name).charAt(0)}
                           </span>
                        </div>
                     </div>
                  </div>

                  <div className="flex-1 pb-2">
                     <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">{mediator.systemDisplayName || mediator.name}</h2>
                        <span className="px-3 py-1 bg-gradient-to-r from-amber-200 to-yellow-400 rounded-full text-[9px] font-black text-amber-900 uppercase tracking-widest shadow-sm">Verified PRO</span>
                     </div>
                     <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">{mediator.email}</p>
                     
                     <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-100">
                           <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                           </span>
                           <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Active Access</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sys ID:</span>
                           <span className="text-[9px] font-black text-slate-700">{mediator.aspireMintId || "N/A"}</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
               {/* Performance Summary Calculation */}
               {(() => {
                 const total = deals.length;
                 const completed = deals.filter(d => d.status === 'COMPLETED').length;
                 const rate = total > 0 ? ((completed / total) * 100).toFixed(1) : "0.0";
                 
                 return (
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                        <svg className="w-8 h-8 text-emerald-500 mb-4 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 relative z-10">Success Rate</p>
                        <p className="text-3xl font-black text-emerald-600 tracking-tight relative z-10">{rate}%</p>
                     </div>
                     <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                        <svg className="w-8 h-8 text-blue-500 mb-4 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 relative z-10">Total Deals</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tight relative z-10">{total}</p>
                     </div>
                     <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                        <svg className="w-8 h-8 text-indigo-500 mb-4 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 relative z-10">Avg Speed</p>
                        <p className="text-3xl font-black text-indigo-600 tracking-tight relative z-10">{total > 0 ? "2.4d" : "N/A"}</p>
                     </div>
                   </div>
                 );
               })()}

               {/* Tabs Section */}
               <div className="flex items-center justify-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit mx-auto">
                  <button 
                    onClick={() => setPortfolioTab("live")}
                    className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${portfolioTab === "live" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    Live Assignments
                  </button>
                  <button 
                    onClick={() => setPortfolioTab("completed")}
                    className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${portfolioTab === "completed" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    Completed
                  </button>
               </div>

               {/* Active Management Table */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Assignment Portfolio</h3>
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredDeals.length} {portfolioTab === "live" ? "Active" : "Archived"} Records</span>
                  </div>

                  {loading ? (
                    <div className="space-y-3">
                       {[1,2,3].map(i => <Skeleton className="h-20 w-full rounded-2xl" />)}
                    </div>
                  ) : filteredDeals.length === 0 ? (
                    <div className="bg-white rounded-[32px] py-12 text-center border-2 border-dashed border-slate-100">
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No {portfolioTab} records found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                       {filteredDeals.map((deal) => (
                         <div key={deal._id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-indigo-100 transition-all flex items-center justify-between group">
                            <div className="flex flex-col text-left">
                               <div className="flex items-center gap-1.5">
                                   <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{deal.merchantOrderId || deal.userOrderId}</span>
                                   {deal.assignmentType === 'AUTO' && (
                                     <span className="text-[7px] font-black text-emerald-600 uppercase tracking-tighter px-1 py-0.5 bg-emerald-50 rounded border border-emerald-100 leading-none">System</span>
                                   )}
                                </div>

                               <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{deal.brandName} - {deal.productCode}</span>
                            </div>
                            <div className="flex items-center gap-4">
                               <div className="text-right hidden sm:block">
                                  <p className="text-[10px] font-black text-slate-900 leading-none">{formatDate(deal.createdAt)}</p>
                                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Assigned</p>
                               </div>
                               <span className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border ${portfolioTab === 'live' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                  {portfolioTab === 'live' ? 'In Escrow' : 'Released'}
                               </span>
                            </div>
                         </div>
                       ))}
                    </div>
                  )}
               </div>
            </div>

            {/* Footer Actions */}
            <div className="p-8 bg-white border-t border-slate-100 flex items-center gap-4">
               <button className="flex-1 h-14 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm hover:bg-red-100 transition-all">
                  Suspend Access
               </button>
               <button className="flex-1 h-14 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all">
                  Email Summary Report
               </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
