"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserBadge } from "@/components/ui/UserBadge";
import { BannerConfig } from "@/components/admin/BannerManager";
import { usePusher } from "@/hooks/usePusher";
import toast from "react-hot-toast";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line
} from "recharts";
import { 
  TrendingUp, Package, RefreshCw, MoreVertical, Search, Filter, 
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, XCircle, ChevronRight,
  Bell, X, Zap, ShieldCheck, Info, Sparkles, AlertCircle, Megaphone, User as UserIcon, Gift,
  Flag, Flame, Palette, Sword, Music, Star, Moon, ShoppingBag, Trophy
} from "lucide-react";
import { useMotionValue, useTransform, useSpring } from "framer-motion";

interface BuyerDashboardProps {
  user: {
    name?: string | null;
    role: string;
    totalCompletedOrders?: number;
    globalRank?: number;
    previousRefundAmount?: number;
    previousRefundFetched?: boolean;
    mobile?: string;
    leaderboardBadge?: {
      rank: number;
      month: string;
      active: boolean;
    };
  };
  stats: {
    active: number;
    pending: number;
    completed: number;
    totalOrders: number;
    totalAvailableStock: number;
    totalRefundAmount: number;
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

const STATUS_COLORS: Record<string, string> = {
  'Form Pending': '#f59e0b',
  'Under Verification': '#8b5cf6',
  'Approved': '#10b981',
  'Completed': '#3b82f6',
  'Rejected': '#ef4444',
  'Cancelled': '#64748b'
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6', '#64748b'];

export default function BuyerDashboard({ 
  user, 
  stats, 
  recentOrders, 
  isSidebarOpen, 
  setIsSidebarOpen,
  mouseX,
  mouseY,
  unreadCount
}: BuyerDashboardProps) {
  
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('weekly');
  const [bannerConfig, setBannerConfig] = useState<BannerConfig | null>(null);
  const [isLoadingBanner, setIsLoadingBanner] = useState(true);
  const [activeDeals, setActiveDeals] = useState<any[]>([]);
  const [showRefundPopup, setShowRefundPopup] = useState(false);
  const [eligibleRefundAmount, setEligibleRefundAmount] = useState(0);
  const [isFetchingRefund, setIsFetchingRefund] = useState(false);
  const [localPreviousRefundFetched, setLocalPreviousRefundFetched] = useState(user.previousRefundFetched || false);
  const [localPreviousRefundAmount, setLocalPreviousRefundAmount] = useState(user.previousRefundAmount || 0);

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

    if (!user.previousRefundFetched) {
      fetch("/api/refunds/previous")
        .then(res => res.json())
        .then(json => {
          if (json.success && json.eligible) {
            setEligibleRefundAmount(json.amount);
            setShowRefundPopup(true);
          }
        })
        .catch(err => console.error("Error checking previous refund:", err));
    }
  }, [user.previousRefundFetched]);

  const handleFetchRefund = async () => {
    try {
      setIsFetchingRefund(true);
      const res = await fetch("/api/refunds/previous", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setLocalPreviousRefundAmount(json.amount);
        setLocalPreviousRefundFetched(true);
        setShowRefundPopup(false);
        toast.success("Previous refund amount fetched successfully!");
      } else {
        toast.error(json.message || "Failed to fetch previous refund amount");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setIsFetchingRefund(false);
    }
  };

  usePusher(
    "public-deals",
    "deal-created",
    (newDeal: any) => {
      console.log("[Pusher Live Deal Event] New deal added:", newDeal);
      fetchActiveDeals();
      toast.success(`🔥 New Sponsor Campaign: ${newDeal.brandName}! Claim cashbacks!`, {
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

  const rotateX = useSpring(useTransform(mouseY, [-500, 500], [15, -15]), { stiffness: 100, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-500, 500], [-15, 15]), { stiffness: 100, damping: 30 });

  function handleMouseMove(event: React.MouseEvent) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
  }

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  const isBannerValid = bannerConfig?.isActive && 
                        bannerConfig.template !== "DEFAULT" && 
                        (!bannerConfig.expiresAt || new Date(bannerConfig.expiresAt) > new Date()) &&
                        (bannerConfig.targetAudience === "ALL" || bannerConfig.targetAudience === "BUYER");

  return (
    <div className="flex flex-col gap-8 pb-20 max-w-[1600px] mx-auto">
      
      {/* PREVIOUS REFUND POPUP */}
      <AnimatePresence>
        {showRefundPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowRefundPopup(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />
              
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-500/30">
                  <RefreshCw className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Previous Refund</h3>
                <p className="text-sm font-bold text-slate-500 leading-relaxed mb-6">
                  We found a previous refund record associated with your account. Fetch it now to add it to your total dashboard!
                </p>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 w-full mb-6">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Previous Processed Refund Amount</p>
                   <p className="text-3xl font-black text-indigo-600">₹{eligibleRefundAmount.toLocaleString()}</p>
                </div>
                <button
                  onClick={handleFetchRefund}
                  disabled={isFetchingRefund}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isFetchingRefund ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Fetch Refund
                    </>
                  )}
                </button>
              </div>
              <button 
                onClick={() => setShowRefundPopup(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* COMMANDER PROFILE STRIP OR GLOBAL BANNER */}
      {isLoadingBanner ? (
         <div className="px-2 flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-3xl p-6 rounded-[32px] shadow-sm bg-[#eef2ff]/50 border border-indigo-100/50">
            <div className="flex items-center gap-6">
               <div className="w-20 h-20 rounded-[24px] bg-indigo-100/50 animate-pulse" />
               <div className="space-y-3">
                  <div className="w-32 h-4 bg-indigo-100/50 rounded animate-pulse" />
                  <div className="w-48 h-8 bg-indigo-100/50 rounded animate-pulse" />
               </div>
            </div>
         </div>
      ) : (
      <motion.div 
         initial={{ opacity: 0, x: -20 }}
         animate={{ opacity: 1, x: 0 }}
         className={`px-2 flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-3xl p-6 rounded-[32px] shadow-sm group hover:shadow-xl transition-all relative overflow-hidden ${
            isBannerValid 
               ? 'border-none' 
               : user.leaderboardBadge?.active
               ? 'bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-600/10 border border-amber-300/50 shadow-md shadow-amber-500/5'
               : 'bg-[#eef2ff] border border-indigo-100/50'
         }`}
         style={{
            background: isBannerValid
               ? `linear-gradient(135deg, var(--tw-gradient-stops))`
               : undefined
         }}
      >
         {isBannerValid ? (
            <div className="absolute inset-0 z-0" style={{ background: bannerConfig.bgGradient }} />
         ) : null}

         {isBannerValid && (
            <>
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
            </>
         )}

         {isBannerValid ? (
            <>
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
                           ? `🔥 ${activeDeals.length} NEW DEALS LIVE` 
                           : bannerConfig.title}
                     </h1>
                     <p className="text-white/90 text-sm font-bold mt-1 drop-shadow-sm">
                        {bannerConfig.template === "NEW_DEALS" && activeDeals.length > 0 
                           ? `Earn cashbacks from ${activeDeals.slice(0, 3).map(d => d.brandName).join(", ")}${activeDeals.length > 3 ? ' & others' : ''} now!` 
                           : bannerConfig.subtitle}
                     </p>
                  </div>
               </div>
               <div className="flex items-center gap-10 pr-4 relative z-10">
                  <div className="text-right hidden sm:block text-white">
                     <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                           if (bannerConfig.actionLink) {
                              router.push(bannerConfig.actionLink);
                           } else if (bannerConfig.template === "NEW_DEALS") {
                              router.push("/app/activedeals");
                           }
                        }}
                        className="px-8 py-4 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors shadow-2xl flex items-center gap-2"
                     >
                        {bannerConfig.template === "SALE" ? "Claim Offer" : 
                         bannerConfig.template === "NEW_DEALS" ? "Claim Cashback" : 
                         "View Details"}
                        <ArrowUpRight className="w-4 h-4" />
                     </motion.button>
                  </div>
               </div>
            </>
         ) : (
            <>
               <div className="flex items-center gap-6 relative z-10">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-2xl relative overflow-hidden group-hover:scale-105 transition-transform ${
                      user.leaderboardBadge?.active 
                         ? user.leaderboardBadge.rank === 1
                            ? 'bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 ring-4 ring-amber-300 ring-offset-2 animate-pulse'
                            : user.leaderboardBadge.rank === 2
                            ? 'bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600 ring-4 ring-slate-300 ring-offset-2 animate-pulse'
                            : 'bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 ring-4 ring-orange-300 ring-offset-2 animate-pulse'
                         : 'bg-gradient-to-br from-slate-900 to-slate-800'
                   }`}>
                     {user.name?.[0] || 'U'}
                     <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div>
                     <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                           {user.leaderboardBadge?.active 
                               ? `👑 Rank #${user.leaderboardBadge.rank} Champion, ` 
                               : `${getGreeting()}, `}
                           <span className="text-indigo-600">{user.name?.split(" ")[0]}</span>
                        </h1>
                        <div className="flex items-center gap-2">
                           <UserBadge 
                              ordersCount={user.totalCompletedOrders || 0} 
                              showIcon={true} 
                              showProgression={true} 
                              className="scale-110" 
                           />
                           {user.leaderboardBadge?.active && (
                             <div className={`flex items-center gap-1.5 px-3 py-1 text-white rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse border shadow-md ${
                                 user.leaderboardBadge.rank === 1
                                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 border-amber-400 shadow-amber-500/20'
                                    : user.leaderboardBadge.rank === 2
                                    ? 'bg-gradient-to-r from-slate-400 via-slate-500 to-slate-600 border-slate-300 shadow-slate-500/20'
                                    : 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 border-orange-400 shadow-orange-500/20'
                              }`} title={`Crowned Rank #${user.leaderboardBadge.rank} Buyer in ${user.leaderboardBadge.month}!`}>
                               <Trophy className="w-3.5 h-3.5" />
                               <span>Leaderboard Rank #{user.leaderboardBadge.rank}</span>
                             </div>
                           )}
                        </div>
                     </div>
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3 text-indigo-600" />
                        Authorized {user.role} Command
                     </p>
                  </div>
               </div>

               <div className="flex items-center gap-10 pr-4 relative z-10">
                  <div className="text-right hidden sm:block">
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Account Standing</p>
                     <p className="text-sm font-black text-emerald-600 uppercase tracking-tighter">Verified • High Trust</p>
                  </div>
                  <div className="w-px h-10 bg-slate-200 hidden sm:block" />
                  <div className="flex -space-x-3">
                     {[1, 2, 3].map(i => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[10px] shadow-sm overflow-hidden">
                           <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 40}`} alt="avatar" />
                        </div>
                     ))}
                     <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-600 flex items-center justify-center text-[8px] font-black text-white shadow-xl">
                        +12k
                     </div>
                  </div>
               </div>
            </>
         )}
      </motion.div>
      )}

      {/* HEADER AREA - QUICK ACTIONS */}
      <div className="px-2">
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {[
               { title: "Order Form", desc: "Initialize transaction", icon: <Package className="w-7 h-7" />, href: "/app/orders/new", color: "from-blue-600 to-indigo-700", shadow: "shadow-blue-600/30", glow: "bg-blue-600" },
               { title: "Refund Form", desc: "Submit claim data", icon: <RefreshCw className="w-7 h-7" />, href: "/app/refunds/verify", color: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-500/30", glow: "bg-emerald-500" },
               { title: "Track Order", desc: "Check live status", icon: <TrendingUp className="w-7 h-7" />, href: "/app/orders/track", color: "from-violet-600 to-purple-700", shadow: "shadow-violet-600/30", glow: "bg-violet-600" },
               { title: "Active Deals", desc: "Current operations", icon: <Package className="w-7 h-7" />, href: "/app/activedeals", color: "from-rose-500 to-pink-600", shadow: "shadow-rose-500/30", glow: "bg-rose-500" },
               { title: "Support", desc: "Support & Help", icon: <Clock className="w-7 h-7" />, href: "/app/support", color: "from-amber-400 to-orange-600", shadow: "shadow-amber-500/30", glow: "bg-amber-400" }
            ].map((card, idx) => (
               <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, type: "spring", stiffness: 100 }}
                  whileHover={{ y: -8, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
               >
                  <Link href={card.href} className="block w-full">
                     <div className="group relative w-full h-28 rounded-[42px] border border-white/40 p-5 sm:p-6 flex items-center gap-4 sm:gap-5 shadow-xl hover:shadow-2xl transition-all cursor-pointer overflow-hidden backdrop-blur-2xl bg-white/60">
                        <div className={`absolute -top-12 -right-12 w-40 h-40 ${card.glow} rounded-full blur-[70px] opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />
                        <div className={`absolute -bottom-12 -left-12 w-32 h-32 ${card.glow} rounded-full blur-[60px] opacity-10 group-hover:opacity-25 transition-opacity duration-700`} />
                        
                        <div className={`w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-[22px] bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-2xl ${card.shadow} group-hover:rotate-[15deg] group-hover:scale-110 transition-all duration-500 relative z-10`}>
                           {card.icon}
                        </div>
                        <div className="relative z-10 overflow-hidden">
                           <h4 className="text-[13px] sm:text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight leading-tight">
                              {card.title.split(" ").length > 1 ? (
                                 <>
                                    <span className="block 2xl:inline">{card.title.split(" ")[0]}</span>
                                    <span className="block 2xl:inline 2xl:ml-1">{card.title.split(" ")[1]}</span>
                                 </>
                              ) : (
                                 card.title
                              )}
                           </h4>
                        </div>
                     </div>
                  </Link>
               </motion.div>
            ))}
         </div>
      </div>

      {/* TOP STATS ROW */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-8 px-2"
      >
        {[
           { 
              label: "Total Orders", 
              value: stats.totalOrders.toLocaleString(), 
              icon: <TrendingUp className="w-7 h-7" />, 
              color: "from-blue-600 to-indigo-600", 
              bg: "bg-blue-50", 
              percentage: "100%",
              particleColor: "bg-blue-400"
           },
           { 
              label: "Total Refund", 
              value: `₹${(stats.totalRefundAmount + localPreviousRefundAmount).toLocaleString()}`, 
              icon: <RefreshCw className="w-7 h-7" />, 
              color: "from-emerald-500 to-teal-500", 
              bg: "bg-emerald-50", 
              percentage: "Success",
              particleColor: "bg-emerald-400",
              subtext: localPreviousRefundFetched && localPreviousRefundAmount > 0 ? `Previous refund amount paid: ₹${localPreviousRefundAmount.toLocaleString()}` : undefined
           },
           { 
              label: "Open Support", 
              value: stats.openQueries.toLocaleString(), 
              icon: <TrendingUp className="w-7 h-7" />, 
              color: "from-rose-500 to-orange-500", 
              bg: "bg-rose-50", 
              percentage: "Live",
              particleColor: "bg-rose-400"
           }
        ].map((stat, idx) => (
           <motion.div 
             key={idx}
             variants={item} 
             whileHover={{ y: -10, scale: 1.02 }}
             className="p-8 rounded-[48px] border border-white/50 shadow-xl flex items-center justify-between group hover:shadow-2xl transition-all relative overflow-hidden backdrop-blur-3xl bg-slate-50/40"
           >
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20 group-hover:opacity-40 transition-opacity">
                 {[...Array(6)].map((_, i) => (
                    <motion.div
                       key={i}
                       className={`absolute w-12 h-12 rounded-full blur-xl ${stat.particleColor}`}
                       animate={{
                          x: [Math.random() * 300, Math.random() * 300, Math.random() * 300],
                          y: [Math.random() * 150, Math.random() * 150, Math.random() * 150],
                          scale: [1, 1.5, 1],
                       }}
                       transition={{
                          duration: 10 + Math.random() * 10,
                          repeat: Infinity,
                          ease: "linear"
                       }}
                       style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                       }}
                    />
                 ))}
              </div>

              <div className={`absolute -top-10 -right-10 w-48 h-48 bg-gradient-to-br ${stat.color} rounded-full blur-[100px] opacity-10 group-hover:opacity-25 transition-opacity duration-700`} />
              <div className={`absolute -bottom-20 -left-20 w-56 h-56 ${stat.bg} rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
              
              <div className="flex items-center gap-6 relative z-10">
                 <div className={`w-18 h-18 sm:w-20 sm:h-20 rounded-[28px] ${stat.bg} flex items-center justify-center group-hover:bg-gradient-to-br ${stat.color} transition-all duration-500 shadow-sm group-hover:shadow-xl group-hover:shadow-blue-600/20`}>
                    <div className="text-blue-600 group-hover:text-white transition-colors">
                       {stat.icon}
                    </div>
                 </div>
                 <div>
                    <h3 className="text-3xl sm:text-4xl font-black text-slate-900 leading-none tracking-tighter">{stat.value}</h3>
                    <p className="text-[10px] font-black text-slate-500 mt-4 uppercase tracking-[0.3em] opacity-70">{stat.label}</p>
                    {stat.subtext && (
                        <p className="text-xs font-bold text-emerald-600 mt-2">{stat.subtext}</p>
                     )}
                 </div>
              </div>
              <div className="flex flex-col items-end relative z-10">
                 <div className={`w-16 h-16 rounded-full border-[6px] border-white flex items-center justify-center text-[9px] font-black text-slate-900 shadow-xl group-hover:border-slate-100 transition-all relative bg-white/40 backdrop-blur-md`}>
                    <div className="absolute inset-0 rounded-full border-[6px] border-transparent border-t-blue-600 group-hover:rotate-[360deg] transition-transform duration-1000" />
                    {stat.percentage}
                 </div>
                 <MoreVertical className="w-4 h-4 text-slate-300 mt-5 group-hover:text-slate-500 transition-colors" />
              </div>
           </motion.div>
        ))}
      </motion.div>

      {/* SECOND ROW - MAIN CHARTS */}
      <div onMouseMove={handleMouseMove} className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
         
         <div className="absolute -top-20 -left-20 w-96 h-96 pointer-events-none opacity-50 z-0 hidden xl:block">
            <motion.div 
               style={{ rotateX, rotateY, perspective: 1000 }}
               className="relative w-full h-full flex items-center justify-center"
            >
               <motion.div className="absolute w-64 h-64 border-[30px] border-blue-600/10 rounded-[60px] rotate-45" />
               <motion.div className="absolute w-48 h-48 border-[15px] border-indigo-600/20 rounded-[40px] -rotate-12" />
               <motion.div className="absolute w-32 h-32 bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-full blur-2xl" />
            </motion.div>
         </div>

         <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-8 bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm"
         >
            <div className="flex items-center justify-between mb-10">
               <div>
                  <h3 className="text-xl font-black text-slate-900">My Activity Graph</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Daily Participation Volume</p>
               </div>
               <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  {['Daily', 'Weekly', 'Monthly'].map((tab) => (
                     <button 
                        key={tab}
                        onClick={() => setActiveTab(tab.toLowerCase())}
                        className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab.toLowerCase() ? "bg-white text-blue-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"}`}
                     >
                        {tab}
                     </button>
                  ))}
               </div>
            </div>

            <div className="h-[400px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.dailyActivity.length > 0 ? stats.dailyActivity : [
                     { name: '01-01', value: 10 }, { name: '01-02', value: 25 }, { name: '01-03', value: 18 },
                     { name: '01-04', value: 45 }, { name: '01-05', value: 30 }, { name: '01-06', value: 55 }
                  ]}>
                     <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                           <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                        dy={10}
                     />
                     <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                     />
                     <Tooltip 
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                     />
                     <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3b82f6" 
                        strokeWidth={4} 
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                     />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </motion.div>

         <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-4 bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm"
         >
            <h3 className="text-xl font-black text-slate-900 mb-8">Order Chart</h3>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={stats.statusDistribution.length > 0 ? stats.statusDistribution : [
                           { name: 'Active', value: 400 }, { name: 'Pending', value: 300 }, { name: 'Completed', value: 300 }
                        ]}
                        innerRadius={80}
                        outerRadius={100}
                        paddingAngle={10}
                        dataKey="value"
                     >
                        {stats.statusDistribution.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                        ))}
                     </Pie>
                     <Tooltip />
                  </PieChart>
               </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-10">
                {stats.statusDistribution.slice(0, 6).map((entry, idx) => (
                   <div key={idx} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[entry.name] || COLORS[idx % COLORS.length] }} />
                      <div>
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{entry.name.replace(/_/g, ' ')}</p>
                         <p className="text-sm font-black text-slate-800">{entry.value}</p>
                      </div>
                   </div>
                ))}
            </div>
         </motion.div>
      </div>

      {/* RECENT ACTIVITY TABLE */}
      <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.4 }}
         className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm"
      >
         <div className="flex items-center justify-between mb-10">
            <div>
               <h3 className="text-2xl font-black text-slate-900">Platform Activity</h3>
               <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Recent Deal Transitions</p>
            </div>
            <Link href="/app/orders" className="px-6 py-3 bg-slate-50 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors border border-slate-100">
               View Full History
            </Link>
         </div>

         {recentOrders.length === 0 ? (
            <div className="py-20 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
               <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300">
                  <Package className="w-8 h-8" />
               </div>
               <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No activity detected yet</p>
            </div>
         ) : (
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="border-b border-slate-50">
                        <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                        <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Brand</th>
                        <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="pb-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                        <th className="pb-6 w-16"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {recentOrders.map((order, idx) => (
                        <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                           <td className="py-5">
                              <p className="text-sm font-black text-slate-900">{order.userOrderId || order.aspireOrderId}</p>
                              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString()}</p>
                           </td>
                           <td className="py-5">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 font-black text-xs uppercase">
                                    {order.brandName?.[0] || 'B'}
                                 </div>
                                 <span className="text-sm font-black text-slate-700">{order.brandName}</span>
                              </div>
                           </td>
                           <td className="py-5">
                              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                 order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                                 order.status === 'ACTIVE_ESCROW' ? 'bg-blue-50 text-blue-600' :
                                 'bg-amber-50 text-amber-600'
                              }`}>
                                 {order.status === 'COMPLETED' ? <CheckCircle2 className="w-3 h-3" /> : 
                                  order.status === 'ACTIVE_ESCROW' ? <ShieldCheck className="w-3 h-3" /> :
                                  <Clock className="w-3 h-3" />}
                                 {order.status.replace(/_/g, ' ')}
                              </div>
                           </td>
                           <td className="py-5 text-right">
                              <p className="text-sm font-black text-slate-900">₹{order.amount.toLocaleString()}</p>
                           </td>
                           <td className="py-5 text-right">
                              <Link href={`/app/orders/${order._id}`}>
                                 <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-blue-600 transition-colors" />
                              </Link>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </motion.div>

    </div>
  );
}
