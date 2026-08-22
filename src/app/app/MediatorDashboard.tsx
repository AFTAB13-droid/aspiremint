"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { BannerConfig } from "@/components/admin/BannerManager";
import { usePusher } from "@/hooks/usePusher";
import toast from "react-hot-toast";
import { 
  TrendingUp, Package, RefreshCw, MoreVertical, Clock, CheckCircle2, ChevronRight,
  Bell, X, Zap, ShieldCheck, Info, Search, Filter, Activity, Cpu, Database, Sparkles, AlertCircle, Megaphone, User as UserIcon, ArrowUpRight, Gift,
  Flag, Flame, Palette, Sword, Music, Star, Moon
} from "lucide-react";
import { useMotionValue, useTransform, useSpring } from "framer-motion";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";

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

const COLORS = ['#8b5cf6', '#6366f1', '#ec4899', '#f59e0b', '#10b981'];

export default function MediatorDashboard({ 
  user, 
  stats, 
  recentOrders, 
  isSidebarOpen, 
  setIsSidebarOpen,
  mouseX,
  mouseY,
  unreadCount
}: MediatorDashboardProps) {
  
  const [activeTab, setActiveTab] = useState('intelligence');
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
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    if (hour < 21) return "Good Evening";
    return "Good Night";
  };

  React.useEffect(() => {
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

  const rotateX = useSpring(useTransform(mouseY, [-500, 500], [10, -10]), { stiffness: 100, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-500, 500], [-10, 10]), { stiffness: 100, damping: 30 });

  function handleMouseMove(event: React.MouseEvent) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
  }

  const isBannerValid = bannerConfig?.isActive && 
                        bannerConfig.template !== "DEFAULT" && 
                        (!bannerConfig.expiresAt || new Date(bannerConfig.expiresAt) > new Date()) &&
                        (bannerConfig.targetAudience === "ALL" || bannerConfig.targetAudience === "MEDIATOR");

  return (
    <div className="min-h-screen bg-[#f8f9ff] p-4 lg:p-8 flex flex-col gap-8 relative overflow-hidden">
      
      {/* BACKGROUND SCANNING ELEMENT */}
      <motion.div 
         animate={{ y: ["-100%", "100%"] }}
         transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
         className="fixed top-0 left-0 w-full h-[2px] bg-indigo-500/10 z-0 pointer-events-none shadow-[0_0_20px_indigo]"
      />

      {/* TOP COMMAND BAR OR GLOBAL BANNER */}
      {isLoadingBanner ? (
         <div className="w-full rounded-[32px] p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 z-10 bg-[#eef2ff]/50 border border-indigo-100/50">
            <div className="flex items-center gap-6">
               <div className="w-20 h-20 rounded-2xl bg-indigo-100/50 animate-pulse" />
               <div className="space-y-3">
                  <div className="w-48 h-8 bg-indigo-100/50 rounded animate-pulse" />
                  <div className="w-32 h-4 bg-indigo-100/50 rounded animate-pulse" />
               </div>
            </div>
         </div>
      ) : isBannerValid ? (
         <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-[32px] p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 z-10"
            style={{
               background: `linear-gradient(135deg, var(--tw-gradient-stops))`
            }}
         >
            <div className="absolute inset-0 z-0" style={{ background: bannerConfig.bgGradient }} />
            
            {/* Animations */}
            {bannerConfig.animationType === "SHIMMER" && (
               <motion.div 
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                  className="absolute top-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[30deg] z-0"
               />
            )}
            {bannerConfig.animationType === "PULSE" && (
               <motion.div 
                  animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="absolute inset-0 bg-white/10 mix-blend-overlay z-0"
               />
            )}
            
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-32 -mt-32 z-0" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/20 rounded-full blur-3xl -ml-24 -mb-24 z-0" />
            
            <div className="flex items-center gap-6 relative z-10">
               <motion.div 
                  animate={bannerConfig.animationType === "SPARKLE" ? { rotate: [0, 10, -10, 0] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner"
               >
                  {bannerConfig.icon === "sparkles" ? <Sparkles className="w-8 h-8" /> : 
                   bannerConfig.icon === "alert" ? <AlertCircle className="w-8 h-8" /> : 
                   bannerConfig.icon === "megaphone" ? <Megaphone className="w-8 h-8" /> : 
                   bannerConfig.icon === "shield" ? <ShieldCheck className="w-8 h-8" /> : 
                   bannerConfig.icon === "zap" ? <Zap className="w-8 h-8" /> : 
                   bannerConfig.icon === "gift" ? <Gift className="w-8 h-8" /> : 
                   bannerConfig.icon === "flag" ? <Flag className="w-8 h-8" /> : 
                   bannerConfig.icon === "flame" ? <Flame className="w-8 h-8" /> : 
                   bannerConfig.icon === "palette" ? <Palette className="w-8 h-8" /> : 
                   bannerConfig.icon === "sword" ? <Sword className="w-8 h-8" /> : 
                   bannerConfig.icon === "music" ? <Music className="w-8 h-8" /> : 
                   bannerConfig.icon === "star" ? <Star className="w-8 h-8" /> : 
                   bannerConfig.icon === "moon" ? <Moon className="w-8 h-8" /> : 
                   <UserIcon className="w-8 h-8" />}
               </motion.div>
               <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-white text-[9px] font-black uppercase tracking-widest mb-2 backdrop-blur-md border border-white/30 shadow-sm">
                     <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_white]" />
                     {bannerConfig.template === "SALE" ? "EXCLUSIVE OFFER" : 
                      bannerConfig.template === "NEW_DEALS" ? `🔥 LIVE CAMPAIGNS: ${activeDeals.length} ACTIVE` :
                      bannerConfig.template === "DIWALI" ? "FESTIVE CELEBRATION" :
                      bannerConfig.template === "INDEPENDENCE_DAY" || bannerConfig.template === "REPUBLIC_DAY" ? "PATRIOTIC DAY" :
                      bannerConfig.template === "HOLI" ? "FESTIVAL OF COLORS" :
                      bannerConfig.template === "RAKHI" ? "RAKSHA BANDHAN" :
                      bannerConfig.template === "JANMASHTAMI" ? "JANMASHTAMI UTSAV" :
                      bannerConfig.template === "DUSSEHRA" ? "VIJAYADASHAMI" :
                      bannerConfig.template === "MUHARRAM" ? "MUHARRAM OBSERVANCE" :
                      bannerConfig.template === "EID" ? "EID CELEBRATION" :
                      "SYSTEM NOTICE"}
                  </div>
                  <h1 className="text-3xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                     {bannerConfig.template === "NEW_DEALS" && activeDeals.length > 0 
                        ? `🔥 ${activeDeals.length} NEW SPONSORS ONLINE` 
                        : bannerConfig.title}
                  </h1>
                  <p className="text-white/90 text-sm font-bold mt-1 drop-shadow-sm">
                     {bannerConfig.template === "NEW_DEALS" && activeDeals.length > 0 
                        ? `Secure yields for ${activeDeals.slice(0, 3).map(d => d.brandName).join(", ")}${activeDeals.length > 3 ? ' & others' : ''} now!` 
                        : bannerConfig.subtitle}
                  </p>
               </div>
            </div>

             <div className="flex items-center gap-4 relative z-10">
                <motion.button 
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   onClick={() => {
                      if (bannerConfig.actionLink) {
                         window.location.href = bannerConfig.actionLink;
                      } else if (bannerConfig.template === "NEW_DEALS") {
                         window.location.href = "/app/orders";
                      }
                   }}
                   className="px-8 py-4 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors shadow-2xl flex items-center gap-2 mr-4 hidden sm:flex"
                >
                   {bannerConfig.template === "SALE" ? "Claim Offer" : 
                    bannerConfig.template === "NEW_DEALS" ? "Earn Commissions" : 
                    "View Details"}
                   <ArrowUpRight className="w-4 h-4" />
                </motion.button>
               <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="h-16 w-16 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-xl hover:bg-white/30 transition-all flex items-center justify-center relative group"
               >
                  <Bell className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                  {unreadCount > 0 && (
                     <span className="absolute -top-1 -right-1 min-w-[22px] h-5.5 px-1.5 flex items-center justify-center bg-rose-500 text-white text-[10px] font-black rounded-full border-2 border-white shadow-lg animate-bounce">
                        {unreadCount}
                     </span>
                  )}
               </button>
            </div>
         </motion.div>
      ) : (
         <div className="flex flex-col lg:flex-row items-center justify-between gap-6 z-10">
            <motion.div 
               initial={{ opacity: 0, x: -30 }}
               animate={{ opacity: 1, x: 0 }}
               className="flex items-center gap-6"
            >
               <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 flex items-center justify-center text-white text-3xl font-black shadow-[0_20px_50px_rgba(79,70,229,0.3)] overflow-hidden">
                     {user.name?.[0] || 'S'}
                     <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-2 border-white/20 border-dashed rounded-2xl scale-75"
                     />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                     <Activity className="w-4 h-4 text-white animate-pulse" />
                  </div>
               </div>
               <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex flex-wrap items-center gap-3">
                     {getGreeting()}, <span className="text-indigo-600">{user.name?.split(" ")[0]}</span>
                     <span className="text-indigo-600 text-sm font-black uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-lg ml-2">Rank #{user.globalRank || 1}</span>
                  </h1>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">Specialist Operations Command</p>
               </div>
            </motion.div>

            <div className="flex items-center gap-4">
               <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="h-16 w-16 bg-white border border-slate-100 rounded-2xl shadow-xl hover:shadow-indigo-500/20 transition-all flex items-center justify-center relative group"
               >
                  <Bell className="w-6 h-6 text-slate-600 group-hover:text-indigo-600 transition-colors" />
                  {unreadCount > 0 && (
                     <span className="absolute -top-1 -right-1 min-w-[22px] h-5.5 px-1.5 flex items-center justify-center bg-rose-500 text-white text-[10px] font-black rounded-full border-2 border-white shadow-lg animate-bounce">
                        {unreadCount}
                     </span>
                  )}
               </button>
            </div>
         </div>
      )}

      {/* ACTION GRID - ROW 1 (4 CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 z-10">
         {[
            { 
               title: "Resolution Hub", 
               desc: "Manage tickets", 
               icon: <ShieldCheck />, 
               href: "/app/mediators/support", 
               color: "from-indigo-600 to-indigo-800" 
            },
            { 
               title: "My Activity", 
               desc: "Current assignments", 
               icon: <Activity />, 
               href: "/app/mediations", 
               color: "from-violet-500 to-violet-700" 
            },
            { 
               title: "Refunds Management", 
               desc: "Verify claim data", 
               icon: <RefreshCw />, 
               href: "/app/mediators/refunds", 
               color: "from-fuchsia-500 to-fuchsia-700" 
            },
            { 
               title: "Active Deals", 
               desc: "Platform manifest", 
               icon: <Database />, 
               href: "/app/activedeals", 
               color: "from-slate-700 to-slate-900" 
            }
         ].map((action, i) => (
            <Link key={i} href={action.href}>
               <motion.div 
                  whileHover={{ y: -8, scale: 1.02 }}
                  className={`group relative h-32 bg-gradient-to-br ${action.color} rounded-[28px] overflow-hidden p-6 flex flex-col justify-between shadow-lg hover:shadow-2xl transition-all border border-white/20`}
               >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/20 transition-colors" />
                  <div className="flex items-center justify-between relative z-10">
                     <div className="p-2.5 rounded-xl bg-white/20 text-white backdrop-blur-md shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                        {action.icon}
                     </div>
                     <ChevronRight className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                  </div>
                  <div className="relative z-10">
                     <h4 className="font-black text-white text-[12px] uppercase tracking-tight">{action.title}</h4>
                     <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest mt-1">{action.desc}</p>
                  </div>
               </motion.div>
            </Link>
         ))}
      </div>

      {/* ANALYTICS & PERFORMANCE METRICS - ROW 2 (4 CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 z-10">
         {[
            { 
               label: "Total Orders Assigned", 
               val: stats.totalOrders, 
               sub: "Lifetime Registry Load", 
               icon: <Package className="w-5 h-5" />, 
               color: "text-indigo-600",
               bg: "bg-indigo-50",
               cardBg: "bg-indigo-50/70 border-indigo-200/60 hover:bg-indigo-100/60 shadow-indigo-100/10"
            },
            { 
               label: "Commission Revenue", 
               val: `₹${(stats.totalMediatorCommission || 0).toLocaleString()}`, 
               sub: "Verified Settlement Yield", 
               icon: <Zap className="w-5 h-5" />, 
               color: "text-emerald-500",
               bg: "bg-emerald-50",
               cardBg: "bg-emerald-50/70 border-emerald-200/60 hover:bg-emerald-100/60 shadow-emerald-100/10"
            },
            { 
               label: "Active Resolution Queries", 
               val: stats.openQueries, 
               sub: "Pending Dispute Artifacts", 
               icon: <Info className="w-5 h-5" />, 
               color: "text-rose-500",
               bg: "bg-rose-50",
               cardBg: "bg-rose-50/70 border-rose-200/60 hover:bg-rose-100/60 shadow-rose-100/10"
            },
            { 
               label: "Specialist Analytics", 
               val: "Track Performance", 
               sub: "View Efficiency metrics", 
               icon: <TrendingUp className="w-5 h-5" />, 
               color: "text-amber-500",
               bg: "bg-amber-50",
               href: "/app/mediators/analytics",
               cardBg: "bg-amber-50/70 border-amber-200/60 hover:bg-amber-100/60 shadow-amber-100/10"
            }
         ].map((card, i) => {
            const cardContent = (
               <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-[40px] border p-8 shadow-sm group hover:shadow-xl hover:-translate-y-1 transition-all h-full flex flex-col justify-between ${card.cardBg}`}
               >
                  <div>
                     <div className="flex items-center gap-4 mb-6">
                        <div className={`h-12 w-12 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform bg-white/90`}>
                           {card.icon}
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
                     </div>
                     <h3 className={`text-3xl font-black ${card.color === 'text-indigo-600' ? 'text-slate-900' : card.color} tracking-tighter`}>{card.val}</h3>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                     <div className={`w-1.5 h-1.5 rounded-full ${card.color.replace('text-', 'bg-')}`} />
                     <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{card.sub}</p>
                  </div>
               </motion.div>
            );

            if (card.href) {
               return (
                  <Link key={i} href={card.href} className="block h-full">
                     {cardContent}
                  </Link>
               );
            }

            return <div key={i} className="h-full">{cardContent}</div>;
         })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
         
         {/* LEFT COLUMN - INTELLIGENCE OVERVIEW */}
         <div className="lg:col-span-8 flex flex-col gap-8">

            {/* MAIN VISUALIZATION - RADAR + TREND */}
            <div className="bg-white/40 backdrop-blur-3xl rounded-[48px] border border-white/60 p-10 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-indigo-500/10 transition-colors" />
               
               <div className="flex items-center justify-between mb-12">
                  <div>
                     <h3 className="text-2xl font-black text-slate-900 tracking-tighter">System Intelligence Feed</h3>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Global Transaction Metrics</p>
                  </div>
                  <div className="flex gap-4">
                     <button className="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100">Live View</button>
                  </div>
               </div>

                {stats.dailyActivity.length > 0 ? (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                    <div className="xl:col-span-8 h-[350px]">
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={stats.dailyActivity}>
                             <defs>
                                <linearGradient id="cyberGradient" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                   <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                             <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
                             <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                             <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'}} />
                             <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={5} fill="url(#cyberGradient)" />
                          </AreaChart>
                       </ResponsiveContainer>
                    </div>
                    <div className="xl:col-span-4 flex flex-col justify-center gap-8 border-l border-slate-50 pl-10">
                       {[
                          { label: "Network Load", val: "42%", color: "text-indigo-600" },
                          { label: "Resolution Speed", val: "1.2m", color: "text-emerald-500" },
                          { label: "Active Threads", val: "14", color: "text-amber-500" }
                       ].map((m, i) => (
                          <div key={i}>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.label}</p>
                             <h4 className={`text-3xl font-black ${m.color} tracking-tighter`}>{m.val}</h4>
                          </div>
                       ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[350px] flex flex-col items-center justify-center bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200">
                     <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 mb-4 shadow-sm">
                        <Activity className="w-8 h-8" />
                     </div>
                     <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Operational Feed Standby</p>
                     <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-2">No transaction metrics recorded in current cycle</p>
                  </div>
                )}
            </div>

            {/* LIVE OPERATION TABLE - CLEAN MINIMALIST */}
            <div className="bg-white/40 backdrop-blur-3xl rounded-[48px] border border-white/60 p-10 shadow-sm">
               <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Active Operation Stream</h3>
                  <div className="flex gap-2">
                     <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                     <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Connected</span>
                  </div>
               </div>
               <div className="space-y-4">
                  {recentOrders.slice(0, 4).map((order, i) => (
                     <div key={i} className="flex items-center justify-between p-6 rounded-[24px] bg-slate-50 hover:bg-indigo-50/50 transition-colors border border-transparent hover:border-indigo-100 group">
                        <div className="flex items-center gap-6">
                           <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center font-black text-indigo-600 text-xs">
                              {order.brandName?.[0] || 'B'}
                           </div>
                           <div>
                              <h5 className="font-black text-slate-900 text-sm">{order.userOrderId || order.aspireOrderId}</h5>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{order.brandName}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-12">
                           <div className="text-right">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                              <div className="flex items-center gap-2">
                                 <div className={`w-1.5 h-1.5 rounded-full ${order.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                                 <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">{order.status.replace(/_/g, ' ')}</span>
                              </div>
                           </div>
                           <div className="text-right w-24">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Valuation</p>
                              <p className="text-sm font-black text-slate-900 tracking-tighter">₹{order.amount.toLocaleString()}</p>
                           </div>
                           <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-600 transition-colors" />
                        </div>
                     </div>
                  ))}
               </div>
            </div>
      </div>

         {/* RIGHT COLUMN - SPECIALIST DASHBOARD UNIQUE ELEMENTS */}
         <div className="lg:col-span-4 flex flex-col gap-8">
            
            {/* SPECIALIST ANALYTICS - RADAR CHART */}
            <div className="bg-indigo-600 rounded-[48px] p-10 text-white shadow-[0_30px_60px_rgba(79,70,229,0.3)] relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
               <div className="relative z-10">
                  <h3 className="text-xl font-black uppercase tracking-tight mb-8">Skill Matrix</h3>
                  <div className="h-[250px] w-full flex items-center justify-center">
                     <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                           { subject: 'Speed', A: 120, fullMark: 150 },
                           { subject: 'Trust', A: 98, fullMark: 150 },
                           { subject: 'Volume', A: 86, fullMark: 150 },
                           { subject: 'Quality', A: 99, fullMark: 150 },
                           { subject: 'Global', A: 85, fullMark: 150 }
                        ]}>
                           <PolarGrid stroke="#ffffff20" />
                           <PolarAngleAxis dataKey="subject" tick={{fill: '#ffffff80', fontSize: 10, fontWeight: 900}} />
                           <Radar name="Specialist" dataKey="A" stroke="#ffffff" fill="#ffffff" fillOpacity={0.4} />
                        </RadarChart>
                     </ResponsiveContainer>
                  </div>
                  <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-6">
                     <div>
                        <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1">Commission</p>
                        <h4 className="text-2xl font-black tracking-tighter">₹{(stats.totalMediatorCommission || 0).toLocaleString()}</h4>
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1">Assignments</p>
                        <h4 className="text-2xl font-black tracking-tighter">{stats.totalOrders}</h4>
                     </div>
                  </div>
               </div>
            </div>

            {/* PERFORMANCE PIE */}
            <div className="bg-white/40 backdrop-blur-3xl rounded-[48px] border border-white/60 p-10 shadow-sm">
               <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-8 text-center">Operational Mix</h3>
               {stats.statusDistribution.length > 0 ? (
                 <>
                   <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Pie
                               data={stats.statusDistribution}
                               innerRadius={60}
                               outerRadius={80}
                               paddingAngle={8}
                               dataKey="value"
                            >
                               {stats.statusDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                               ))}
                            </Pie>
                            <Tooltip />
                         </PieChart>
                      </ResponsiveContainer>
                   </div>
                   <div className="mt-10 space-y-4">
                      {stats.statusDistribution.slice(0, 3).map((entry, idx) => (
                         <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{entry.name.replace(/_/g, ' ')}</span>
                            </div>
                            <span className="font-black text-slate-900 text-sm">{entry.value}</span>
                         </div>
                      ))}
                   </div>
                 </>
               ) : (
                 <div className="py-20 flex flex-col items-center justify-center text-center">
                    <div className="h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-200 mb-4 border border-slate-100">
                       <Zap className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Awaiting Operation Data</p>
                 </div>
               )}
            </div>



         </div>
      </div>

    </div>
  );
}
