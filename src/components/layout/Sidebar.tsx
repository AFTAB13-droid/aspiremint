"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import { Logo } from "@/components/common/Logo";
import { UserBadge } from "@/components/ui/UserBadge";
import { InstallPWA } from "@/components/ui/InstallPWA";
import { getUserAvatar } from "@/data/avatars";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Lock } from "lucide-react";

interface NavLink {
  name: string;
  href: string;
  icon: React.ReactNode;
  roles: ("USER" | "MEDIATOR" | "ADMIN" | "SUBADMIN")[];
}

const navLinks: NavLink[] = [
  {
    name: "Dashboard",
    href: "/app",
    roles: ["USER", "MEDIATOR", "ADMIN", "SUBADMIN"],
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: "My Orders",
    href: "/app/orders",
    roles: ["USER"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    )
  },
  {
    name: "Active Deals",
    href: "/app/activedeals",
    roles: ["USER", "MEDIATOR", "ADMIN"],
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  {
    name: "Orders",
    href: "/app/orders",
    roles: ["ADMIN", "SUBADMIN"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    )
  },
  {
    name: "My Refunds",
    href: "/app/refunds",
    roles: ["USER"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    name: "Review Finder",
    href: "/app/review-finder",
    roles: ["USER", "MEDIATOR", "ADMIN"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
      </svg>
    )
  },
  {
    name: "Passbook",
    href: "/app/wallet",
    roles: ["MEDIATOR", "ADMIN"],
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    name: "Refer and Earn",
    href: "/app/referral",
    roles: ["USER"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    name: "Support",
    href: "/app/support",
    roles: ["USER"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  },
  {
    name: "Support Hub",
    href: "/app/mediators/support",
    roles: ["MEDIATOR"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  },
  {
    name: "My Activity",
    href: "/app/mediations",
    roles: ["MEDIATOR"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  },
  {
    name: "Refunds",
    href: "/app/refunds",
    roles: ["MEDIATOR", "ADMIN"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    name: "User Directory",
    href: "/app/users",
    roles: ["ADMIN", "SUBADMIN"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  {
    name: "Mediators Hub",
    href: "/app/mediators",
    roles: ["ADMIN"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  },
  {
    name: "Live Analytics",
    href: "/app/admin/analytics",
    roles: ["ADMIN"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    name: "Leaderboard",
    href: "/app/admin/leaderboard",
    roles: ["ADMIN"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.286L13 21l-2.286-6.714L5 12l5.714-2.286L13 3z" />
      </svg>
    )
  },
  {
    name: "Live Analytics",
    href: "/app/mediators/analytics",
    roles: ["MEDIATOR"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    name: "SOP Guidelines",
    href: "/app/admin/guidelines",
    roles: ["SUBADMIN"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    name: "Support Hub",
    href: "/app/admin/support",
    roles: ["ADMIN", "SUBADMIN"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  },
  {
    name: "Reference Center",
    href: "/app/samples",
    roles: ["USER", "MEDIATOR"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
];

interface SidebarProps {
  userRole: "USER" | "MEDIATOR" | "ADMIN" | "SUBADMIN" | "GUEST";
  isMobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  isCollapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
  isBanned?: boolean;
  userAvatar?: string | null;
  userName?: string | null;
  isGuest?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  userRole,
  isMobileOpen,
  setMobileOpen,
  isCollapsed = false,
  setCollapsed,
  isBanned = false,
  userAvatar,
  userName,
  isGuest = false
}) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isActiveSettings = pathname === "/app/settings";
  
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(userAvatar || null);
  const [guestLockModal, setGuestLockModal] = useState<{ open: boolean; title?: string }>({ open: false });

  React.useEffect(() => {
    if (userAvatar) {
      setCurrentAvatar(userAvatar);
    }
  }, [userAvatar]);

  React.useEffect(() => {
    const handleAvatarUpdate = (e: any) => {
      const updated = e.detail?.avatar || e.avatar;
      if (updated) {
        setCurrentAvatar(updated);
      } else {
        fetch("/api/user/profile")
          .then(res => res.json())
          .then(json => {
            if (json.success && (json.data.avatar || json.data.profileImage)) {
              setCurrentAvatar(json.data.avatar || json.data.profileImage);
            }
          })
          .catch(() => {});
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "user_avatar_updated" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.avatar) setCurrentAvatar(parsed.avatar);
        } catch {}
      }
    };

    window.addEventListener("PROFILE_AVATAR_UPDATED", handleAvatarUpdate);
    window.addEventListener("FCM_REFRESH_DATA", handleAvatarUpdate);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("PROFILE_AVATAR_UPDATED", handleAvatarUpdate);
      window.removeEventListener("FCM_REFRESH_DATA", handleAvatarUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const effectiveAvatar = currentAvatar || userAvatar || (session?.user as any)?.avatar || session?.user?.image;
  const effectiveName = userName || session?.user?.name;
 
  // Lock scroll on mobile when sidebar is open
  React.useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isMobileOpen]);

  // Filter links by user role
  let filteredLinks = isGuest 
    ? navLinks.filter(link => link.roles.includes("USER"))
    : navLinks.filter(link => link.roles.includes(userRole as any));
  if (isBanned) {
    filteredLinks = filteredLinks.filter(link => ["Support", "Support Hub"].includes(link.name));
  }
  const isAdm = userRole === "ADMIN";

  // Group links for mobile "App-like" sections
  const mobileSections = [
    { 
      title: "Operations", 
      links: filteredLinks.filter(l => ["Dashboard", "Orders", "My Orders", "Active Deals", "My Refunds", "Review Finder", "My Activity", "Refunds", "Passbook", "Refer and Earn", "Support", "Support Hub", "Reference Center"].includes(l.name)) 
    },
    { 
      title: "Management", 
      links: filteredLinks.filter(l => ["User Directory", "Mediators Hub", "Live Analytics", "Resolution Hub", "SOP Guidelines", "Leaderboard"].includes(l.name)) 
    }
  ].filter(s => s.links.length > 0);

  const getMobileSidebarContent = () => {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-[#0B101D] relative overflow-hidden">
        {getSidebarBackground()}

        {/* Header with Profile Info */}
        <div className="px-6 pt-10 pb-6 border-b border-blue-50/50 dark:border-slate-800/80 relative z-10">
          <div className="flex items-start justify-between mb-4">
            {isGuest ? (
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 shadow-md flex items-center justify-center text-white shrink-0">
                  <div className="h-full w-full rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-xl font-black text-blue-600 dark:text-blue-400 border-2 border-white dark:border-slate-700 shadow-inner">
                    <Lock className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none mb-1">Welcome</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                    Guest 👋
                  </span>
                  <Link 
                    href="/login" 
                    onClick={() => setMobileOpen(false)}
                    className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mt-2.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-blue-50/50 dark:bg-blue-950/40 px-2.5 py-1 rounded-md self-start border border-blue-100/30 dark:border-blue-900/30"
                  >
                    Log In / Register
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-200 to-indigo-200 dark:from-blue-600 dark:to-indigo-600 p-0.5 shadow-md">
                  <div className="h-full w-full rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-xl font-black text-slate-900 dark:text-white border-2 border-white dark:border-slate-700 overflow-hidden shadow-inner uppercase">
                     <img 
                       src={getUserAvatar(effectiveAvatar, effectiveName)} 
                       alt="" 
                       className="w-full h-full object-cover" 
                     />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none mb-1">Hello,</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                    {effectiveName?.split(' ')[0] || "User"}
                  </span>
                  <Link 
                    href="/app/settings" 
                    onClick={() => setMobileOpen(false)}
                    className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mt-2.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-blue-50/50 dark:bg-blue-950/40 px-2 py-1 rounded-md self-start border border-blue-100/30 dark:border-blue-900/30"
                  >
                    Edit Profile
                  </Link>
                </div>
              </div>
            )}
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 -mr-2 bg-slate-50 dark:bg-[#131B2E] rounded-xl text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white active:scale-95 transition-all border border-transparent dark:border-slate-800"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!isGuest && (
            <div className="flex items-center justify-between gap-4 mt-2">
               <UserBadge ordersCount={(session?.user as any)?.totalCompletedOrders || 0} showProgression={false} />
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto py-6 px-4 relative z-10">
          <div className="space-y-1">
            {filteredLinks.map((link) => {
              const isLocked = isGuest && link.href !== "/app/review-finder";
              const isActive = !isLocked && pathname === link.href;
              return (
                <div
                  key={link.href}
                  onClick={(e) => {
                    if (isLocked) {
                      e.preventDefault();
                      setGuestLockModal({ open: true, title: link.name });
                    }
                  }}
                >
                  <Link 
                    href={isLocked ? "#" : link.href} 
                    onClick={(e) => {
                      if (isLocked) {
                        e.preventDefault();
                        setGuestLockModal({ open: true, title: link.name });
                      } else {
                        setMobileOpen(false);
                      }
                    }}
                  >
                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center gap-4 px-6 py-4 rounded-3xl transition-all ${
                        isLocked
                          ? "opacity-40 grayscale hover:opacity-60 cursor-pointer"
                          : isActive 
                            ? "bg-blue-50 text-blue-600 shadow-sm border border-blue-100 dark:bg-gradient-to-r dark:from-indigo-600/25 dark:to-blue-600/15 dark:text-blue-300 dark:border-indigo-500/30" 
                            : "text-slate-500 active:bg-slate-50 dark:text-slate-400 dark:active:bg-[#131B2E]"
                      }`}
                    >
                      <div className={`transition-transform ${isActive ? 'scale-110' : ''}`}>
                        {React.cloneElement(link.icon as React.ReactElement, { 
                          className: `w-6 h-6 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}` 
                        })}
                      </div>
                      <span className={`text-base font-bold tracking-tight ${isActive ? 'text-blue-700 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                        {link.name}
                      </span>
                      {isLocked && (
                        <div className="ml-auto flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </motion.div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer actions for mobile */}
        <div className="p-6 border-t border-blue-50/50 dark:border-slate-800/80 flex flex-col gap-3 relative z-10">
           <div className="mb-1">
             <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Theme Mode</div>
             <ThemeToggle variant="pill" />
           </div>
           <InstallPWA variant="mobile" />

           {isGuest ? (
             <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-600/25 space-y-3">
               <div>
                 <div className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-blue-200 mb-1">
                   <span>Become Our Member</span>
                 </div>
                 <h4 className="text-sm font-black tracking-tight leading-snug">Unlock 100% Cashback Deals</h4>
                 <p className="text-[11px] text-blue-100/80 mt-1 leading-normal">
                   Get free products & instant refunds on top brands.
                 </p>
               </div>
               <div className="flex items-center gap-2 pt-1">
                 <Link
                   href="/login"
                   onClick={() => setMobileOpen(false)}
                   className="flex-1 h-9 rounded-xl bg-white text-blue-600 font-black text-[10px] uppercase tracking-wider hover:bg-blue-50 active:scale-95 transition-all flex items-center justify-center shadow-sm"
                 >
                   Log In
                 </Link>
                 <Link
                   href="/signup"
                   onClick={() => setMobileOpen(false)}
                   className="flex-1 h-9 rounded-xl bg-white/20 text-white font-black text-[10px] uppercase tracking-wider hover:bg-white/30 backdrop-blur-sm border border-white/20 active:scale-95 transition-all flex items-center justify-center"
                 >
                   Sign Up
                 </Link>
               </div>
             </div>
           ) : (
             <>
               <Link href="/app/settings" onClick={() => setMobileOpen(false)} className="w-full">
                  <button className="w-full h-14 bg-blue-50 text-blue-600 dark:bg-[#131B2E] dark:text-blue-400 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-[11px] font-black uppercase tracking-[0.2em] border border-blue-100/50 dark:border-slate-800 shadow-sm">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                     My Profile
                  </button>
               </Link>
               <button 
                 onClick={() => signOut({ callbackUrl: "/login" })}
                 className="w-full h-14 bg-red-50 text-red-500 dark:bg-red-950/20 dark:text-red-400 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-[11px] font-black uppercase tracking-[0.2em] border border-red-100/50 dark:border-red-900/40"
               >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Sign Out
               </button>
             </>
           )}
        </div>
      </div>
    );
  };

  const getSidebarBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
       {/* Soft Blue Base Gradient in Light / Sleek Obsidian Cosmic in Dark */}
       <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-white to-blue-50/40 dark:from-[#0B101D] dark:via-[#0E1526] dark:to-[#080D1A]" />
       
       <svg className="absolute inset-0 w-full h-full text-blue-500 dark:text-indigo-400 dark:opacity-10" viewBox="0 0 400 800" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          {/* Dense Flowing Lines */}
          <path d="M-50 100C100 200 200 0 450 100" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
          <path d="M-50 350C150 250 250 450 450 350" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.15" />
          <path d="M-50 600C50 700 300 500 450 600" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.12" />
          
          {/* More Floral / Petal Shapes */}
          <path d="M350 100C390 60 450 100 410 140C370 180 310 140 350 100Z" fill="currentColor" fillOpacity="0.12" />
          <circle cx="380" cy="120" r="15" fill="currentColor" fillOpacity="0.15" />
          
          <path d="M30 450C70 410 130 450 90 490C50 530 -10 490 30 450Z" fill="currentColor" fillOpacity="0.15" />
          <circle cx="60" cy="470" r="20" fill="currentColor" fillOpacity="0.1" />
          
          <path d="M300 700C340 660 400 700 360 740C320 780 260 740 300 700Z" fill="currentColor" fillOpacity="0.12" />
          <circle cx="330" cy="720" r="18" fill="currentColor" fillOpacity="0.1" />

          {/* Scattered Petals */}
          <path d="M150 250Q180 220 210 250T150 250" fill="currentColor" fillOpacity="0.1" />
          <path d="M250 550Q280 520 310 550T250 550" fill="currentColor" fillOpacity="0.1" />

          {/* Decorative Outlined Flowers */}
          <circle cx="380" cy="60" r="40" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" />
          <circle cx="40" cy="780" r="50" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
       </svg>
       
       {/* Ambient Glows */}
       <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/40 dark:bg-indigo-600/10 rounded-full blur-[100px]" />
       <div className="absolute bottom-20 left-0 w-72 h-72 bg-blue-100/30 dark:bg-blue-600/10 rounded-full blur-[80px]" />
    </div>
  );

  const getSidebarContent = (collapsed: boolean) => (
    <div className="flex h-full flex-col bg-white dark:bg-[#0B101D] relative border-r border-blue-100/60 dark:border-slate-800/80">
      {getSidebarBackground()}

      {/* Desktop Toggle Button */}
      {setCollapsed && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`absolute -right-3 top-8 hidden lg:flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 dark:bg-[#131B2E] dark:border-slate-700/80 dark:text-slate-300 dark:hover:text-blue-400 dark:hover:border-blue-500/50 shadow-sm z-50 transition-transform duration-300 ${isAdm ? "hover:text-indigo-500" : "hover:text-blue-500"}`}
          style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <svg className="h-4 w-4 block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Brand Header */}
      <div className={`flex h-24 items-center border-b border-slate-50/50 dark:border-slate-800/60 transition-all duration-300 relative z-10 ${collapsed ? 'justify-center px-0' : 'justify-between px-8'}`}>
        <Link href={isGuest ? "/app/review-finder" : "/app"} className="flex items-center gap-4 overflow-hidden">
          <Logo size={48} variant="blue" className="shrink-0 drop-shadow-blue" />
          <div className={`flex flex-col transition-opacity duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-none">AspireMint</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mt-1">
               {isGuest ? "VIP Gateway" : userRole === "ADMIN" ? "Admin Panel" : userRole === "MEDIATOR" ? "Mediator Panel" : "Buyers Panel"}
            </span>
          </div>
        </Link>
        {/* Mobile Close Button */}
        <button
          onClick={() => setMobileOpen(false)}
          className={`lg:hidden p-2 rounded-xl text-slate-400 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#131B2E] hover:text-slate-600 dark:hover:text-slate-200 transition-colors ${collapsed ? 'hidden' : 'block'}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* MOBILE USER PROFILE CARD (Native App Feel) */}
      {!collapsed && (
        <div className="lg:hidden px-5 pt-6 pb-2">
          {isGuest ? (
            <div className="relative overflow-hidden p-5 rounded-[28px] border border-blue-100/30 shadow-sm transition-all bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
              <div className="absolute top-0 right-0 h-24 w-24 bg-white/10 blur-2xl rounded-full -mr-12 -mt-12" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl font-black shadow-inner border border-white/20 shrink-0">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[15px] font-black leading-none truncate">Welcome Guest 👋</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/70 mt-1.5">MEMBER DEALS PORTAL</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-end relative z-10">
                <Link href="/login" onClick={() => setMobileOpen(false)} className="h-10 px-4 rounded-xl bg-white/10 flex items-center gap-2 hover:bg-white/20 transition-all text-[11px] font-black uppercase tracking-widest border border-white/10">
                  <span>Sign In / Register</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
            </div>
          ) : (
            <div className={`relative overflow-hidden p-5 rounded-[28px] border border-blue-100/30 shadow-sm transition-all bg-gradient-to-br ${isAdm ? "from-indigo-600 to-indigo-700" : "from-blue-600 to-blue-700"} text-white`}>
               <div className="absolute top-0 right-0 h-24 w-24 bg-white/10 blur-2xl rounded-full -mr-12 -mt-12" />
               <div className="flex items-center gap-4 relative z-10">
                  <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl font-black shadow-inner border border-white/20 overflow-hidden shrink-0">
                     <img 
                       src={getUserAvatar(effectiveAvatar, effectiveName)} 
                       alt="" 
                       className="w-full h-full object-cover" 
                     />
                  </div>
                  <div className="overflow-hidden">
                     <p className="text-[15px] font-black leading-none truncate">{effectiveName || "Guest"}</p>
                     <p className="text-[9px] font-black uppercase tracking-widest text-white/60 mt-1.5 opacity-80 truncate">{userRole} PROFILE</p>
                  </div>
               </div>
               <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-end relative z-10">
                  <Link href="/app/settings" onClick={() => setMobileOpen(false)} className="h-10 px-4 rounded-xl bg-white/10 flex items-center gap-2 hover:bg-white/20 transition-all text-[11px] font-black uppercase tracking-widest border border-white/10">
                     <span>Manage Account</span>
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </Link>
               </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto p-4 space-y-4 transition-all duration-300 relative z-10 ${collapsed ? 'px-3' : 'px-5 mt-4'}`}>
        {/* Desktop View: Flat list */}
        {collapsed ? (
          filteredLinks.map((link) => {
            const isLocked = isGuest && link.href !== "/app/review-finder";
            const isActive = !isLocked && pathname === link.href;

            return (
              <div
                key={link.href}
                onClick={(e) => {
                  if (isLocked) {
                    e.preventDefault();
                    setGuestLockModal({ open: true, title: link.name });
                  }
                }}
              >
                <Link 
                  href={isLocked ? "#" : link.href} 
                  onClick={(e) => {
                    if (isLocked) {
                      e.preventDefault();
                      setGuestLockModal({ open: true, title: link.name });
                    } else {
                      setMobileOpen(false);
                    }
                  }} 
                  title={isLocked ? `${link.name} (Exclusive Member Feature)` : link.name}
                >
                  <motion.div
                    whileTap={{ scale: 0.97 }}
                    className={`group relative flex items-center justify-center rounded-2xl py-4 transition-all duration-300 ${
                      isLocked
                        ? "opacity-35 grayscale hover:opacity-60 cursor-pointer"
                        : isActive
                          ? isAdm 
                            ? "bg-indigo-500/10 text-indigo-700 border border-indigo-100/50 dark:bg-indigo-600/20 dark:text-indigo-300 dark:border-indigo-500/40 dark:shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                            : "bg-blue-500/10 text-blue-700 border border-blue-100/50 dark:bg-blue-600/20 dark:text-blue-300 dark:border-blue-500/40 dark:shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                          : "text-slate-500 hover:bg-white border border-transparent dark:text-slate-400 dark:hover:bg-[#131B2E] dark:hover:text-slate-200 dark:hover:border-slate-800/80"
                      }`}
                  >
                    <div className={`shrink-0 transition-all duration-300 ${isActive ? (isAdm ? "text-indigo-600 dark:text-indigo-400" : "text-blue-600 dark:text-blue-400") : 'group-hover:scale-110'}`}>
                      {React.cloneElement(link.icon as React.ReactElement, { className: "w-6 h-6" })}
                    </div>
                    {isLocked && (
                      <div className="absolute top-2 right-2">
                        <Lock className="w-2.5 h-2.5 text-slate-400" />
                      </div>
                    )}
                  </motion.div>
                </Link>
              </div>
            );
          })
        ) : (
          /* Mobile & Desktop Expanded View: Sectioned for Mobile */
          mobileSections.map((section, idx) => (
            <div key={section.title} className={idx > 0 ? "pt-4 lg:pt-0" : ""}>
                <h4 className="lg:hidden px-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-4">{section.title}</h4>
                <div className="space-y-1.5">
                   {section.links.map((link) => {
                     const isLocked = isGuest && link.href !== "/app/review-finder";
                     const isActive = !isLocked && pathname === link.href;

                     return (
                       <div
                         key={link.href}
                         onClick={(e) => {
                           if (isLocked) {
                             e.preventDefault();
                             setGuestLockModal({ open: true, title: link.name });
                           }
                         }}
                       >
                         <Link 
                           href={isLocked ? "#" : link.href} 
                           onClick={(e) => {
                             if (isLocked) {
                               e.preventDefault();
                               setGuestLockModal({ open: true, title: link.name });
                             } else {
                               setMobileOpen(false);
                             }
                           }}
                         >
                           <motion.div
                             whileHover={{ x: isLocked ? 2 : 6 }}
                             whileTap={{ scale: 0.97 }}
                             className={`group relative flex items-center gap-4 rounded-2xl px-4 py-4 transition-all duration-300 ${
                                 isLocked
                                   ? "opacity-40 grayscale hover:opacity-60 cursor-pointer"
                                   : isActive
                                     ? isAdm 
                                       ? "bg-gradient-to-r from-indigo-500/10 to-indigo-500/5 text-indigo-700 shadow-sm border border-indigo-100/50 dark:from-indigo-600/25 dark:to-indigo-600/10 dark:text-indigo-300 dark:border-indigo-500/30 dark:shadow-[0_4px_20px_rgba(99,102,241,0.15)]"
                                       : "bg-gradient-to-r from-blue-500/10 to-blue-500/5 text-blue-700 shadow-sm border border-blue-100/50 dark:from-blue-600/25 dark:to-indigo-600/10 dark:text-blue-300 dark:border-blue-500/30 dark:shadow-[0_4px_20px_rgba(59,130,246,0.15)]"
                                     : "text-slate-500 hover:bg-white border border-transparent hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#131B2E] dark:hover:text-slate-100 dark:hover:border-slate-800/80"
                               }`}
                           >
                             {isActive && (
                               <motion.div
                                 layoutId="activeSidebarLine"
                                 className={`absolute left-0 inset-y-0 my-auto w-1.5 h-7 rounded-r-lg ${isAdm ? "bg-indigo-600 dark:bg-indigo-400 dark:shadow-[0_0_10px_rgba(129,140,248,0.8)]" : "bg-blue-600 dark:bg-blue-400 dark:shadow-[0_0_10px_rgba(96,165,250,0.8)]"}`}
                               />
                             )}
                             <div className={`shrink-0 transition-all duration-300 ${isActive ? (isAdm ? "text-indigo-600 dark:text-indigo-400" : "text-blue-600 dark:text-blue-400") : 'group-hover:scale-110'}`}>
                               {React.cloneElement(link.icon as React.ReactElement, { className: "w-6 h-6" })}
                             </div>
                             <span className={`text-[15px] font-bold tracking-wide ${isActive ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white"}`}>
                               {link.name}
                             </span>
                             {isLocked && (
                               <div className="ml-auto flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-200/50 dark:border-slate-800">
                                 <Lock className="w-3 h-3 text-slate-400" />
                                 <span>Locked</span>
                               </div>
                             )}
                           </motion.div>
                         </Link>
                       </div>
                     );
                   })}
                </div>
             </div>
          ))
        )}
      </nav>

      {/* Common Action Footer */}
      <div className={`pb-6 pt-4 mt-auto border-t border-slate-100 dark:border-slate-800/80 transition-all duration-300 space-y-2 relative z-10 ${collapsed ? 'px-3' : 'px-5'}`}>
        {!collapsed && (
          <div className="px-2 mb-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Theme Mode</h3>
            <ThemeToggle variant="pill" />
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center mb-2">
            <ThemeToggle variant="icon" />
          </div>
        )}

        <InstallPWA variant={collapsed ? "desktop_collapsed" : "sidebar"} />

        {isGuest ? (
          collapsed ? (
            <Link href="/login" title="Log In / Sign Up">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </motion.div>
            </Link>
          ) : (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-600/20 space-y-2.5">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-blue-200">Become Our Member</span>
                <h4 className="text-xs font-black tracking-tight leading-snug mt-0.5">Unlock 100% Cashback</h4>
                <p className="text-[10px] text-blue-100/80 mt-0.5 leading-tight">
                  Join free & claim 100% refunds on top brands.
                </p>
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <Link
                  href="/login"
                  className="flex-1 h-8 rounded-lg bg-white text-blue-600 font-black text-[10px] uppercase tracking-wider hover:bg-blue-50 active:scale-95 transition-all flex items-center justify-center shadow-sm"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="flex-1 h-8 rounded-lg bg-white/20 text-white font-black text-[10px] uppercase tracking-wider hover:bg-white/30 backdrop-blur-sm border border-white/20 active:scale-95 transition-all flex items-center justify-center"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          )
        ) : (
          <>
            {/* Profile Link */}
            <Link href="/app/settings" title={collapsed ? "Profile Settings" : ""}>
              <motion.div
                whileHover={{ x: collapsed ? 0 : 6 }}
                whileTap={{ scale: 0.97 }}
                className={`group relative flex items-center rounded-2xl py-3.5 transition-all duration-300 text-slate-500 hover:bg-white inset-shadow hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.1)] hover:border-slate-100 hover:text-slate-900 border border-transparent dark:text-slate-400 dark:hover:bg-[#131B2E] dark:hover:text-white dark:hover:border-slate-800/80 ${collapsed ? 'justify-center px-0' : 'gap-3.5 px-4'
                  }`}
              >
                <div className={`shrink-0 transition-all duration-300 group-hover:scale-110 ${isActiveSettings ? (isAdm ? 'text-indigo-600 dark:text-indigo-400' : 'text-blue-600 dark:text-blue-400') : 'group-hover:text-slate-800 dark:group-hover:text-white'}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className={`text-[15px] font-bold transition-all duration-300 overflow-hidden whitespace-nowrap tracking-wide ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                  My Profile
                </span>
              </motion.div>
            </Link>

            {/* Logout Button */}
            <button 
              onClick={() => signOut({ callbackUrl: "/login" })} 
              className="w-full text-left focus:outline-none" 
              title={collapsed ? "Log Out" : ""}
            >
              <motion.div
                whileHover={{ x: collapsed ? 0 : 6 }}
                whileTap={{ scale: 0.97 }}
                className={`group relative flex w-full items-center rounded-2xl py-3.5 transition-all duration-300 text-slate-400 hover:bg-red-50/50 hover:border-red-100 hover:text-red-600 border border-transparent hover:shadow-[0_4px_20px_-8px_rgba(239,68,68,0.15)] dark:text-slate-400 dark:hover:bg-red-950/20 dark:hover:border-red-900/40 dark:hover:text-red-400 ${collapsed ? 'justify-center px-0' : 'gap-3.5 px-4'
                  }`}
              >
                <div className="shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:text-red-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <span className={`text-[15px] font-bold transition-all duration-300 overflow-hidden whitespace-nowrap tracking-wide ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                  Secure Log Out
                </span>
              </motion.div>
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-[160] transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-72'}`}>
        {getSidebarContent(isCollapsed)}
      </aside>

      {/* Mobile Slide-Over Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[160] bg-slate-900/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 z-[170] w-[300px] shadow-[20px_0_60px_-15px_rgba(0,0,0,0.3)] lg:hidden flex flex-col bg-white dark:bg-[#0B101D]"
            >
              <div className="flex-1 h-full overflow-hidden">
                {getMobileSidebarContent()}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Guest Locked Feature In-Place Modal */}
      <AnimatePresence>
        {guestLockModal.open && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setGuestLockModal({ open: false })}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0E1526] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-2xl z-10 text-center"
            >
              <button
                onClick={() => setGuestLockModal({ open: false })}
                className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 mb-4">
                <Lock className="w-7 h-7" />
              </div>

              <span className="inline-block px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider mb-2 border border-blue-100 dark:border-blue-900/40">
                Exclusive Member Feature
              </span>

              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Unlock {guestLockModal.title || "Feature"}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Log in or create a free account to access 100% cashback deals, manage orders, and get automatic refunds directly into your UPI account.
              </p>

              <div className="mt-6 space-y-2.5">
                <Link
                  href="/login"
                  onClick={() => setGuestLockModal({ open: false })}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-blue-600/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>Log In to Account</span>
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setGuestLockModal({ open: false })}
                  className="w-full h-12 rounded-xl bg-slate-100 dark:bg-[#131B2E] hover:bg-slate-200 dark:hover:bg-[#1A233A] text-slate-700 dark:text-slate-200 font-black text-xs uppercase tracking-wider border border-slate-200 dark:border-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>Create Free Account</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setGuestLockModal({ open: false })}
                  className="w-full py-2 text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  Continue with Review Finder
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
