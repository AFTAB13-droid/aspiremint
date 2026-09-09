"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, X, Zap, ShieldCheck, Info, Package, Clock, AlertTriangle, Trash2, CheckCheck, Inbox, Eye, ArrowLeft, Trash, Trophy
} from "lucide-react";
import { useMotionValue } from "framer-motion";
import { formatTimeAgo } from "@/utils/formatTimeAgo";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

// Dashboard Components
import BuyerDashboard from "./BuyerDashboard";
import MobileBuyerDashboard from "./MobileBuyerDashboard";
import MediatorDashboard from "./MediatorDashboard";
import MobileMediatorDashboard from "./MobileMediatorDashboard";
import AdminDashboard from "./AdminDashboard";
import SubAdminDashboard from "./SubAdminDashboard";

interface DashboardClientProps {
  user: {
    name?: string | null;
    role: string;
    avatar?: string | null;
    image?: string | null;
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
    totalMediatorCommission?: number;
    dailyActivity: any[];
    statusDistribution: any[];
    openQueries: number;
  };
  recentOrders: any[];
}

export default function DashboardClient({ user, stats, recentOrders }: DashboardClientProps) {
  const role = user.role;
  const isAdm = role === "ADMIN" || role === "SUBADMIN";
  const isSubAdmin = role === "SUBADMIN";
  const isMed = role === "MEDIATOR";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "unread">("all");
  const router = useRouter();

  // Shared 3D HUD Mouse Tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchNotifications = async () => {
     try {
        setNotifLoading(true);
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) return;
        
        const json = await res.json();
        if (json.success) setNotifications(json.data);
     } catch (err) {
        console.error("Notif fetch error", err);
     } finally {
        setNotifLoading(false);
     }
  };

  const markAllAsRead = async () => {
     if (unreadCount === 0) return;
     setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
     try {
        const res = await fetch("/api/notifications", {
           method: "PATCH",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ all: true })
        });
        if (res.ok) {
           toast.success("All alerts marked as read");
        }
     } catch (err) {
        toast.error("Failed to clear feed");
     }
  };

  const deleteAllNotifications = async () => {
     if (notifications.length === 0 || isDeleting) return;
     setIsDeleting(true);
     try {
        const res = await fetch("/api/notifications?all=true", {
           method: "DELETE"
        });
        if (res.ok) {
           setNotifications([]);
           toast.success("Intelligence feed cleared completely");
        }
     } catch (err) {
        toast.error("Failed to clear notification history");
     } finally {
        setIsDeleting(false);
     }
  };

  const deleteSingleNotification = async (id: string, e: React.MouseEvent) => {
     e.stopPropagation(); // Avoid triggering card click
     setNotifications(prev => prev.filter(n => n._id !== id));
     try {
        const res = await fetch(`/api/notifications?id=${id}`, {
           method: "DELETE"
        });
        if (res.ok) {
           toast.success("Alert deleted");
        }
     } catch (err) {
        toast.error("Failed to delete notification");
     }
  };

  const markSingleAsRead = async (id: string) => {
     setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
     try {
        await fetch("/api/notifications", {
           method: "PATCH",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ id })
        });
     } catch (err) {
        console.error("Failed to mark read:", err);
     }
  };

  React.useEffect(() => {
     fetchNotifications();
     const interval = setInterval(fetchNotifications, 60000); // Polling for new alerts
     
     setIsMobile(window.innerWidth < 768);
     const handleResize = () => setIsMobile(window.innerWidth < 768);
     window.addEventListener("resize", handleResize);

     const handleFcmRefresh = () => {
        fetchNotifications();
        router.refresh();
     };
     window.addEventListener("FCM_REFRESH_DATA", handleFcmRefresh);
     
     return () => {
        clearInterval(interval);
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("FCM_REFRESH_DATA", handleFcmRefresh);
     };
  }, [router]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Role-Based Dashboard Selection
  const renderDashboard = () => {
    if (isMed) {
      return (
        <>
          <div className="hidden md:block">
            <MediatorDashboard 
              user={user} 
              stats={stats} 
              recentOrders={recentOrders} 
              isSidebarOpen={isSidebarOpen} 
              setIsSidebarOpen={setIsSidebarOpen}
              mouseX={mouseX}
              mouseY={mouseY}
              unreadCount={unreadCount}
            />
          </div>
          <div className="block md:hidden">
            <MobileMediatorDashboard 
              user={user} 
              stats={stats} 
              recentOrders={recentOrders} 
              isSidebarOpen={isSidebarOpen} 
              setIsSidebarOpen={setIsSidebarOpen}
              mouseX={mouseX}
              mouseY={mouseY}
              unreadCount={unreadCount}
            />
          </div>
        </>
      );
    }
    
    if (role === "USER") {
      return (
        <>
          <div className="hidden md:block">
            <BuyerDashboard 
              user={user} 
              stats={stats} 
              recentOrders={recentOrders} 
              isSidebarOpen={isSidebarOpen} 
              setIsSidebarOpen={setIsSidebarOpen}
              mouseX={mouseX}
              mouseY={mouseY}
              unreadCount={unreadCount}
            />
          </div>
          <div className="block md:hidden">
            <MobileBuyerDashboard 
              user={user} 
              stats={stats} 
              recentOrders={recentOrders} 
              isSidebarOpen={isSidebarOpen} 
              setIsSidebarOpen={setIsSidebarOpen}
              mouseX={mouseX}
              mouseY={mouseY}
              unreadCount={unreadCount}
            />
          </div>
        </>
      );
    }

    // Admin View
    if (isAdm && !isSubAdmin) {
      return (
        <AdminDashboard 
          user={user}
          stats={stats}
          recentOrders={recentOrders}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          mouseX={mouseX}
          mouseY={mouseY}
          unreadCount={unreadCount}
        />
      );
    }

    if (isSubAdmin) {
      return (
        <SubAdminDashboard 
          user={user}
          stats={stats}
          recentOrders={recentOrders}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          mouseX={mouseX}
          mouseY={mouseY}
          unreadCount={unreadCount}
        />
      );
    }

    // Default/Other Fallback
    return (
      <div className="flex flex-col gap-10 pb-20 max-w-[1600px] mx-auto p-6 sm:p-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={`relative overflow-hidden rounded-[40px] p-12 text-white shadow-2xl ${isAdm ? "bg-indigo-900" : "bg-blue-600"}`}>
            <h1 className="text-5xl font-black">Welcome back, {user.name?.split(" ")[0]}</h1>
            <p className="mt-4 text-lg opacity-70">Accessing {role} control hub.</p>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="relative">
      {renderDashboard()}

      {/* SHARED NOTIFICATION SYSTEM (RESPONSIVE VIEWPORT STYLES) */}
      <AnimatePresence>
         {isSidebarOpen && (
            <>
               {/* Backdrop overlay */}
               <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSidebarOpen(false)}
                  className="fixed inset-0 bg-slate-950/45 backdrop-blur-md z-[100]"
               />
               
               {/* Unified Sheet Container */}
               <motion.div 
                  initial={isMobile ? { y: "100%" } : { x: "100%" }}
                  animate={isMobile ? { y: 0 } : { x: 0 }}
                  exit={isMobile ? { y: "100%" } : { x: "100%" }}
                  transition={{ type: "spring", damping: 26, stiffness: 220 }}
                  className={`fixed z-[101] bg-slate-50 shadow-3xl flex flex-col overflow-hidden text-slate-800 border-slate-100/80
                     ${isMobile 
                        ? "bottom-0 left-0 right-0 h-[92vh] rounded-t-[40px] border-t" 
                        : "top-0 right-0 h-full w-full max-w-[460px] border-l"
                     }
                  `}
               >
                  {/* Mobile Drag Indicator */}
                  {isMobile && (
                     <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto my-3 shrink-0" />
                  )}

                  {/* Dynamic Premium Header Banner */}
                  <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-8 py-7 relative overflow-hidden shrink-0 shadow-lg">
                     {/* Background glowing gradients */}
                     <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                     <div className="absolute bottom-0 left-0 w-36 h-36 bg-blue-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

                     <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                           {isMobile && (
                              <button 
                                 onClick={() => setIsSidebarOpen(false)}
                                 className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors mr-1"
                              >
                                 <ArrowLeft className="w-5 h-5 text-white" />
                              </button>
                           )}
                           <div>
                              <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                                 Notifications
                                 {unreadCount > 0 && (
                                    <span className="px-2 py-0.5 bg-indigo-500 text-white text-[10px] font-black rounded-full shadow-[0_0_12px_rgba(99,102,241,0.5)] animate-pulse">
                                       {unreadCount}
                                    </span>
                                 )}
                              </h2>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Platform intelligence feed</p>
                           </div>
                        </div>

                        {/* Top-Right Quick Actions Container */}
                        <div className="flex items-center gap-2">
                           {notifications.length > 0 && (
                              <>
                                 <button 
                                    onClick={markAllAsRead}
                                    disabled={unreadCount === 0}
                                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:hover:bg-white/10 transition-colors group"
                                    title="Mark all as read"
                                 >
                                    <CheckCheck className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                                 </button>
                                 <button 
                                    onClick={deleteAllNotifications}
                                    disabled={notifications.length === 0 || isDeleting}
                                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-rose-500/20 disabled:opacity-40 disabled:hover:bg-white/10 transition-colors group"
                                    title="Delete all alerts"
                                 >
                                    <Trash2 className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
                                 </button>
                              </>
                           )}
                           {!isMobile && (
                              <button 
                                 onClick={() => setIsSidebarOpen(false)}
                                 className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors ml-1"
                              >
                                 <X className="w-5 h-5" />
                              </button>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Filter Pills Navigation */}
                  <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
                     <div className="flex gap-2">
                        {[
                           { id: "all", label: "All", count: notifications.length },
                           { id: "unread", label: "Unread Only", count: unreadCount }
                        ].map(tab => (
                           <button
                              key={tab.id}
                              onClick={() => setFilterType(tab.id as any)}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                 ${filterType === tab.id 
                                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/10 scale-105" 
                                    : "bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                 }
                              `}
                           >
                              {tab.label}
                              <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[8px] font-black
                                 ${filterType === tab.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}
                              `}>
                                 {tab.count}
                              </span>
                           </button>
                        ))}
                     </div>
                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        {filterType === "unread" ? "Filtering Unread" : "Live stream"}
                     </span>
                  </div>

                  {/* Scrollable Events Container */}
                  <div className="flex-1 overflow-y-auto space-y-4 p-5 md:p-6 custom-scrollbar">
                     {(() => {
                        const filtered = filterType === "all" ? notifications : notifications.filter(n => !n.isRead);
                        
                        if (filtered.length === 0) {
                           return (
                              <motion.div 
                                 initial={{ opacity: 0, scale: 0.95 }}
                                 animate={{ opacity: 1, scale: 1 }}
                                 className="py-24 px-6 text-center flex flex-col items-center justify-center"
                              >
                                 <div className="h-16 w-16 rounded-2xl bg-indigo-50 text-indigo-500/50 flex items-center justify-center mb-5 border border-indigo-100/50 shadow-inner">
                                    <Inbox className="w-8 h-8" />
                                 </div>
                                 <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">All caught up</h4>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2 max-w-[240px] leading-relaxed">
                                    No transaction alerts or system notices currently in this feed.
                                 </p>
                              </motion.div>
                           );
                        }

                        return (
                           <AnimatePresence initial={false}>
                              {filtered.map((note, idx) => {
                                 // Define beautiful card gradients based on notification type
                                 const isInvalidated = note.type === "ORDER_INVALIDATED";
                                 const isApproved = note.type === "ORDER_APPROVED";
                                 const isLeaderboard = note.metadata?.isGoldLeaderboardReward === true;
                                 
                                 const cardStyles = isLeaderboard
                                    ? "bg-gradient-to-br from-amber-50 to-amber-100/70 border-amber-300 border-l-4 border-l-amber-500 hover:border-l-amber-600 hover:shadow-amber-200/50 animate-pulse"
                                    : isInvalidated
                                    ? "bg-gradient-to-br from-rose-50/70 to-red-50/50 border-rose-100/80 border-l-4 border-l-rose-500 hover:border-l-rose-600 hover:shadow-rose-100/30"
                                    : isApproved
                                    ? "bg-gradient-to-br from-emerald-50/70 to-green-50/50 border-emerald-100/80 border-l-4 border-l-emerald-500 hover:border-l-emerald-600 hover:shadow-emerald-100/30"
                                    : "bg-gradient-to-br from-indigo-50/70 to-blue-50/50 border-indigo-100/80 border-l-4 border-l-indigo-500 hover:border-l-indigo-600 hover:shadow-indigo-100/30";

                                 return (
                                    <motion.div 
                                       key={note._id}
                                       initial={{ opacity: 0, y: 15 }}
                                       animate={{ opacity: 1, y: 0 }}
                                       exit={{ opacity: 0, x: -30 }}
                                       transition={{ duration: 0.2, delay: 0.02 * idx }}
                                       onClick={() => {
                                          markSingleAsRead(note._id);
                                          if (note.actionUrl) {
                                             window.location.href = note.actionUrl;
                                          }
                                       }}
                                       className={`group p-5 rounded-[28px] border shadow-sm hover:shadow-xl transition-all cursor-pointer relative overflow-hidden flex items-start gap-4 ${cardStyles}
                                          ${note.isRead ? "opacity-75 bg-none bg-white border-slate-100/80" : ""}
                                       `}
                                    >
                                       {/* Type Icon indicator */}
                                       <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm
                                          ${isLeaderboard ? "bg-amber-500 text-white animate-bounce" :
                                            isInvalidated ? "bg-rose-500 text-white" : 
                                            isApproved ? "bg-emerald-500 text-white" : 
                                            "bg-indigo-500 text-white"
                                          }
                                       `}>
                                          {isLeaderboard ? <Trophy className="w-4 h-4" /> :
                                           isInvalidated ? <AlertTriangle className="w-4 h-4 animate-bounce" /> : 
                                           isApproved ? <ShieldCheck className="w-4 h-4" /> : 
                                           <Zap className="w-4 h-4" />}
                                       </div>

                                       {/* Message body */}
                                       <div className="flex-1 min-w-0 pr-4">
                                          <div className="flex items-center gap-2">
                                             <h5 className="text-xs font-black text-slate-800 truncate leading-snug">{note.title}</h5>
                                             {!note.isRead && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 animate-ping" />
                                             )}
                                          </div>
                                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 mb-2 flex items-center gap-1.5">
                                             <Clock className="w-3 h-3 text-slate-300" />
                                             {formatTimeAgo(note.createdAt)}
                                          </p>
                                          <p className="text-[11px] font-bold text-slate-500 leading-relaxed break-words">{note.message}</p>
                                       </div>

                                       {/* Single Item Actions (Trash / Delete) */}
                                       <div className="flex flex-col items-center justify-center self-center shrink-0">
                                          <button 
                                             onClick={(e) => deleteSingleNotification(note._id, e)}
                                             className="h-10 w-10 flex items-center justify-center rounded-xl bg-white hover:bg-rose-50 hover:text-rose-600 transition-all text-slate-400 group-hover:scale-100 group-hover:opacity-100 shadow-sm border border-slate-100 md:opacity-0 md:scale-95"
                                             title="Delete alert"
                                          >
                                             <Trash className="w-4 h-4" />
                                          </button>
                                       </div>
                                    </motion.div>
                                 );
                              })}
                           </AnimatePresence>
                        );
                     })()}
                  </div>

                  {/* Sticky bottom bar showing ratio */}
                  <div className="p-4 bg-white border-t border-slate-100 shrink-0 text-center flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-400">
                     <span>Total Log: {notifications.length} Alerts</span>
                     <span>Unread: {unreadCount} Alerts</span>
                  </div>
               </motion.div>
            </>
         )}
      </AnimatePresence>
   </div>
  );
}
