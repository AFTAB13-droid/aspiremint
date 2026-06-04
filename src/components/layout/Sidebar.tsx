"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import { Logo } from "@/components/common/Logo";
import { UserBadge } from "@/components/ui/UserBadge";
import { InstallPWA } from "@/components/ui/InstallPWA";

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
  }
];

interface SidebarProps {
  userRole: "USER" | "MEDIATOR" | "ADMIN" | "SUBADMIN";
  isMobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  isCollapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  userRole,
  isMobileOpen,
  setMobileOpen,
  isCollapsed = false,
  setCollapsed
}) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isActiveSettings = pathname === "/app/settings";
 
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
  const filteredLinks = navLinks.filter(link => link.roles.includes(userRole));
  const isAdm = userRole === "ADMIN";

  // Group links for mobile "App-like" sections
  const mobileSections = [
    { 
      title: "Operations", 
      links: filteredLinks.filter(l => ["Dashboard", "Orders", "My Orders", "Active Deals", "My Refunds", "My Activity", "Refunds", "Passbook", "Refer and Earn", "Support", "Support Hub"].includes(l.name)) 
    },
    { 
      title: "Management", 
      links: filteredLinks.filter(l => ["User Directory", "Mediators Hub", "Live Analytics", "Resolution Hub", "SOP Guidelines"].includes(l.name)) 
    }
  ].filter(s => s.links.length > 0);

  const getMobileSidebarContent = () => {
    return (
      <div className="flex flex-col h-full bg-white relative overflow-hidden">
        {getSidebarBackground()}

        {/* Header with Profile Info */}
        <div className="px-6 pt-10 pb-6 border-b border-blue-50/50 relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-200 to-indigo-200 p-0.5 shadow-md">
                <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-xl font-black text-slate-900 border-2 border-white overflow-hidden shadow-inner uppercase">
                   {session?.user?.image ? (
                     <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                   ) : (
                     session?.user?.name?.charAt(0) || "U"
                   )}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Hello,</span>
                <span className="text-2xl font-black text-slate-900 leading-none tracking-tight">
                  {session?.user?.name?.split(' ')[0] || "User"}
                </span>
                <Link 
                  href="/app/settings" 
                  onClick={() => setMobileOpen(false)}
                  className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mt-2.5 hover:text-indigo-600 transition-colors bg-blue-50/50 px-2 py-1 rounded-md self-start"
                >
                  Edit Profile
                </Link>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 -mr-2 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 active:scale-95 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-between gap-4">
             <UserBadge ordersCount={(session?.user as any)?.totalCompletedOrders || 0} showProgression={false} />
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto py-6 px-4 relative z-10">
          <div className="space-y-1">
            {filteredLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-4 px-6 py-4 rounded-3xl transition-all ${
                      isActive 
                        ? "bg-blue-50 text-blue-600 shadow-sm border border-blue-100" 
                        : "text-slate-500 active:bg-slate-50"
                    }`}
                  >
                    <div className={`transition-transform ${isActive ? 'scale-110' : ''}`}>
                      {React.cloneElement(link.icon as React.ReactElement, { 
                        className: `w-6 h-6 ${isActive ? 'text-blue-600' : 'text-slate-400'}` 
                      })}
                    </div>
                    <span className={`text-base font-bold tracking-tight ${isActive ? 'text-blue-700' : 'text-slate-600'}`}>
                      {link.name}
                    </span>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer actions for mobile */}
        <div className="p-6 border-t border-blue-50/50 flex flex-col gap-3 relative z-10">
           <InstallPWA variant="mobile" />
           <Link href="/app/settings" onClick={() => setMobileOpen(false)} className="w-full">
              <button className="w-full h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-[11px] font-black uppercase tracking-[0.2em] border border-blue-100/50 shadow-sm">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                 My Profile
              </button>
           </Link>
           <button 
             onClick={() => signOut({ callbackUrl: "/login" })}
             className="w-full h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-[11px] font-black uppercase tracking-[0.2em] border border-red-100/50"
           >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Sign Out
           </button>
        </div>
      </div>
    );
  };

  const getSidebarBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
       {/* Soft Blue Base Gradient */}
       <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-white to-blue-50/40" />
       
       <svg className="absolute inset-0 w-full h-full text-blue-500" viewBox="0 0 400 800" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
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
       
       {/* Soft Blue Glows */}
       <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/40 rounded-full blur-[100px]" />
       <div className="absolute bottom-20 left-0 w-72 h-72 bg-blue-100/30 rounded-full blur-[80px]" />
    </div>
  );

  const getSidebarContent = (collapsed: boolean) => (
    <div className="flex h-full flex-col bg-white relative border-r border-blue-100/60">
      {getSidebarBackground()}

      {/* Desktop Toggle Button */}
      {setCollapsed && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`absolute -right-3 top-8 hidden lg:flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm z-50 transition-transform duration-300 ${isAdm ? "hover:text-indigo-500" : "hover:text-blue-500"}`}
          style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <svg className="h-4 w-4 block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Brand Header */}
      <div className={`flex h-24 items-center border-b border-slate-50/50 transition-all duration-300 relative z-10 ${collapsed ? 'justify-center px-0' : 'justify-between px-8'}`}>
        <div className="flex items-center gap-4 overflow-hidden">
          <Logo size={48} variant="blue" className="shrink-0 drop-shadow-blue" />
          <div className={`flex flex-col transition-opacity duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
            <span className="text-xl font-black tracking-tight text-slate-900 leading-none">AspireMint</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mt-1">
               {userRole === "ADMIN" ? "Admin Panel" : userRole === "MEDIATOR" ? "Mediator Panel" : "Buyers Panel"}
            </span>
          </div>
        </div>
        {/* Mobile Close Button */}
        <button
          onClick={() => setMobileOpen(false)}
          className={`lg:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors ${collapsed ? 'hidden' : 'block'}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* MOBILE USER PROFILE CARD (Native App Feel) */}
      {!collapsed && (
        <div className="lg:hidden px-5 pt-6 pb-2">
           <div className={`relative overflow-hidden p-5 rounded-[28px] border border-blue-100/30 shadow-sm transition-all bg-gradient-to-br ${isAdm ? "from-indigo-600 to-indigo-700" : "from-blue-600 to-blue-700"} text-white`}>
              <div className="absolute top-0 right-0 h-24 w-24 bg-white/10 blur-2xl rounded-full -mr-12 -mt-12" />
              <div className="flex items-center gap-4 relative z-10">
                 <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl font-black shadow-inner border border-white/20">
                    {session?.user?.name?.charAt(0) || "U"}
                 </div>
                 <div className="overflow-hidden">
                    <p className="text-[15px] font-black leading-none truncate">{session?.user?.name || "Guest"}</p>
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
        </div>
      )}

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto p-4 space-y-4 transition-all duration-300 relative z-10 ${collapsed ? 'px-3' : 'px-5 mt-4'}`}>
        {/* Desktop View: Flat list */}
        {collapsed ? (
          filteredLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} title={link.name}>
                <motion.div
                  whileTap={{ scale: 0.97 }}
                  className={`group relative flex items-center justify-center rounded-2xl py-4 transition-all duration-300 ${isActive
                      ? isAdm 
                        ? "bg-indigo-500/10 text-indigo-700 border border-indigo-100/50"
                        : "bg-blue-500/10 text-blue-700 border border-blue-100/50"
                      : "text-slate-500 hover:bg-white border border-transparent"
                    }`}
                >
                  <div className={`shrink-0 transition-all duration-300 ${isActive ? (isAdm ? "text-indigo-600" : "text-blue-600") : 'group-hover:scale-110'}`}>
                    {React.cloneElement(link.icon as React.ReactElement, { className: "w-6 h-6" })}
                  </div>
                </motion.div>
              </Link>
            );
          })
        ) : (
          /* Mobile & Desktop Expanded View: Sectioned for Mobile */
          mobileSections.map((section, idx) => (
            <div key={section.title} className={idx > 0 ? "pt-4 lg:pt-0" : ""}>
                <h4 className="lg:hidden px-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">{section.title}</h4>
                <div className="space-y-1.5">
                   {section.links.map((link) => {
                     const isActive = pathname === link.href;
                     return (
                       <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                         <motion.div
                           whileHover={{ x: 6 }}
                           whileTap={{ scale: 0.97 }}
                           className={`group relative flex items-center gap-4 rounded-2xl px-4 py-4 transition-all duration-300 ${isActive
                               ? isAdm 
                                 ? "bg-gradient-to-r from-indigo-500/10 to-indigo-500/5 text-indigo-700 shadow-sm border border-indigo-100/50"
                                 : "bg-gradient-to-r from-blue-500/10 to-blue-500/5 text-blue-700 shadow-sm border border-blue-100/50"
                               : "text-slate-500 hover:bg-white border border-transparent hover:text-slate-900"
                             }`}
                         >
                           {isActive && (
                             <motion.div
                               layoutId="activeSidebarLine"
                               className={`absolute left-0 inset-y-0 my-auto w-1.5 h-7 rounded-r-lg ${isAdm ? "bg-indigo-600" : "bg-blue-600"}`}
                             />
                           )}
                           <div className={`shrink-0 transition-all duration-300 ${isActive ? (isAdm ? "text-indigo-600" : "text-blue-600") : 'group-hover:scale-110'}`}>
                             {React.cloneElement(link.icon as React.ReactElement, { className: "w-6 h-6" })}
                           </div>
                           <span className="text-[15px] font-bold tracking-wide">
                             {link.name}
                           </span>
                         </motion.div>
                       </Link>
                     );
                   })}
                </div>
             </div>
          ))
        )}
      </nav>

      {/* Common Action Footer */}
      <div className={`pb-6 pt-4 mt-auto border-t border-slate-100 transition-all duration-300 space-y-1.5 relative z-10 ${collapsed ? 'px-3' : 'px-5'}`}>
        {!collapsed && (
          <div className="px-3 mb-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Control</h3>
          </div>
        )}

        <InstallPWA variant={collapsed ? "desktop_collapsed" : "sidebar"} />

        {/* Profile Link */}
        <Link href="/app/settings" title={collapsed ? "Profile Settings" : ""}>
          <motion.div
            whileHover={{ x: collapsed ? 0 : 6 }}
            whileTap={{ scale: 0.97 }}
            className={`group relative flex items-center rounded-2xl py-3.5 transition-all duration-300 text-slate-500 hover:bg-white inset-shadow hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.1)] hover:border-slate-100 hover:text-slate-900 border border-transparent ${collapsed ? 'justify-center px-0' : 'gap-3.5 px-4'
              }`}
          >
            <div className={`shrink-0 transition-all duration-300 group-hover:scale-110 ${isActiveSettings ? (isAdm ? 'text-indigo-600' : 'text-blue-600') : 'group-hover:text-slate-800'}`}>
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
            className={`group relative flex w-full items-center rounded-2xl py-3.5 transition-all duration-300 text-slate-400 hover:bg-red-50/50 hover:border-red-100 hover:text-red-600 border border-transparent hover:shadow-[0_4px_20px_-8px_rgba(239,68,68,0.15)] ${collapsed ? 'justify-center px-0' : 'gap-3.5 px-4'
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
              className="fixed inset-y-0 left-0 z-[170] w-[300px] shadow-[20px_0_60px_-15px_rgba(0,0,0,0.3)] lg:hidden flex flex-col bg-white"
            >
              <div className="flex-1 h-full overflow-hidden">
                {getMobileSidebarContent()}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
