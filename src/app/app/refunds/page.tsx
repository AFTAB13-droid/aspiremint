"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/Skeleton";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { BulkPaymentModal } from "@/components/admin/BulkPaymentModal";
import { CsvBulkVerificationModal } from "@/components/admin/CsvBulkVerificationModal";
import { RefundPayersModal } from "@/components/mediator/RefundPayersModal";
import { CsvBulkPaymentModal } from "@/components/mediator/CsvBulkPaymentModal";
import { FileSpreadsheet } from "lucide-react";

export default function RefundsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const role = (session?.user as any)?.role || "USER";
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");
  const [brandFilter, setBrandFilter] = useState("ALL BRANDS");
  const [filterDate, setFilterDate] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // Settlement & Payer States
  const [isBulkModalOpen, setBulkModalOpen] = useState(false);
  const [isPayersModalOpen, setPayersModalOpen] = useState(false);
  const [isCsvModalOpen, setCsvModalOpen] = useState(false);
  const [isCsvVerifyModalOpen, setCsvVerifyModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [payers, setPayers] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [allBrands, setAllBrands] = useState<string[]>([]);
  
  // Tab State for Admin
  const [activeTab, setActiveTab] = useState<"VERIFYING" | "APPROVED" | "REJECTED">("VERIFYING");

  // Rejection Modal State
  const [isRejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");
  const [rejectionTargetIds, setRejectionTargetIds] = useState<string[]>([]);

  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(window.innerWidth < 768 ? 4 : 8);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchPayers = async () => {
    try {
      const res = await fetch("/api/mediator/refund-payers");
      const json = await res.json();
      if (json.success) {
        const mediatorName = session?.user?.name || "ME (Mediator)";
        const mediatorPayer = { name: mediatorName, isSelf: true, _id: "mediator-self" };
        setPayers([mediatorPayer, ...json.data]);
      }
    } catch (err) { console.error("Failed to load payers"); }
  };

  const handleAddPayer = async (name: string, detail: string) => {
    const res = await fetch("/api/mediator/refund-payers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, detail }),
    });
    const json = await res.json();
    if (json.success) fetchPayers();
    else throw new Error(json.message);
  };

  const handleRemovePayer = async (id: string) => {
    const res = await fetch(`/api/mediator/refund-payers?id=${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) { fetchPayers(); toast.success("Payer removed"); }
    else toast.error(json.message);
  };

  const fetchRefunds = async () => {
    try {
      const [ordersRes, brandsRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/brands")
      ]);
      
      const ordersJson = await ordersRes.json();
      const brandsJson = await brandsRes.json();

      if (ordersJson.success) {
        let filtered = [];
        if (role === "ADMIN") {
          filtered = ordersJson.data.filter((o: any) => 
            [
              "UNDER_VERIFICATION", 
              "REFUND_APPROVED", 
              "REFUND_REJECTED", 
              "REFUND_FORM_SUBMITTED",
              "REFUND_FORM_PENDING",
              "INVALID"
            ].includes(o.status)
          );
        } else if (role === "MEDIATOR") {
          filtered = ordersJson.data.filter((o: any) => o.status === "REFUND_APPROVED");
        } else {
          filtered = ordersJson.data.filter((o: any) => ["COMPLETED", "REFUNDED"].includes(o.status));
        }
        setOrders(filtered);
      }

      if (brandsJson.success) {
        setAllBrands(["ALL BRANDS", ...brandsJson.data.map((b: any) => b.name)]);
      }
    } catch (err) { toast.error("Failed to fetch data"); } finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchRefunds(); 
    if (role === "MEDIATOR") fetchPayers();
  }, [role, session]);

  const handleBulkPay = async (transactionId: string, paidBy: string) => {
    setIsProcessing(true);
    const loadingId = toast.loading(`Processing settlement for ${selectedIds.length} orders...`);
    try {
      const res = await fetch("/api/orders/bulk-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: selectedIds, transactionId, paidBy }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message, { id: loadingId });
        setBulkModalOpen(false);
        setSelectedIds([]);
        fetchRefunds();
      } else { toast.error(json.message, { id: loadingId }); }
    } catch (err) { toast.error("Network error during processing", { id: loadingId }); }
    finally { setIsProcessing(false); }
  };

  const handleCsvBulkPay = async (payments: any[]) => {
    setIsProcessing(true);
    const loadingId = toast.loading(`Processing bulk CSV payments for ${payments.length} orders...`);
    try {
      const res = await fetch("/api/orders/bulk-pay-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payments }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message, { id: loadingId });
        setCsvModalOpen(false);
        fetchRefunds();
      } else {
        toast.error(json.message, { id: loadingId });
      }
    } catch (err) {
      toast.error("Network error during bulk CSV processing", { id: loadingId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePay = (id: string) => {
    setSelectedIds([id]);
    setBulkModalOpen(true);
  };

  const handleBulkStatus = async (action: "APPROVE" | "REJECT", note?: string, ids?: string[]) => {
    const targetIds = ids || selectedIds;
    if (targetIds.length === 0) return;

    let finalNote = note;
    if (action === "REJECT" && !note) {
      setRejectionTargetIds(targetIds);
      setRejectionNote("");
      setRejectModalOpen(true);
      return;
    }

    setIsProcessing(true);
    const loadingId = toast.loading(`Processing ${targetIds.length} orders...`);
    try {
      const res = await fetch("/api/orders/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: targetIds, action, note: finalNote }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message, { id: loadingId });
        if (!ids) setSelectedIds([]);
        fetchRefunds();
      } else { toast.error(json.message, { id: loadingId }); }
    } catch (err) { toast.error("Processing failed", { id: loadingId }); }
    finally { setIsProcessing(false); }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedOrders.map(o => o._id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleUserSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchQuery(searchInputValue.trim());
    setCurrentPage(1);
  };

  const handleResetSearch = () => {
    setSearchInputValue("");
    setSearchQuery("");
    setBrandFilter("ALL BRANDS");
    setFilterDate("");
    setCurrentPage(1);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order: any) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = q === "" || 
        order.userOrderId?.toLowerCase().includes(q) ||
        order.aspireOrderId?.toLowerCase().includes(q) ||
        order.brandName?.toLowerCase().includes(q) ||
        order.productCode?.toLowerCase().includes(q) ||
        order.reviewName?.toLowerCase().includes(q) ||
        order.paymentDetails?.paidByName?.toLowerCase().includes(q);
      
      const matchesBrand = brandFilter === "ALL BRANDS" || 
        (order.brandName && order.brandName.toLowerCase() === brandFilter.toLowerCase());
      const refundSubmittedDate = order.refundDetails?.submittedAt || order.updatedAt;
      const matchesDate = !filterDate || (refundSubmittedDate && new Date(refundSubmittedDate).toISOString().split('T')[0] === filterDate);
      
      let matchesTab = true;
      if (role === "ADMIN") {
        if (activeTab === "VERIFYING") {
          matchesTab = ["UNDER_VERIFICATION", "REFUND_FORM_SUBMITTED"].includes(order.status);
        } else if (activeTab === "APPROVED") {
          matchesTab = order.status === "REFUND_APPROVED";
        } else if (activeTab === "REJECTED") {
          matchesTab = order.status === "REFUND_REJECTED";
        }
      }

      return matchesSearch && matchesBrand && matchesDate && matchesTab;
    });
  }, [orders, searchQuery, brandFilter, filterDate, activeTab, role]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'REFUND_FORM_PENDING': return 'bg-amber-100/50 text-amber-700 border-amber-200';
      case 'UNDER_VERIFICATION': 
      case 'REFUND_FORM_SUBMITTED': return 'bg-blue-100/50 text-blue-700 border-blue-200';
      case 'REFUND_APPROVED': return 'bg-emerald-100/50 text-emerald-700 border-emerald-200';
      case 'REFUND_REJECTED': return 'bg-rose-100/60 text-rose-700 border-rose-300 shadow-rose-100/20';
      case 'REFUNDED': 
      case 'COMPLETED': return 'bg-emerald-100/50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'REFUND_FORM_PENDING': return 'Pending';
      case 'UNDER_VERIFICATION': return 'Verifying';
      case 'REFUND_FORM_SUBMITTED': return 'Review Submitted';
      case 'REFUND_APPROVED': return 'Approved';
      case 'REFUND_REJECTED': return 'Rejected';
      case 'REFUNDED': 
      case 'COMPLETED': return 'Settled';
      default: return status.replace(/_/g, " ");
    }
  };

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);


  return (
    <div className="mx-auto w-full pb-10 px-4 md:px-0">
      
      {/* Navigation Space Management */}
      <div className="pt-4 md:pt-0" />
      {role === "ADMIN" && (
        <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
           <div className="flex items-center gap-2 p-1.5 bg-white rounded-[24px] border border-slate-100 shadow-sm w-fit">
              {(["VERIFYING", "APPROVED", "REJECTED"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setSelectedIds([]); setCurrentPage(1); }}
                  className={`relative px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                    activeTab === tab ? "text-white" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {activeTab === tab && (
                    <motion.div layoutId="activeTab" className="absolute inset-0 bg-blue-600 rounded-full shadow-lg shadow-blue-600/20" />
                  )}
                  <span className="relative z-10">{tab.replace("_", " ")}</span>
                </button>
              ))}
           </div>
           
           <div className="flex-1 w-full md:w-auto flex flex-wrap items-center justify-center md:justify-end gap-2.5">
              {activeTab === "VERIFYING" && (
                <button
                  onClick={() => setCsvVerifyModalOpen(true)}
                  className="h-11 px-4 md:px-5 bg-slate-900 border border-slate-900 shadow-sm rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>CSV Bulk Verification</span>
                </button>
              )}

              <div className="flex flex-wrap items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md w-fit">
                 <div className="relative">
                    <input 
                       type="text" 
                       placeholder="Search..." 
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       className="pl-8 pr-3 py-2 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase placeholder:text-slate-300 focus:ring-1 focus:ring-blue-500 w-36 transition-all"
                    />
                    <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 </div>

                 <CustomDropdown 
                    options={allBrands}
                    value={brandFilter}
                    onChange={(val) => setBrandFilter(val)}
                    placeholder="Select Brand"
                    searchable={true}
                    className="w-36"
                 />

                 {(searchQuery || brandFilter !== "ALL BRANDS" || filterDate) && (
                    <button 
                     onClick={() => { setSearchQuery(""); setBrandFilter("ALL BRANDS"); setFilterDate(""); }}
                     className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    >
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                 )}
              </div>
           </div>
        </div>
      )}

       {role === "MEDIATOR" && (
         <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-100 p-4 md:p-2 rounded-2xl shadow-sm mb-8">
            <div className="flex items-center gap-3 pl-2 md:pl-4">
               <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Settlement Registry</span>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
               <button 
                 onClick={() => setPayersModalOpen(true)}
                 className="flex-1 md:flex-initial h-10 px-4 md:px-6 bg-white border border-slate-200 text-slate-700 shadow-sm rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
               >
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  Manage Payers
               </button>
               <button 
                 onClick={() => setCsvModalOpen(true)}
                 className="flex-1 md:flex-initial h-10 px-4 md:px-6 bg-slate-900 border border-slate-900 shadow-sm rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
               >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  CSV Bulk Payout
               </button>
            </div>
         </div>
      )}

      {role === "USER" && (
        <div className="w-full bg-white border border-slate-100 p-4 md:p-6 rounded-[28px] shadow-sm mb-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Title / Info */}
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h2 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-tight">
                  My Refund History
                </h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Search & track settled orders by Brand and Order ID
                </p>
              </div>
            </div>

            {/* Search Controls with Search Button (Web & Mobile) */}
            <form 
              onSubmit={handleUserSearch}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto"
            >
              {/* Search input with leading icon */}
              <div className="relative flex-1 sm:w-64 md:w-72">
                <input 
                  type="text" 
                  placeholder="Search by Brand or Order ID..." 
                  value={searchInputValue}
                  onChange={(e) => {
                    setSearchInputValue(e.target.value);
                    if (e.target.value === "") {
                      setSearchQuery("");
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleUserSearch();
                    }
                  }}
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold uppercase placeholder:text-slate-300 placeholder:normal-case placeholder:font-normal focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                />
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchInputValue && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setSearchInputValue("");
                      setSearchQuery("");
                      setCurrentPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Brand filter dropdown (Desktop / Tablet) */}
              <div className="hidden sm:block">
                <CustomDropdown 
                  options={allBrands}
                  value={brandFilter}
                  onChange={(val) => {
                    setBrandFilter(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Select Brand"
                  searchable={true}
                  className="w-40"
                />
              </div>

              {/* Search Button */}
              <button 
                type="submit"
                onClick={handleUserSearch}
                className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-md shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search</span>
              </button>

              {/* Reset Button */}
              {(searchQuery || brandFilter !== "ALL BRANDS" || searchInputValue) && (
                <button 
                  type="button"
                  onClick={handleResetSearch}
                  className="h-10 px-3.5 text-rose-500 hover:bg-rose-50 rounded-2xl border border-rose-100 transition-all text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shrink-0"
                  title="Clear Filters"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Reset</span>
                </button>
              )}
            </form>
          </div>

          {/* Quick Brand Filter Pills for Mobile */}
          {allBrands.length > 1 && (
            <div className="sm:hidden pt-2 border-t border-slate-50 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 shrink-0 mr-1">Brand:</span>
              {allBrands.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => {
                    setBrandFilter(brand);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider whitespace-nowrap transition-all shrink-0 ${
                    brandFilter === brand
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100"
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {selectedIds.length > 0 && role === "ADMIN" && activeTab === "VERIFYING" && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-8 py-5 rounded-[32px] shadow-2xl flex items-center gap-8 border border-slate-700/50 backdrop-blur-xl"
          >
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Manage Selected</span>
              <span className="text-xl font-black tracking-tighter">{selectedIds.length} ORDERS</span>
            </div>
            <div className="h-10 w-px bg-slate-700" />
            <div className="flex gap-3">
              <button 
                onClick={() => handleBulkStatus("REJECT")}
                className="px-6 py-3 bg-rose-500/10 hover:bg-rose-50 text-rose-500 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-rose-500/20"
              >
                Reject All
              </button>
              <button 
                onClick={() => handleBulkStatus("APPROVE")}
                className="px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                Approve All
              </button>
            </div>
            <button onClick={() => setSelectedIds([])} className="p-2 text-slate-500 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-3">
           <Skeleton className="h-16 w-full rounded-2xl" />
           <Skeleton className="h-16 w-full rounded-2xl" />
           <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-4">
          
          {/* Mobile View */}
          <div className="md:hidden space-y-4 px-2 pt-0">
            {paginatedOrders.map((order, idx) => {
               const amount = order.refundDetails?.expectedPayout ?? (order.dealType === "Empty Box" ? (order.amount + (order.lessAmount || 0)) : (order.amount - (order.lessAmount || 0)));
               return (
                <motion.div 
                   layout
                   key={order._id}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: idx * 0.05 }}
                   className="group bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden active:scale-[0.98] transition-all"
                >
                   {/* Top Info Header */}
                   <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                         <div className={`h-10 w-10 rounded-2xl flex-shrink-0 flex items-center justify-center text-xs font-black shadow-inner ${role === 'ADMIN' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                            {order.brandName?.charAt(0) || 'R'}
                         </div>
                         <div className="flex flex-col min-w-0">
                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest truncate">{order.brandName}</span>
                            <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase truncate">{order.userOrderId}</h3>
                         </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                         <span className={`px-2.5 py-0.5 border rounded-full text-[8px] font-black uppercase tracking-widest whitespace-nowrap ${getStatusColor(order.status)}`}>
                           {getStatusLabel(order.status)}
                         </span>
                         <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-tight" title="Refund Form Submitted Date">
                           {new Date(order.refundDetails?.submittedAt || order.updatedAt).toLocaleDateString()}
                         </span>
                      </div>
                   </div>

                   {/* Proofs Row for Admin */}
                   {role === 'ADMIN' && activeTab === 'VERIFYING' && (
                    <div className="flex items-center gap-3 mb-3 p-2 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-auto pl-1">Compliance Proofs</p>
                      {order.refundProof?.reviewScreenshot && (
                        <a href={order.refundProof.reviewScreenshot} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-2 bg-white rounded-xl border border-slate-100 hover:bg-slate-100 transition-all shadow-sm">
                          <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </a>
                      )}
                      {order.refundProof?.reviewLink && (
                        <a href={order.refundProof.reviewLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-2 bg-white rounded-xl border border-slate-100 hover:bg-slate-100 transition-all shadow-sm">
                          <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                      )}
                    </div>
                  )}

                   {/* Grid Data */}
                   <div className="grid grid-cols-2 gap-2.5 py-3 border-t border-b border-slate-100">
                      <div>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">Net Refund</p>
                         <div className="flex items-baseline gap-0.5">
                            <span className="text-base font-black text-slate-900 leading-none">₹{amount.toLocaleString()}</span>
                            <span className="text-[8px] font-bold text-emerald-500 uppercase leading-none">INR</span>
                         </div>
                      </div>
                      <div>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">
                            {role === 'MEDIATOR' ? 'Deal / Config' : 'Mediator'}
                         </p>
                         <p className="text-xs font-black text-slate-800 uppercase tracking-tight truncate leading-none">
                            {role === 'MEDIATOR' ? (
                               <span>{order.dealType} • {order.reviewType || 'Standard'}</span>
                            ) : (
                               order.mediator?.name || "Unassigned"
                            )}
                         </p>
                      </div>
                   </div>

                   {/* Footer Metadata & Action */}
                   <div className="pt-3 flex items-center justify-between gap-3">
                      <div className="flex flex-col min-w-0">
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Buyer ID</span>
                         <span className="text-xs font-black text-blue-600 lowercase tracking-tight truncate">@{order.reviewName || "N/A"}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {role === 'ADMIN' && activeTab === 'VERIFYING' ? (
                          <div className="flex items-center gap-1.5">
                             <button onClick={(e) => { e.stopPropagation(); handleBulkStatus("APPROVE", undefined, [order._id]); }} className="h-9 px-4 rounded-xl bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest shadow-md shadow-emerald-600/10 active:scale-95 transition-all">APPROVE</button>
                             <button onClick={(e) => { e.stopPropagation(); handleBulkStatus("REJECT", undefined, [order._id]); }} className="h-9 w-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
                          </div>
                        ) : order.status === 'REFUND_SETTLED' ? (
                           <div className="flex flex-col items-end">
                              <span className="text-[8px] font-black text-emerald-600 uppercase leading-none">Paid By</span>
                              <span className="text-[9px] font-black text-slate-900 uppercase truncate max-w-[80px] mt-0.5 leading-none">{order.paymentDetails?.paidByName || "Admin"}</span>
                           </div>
                        ) : role === 'MEDIATOR' && order.status === 'REFUND_APPROVED' ? (
                           <button onClick={(e) => { e.stopPropagation(); handlePay(order._id); }} className="h-9 px-4 rounded-xl bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest shadow-md shadow-emerald-600/10 active:scale-95 transition-all flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                              Pay
                           </button>
                        ) : (
                           <button onClick={() => router.push(`/app/orders/${order._id}`)} className="h-9 px-4 rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest shadow-md active:scale-95 transition-all">
                              Details
                           </button>
                        )}
                      </div>
                   </div>
                </motion.div>
               );
            })}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-50/50">
                  {role === "ADMIN" && activeTab === "VERIFYING" && (
                    <th className="px-6 py-5 w-10">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.length === paginatedOrders.length && paginatedOrders.length > 0} 
                        onChange={toggleSelectAll}
                        className="w-5 h-5 border-2 border-slate-200 rounded-lg text-blue-600 focus:ring-blue-600/20 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Entry</th>
                  {role === 'ADMIN' && activeTab === 'VERIFYING' ? (
                    <>
                      <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Refund Proof</th>
                      <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Review/Rating Link</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Config</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Buyer / Reviewer</th>
                    </>
                  )}
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mediator</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                    {role === 'ADMIN' ? (
                      activeTab === 'VERIFYING' ? 'Verification Actions' :
                      activeTab === 'APPROVED' ? 'Authorization Detail' : 'Rejection Detail'
                    ) : 'Action'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedOrders.map((order) => {
                  const amount = order.refundDetails?.expectedPayout ?? (order.dealType === "Empty Box" ? (order.amount + (order.lessAmount || 0)) : (order.amount - (order.lessAmount || 0)));
                  return (
                    <motion.tr key={order._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      onClick={() => router.push(`/app/orders/${order._id}`)}
                      className="group transition-all hover:bg-slate-50/50 cursor-pointer"
                    >
                      {role === "ADMIN" && activeTab === "VERIFYING" && (
                        <td className="px-6 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={selectedIds.includes(order._id)} 
                            onChange={() => toggleSelect(order._id)}
                            className="w-5 h-5 border-2 border-slate-200 rounded-lg text-blue-600 focus:ring-blue-600/20 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-8 py-5 border-l-4 border-l-transparent group-hover:border-l-blue-500 transition-all">
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tighter">{order.userOrderId}</p>
                        <p className="text-[9px] font-bold text-slate-300 uppercase mt-0.5 whitespace-nowrap">{order.brandName} • {order.dealType}</p>
                      </td>
                      
                      {role === 'ADMIN' && activeTab === 'VERIFYING' ? (
                        <>
                          <td className="px-4 py-5" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                               {order.refundProof?.reviewScreenshot ? (
                                  <a href={order.refundProof.reviewScreenshot} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 hover:border-blue-200 transition-all text-blue-600" title="Review Screenshot">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                  </a>
                               ) : <span className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center opacity-20 border border-slate-100"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg></span>}
                               
                               {order.refundProof?.returnPeriodScreenshot ? (
                                  <a href={order.refundProof.returnPeriodScreenshot} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 hover:border-emerald-200 transition-all text-emerald-600" title={(order.marketplace?.toLowerCase().includes("blinkit") || order.brandName?.toLowerCase().includes("blinkit")) ? "Invoice SS" : "Return Period SS"}>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  </a>
                               ) : <span className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center opacity-20 border border-slate-100"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg></span>}
                            </div>
                          </td>
                          <td className="px-4 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                            {order.refundProof?.reviewLink ? (
                               <a href={order.refundProof.reviewLink} target="_blank" rel="noopener noreferrer" className="inline-flex p-2 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all text-blue-600 group/link" title="Open Live Review Link">
                                  <svg className="w-4 h-4 group-hover/link:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                               </a>
                            ) : <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest italic">N/A</span>}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-1">
                               <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{order.brandName}</span>
                               <div className="flex items-center gap-2">
                                  <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest px-1.5 py-0.5 bg-blue-50 rounded border border-blue-100">{order.dealType}</span>
                                  <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest px-1.5 py-0.5 bg-indigo-50 rounded border border-indigo-100">{order.reviewType === 'SUBMITTED' ? 'REVIEW SUBMITTED' : order.reviewType}</span>
                               </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <p className="text-[11px] font-black text-slate-900 uppercase tracking-tighter line-clamp-1">{order.buyer?.name || "Anonymous"}</p>
                              <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mt-0.5 italic truncate w-32" title={order.reviewName}>
                                @{order.reviewName || "N/A"}
                              </p>
                            </div>
                          </td>
                        </>
                      )}
                      <td className="px-6 py-5">
                        <p className="text-lg font-black text-slate-900 tracking-tighter">₹{amount.toLocaleString()}</p>
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Gross Refund</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 group/mediator">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover/mediator:bg-blue-50 group-hover/mediator:text-blue-600 transition-colors">
                            {order.mediator?.name?.[0] || "?"}
                          </div>
                          <div className="flex flex-col">
                            <p className="text-[11px] font-black text-slate-900 uppercase tracking-tighter line-clamp-1">{order.mediator?.name || "Unassigned"}</p>
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest line-clamp-1 truncate w-24">#{order.mediator?.aspireMintId || "---"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {role === 'ADMIN' ? (
                            <div className="flex flex-col items-end gap-2">
                              {activeTab === 'VERIFYING' ? (
                                <div className="flex gap-2">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleBulkStatus("REJECT", undefined, [order._id]); }}
                                    className="p-2.5 bg-rose-50 text-rose-600 rounded-full hover:bg-rose-500 hover:text-white transition-all border border-rose-200/50 shadow-sm flex items-center justify-center w-10 h-10"
                                    title="Reject Claim"
                                  >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleBulkStatus("APPROVE", undefined, [order._id]); }}
                                    className="p-2.5 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-600 hover:text-white transition-all border border-emerald-200/50 shadow-sm flex items-center justify-center w-10 h-10"
                                    title="Approve Claim"
                                  >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                  </button>
                                </div>
                              ) : activeTab === 'APPROVED' ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-[10px] font-black text-emerald-600 uppercase italic flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Authorized by Admin
                                  </span>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                                    {order.updatedAt ? new Date(order.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'N/A'}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-end max-w-[200px]">
                                  <span className="text-[10px] font-black text-rose-600 uppercase italic line-clamp-1" title={order.refundDetails?.rejectionNote}>
                                    Reason: {order.refundDetails?.rejectionNote || "Not specified"}
                                  </span>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                                    {order.updatedAt ? new Date(order.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'N/A'}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : role === 'MEDIATOR' && order.status === 'REFUND_APPROVED' ? (
                            <>
                              <button 
                                onClick={(e) => { e.stopPropagation(); router.push(`/app/orders/${order._id}`); }}
                                className="h-10 w-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all border border-slate-200/30"
                                title="View Order Details"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handlePay(order._id); }}
                                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                Pay
                              </button>
                            </>
                          ) : (
                            <div className="flex flex-col items-end">
                              <span className="text-[11px] font-black text-emerald-600 uppercase tracking-tighter italic">Paid By {order.paymentDetails?.paidByName || "System"}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                                {order.updatedAt ? new Date(order.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + " • " + new Date(order.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Pagination Component */}
          <>
             {/* Mobile Pagination Footer */}
             {totalPages > 1 && (
               <div className="flex flex-col items-center justify-between gap-8 mt-12 mb-10 px-4 md:hidden">
                  <div className="flex items-center gap-4 bg-white/50 backdrop-blur-md px-6 py-3 rounded-full border border-slate-100 shadow-sm order-2">
                     <button 
                        onClick={() => setCurrentPage(1)} 
                        disabled={currentPage === 1}
                        className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition-colors"
                     >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                     </button>
                     <div className="h-4 w-px bg-slate-200" />
                     <div className="flex items-center gap-2">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                           let pageNum;
                           if (totalPages <= 5) pageNum = i + 1;
                           else if (currentPage <= 3) pageNum = i + 1;
                           else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                           else pageNum = currentPage - 2 + i;

                           return (
                              <button
                                 key={pageNum}
                                 onClick={() => setCurrentPage(pageNum)}
                                 className={`h-10 w-10 rounded-xl text-[11px] font-black transition-all ${currentPage === pageNum ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "text-slate-400 hover:bg-white hover:text-indigo-600"}`}
                              >
                                 {pageNum}
                              </button>
                           );
                        })}
                     </div>
                     <div className="h-4 w-px bg-slate-200" />
                     <button 
                        onClick={() => setCurrentPage(totalPages)} 
                        disabled={currentPage === totalPages}
                        className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition-colors"
                     >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" strokeWidth={3} /></svg>
                     </button>
                  </div>
                  
                  <div className="flex items-center gap-4 group order-1">
                     <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Hub Navigation</span>
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">Page {currentPage} of {totalPages}</span>
                     </div>
                     <div className="flex items-center gap-1">
                        <button 
                           onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                           disabled={currentPage === 1}
                           className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-400 transition-all shadow-sm"
                        >
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button 
                           onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                           disabled={currentPage === totalPages}
                           className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-400 transition-all shadow-sm"
                        >
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                        </button>
                     </div>
                  </div>
               </div>
             )}

               {/* Desktop Pagination Footer */}
               <div className="hidden md:flex flex-col md:flex-row items-center justify-between gap-6 px-4 mt-6 mb-10">
                 <div className="flex items-center gap-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      SHOWING <span className="text-indigo-600">{paginatedOrders.length}</span> OF <span className="text-slate-900">{filteredOrders.length}</span> CLAIMS
                    </p>
                    
                    <div className="flex items-center gap-2 pl-4 border-l border-slate-100">
                       <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Rows:</span>
                       <div className="flex gap-1">
                          {[8, 15, 25, 50].map(size => (
                             <button 
                                key={size}
                                onClick={() => { setItemsPerPage(size); setCurrentPage(1); }}
                                className={`px-2 py-1 rounded-md text-[9px] font-black transition-all ${itemsPerPage === size ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-indigo-600/60'}`}
                             >
                                {size}
                             </button>
                          ))}
                       </div>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-2">
                   <button 
                     onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                     disabled={currentPage === 1}
                     className={`p-2.5 rounded-xl transition-all ${currentPage === 1 ? 'bg-slate-50 text-slate-200 cursor-not-allowed border border-slate-100' : 'bg-white text-indigo-400 hover:text-indigo-600 hover:shadow-md border border-slate-200'}`}
                   >
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                   </button>

                   <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50/20 rounded-2xl border border-indigo-100/50">
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
                         className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all ${currentPage === page ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-400 hover:bg-white hover:text-indigo-600"}`}
                       >
                         {page}
                       </button>
                      ))}
                   </div>

                   <button 
                     onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                     disabled={currentPage === totalPages}
                     className={`p-2.5 rounded-xl transition-all ${currentPage === totalPages ? 'bg-slate-50 text-slate-200 cursor-not-allowed border border-slate-100' : 'bg-white text-indigo-400 hover:text-indigo-600 hover:shadow-md border border-slate-200'}`}
                   >
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                   </button>
                 </div>
               </div>
          </>
        </div>
      ) : (
        <div className="mt-8 p-16 rounded-[32px] border border-dashed border-slate-100 bg-white flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-loose">No Verification History Found<br/>Refining your search filters might help.</p>
          {(searchQuery || brandFilter !== "ALL BRANDS" || searchInputValue) && (
            <button
              onClick={handleResetSearch}
              className="mt-4 px-5 py-2.5 bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
            >
              Clear Search & Show All Refunds
            </button>
          )}
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>

      <BulkPaymentModal 
        isOpen={isBulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        count={selectedIds.length}
        totalAmount={orders.find(o => o._id === selectedIds[0])?.refundDetails?.expectedPayout || 0}
        onConfirm={handleBulkPay}
        loading={isProcessing}
        payers={payers}
      />

      {/* REJECTION MODAL */}
      <AnimatePresence>
        {isRejectModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setRejectModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] p-8 shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-rose-500" />
              <div className="mb-8">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Rejection Reason</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Processing {rejectionTargetIds.length} Order Claims</p>
              </div>

              <textarea 
                autoFocus
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="TYPE THE REASON FOR REJECTION HERE..."
                className="w-full h-40 rounded-3xl bg-slate-50 border-none px-6 py-5 text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:ring-4 focus:ring-rose-500/10 focus:bg-white transition-all outline-none resize-none"
              />

              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <button 
                  onClick={() => setRejectModalOpen(false)}
                  className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Discard
                </button>
                <button 
                  onClick={() => {
                    if (!rejectionNote.trim()) return toast.error("Please provide a reason");
                    setRejectModalOpen(false);
                    handleBulkStatus("REJECT", rejectionNote, rejectionTargetIds);
                  }}
                  className="flex-[2] py-4 bg-rose-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-rose-500/20 hover:bg-rose-600 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Confirm Rejection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Fixed-Bottom Pagination for Mobile */}
      {totalPages >= 1 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-md border-t border-slate-100 flex flex-col items-center py-2 px-6 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
           {/* Status Indicator */}
           <div className="flex items-center gap-3 mb-2">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                PAGE <span className="text-slate-900">{currentPage}</span> OF <span className="text-slate-900">{totalPages}</span>
              </p>
              <div className="h-1 w-1 rounded-full bg-slate-200" />
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                <span className="text-slate-900">{filteredOrders.length}</span> ENTRIES
              </p>
           </div>

           {totalPages >= 1 && (
              <div className="flex items-center gap-1 bg-slate-900 rounded-full p-1 shadow-xl">
                 <button 
                   onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                   disabled={currentPage === 1}
                   className={`h-9 w-9 rounded-full flex items-center justify-center transition-all ${currentPage === 1 ? 'text-slate-700' : 'text-white active:scale-95'}`}
                 >
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                 </button>
                 
                 <div className="flex items-center gap-1 px-1">
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
                         className={`relative min-w-[32px] h-8 rounded-full text-[9px] font-black transition-all duration-500 ${
                           currentPage === page ? "text-white" : "text-slate-500"
                         }`}
                       >
                         {currentPage === page && (
                           <motion.div 
                             layoutId="fixedBottomRefundPill"
                             className="absolute inset-0 bg-blue-600 rounded-full z-0 shadow-lg shadow-blue-600/40"
                           />
                         )}
                         <span className="relative z-10">{page < 10 ? `0${page}` : page}</span>
                       </button>
                     ))}
                  </div>

                 <button 
                   onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                   disabled={currentPage === totalPages}
                   className={`h-9 w-9 rounded-full flex items-center justify-center transition-all ${currentPage === totalPages ? 'text-slate-700' : 'text-white active:scale-95'}`}
                 >
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                 </button>
              </div>
           )}
        </div>
      )}

      <RefundPayersModal 
        isOpen={isPayersModalOpen}
        onClose={() => setPayersModalOpen(false)}
        payers={payers}
        onAdd={handleAddPayer}
        onRemove={handleRemovePayer}
      />

      <CsvBulkPaymentModal
        isOpen={isCsvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        orders={orders.filter(o => o.status === "REFUND_APPROVED")}
        payers={payers}
        onConfirm={handleCsvBulkPay}
        loading={isProcessing}
      />

      {isCsvVerifyModalOpen && (
        <CsvBulkVerificationModal
          isOpen={isCsvVerifyModalOpen}
          onClose={() => setCsvVerifyModalOpen(false)}
          orders={orders}
          brands={allBrands}
          onSuccess={fetchRefunds}
        />
      )}
    </div>
  );
}
