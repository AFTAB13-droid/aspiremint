"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserBadge } from "@/components/ui/UserBadge";
import { BannerConfig } from "@/components/admin/BannerManager";
import { usePusher } from "@/hooks/usePusher";
import toast from "react-hot-toast";
import { 
  TrendingUp, Package, RefreshCw, Clock, CheckCircle2, ChevronRight, X,
  ShieldCheck, AlertCircle, Sparkles, Megaphone, User as UserIcon, Wallet, Activity, Zap, Gift,
  Flag, Flame, Palette, Sword, Music, Star, Moon
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  'Form Pending': '#f59e0b',
  'Under Verification': '#8b5cf6',
  'Approved': '#10b981',
  'Completed': '#3b82f6',
  'Rejected': '#ef4444',
  'Cancelled': '#64748b'
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6', '#64748b'];

interface BuyerDashboardProps {
  user: {
    name?: string | null;
    role: string;
    totalCompletedOrders?: number;
    globalRank?: number;
    previousRefundAmount?: number;
    previousRefundFetched?: boolean;
    mobile?: string;
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

export default function MobileBuyerDashboard({ 
  user, 
  stats, 
  recentOrders, 
  unreadCount 
}: BuyerDashboardProps) {
  
  const router = useRouter();
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

  const isBannerValid = bannerConfig?.isActive && 
                        bannerConfig.template !== "DEFAULT" && 
                        (!bannerConfig.expiresAt || new Date(bannerConfig.expiresAt) > new Date()) &&
                        (bannerConfig.targetAudience === "ALL" || bannerConfig.targetAudience === "BUYER");

  return (
    <div className="flex flex-col gap-5 pb-24 bg-slate-50 min-h-screen -mt-4 pt-6">
      
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
                  <Wallet className="w-8 h-8" />
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
      
      {/* HEADER / BANNER */}
      {isLoadingBanner ? (
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
           <div className="w-12 h-12 rounded-full bg-slate-200 animate-pulse" />
           <div className="space-y-2">
              <div className="w-24 h-3 bg-slate-200 rounded animate-pulse" />
              <div className="w-32 h-5 bg-slate-200 rounded animate-pulse" />
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
              router.push("/app/activedeals");
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
                 bannerConfig.icon === "flag" ? <Flag className="w-6 h-6" /> : 
                 bannerConfig.icon === "flame" ? <Flame className="w-6 h-6" /> : 
                 bannerConfig.icon === "palette" ? <Palette className="w-6 h-6" /> : 
                 bannerConfig.icon === "sword" ? <Sword className="w-6 h-6" /> : 
                 bannerConfig.icon === "music" ? <Music className="w-6 h-6" /> : 
                 bannerConfig.icon === "star" ? <Star className="w-6 h-6" /> : 
                 bannerConfig.icon === "moon" ? <Moon className="w-6 h-6" /> : 
                 <UserIcon className="w-6 h-6" />}
             </div>
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white/20 rounded-full text-[8px] font-black uppercase tracking-widest mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                {bannerConfig.template === "SALE" ? "OFFER" : 
                 bannerConfig.template === "NEW_DEALS" ? `🔥 LIVE: ${activeDeals.length}` : 
                 bannerConfig.template === "DIWALI" ? "DIWALI" :
                 bannerConfig.template === "INDEPENDENCE_DAY" || bannerConfig.template === "REPUBLIC_DAY" ? "PATRIOTIC" :
                 bannerConfig.template === "HOLI" ? "HOLI" :
                 bannerConfig.template === "RAKHI" ? "RAKHI" :
                 bannerConfig.template === "JANMASHTAMI" ? "JANMASHTAMI" :
                 bannerConfig.template === "DUSSEHRA" ? "DUSSEHRA" :
                 bannerConfig.template === "MUHARRAM" ? "MUHARRAM" :
                 bannerConfig.template === "EID" ? "EID" :
                 "NOTICE"}
              </div>
              <h1 className="text-xl font-black tracking-tight leading-tight mb-1">
                {bannerConfig.template === "NEW_DEALS" && activeDeals.length > 0 
                   ? `🔥 ${activeDeals.length} NEW DEALS LIVE` 
                   : bannerConfig.title}
              </h1>
              <p className="text-white/90 text-xs font-bold leading-relaxed">
                {bannerConfig.template === "NEW_DEALS" && activeDeals.length > 0 
                   ? `Earn cashbacks from ${activeDeals.slice(0, 2).map(d => d.brandName).join(", ")}${activeDeals.length > 2 ? ' & others' : ''} now!` 
                   : bannerConfig.subtitle}
              </p>
            </div>
          </div>
          {(bannerConfig.actionLink || bannerConfig.template === "NEW_DEALS") && (
             <div className="relative z-10 mt-1 flex items-center justify-between bg-black/20 rounded-xl p-3 backdrop-blur-sm">
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {bannerConfig.template === "NEW_DEALS" ? "Claim Cashback" : "View Details"}
                </span>
                <ChevronRight className="w-4 h-4" />
             </div>
          )}
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between px-4 pt-4 pb-2"
        >
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-lg font-black shadow-lg">
                {user.name?.[0] || 'U'}
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Good {getGreeting()}</p>
                <div className="flex items-center gap-2">
                   <h1 className="text-xl font-black text-slate-900 tracking-tight">{user.name?.split(" ")[0]}</h1>
                   {user.totalCompletedOrders && user.totalCompletedOrders > 5 && (
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                   )}
                </div>
             </div>
          </div>
        </motion.div>
      )}

      {/* QUICK ACTIONS (Fixed App Grid) */}
      <div className="grid grid-cols-4 gap-2 bg-white px-4 py-6 rounded-[32px] shadow-sm border border-slate-100">
         {[
            { title: "New Order", icon: <Package className="w-6 h-6" />, href: "/app/orders/new", color: "from-blue-500 to-indigo-600", bg: "bg-blue-500/10", text: "text-blue-600" },
            { title: "Refund", icon: <RefreshCw className="w-6 h-6" />, href: "/app/refunds/verify", color: "from-emerald-400 to-teal-500", bg: "bg-emerald-500/10", text: "text-emerald-600" },
            { title: "Track", icon: <TrendingUp className="w-6 h-6" />, href: "/app/orders/track", color: "from-violet-500 to-purple-600", bg: "bg-violet-500/10", text: "text-violet-600" },
            { title: "Support", icon: <Clock className="w-6 h-6" />, href: "/app/support", color: "from-amber-400 to-orange-500", bg: "bg-amber-500/10", text: "text-orange-600" }
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

      {/* WALLET / STATS CARD (App Style) */}
      <motion.div 
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         className="bg-slate-900 p-6 rounded-[32px] text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20"
      >
         <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
         <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl -ml-10 -mb-10" />
         
         <div className="relative z-10 flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-blue-200">
               <Wallet className="w-4 h-4" />
               <span className="text-[10px] font-black uppercase tracking-widest">Total Refund</span>
            </div>
         </div>
         
         <div className="relative z-10">
            <h2 className="text-4xl font-black tracking-tighter">₹{(stats.totalRefundAmount + localPreviousRefundAmount).toLocaleString()}</h2>
            {localPreviousRefundFetched && localPreviousRefundAmount > 0 && (
               <p className="text-xs font-bold text-blue-200 mt-2">
                  Previous refund amount paid: ₹{localPreviousRefundAmount.toLocaleString()}
               </p>
            )}
         </div>

         <div className="relative z-10 mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Orders</p>
               <p className="text-xl font-black">{stats.totalOrders.toLocaleString()}</p>
            </div>
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active</p>
               <p className="text-xl font-black text-emerald-400">{stats.active.toLocaleString()}</p>
            </div>
         </div>
      </motion.div>


      {/* MINI CHART (Activity) */}
      {stats.dailyActivity.length > 0 && (
         <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-black text-slate-900">Activity Trend</h3>
               </div>
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">7 Days</span>
            </div>
            <div className="h-28 w-full -ml-4">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.dailyActivity}>
                     <defs>
                        <linearGradient id="colorMobile" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3b82f6" 
                        strokeWidth={3} 
                        fill="url(#colorMobile)" 
                     />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>
      )}

      {/* PIE CHART (Order Statuses) */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
         <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-900">Order Status Distribution</h3>
         </div>
         <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                  <Pie
                     data={stats.statusDistribution.length > 0 ? stats.statusDistribution : [
                        { name: 'Active', value: 400 }, { name: 'Pending', value: 300 }, { name: 'Completed', value: 300 }
                     ]}
                     innerRadius={50}
                     outerRadius={70}
                     paddingAngle={5}
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
         <div className="grid grid-cols-2 gap-3 mt-4">
            {stats.statusDistribution.slice(0, 6).map((entry, idx) => (
               <div key={idx} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[entry.name] || COLORS[idx % COLORS.length] }} />
                  <div>
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{entry.name.replace(/_/g, ' ')}</p>
                     <p className="text-xs font-black text-slate-800">{entry.value}</p>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* RECENT ORDERS LIST */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm py-4">
         <div className="flex items-center justify-between mb-2 px-6">
            <h3 className="text-lg font-black text-slate-900">Recent Deals</h3>
            <Link href="/app/orders" className="text-xs font-bold text-blue-600 tracking-wide">See All</Link>
         </div>

         {recentOrders.length === 0 ? (
            <div className="py-12 text-center bg-slate-50/50 mx-4 rounded-[20px] mt-4">
               <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
               <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No recent activity</p>
            </div>
         ) : (
            <div className="flex flex-col">
               {recentOrders.slice(0, 5).map((order, idx) => (
                  <Link key={idx} href={`/app/orders/${order._id}`}>
                     <div className="p-4 px-6 flex items-center justify-between active:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                        <div className="flex items-center gap-3">
                           <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center font-black text-lg shadow-sm
                              ${order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                                order.status === 'ACTIVE_ESCROW' ? 'bg-blue-50 text-blue-600' :
                                'bg-amber-50 text-amber-600'}
                           `}>
                              {order.brandName?.[0] || 'B'}
                           </div>
                           <div>
                              <p className="text-sm font-black text-slate-900 line-clamp-1">{order.brandName}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{order.userOrderId || order.aspireOrderId}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-sm font-black text-slate-900">₹{order.amount.toLocaleString()}</p>
                           <p className={`text-[9px] font-black uppercase tracking-widest mt-1
                              ${order.status === 'COMPLETED' ? 'text-emerald-500' :
                                order.status === 'ACTIVE_ESCROW' ? 'text-blue-500' :
                                'text-amber-500'}
                           `}>
                              {order.status.replace(/_/g, ' ')}
                           </p>
                        </div>
                     </div>
                  </Link>
               ))}
            </div>
         )}
      </div>

    </div>
  );
}
