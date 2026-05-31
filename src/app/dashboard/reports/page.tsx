"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminReportsPage() {
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch("/api/admin/activity");
        const json = await res.json();
        if (json.success) setActivity(json.data);
      } catch (err) {
        toast.error("Failed to load activity logs");
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-10 pb-20">
         <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-full max-w-2xl" />
         </div>
         <div className="rounded-[40px] border border-slate-100 bg-white p-10">
            <Skeleton className="h-4 w-40 mb-10" />
            <div className="space-y-12 relative">
               {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex items-start gap-8">
                     <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
                     <div className="flex-1 space-y-3">
                        <div className="flex justify-between">
                           <Skeleton className="h-4 w-48" />
                           <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-3 w-full max-w-sm" />
                        <div className="flex gap-6">
                           <Skeleton className="h-3 w-20" />
                           <Skeleton className="h-3 w-20" />
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 pb-20 text-slate-900">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-2">
            <div className="h-4 w-1 bg-indigo-600 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Intelligence Bureau</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight uppercase">Live Analytics</h1>
        <p className="mt-2 text-slate-500 font-medium max-w-2xl">High-precision tracking of platform lifecycle events. Audit every state transition, from deal creation to escrow finalization.</p>
      </motion.div>

      {/* Activity Timeline */}
      <div className="rounded-[40px] border border-slate-100 bg-white p-10 shadow-2xl shadow-slate-200/40">
         <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-10">Global Activity Feed</h3>
         
         <div className="space-y-12 relative">
            <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-slate-50" />
            
            {activity.length === 0 ? (
               <p className="text-center text-slate-300 font-bold uppercase tracking-widest py-10">No recent activity detected</p>
            ) : (
               activity.map((item, idx) => (
                  <motion.div 
                     initial={{ opacity: 0, x: -10 }} 
                     animate={{ opacity: 1, x: 0 }} 
                     transition={{ delay: idx * 0.05 }}
                     key={item._id} 
                     className="relative flex items-start gap-8 group"
                  >
                     <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 z-10 border-4 border-white shadow-xl transition-all group-hover:scale-110 ${
                        item.status === 'COMPLETED' ? 'bg-emerald-500 text-white' :
                        item.status === 'DISPUTE_RAISED' ? 'bg-red-500 text-white' :
                        item.status === 'ACTIVE_ESCROW' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'
                     }`}>
                        {item.status === 'COMPLETED' ? '✓' : idx + 1}
                     </div>
                     
                     <div className="flex-1">
                        <div className="flex items-center justify-between gap-4 mb-1">
                           <h4 className="text-sm font-black uppercase tracking-tight text-slate-900">{item.title}</h4>
                           <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(item.updatedAt).toLocaleTimeString()}</p>
                        </div>
                        <p className="text-xs font-bold text-slate-500 mb-4">{item.orderId} transitioned to <span className="text-indigo-600 font-black uppercase tracking-tighter">{item.status.replace(/_/g, ' ')}</span></p>
                        
                        <div className="flex items-center gap-6">
                           <div className="flex items-center gap-2">
                              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Amount</p>
                              <p className="text-xs font-black text-slate-900">₹{item.amount.toLocaleString()}</p>
                           </div>
                           <div className="flex items-center gap-2">
                              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Mediator</p>
                              <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{item.mediator?.name}</p>
                           </div>
                        </div>
                     </div>
                  </motion.div>
               ))
            )}
         </div>
      </div>

    </div>
  );
}
