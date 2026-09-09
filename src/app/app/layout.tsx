"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, redirect } from "next/navigation";
import Link from "next/link";
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
  const [profileData, setProfileData] = useState<any>(null);

  React.useEffect(() => {
    (window as any).setMobileOpen = setMobileOpen;

    const fetchThemeAndProfile = async () => {
      try {
        let globalTheme = "";
        const res = await fetch("/api/config/banner");
        const json = await res.json();
        if (json.success && json.data) {
          const config = json.data;
          if (config.isActive && config.applyAppTheme && config.template !== "DEFAULT") {
            globalTheme = `theme-${config.template.toLowerCase()}`;
          }
        }

        const profileRes = await fetch("/api/user/profile");
        const profileJson = await profileRes.json();
        if (profileJson.success && profileJson.data) {
          setProfileData(profileJson.data);
        }
        setThemeClass(globalTheme);
      } catch (err) {
        console.error("Failed to fetch global theme or profile:", err);
      }
    };
    fetchThemeAndProfile();

    const handleRefresh = () => {
      fetchThemeAndProfile();
    };
    const handleAvatarUpdate = (e: any) => {
      const updatedAvatar = e.detail?.avatar;
      if (updatedAvatar) {
        setProfileData((prev: any) => ({
          ...prev,
          avatar: updatedAvatar,
          profileImage: updatedAvatar
        }));
      }
      fetchThemeAndProfile();
    };

    window.addEventListener("FCM_REFRESH_DATA", handleRefresh);
    window.addEventListener("REFRESH_BANNER_THEME", handleRefresh);
    window.addEventListener("PROFILE_AVATAR_UPDATED", handleAvatarUpdate);
    return () => {
      window.removeEventListener("FCM_REFRESH_DATA", handleRefresh);
      window.removeEventListener("REFRESH_BANNER_THEME", handleRefresh);
      window.removeEventListener("PROFILE_AVATAR_UPDATED", handleAvatarUpdate);
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
        isBanned={!!profileData?.isTerminated}
        userAvatar={profileData?.avatar || profileData?.profileImage || (session.user as any)?.avatar || session.user?.image || ""}
        userName={profileData?.name || session.user?.name || ""}
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
              avatar: profileData?.avatar || profileData?.profileImage || (session.user as any)?.avatar || session.user.image || "",
              totalCompletedOrders: (session.user as any).totalCompletedOrders,
              leaderboardBadge: profileData?.leaderboardBadge
            }} 
            isFestiveActive={!!themeClass}
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
                avatar: profileData?.avatar || profileData?.profileImage || (session.user as any)?.avatar || session.user.image || "",
                totalCompletedOrders: (session.user as any).totalCompletedOrders,
                leaderboardBadge: profileData?.leaderboardBadge
              }} 
              isFestiveActive={!!themeClass}
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

      {profileData?.isTerminated && !(pathname === "/app/settings" || pathname === "/app/support") && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4">
          <div className="bg-white rounded-[40px] w-full max-w-xl p-8 lg:p-10 border border-slate-100 shadow-2xl relative overflow-hidden text-center flex flex-col items-center">
            {/* Background design accents */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-rose-500/5 blur-2xl rounded-full" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-red-500/5 blur-2xl rounded-full" />

            {/* Warning Icon */}
            <div className="h-20 w-20 rounded-[28px] bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-6 animate-pulse">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Account Suspended</h2>
            
            <div className="bg-slate-50 border border-slate-100 rounded-[24px] p-6 w-full text-slate-600 font-bold text-sm mb-8 leading-relaxed">
              {profileData?.banReason === 'CANCELLATION' || !profileData?.banReason ? (
                <span>
                  You have been banned due to your{" "}
                  <span className="text-rose-600 font-black">
                    {profileData?.cancellationStats?.cancelRate?.toFixed(1) || "0.0"}%
                  </span>{" "}
                  cancellation rate and{" "}
                  <span className="text-rose-600 font-black">
                    {profileData?.cancellationStats?.cancelledOrders || 0}
                  </span>{" "}
                  cancelled orders. Please contact the administration team.
                </span>
              ) : (
                <span>
                  {profileData?.banCustomNote || "Your account has been suspended by the administration team."}
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
              <Link href="/app/support" className="w-full">
                <button className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2">
                  <span>Contact Admin</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </Link>
              <button 
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full h-14 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
