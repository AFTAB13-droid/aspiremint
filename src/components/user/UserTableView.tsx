"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { CustomDropdown } from "../ui/CustomDropdown";

interface UserTableViewProps {
  orders: any[];
  onViewDetails: (id: string) => void;
  onRefund: (id: string) => void;
  onNewOrder?: () => void;
  refreshOrders?: () => void;
  showRefundOnly?: boolean;
}

export function UserTableView({ orders, onRefund, onViewDetails, onNewOrder, refreshOrders, showRefundOnly }: UserTableViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNote, setSelectedNote] = useState<{ id: string; note: string } | null>(null);
  const [cancelData, setCancelData] = useState<{ id: string } | null>(null);
  const [purgeConfirmId, setPurgeConfirmId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [itemsPerPage, setItemsPerPage] = useState(isMobile ? 5 : 8);

  React.useEffect(() => {
    setItemsPerPage(isMobile ? 5 : 8);
  }, [isMobile]);
  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("All Brands");
  const [dateFilter, setDateFilter] = useState("");
  const [sortBy, setSortBy] = useState("Most Recent");

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Format Date Helper
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Get due date (e.g., 20 days from creation)
  const getDueDays = (createdAt: string, status: string) => {
    if (status !== 'REFUND_FORM_PENDING' && status !== 'PENDING_APPROVAL') return null;
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const remaining = 25 - diffDays;
    return remaining > 0 ? `Due in ${remaining} days` : "Due";
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'REFUND_FORM_PENDING': return 'bg-amber-100/50 text-amber-700 border-amber-200';
      case 'UNDER_VERIFICATION': return 'bg-blue-100/50 text-blue-700 border-blue-200';
      case 'REFUND_FORM_SUBMITTED': return 'bg-blue-100/50 text-blue-700 border-blue-200';
      case 'REFUND_APPROVED': return 'bg-emerald-100/50 text-emerald-700 border-emerald-200';
      case 'REFUND_REJECTED': return 'bg-rose-100/60 text-rose-700 border-rose-300 shadow-rose-100/20';
      case 'APPROVED': return 'bg-emerald-100/50 text-emerald-700 border-emerald-200';
      case 'PENDING_APPROVAL': return 'bg-amber-100/50 text-amber-700 border-amber-200';
      case 'ESCROW_PAYMENT_PENDING': return 'bg-indigo-100/50 text-indigo-700 border-indigo-200';
      case 'ACTIVE_ESCROW': return 'bg-purple-100/50 text-purple-700 border-purple-200 shadow-purple-100/20';
      case 'COMPLETED': return 'bg-emerald-100/50 text-emerald-700 border-emerald-200';
      case 'REFUNDED': return 'bg-emerald-100/50 text-emerald-700 border-emerald-200';
      case 'DISPUTE_RAISED': return 'bg-rose-100/50 text-rose-700 border-rose-200';
      case 'CANCELLED': return 'bg-slate-100 text-slate-500 border-slate-200';
      case 'INVALIDATED': return 'bg-red-950 text-white border-red-900 shadow-red-900/20 shadow-sm';
      case 'REJECTED': return 'bg-rose-100/50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
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
      case 'INVALIDATED': return { bg: 'bg-red-50/70', border: 'border-l-red-900', text: 'text-red-900' };
      default: return { bg: 'hover:bg-slate-50/50', border: 'border-l-transparent', text: 'text-slate-400' };
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelData || !cancelReason.trim()) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/orders/${cancelData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'CANCELLED',
          cancellationReason: cancelReason 
        })
      });
      const json = await res.json();
      if (json.success) {
        setCancelData(null);
        setCancelReason("");
        if (refreshOrders) refreshOrders();
      } else {
        alert(json.message || "Failed to cancel order");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePurgeOrder = async (id: string) => {
     try {
        const res = await fetch(`/api/orders/purge?orderId=${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) {
           alert("Order deleted from database");
           setPurgeConfirmId(null);
           if (refreshOrders) refreshOrders();
        } else {
           alert(json.message);
        }
     } catch (err) {
        alert("Deletion failed");
     }
  };

  const filteredOrders = useMemo(() => {
    let result = orders.filter(order => {
      const matchesSearch = 
        (order.aspireOrderId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.userOrderId || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBrand = brandFilter === "All Brands" || order.brandName === brandFilter;
      
      // Date Filter
      let matchesDate = true;
      if (dateFilter) {
         const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
         matchesDate = orderDate === dateFilter;
      }

      // Filter out CANCELLED orders for users
      if (order.status === 'CANCELLED') return false;

      return matchesSearch && matchesBrand && matchesDate;
    });

    // Sort Logic
    if (sortBy === "Most Recent") {
       result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "Oldest") {
       result = [...result].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    return result;
  }, [orders, searchQuery, brandFilter, dateFilter, sortBy]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const uniqueBrands = useMemo(() => {
    const brands = orders.map(o => o.brandName).filter(Boolean);
    return ["All Brands", ...Array.from(new Set(brands))];
  }, [orders]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (brandFilter !== "All Brands") count++;
    if (dateFilter) count++;
    if (sortBy !== "Most Recent") count++;
    return count;
  }, [brandFilter, dateFilter, sortBy]);

  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = ["Order ID", "Product Code", "Brand Name", "Review Type", "Order Date", "Status", "Expected Refund (₹)"];
    const csvContent = [
      headers.join(","),
      ...filteredOrders.map(o => {
        return [
          o.userOrderId || o.aspireOrderId || "N/A",
          `"${(o.productCode || "").replace(/"/g, '""')}"`,
          `"${(o.brandName || "").replace(/"/g, '""')}"`,
          o.reviewType || "N/A",
          formatDate(o.createdAt),
          o.status,
          (Number(o.amount || 0) + Number(o.lessAmount || 0))
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `AspireMint_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Desktop Filter Bar - Hidden on Mobile */}
      <div className="hidden md:flex bg-white rounded-[32px] p-5 shadow-sm border border-slate-100 flex-col gap-4">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Recent History</h2>
           </div>
           <div className="flex items-center gap-3">
              {onNewOrder && (
                 <button 
                   onClick={onNewOrder}
                   className="flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-xl text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                 >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                    Order Form
                 </button>
              )}
              <button onClick={handleExportCSV} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 rounded-xl text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                 Export Excel
              </button>
           </div>
        </div>

        <div className="grid grid-cols-5 gap-4 items-center">
           <div className="relative col-span-1">
              <input 
                type="text" 
                placeholder="Order ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-10 text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
           </div>

            <CustomDropdown 
              options={uniqueBrands}
              value={brandFilter}
              onChange={setBrandFilter}
              placeholder="All Brands"
            />


            <div className="relative col-span-1">
               <style>{`
                 input[type="date"]::-webkit-calendar-picker-indicator {
                   background: transparent;
                   bottom: 0;
                   color: transparent;
                   cursor: pointer;
                   height: auto;
                   left: 0;
                   position: absolute;
                   right: 0;
                   top: 0;
                   width: auto;
                 }
               `}</style>
               <input 
                 type="date" 
                 value={dateFilter}
                 onChange={(e) => setDateFilter(e.target.value)}
                 className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-[10px] font-bold uppercase tracking-widest outline-none focus:bg-white focus:shadow-md transition-all custom-date-input" 
               />
               <svg className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>

            <CustomDropdown 
              options={["Most Recent", "Oldest"]}
              value={sortBy}
              onChange={setSortBy}
              placeholder="Sort By"
            />

           <div className="flex justify-end">
              <button className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4.5h18m-18 5h18m-18 5h18m-18 5h18" /></svg>
              </button>
           </div>
        </div>
      </div>

      {/* Mobile Top-Level Action Row - Hidden on Desktop */}
      <div className="md:hidden flex items-center gap-2 mb-2">
         {/* Search Toggle Pill */}
         <motion.div 
           initial={false}
           animate={{ width: isSearchExpanded ? '100%' : '48px' }}
           className="relative h-12 bg-white rounded-full border border-slate-100 shadow-sm flex items-center overflow-hidden transition-all duration-300"
         >
            <button 
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              className="h-12 w-12 flex items-center justify-center text-slate-400 shrink-0"
            >
               {isSearchExpanded ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
               ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               )}
            </button>
            <input 
               type="text" 
               placeholder="Search deals..." 
               autoFocus={isSearchExpanded}
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className={`h-full w-full bg-transparent text-[11px] font-bold uppercase tracking-widest outline-none pr-4 transition-opacity duration-300 ${isSearchExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            />
         </motion.div>

         {/* Filter Drawer Toggle Pill */}
         {!isSearchExpanded && (
            <button 
               onClick={() => setIsFilterDrawerOpen(true)}
               className="flex-1 h-12 bg-white rounded-full border border-slate-100 shadow-sm flex items-center justify-center gap-3 px-6 active:scale-95 transition-all animate-in fade-in zoom-in duration-300"
            >
               <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4.5h18m-18 5h18m-18 5h18m-18 5h18" /></svg>
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.1em]">Filters</span>
               </div>
               {activeFiltersCount > 0 && (
                  <span className="bg-blue-600 text-white text-[8px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">{activeFiltersCount}</span>
               )}
            </button>
          )}
          <button 
             onClick={handleExportCSV} 
             className="h-12 w-12 shrink-0 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
             title="Export Excel"
          >
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          </button>
      </div>

      {/* Filter Drawer (Bottom Sheet) - Mobile Only */}
      <AnimatePresence>
        {isFilterDrawerOpen && (
          <>
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsFilterDrawerOpen(false)}
               className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] md:hidden"
            />
            <motion.div 
               initial={{ y: "100%" }}
               animate={{ y: 0 }}
               exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-8 z-[101] md:hidden shadow-2xl border-t border-slate-100"
            >
               <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8" />
               <div className="space-y-6">
                  <div className="flex items-center justify-between mb-2">
                     <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Global Filters</h3>
                     <button onClick={() => {
                        setBrandFilter("All Brands");
                        setDateFilter("");
                        setSortBy("Most Recent");
                     }} className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Reset All</button>
                  </div>
                  
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Brand</span>
                        <CustomDropdown options={uniqueBrands} value={brandFilter} onChange={setBrandFilter} placeholder="Select Brand" className="!rounded-2xl" />
                     </div>
                     <div className="space-y-2">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Order Date</span>
                        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-[11px] font-bold uppercase tracking-widest outline-none" />
                     </div>
                     <div className="space-y-2">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Sort Preferences</span>
                        <CustomDropdown options={["Most Recent", "Oldest"]} value={sortBy} onChange={setSortBy} placeholder="Sort Orientation" className="!rounded-2xl" />
                     </div>
                  </div>

                  <button 
                     onClick={() => setIsFilterDrawerOpen(false)}
                     className="w-full h-16 bg-slate-900 text-white rounded-[24px] text-[11px] font-black uppercase tracking-[0.3em] shadow-xl shadow-slate-900/20 mt-4 active:scale-[0.98] transition-all"
                  >
                     Apply Filters
                  </button>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Table Content - Desktop Only */}
      <div className="hidden md:block overflow-x-auto rounded-[32px] border border-slate-100 shadow-sm bg-white">
        <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent pr-2 -mr-2">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="sticky top-0 z-10 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-white first:rounded-tl-2xl">SR.</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-white">Order ID & P ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-white">Reviewer & Mediator</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-white">Dates</th>
                {showRefundOnly && <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-white">Refund</th>}
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-white first:rounded-tl-2xl text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-white text-center last:rounded-tr-2xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedOrders.map((order, idx) => {
                const highlight = getRowHighlight(order.status);
                return (
                <tr key={order._id} className={`group transition-all duration-300 ${highlight.bg}`}>
                  <td className={`px-6 py-3.5 border-b border-slate-50 text-[11px] font-bold transition-all border-l-8 ${highlight.border} ${highlight.text}`}>
                    {idx + 1 + (currentPage - 1) * itemsPerPage}
                  </td>
                  <td className="px-6 py-3.5 border-b border-slate-50">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-black text-slate-900 tracking-tight leading-tight uppercase">
                        {order.userOrderId || order.aspireOrderId}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 block px-2 py-0.5 bg-slate-50 rounded-md w-fit">
                        {order.brandName || "DEAL"} - {order.productCode || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{order.reviewName || "UNASSIGNED"}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                           <span className="text-[8px] font-bold text-slate-400 uppercase">{order.mediator?.systemDisplayName || order.mediator?.name || "Pending..."}</span>
                           {order.assignmentType === 'AUTO' && (
                              <span className="text-[7px] font-black text-emerald-600 uppercase tracking-tighter px-1 py-0.5 bg-emerald-50 rounded border border-emerald-100 leading-none">System</span>
                           )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 border-b border-slate-50">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-slate-900 leading-none">Ord:</span>
                        <span className="text-[10px] font-medium text-slate-500 leading-none">{formatDate(order.createdAt)}</span>
                      </div>
                      {order.refundDetails?.submittedAt && order.status !== 'REFUND_FORM_PENDING' && (
                        <div className="flex items-center gap-1.5">
                           <span className="text-[9px] font-black text-indigo-600 leading-none uppercase">Ref:</span>
                           <span className="text-[9px] font-medium text-slate-500 leading-none">{formatDate(order.refundDetails.submittedAt)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        {getDueDays(order.createdAt, order.status) && (
                          <span className="text-[9px] font-black text-amber-600 uppercase tracking-tight">{getDueDays(order.createdAt, order.status)}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  {showRefundOnly && (
                    <td className="px-6 py-3.5 border-b border-slate-50">
                      <div className="flex flex-col">
                        {order.status === 'COMPLETED' ? (
                            <>
                              <span className="text-[10px] font-black text-slate-900 uppercase leading-none">Paid By: {order.paymentDetails?.paidByName || "System"}</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase mt-1">
                                  {order.updatedAt ? new Date(order.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + " " + new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                              </span>
                            </>
                        ) : (
                            <span className="text-[8px] font-black text-slate-200 uppercase tracking-widest">Pending...</span>
                        )}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-3.5 border-b border-slate-50 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className={`inline-block rounded-xl border px-3.5 py-2 text-[9px] font-black uppercase tracking-[0.15em] shadow-sm ${getStatusStyle(order.status)} ${order.status === 'REFUND_FORM_PENDING' ? 'animate-pulse' : ''}`}>
                        {order.status === 'REFUND_FORM_SUBMITTED' ? 'UNDER VERIFICATION' : order.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 border-b border-slate-50 text-center">
                    <div className="flex items-center justify-center gap-2.5">
                      <button onClick={() => onViewDetails(order._id)} className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-all">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      {(order.status === "REFUND_FORM_PENDING" || order.status === "PENDING_APPROVAL") && (
                        <button onClick={() => onRefund(order._id)} className="px-5 py-2.5 bg-blue-600 text-[10px] font-black text-white uppercase tracking-widest rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">Claim Refund</button>
                      )}
                      {(order.status === "REFUND_FORM_SUBMITTED" || order.status === "UNDER_VERIFICATION") && (
                        <button onClick={() => onRefund(order._id)} className="px-5 py-2.5 bg-indigo-600 text-[10px] font-black text-white uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all border border-indigo-400/20">Edit</button>
                      )}
                      {order.status === "REFUND_REJECTED" && (
                        <button 
                          onClick={() => setSelectedNote({ id: order._id, note: order.refundDetails?.rejectionNote })} 
                          className="px-5 py-2.5 bg-rose-600 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all border border-rose-400/20"
                        >
                          Reason & Edit
                        </button>
                      )}
                      {order.status === 'INVALIDATED' && (
                          <>
                             <button 
                                onClick={() => setSelectedNote({ id: order._id, note: order.refundDetails?.rejectionNote || "Invalidation reason not specified." })} 
                                className="h-8 w-8 rounded-xl bg-red-950 text-white flex items-center justify-center transition-all shadow-md hover:bg-black group/info"
                                title="Show Invalidation Reason"
                             >
                                <svg className="w-4.5 h-4.5 group-hover/info:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                             </button>
                             <button 
                                onClick={() => setPurgeConfirmId(order._id)}
                                className="h-8 w-8 rounded-xl bg-red-100 flex items-center justify-center text-red-600 hover:bg-red-200 transition-all border border-red-200"
                                title="Delete Permanently"
                             >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                             </button>
                          </>
                       )}
                {order.status === 'REFUND_FORM_PENDING' && (
                        <button 
                           onClick={() => setCancelData({ id: order._id })}
                           className="h-8 w-8 rounded-xl bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-all shadow-sm border border-red-100"
                        >
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List View - Only On Mobile */}
      <div className="md:hidden space-y-3">
        {paginatedOrders.map((order, idx) => {
          const highlight = getRowHighlight(order.status);
          return (
          <motion.div 
            key={order._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-[20px] p-4 shadow-sm border transition-all duration-300 relative overflow-hidden group ${highlight.bg.replace('hover:', '')} ${order.status === 'REFUND_REJECTED' ? 'border-rose-400 ring-1 ring-rose-100' : 'border-slate-100'}`}
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${highlight.border.replace('border-l-', 'bg-')}`} />
            {/* Status Header */}
            <div className="flex items-center justify-between mb-3">
               <div className="flex flex-col">
                  <span className="text-[11px] font-black text-slate-900 tracking-tight uppercase">
                    {order.userOrderId || order.aspireOrderId}
                  </span>
                  <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Order ID
                  </span>
               </div>
               <span className={`rounded-lg border px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] shadow-sm ${getStatusStyle(order.status)}`}>
                  {order.status === 'REFUND_FORM_SUBMITTED' ? 'UNDER VERIFICATION' : order.status.replace(/_/g, " ")}
               </span>
            </div>

            {/* Product & Brand */}
            <div className="bg-slate-50/50 rounded-xl p-3 mb-3 border border-slate-100/50">
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Brand & Product</span>
                  <span className="text-[12px] font-black text-slate-900 mt-1 uppercase leading-tight">
                    {order.brandName || "DEAL"} - {order.productCode || "N/A"}
                  </span>
               </div>
            </div>

            {/* People & Dates Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
               <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Reviewer</span>
                  <span className="text-[10px] font-black text-slate-800 uppercase truncate">{order.reviewName || "Guest"}</span>
               </div>
               <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Mediator</span>
                  <div className="flex items-center gap-1.5 overflow-hidden">
                      <span className="text-[10px] font-black text-slate-800 uppercase truncate">{order.mediator?.systemDisplayName || order.mediator?.name || "Pending..."}</span>
                      {order.assignmentType === 'AUTO' && (
                         <span className="text-[7px] font-black text-emerald-600 uppercase tracking-tighter px-1 py-0.5 bg-emerald-50 rounded border border-emerald-100 leading-none flex-shrink-0">System</span>
                      )}
                   </div>

               </div>
               <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Temporal Status</span>
                  <div className="space-y-1">
                     <div className="flex items-center gap-1">
                        <span className="text-[7px] font-black text-slate-400 uppercase">Ord:</span>
                        <span className="text-[9px] font-medium text-slate-600 uppercase tracking-tight">{formatDate(order.createdAt)}</span>
                     </div>
                     {order.refundDetails?.submittedAt && order.status !== 'REFUND_FORM_PENDING' && (
                        <div className="flex items-center gap-1">
                           <span className="text-[7px] font-black text-indigo-400 uppercase">Ref:</span>
                           <span className="text-[9px] font-medium text-slate-600 uppercase tracking-tight">{formatDate(order.refundDetails.submittedAt)}</span>
                        </div>
                     )}
                     {getDueDays(order.createdAt, order.status) && (
                        <span className="text-[9px] font-black text-amber-600 uppercase tracking-tight leading-none block pt-1">{getDueDays(order.createdAt, order.status)}</span>
                     )}
                  </div>
               </div>
               {showRefundOnly && order.status === 'COMPLETED' && (
                  <div className="flex flex-col gap-0.5 mt-2 col-span-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100/50">
                     <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1 leading-none">Settlement Cleared By</span>
                     <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-900 uppercase truncate">Paid By: {order.paymentDetails?.paidByName || "System"}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{order.updatedAt ? new Date(order.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''}</span>
                     </div>
                  </div>
                )}
             </div>

            {/* Action Bar */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
               <button 
                 onClick={() => onViewDetails(order._id)}
                 className="flex-1 h-10 bg-slate-100 rounded-xl flex items-center justify-center gap-1.5 text-[9px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200/50"
               >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  Details
               </button>
               {(order.status === "REFUND_FORM_PENDING" || order.status === "PENDING_APPROVAL") && (
                  <button 
                    onClick={() => onRefund(order._id)}
                    className="flex-[1.5] h-10 bg-blue-600 rounded-xl text-[9px] font-black text-white uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all border border-blue-400/20"
                  >
                     Claim Refund
                  </button>
               )}
               {(order.status === "REFUND_FORM_SUBMITTED" || order.status === "UNDER_VERIFICATION") && (
                  <button 
                    onClick={() => onRefund(order._id)}
                    className="flex-[1.5] h-10 bg-indigo-600 rounded-xl text-[9px] font-black text-white uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all border border-indigo-400/20"
                  >
                     Edit Form
                  </button>
               )}
               {order.status === "REFUND_REJECTED" && (
                  <button 
                    onClick={() => setSelectedNote({ id: order._id, note: order.refundDetails?.rejectionNote })} 
                    className="flex-[1.5] h-10 bg-rose-600 rounded-xl text-[9px] font-black text-white uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:bg-rose-700 transition-all border border-rose-400/20"
                  >
                     Reason & Edit
                  </button>
               )}
               {order.status === 'INVALIDATED' && (
                   <>
                      <button 
                         onClick={() => setSelectedNote({ id: order._id, note: order.refundDetails?.rejectionNote || "Invalidation reason not specified." })} 
                         className="h-10 w-10 bg-red-950 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-900/20"
                      >
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </button>
                      <button 
                         onClick={() => handlePurgeOrder(order._id)}
                         className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 border border-red-200 shadow-sm"
                      >
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                   </>
                )}
               {order.status === 'REFUND_FORM_PENDING' && (
                  <button 
                     onClick={() => setCancelData({ id: order._id })}
                     className="h-10 w-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-100 transition-all border border-red-100 shadow-sm"
                  >
                     <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               )}
            </div>
          </motion.div>
          );
        })}
        {/* Mobile Spacer for Fixed Pagination */}
        <div className="h-20 md:hidden" />
      </div>
        
      {filteredOrders.length === 0 && (
        <div className="py-20 text-center">
           <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">No History Records Found</p>
        </div>
      )}

      {/* Standard Desktop Pagination */}
      <div className="hidden md:flex flex-col md:flex-row items-center justify-center gap-6 mt-10">
        <div className="flex items-center gap-4 order-2 md:order-1">
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">
             SHOWING <span className="text-slate-900">{paginatedOrders.length}</span> OF <span className="text-slate-900">{filteredOrders.length}</span> RECORDS
           </p>
           <div className="flex items-center gap-2 pl-4 border-l border-slate-100">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Rows:</span>
              <div className="flex gap-1">
                 {[8, 15, 25, 50].map(size => (
                    <button 
                       key={size}
                       onClick={() => { setItemsPerPage(size); setCurrentPage(1); }}
                       className={`px-2 py-1 rounded-md text-[9px] font-black transition-all ${itemsPerPage === size ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-blue-600'}`}
                    >
                       {size}
                    </button>
                 ))}
              </div>
           </div>
        </div>
        
        <div className="flex items-center gap-2 order-1 md:order-2">
          {/* Backward Button */}
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`p-2.5 rounded-xl transition-all ${currentPage === 1 ? 'bg-slate-50 text-slate-200 cursor-not-allowed' : 'bg-white text-slate-400 hover:text-blue-600 hover:shadow-md border border-slate-100'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          {/* Page Numbers */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50/50 rounded-2xl border border-slate-100">
             {(() => {
                const rangeSize = 3;
                let start = Math.max(1, currentPage - 1);
                let end = Math.min(totalPages, start + rangeSize - 1);
                if (end - start + 1 < rangeSize) {
                   start = Math.max(1, end - rangeSize + 1);
                }
                return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
             })().map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all ${currentPage === page ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-400 hover:bg-white hover:text-blue-600"}`}
              >
                {page}
              </button>
             ))}
          </div>
          {/* Forward Button */}
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`p-2.5 rounded-xl transition-all ${currentPage === totalPages ? 'bg-slate-50 text-slate-200 cursor-not-allowed' : 'bg-white text-slate-400 hover:text-blue-600 hover:shadow-md border border-slate-100'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* Compact Fixed-Bottom Pagination for Mobile */}
      {totalPages >= 1 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t border-slate-100 flex flex-col items-center py-2 px-6 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] transition-opacity">
          {/* Status Indicator */}
          <div className="flex items-center gap-3 mb-2">
             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
               PAGE <span className="text-slate-900">{currentPage}</span> OF <span className="text-slate-900">{totalPages}</span>
             </p>
             <div className="h-1 w-1 rounded-full bg-slate-200" />
             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
               <span className="text-slate-900">{filteredOrders.length}</span> RECORDS
             </p>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2 bg-slate-900 rounded-full p-1 shadow-lg">
               <button 
                 onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                 disabled={currentPage === 1}
                 className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${currentPage === 1 ? 'text-slate-700' : 'text-white active:scale-95'}`}
               >
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
               </button>
               
               <div className="flex items-center gap-1">
                  {(() => {
                     const rangeSize = 3;
                     let start = Math.max(1, currentPage - 1);
                     let end = Math.min(totalPages, start + rangeSize - 1);
                     if (end - start + 1 < rangeSize) {
                        start = Math.max(1, end - rangeSize + 1);
                     }
                     return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
                  })().map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative min-w-[28px] h-7 rounded-full text-[9px] font-black transition-all duration-500 ${
                        currentPage === page ? "text-white" : "text-slate-500"
                      }`}
                    >
                      {currentPage === page && (
                        <motion.div 
                          layoutId="ordersMobilePagePill"
                          className="absolute inset-0 bg-blue-600 rounded-full z-0 shadow-md shadow-blue-600/30"
                        />
                      )}
                      <span className="relative z-10">{page < 10 ? `0${page}` : page}</span>
                    </button>
                  ))}
               </div>

               <button 
                 onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                 disabled={currentPage === totalPages}
                 className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${currentPage === totalPages ? 'text-slate-700' : 'text-white active:scale-95'}`}
               >
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
               </button>
            </div>
          )}
        </div>
      )}

      {/* Cancellation Modal */}
      <AnimatePresence>
        {cancelData && (
          <div className="fixed inset-0 z-[120] flex items-end md:items-center justify-center bg-slate-900/40 backdrop-blur-md p-0 md:p-6">
            <motion.div 
               initial={{ y: "100%" }}
               animate={{ y: 0 }}
               exit={{ y: "100%" }}
               className="w-full max-w-lg bg-white rounded-t-[40px] md:rounded-[40px] p-8 md:p-10 shadow-2xl relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 h-32 w-32 bg-red-500/10 blur-[60px] rounded-full -mr-16 -mt-16" />
               
               <div className="relative z-10 text-left">
                  <div className="flex items-center justify-between mb-8">
                     <div className="h-12 w-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-inner">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                     </div>
                     <button onClick={() => setCancelData(null)} className="h-10 w-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-100 transition-all">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Cancel This Order?</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Please provide a valid reason for withdrawal</p>

                  <div className="space-y-6">
                     <div className="bg-slate-50 border border-slate-100 rounded-[24px] p-5 focus-within:ring-2 focus-within:ring-red-100 transition-all">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Reason Description</label>
                        <textarea 
                           className="w-full bg-transparent border-none outline-none text-[13px] font-medium text-slate-600 min-h-[140px] resize-none placeholder:text-slate-300"
                           placeholder="Ex: I accidentally placed this order or I changed my mind about the product..."
                           value={cancelReason}
                           onChange={(e) => setCancelReason(e.target.value)}
                        />
                     </div>

                     <div className="flex flex-col gap-3">
                        <button 
                           onClick={handleCancelOrder}
                           disabled={isCancelling || !cancelReason.trim()}
                           className="w-full h-16 bg-red-600 text-white rounded-[20px] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-600/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                           {isCancelling ? "Processing..." : "Confirm Cancellation"}
                        </button>
                        <button 
                           onClick={() => setCancelData(null)}
                           className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors"
                        >
                           Go Back
                        </button>
                     </div>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rationalize Modal (Reason & Resubmit) */}
      <AnimatePresence>
        {selectedNote && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-[40px] p-10 md:p-12 shadow-2xl relative overflow-hidden text-left"
            >
               <div className="absolute top-0 right-0 h-32 w-32 bg-rose-500/10 blur-[60px] rounded-full -mr-16 -mt-16" />
               <div className="relative z-10">
                  <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6">
                     <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-slate-900 mb-2 uppercase">Claim Feedback</h3>
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-6">Rejection Repository</p>
                  
                  <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 mb-8 text-sm font-medium text-slate-600 italic leading-relaxed">
                     "{selectedNote.note || "No specific feedback provided by administrator."}"
                  </div>

                     <div className="flex flex-col gap-3">
                        <Link 
                           href={`/app/refunds/fill/${selectedNote.id}`}
                           className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-center text-[11px] uppercase tracking-widest shadow-2xl shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                           Resubmit Refund Form
                        </Link>
                        <button 
                           onClick={() => setSelectedNote(null)}
                           className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                        >
                           Close Portal
                        </button>
                     </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Purge Confirmation Modal */}
      <AnimatePresence>
        {purgeConfirmId && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-6">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 h-32 w-32 bg-red-500/10 blur-[60px] rounded-full -mr-16 -mt-16" />
               
               <div className="relative z-10 text-center">
                  <div className="h-20 w-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center shadow-inner mx-auto mb-8 border border-red-100">
                     <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-3">Permanent Deletion</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-10 leading-relaxed">
                    This will surgically remove this <span className="text-red-500 font-black">invalidated record</span> from the database forever. Are you absolutely certain?
                  </p>

                  <div className="flex flex-col gap-3">
                     <button 
                        onClick={() => handlePurgeOrder(purgeConfirmId)}
                        className="w-full h-16 bg-slate-900 text-white rounded-[20px] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/30 active:scale-95 transition-all"
                     >
                        YES, PURGE RECORD
                     </button>
                     <button 
                        onClick={() => setPurgeConfirmId(null)}
                        className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors"
                     >
                        NO, KEEP IT
                     </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
