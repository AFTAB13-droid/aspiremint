"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/Skeleton";
import { BrandManager } from "@/components/admin/BrandManager";
import { AdminReports } from "@/components/admin/AdminReports";
import { BrandOrderStats } from "@/components/admin/BrandOrderStats";
import { UserTableView } from "@/components/user/UserTableView";
import { AdminTableView } from "@/components/admin/AdminTableView";
import { BannerManager } from "@/components/admin/BannerManager";

type ViewMode = "GRID" | "LIST";

export default function DealsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "USER";
  const isAdm = role === "ADMIN";
  const isSubAdmin = role === "SUBADMIN";

  const [orders, setOrders] = useState<any[]>([]);
  const [allBrands, setAllBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation & Filtering State
  const [activeTab, setActiveTab] = useState<string>("DEALS");
  const [filterType, setFilterType] = useState<"ACTIVE" | "PAST">("ACTIVE");
  const [viewMode, setViewMode] = useState<ViewMode>("LIST");
  const [searchQuery, setSearchQuery] = useState("");
  const [mediators, setMediators] = useState<any[]>([]);
  const [selectedMediator, setSelectedMediator] = useState<string>("ALL");
  const [isMediatorDropdownOpen, setIsMediatorDropdownOpen] = useState(false);

  // Initialize correct tab for Subadmin
  useEffect(() => {
    if (isSubAdmin && activeTab === "DEALS") {
      setActiveTab("ORDERED");
    }
  }, [isSubAdmin, activeTab]);

  const handleViewDetails = (id: string) => router.push(`/dashboard/deals/${id}`);
  const handleRefund = (id: string) => router.push(`/dashboard/refunds/fill/${id}`);

  const fetchOrders = async () => {
    try {
      const [ordersRes, brandsRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/brands")
      ]);
      
      const ordersJson = await ordersRes.json();
      const brandsJson = await brandsRes.json();
      
      if (ordersJson.success) setOrders(ordersJson.data);
      if (brandsJson.success) setAllBrands(brandsJson.data);
    } catch (err) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchMediators = async () => {
    try {
      const res = await fetch("/api/users?role=MEDIATOR&limit=100");
      const json = await res.json();
      if (json.success) setMediators(json.data);
    } catch (err) {
      console.error("Failed to fetch mediators:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    if (isAdm || isSubAdmin) fetchMediators();
  }, [isAdm, isSubAdmin]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // SubAdmin specific filtering based on dedicated tabs
      if (isSubAdmin) {
        let statusMatch = true;
        if (activeTab === "ORDERED") {
          statusMatch = order.status === "REFUND_FORM_PENDING";
        } else if (activeTab === "TO_BE_REVIEWED") {
          statusMatch = ["UNDER_VERIFICATION", "REFUND_FORM_SUBMITTED"].includes(order.status);
        }
        
        const searchMatch = (order.brandName || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (order.aspireOrderId || "").toLowerCase().includes(searchQuery.toLowerCase());
        
        const mediatorMatch = selectedMediator === "ALL" || order.mediator?._id === selectedMediator || order.mediator === selectedMediator;

        return statusMatch && searchMatch && mediatorMatch;
      }

      // Existing Admin/User filtering
      const isPast = ["PAST", "REJECTED", "COMPLETED", "REFUNDED"].includes(order.status);
      const matchesFilter = filterType === "ACTIVE" ? !isPast : isPast;
      const matchesSearch = (order.brandName || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (order.aspireOrderId || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [orders, filterType, searchQuery, activeTab, isSubAdmin]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "REFUND_FORM_PENDING": return "bg-amber-100/50 text-amber-700 border-amber-200 shadow-sm animate-pulse";
      case "UNDER_VERIFICATION": return "bg-blue-100/50 text-blue-700 border-blue-200 shadow-sm";
      case "REFUND_FORM_SUBMITTED": return "bg-blue-100/50 text-blue-700 border-blue-200 shadow-sm";
      case "REFUND_APPROVED": return "bg-emerald-100/50 text-emerald-700 border-emerald-200 shadow-emerald-100/20";
      case "REFUND_REJECTED": return "bg-rose-100/60 text-rose-700 border-rose-300 shadow-rose-100/20";
      case "PENDING_APPROVAL": return "bg-amber-100/50 text-amber-700 border-amber-200";
      case "APPROVED": return "bg-emerald-100/50 text-emerald-700 border-emerald-200";
      case "ACTIVE_ESCROW": return "bg-purple-100/50 text-purple-700 border-purple-200 shadow-purple-100/20";
      case "ESCROW_PAYMENT_PENDING": return "bg-indigo-100/50 text-indigo-700 border-indigo-200";
      case "COMPLETED": return "bg-emerald-100/50 text-emerald-700 border-emerald-200";
      case "REFUNDED": return "bg-emerald-100/50 text-emerald-700 border-emerald-200";
      case "CANCELLED": return "bg-slate-100 text-slate-500 border-slate-200";
      case "REJECTED": return "bg-rose-100/50 text-rose-700 border-rose-200";
      case "DISPUTE_RAISED": return "bg-rose-100/50 text-rose-700 border-rose-200";
      default: return "bg-slate-50 text-slate-500 border-slate-100";
    }
  };

  const getRowHighlight = (status: string) => {
    switch (status) {
      case 'REFUND_REJECTED': return { bg: 'bg-rose-100/30', border: 'border-l-rose-500', text: 'text-rose-600' };
      case 'UNDER_VERIFICATION': 
      case 'REFUND_FORM_SUBMITTED': return { bg: 'bg-blue-50/70', border: 'border-l-blue-500', text: 'text-blue-600' };
      case 'REFUND_APPROVED': 
      case 'REFUNDED': 
      case 'APPROVED': 
      case 'COMPLETED': return { bg: 'bg-emerald-50/60', border: 'border-l-emerald-500', text: 'text-emerald-600' };
      case 'REFUND_FORM_PENDING': 
      case 'PENDING_APPROVAL': return { bg: 'bg-amber-50/70', border: 'border-l-amber-500', text: 'text-amber-600' };
      case 'ACTIVE_ESCROW': return { bg: 'bg-purple-50/60', border: 'border-l-purple-500', text: 'text-purple-600' };
      case 'ESCROW_PAYMENT_PENDING': return { bg: 'bg-indigo-50/60', border: 'border-l-indigo-500', text: 'text-indigo-600' };
      case 'DISPUTE_RAISED': return { bg: 'bg-rose-50/60', border: 'border-l-rose-400', text: 'text-rose-600' };
      default: return { bg: 'hover:bg-slate-50/50', border: 'border-l-transparent', text: 'text-slate-400' };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8 pb-20">
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
               <Skeleton className="h-4 w-32" />
               <Skeleton className="h-10 w-64" />
            </div>
            <Skeleton className="h-14 w-48 rounded-2xl" />
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
               <Skeleton key={i} className="h-64 rounded-[32px]" />
            ))}
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-5 pb-16 overflow-x-hidden">
      
      {/* Navigation Bar - Sticky on Mobile, Centered Tabs */}
      <div className="sticky top-0 z-[40] -mx-4 px-4 py-3 md:relative md:top-auto md:z-auto md:p-0 bg-white/90 backdrop-blur-md md:bg-transparent border-b border-slate-100 md:border-none mb-2 md:mb-0">
          <div className="relative flex items-center justify-center min-h-[56px] md:min-h-[64px]">
              <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/50 rounded-[28px] border border-slate-100 shadow-sm max-w-full overflow-x-auto no-scrollbar">
                {isAdm || isSubAdmin ? (
                    (isSubAdmin ? ["ORDERED", "TO_BE_REVIEWED"] : ["DEALS", "KANBAN", "BRANDS", "REPORTS", "BANNER"]).map((tab) => (
                      <button key={tab} onClick={() => setActiveTab(tab as any)} className={`whitespace-nowrap flex items-center justify-center gap-3 px-6 py-3 rounded-[22px] text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? "bg-white text-blue-600 shadow-md border border-blue-50" : "text-slate-400 hover:text-slate-600"}`}>
                         {tab === "DEALS" ? "Ledger" : 
                          tab === "KANBAN" ? "ANALYTICS" : 
                          tab === "ORDERED" ? "ORDERED" : 
                          tab === "TO_BE_REVIEWED" ? "TO BE REVIEWED" : 
                          tab}
                      </button>
                    ))
                ) : (
                    <div className="flex flex-col md:flex-row items-center gap-4 mx-auto w-full md:w-auto">
                        <div className="flex items-center gap-1.5 p-1 bg-slate-100/50 rounded-[24px] border border-slate-100 shadow-sm">
                           {["ACTIVE", "PAST"].map((f) => (
                             <button key={f} onClick={() => setFilterType(f as any)} className={`whitespace-nowrap flex items-center justify-center gap-3 px-8 md:px-12 py-2.5 rounded-[20px] text-[9px] font-black uppercase tracking-widest transition-all ${filterType === f ? "bg-white text-blue-600 shadow-md border border-blue-50" : "text-slate-400 hover:text-slate-600"}`}>
                                {f === "ACTIVE" ? "ONGOING" : "COMPLETED"}
                             </button>
                           ))}
                        </div>
                    </div>
                )}
              </div>

          </div>
      </div>

      {/* Mobile Floating Action Button (FAB) - New Order Form */}
      {role === "USER" && (
        <div className="fixed bottom-6 right-6 z-[60] md:hidden">
           <Link href="/dashboard/deals/new">
            <motion.button 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileTap={{ scale: 0.9 }}
              className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-[0_15px_30px_-5px_rgba(37,99,235,0.4)] border-4 border-white/20 active:bg-blue-700 transition-colors"
            >
               <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            </motion.button>
           </Link>
        </div>
      )}
      {/* Admin/SubAdmin Tool Bar */}
      {(isAdm || isSubAdmin) && (activeTab === "DEALS" || isSubAdmin) && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-center justify-between gap-4 mt-2"
        >
           <div className="flex items-center gap-1 p-1 bg-slate-100/30 rounded-2xl border border-slate-100/50">
              {!isSubAdmin && ["ACTIVE", "PAST"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterType(f as any)}
                  className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterType === f ? "bg-white text-blue-600 shadow-sm border border-blue-50" : "text-slate-400 hover:text-slate-600"}`}
                >
                  {f === "ACTIVE" ? "ONGOING" : "COMPLETED"}
                </button>
              ))}
              {isSubAdmin && (
                <div className="px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                   Operational Status Filtering
                </div>
              )}
           </div>

           <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {/* Mediator Filter */}
              {(isAdm || isSubAdmin) && (
                <div className="relative group">
                  <button
                    onClick={() => setIsMediatorDropdownOpen(!isMediatorDropdownOpen)}
                    className="h-10 min-w-[180px] rounded-2xl bg-white border border-slate-100 px-5 flex items-center justify-between gap-3 text-[9px] font-black uppercase tracking-widest outline-none hover:border-blue-200 transition-all shadow-sm group"
                  >
                    <span className="truncate max-w-[120px]">
                      {selectedMediator === "ALL" ? "ALL SPECIALISTS" : (mediators.find(m => m._id === selectedMediator)?.name || "SELECT SPECIALIST")}
                    </span>
                    <svg className={`w-3 h-3 transition-transform duration-300 ${isMediatorDropdownOpen ? 'rotate-180 text-blue-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                  </button>

                  <AnimatePresence>
                    {isMediatorDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-[45]" onClick={() => setIsMediatorDropdownOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute left-0 right-0 top-full mt-2 z-[50] bg-white rounded-3xl border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden p-2"
                        >
                          <div className="max-h-[250px] overflow-y-auto no-scrollbar space-y-1">
                            <button
                              onClick={() => { setSelectedMediator("ALL"); setIsMediatorDropdownOpen(false); }}
                              className={`w-full text-left px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedMediator === "ALL" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50"}`}
                            >
                              ALL SPECIALISTS
                            </button>
                            {mediators.map((m: any) => (
                              <button
                                key={m._id}
                                onClick={() => { setSelectedMediator(m._id); setIsMediatorDropdownOpen(false); }}
                                className={`w-full text-left px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedMediator === m._id ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50"}`}
                              >
                                {m.name}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className="flex items-center gap-1 p-1 bg-slate-100/30 rounded-2xl border border-slate-100/50">
                {(["GRID", "LIST"] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`p-2 rounded-xl transition-all ${viewMode === mode ? "bg-white text-blue-600 shadow-sm border border-blue-50" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    {mode === "GRID" ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                    )}
                  </button>
                ))}
              </div>
              <div className="relative w-full md:w-64 group">
                 <input 
                   type="text" 
                   placeholder="SEARCH DEALS..." 
                   value={searchQuery} 
                   onChange={(e) => setSearchQuery(e.target.value)} 
                   className="h-10 w-full rounded-2xl bg-white border border-slate-100 px-5 text-[9px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300 shadow-sm" 
                 />
                 <svg className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
           </div>
        </motion.div>
      )}


      {/* Content Rendering */}
      <AnimatePresence mode="wait">
        {(activeTab === "DEALS" || activeTab === "ORDERED" || activeTab === "TO_BE_REVIEWED") ? (
          <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
            {role === "USER" ? (
               <UserTableView 
                  orders={filteredOrders} 
                  onViewDetails={handleViewDetails}
                  onRefund={handleRefund}
                  onNewOrder={() => router.push('/dashboard/deals/new')}
                  refreshOrders={fetchOrders}
                  showRefundOnly={filterType === "PAST"}
               />
            ) : (
               <AdminTableView 
                 orders={filteredOrders}
                 onViewDetails={handleViewDetails}
                 activeTab={activeTab}
               />
            )}
          </motion.div>
        ) : activeTab === "KANBAN" ? (
          <motion.div key="analytics" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
            <BrandOrderStats 
              orders={orders} 
              allBrands={allBrands}
            />
          </motion.div>
        ) : activeTab === "BRANDS" ? (
          <motion.div key="brands" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
            <BrandManager onRefresh={fetchOrders} />
          </motion.div>
        ) : activeTab === "REPORTS" ? (
          <motion.div key="reports" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}><AdminReports orders={orders} allBrands={allBrands} /></motion.div>
        ) : (
          <motion.div key="banner" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}><BannerManager /></motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
