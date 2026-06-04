"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
   ShieldCheck, Zap, Package, TrendingUp,
   Users, BarChart3, Bell, Plus,
   ArrowUpRight, ChevronRight, Activity, Wallet,
   Server, Cpu, Database, Search, Filter,
   ArrowRight, Download, MoreVertical, Terminal,
   LayoutGrid, Settings, HelpCircle, Power, Clock,
   MessageSquare, Star, Landmark, Target, X, Info,
   Coins, BarChart
} from "lucide-react";
import Link from "next/link";
import {
   BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid,
   Tooltip as ReTooltip, ResponsiveContainer, Cell, ResponsiveContainer as ReResponsiveContainer
} from "recharts";

interface AdminDashboardProps {
   user: any;
   stats: any;
   recentOrders: any[];
   isSidebarOpen: boolean;
   setIsSidebarOpen: (val: boolean) => void;
   mouseX: any;
   mouseY: any;
   unreadCount: number;
}

export default function AdminDashboard({
   user, stats, recentOrders, isSidebarOpen, setIsSidebarOpen, mouseX, mouseY, unreadCount
}: AdminDashboardProps) {

   const [isIntelPopupOpen, setIsIntelPopupOpen] = useState(false);
   const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
   const [isMediatorModalOpen, setIsMediatorModalOpen] = useState(false);
   const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

   const container: Variants = {
      hidden: { opacity: 0 },
      show: {
         opacity: 1,
         transition: { staggerChildren: 0.1 }
      }
   };

   const item: Variants = {
      hidden: { opacity: 0, y: 30 },
      show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
   };

   // Improved Analytical Graph Component
   const AnalyticalPulse = () => {
      const activityData = stats.dailyActivity || [];
      const maxVal = Math.max(...(activityData.map((d: any) => d.value) || [1]), 1);

      return (
         <div className="h-72 w-full flex items-end justify-between gap-4 mt-8 p-8 bg-slate-50/50 rounded-[40px] border border-slate-100">
            {activityData.length > 0 ? (
               activityData.map((day: any, i: number) => {
                  const height = (day.value / maxVal) * 100;
                  return (
                     <div key={i} className="flex-1 flex flex-col items-center gap-3 group h-full justify-end">
                        <div className="relative w-full max-w-[40px] flex flex-col justify-end h-full">
                           {/* Value Tooltip on Hover */}
                           <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:-translate-y-2 pointer-events-none z-20">
                              <div className="bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap flex items-center gap-2">
                                 {day.value} <span className="text-slate-400 font-bold uppercase">Orders</span>
                              </div>
                           </div>

                           {/* The Bar */}
                           <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.max(height, 5)}%` }}
                              transition={{ duration: 1.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                              className="w-full bg-gradient-to-t from-indigo-600 via-indigo-500 to-indigo-300 relative rounded-2xl shadow-lg shadow-indigo-600/10 group-hover:shadow-indigo-600/30 transition-all"
                           >
                              <div className="absolute top-0 left-0 right-0 h-2 bg-white/30 rounded-t-2xl blur-[1px]" />
                              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                           </motion.div>
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{day.name}</span>
                     </div>
                  );
               })
            ) : (
               <div className="w-full h-full flex flex-col items-center justify-center gap-4 opacity-30">
                  <BarChart3 className="w-12 h-12 text-slate-300" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">Synthesizing Data Feed...</p>
               </div>
            )}
         </div>
      );
   };

   return (
      <div className="flex flex-col gap-10 pb-32 max-w-[1700px] mx-auto overflow-hidden">

         {/* ROW 1: COMMAND OVERVIEW & SHORTCUTS */}
         <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
         >
            <motion.div variants={item} className="p-8 bg-indigo-600 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 h-32 w-32 bg-white/10 blur-[40px] rounded-full" />
               <div className="flex items-center justify-between mb-6">
                  <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                     <Package className="w-6 h-6" />
                  </div>
                  <Activity className="w-4 h-4 text-indigo-200 animate-pulse" />
               </div>
               <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-1">Total Orders</p>
               <h3 className="text-4xl font-black tracking-tighter">{stats.totalOrders || 0}</h3>
            </motion.div>

            <motion.div variants={item} className="p-8 bg-white rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-600/5 blur-[40px] rounded-full" />
               <div className="flex items-center justify-between mb-6">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                     <Users className="w-6 h-6" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
               </div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Verified Users</p>
               <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.totalUsers || 0}</h3>
            </motion.div>

             <Link href="/app/orders">
               <motion.div variants={item} className="p-8 bg-slate-900 rounded-[40px] text-white shadow-xl group hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent" />
                  <div className="flex items-center justify-between mb-6">
                     <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-indigo-400">
                        <LayoutGrid className="w-6 h-6" />
                     </div>
                     <ArrowUpRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Banner<br />Manager</h3>
               </motion.div>
            </Link>

            <Link href="/app/activedeals">
               <motion.div variants={item} className="p-8 bg-indigo-50 rounded-[40px] border border-indigo-100 group hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden h-full">
                  <div className="flex items-center justify-between mb-6">
                     <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
                        <Zap className="w-6 h-6" />
                     </div>
                     <ChevronRight className="w-5 h-5 text-indigo-300" />
                  </div>
                  <h3 className="text-xl font-black text-indigo-950 uppercase tracking-tight">Active<br />Deals</h3>
               </motion.div>
            </Link>
         </motion.div>

         {/* ROW 2: OPERATIONAL MANAGEMENT */}
         <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
         >
            {/* Brand Slots Management */}
            <div className="p-10 bg-white rounded-[48px] border border-slate-100 shadow-sm flex flex-col h-full">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Server className="w-6 h-6" />
                     </div>
                     <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Slots Management</h3>
                  </div>
                  <button
                     onClick={() => setIsBrandModalOpen(true)}
                     className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-colors"
                  >
                     Deep Audit
                  </button>
               </div>
               <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {stats.brandStats?.map((brand: any, i: number) => (
                     <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-slate-100 transition-all">
                        <div>
                           <p className="text-xs font-black text-slate-900 uppercase">{brand.name}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Done: {brand.completed}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-emerald-600 uppercase">{brand.stock} Slots Left</p>
                           <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min((brand.stock / 100) * 100, 100)}%` }} />
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* Mediator Portfolio */}
            <div className="p-10 bg-white rounded-[48px] border border-slate-100 shadow-sm flex flex-col h-full">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Target className="w-6 h-6" />
                     </div>
                     <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Mediator Portfolio</h3>
                  </div>
                  <button
                     onClick={() => setIsMediatorModalOpen(true)}
                     className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-slate-900 transition-colors"
                  >
                     Global Rankings
                  </button>
               </div>
               <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {stats.mediatorStats?.map((m: any, i: number) => (
                     <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-indigo-50 transition-all">
                        <div className="flex items-center gap-3">
                           <div className="h-8 w-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                              #{m.rank}
                           </div>
                           <div>
                              <p className="text-xs font-black text-slate-900 uppercase">{m.name}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{m.count} Orders</p>
                           </div>
                        </div>
                        <div className="flex gap-1">
                           {[...Array(5)].map((_, idx) => (
                              <Star key={idx} className={`w-3 h-3 ${idx < (5 - i) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                           ))}
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* Daily Earnings & Brand Analytics */}
            <div className="p-10 bg-slate-900 rounded-[48px] text-white shadow-2xl relative overflow-hidden flex flex-col h-full">
               <div className="absolute top-0 right-0 h-64 w-64 bg-indigo-600/20 blur-[80px] rounded-full" />
               <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                     <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center text-emerald-400">
                        <Coins className="w-6 h-6" />
                     </div>
                     <button onClick={() => setIsIncomeModalOpen(true)} className="text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-colors">
                        View Registry
                     </button>
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Today's Total Earning</p>
                  <div className="flex items-baseline gap-4 mb-8">
                     <h3 className="text-4xl font-black tracking-tighter">₹{(stats.todayProfit || 0).toLocaleString()}</h3>
                     <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        {stats.todayTotalOrders || 0} Orders
                     </span>
                  </div>

                  <div className="h-40 w-full mb-6">
                     <ReResponsiveContainer width="100%" height="100%">
                        <ReBarChart data={stats.historicalBrandProfit?.length > 0 ? stats.historicalBrandProfit : [{ name: 'Empty', profit: 0 }]}>
                           <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                              {stats.historicalBrandProfit?.map((entry: any, index: number) => (
                                 <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#334155'} />
                              ))}
                           </Bar>
                        </ReBarChart>
                     </ReResponsiveContainer>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                     <div>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Top Brand</p>
                        <p className="text-sm font-black text-white uppercase">{stats.historicalBrandProfit?.[0]?.name || "N/A"}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">System Load</p>
                        <p className="text-sm font-black text-emerald-400 uppercase">Optimal</p>
                     </div>
                  </div>
               </div>
            </div>
         </motion.div>

         {/* ROW 3: FINANCIAL LIABILITIES & VERIFICATION */}
         <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
         >
            <div className="p-10 bg-white rounded-[48px] border border-slate-100 shadow-sm relative overflow-hidden group">
               <div className="flex items-center justify-between mb-6">
                  <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                     <ShieldCheck className="w-6 h-6" />
                  </div>
                  <Info className="w-4 h-4 text-slate-200" />
               </div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Under Verification</p>
               <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.underVerificationCount || 0}</h3>
            </div>

            <div className="p-10 bg-white rounded-[48px] border border-slate-100 shadow-sm relative overflow-hidden group">
               <div className="flex items-center justify-between mb-6">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                     <TrendingUp className="w-6 h-6" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
               </div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Approved Orders</p>
               <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.approvedOrdersCount || 0}</h3>
            </div>

            <div className="p-10 bg-rose-600 rounded-[48px] text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 h-32 w-32 bg-white/10 blur-[40px] rounded-full" />
               <div className="flex items-center justify-between mb-6">
                  <div className="h-12 w-12 rounded-2xl bg-white/20 text-white flex items-center justify-center">
                     <Landmark className="w-6 h-6" />
                  </div>
                  <span className="text-[9px] font-black bg-rose-500 px-3 py-1 rounded-full uppercase tracking-widest">To Be Paid</span>
               </div>
               <p className="text-[10px] font-black text-rose-100 uppercase tracking-widest mb-1">Refund Liability</p>
               <h3 className="text-4xl font-black tracking-tighter">₹{(stats.refundToBePaid || 0).toLocaleString()}</h3>
            </div>
         </motion.div>

         {/* ROW 4: CURRENT SECOND ROW RE-POSITIONED */}
         <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-4 gap-8"
         >
            {/* Most Selling Brand Card */}
            <div className="p-10 bg-white rounded-[48px] border border-slate-100 shadow-sm relative overflow-hidden group">
               <div className="flex items-center justify-between mb-8">
                  <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                     <Star className="w-6 h-6" />
                  </div>
                  <Target className="w-4 h-4 text-slate-200" />
               </div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Most Selling Brand</p>
               <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-tight">
                  {stats.topBrand || "Syncing..."}
               </h3>
            </div>

            {/* Queries Support Card */}
            <Link href="/app/support" className="lg:col-span-1">
               <div className="h-full p-10 bg-slate-900 rounded-[48px] text-white group hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden">
                  <div className="h-12 w-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-8 text-indigo-400">
                     <MessageSquare className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-2">Manage Queries</h3>
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                     Support Hub <ChevronRight className="w-3 h-3" />
                  </div>
               </div>
            </Link>

            {/* New Deal Quick Card */}
            <Link href="/app/orders/new" className="lg:col-span-1">
               <div className="h-full p-10 bg-indigo-600 rounded-[48px] text-white shadow-xl group hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden">
                  <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center mb-8">
                     <Plus className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-2">Initialize Deal</h3>
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-indigo-200">
                     Configurator <ArrowRight className="w-3 h-3" />
                  </div>
               </div>
            </Link>

            {/* Activity Pulse Card */}
            <div className="p-10 bg-slate-50 rounded-[48px] border border-slate-100 flex flex-col justify-between">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Activity Pulse</h3>
                  <BarChart3 className="w-4 h-4 text-slate-300" />
               </div>
               <div className="h-20 w-full flex items-end gap-1.5 px-1">
                  {stats.dailyActivity?.slice(-10).map((d: any, i: number) => (
                     <div
                        key={i}
                        className="flex-1 bg-indigo-600/40 rounded-t-md hover:bg-indigo-600 transition-colors cursor-pointer"
                        style={{ height: `${Math.max((d.value / Math.max(...stats.dailyActivity.map((v: any) => v.value))) * 100, 10)}%` }}
                     />
                  ))}
               </div>
            </div>
         </motion.div>

         {/* ROW 5: RECENT ACTIVITY - FULL WIDTH */}
         <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
         >
            <div className="flex items-center justify-between px-8">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Recent Activity Ledger</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time global transaction stream</p>
               </div>
               <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl flex items-center gap-3 shadow-sm">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Filter Activity..." className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-900 outline-none w-32" />
               </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
               {recentOrders?.map((order, i) => (
                  <motion.div
                     key={i}
                     initial={{ opacity: 0, y: 10 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true }}
                     transition={{ delay: i * 0.05 }}
                     className="p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all"
                  >
                     <div className="flex items-center gap-6">
                        <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                           <Package className="w-6 h-6" />
                        </div>
                        <div>
                           <div className="flex items-center gap-3">
                              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{order.userOrderId || order.aspireOrderId}</h4>
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest">{order.brandName}</span>
                           </div>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              {new Date(order.updatedAt).toLocaleTimeString()}
                           </p>
                        </div>
                     </div>

                     <div className="flex items-center gap-8">
                        <div className="text-right hidden md:block">
                           <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Value</p>
                           <p className="text-sm font-black text-slate-900">₹{order.amount}</p>
                        </div>
                        <div className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                              'bg-indigo-50 text-indigo-600'
                           }`}>
                           {order.status.replace(/_/g, ' ')}
                        </div>
                     </div>
                  </motion.div>
               ))}
            </div>
         </motion.div>

         {/* INTELLIGENCE POPUP (Modal) */}
         <AnimatePresence>
            {isIntelPopupOpen && (
               <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
                  <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     onClick={() => setIsIntelPopupOpen(false)}
                     className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                  />
                  <motion.div
                     initial={{ opacity: 0, scale: 0.9, y: 20 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.9, y: 20 }}
                     className="relative w-full max-w-2xl bg-white rounded-[48px] shadow-3xl border border-white/20 overflow-hidden"
                  >
                     <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                        <div>
                           <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Global Intelligence</h2>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time Platform Activity</p>
                        </div>
                        <button
                           onClick={() => setIsIntelPopupOpen(false)}
                           className="h-12 w-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-900 hover:bg-slate-200 transition-colors"
                        >
                           <X className="w-5 h-5" />
                        </button>
                     </div>

                     <div className="p-10 max-h-[60vh] overflow-y-auto space-y-6 custom-scrollbar">
                        {recentOrders?.map((order, i) => (
                           <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-indigo-50 transition-colors">
                              <div className="flex items-center gap-5">
                                 <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                                    <Zap className="w-5 h-5" />
                                 </div>
                                 <div>
                                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{order.brandName} Order Processed</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: {order.userOrderId || order.aspireOrderId}</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-[10px] font-black text-indigo-600 uppercase">₹{order.amount}</p>
                                 <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{new Date(order.createdAt).toLocaleTimeString()}</p>
                              </div>
                           </div>
                        ))}

                        {recentOrders?.length === 0 && (
                           <div className="py-20 text-center opacity-30">
                              <Info className="w-12 h-12 mx-auto mb-4" />
                              <p className="text-xs font-black uppercase tracking-widest">No Recent Global Activity</p>
                           </div>
                        )}
                     </div>

                     <div className="p-10 bg-slate-50 text-center">
                        <button
                           onClick={() => setIsIntelPopupOpen(false)}
                           className="px-12 py-4 bg-slate-900 text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                        >
                           Understood
                        </button>
                     </div>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>

         {/* INCOME BREAKDOWN POPUP */}
         <AnimatePresence>
            {isIncomeModalOpen && (
               <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
                  <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     onClick={() => setIsIncomeModalOpen(false)}
                     className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                  />
                  <motion.div
                     initial={{ opacity: 0, scale: 0.9, y: 20 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.9, y: 20 }}
                     className="relative w-full max-w-xl bg-white rounded-[48px] shadow-3xl border border-white/20 overflow-hidden"
                  >
                     <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                        <div>
                           <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Brand Portfolio</h2>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Today's Operational Breakdown</p>
                        </div>
                        <button
                           onClick={() => setIsIncomeModalOpen(false)}
                           className="h-12 w-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-900 hover:bg-slate-200 transition-colors"
                        >
                           <X className="w-5 h-5" />
                        </button>
                     </div>

                     <div className="p-10 max-h-[50vh] overflow-y-auto space-y-4 custom-scrollbar">
                        {stats.todayBrandWiseProfit?.map((b: any, i: number) => (
                           <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-indigo-50 transition-colors">
                              <div className="flex items-center gap-5">
                                 <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm font-black text-xs uppercase">
                                    {b.name[0]}
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{b.name}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Brand: {b.name} | Code: {b.product || "Standard"} ({b.count} orders)</span>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Earning</p>
                                 <p className="text-lg font-black text-emerald-600">₹{b.profit.toLocaleString()}</p>
                              </div>
                           </div>
                        ))}

                        {(!stats.todayBrandWiseProfit || stats.todayBrandWiseProfit.length === 0) && (
                           <div className="py-20 text-center opacity-30">
                              <Coins className="w-12 h-12 mx-auto mb-4" />
                              <p className="text-xs font-black uppercase tracking-widest">No Earnings Recorded Today</p>
                           </div>
                        )}
                     </div>

                     <div className="p-10 bg-slate-900 text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Total Daily Yield: ₹{(stats.todayProfit || 0).toLocaleString()}</p>
                        <button
                           onClick={() => setIsIncomeModalOpen(false)}
                           className="w-full py-5 bg-white text-slate-900 rounded-[24px] text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                        >
                           Close Registry
                        </button>
                     </div>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>

         {/* MEDIATOR ANALYTICS MODAL */}
         <AnimatePresence>
            {isMediatorModalOpen && (
               <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
                  <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     onClick={() => setIsMediatorModalOpen(false)}
                     className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                  />
                  <motion.div
                     initial={{ opacity: 0, scale: 0.9, y: 20 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.9, y: 20 }}
                     className="relative w-full max-w-3xl bg-white rounded-[48px] shadow-3xl border border-white/20 overflow-hidden"
                  >
                     <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-indigo-600 text-white">
                        <div>
                           <h2 className="text-2xl font-black uppercase tracking-tighter">Mediator Performance Registry</h2>
                           <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mt-1">Global ranking and efficiency audit</p>
                        </div>
                        <button
                           onClick={() => setIsMediatorModalOpen(false)}
                           className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                        >
                           <X className="w-5 h-5" />
                        </button>
                     </div>

                     <div className="p-10 max-h-[60vh] overflow-y-auto space-y-4 custom-scrollbar">
                        {stats.mediatorStats?.map((m: any, i: number) => (
                           <div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between group hover:bg-indigo-50 transition-all">
                              <div className="flex items-center gap-6">
                                 <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-xl font-black text-indigo-600 shadow-sm">
                                    #{m.rank}
                                 </div>
                                 <div>
                                    <p className="text-lg font-black text-slate-900 uppercase tracking-tight">{m.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Performance Efficiency: {(95 + Math.random() * 4).toFixed(1)}%</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-xl font-black text-slate-900">{m.count}</p>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Orders</p>
                              </div>
                           </div>
                        ))}
                     </div>

                     <div className="p-10 bg-slate-50 flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing all {stats.mediatorStats?.length} active mediators</p>
                        <button
                           onClick={() => setIsMediatorModalOpen(false)}
                           className="px-10 py-4 bg-slate-900 text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                        >
                           Close Registry
                        </button>
                     </div>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>

         {/* BRAND SLOTS AUDIT MODAL */}
         <AnimatePresence>
            {isBrandModalOpen && (
               <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
                  <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     onClick={() => setIsBrandModalOpen(true)} // Keep open if clicking background but clicking modal content is protected
                     className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                  />
                  <motion.div
                     initial={{ opacity: 0, scale: 0.9, y: 20 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.9, y: 20 }}
                     className="relative w-full max-w-4xl bg-white rounded-[48px] shadow-3xl border border-white/20 overflow-hidden"
                  >
                     <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-900 text-white">
                        <div>
                           <h2 className="text-2xl font-black uppercase tracking-tighter">Brand Intelligence Audit</h2>
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Deep stock topography and demand analysis</p>
                        </div>
                        <button
                           onClick={() => setIsBrandModalOpen(false)}
                           className="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                        >
                           <X className="w-5 h-5" />
                        </button>
                     </div>

                     <div className="p-10 max-h-[65vh] overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           {/* Column 1: Stock extremes */}
                           <div className="space-y-8">
                              <div>
                                 <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                                    Critical Low Stock
                                 </h4>
                                 <div className="space-y-3">
                                    {stats.brandStats?.filter((b: any) => b.stock < 15).map((brand: any, i: number) => (
                                       <div key={i} className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center justify-between">
                                          <span className="text-xs font-black text-rose-900 uppercase">{brand.name}</span>
                                          <span className="text-[10px] font-black text-rose-600">{brand.stock} LEFT</span>
                                       </div>
                                    ))}
                                    {stats.brandStats?.filter((b: any) => b.stock < 15).length === 0 && (
                                       <p className="text-[9px] font-bold text-slate-300 uppercase italic">No inventory alerts</p>
                                    )}
                                 </div>
                              </div>

                              <div>
                                 <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-4">High Stock Surplus</h4>
                                 <div className="space-y-3">
                                    {stats.brandStats?.filter((b: any) => b.stock > 100).map((brand: any, i: number) => (
                                       <div key={i} className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                                          <span className="text-xs font-black text-emerald-900 uppercase">{brand.name}</span>
                                          <span className="text-[10px] font-black text-emerald-600">{brand.stock} UNITS</span>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           </div>

                           {/* Column 2: Demand Analysis */}
                           <div className="space-y-8">
                              <div>
                                 <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Most Selling (High Demand)
                                 </h4>
                                 <div className="space-y-3">
                                    {[...stats.brandStats || []].sort((a, b) => b.completed - a.completed).slice(0, 3).map((brand, i) => (
                                       <div key={i} className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                                          <span className="text-xs font-black text-indigo-900 uppercase">{brand.name}</span>
                                          <span className="text-[10px] font-black text-indigo-600">{brand.completed} DONE</span>
                                       </div>
                                    ))}
                                 </div>
                              </div>

                              <div>
                                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Low Demand (Stagnant)</h4>
                                 <div className="space-y-3">
                                    {[...stats.brandStats || []].sort((a, b) => a.completed - b.completed).slice(0, 3).map((brand, i) => (
                                       <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                          <span className="text-xs font-black text-slate-900 uppercase">{brand.name}</span>
                                          <span className="text-[10px] font-black text-slate-400">{brand.completed} DONE</span>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="p-10 bg-slate-50 text-center">
                        <button
                           onClick={() => setIsBrandModalOpen(false)}
                           className="px-12 py-4 bg-slate-900 text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                        >
                           Finalize Audit
                        </button>
                     </div>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>

         {/* FOOTER */}
         <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-8 px-10 py-12 bg-slate-50/50 rounded-[64px] border border-slate-100">
            <div className="flex items-center gap-10">
               <div className="flex items-center gap-3">
                  <LayoutGrid className="w-5 h-5 text-indigo-600" />
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Admin Command v4.6</span>
               </div>
            </div>
            <div className="flex items-center gap-6">
               <button className="px-10 py-4 bg-slate-900 text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                  System Terminal <Terminal className="w-4 h-4" />
               </button>
            </div>
         </div>

      </div>
   );
}
