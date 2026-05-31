"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminWalletVaults() {
  const [stats, setStats] = useState<any>({
    totalEscrow: 0,
    activeDeals: 0,
    pendingVerifications: 0,
    completedValue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        const json = await res.json();
        if (json.success) setStats(json.data);
      } catch (err) {
        toast.error("Failed to load vault statistics");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-10 pb-20">
         <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-full max-w-2xl" />
         </div>
         <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1,2,3,4].map(i => (
               <Skeleton key={i} className="h-48 rounded-[40px]" />
            ))}
         </div>
         <Skeleton className="h-64 rounded-[40px]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 pb-20">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-2">
            <div className="h-4 w-1 bg-indigo-600 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Treasury Console</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">Wallet Vaults</h1>
        <p className="mt-2 text-slate-500 font-medium max-w-2xl">Monitor platform-wide settlement liquidity and transaction performance. Real-time auditing of funds held across all active mediations.</p>
      </motion.div>

      {/* High-Impact Stat Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
         
         <div className="rounded-[40px] bg-indigo-600 p-8 text-white shadow-2xl shadow-indigo-600/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-3xl" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-4">Total in Settlement</p>
            <h2 className="text-3xl font-black">₹{stats.totalEscrow.toLocaleString()}</h2>
            <div className="mt-6 flex items-center gap-2">
               <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
               <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Real-time Liquidity</p>
            </div>
         </div>

         <div className="rounded-[40px] border border-slate-100 bg-white p-8 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Active Managed Deals</p>
            <h2 className="text-3xl font-black text-slate-900">{stats.activeDeals}</h2>
            <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Handshake Active</p>
         </div>

         <div className="rounded-[40px] border border-slate-100 bg-white p-8 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Verification Backlog</p>
            <h2 className="text-3xl font-black text-slate-900">{stats.pendingVerifications}</h2>
            <p className="mt-4 text-[10px] font-bold text-orange-500 uppercase tracking-widest flex items-center gap-2">
               <span className="h-1.5 w-1.5 rounded-full bg-orange-500" /> Pending Action
            </p>
         </div>

         <div className="rounded-[40px] border border-slate-100 bg-white p-8 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Finalized Output</p>
            <h2 className="text-3xl font-black text-slate-900">₹{stats.completedValue.toLocaleString()}</h2>
            <p className="mt-4 text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
               <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Successfully Released
            </p>
         </div>

      </div>

      {/* Auditing Table Placeholder */}
      <div className="rounded-[40px] border-2 border-dashed border-slate-100 bg-slate-50/50 p-20 text-center">
         <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Vault Transaction Journals</h3>
         <p className="text-xs font-bold text-slate-300 uppercase tracking-tighter">Detailed financial movement logs coming in Phase 7</p>
      </div>

    </div>
  );
}
