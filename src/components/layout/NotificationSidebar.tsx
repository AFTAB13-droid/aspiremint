"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, CheckCircle2, Trash2, Bell, Info, ShieldAlert, Check, Megaphone, 
  ExternalLink, ArrowLeft, Trash, Inbox, Clock, CheckCheck, MessageSquare 
} from "lucide-react";
import { formatTimeAgo } from "@/utils/formatTimeAgo";
import toast from "react-hot-toast";
import { BroadcastModal } from "@/components/admin/BroadcastModal";
import Link from "next/link";

interface NotificationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}

export function NotificationSidebar({ isOpen, onClose, userRole }: NotificationSidebarProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "unread">("all");

  useEffect(() => {
    setMounted(true);
    
    // Load cached notifications immediately for instant visual load
    try {
      const cached = localStorage.getItem("aspire_notifications_cache");
      if (cached) {
        setNotifications(JSON.parse(cached));
      }
    } catch (e) {
      console.error("Cache load failed", e);
    }
    
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchNotifications = async (silent = false) => {
    try {
      if (!silent && notifications.length === 0) {
        setLoading(true);
      }
      const res = await fetch("/api/notifications");
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data);
        localStorage.setItem("aspire_notifications_cache", JSON.stringify(json.data));
      }
    } catch (err) {
      console.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // If we already have notifications loaded, sync silently in the background
      fetchNotifications(notifications.length > 0);
    }
  }, [isOpen]);

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(updated);
    localStorage.setItem("aspire_notifications_cache", JSON.stringify(updated));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true })
      });
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error("Failed to mark as read");
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const updated = notifications.map(n => n._id === id ? { ...n, isRead: true } : n);
      setNotifications(updated);
      localStorage.setItem("aspire_notifications_cache", JSON.stringify(updated));
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
    } catch (err) {}
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.filter(n => n._id !== id);
    setNotifications(updated);
    localStorage.setItem("aspire_notifications_cache", JSON.stringify(updated));
    try {
      await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
      toast.success("Alert deleted");
    } catch (err) {
      toast.error("Failed to delete notification");
    }
  };

  const deleteAllNotifications = async () => {
    if (notifications.length === 0 || isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/notifications?all=true", { method: "DELETE" });
      if (res.ok) {
        setNotifications([]);
        localStorage.removeItem("aspire_notifications_cache");
        toast.success("Intelligence feed cleared completely");
      }
    } catch (err) {
      toast.error("Failed to clear notification history");
    } finally {
      setIsDeleting(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "ORDER_APPROVED":
      case "REFUND_COMPLETED":
      case "SUPPORT_TICKET_RESOLVED":
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "ORDER_REJECTED":
      case "ORDER_INVALIDATED":
        return <X className="w-5 h-5 text-rose-500" />;
      case "SUPPORT_TICKET_CREATED":
      case "SUPPORT_TICKET_REPLY":
        return <MessageSquare className="w-5 h-5 text-indigo-500" />;
      case "ADMIN_ALERT":
      case "BROADCAST_MESSAGE":
        return <ShieldAlert className="w-5 h-5 text-indigo-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[999] bg-slate-950/45 backdrop-blur-md"
          />

          {/* Unified Sheet Container */}
          <motion.div 
            initial={isMobile ? { y: "100%" } : { x: "100%" }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: "100%" } : { x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
            className={`fixed z-[1000] flex flex-col overflow-hidden text-slate-800 bg-slate-50 shadow-3xl border-slate-100/80
              ${isMobile 
                ? "inset-0 h-full w-full" 
                : "top-0 right-0 h-full w-full max-w-md sm:max-w-lg lg:max-w-xl border-l"
              }
            `}
          >
            {isMobile ? (
              // --- MOBILE FULL SCREEN UI ---
              <div className="flex flex-col h-full bg-slate-50">
                <div className="bg-white px-4 pt-6 pb-4 shrink-0 shadow-sm border-b border-slate-100 relative z-20 flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <button onClick={onClose} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-slate-50 active:scale-95 transition-all">
                      <ArrowLeft className="w-5 h-5 text-slate-700" />
                    </button>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Notifications {unreadCount > 0 && <span className="text-indigo-600">({unreadCount})</span>}</h2>
                    <div className="flex gap-2">
                      <button onClick={deleteAllNotifications} disabled={notifications.length === 0 || isDeleting} className="w-10 h-10 rounded-full border border-rose-100 flex items-center justify-center bg-rose-50 text-rose-600 active:scale-95 transition-all disabled:opacity-40">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button onClick={markAllAsRead} disabled={unreadCount === 0} className="w-10 h-10 rounded-full border border-indigo-100 flex items-center justify-center bg-indigo-50 text-indigo-600 active:scale-95 transition-all disabled:opacity-40">
                        <CheckCheck className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/50">
                    {[
                      { id: "all", label: "All", count: notifications.length },
                      { id: "unread", label: "Unread", count: unreadCount }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setFilterType(tab.id as any)}
                        className={`flex-1 flex items-center justify-center py-2.5 rounded-xl transition-all duration-200 gap-1.5 ${
                          filterType === tab.id 
                            ? "bg-white text-slate-900 shadow-md font-black border border-slate-100" 
                            : "text-slate-500 font-bold hover:bg-white/50"
                        }`}
                      >
                        <span className="text-xs uppercase tracking-widest">{tab.label}</span>
                        {tab.count > 0 && (
                          <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${filterType === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}>
                            {tab.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pb-10 bg-slate-50">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                      <span className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                  ) : (() => {
                    const filtered = filterType === "all" ? notifications : notifications.filter(n => !n.isRead);
                    
                    if (filtered.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center h-full px-6 text-center pb-20">
                          <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 text-slate-300 flex items-center justify-center mb-6 shadow-inner">
                            <Bell className="w-10 h-10" />
                          </div>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">No Notifications</h4>
                          <p className="text-[10px] font-bold text-slate-400 mt-2 max-w-[240px] leading-relaxed">
                            You're all caught up. New system alerts will appear here.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <AnimatePresence initial={false}>
                        {filtered.map((note, idx) => {
                          const isInvalidated = note.type === "ORDER_INVALIDATED" || note.type === "ORDER_REJECTED";
                          const isApproved = note.type === "ORDER_APPROVED" || note.type === "REFUND_COMPLETED";

                              const cardStyles = isInvalidated
                                ? "bg-gradient-to-br from-rose-50/70 to-red-50/50 border-rose-100/80 border-l-4 border-l-rose-500"
                                : isApproved
                                ? "bg-gradient-to-br from-emerald-50/70 to-green-50/50 border-emerald-100/80 border-l-4 border-l-emerald-500"
                                : "bg-gradient-to-br from-indigo-50/70 to-blue-50/50 border-indigo-100/80 border-l-4 border-l-indigo-500";

                              return (
                                <motion.div 
                                  layout
                                  key={note._id}
                                  initial={{ opacity: 0, y: 15 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{ duration: 0.2 }}
                                  onClick={() => {
                                    if (!note.isRead) markAsRead(note._id);
                                    if (note.actionUrl) window.location.href = note.actionUrl;
                                  }}
                                  className={`mx-4 mb-4 p-4 rounded-2xl border shadow-sm active:scale-[0.98] transition-all relative overflow-hidden flex items-start gap-4 ${cardStyles}
                                    ${note.isRead ? "opacity-75 bg-none bg-white border-slate-100/80" : ""}
                                  `}
                                >
                                  <div className="mt-0.5 flex-shrink-0 relative">
                                    {note.mediaUrl ? (
                                      <img src={note.mediaUrl} alt="Thumbnail" className="w-12 h-12 rounded-xl object-cover shadow-sm bg-slate-50 border border-slate-100" />
                                    ) : (
                                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm
                                        ${isInvalidated ? "bg-rose-500 text-white" : 
                                          isApproved ? "bg-emerald-500 text-white" : 
                                          "bg-indigo-500 text-white"
                                        }
                                      `}>
                                        {getIcon(note.type)}
                                      </div>
                                    )}
                                    {!note.isRead && (
                                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full shadow-sm animate-pulse" />
                                    )}
                                  </div>
                                  
                                  <div className="flex-1 min-w-0 pr-1">
                                    <div className="flex items-start justify-between gap-2">
                                      <h5 className={`text-[13px] font-black leading-tight line-clamp-1 ${note.isRead ? 'text-slate-600' : 'text-slate-900'}`}>{note.title}</h5>
                                      <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap pt-0.5 shrink-0 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatTimeAgo(note.createdAt).replace('about ', '')}
                                      </span>
                                    </div>
                                    <p className={`text-[11px] mt-1.5 leading-snug break-words ${note.isRead ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>{note.message}</p>
                                    {note.actionUrl && (
                                      <div className="mt-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-1">
                                          View Details <ExternalLink className="w-3 h-3" />
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              );
                        })}
                      </AnimatePresence>
                    );
                  })()}
                </div>
              </div>
            ) : (
              // --- DESKTOP UI (unchanged) ---
              <>
            {/* Dynamic Premium Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 md:px-8 py-6 relative overflow-hidden shrink-0 shadow-lg">
              {/* Glowing Mesh Orbs */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -ml-12 -mb-12 pointer-events-none" />

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  {isMobile && (
                    <button 
                      onClick={onClose}
                      className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors mr-1"
                    >
                      <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white shadow-inner">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                        Notifications
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 bg-indigo-500 text-white text-[10px] font-black rounded-full shadow-[0_0_12px_rgba(99,102,241,0.5)] animate-pulse">
                            {unreadCount}
                          </span>
                        )}
                      </h2>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Real-time system events</p>
                    </div>
                  </div>
                </div>

                {/* Top Right Quick Actions */}
                <div className="flex items-center gap-2">
                  {userRole === "ADMIN" && (
                    <button 
                      onClick={() => setIsBroadcastModalOpen(true)}
                      title="Send Broadcast"
                      className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/10 text-sky-300 hover:text-white hover:bg-sky-500/20 transition-colors group"
                    >
                      <Megaphone className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                  )}
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
                      onClick={onClose}
                      className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors ml-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Segment Tab Controls */}
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

            {/* Scrollable Events List */}
            <div className="flex-1 overflow-y-auto space-y-4 p-5 md:p-6 custom-scrollbar bg-slate-50">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                  <span className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Loading Feed...</p>
                </div>
              ) : (() => {
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
                      const isInvalidated = note.type === "ORDER_INVALIDATED" || note.type === "ORDER_REJECTED";
                      const isApproved = note.type === "ORDER_APPROVED" || note.type === "REFUND_COMPLETED";

                      const cardStyles = isInvalidated
                        ? "bg-gradient-to-br from-rose-50/70 to-red-50/50 border-rose-100/80 border-l-4 border-l-rose-500 hover:border-l-rose-600 hover:shadow-rose-100/30"
                        : isApproved
                        ? "bg-gradient-to-br from-emerald-50/70 to-green-50/50 border-emerald-100/80 border-l-4 border-l-emerald-500 hover:border-l-emerald-600 hover:shadow-emerald-100/30"
                        : "bg-gradient-to-br from-indigo-50/70 to-blue-50/50 border-indigo-100/80 border-l-4 border-l-indigo-500 hover:border-l-indigo-600 hover:shadow-indigo-100/30";

                      return (
                        <motion.div 
                          layout
                          key={note._id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -30 }}
                          transition={{ duration: 0.2, delay: 0.02 * idx }}
                          onClick={() => {
                            if (!note.isRead) {
                              markAsRead(note._id);
                            }
                            if (note.actionUrl) {
                              window.location.href = note.actionUrl;
                            }
                          }}
                          className={`group p-5 rounded-[28px] border shadow-sm hover:shadow-xl transition-all cursor-pointer relative overflow-hidden flex items-start gap-4 ${cardStyles}
                            ${note.isRead ? "opacity-75 bg-none bg-white border-slate-100/80" : ""}
                          `}
                        >
                          {/* Event Icon/Media wrapper */}
                          <div className="mt-0.5 flex-shrink-0">
                            {note.mediaUrl ? (
                              <img src={note.mediaUrl} alt="Thumbnail" className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shadow-sm bg-white" />
                            ) : (
                              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm
                                ${isInvalidated ? "bg-rose-500 text-white" : 
                                  isApproved ? "bg-emerald-500 text-white" : 
                                  "bg-indigo-500 text-white"
                                }
                              `}>
                                {getIcon(note.type)}
                              </div>
                            )}
                          </div>

                          {/* Body message content */}
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-2">
                              <h5 className={`text-xs font-black truncate leading-snug ${note.isRead ? 'text-slate-700' : 'text-slate-900'}`}>{note.title}</h5>
                              {!note.isRead && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 animate-ping" />
                              )}
                            </div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 mb-2 flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-slate-300" />
                              {formatTimeAgo(note.createdAt)}
                            </p>
                            <p className={`text-[11px] leading-relaxed break-words ${note.isRead ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>{note.message}</p>
                            {note.actionUrl && (
                              <div className="mt-3">
                                <Link 
                                  href={note.actionUrl} 
                                  onClick={onClose} 
                                  className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 flex items-center gap-1 group-hover:underline"
                                >
                                  View Details <ExternalLink className="w-3 h-3" />
                                </Link>
                              </div>
                            )}
                          </div>

                          {/* Delete Item button */}
                          <div className="flex flex-col items-center justify-center self-center shrink-0">
                            <button 
                              onClick={(e) => deleteNotification(note._id, e)}
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

            {/* Sticky dynamic footer bar */}
            <div className="p-4 bg-white border-t border-slate-100 shrink-0 text-center flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-400">
              <span>Total Log: {notifications.length} Alerts</span>
              <span>Unread: {unreadCount} Alerts</span>
            </div>
              </>
            )}
          </motion.div>
        </>
      )}

      {isBroadcastModalOpen && (
        <BroadcastModal onClose={() => setIsBroadcastModalOpen(false)} />
      )}
    </AnimatePresence>,
    document.body
  );
}
