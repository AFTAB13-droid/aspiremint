"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/Skeleton";
import toast from "react-hot-toast";

interface Order {
  _id: string;
  aspireOrderId: string;
  brandName: string;
  amount: number;
  status: string;
  createdAt: string;
  productCode: string;
}

interface UserHistoryModalProps {
  user: any;
  onClose: () => void;
}

export function UserHistoryModal({ user, onClose }: UserHistoryModalProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/orders?buyerId=${user._id}`);
        const json = await res.json();
        if (json.success) {
          setOrders(json.data);
        }
      } catch (error) {
        toast.error("Failed to load history");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user._id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-green-500";
      case "CANCELLED":
      case "REFUND_REJECTED": return "bg-red-500";
      case "REFUND_APPROVED": return "bg-amber-500";
      default: return "bg-indigo-500";
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
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
        className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-3 w-3 rounded-full bg-indigo-600 animate-pulse" />
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Order History</h2>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{user.name}</h3>
            <p className="text-xs font-bold text-slate-400 mt-0.5">{user.email}</p>
          </div>
          <button 
            onClick={onClose}
            className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
          {loading ? (
             <div className="space-y-6">
               {[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full rounded-3xl" />)}
             </div>
          ) : orders.length === 0 ? (
             <div className="py-24 text-center">
                <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                   <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                </div>
                <p className="text-sm font-black text-slate-300 uppercase tracking-[0.3em]">No registry entries found</p>
             </div>
          ) : (
             <div className="relative pl-28 pr-4 py-4">
                {/* Vertical Timeline Line */}
                <div className="absolute left-[84px] top-0 bottom-0 w-px bg-slate-100" />

                <div className="space-y-6">
                   {orders.map((order, idx) => (
                      <motion.div 
                        key={order._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="relative group flex items-start"
                      >
                         {/* Date Side */}
                         <div className="absolute -left-[92px] top-2 w-[76px] text-right pr-2">
                            <p className="text-[10px] font-black text-slate-900 leading-none">
                               {new Date(order.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short' })}
                            </p>
                            <p className="text-[9px] font-bold text-slate-300 mt-1 uppercase">
                               {new Date(order.createdAt).getFullYear()}
                            </p>
                         </div>

                         {/* Status Bubble Marker */}
                         <div className={`absolute left-[-16px] top-2.5 h-3 w-3 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100 z-10 transition-transform group-hover:scale-125 ${getStatusColor(order.status)}`} />
                         
                         <div className="flex-1 bg-white border border-slate-100 p-4 rounded-2xl hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 relative overflow-hidden">
                            <div className="flex items-center justify-between gap-4">
                               <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                     <span className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter">{order.aspireOrderId}</span>
                                     <div className="h-1 w-1 rounded-full bg-slate-200" />
                                     <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${
                                        order.status === "COMPLETED" ? "bg-green-50 text-green-600 border-green-100" :
                                        order.status.includes("REJECTED") ? "bg-red-50 text-red-600 border-red-100" :
                                        "bg-amber-50 text-amber-600 border-amber-100"
                                     }`}>
                                        {order.status.replace(/_/g, " ")}
                                     </span>
                                  </div>
                                  <h4 className="text-sm font-black text-slate-900 tracking-tight truncate uppercase leading-tight">{order.brandName}</h4>
                                  <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Product: {order.productCode}</p>
                               </div>
                               <div className="text-right shrink-0">
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Assigned To</p>
                                  <p className="text-xs font-black text-slate-900 tracking-tight uppercase leading-none">
                                     {(order as any).mediator?.name || "System Auto"}
                                  </p>
                               </div>
                            </div>
                         </div>
                      </motion.div>
                   ))}
                </div>
             </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Total Deals: <span className="text-slate-900 ml-1">{orders.length}</span>
            </div>
            <button 
              onClick={onClose}
              className="px-8 py-3 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
            >
              Close Ledger
            </button>
        </div>
      </motion.div>
    </div>
  );
}
