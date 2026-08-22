"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CustomDropdown } from "../ui/CustomDropdown";
import formatDate from "@/utils/formatDate";
import toast from "react-hot-toast";
import { IMarketplace } from "@/modules/brand/marketplace.model";
import { ExternalLink, Image as ImageIcon, Link as LinkIcon, Package, ShieldCheck, Users, Bell, FileText } from "lucide-react";

interface AdminTableViewProps {
  orders: any[];
  onViewDetails: (id: string) => void;
  activeTab?: string;
}

export function AdminTableView({ orders, onViewDetails, activeTab }: AdminTableViewProps) {
  const maskName = (name: string) => {
    if (!name) return "N/A";
    const parts = name.split(" ");
    return parts.map(p => p.length > 2 ? `${p[0]}***${p.slice(-1)}` : `${p[0]}*`).join(" ");
  };
  const router = useRouter();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "USER";
  const isAdm = role === "ADMIN";
  const isSubAdm = role === "SUBADMIN";
  const hasManagementAccess = isAdm || isSubAdm;

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("All Brands");
  const [platformFilter, setPlatformFilter] = useState("All Platforms");
  const [marketplaces, setMarketplaces] = useState<IMarketplace[]>([]);
  const [dateFilter, setDateFilter] = useState("");
  const [sortBy, setSortBy] = useState("Most Recent");
  
  // States for Modals and Actions
  const [mediators, setMediators] = useState<any[]>([]);
  const [reassignOrderId, setReassignOrderId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [reasonOrderId, setReasonOrderId] = useState<string | null>(null);
  const [pruneConfirmId, setPruneConfirmId] = useState<string | null>(null);
  const [actionConfirmOrderId, setActionConfirmOrderId] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");

  // Bulk Action State
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBulkActionModalOpen, setIsBulkActionModalOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<"APPROVE" | "REJECT" | "INVALIDATE" | null>(null);

  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFilters, setExportFilters] = useState({
    startDate: "",
    endDate: "",
    status: "All Statuses",
    brand: "All Brands",
    dealType: "All Types",
    reviewType: "All Types"
  });

  // Internal Notes State
  const [noteOrderId, setNoteOrderId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");

  // Image Viewer State
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState("");

  // Helper Functions
  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o._id));
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    );
  };

  const hasUnreadNotes = (order: any) => {
    if (!order.internalNotes || order.internalNotes.length === 0) return false;
    const lastViewed = order.lastViewedNotes?.find((v: any) => v.userId === session?.user?.id);
    if (!lastViewed) return true;
    const lastNoteTime = new Date(order.internalNotes[order.internalNotes.length - 1].createdAt).getTime();
    return lastNoteTime > new Date(lastViewed.viewedAt).getTime();
  };

  // API Handlers
  const handleAddNote = async () => {
    if (!newNote.trim() || !noteOrderId) return;
    try {
      setIsUpdating(true);
      const res = await fetch(`/api/orders/${noteOrderId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Note logged successfully");
        setNewNote("");
        router.refresh();
      }
    } catch (err) {
      toast.error("Failed to add note");
    } finally {
      setIsUpdating(false);
    }
  };

  const markNotesAsRead = async (orderId: string) => {
    try {
      await fetch(`/api/orders/${orderId}/notes`, { method: "PATCH" });
      router.refresh();
    } catch (err) {
      console.error("Failed to mark notes as read", err);
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkActionType || selectedOrderIds.length === 0) return;
    if ((bulkActionType === "REJECT" || bulkActionType === "INVALIDATE") && !rejectionNote) {
      return toast.error(`Please provide a reason for bulk ${bulkActionType.toLowerCase()}ion`);
    }
    const loadingId = toast.loading(`Processing ${selectedOrderIds.length} orders...`);
    try {
      setIsUpdating(true);
      const res = await fetch("/api/orders/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: selectedOrderIds, action: bulkActionType, note: rejectionNote }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message, { id: loadingId });
        window.location.reload();
      } else { throw new Error(json.message); }
    } catch (err: any) {
      toast.error(err.message || "Bulk Update Failed", { id: loadingId });
    } finally {
      setIsUpdating(false);
      setIsBulkActionModalOpen(false);
      setBulkActionType(null);
      setRejectionNote("");
      setSelectedOrderIds([]);
    }
  };

  const handleExportCSV = (filters?: typeof exportFilters) => {
    let dataToExport = filteredOrders;
    if (filters) {
      dataToExport = orders.filter(o => {
        const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
        const dateMatch = (!filters.startDate || orderDate >= filters.startDate) && 
                         (!filters.endDate || orderDate <= filters.endDate);
        const statusMatch = filters.status === "All Statuses" || o.status === filters.status;
        const brandMatch = filters.brand === "All Brands" || o.brandName === filters.brand;
        const dealMatch = filters.dealType === "All Types" || o.dealType === filters.dealType;
        const reviewMatch = filters.reviewType === "All Types" || o.reviewType === filters.reviewType;
        return dateMatch && statusMatch && brandMatch && dealMatch && reviewMatch;
      });
    }
    if (dataToExport.length === 0) return toast.error("No records found for the selected criteria");
    const headers = ["Order ID", "Buyer Name", "Mediator Name", "Brand", "Product Code", "Amount", "Refund Amount", "Review Type", "Deal Type", "Status", "Order Photo", "Review Photo", "Return Period Photo", "Delivery Photo", "Date"];
    const csvContent = [headers.join(","), ...dataToExport.map(o => [o.aspireOrderId, `"${o.buyer?.name || 'Anonymous'}"`, `"${o.mediator?.systemDisplayName || o.mediatorName || o.mediator?.name || 'Standard'}"`, `"${o.brandName || 'N/A'}"`, o.productCode || "N/A", o.amount || 0, o.refundDetails?.expectedPayout ?? ((Number(o.amount) || 0) + (Number(o.lessAmount) || 0)), o.reviewType || "N/A", o.dealType || "N/A", o.status, o.screenshot || "N/A", o.refundProof?.reviewScreenshot || "N/A", o.refundProof?.returnPeriodScreenshot || "N/A", o.refundProof?.deliveryScreenshot || "N/A", new Date(o.createdAt).toLocaleDateString()].join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `AspireMint_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${dataToExport.length} Records Exported Successfully`);
    setIsExportModalOpen(false);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
      if ((newStatus === "REFUND_REJECTED" || newStatus === "INVALIDATED") && !rejectionNote) {
         return toast.error(`Please provide a reason for ${newStatus === "INVALIDATED" ? "invalidation" : "rejection"}`);
      }
      const loadingId = toast.loading(`Updating to ${newStatus}...`);
      try {
         setIsUpdating(true);
         const res = await fetch(`/api/orders/${orderId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus, "refundDetails.rejectionNote": rejectionNote || undefined }),
         });
         const json = await res.json();
         if (json.success) {
            toast.success("Order Status Synchronized", { id: loadingId });
            window.location.reload();
         } else { throw new Error(json.message); }
      } catch (err: any) {
         toast.error(err.message || "Cloud Update Failed", { id: loadingId });
      } finally {
         setIsUpdating(false);
         setActionConfirmOrderId(null);
         setIsRejecting(false);
         setRejectionNote("");
      }
   };

  useEffect(() => {
    const fetchMediators = async () => {
      try {
        const medRes = await fetch("/api/users?role=MEDIATOR&isApproved=true");
        const medJson = await medRes.json();
        if (medJson.success) setMediators(medJson.data);
      } catch (err) { console.error("Failed to load mediators"); }
    };
    const fetchMarketplaces = async () => {
      try {
        const res = await fetch("/api/marketplaces");
        const json = await res.json();
        if (json.success) setMarketplaces(json.data);
      } catch (err) { console.error("Failed to load marketplaces"); }
    };
    fetchMediators();
    fetchMarketplaces();
  }, []);

  const handleReassign = async (orderId: string, mediatorId: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediatorId })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Mediator assigned successfully");
        window.location.reload();
      } else { toast.error(json.message); }
    } catch (err) { toast.error("Re-assignment failed"); }
    finally { setIsUpdating(false); setReassignOrderId(null); }
  };

  const handlePruneOrder = async (orderId: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Order pruned from system");
        setPruneConfirmId(null);
        window.location.reload();
      } else { toast.error(json.message); }
    } catch (err) { toast.error("Pruning failed"); }
    finally { setIsUpdating(false); }
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
      case 'CANCELLED': return 'bg-rose-100/60 text-rose-700 border-rose-300 shadow-rose-100/20';
      case 'INVALIDATED': return 'bg-red-950 text-white border-red-900 shadow-red-900/20';
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
      case 'REFUND_APPROVED': 
      case 'REFUNDED': 
      case 'APPROVED': 
      case 'COMPLETED': return { bg: 'bg-emerald-50/60', border: 'border-l-emerald-500', text: 'text-emerald-600' };
      case 'REFUND_FORM_PENDING': 
      case 'PENDING_APPROVAL': return { bg: 'bg-amber-50/70', border: 'border-l-amber-500', text: 'text-amber-600' };
      case 'ACTIVE_ESCROW': return { bg: 'bg-purple-50/60', border: 'border-l-purple-500', text: 'text-purple-600' };
      case 'ESCROW_PAYMENT_PENDING': return { bg: 'bg-indigo-50/60', border: 'border-l-indigo-500', text: 'text-indigo-600' };
      case 'DISPUTE_RAISED': return { bg: 'bg-rose-50/60', border: 'border-l-rose-400', text: 'text-rose-600' };
      case 'INVALIDATED': return { bg: 'bg-red-50/80', border: 'border-l-red-900', text: 'text-red-900' };
      default: return { bg: 'hover:bg-slate-50/50', border: 'border-l-transparent', text: 'text-slate-400' };
    }
  };

  const filteredOrders = useMemo(() => {
    let result = orders.filter(order => {
      const buyerName = order.buyer?.name || "";
      const buyerEmail = order.buyer?.email || "";
      const matchesSearch = 
        String(order.aspireOrderId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(order.userOrderId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(order.merchantOrderId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(buyerName).toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(buyerEmail).toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(order.reviewName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(order.productCode || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(order.brandName || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBrand = brandFilter === "All Brands" || order.brandName === brandFilter;
      const matchesPlatform = platformFilter === "All Platforms" || (order.marketplace || "Amazon") === platformFilter;
      let matchesDate = true;
      if (dateFilter) {
         const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
         matchesDate = orderDate === dateFilter;
      }
      return matchesSearch && matchesBrand && matchesPlatform && matchesDate;
    });
    if (sortBy === "Most Recent") {
       result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "Oldest") {
       result = [...result].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return result;
  }, [orders, searchQuery, brandFilter, platformFilter, dateFilter, sortBy]);

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
    <div className="space-y-6">
      <div className="bg-white rounded-[32px] p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
           <div className="relative col-span-1 md:col-span-2">
              <input 
                type="text" 
                placeholder="Search Buyer, ID or Brand..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-10 text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
              />
              <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
           </div>
            <CustomDropdown options={uniqueBrands} value={brandFilter} onChange={setBrandFilter} placeholder="All Brands" />
            <CustomDropdown options={["All Platforms", ...marketplaces.map(m => m.name)].concat(marketplaces.length === 0 ? ["Amazon", "Flipkart", "Meesho", "Snapdeal", "Myntra", "Shopsy", "Nykaa", "Blinkit"] : [])} value={platformFilter} onChange={setPlatformFilter} placeholder="All Platforms" />
            <div className="relative col-span-1">
               <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-[10px] font-bold uppercase tracking-widest outline-none focus:bg-white focus:shadow-md transition-all custom-date-input" />
               <svg className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <CustomDropdown options={["Most Recent", "Oldest"]} value={sortBy} onChange={setSortBy} placeholder="Sort By" />
            <button 
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center justify-center gap-2 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 active:scale-95 px-6"
            >
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
               Export CSV
            </button>
        </div>

        {/* Bulk Action Controls - Only for SubAdmin in Review Tab */}
        {isSubAdm && activeTab === "TO_BE_REVIEWED" && selectedOrderIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-2xl animate-in fade-in"
          >
             <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-[10px] font-black">
                   {selectedOrderIds.length}
                </div>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Orders Selected for Bulk Processing</p>
             </div>
             <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setBulkActionType("APPROVE"); setIsBulkActionModalOpen(true); }}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20"
                >
                   Bulk Approve
                </button>
                <button 
                  onClick={() => { setBulkActionType("REJECT"); setIsBulkActionModalOpen(true); }}
                  className="px-6 py-2.5 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-md shadow-rose-600/20"
                >
                   Bulk Reject
                </button>
                <button 
                  onClick={() => setSelectedOrderIds([])}
                  className="px-4 py-2.5 text-slate-400 text-[9px] font-black uppercase tracking-widest hover:text-slate-600 transition-all"
                >
                   Cancel
                </button>
             </div>
          </motion.div>
        )}
      </div>

      <div className="overflow-x-auto rounded-[32px] border border-slate-100 shadow-sm bg-white">
        <div className="max-h-[600px] overflow-y-auto pr-2 -mr-2">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="sticky top-0 z-10 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                {isSubAdm && activeTab === "TO_BE_REVIEWED" && (
                  <th className="px-6 py-4 border-b border-slate-100 bg-white first:rounded-tl-2xl">
                     <div className="flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-slate-200 text-indigo-600 focus:ring-indigo-500"
                        />
                     </div>
                  </th>
                )}
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-white">SR.</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-white">Order & Product</th>
                
                {isSubAdm && (
                  <>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-white text-center">Artifacts</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-white text-center">Links</th>
                  </>
                )}

                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-white text-center">Stakeholders</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-white">Economics</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-white">Dates & Status Info</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-white text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-white text-center last:rounded-tr-2xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedOrders.map((order, idx) => {
                const highlight = getRowHighlight(order.status);
                return (
                <tr key={order._id} className={`group transition-all duration-300 ${highlight.bg} ${selectedOrderIds.includes(order._id) ? '!bg-indigo-50/80' : ''}`}>
                  {isSubAdm && activeTab === "TO_BE_REVIEWED" && (
                    <td className="px-6 py-4 border-b border-slate-50 text-center">
                       <input 
                          type="checkbox" 
                          checked={selectedOrderIds.includes(order._id)}
                          onChange={() => toggleSelectOrder(order._id)}
                          className="w-4 h-4 rounded border-slate-200 text-indigo-600 focus:ring-indigo-500"
                        />
                    </td>
                  )}
                  <td className={`px-6 py-4 border-b border-slate-50 text-[11px] font-bold transition-all border-l-8 ${highlight.border} ${highlight.text}`}>
                    {idx + 1 + (currentPage - 1) * itemsPerPage}
                  </td>
                  <td className="px-6 py-4 border-b border-slate-50">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-black text-slate-900 tracking-tight leading-tight uppercase">
                        {order.merchantOrderId || order.userOrderId || order.aspireOrderId}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block px-2 py-0.5 bg-slate-50 rounded-md w-fit border border-slate-100/50">
                           Code: {order.productCode || "N/A"}
                         </span>
                         <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                           {order.brandName || "DEAL"}
                         </span>
                      </div>
                    </div>
                  </td>
                  {isSubAdm && (
                    <>
                      <td className="px-6 py-4 border-b border-slate-50 text-center">
                        <div className="flex flex-col gap-3 items-center">
                           <div className="flex items-center justify-center gap-1.5">
                              {/* Order SS */}
                              <div className="flex flex-col items-center gap-1">
                                 <button 
                                   onClick={() => { setViewerImage(order.screenshot); setViewerTitle("Order Confirmation Screenshot"); }}
                                   disabled={!order.screenshot}
                                   className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${order.screenshot ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 shadow-sm' : 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed'}`}
                                   title="Order SS"
                                 >
                                    <ImageIcon className="w-4 h-4" />
                                 </button>
                                 <span className="text-[6px] font-black text-slate-400 uppercase tracking-tighter">Order</span>
                              </div>
                              
                              {activeTab !== "ORDERED" && (
                                <>
                                  <div className="w-px h-6 bg-slate-100 mx-0.5" />
 
                                  {/* Refund Proofs */}
                                  <div className="flex flex-col items-center gap-1">
                                     <button 
                                       onClick={() => { setViewerImage(order.refundProof?.reviewScreenshot); setViewerTitle("Review/Rating Screenshot"); }}
                                       disabled={!order.refundProof?.reviewScreenshot}
                                       className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${order.refundProof?.reviewScreenshot ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-100 shadow-sm' : 'bg-slate-50 text-slate-200 border border-slate-100 cursor-not-allowed'}`}
                                       title="Review SS"
                                     >
                                        <FileText className="w-3.5 h-3.5" />
                                     </button>
                                     <span className="text-[6px] font-black text-slate-400 uppercase tracking-tighter">Review</span>
                                  </div>
 
                                  <div className="flex flex-col items-center gap-1">
                                     <button 
                                       onClick={() => { setViewerImage(order.refundProof?.returnPeriodScreenshot); setViewerTitle((order.marketplace?.toLowerCase().includes("blinkit") || order.brandName?.toLowerCase().includes("blinkit")) ? "Invoice Evidence" : "Return Period Evidence"); }}
                                       disabled={!order.refundProof?.returnPeriodScreenshot}
                                       className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${order.refundProof?.returnPeriodScreenshot ? 'bg-sky-50 text-sky-600 hover:bg-sky-100 border border-sky-100 shadow-sm' : 'bg-slate-50 text-slate-200 border border-slate-100 cursor-not-allowed'}`}
                                       title={(order.marketplace?.toLowerCase().includes("blinkit") || order.brandName?.toLowerCase().includes("blinkit")) ? "Invoice SS" : "Return SS"}
                                     >
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                     </button>
                                     <span className="text-[6px] font-black text-slate-400 uppercase tracking-tighter">{order.brandName?.toLowerCase().includes("blinkit") ? "Invoice" : "Return"}</span>
                                  </div>
 
                                  <div className="flex flex-col items-center gap-1">
                                     <button 
                                       onClick={() => { setViewerImage(order.refundProof?.deliveryScreenshot); setViewerTitle("Item/Delivery Verification"); }}
                                       disabled={!order.refundProof?.deliveryScreenshot}
                                       className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${order.refundProof?.deliveryScreenshot ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 shadow-sm' : 'bg-slate-50 text-slate-200 border border-slate-100 cursor-not-allowed'}`}
                                       title="Item SS"
                                     >
                                        <Package className="w-3.5 h-3.5" />
                                     </button>
                                     <span className="text-[6px] font-black text-slate-400 uppercase tracking-tighter">Item</span>
                                  </div>
                                </>
                              )}
                           </div>
                           <div className="px-3 py-0.5 bg-slate-50 rounded-full border border-slate-100">
                              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Evidence Vault</p>
                           </div>
                        </div>
                      </td>
 
                      <td className="px-6 py-4 border-b border-slate-50 text-center">
                        <div className="flex flex-col gap-3 items-center">
                           <div className="flex items-center justify-center gap-2">
                              {/* Product Link */}
                              <div className="flex flex-col items-center gap-1">
                                 <a 
                                   href={order.productLink ? (order.productLink.startsWith('http') ? order.productLink : `https://${order.productLink}`) : "#"} 
                                   target="_blank" 
                                   rel="noopener noreferrer"
                                   onClick={(e) => e.stopPropagation()}
                                   className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${order.productLink ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100 shadow-sm active:scale-95' : 'bg-slate-50 text-slate-300 border border-slate-100 pointer-events-none cursor-not-allowed'}`}
                                   title="Product Deal Link"
                                 >
                                    <LinkIcon className="w-3.5 h-3.5" />
                                 </a>
                                 <span className="text-[6px] font-black text-slate-400 uppercase tracking-tighter">Deal</span>
                              </div>
 
                              {activeTab !== "ORDERED" && (
                                <div className="flex flex-col items-center gap-1">
                                   <a 
                                     href={order.refundProof?.reviewLink ? (order.refundProof.reviewLink.startsWith('http') ? order.refundProof.reviewLink : `https://${order.refundProof.reviewLink}`) : "#"} 
                                     target="_blank" 
                                     rel="noopener noreferrer"
                                     onClick={(e) => e.stopPropagation()}
                                     className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${order.refundProof?.reviewLink ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-100 shadow-sm active:scale-95' : 'bg-slate-50 text-slate-200 border border-slate-100 pointer-events-none cursor-not-allowed'}`}
                                     title="Live Review URL"
                                   >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                   </a>
                                   <span className="text-[6px] font-black text-slate-400 uppercase tracking-tighter">Review</span>
                                </div>
                              )}
                           </div>
                           <div className="px-3 py-0.5 bg-slate-50 rounded-full border border-slate-100">
                              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Deal Stream</p>
                           </div>
                        </div>
                      </td>
                    </>
                  )}
                  <td className="px-6 py-4 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                       <div className="flex flex-col">
                          <span className="text-[12px] font-black text-slate-800 uppercase tracking-tight">{order.buyer?.name || "Anonymous Buyer"}</span>
                          <div className="flex items-center gap-1.5 mt-1">
                             
                              <div className="flex items-center gap-1.5 relative">
                                 <span className="text-[9px] font-bold text-slate-500 uppercase">{order.mediator?.systemDisplayName || order.mediatorName || order.mediator?.name || "Standard"}</span>
                                 {order.assignmentType === 'AUTO' && (
                                   <span className="text-[7px] font-black text-emerald-600 uppercase tracking-tighter px-1 py-0.5 bg-emerald-50 rounded border border-emerald-100 leading-none">System</span>
                                 )}
                                 {isAdm && order.assignmentType === 'AUTO' && (
                                   <>
                                     <button 
                                       onClick={(e) => { e.stopPropagation(); setReassignOrderId(reassignOrderId === order._id ? null : order._id); }}
                                       className="h-6 w-6 flex items-center justify-center hover:bg-slate-50 rounded-lg transition-colors group/btn ml-1" 
                                       title="Re-assign Mediator"
                                     >
                                        <svg className={`w-3 h-3 text-slate-300 group-hover/btn:text-indigo-500 transition-all ${reassignOrderId === order._id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                     </button>

                                     <AnimatePresence>
                                        {reassignOrderId === order._id && (
                                           <motion.div 
                                              initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                              animate={{ opacity: 1, scale: 1, y: 0 }}
                                              exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                              className="absolute z-[100] top-full left-0 mt-2 bg-white border border-slate-100 shadow-2xl rounded-2xl p-2 min-w-[180px] max-h-[220px] overflow-y-auto"
                                           >
                                              <div className="px-2 py-1.5 border-b border-slate-50 mb-1">
                                                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Choose Specialist</p>
                                              </div>
                                              <div className="space-y-1">
                                                 {mediators.length === 0 ? (
                                                    <p className="text-[8px] text-slate-300 p-2 uppercase font-black italic">No mediators available</p>
                                                 ) : (
                                                    mediators.map(m => (
                                                       <button
                                                          key={m._id}
                                                          onClick={(e) => { e.stopPropagation(); handleReassign(order._id, m._id); }}
                                                          disabled={isUpdating}
                                                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50 group flex flex-col gap-0.5 transition-all active:scale-[0.98] disabled:opacity-50"
                                                       >
                                                          <span className="text-[9px] font-black text-slate-700 group-hover:text-indigo-600 uppercase tracking-tight">{m.systemDisplayName || m.name}</span>
                                                          <span className="text-[7px] text-slate-300 font-bold uppercase tracking-widest">{m.aspireMintId || 'ID UNKNOWN'}</span>
                                                       </button>
                                                    ))
                                                 )}
                                              </div>
                                           </motion.div>
                                        )}
                                     </AnimatePresence>
                                   </>
                                 )}
                              </div>

                          </div>
                          {order.reviewName && (
                            <div className="flex items-center gap-1.5 mt-1">
                               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1.5 py-0.5 bg-slate-100 rounded-md">Reviewer</span>
                               <span className="text-[9px] font-bold text-slate-500 uppercase truncate max-w-[80px]">{order.reviewName}</span>
                            </div>
                          )}
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-b border-slate-50">
                    <div className="flex flex-col gap-2 min-w-[120px]">
                       <div className="flex items-center justify-between">
                          <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Order Val.</span>
                          <span className="text-[11px] font-black text-slate-900">₹{order.amount || 0}</span>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Refund</span>
                          <span className="text-[11px] font-black text-emerald-600">₹{order.refundDetails?.expectedPayout ?? ((Number(order.amount) || 0) + (Number(order.lessAmount) || 0))}</span>
                       </div>
                       <div className="h-px bg-slate-100 my-0.5" />
                       <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                             <span className="text-[6px] font-black text-indigo-400 uppercase tracking-tighter">User Added Less</span>
                             <span className="text-[9px] font-black text-indigo-600">-₹{order.lessAmount || 0}</span>
                          </div>
                          <div className="flex flex-col text-right">
                             <span className="text-[6px] font-black text-amber-400 uppercase tracking-tighter">
                                {order.mediator?.systemDisplayName || order.mediatorName || order.mediator?.name || "Mediator"} Less/Comm
                             </span>
                             <span className="text-[9px] font-black text-amber-600">
                                {order.mediatorCommission > 0 ? `+₹${order.mediatorCommission}` : `₹${order.mediatorCommission || 0}`}
                             </span>
                          </div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-b border-slate-50">
                    <div className="space-y-1.5">
                       <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-900 leading-none">Registered:</span>
                          <span className="text-[10px] font-medium text-slate-500 leading-none">{formatDate(order.createdAt)}</span>
                       </div>
                       {order.status === 'REFUND_FORM_SUBMITTED' ? (
                         <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-indigo-600">
                               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                               <span className="text-[9px] font-black uppercase tracking-tight">REFUND FILLED: {formatDate(order.refundDetails?.submittedAt || order.updatedAt)}</span>
                            </div>
                         </div>
                       ) : (
                         <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black text-amber-600 uppercase tracking-tight bg-amber-50 px-2 py-0.5 rounded-md whitespace-nowrap">Due DRD: {formatDate(order.createdAt)}</span>
                         </div>
                       )}
                    </div>
                  </td>
                  <td className="px-6 py-4 border-b border-slate-50 text-center">
                    <span className={`inline-block rounded-xl border px-3.5 py-2 text-[9px] font-black uppercase tracking-[0.15em] shadow-sm ${getStatusStyle(order.status)}`}>
                        {order.status === 'REFUND_FORM_SUBMITTED' ? 'UNDER VERIFICATION' : order.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-b border-slate-50 text-center">
                    <div className="flex items-center justify-center gap-2.5 relative">
                       <button 
                          onClick={() => { setNoteOrderId(order._id); markNotesAsRead(order._id); }} 
                          className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-indigo-600 transition-all border border-slate-200/50 relative group"
                          title="Internal Notes"
                       >
                          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          {hasUnreadNotes(order) && (
                            <span className="absolute -top-1 -right-1 h-3 w-3 bg-rose-500 rounded-full border-2 border-white animate-pulse shadow-sm" />
                          )}
                       </button>
                       <button onClick={() => onViewDetails(order._id)} className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-all border border-slate-200/50" title="View Details">
                          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                       </button>
                       {hasManagementAccess && order.status === 'UNDER_VERIFICATION' && (
                          <button 
                             onClick={() => { setActionConfirmOrderId(order._id); setIsRejecting(false); setRejectionNote(""); }}
                             className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 hover:bg-indigo-100 transition-all border border-indigo-100/50 shadow-sm"
                             title="Approve / Reject Refund"
                          >
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </button>
                       )}
                       {hasManagementAccess && order.status === 'REFUND_FORM_PENDING' && (
                          <button 
                             onClick={() => { setActionConfirmOrderId(order._id); setIsRejecting(false); setRejectionNote(""); }}
                             className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center text-red-600 hover:bg-red-100 transition-all border border-red-100 shadow-sm"
                             title="Invalidate Order"
                          >
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                          </button>
                       )}
                       {order.status === 'CANCELLED' && (
                          <>
                            <div className="relative">
                               <button 
                                  onClick={() => setReasonOrderId(order._id)}
                                  className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all border shadow-sm ${reasonOrderId === order._id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100'}`} 
                                  title="View Reason"
                               >
                                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                               </button>
                            </div>

                            {isAdm && (
                               <button 
                                  onClick={() => setPruneConfirmId(order._id)}
                                  disabled={isUpdating}
                                  className="h-9 w-9 rounded-xl bg-red-100 flex items-center justify-center text-red-600 hover:bg-red-200 transition-all border border-red-200 shadow-sm" 
                                  title="Prune (Delete Permanently)"
                               >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                               </button>
                            )}
                          </>
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

      {filteredOrders.length === 0 && (
        <div className="py-20 text-center">
            <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">No Ledger Records Found</p>
        </div>
      )}

      {/* Pagination Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-4 mt-6">
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
                       className={`px-2 py-1 rounded-md text-[9px] font-black transition-all ${itemsPerPage === size ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-indigo-600'}`}
                    >
                       {size}
                    </button>
                 ))}
              </div>
           </div>
        </div>
        
        <div className="flex items-center gap-2 order-1 md:order-2">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`p-2.5 rounded-xl transition-all ${currentPage === 1 ? 'bg-slate-50 text-slate-200 cursor-not-allowed' : 'bg-white text-slate-400 hover:text-indigo-600 hover:shadow-md border border-slate-100'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>

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
                className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all ${currentPage === page ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-400 hover:bg-white hover:text-indigo-600"}`}
              >
                {page}
              </button>
             ))}
          </div>

          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`p-2.5 rounded-xl transition-all ${currentPage === totalPages ? 'bg-slate-50 text-slate-200 cursor-not-allowed' : 'bg-white text-slate-400 hover:text-indigo-600 hover:shadow-md border border-slate-100'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* Refund Approval/Rejection Modal */}
      <AnimatePresence>
        {actionConfirmOrderId && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-6">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="w-full max-w-md bg-slate-900 rounded-[40px] p-10 shadow-2xl relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 h-40 w-40 bg-blue-600/20 blur-[100px] rounded-full -mr-20 -mt-20" />
               <div className="relative z-10 text-white">
                  <div className="flex items-center justify-between mb-8">
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Management Action</p>
                     <button onClick={() => { setActionConfirmOrderId(null); setIsRejecting(false); setRejectionNote(""); }} className="text-slate-500 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                  </div>
                  
                  {!isRejecting ? (
                     <div className="flex flex-col gap-4">
                        <div className="mb-4">
                           <h3 className="text-2xl font-black uppercase tracking-tight text-white">
                             {orders.find(o => o._id === actionConfirmOrderId)?.status === 'REFUND_FORM_PENDING' ? "Invalidation Decision" : "Refund Decision"}
                           </h3>
                           <p className="text-sm font-medium text-slate-400 mt-2">
                             {orders.find(o => o._id === actionConfirmOrderId)?.status === 'REFUND_FORM_PENDING' 
                               ? "Are you sure you want to invalidate this order entry?" 
                               : "Are you ready to authorize or reject this refund claim?"}
                           </p>
                        </div>
                        {orders.find(o => o._id === actionConfirmOrderId)?.status !== 'REFUND_FORM_PENDING' && (
                           <button 
                              onClick={() => handleStatusUpdate(actionConfirmOrderId, "REFUND_APPROVED")}
                              disabled={isUpdating}
                              className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-xl shadow-emerald-900/40 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                           >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              Authorize Refund
                           </button>
                        )}
                        <button 
                           onClick={() => setIsRejecting(true)}
                           disabled={isUpdating}
                           className="w-full py-5 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/30 rounded-2xl font-black text-[12px] uppercase tracking-widest text-rose-400 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                           {orders.find(o => o._id === actionConfirmOrderId)?.status === 'REFUND_FORM_PENDING' ? "Invalidate Order" : "Reject Claim"}
                        </button>
                     </div>
                  ) : (
                     <div className="space-y-6 animate-in slide-in-from-bottom-2">
                        <div>
                           <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Reason for Rejection *</label>
                           <textarea 
                             value={rejectionNote}
                             onChange={(e) => setRejectionNote(e.target.value)}
                             placeholder="Specify why this refund is being rejected..."
                             className="w-full h-32 bg-slate-800 border-none rounded-2xl p-4 text-sm font-medium text-white placeholder:text-slate-600 focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                           />
                        </div>
                        <div className="flex gap-3">
                           <button onClick={() => setIsRejecting(false)} disabled={isUpdating} className="px-8 py-4 bg-slate-800 text-slate-400 font-bold text-[10px] uppercase tracking-widest rounded-xl disabled:opacity-50">Back</button>
                           <button 
                              onClick={() => handleStatusUpdate(actionConfirmOrderId, orders.find(o => o._id === actionConfirmOrderId)?.status === 'REFUND_FORM_PENDING' ? "INVALIDATED" : "REFUND_REJECTED")}
                              disabled={isUpdating}
                              className="flex-1 py-4 bg-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-900/40 disabled:opacity-50"
                           >
                              {orders.find(o => o._id === actionConfirmOrderId)?.status === 'REFUND_FORM_PENDING' ? "Confirm Invalidation" : "Confirm Rejection"}
                           </button>
                        </div>
                     </div>
                  )}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Internal Notes Modal */}
      <AnimatePresence>
        {noteOrderId && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/60 backdrop-blur-xl p-6">
             <motion.div 
               initial={{ scale: 0.95, opacity: 0, y: 30 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.95, opacity: 0, y: 30 }}
               className="w-full max-w-2xl bg-white rounded-[48px] shadow-3xl overflow-hidden flex flex-col max-h-[85vh]"
             >
                <div className="p-10 border-b border-slate-50 bg-white sticky top-0 z-10">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                         <div className="h-16 w-16 bg-indigo-50 text-indigo-600 rounded-[24px] flex items-center justify-center border border-indigo-100 shadow-inner">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                         </div>
                         <div>
                            <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Internal Ledger</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Confidential remarks & communication stream</p>
                         </div>
                      </div>
                      <button onClick={() => setNoteOrderId(null)} className="h-12 w-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-100 transition-all active:scale-90">
                         <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} d="M6 18L18 6M6 6l12 12"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-slate-50/30">
                   {orders.find(o => o._id === noteOrderId)?.internalNotes?.length > 0 ? (
                      orders.find(o => o._id === noteOrderId).internalNotes.map((note: any, idx: number) => (
                         <div key={idx} className="flex flex-col gap-3">
                            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
                               <div className="absolute top-0 right-0 h-full w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                               <p className="text-[15px] font-bold text-slate-700 leading-relaxed italic">"{note.content}"</p>
                            </div>
                            <div className="flex items-center gap-3 px-4">
                               <span className={`text-[9px] font-black uppercase tracking-widest ${note.authorRole === 'ADMIN' ? 'text-indigo-600' : 'text-emerald-600'}`}>
                                 {note.authorName} ({note.authorRole === 'ADMIN' ? 'ADMIN' : 'SUBADMIN'})
                               </span>
                               <span className="h-1 w-1 bg-slate-200 rounded-full" />
                               <span className="text-[9px] font-black text-slate-300 uppercase">{formatDate(note.createdAt)}</span>
                            </div>
                         </div>
                      ))
                   ) : (
                      <div className="py-20 flex flex-col items-center justify-center text-center opacity-30">
                         <svg className="w-20 h-20 text-slate-200 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                         <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No internal records found for this entry</p>
                      </div>
                   )}
                </div>

                <div className="p-10 border-t border-slate-100 bg-white sticky bottom-0">
                   <div className="flex gap-4">
                      <input 
                         type="text" 
                         value={newNote}
                         onChange={(e) => setNewNote(e.target.value)}
                         placeholder="Add a confidential remark..."
                         className="flex-1 h-16 bg-slate-50 border border-slate-100 rounded-[24px] px-8 text-sm font-bold placeholder:text-slate-300 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                         onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                      />
                      <button 
                         onClick={handleAddNote}
                         disabled={isUpdating || !newNote.trim()}
                         className="h-16 px-10 bg-slate-900 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-slate-900/20 hover:scale-[1.02] active:scale-0.98 transition-all disabled:opacity-50"
                      >
                         Log Note
                      </button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Export Filter Modal */}
      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-6">
             <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="w-full max-w-2xl bg-white rounded-[48px] shadow-3xl overflow-hidden"
             >
                <div className="p-10">
                   <div className="flex items-center justify-between mb-10">
                      <div>
                         <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Export Ledger</h2>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configure custom parameters for CSV generation</p>
                      </div>
                      <button onClick={() => setIsExportModalOpen(false)} className="h-12 w-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-100 transition-all">
                         <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} d="M6 18L18 6M6 6l12 12"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                   </div>

                   <div className="grid grid-cols-2 gap-8 mb-10">
                      <div className="space-y-6">
                         <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block ml-1">Date Range</label>
                            <div className="flex items-center gap-3">
                               <input 
                                 type="date" 
                                 value={exportFilters.startDate}
                                 onChange={(e) => setExportFilters({...exportFilters, startDate: e.target.value})}
                                 className="flex-1 h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-[10px] font-bold uppercase outline-none focus:bg-white transition-all"
                               />
                               <span className="text-slate-300 font-black">TO</span>
                               <input 
                                 type="date" 
                                 value={exportFilters.endDate}
                                 onChange={(e) => setExportFilters({...exportFilters, endDate: e.target.value})}
                                 className="flex-1 h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-[10px] font-bold uppercase outline-none focus:bg-white transition-all"
                               />
                             </div>
                             <div className="flex gap-2 mt-4">
                                {[
                                  { label: 'Weekly', days: 7 },
                                  { label: 'Monthly', days: 30 },
                                  { label: 'Yearly', days: 365 }
                                ].map((preset) => (
                                  <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => {
                                      const end = new Date();
                                      const start = new Date();
                                      start.setDate(end.getDate() - preset.days);
                                      setExportFilters({
                                        ...exportFilters,
                                        startDate: start.toISOString().split('T')[0],
                                        endDate: end.toISOString().split('T')[0]
                                      });
                                    }}
                                    className="flex-1 py-2 bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100"
                                  >
                                    {preset.label}
                                  </button>
                                ))}
                             </div>
                          </div>

                         <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block ml-1">Order Status</label>
                            <CustomDropdown 
                              options={["All Statuses", "REFUND_FORM_PENDING", "UNDER_VERIFICATION", "REFUND_APPROVED", "REFUND_REJECTED", "CANCELLED", "COMPLETED", "INVALIDATED"]} 
                              value={exportFilters.status} 
                              onChange={(val) => setExportFilters({...exportFilters, status: val})} 
                              placeholder="Select Status" 
                            />
                         </div>

                         <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block ml-1">Associated Brand</label>
                            <CustomDropdown 
                              options={uniqueBrands} 
                              value={exportFilters.brand} 
                              onChange={(val) => setExportFilters({...exportFilters, brand: val})} 
                              placeholder="Select Brand" 
                            />
                         </div>
                      </div>

                      <div className="space-y-6">
                         <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block ml-1">Deal Type</label>
                            <CustomDropdown 
                              options={["All Types", "Original", "Empty Box", "Exchange"]} 
                              value={exportFilters.dealType} 
                              onChange={(val) => setExportFilters({...exportFilters, dealType: val})} 
                              placeholder="Select Deal Type" 
                            />
                         </div>

                         <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block ml-1">Review Category</label>
                            <CustomDropdown 
                              options={["All Types", "Review", "Rating", "Order"]} 
                              value={exportFilters.reviewType} 
                              onChange={(val) => setExportFilters({...exportFilters, reviewType: val})} 
                              placeholder="Select Review Category" 
                            />
                         </div>

                         <div className="pt-6">
                            <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 border-dashed">
                               <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest text-center leading-relaxed">
                                  Photos, stake-holders and financial timeline will be included in the generated report by default.
                               </p>
                            </div>
                         </div>
                      </div>
                   </div>

                   <button 
                      onClick={() => handleExportCSV(exportFilters)}
                      className="w-full py-6 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                   >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Initialize Export Stream
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Action Confirmation Modal */}
      <AnimatePresence>
        {isBulkActionModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-3xl relative overflow-hidden"
             >
                <div className={`absolute top-0 right-0 h-40 w-40 ${bulkActionType === 'APPROVE' ? 'bg-emerald-500/10' : 'bg-rose-500/10'} blur-[80px] rounded-full -mr-20 -mt-20`} />
                
                <div className="relative z-10 text-slate-900">
                   <div className="flex items-center justify-between mb-8">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${bulkActionType === 'APPROVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                         <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            {bulkActionType === 'APPROVE' 
                              ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              : <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            }
                         </svg>
                      </div>
                      <button onClick={() => { setIsBulkActionModalOpen(false); setBulkActionType(null); setRejectionNote(""); }} className="text-slate-300 hover:text-slate-600 transition-colors">
                         <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} d="M6 18L18 6M6 6l12 12"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                   </div>

                   <h3 className="text-2xl font-black uppercase tracking-tight mb-2">
                      Bulk {bulkActionType === 'APPROVE' ? 'Authorization' : 'Rejection'}
                   </h3>
                   <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
                      You are about to process <span className="text-slate-900 font-black">{selectedOrderIds.length} orders</span> at once. This action will trigger automated notifications to all affected buyers.
                   </p>

                   {(bulkActionType === 'REJECT' || bulkActionType === 'INVALIDATE') && (
                      <div className="mb-8">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Universal Rejection Reason *</label>
                         <textarea 
                           value={rejectionNote}
                           onChange={(e) => setRejectionNote(e.target.value)}
                           placeholder="This reason will be sent to all selected users..."
                           className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                         />
                      </div>
                   )}

                   <div className="flex gap-4">
                      <button 
                        onClick={() => { setIsBulkActionModalOpen(false); setBulkActionType(null); }}
                        className="flex-1 py-4 bg-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
                      >
                         Cancel
                      </button>
                      <button 
                        onClick={handleBulkStatusUpdate}
                        disabled={isUpdating}
                        className={`flex-[2] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white shadow-xl transition-all disabled:opacity-50 ${bulkActionType === 'APPROVE' ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-rose-600 shadow-rose-600/20'}`}
                      >
                         Confirm Bulk {bulkActionType === 'APPROVE' ? 'Approval' : 'Rejection'}
                      </button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancellation Reason Modal */}
      <AnimatePresence>
        {reasonOrderId && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-6">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="w-full max-w-lg bg-white rounded-[40px] p-10 shadow-2xl relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/10 blur-[60px] rounded-full -mr-20 -mt-20" />
               
               <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-4">
                        <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-inner">
                           <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                           <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Withdrawal Context</h3>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Order Cancellation Insight</p>
                        </div>
                     </div>
                     <button onClick={() => setReasonOrderId(null)} className="h-10 w-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-100 transition-all">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                  </div>

                  <div className="bg-slate-50/50 rounded-[32px] p-8 border border-slate-100/50 mb-8 relative">
                     <div className="absolute top-4 left-4 opacity-10">
                        <svg className="w-12 h-12 text-indigo-600" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16L19.017 16C19.5693 16 20.017 15.5523 20.017 15L20.017 12C20.017 11.4477 19.5693 11 19.017 11L15.017 11C13.9124 11 13.017 10.1046 13.017 9L13.017 6C13.017 4.89543 13.9124 4 15.017 4L19.017 4C21.2261 4 23.017 5.79086 23.017 8L23.017 15C23.017 18.3137 20.3307 21 17.017 21L14.017 21ZM1.017 21L1.017 18C1.017 16.8954 1.91243 16 3.017 16L6.017 16C6.56928 16 7.017 15.5523 7.017 15L7.017 12C7.017 11.4477 6.56928 11 6.017 11L2.017 11C0.912431 11 0.017 10.1046 0.017 9L0.017 6C0.017 4.89543 0.912431 4 2.017 4L6.017 4C8.22614 4 10.017 5.79086 10.017 8L10.017 15C10.017 18.3137 7.33066 21 4.017 21L1.017 21Z" /></svg>
                     </div>
                     <p className="text-lg font-bold text-slate-700 leading-relaxed relative z-10 italic text-center px-4">
                        {orders.find(o => o._id === reasonOrderId)?.cancellationReason || "The user did not provide a specific reason for this cancellation."}
                     </p>
                  </div>

                  <button 
                     onClick={() => setReasonOrderId(null)}
                     className="w-full h-16 bg-indigo-600 text-white rounded-[20px] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/30 active:scale-95 transition-all"
                  >
                     Review Acknowledged
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pruning Confirmation Modal */}
      <AnimatePresence>
        {pruneConfirmId && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-6">
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
                    This will surgically remove this <span className="text-red-500">cancelled order</span> from the ledger forever. Are you absolutely certain?
                  </p>

                  <div className="flex flex-col gap-3">
                     <button 
                        onClick={() => handlePruneOrder(pruneConfirmId)}
                        disabled={isUpdating}
                        className="w-full h-16 bg-slate-900 text-white rounded-[20px] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/30 active:scale-95 transition-all disabled:opacity-50"
                     >
                        {isUpdating ? "Pruning..." : "Yes, Purge Record"}
                     </button>
                     <button 
                        onClick={() => setPruneConfirmId(null)}
                        className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors"
                     >
                        Cancel & Keep
                     </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Viewer Overlay */}
      <AnimatePresence>
         {viewerImage && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 md:p-10">
               <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="relative w-full max-w-5xl h-full flex flex-col items-center justify-center"
               >
                  <div className="absolute top-0 right-0 left-0 p-6 flex items-center justify-between z-10">
                     <div className="bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">
                        <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{viewerTitle}</p>
                     </div>
                     <button 
                        onClick={() => setViewerImage(null)}
                        className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-slate-900 shadow-2xl hover:scale-110 active:scale-90 transition-all"
                     >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} d="M6 18L18 6M6 6l12 12"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                  </div>
                  <div className="w-full h-full flex items-center justify-center p-4">
                     <img 
                        src={viewerImage} 
                        className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5" 
                        alt="Evidence Viewer" 
                     />
                  </div>
                  <div className="absolute bottom-6 flex items-center gap-4">
                     <button 
                        onClick={() => window.open(viewerImage, '_blank')}
                        className="px-8 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all"
                     >
                        Open Original Asset
                     </button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
}
