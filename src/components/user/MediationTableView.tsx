"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CustomDropdown } from "../ui/CustomDropdown";

interface MediationTableViewProps {
  orders: any[];
  onViewDetails: (id: string | any) => void;
  onPay?: (id: string) => void;
  onUpdateAmount?: (id: string, newAmount: number) => Promise<void>;
}

import { EditAmountModal } from "../common/EditAmountModal";
import toast from "react-hot-toast";

export function MediationTableView({ 
  orders, 
  onViewDetails,
  onPay,
  onUpdateAmount
}: MediationTableViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [reasonOrderId, setReasonOrderId] = useState<string | null>(null);
  
  // Edit Amount States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<any>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [itemsPerPage, setItemsPerPage] = useState(isMobile ? 3 : 8);

  useEffect(() => {
    setItemsPerPage(isMobile ? 4 : 8);
  }, [isMobile]);
  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("All Brands");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [sortBy, setSortBy] = useState("Most Recent");

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getDueDays = (createdAt: string) => {
    return null; // Function preserved but logic removed to avoid breaking types if used elsewhere, although we will remove calls.
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    }) + " " + date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
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
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'REFUNDED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'DISPUTE_RAISED': return 'bg-rose-100/50 text-rose-700 border-rose-200';
      case 'CANCELLED': return 'bg-rose-100/60 text-rose-700 border-rose-300 shadow-rose-100/20';
      case 'REJECTED': return 'bg-rose-100/50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };
 
  const getRowHighlight = (status: string) => {
    switch (status) {
      case 'REFUND_REJECTED': 
      case 'CANCELLED': return { bg: 'bg-rose-100/30', border: 'border-l-rose-500', text: 'text-rose-600' };
      case 'UNDER_VERIFICATION': 
      case 'REFUND_FORM_SUBMITTED': return { bg: 'bg-blue-50/70', border: 'border-l-blue-500', text: 'text-blue-600' };
      case 'REFUND_APPROVED': return { bg: 'bg-emerald-100/30 hover:bg-emerald-100/50', border: 'border-l-emerald-500', text: 'text-emerald-700' };
      case 'REFUNDED': 
      case 'APPROVED': 
      case 'COMPLETED': return { bg: 'bg-emerald-50/20 hover:bg-emerald-50/40', border: 'border-l-emerald-400', text: 'text-emerald-600' };
      case 'REFUND_FORM_PENDING': 
      case 'PENDING_APPROVAL': return { bg: 'bg-amber-50/70', border: 'border-l-amber-500', text: 'text-amber-600' };
      default: return { bg: 'hover:bg-slate-50/50', border: 'border-l-transparent', text: 'text-slate-400' };
    }
  };

  const filteredOrders = useMemo(() => {
    let result = orders.filter(order => {
      const matchesSearch = 
        (order.aspireOrderId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.userOrderId || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBrand = brandFilter === "All Brands" || order.brandName === brandFilter;
      const matchesStatus = statusFilter === "All" || order.status === statusFilter;
      
      let matchesDate = true;
      if (dateFilter) {
         const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
         matchesDate = orderDate === dateFilter;
      }

      return matchesSearch && matchesBrand && matchesDate && matchesStatus;
    });

    if (sortBy === "Most Recent") {
       result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "Oldest") {
       result = [...result].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    return result;
  }, [orders, searchQuery, brandFilter, dateFilter, sortBy, statusFilter]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const uniqueBrands = useMemo(() => {
    const brands = orders.map(o => o.brandName).filter(Boolean);
    return ["All Brands", ...Array.from(new Set(brands))];
  }, [orders]);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Desktop Filter Bar */}
      <div className="hidden md:flex bg-white rounded-[32px] p-5 shadow-sm border border-slate-100 flex-col gap-4">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Assigned Mediations</h2>
           </div>
        </div>

        <div className="grid grid-cols-6 gap-3 items-center">
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
            <CustomDropdown options={uniqueBrands} value={brandFilter} onChange={setBrandFilter} placeholder="All Brands" />
            <CustomDropdown options={["All", "REFUND_APPROVED", "UNDER_VERIFICATION", "COMPLETED"]} value={statusFilter} onChange={setStatusFilter} placeholder="Status" />
            <div className="relative col-span-1">
               <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-[10px] font-bold uppercase tracking-widest outline-none focus:bg-white focus:shadow-md transition-all custom-date-input" />
               <svg className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <CustomDropdown options={["Most Recent", "Oldest"]} value={sortBy} onChange={setSortBy} placeholder="Sort By" />
            <button 
              onClick={() => { setBrandFilter("All Brands"); setStatusFilter("All"); setDateFilter(""); }}
              className="h-12 text-[9px] font-black uppercase text-slate-400 hover:text-red-500 transition-colors"
            >
              Reset
            </button>
        </div>
      </div>

      {/* Table Content - Desktop */}
      <div className="hidden md:block overflow-x-auto rounded-[32px] border border-slate-100 shadow-sm bg-white overflow-hidden">
        <div className="max-h-[700px] overflow-y-auto pr-2 -mr-2 custom-scrollbar">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="sticky top-0 z-10 bg-white/90 backdrop-blur-md">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center w-20">SR.</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Order & Product</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Reviewer & Buyer</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Creation & Action</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedOrders.map((order, idx) => {
                const highlight = getRowHighlight(order.status);
                
                return (
                <tr key={order._id} className={`group transition-all duration-300 ${highlight.bg}`}>
                  <td className={`px-6 py-4 border-b border-slate-50 text-[11px] font-black text-center border-l-8 ${highlight.border} ${highlight.text}`}>
                    {idx + 1 + (currentPage - 1) * itemsPerPage}
                  </td>
                  <td className="px-6 py-4 border-b border-slate-50">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-black text-slate-900 tracking-tight leading-tight uppercase">
                        {order.userOrderId || order.aspireOrderId}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 block px-2.5 py-0.5 bg-slate-50/50 rounded-md w-fit border border-slate-100/50">
                        {order.brandName || "DEAL"} - {order.productCode || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-b border-slate-50">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight line-clamp-1">{order.reviewName || "GUEST"}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-1.5 py-0.5 rounded w-fit">{order.buyer?.name || "Member"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-b border-slate-50">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ORD:</span>
                        <span className="text-[10px] font-bold text-slate-900">{formatDate(order.createdAt)}</span>
                      </div>
                      {order.status === 'REFUND_APPROVED' && order.refundDetails?.authorizedAt && (
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">APP:</span>
                           <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tight bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                             {formatDateTime(order.refundDetails.authorizedAt)}
                           </span>
                        </div>
                      )}
                      {order.status === 'REFUND_REJECTED' && order.refundDetails?.rejectedAt && (
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">REJ:</span>
                           <span className="text-[9px] font-black text-rose-600 uppercase tracking-tight bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                             {formatDateTime(order.refundDetails.rejectedAt)}
                           </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 border-b border-slate-50 text-center">
                    <span className={`inline-block rounded-xl border px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] shadow-sm transition-all ${getStatusStyle(order.status)}`}>
                        {order.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-b border-slate-50 text-center">
                    <div className="flex items-center justify-center gap-2.5">
                      <button 
                        onClick={() => onViewDetails(order._id)} 
                        className="h-10 w-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all border border-slate-200/30"
                        title="View Order Details"
                      >
                         <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      {order.status === 'REFUND_APPROVED' && onPay ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onPay(order._id); }}
                          className="px-6 py-2.5 bg-emerald-600 text-[10px] font-black text-white uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                        >
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                           Pay
                        </button>
                      ) : order.status !== 'COMPLETED' ? (
                        <button 
                          onClick={(e) => {
                             e.stopPropagation();
                             setSelectedOrderForEdit(order);
                             setIsEditModalOpen(true);
                          }} 
                          className="px-5 py-2.5 bg-blue-600 text-[10px] font-black text-white uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            Edit Amount
                        </button>
                      ) : (
                        <button 
                          onClick={() => onViewDetails(order._id)} 
                          className="px-5 py-2.5 bg-slate-900 text-[10px] font-black text-white uppercase tracking-widest rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2 shadow-md"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            Mediate
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

      <EditAmountModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentAmount={selectedOrderForEdit?.lessAmount || 0}
        baseAmount={selectedOrderForEdit?.amount || 0}
        orderId={selectedOrderForEdit?.aspireOrderId || ""}
        onConfirm={async (newLess) => {
          if (onUpdateAmount && selectedOrderForEdit) {
            await onUpdateAmount(selectedOrderForEdit._id, newLess);
          }
        }}
      />

      {/* Mobile Card List View */}
      <div className="md:hidden space-y-4">
          {paginatedOrders.map((order, idx) => {
            const highlight = getRowHighlight(order.status);
            
            return (
          <motion.div 
            key={order._id}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => onViewDetails(order._id)}
            className="bg-white rounded-[32px] border border-slate-100 p-6 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group active:bg-slate-50 transition-colors"
          >
            {/* Status Stripe */}
            <div className={`absolute left-0 top-0 bottom-0 w-2 ${highlight.border.replace('border-l-', 'bg-')}`} />
            
            <div className="flex items-start justify-between mb-6 relative z-10 pl-2">
               <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">{order.brandName || "ASPIREMINT DEAL"}</span>
                  <h3 className="text-[26px] font-black text-slate-900 tracking-tighter uppercase leading-[0.9]">
                    {order.userOrderId || order.aspireOrderId}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">Order Pointer</p>
               </div>
               <div className={`px-3.5 py-1.5 rounded-full border text-[8px] font-black uppercase tracking-[0.1em] shadow-sm whitespace-nowrap ${getStatusStyle(order.status)}`}>
                  {order.status.replace(/_/g, " ")}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 relative z-10 pl-2">
               <div className="flex flex-col gap-2 p-4 bg-[#f8fafc]/50 rounded-[24px] border border-slate-100/60">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Refund Amount</span>
                  <span className="text-[22px] font-black text-slate-900 tracking-tight leading-none uppercase mt-0.5">₹{(order.refundDetails?.expectedPayout || (order.amount - (order.lessAmount || 0))).toLocaleString()}</span>
               </div>
               <div className="flex flex-col gap-2 p-4 bg-[#f8fafc]/50 rounded-[24px] border border-slate-100/60 transition-all group-active:bg-white">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reviewer & Buyer</span>
                  <div className="mt-1 flex flex-col gap-0.5">
                     <span className="text-[13px] font-black text-slate-800 uppercase leading-none truncate">{order.reviewName || "UNASSIGNED"}</span>
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">{order.buyer?.name || "Member"}</span>
                  </div>
               </div>
            </div>

            <div className="flex justify-between items-center mb-6 relative z-10 pl-2">
               <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Registered</span>
                  <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{formatDate(order.createdAt)}</span>
               </div>
               <div className="flex flex-col gap-1 text-right">
                  {order.status === 'REFUND_APPROVED' && order.refundDetails?.authorizedAt ? (
                    <>
                       <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Approved At</span>
                       <span className="text-[11px] font-black text-emerald-600 uppercase tracking-tight">{formatDateTime(order.refundDetails.authorizedAt)}</span>
                    </>
                  ) : order.status === 'REFUND_REJECTED' && order.refundDetails?.rejectedAt ? (
                    <>
                       <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Rejected At</span>
                       <span className="text-[11px] font-black text-rose-600 uppercase tracking-tight">{formatDateTime(order.refundDetails.rejectedAt)}</span>
                    </>
                  ) : (
                    <>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status Update</span>
                       <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight">{formatDate(order.updatedAt)}</span>
                    </>
                  )}
               </div>
            </div>

            <div className="flex items-center gap-3 relative z-10 pl-2">
               {order.status !== 'COMPLETED' ? (
                 <button 
                   onClick={(e) => { 
                      e.stopPropagation(); 
                      setSelectedOrderForEdit(order);
                      setIsEditModalOpen(true);
                   }}
                   className="flex-1 h-14 bg-blue-600 rounded-[22px] flex items-center justify-center gap-2 text-[11px] font-black text-white uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
                 >
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    Edit Amount
                 </button>
               ) : (
                 <button 
                   onClick={(e) => { e.stopPropagation(); onViewDetails(order._id); }}
                   className="flex-1 h-14 bg-[#111827] rounded-[22px] flex items-center justify-center gap-2 text-[11px] font-black text-white uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
                 >
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    Mediate
                 </button>
               )}
               {order.status === 'REFUND_APPROVED' && onPay && (
                 <button 
                   onClick={(e) => { e.stopPropagation(); onPay(order._id); }}
                   className="flex-1 h-14 bg-[#059669] rounded-[22px] flex items-center justify-center gap-2 text-[11px] font-black text-white uppercase tracking-widest shadow-xl shadow-emerald-600/20 active:scale-95 transition-all"
                 >
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    Pay
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
        <div className="py-24 text-center">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">No statistical records found</p>
        </div>
      )}

      {/* Standard Desktop Pagination */}
      <div className="hidden md:flex flex-col md:flex-row items-center justify-center gap-6 mt-8 pb-10">
        <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm order-2 md:order-1">
           <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Rows per page:</span>
           <div className="flex gap-2">
              {[8, 15, 25, 50].map(size => (
                 <button 
                    key={size}
                    onClick={() => { setItemsPerPage(size); setCurrentPage(1); }}
                    className={`w-7 h-7 rounded-lg text-[9px] font-black transition-all ${itemsPerPage === size ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-indigo-600'}`}
                 >
                    {size}
                 </button>
              ))}
           </div>
        </div>

        <div className="flex items-center gap-4 order-1 md:order-2">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 disabled:opacity-30"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50/50 rounded-2xl border border-slate-100">
             {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
               <button 
                key={p} 
                onClick={() => setCurrentPage(p)}
                className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${currentPage === p ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-white'}`}
               >
                 {p}
               </button>
             ))}
          </div>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 disabled:opacity-30"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* Premium Compact Fixed-Bottom Pagination for Mobile */}
      {totalPages >= 1 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t border-slate-100 flex flex-col items-center py-2 px-6 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] selection:bg-transparent">
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative min-w-[28px] h-7 rounded-full text-[9px] font-black transition-all duration-500 ${
                        currentPage === page ? "text-white" : "text-slate-500"
                      }`}
                    >
                      {currentPage === page && (
                        <motion.div 
                          layoutId="mediationsMobilePagePill"
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
    </div>
  );
}
