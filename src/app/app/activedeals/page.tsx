"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/Skeleton";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { BrandManager } from "@/components/admin/BrandManager";
import { DealCreationForm } from "@/components/admin/DealCreationForm";
import { ActiveDealsTable } from "@/components/admin/ActiveDealsTable";
import { BulkDealsUpload } from "@/components/admin/BulkDealsUpload";

export default function ActiveDealsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "USER";
  const isAdm = role === "ADMIN";

  const [activeTab, setActiveTab] = useState<"DEALS" | "BRANDS" | "NEW_DEAL" | "BULK_UPLOAD">("DEALS");
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const res = await fetch(`/api/deals/active?v=${Date.now()}`);
      const json = await res.json();
      if (json.success) setDeals(json.data);
    } catch (err) {
      toast.error("Failed to load deals");
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    const loadingId = toast.loading("Synchronizing system state & yields...");
    try {
      // 1. Clear Redis Cache
      await fetch("/api/admin/system/clear-cache", { method: "POST" });
      
      // 2. Sync Retroactive Profits
      const syncRes = await fetch("/api/admin/system/sync-profits");
      const syncJson = await syncRes.json();
      
      if (syncJson.success) {
        toast.success(syncJson.message, { id: loadingId });
        fetchDeals(); // Refresh UI
      } else {
        toast.error(syncJson.message, { id: loadingId });
      }
    } catch (err) {
      toast.error("Failed to perform deep system sync", { id: loadingId });
    }
  };

  if (!isAdm && role !== "MEDIATOR" && role !== "USER") {
    return <div className="p-20 text-center">Unauthorized Access</div>;
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-10 pb-20 mt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
          <Skeleton className="h-14 w-48 rounded-2xl" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <Skeleton key={i} className="h-32 rounded-[32px]" />
          ))}
        </div>

        <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm">
           <Skeleton className="h-12 w-full mb-6" />
           <div className="space-y-4">
              {[1,2,3,4,5].map(i => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8 pb-20 overflow-x-hidden">
      
      {/* Dynamic Header - Only shown for ADMIN to manage brands/creation */}
      {isAdm && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 h-auto md:h-16">
          
          <div className="flex flex-col md:flex-row md:items-center gap-6 flex-1">
             {/* Tab Navigation - Advanced Design */}
             <div className="relative flex items-center p-1.5 bg-slate-100 rounded-2xl border border-slate-200/50 self-start shadow-inner">
                {[
                  { id: "DEALS", label: "Live Deals" },
                  { id: "BRANDS", label: "Brands", adminOnly: true },
                  { id: "NEW_DEAL", label: "New Deal", adminOnly: true },
                  { id: "BULK_UPLOAD", label: "Bulk Upload", adminOnly: true }
                ].filter(t => !t.adminOnly || isAdm).map((tab) => (
                  <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as any)}
                     className="relative px-6 py-2.5 z-10"
                  >
                     <span className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${activeTab === tab.id ? "text-white" : "text-slate-400 hover:text-slate-600"}`}>
                        {tab.label}
                     </span>
                     {activeTab === tab.id && (
                       <motion.div 
                         layoutId="activeTabPill"
                         className="absolute inset-0 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/30 z-[-1]"
                         transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                       />
                     )}
                  </button>
                ))}
             </div>
  
             {/* Reclaimed Space Search - Improved Visibility */}
             {activeTab === "DEALS" && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="relative flex-1 max-w-sm group hidden lg:block"
               >
                  <input 
                    type="text" 
                    placeholder="SEARCH MARKETPLACE..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 bg-slate-50 border-2 border-slate-200/60 rounded-2xl px-12 text-[10px] font-black uppercase tracking-[0.1em] outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-400 shadow-sm"
                  />
                  <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-200 rounded-md text-[8px] font-black text-slate-500 uppercase tracking-tighter opacity-0 group-focus-within:opacity-100 transition-opacity">Esc</div>
               </motion.div>
             )}
          </div>
  
          {/* Reclaimed Space Stats & Cache Sync */}
          {activeTab === "DEALS" && (
             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="hidden xl:flex items-center gap-6"
             >
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Global Coverage</p>
                   <p className="text-lg font-black text-slate-900 mt-1">{deals.length} <span className="text-[10px] text-slate-400 tracking-normal">Active Manifests</span></p>
                </div>
                <div className="h-10 w-px bg-slate-100" />
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Liquidity</p>
                   <p className="text-lg font-black text-blue-600 mt-1">{deals.reduce((sum, d) => sum + d.remainingSlots, 0)} <span className="text-[10px] text-blue-400 tracking-normal">Slots Left</span></p>
                </div>
             </motion.div>
          )}
        </div>
      )}

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === "DEALS" ? (
          <motion.div key="deals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
             <ActiveDealsTable 
               deals={deals} 
               loading={loading}
               searchQuery={searchQuery} 
               setSearchQuery={setSearchQuery}
               onRefresh={fetchDeals} 
               isAdm={isAdm}
               role={role}
               isJuhi={session?.user?.name?.toLowerCase().includes("juhi") || false}
             />
          </motion.div>
        ) : activeTab === "BRANDS" ? (
          <motion.div key="brands" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <BrandManager onRefresh={fetchDeals} />
          </motion.div>
        ) : activeTab === "NEW_DEAL" ? (
          <motion.div key="new" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
             <DealCreationForm onCreated={() => { setActiveTab("DEALS"); fetchDeals(); }} />
          </motion.div>
        ) : (
          <motion.div key="bulk" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
             <BulkDealsUpload onSuccess={() => { setActiveTab("DEALS"); fetchDeals(); }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
