"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { OnboardingModal } from "@/components/common/OnboardingModal";

import { PremiumLoader } from "@/components/common/PremiumLoader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMobileOpen, setMobileOpen] = useState(false);
  const [isDesktopCollapsed, setDesktopCollapsed] = useState(true);
  const [themeClass, setThemeClass] = useState("");

  React.useEffect(() => {
    (window as any).setMobileOpen = setMobileOpen;

    const fetchTheme = async () => {
      try {
        const res = await fetch("/api/config/banner");
        const json = await res.json();
        if (json.success && json.data) {
          const config = json.data;
          if (config.isActive && config.applyAppTheme && config.template !== "DEFAULT") {
            setThemeClass(`theme-${config.template.toLowerCase()}`);
          } else {
            setThemeClass("");
          }
        }
      } catch (err) {
        console.error("Failed to fetch global banner theme:", err);
      }
    };
    fetchTheme();

    const handleRefresh = () => {
      fetchTheme();
    };
    window.addEventListener("FCM_REFRESH_DATA", handleRefresh);
    window.addEventListener("REFRESH_BANNER_THEME", handleRefresh);
    return () => {
      window.removeEventListener("FCM_REFRESH_DATA", handleRefresh);
      window.removeEventListener("REFRESH_BANNER_THEME", handleRefresh);
    };
  }, []);

  if (status === "loading") {
    return <PremiumLoader />;
  }

  // Fallback protection in case middleware allows an unauthenticated state
  if (status === "unauthenticated" || !session?.user) {
    redirect("/login");
  }

  const role = (session.user as any).role || "USER";

  return (
    <div className={`flex h-[100dvh] w-full bg-[#f8fafc] overflow-hidden text-slate-900 transition-colors duration-500 ${themeClass}`}>
      <Sidebar 
        userRole={role} 
        isMobileOpen={isMobileOpen} 
        setMobileOpen={setMobileOpen} 
        isCollapsed={isDesktopCollapsed}
        setCollapsed={setDesktopCollapsed}
      />
      
      {/* Main Content Area */}
      <div className={`flex flex-1 flex-col transition-all duration-300 overflow-hidden relative ${isDesktopCollapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        <OnboardingModal />
        
        {/* Conditional Global Header: Hidden on mobile for specific transaction pages */}
        {!(
          (role === "USER" && (
             pathname.includes("/orders/new") || 
             pathname.includes("/refunds/fill/") ||
             pathname.includes("/app/samples")
          )) || 
          (pathname.includes("/orders/") && pathname.split("/").length > 3)
        ) ? (
          <Header 
            setMobileOpen={setMobileOpen} 
            user={{
              name: session.user.name,
              email: session.user.email,
              role: role,
              totalCompletedOrders: (session.user as any).totalCompletedOrders
            }} 
          />
        ) : (
          /* Desktop Header remains visible on transaction pages */
          <div className="hidden lg:block">
            <Header 
              setMobileOpen={setMobileOpen} 
              user={{
                name: session.user.name,
                email: session.user.email,
                role: role,
                totalCompletedOrders: (session.user as any).totalCompletedOrders
              }} 
            />
          </div>
        )}
        
        {/* Scrollable Page Wrapper */}
        <main className={`flex-1 overflow-y-auto relative ${
          (
            (role === "USER" && (
               pathname.includes("/orders/new") || 
               pathname.includes("/refunds/fill/") ||
               pathname.includes("/app/samples")
            )) || 
            (pathname.includes("/orders/") && pathname.split("/").length > 3)
          ) ? "p-0 md:p-6 lg:p-10" : "p-4 sm:p-6 lg:p-10"
        }`}>
          <div className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1800px] xl:pr-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
