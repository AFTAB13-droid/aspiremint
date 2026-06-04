"use client";

import React, { useState } from "react";
import { motion, Variants } from "framer-motion";
import { 
  ShieldCheck, Package, Users, Bell, ArrowRight,
  MessageSquare, LayoutGrid
} from "lucide-react";
import Link from "next/link";

interface SubAdminDashboardProps {
  user: any;
  stats: any;
  recentOrders: any[];
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
  mouseX: any;
  mouseY: any;
  unreadCount: number;
}

export default function SubAdminDashboard({ 
  user, stats, recentOrders, isSidebarOpen, setIsSidebarOpen, mouseX, mouseY, unreadCount 
}: SubAdminDashboardProps) {

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

  return (
    <div className="flex flex-col gap-12 pb-32 max-w-[1700px] mx-auto overflow-hidden">
      
      {/* SECTION 1: OPERATIONAL HUD HEADER */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 z-10 px-2">
         <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-6"
         >
            <div className="relative">
               <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white text-3xl font-black shadow-[0_20px_50px_rgba(79,70,229,0.3)] overflow-hidden">
                  {user.name?.[0] || 'S'}
                  <motion.div 
                     animate={{ rotate: 360 }}
                     transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                     className="absolute inset-0 border-2 border-white/20 border-dashed rounded-3xl scale-75"
                  />
               </div>
               <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-[#f8f9ff] flex items-center justify-center shadow-lg">
                  <ShieldCheck className="w-4 h-4 text-white" />
               </div>
            </div>
            <div>
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-100 text-sky-600 rounded-lg text-[9px] font-black uppercase tracking-widest mb-2 border border-sky-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse" />
                  Specialist Tier Access
               </div>
               <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                  SubAdmin, <span className="text-sky-600">{user.name?.split(" ")[0]}</span>
               </h1>
            </div>
         </motion.div>

         <div className="flex items-center gap-8">
            <div className="text-right hidden sm:block">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">System Clock</p>
               <h4 className="text-xl font-black text-slate-900 tracking-tighter">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</h4>
            </div>
            <div className="h-12 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-sm">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
               <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Network Secure</span>
            </div>
         </div>
      </div>

      {/* SECTION 2: COMMAND METRICS GRID */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
         <motion.div variants={item} className="p-8 bg-white rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group flex flex-col justify-between min-h-[220px] hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-600/5 blur-[40px] rounded-full group-hover:bg-indigo-600/10 transition-colors" />
            <div className="flex items-center justify-between mb-6 relative z-10">
               <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                  <Package className="w-6 h-6" />
               </div>
               <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-100">Review Queue</span>
            </div>
            <div className="relative z-10">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">To be Reviewed</p>
               <h3 className="text-5xl font-black text-slate-900 tracking-tighter">
                  {stats.pendingReview || 0}
               </h3>
               <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-2">Awaiting Auth</p>
            </div>
         </motion.div>

         <motion.div variants={item} className="p-8 bg-white rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group flex flex-col justify-between min-h-[220px] hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className="absolute top-0 right-0 h-32 w-32 bg-amber-600/5 blur-[40px] rounded-full group-hover:bg-amber-600/10 transition-colors" />
            <div className="flex items-center justify-between mb-6 relative z-10">
               <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
                  <ShieldCheck className="w-6 h-6" />
               </div>
               <span className="text-[9px] font-black bg-amber-50 text-amber-600 px-3 py-1 rounded-full uppercase tracking-widest border border-amber-100">Form Watch</span>
            </div>
            <div className="relative z-10">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">New Orders (Pending)</p>
               <h3 className="text-5xl font-black text-slate-900 tracking-tighter">
                  {stats.refundFormPending || 0}
               </h3>
               <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-2">Document Stream</p>
            </div>
         </motion.div>

         <motion.div variants={item} className="p-8 bg-white rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group flex flex-col justify-between min-h-[220px] hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className="absolute top-0 right-0 h-32 w-32 bg-sky-600/5 blur-[40px] rounded-full group-hover:bg-sky-600/10 transition-colors" />
            <div className="flex items-center justify-between mb-6 relative z-10">
               <div className="h-12 w-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-inner">
                  <Users className="w-6 h-6" />
               </div>
               <span className="text-[9px] font-black bg-sky-50 text-sky-600 px-3 py-1 rounded-full uppercase tracking-widest border border-sky-100">User Dossier</span>
            </div>
            <div className="relative z-10">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Active Users</p>
               <h3 className="text-5xl font-black text-slate-900 tracking-tighter">
                  {stats.totalUsers || 0}
               </h3>
               <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-2">Active Profiles</p>
            </div>
         </motion.div>

         <motion.div variants={item} className="p-8 bg-sky-600 rounded-[40px] text-white shadow-xl shadow-sky-600/20 relative overflow-hidden group flex flex-col justify-between min-h-[220px] hover:shadow-2xl hover:-translate-y-1 transition-all">
            <div className="absolute top-0 right-0 h-32 w-32 bg-white/10 blur-[40px] rounded-full" />
            <div className="flex items-center justify-between mb-6 relative z-10">
               <div className="h-12 w-12 rounded-2xl bg-white/20 text-white flex items-center justify-center shadow-inner">
                  <Bell className="w-6 h-6" />
               </div>
               <div className="h-2 w-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_white]" />
            </div>
            <div className="relative z-10">
               <p className="text-[10px] font-black text-sky-100 uppercase tracking-widest mb-1">Intelligence Feed</p>
               <h3 className="text-5xl font-black tracking-tighter">{unreadCount || 0}</h3>
               <p className="text-[8px] font-bold text-sky-200 uppercase tracking-widest mt-2">System Unread</p>
            </div>
         </motion.div>
      </motion.div>

      {/* SECTION 2: QUICK ACTIONS */}
      <motion.div 
         initial={{ opacity: 0, y: 50 }}
         whileInView={{ opacity: 1, y: 0 }}
         viewport={{ once: true }}
         className="grid grid-cols-1 md:grid-cols-3 gap-8"
      >
         {/* Ledger Access */}
         <Link href="/app/orders" className="h-full">
            <div className="h-full p-12 bg-white rounded-[64px] border border-slate-100 shadow-sm relative overflow-hidden group hover:-translate-y-2 transition-all cursor-pointer">
               <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/5 blur-[50px] rounded-full transition-colors group-hover:bg-indigo-500/10" />
               <div className="h-16 w-16 bg-indigo-50 rounded-[28px] text-indigo-600 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                  <LayoutGrid className="w-8 h-8" />
               </div>
               <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Master Ledger</h3>
               <p className="text-xs text-slate-500 leading-relaxed">Access the primary database to review, approve, and process user order submissions.</p>
               <div className="mt-12 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                  Open Ledger <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
               </div>
            </div>
         </Link>

         {/* Support Hub */}
         <Link href="/app/admin/support" className="h-full">
            <div className="h-full p-12 bg-white rounded-[64px] border border-slate-100 shadow-sm relative overflow-hidden group hover:-translate-y-2 transition-all cursor-pointer">
               <div className="absolute top-0 right-0 h-40 w-40 bg-purple-500/5 blur-[50px] rounded-full transition-colors group-hover:bg-purple-500/10" />
               <div className="h-16 w-16 bg-purple-50 rounded-[28px] text-purple-600 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-8 h-8" />
               </div>
               <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Support Queries</h3>
               <p className="text-xs text-slate-500 leading-relaxed">Manage user tickets, resolve disputes, and maintain operational stability.</p>
               <div className="mt-12 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-purple-600">
                  Access Support <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
               </div>
            </div>
         </Link>

         {/* User Directory */}
         <Link href="/app/users" className="h-full">
            <div className="h-full p-12 bg-white rounded-[64px] border border-slate-100 shadow-sm relative overflow-hidden group hover:-translate-y-2 transition-all cursor-pointer">
               <div className="absolute top-0 right-0 h-40 w-40 bg-sky-500/5 blur-[50px] rounded-full transition-colors group-hover:bg-sky-500/10" />
               <div className="h-16 w-16 bg-sky-50 rounded-[28px] text-sky-600 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8" />
               </div>
               <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">User Directory</h3>
               <p className="text-xs text-slate-500 leading-relaxed">Search profiles, investigate user activity history, and oversee account dossiers.</p>
               <div className="mt-12 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-sky-600">
                  View Directory <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
               </div>
            </div>
         </Link>
      </motion.div>

    </div>
  );
}
