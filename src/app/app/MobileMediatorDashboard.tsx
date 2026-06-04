"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BannerConfig } from "@/components/admin/BannerManager";
import { usePusher } from "@/hooks/usePusher";
import toast from "react-hot-toast";
import { 
  TrendingUp, Package, RefreshCw, Clock, CheckCircle2, ChevronRight,
  ShieldCheck, AlertCircle, Sparkles, Megaphone, User as UserIcon, Activity, Zap, Info, Cpu, Database, Gift
} from "lucide-react";

interface MediatorDashboardProps {
  user: {
    name?: string | null;
    role: string;
    totalCompletedOrders?: number;
    globalRank?: number;
  };
  stats: {
    active: number;
    pending: number;
    completed: number;
    totalOrders: number;
    totalAvailableStock: number;
    totalRefundAmount: number;
    totalMediatorCommission?: number;
    dailyActivity: any[];
    statusDistribution: any[];
    openQueries: number;
  };
  recentOrders: any[];
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  mouseX: any;
  mouseY: any;
  unreadCount: number;
}

export default function MobileMediatorDashboard({ 
  user, 
  stats, 
  recentOrders, 
  unreadCount 
}: MediatorDashboardProps) {
  
  const router = useRouter();
  const [bannerConfig, setBannerConfig] = useState<BannerConfig | null>(null);
  const [isLoadingBanner, setIsLoadingBanner] = useState(true);
  const [activeDeals, setActiveDeals] = useState<any[]>([]);

  const fetchActiveDeals = async () => {
    try {
      const res = await fetch("/api/deals/active");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setActiveDeals(json.data);
      }
    } catch (err) {
      console.warn("Failed to fetch active deals:", err);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning";
    if (hour < 17) return "Afternoon";
    if (hour < 21) return "Evening";
    return "Night";
  };

  useEffect(() => {
    fetch("/api/config/banner")
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) setBannerConfig(json.data);
      })
      .catch(() => {})
      .finally(() => setIsLoadingBanner(false));

    fetchActiveDeals();
  }, []);

  usePusher(
    "public-deals",
    "deal-created",
    (newDeal: any) => {
      console.log("[Pusher Live Deal Event] New deal added:", newDeal);
      fetchActiveDeals();
      toast.success(`🔥 New Sponsor Campaign: ${newDeal.brandName}! Claim commissions!`, {
        duration: 6000,
        style: {
          background: "#0f172a",
          color: "#fff",
          borderRadius: "16px",
          border: "1px solid rgba(236, 72, 153, 0.3)"
        }
      });
    }
  );

  usePusher(
    "public-deals",
    "inventory-updated",
    () => {
      fetchActiveDeals();
    }
  );

  const isBannerValid = bannerConfig?.isActive && 
                        bannerConfig.template !== "DEFAULT" && 
                        (!bannerConfig.expiresAt || new Date(bannerConfig.expiresAt) > new Date()) &&
                        (bannerConfig.targetAudience === "ALL" || bannerConfig.targetAudience === "MEDIATOR");

  return (
    <div className="flex flex-col gap-5 pb-24 bg-slate-50 min-h-screen -mt-4 pt-6">
      
      {/* HEADER / BANNER */}
      {isLoadingBanner ? (
        <div className="flex items-center gap-3 pt-4 pb-2 px-4">
           <div className="w-12 h-12 rounded-full bg-indigo-100 animate-pulse" />
           <div className="space-y-2">
              <div className="w-24 h-3 bg-indigo-100 rounded animate-pulse" />
              <div className="w-32 h-5 bg-indigo-100 rounded animate-pulse" />
           </div>
        </div>
      ) : isBannerValid ? (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden p-6 rounded-[32px] shadow-lg text-white active:opacity-90 transition-opacity flex flex-col gap-4"
          style={{ background: bannerConfig.bgGradient }}
          onClick={() => {
            if (bannerConfig.actionLink) {
              router.push(bannerConfig.actionLink);
            } else if (bannerConfig.template === "NEW_DEALS") {
              router.push("/app/orders");
            }
          }}
        >
          {bannerConfig.animationType === "SHIMMER" && (
            <motion.div 
              animate={{ x: ["-100%", "200%"] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
              className="absolute top-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[30deg] z-0"
            />
          )}
          <div className="relative z-10 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 mt-1">
               {bannerConfig.icon === "sparkles" ? <Sparkles className="w-6 h-6" /> : 
                bannerConfig.icon === "alert" ? <AlertCircle className="w-6 h-6" /> : 
                bannerConfig.icon === "megaphone" ? <Megaphone className="w-6 h-6" /> : 
                bannerConfig.icon === "shield" ? <ShieldCheck className="w-6 h-6" /> : 
                bannerConfig.icon === "zap" ? <Zap className="w-6 h-6" /> : 
                bannerConfig.icon === "gift" ? <Gift className="w-6 h-6" /> : 
                <UserIcon className="w-6 h-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white/20 rounded-full text-[8px] font-black uppercase tracking-widest mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                {bannerConfig.template === "SALE" ? "OFFER" : 
                 bannerConfig.template === "NEW_DEALS" ? `🔥 LIVE: ${activeDeals.length}` : 
                 "NOTICE"}
              </div>
              <h1 className="text-xl font-black tracking-tight leading-tight mb-1">
                {bannerConfig.template === "NEW_DEALS" && activeDeals.length > 0 
                   ? `🔥 ${activeDeals.length} NEW DEALS LIVE` 
                   : bannerConfig.title}
              </h1>
              <p className="text-white/90 text-xs font-bold leading-relaxed">
                {bannerConfig.template === "NEW_DEALS" && activeDeals.length > 0 
                   ? `Earn yields from ${activeDeals.slice(0, 2).map(d => d.brandName).join(", ")}${activeDeals.length > 2 ? ' & others' : ''} now!` 
                   : bannerConfig.subtitle}
              </p>
            </div>
          </div>
          {(bannerConfig.actionLink || bannerConfig.template === "NEW_DEALS") && (
             <div className="relative z-10 mt-1 flex items-center justify-between bg-black/20 rounded-xl p-3 backdrop-blur-sm">
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {bannerConfig.template === "NEW_DEALS" ? "Claim Commission" : "View Details"}
                </span>
                <ChevronRight className="w-4 h-4" />
             </div>
          )}
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between pt-4 pb-2 px-4"
        >
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 flex items-center justify-center text-white text-lg font-black shadow-lg">
                {user.name?.[0] || 'S'}
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Good {getGreeting()}</p>
                <div className="flex items-center gap-2">
                   <h1 className="text-xl font-black text-slate-900 tracking-tight">{user.name?.split(" ")[0]}</h1>
                   <span className="text-indigo-600 text-[9px] font-black uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-lg">Rank #{user.globalRank || 1}</span>
                </div>
             </div>
          </div>
        </motion.div>
      )}

      {/* QUICK ACTIONS (1-Row 4-Cols) */}
      <div className="grid grid-cols-4 gap-2 bg-white px-4 py-6 rounded-[32px] shadow-sm border border-slate-100 mx-0 mt-2">
         {[
            { title: "Resolution", icon: <ShieldCheck className="w-6 h-6" />, href: "/app/mediators/support", color: "from-indigo-500 to-indigo-600" },
            { title: "Activity", icon: <Activity className="w-6 h-6" />, href: "/app/mediations", color: "from-violet-500 to-violet-600" },
            { title: "Refunds", icon: <RefreshCw className="w-6 h-6" />, href: "/app/mediators/refunds", color: "from-fuchsia-500 to-fuchsia-600" },
            { title: "Deals", icon: <Database className="w-6 h-6" />, href: "/app/activedeals", color: "from-slate-700 to-slate-800" }
         ].map((act, i) => (
            <Link key={i} href={act.href} className="block active:scale-95 transition-transform">
               <div className="flex flex-col items-center gap-2">
                  <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center bg-gradient-to-br ${act.color} text-white shadow-md shadow-${act.color.split("-")[1]}/20`}>
                     {act.icon}
                  </div>
                  <span className="text-[10px] font-black text-slate-700 tracking-tight text-center leading-none">{act.title}</span>
               </div>
            </Link>
         ))}
      </div>

      {/* UNIFIED STATS CARD (App Style) */}
      <motion.div 
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         className="bg-slate-900 p-6 rounded-[32px] text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20"
      >
         <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
         <div className="absolute bottom-0 left-0 w-24 h-24 bg-fuchsia-500/20 rounded-full blur-2xl -ml-10 -mb-10" />
         
         <div className="relative z-10 flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-indigo-200">
               <Zap className="w-4 h-4" />
               <span className="text-[10px] font-black uppercase tracking-widest">Total Earnings</span>
            </div>
            <div className="px-2.5 py-1 bg-white/10 rounded-full text-[9px] font-bold">INR</div>
         </div>
         
         <div className="relative z-10">
            <h2 className="text-4xl font-black tracking-tighter">₹{(stats.totalMediatorCommission || 0).toLocaleString()}</h2>
         </div>

         <div className="relative z-10 mt-6 grid grid-cols-3 gap-2 border-t border-white/10 pt-6">
            <div>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Orders</p>
               <p className="text-lg font-black">{stats.totalOrders.toLocaleString()}</p>
            </div>
            <div>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Queries</p>
               <p className="text-lg font-black text-rose-400">{stats.openQueries.toLocaleString()}</p>
            </div>
            <div className="text-right">
               <Link href="/app/mediators/analytics" className="inline-block">
                 <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest mb-1">Analytics</p>
                 <TrendingUp className="w-5 h-5 ml-auto text-indigo-400" />
               </Link>
            </div>
         </div>
      </motion.div>

      {/* RECENT ORDERS LIST */}
      <div className="bg-white rounded-[32px] border border-slate-100 p-5 mt-2 shadow-sm mx-0">
         <div className="flex items-center justify-between mb-5 px-2">
            <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-tight">Active Operation Stream</h3>
         </div>
         <div className="space-y-3">
            {recentOrders.length > 0 ? recentOrders.slice(0, 4).map((order, i) => (
               <div key={i} className="flex items-center justify-between p-4 rounded-[20px] bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-indigo-600 text-xs shrink-0 shadow-sm">
                        {order.brandName?.[0] || 'B'}
                     </div>
                     <div className="overflow-hidden">
                        <h5 className="font-black text-slate-900 text-xs truncate">#{order._id.toString().slice(-6).toUpperCase()}</h5>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{order.brandName}</p>
                     </div>
                  </div>
                  <div className="text-right pl-2">
                     <p className="text-[11px] font-black text-slate-900 tracking-tighter truncate">₹{order.amount.toLocaleString()}</p>
                     <p className={`text-[8px] font-black uppercase tracking-widest ${order.status === 'COMPLETED' ? 'text-emerald-500' : 'text-indigo-500'}`}>
                        {order.status.replace(/_/g, ' ')}
                     </p>
                  </div>
               </div>
            )) : (
               <div className="py-8 flex flex-col items-center justify-center text-center">
                  <Package className="w-6 h-6 text-slate-300 mb-2" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No active streams</p>
               </div>
            )}
         </div>
      </div>
      
      {/* QUICK COMM CARD */}
      <div className="bg-slate-900 rounded-[32px] p-6 text-white relative overflow-hidden mt-2 shadow-lg">
         <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500 rounded-full blur-[50px] opacity-20" />
         <div className="relative z-10 flex flex-col items-start gap-3">
            <div className="p-3 bg-white/10 rounded-xl">
               <Cpu className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
               <h3 className="text-[14px] font-black tracking-tight">Neural Support</h3>
               <p className="text-[10px] text-slate-400 leading-relaxed mt-1">Access platform-level AI for complex dispute analysis.</p>
            </div>
            <button className="w-full mt-2 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-400 hover:text-white transition-all">Launch Terminal</button>
         </div>
      </div>

    </div>
  );
}
