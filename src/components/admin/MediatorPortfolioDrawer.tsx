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
            {/* Header */}
            <div className="bg-white p-8 border-b border-slate-100 relative">
               <button onClick={onClose} className="absolute right-8 top-8 h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>

               <div className="flex flex-col">
                  <div>
                     <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{mediator.name}</h2>
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-[9px] font-black text-indigo-600 uppercase tracking-widest">PRO MEDIATOR</span>
                     </div>
                     <p className="text-slate-500 font-medium text-sm mt-1">{mediator.email}</p>
                     <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5">
                           <span className="h-2 w-2 rounded-full bg-emerald-500" />
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Status</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                           <span className="text-[10px] font-black text-slate-900 leading-none">ID:</span>
                           <span className="text-[10px] font-bold text-slate-500 leading-none">{mediator.aspireMintId || "N/A"}</span>
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
                   <div className="grid grid-cols-3 gap-4">
                     <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Success Rate</p>
                        <p className="text-2xl font-black text-emerald-600">{rate}%</p>
                     </div>
                     <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Deals</p>
                        <p className="text-2xl font-black text-slate-900">{total}</p>
                     </div>
                     <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Avg Speed</p>
                        <p className="text-2xl font-black text-indigo-600">{total > 0 ? "2.4d" : "N/A"}</p>
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
