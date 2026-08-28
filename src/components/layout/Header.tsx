"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Logo } from "@/components/common/Logo";
import { NotificationSidebar } from "./NotificationSidebar";
import { UserBadge } from "@/components/ui/UserBadge";

interface HeaderProps {
  setMobileOpen: (open: boolean) => void;
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
    totalCompletedOrders?: number;
    leaderboardBadge?: {
      rank: number;
      month: string;
      active: boolean;
    };
  };
}

export const Header: React.FC<HeaderProps> = ({ setMobileOpen, user }) => {
  const isAdm = user?.role === "ADMIN";
  const pathname = usePathname();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const isBadgeActive = user?.leaderboardBadge?.active;
  const rank = user?.leaderboardBadge?.rank;

  // Header background gradients according to reward rank
  let headerBgClass = "bg-white/80 border-b-2 border-blue-200/60";
  if (isBadgeActive) {
    if (rank === 1) {
      headerBgClass = "bg-gradient-to-r from-amber-50/90 via-amber-100/30 to-yellow-50/80 border-b-2 border-amber-300/60";
    } else if (rank === 2) {
      headerBgClass = "bg-gradient-to-r from-slate-100/90 via-white to-slate-200/60 border-b-2 border-slate-300/60";
    } else if (rank === 3) {
      headerBgClass = "bg-gradient-to-r from-amber-50/40 via-white to-orange-50/50 border-b-2 border-orange-200/40";
    }
  }

  // Map route to title for native-app feel on mobile
  const getPageTitle = () => {
    if (pathname.includes("/app/activedeals")) return "Active Deals";
    if (pathname.includes("/app/orders/new")) return "New Order";
    if (pathname.split("/").length > 4 && pathname.includes("/app/orders/")) return "Order Details";
    if (pathname.includes("/app/orders")) return "My Orders";
    if (pathname.includes("/app/refunds/fill")) return "Apply Refund";
    if (pathname.includes("/app/refunds")) return "My Refunds";
    if (pathname.includes("/app/settings")) return "Settings";
    if (pathname.includes("/app/support")) return "Support Hub";
    if (pathname.includes("/app/wallet")) return "Passbook";
    if (pathname.includes("/app/users")) return "User Directory";
    if (pathname.includes("/app/mediators")) return "Mediators Hub";
    if (pathname.includes("/app/reports")) return "Analytics";
    if (pathname === "/app") return "Dashboard";
    return "AspireMint";
  };

  // Fetch unread count safely without throwing JSON parse errors on idle/500/HTML responses
  const fetchUnreadCount = async () => {
    try {
      const res = await fetch("/api/notifications/count");
      if (!res.ok) return;
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) return;
      
      const json = await res.json();
      if (json.success) setUnreadCount(json.data.count);
    } catch (err) {
      console.error("Failed to fetch notification count", err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Poll for count updates every 10 seconds
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className={`sticky top-0 z-30 flex h-20 w-full items-center justify-between backdrop-blur-3xl px-6 lg:px-10 relative overflow-hidden transition-all duration-300 ${headerBgClass}`}>
      {/* Advanced Floral & Line Aesthetic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
        {/* Soft Base Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-r ${
           isBadgeActive 
              ? rank === 1 
                 ? "from-amber-100/30 via-white to-yellow-100/20" 
                 : rank === 2
                 ? "from-slate-100/30 via-white to-slate-200/20"
                 : "from-amber-100/10 via-white to-orange-100/10"
              : "from-sky-50/50 via-white to-blue-50/50"
        }`} />
        
        <svg className={`absolute inset-0 w-full h-full ${
           isBadgeActive 
              ? rank === 1 
                 ? "text-amber-500" 
                 : rank === 2
                 ? "text-slate-400"
                 : "text-orange-400"
              : "text-blue-500"
        }`} viewBox="0 0 1200 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          {/* Flowing Horizontal Lines */}
          <path d="M-100 40C200 70 400 10 700 40C1000 70 1300 40 1300 40" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25">
             <animate attributeName="d" values="M-100 40C200 70 400 10 700 40C1000 70 1300 40 1300 40;M-100 40C200 10 400 70 700 40C1000 10 1300 40 1300 40;M-100 40C200 70 400 10 700 40C1000 70 1300 40 1300 40" dur="15s" repeatCount="indefinite" />
          </path>
          
          {/* Multiple Small Flowers & Petals Spread Across */}
          <circle cx="150" cy="30" r="8" fill="currentColor" fillOpacity="0.15" />
          <path d="M140 25Q150 15 160 25T140 25" fill="currentColor" fillOpacity="0.2" />
          <circle cx="350" cy="55" r="6" fill="currentColor" fillOpacity="0.12" />
          <circle cx="365" cy="50" r="4" fill="currentColor" fillOpacity="0.1" />
          <circle cx="600" cy="25" r="10" fill="currentColor" fillOpacity="0.15" />
          <path d="M590 20C600 10 615 20 605 35C595 50 580 35 590 20Z" fill="currentColor" fillOpacity="0.18" />
          <circle cx="850" cy="50" r="7" fill="currentColor" fillOpacity="0.15" />
          <path d="M840 45Q850 35 860 45T840 45" fill="currentColor" fillOpacity="0.12" />
          <circle cx="1050" cy="35" r="9" fill="currentColor" fillOpacity="0.18" />
          <path d="M1040 30C1055 20 1065 30 1055 45C1045 60 1030 45 1040 30Z" fill="currentColor" fillOpacity="0.2" />
          <path d="M480 20Q490 15 500 20" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" />
          <path d="M720 60Q730 55 740 60" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" />
        </svg>

        {/* Dynamic Glows */}
        <div className="absolute -top-10 -right-20 w-80 h-40 bg-sky-200/30 rounded-full blur-[80px] animate-pulse" />
        <div className="absolute -bottom-10 left-20 w-64 h-32 bg-blue-100/20 rounded-full blur-[60px]" />
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 12s ease-in-out infinite;
        }
      `}</style>
      
      <div className="flex items-center gap-6 relative z-10">
        {/* Mobile Hamburger toggle */}
        <button
          onClick={() => setMobileOpen(true)}
          className={`lg:hidden p-2.5 -ml-2 rounded-2xl bg-white/50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-95 border border-slate-100/50 shadow-sm`}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div className="flex items-center gap-4">
          <Logo size={36} variant="blue" className="hidden lg:block drop-shadow-sm hover:scale-110 transition-transform cursor-pointer" />
          <div className="flex flex-col">
            <h2 className="text-[20px] sm:text-[22px] font-black tracking-tight leading-none group">
              {/* Desktop Always shows logo */}
              <span className={`hidden lg:block bg-gradient-to-r bg-clip-text text-transparent from-blue-700 via-indigo-600 to-blue-600 animate-gradient-slow bg-[length:200%_auto]`}>
                AspireMint
              </span>
              {/* Mobile shows contextual title */}
              <span className={`lg:hidden flex items-center gap-1.5 bg-gradient-to-r bg-clip-text text-transparent from-blue-700 to-indigo-600`}>
                {getPageTitle()}
                {user?.leaderboardBadge?.active && (
                  <span className="text-[9px] font-black uppercase bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-2 py-0.5 rounded-full border border-amber-300 shadow-sm animate-pulse ml-1 shrink-0">
                    🏆 Rank #{user.leaderboardBadge.rank}
                  </span>
                )}
              </span>
            </h2>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 relative z-10">
        {/* Notification Bell - Enhanced */}
        <motion.button 
          onClick={() => setIsNotifOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`relative h-12 w-12 flex items-center justify-center rounded-2xl text-slate-400 bg-white/50 hover:bg-white hover:text-blue-600 transition-all shadow-sm border border-slate-100/50 group overflow-visible`}
        >
          {unreadCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1.5 -right-1.5 h-6 min-w-[24px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-4 border-white shadow-lg shadow-red-200 z-20"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </motion.span>
          )}
          
          <motion.div
            animate={unreadCount > 0 ? {
              rotate: [0, -10, 10, -10, 10, 0],
              transition: { repeat: Infinity, duration: 2, repeatDelay: 1 }
            } : {}}
          >
            <svg className="w-6 h-6 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </motion.div>

          {/* Subtle pulse effect when unread */}
          {unreadCount > 0 && (
            <span className="absolute inset-0 rounded-2xl bg-red-500/10 animate-ping pointer-events-none" />
          )}
        </motion.button>


        <div className="h-8 w-[1px] bg-slate-200/50 mx-2 hidden lg:block"></div>

        {/* User Profile Summary - Refined */}
        <Link href="/app/settings" className="hidden lg:flex">
          <motion.div 
            whileHover={{ scale: 1.02, x: 2 }}
            className={`flex items-center gap-3 cursor-pointer group bg-white/80 hover:bg-white p-1.5 pr-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all ${isAdm ? "hover:border-indigo-200" : "hover:border-blue-200"}`}
          >
            <div className={`h-[42px] w-[42px] overflow-hidden rounded-2xl border-2 border-white bg-gradient-to-br object-cover flex items-center justify-center font-black shadow-sm group-hover:shadow-md transition-all ${isAdm ? "from-indigo-100 to-indigo-200 text-indigo-700" : "from-blue-100 to-blue-200 text-blue-700"}`}>
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="hidden text-left lg:block">
              <div className="flex items-center gap-2.5">
                <p className="text-[15px] font-black text-slate-900 leading-none transition-colors group-hover:text-blue-600">{user?.name}</p>
                {user?.leaderboardBadge?.active && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 bg-amber-500 text-white rounded-md uppercase tracking-tight animate-bounce" title="Monthly Leaderboard Winner!">
                    🏆 #{user.leaderboardBadge.rank}
                  </span>
                )}
                {user?.totalCompletedOrders !== undefined && (
                  <UserBadge ordersCount={user.totalCompletedOrders} showIcon={false} showInfoIcon={false} className="scale-90 origin-left" />
                )}
              </div>
              <div className="mt-1.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none">{user?.role} ACCOUNT</p>
              </div>
            </div>
          </motion.div>
        </Link>
      </div>
      
      <NotificationSidebar isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} userRole={user?.role} />
    </header>
  );
};
