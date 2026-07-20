"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import formatDate from "@/utils/formatDate";
import { formatTimeAgo } from "@/utils/formatTimeAgo";
import toast from "react-hot-toast";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { MobileActiveDeals } from "@/components/user/MobileActiveDeals";

interface ActiveDealsTableProps {
  deals: any[];
  loading?: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  onRefresh: () => void;
  isAdm: boolean;
  role?: string;
  isJuhi?: boolean;
  isArchived?: boolean;
}

export function ActiveDealsTable({ 
  deals, loading, searchQuery, setSearchQuery, onRefresh, isAdm, role, isJuhi, isArchived 
}: ActiveDealsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5); // Optimized for mobile viewport height

  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(window.innerWidth < 768 ? 5 : 8);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [dealToEdit, setDealToEdit] = useState<any>(null);

  const [brandFilter, setBrandFilter] = useState("All Brands");
  const [reviewTypeFilter, setReviewTypeFilter] = useState("All Types");
  const [dealTypeFilter, setDealTypeFilter] = useState("All Deals");
  const [dateSort, setDateSort] = useState("Most Recent");

  const uniqueBrands = useMemo(() => {
    const brands = new Set(deals.map(d => d.brandName).filter(Boolean));
    return ["All Brands", ...Array.from(brands).sort()];
  }, [deals]);

  const filteredDeals = useMemo(() => {
    let result = deals.filter(deal => {
      const matchSearch = (deal.productCode || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (deal.brandName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (deal.productDetails || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchBrand = brandFilter === "All Brands" || deal.brandName === brandFilter;
      
      const matchReview = reviewTypeFilter === "All Types" || 
                          (reviewTypeFilter === "Review" && deal.reviewType === "REVIEW") ||
                          (reviewTypeFilter === "Rating" && deal.reviewType === "RATING") ||
                          (reviewTypeFilter === "Order Only" && (deal.reviewType === "ORDER" || deal.reviewType === "ONLY_ORDER")) ||
                          (reviewTypeFilter === "Submitted" && deal.reviewType === "SUBMITTED");

      const matchDeal = dealTypeFilter === "All Deals" || deal.dealType === dealTypeFilter;

      return matchSearch && matchBrand && matchReview && matchDeal;
    });

    if (dateSort === "Most Recent") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    return result;
  }, [deals, searchQuery, brandFilter, reviewTypeFilter, dealTypeFilter, dateSort]);

  const brandOptions = useMemo(() => uniqueBrands.map(b => ({ label: b, value: b })), [uniqueBrands]);
  const reviewTypeOptions = [
    { label: "All Types", value: "All Types" },
    { label: "Review", value: "Review" },
    { label: "Rating", value: "Rating" },
    { label: "Order Only", value: "Order Only" },
    { label: "Submitted", value: "Submitted" }
  ];
  const dealTypeOptions = [
    { label: "All Deals", value: "All Deals" },
    { label: "Original", value: "Original" },
    { label: "Empty Box", value: "Empty Box" },
    { label: "Exchange", value: "Exchange" }
  ];
  const sortOptions = [
    { label: "Most Recent First", value: "Most Recent" },
    { label: "Oldest First", value: "Oldest" }
  ];

  const totalPages = Math.ceil(filteredDeals.length / itemsPerPage);
  const paginatedDeals = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDeals.slice(start, start + itemsPerPage);
  }, [filteredDeals, currentPage, itemsPerPage]);

  const handleDelete = async (mode: "archive" | "delete" = "delete") => {
    if (!dealToDelete) return;
    
    const loadingId = toast.loading(mode === "archive" ? "Archiving deal..." : "Deleting deal...");
    setShowDeleteModal(false);
    
    try {
      const res = await fetch(`/api/deals/active/${dealToDelete._id}?mode=${mode}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message, { id: loadingId });
        onRefresh();
      } else {
        toast.error(json.message, { id: loadingId });
      }
    } catch (err) {
      toast.error("Operation failed", { id: loadingId });
    } finally {
      setDealToDelete(null);
    }
  };

  const handleEdit = async (updatedData: any) => {
    if (!dealToEdit) return;
    const loadingId = toast.loading("Updating deal...");
    try {
      const res = await fetch(`/api/deals/active/${dealToEdit._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Deal updated globally", { id: loadingId });
        setShowEditModal(false);
        onRefresh();
      } else {
        toast.error(json.message, { id: loadingId });
      }
    } catch (err) {
      toast.error("Update failed", { id: loadingId });
    }
  };

  const handleWhatsAppShare = async (deal: any) => {
    const messageParts = [
      deal.productImage ? `🖼️ *Preview:* ${deal.productImage}` : null,
      `🔥 *NEW DEAL ALERT!* 🔥`,
      `📦 *Product:* ${deal.productDetails}`,
      `🏷️ *Code:* ${deal.productCode}`,
      `🏢 *Brand:* ${deal.brandName}`,
      `🛒 *Marketplace:* ${deal.marketplace}`,
      `📋 *Deal Type:* ${deal.dealType}`,
      `⭐ *Review Type:* ${deal.reviewType === "SUBMITTED" ? "REVIEW SUBMITTED" : deal.reviewType}`,
      `💰 *Less/Commission:* ₹________`,
      deal.productLink ? `🔗 *Product Link:* ${deal.productLink}` : null,
      `*DM to claim now!* 🚀`
    ].filter(Boolean);
    const message = messageParts.join('\n\n').trim();

    try {
      if (deal.productImage && navigator.share) {
        const response = await fetch(deal.productImage);
        const blob = await response.blob();
        const file = new File([blob], 'product.jpg', { type: blob.type });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text: message });
          return;
        }
      }
    } catch (err) {
      console.log("Native share failed/CORS, falling back to direct link.", err);
    }

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Desktop Filters Bar */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white/50 backdrop-blur-md p-6 rounded-[32px] border border-slate-100 shadow-sm relative z-[100]">
        <Select 
          label="Filter by Brand"
          options={brandOptions}
          value={brandFilter}
          onChange={(val) => { setBrandFilter(val); setCurrentPage(1); }}
        />

        <Select 
          label="Review Type"
          options={reviewTypeOptions}
          value={reviewTypeFilter}
          onChange={(val) => { setReviewTypeFilter(val); setCurrentPage(1); }}
        />

        <Select 
          label="Deal Protocol"
          options={dealTypeOptions}
          value={dealTypeFilter}
          onChange={(val) => { setDealTypeFilter(val); setCurrentPage(1); }}
        />

        <Select 
          label="Chronological Sort"
          options={sortOptions}
          value={dateSort}
          onChange={(val) => setDateSort(val)}
        />
      </div>
      
      {/* Desktop Table Section */}
      <div className="hidden md:block overflow-x-auto custom-scrollbar bg-white rounded-[32px] border border-slate-100 shadow-sm relative z-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-5 text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-50">Deal Details</th>
              <th className="px-6 py-5 text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-50 text-center">Protocol & Marketplace</th>
              <th className="px-6 py-5 text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-50 text-center">STOCKS</th>
              {role !== 'USER' && (
                <th className="px-6 py-5 text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-50 text-center">Amount</th>
              )}
              <th className="px-6 py-5 text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-50 text-center">Product Link</th>
              {!isAdm && <th className="px-6 py-5 text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-50 text-center">Remarks</th>}
              <th className="px-6 py-5 text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-50 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-indigo-50/20">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-16 w-16" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col items-center gap-2">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </td>

                  <td className="px-6 py-6">
                    <div className="flex flex-col items-center gap-2">
                      <Skeleton className="h-1.5 w-20" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </td>
                  {role !== 'USER' && (
                    <td className="px-6 py-6"><div className="flex justify-center"><Skeleton className="h-6 w-12" /></div></td>
                  )}
                  <td className="px-6 py-6"><div className="flex justify-center"><Skeleton className="h-10 w-10 rounded-xl" /></div></td>
                  {!isAdm && (
                    <td className="px-6 py-6"><div className="flex justify-center"><Skeleton className="h-9 w-9 rounded-full" /></div></td>
                  )}
                  <td className="px-6 py-6"><div className="flex justify-center"><Skeleton className="h-10 w-24 rounded-xl" /></div></td>
                </tr>
              ))
            ) : paginatedDeals.map((deal) => {
              const consumedSlots = (deal.totalSlots || 0) - (deal.remainingSlots || 0);
              const isHotDeal = deal.createdAt && (Date.now() - new Date(deal.createdAt).getTime() < 24 * 60 * 60 * 1000);
              const isOut = deal.remainingSlots <= 0;
              
              let boughtText = "";
              if (consumedSlots >= 50) {
                boughtText = "🔥 50+ users bought this";
              } else if (consumedSlots >= 10) {
                boughtText = `🔥 ${consumedSlots} users bought this`;
              }

              return (
              <tr key={deal._id} className="group hover:bg-indigo-50/20 transition-all duration-300 relative">
                <td className="px-6 py-6">
                  {isHotDeal && !isOut && (
                    <div className="absolute top-0 left-0 bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-br-lg shadow-sm z-10">
                       HOT DEAL
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                     <div className="relative">
                        {deal.productImage && typeof deal.productImage === 'string' && deal.productImage.trim() !== "" ? (
                          <div className="h-16 w-16 rounded-2xl bg-white border-2 border-indigo-100 shadow-sm overflow-hidden flex-shrink-0 group-hover:scale-105 transition-all group-hover:border-indigo-300">
                             <a href={deal.productImage} target="_blank" rel="noopener noreferrer" title="View full size" className="w-full h-full block">
                               <img 
                                 src={deal.productImage?.includes('cloudinary.com') ? deal.productImage.replace('/image/upload/', '/image/upload/q_auto,f_auto,w_150,c_fill/') : deal.productImage} 
                                 alt="Product" 
                                 loading="lazy"
                                 decoding="async"
                                 className="w-full h-full object-cover transition-opacity duration-300"
                                 onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                                 style={{ opacity: 0 }}
                               />
                             </a>
                          </div>
                        ) : (
                          <div className="h-16 w-16 rounded-2xl bg-indigo-50/50 flex flex-col items-center justify-center text-indigo-400 border border-indigo-100 flex-shrink-0 group-hover:bg-white transition-all shadow-sm">
                             {deal.marketplace === 'Amazon' ? (
                               <svg className="w-8 h-8 opacity-40" viewBox="0 0 24 24" fill="currentColor">
                                 <path d="M18.72 17.51c-1.8 1.44-4.56 2.04-6.84 2.04-3.12 0-5.88-1.08-8.04-2.88-.12-.12-.12-.36.12-.48.24-.12.48-.12.72 0 1.92 1.44 4.56 2.16 7.2 2.16 2.16 0 4.68-.6 6.48-1.92.12-.12.36-.12.48 0 .12.001.12.241-.12.361zm1.2-1.32c-.12-.12-.36-.12-.36 0-1.44 1.2-3.36 1.8-5.4 1.8-2.64 0-5.16-1.08-7.2-2.88-.12-.12-.24-.12-.36 0-.12.12-.12.24 0 .36 2.16 1.92 4.92 3.12 7.8 3.12 2.16 0 4.2-.6 5.76-1.92.12-.12.12-.36-.24-.48zM15 13.91c0 2.23-1.47 3.59-3.56 3.59-1.32 0-2.48-.68-2.48-2.2 0-2.17 1.83-2.6 4.31-2.6.53 0 1.15.04 1.73.11v-.9c0-1.4-1.07-2.09-2.58-2.09-1.28 0-2.54.49-3.41 1.09-.09.07-.15.01-.11-.08l.36-.88c.03-.09.11-.12.19-.17a8.5 8.5 0 013.33-.82c2.45 0 4.52 1.25 4.52 4.41v3.47zm-1.73.06c-.45-.06-.99-.11-1.45-.11-1.33 0-2.73.34-2.73 1.54 0 .76.62 1.28 1.49 1.28 1.15 0 2.69-.97 2.69-2.71z" />
                               </svg>
                             ) : deal.marketplace === 'Flipkart' ? (
                               <div className="flex flex-col items-center">
                                 <svg className="w-8 h-8 opacity-40" viewBox="0 0 24 24" fill="currentColor">
                                   <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5c0 .28-.22.5-.5.5h-1c-.28 0-.5-.22-.5-.5s.22-.5.5-.5h1c.28 0 .5.22.5.5zm1.5-4.5c0 1.24-1.01 2.25-2.25 2.25S9 13.24 9 12V8h6v4z" />
                                 </svg>
                                 <span className="text-[7px] font-black tracking-widest mt-0.5 opacity-40">FK</span>
                               </div>
                             ) : (
                               <span className="text-[12px] font-black text-indigo-400 uppercase tracking-widest opacity-40">{deal.marketplace?.substring(0, 3) || 'Ext'}</span>
                             )}
                          </div>
                        )}
                        <div className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-white rounded-full flex items-center justify-center shadow-sm border border-indigo-50">
                           <div className={`h-2.5 w-2.5 rounded-full ${deal.remainingSlots > 0 ? "bg-emerald-500" : "bg-rose-500"}`} />
                        </div>
                     </div>
                     <div>
                        <div className="flex items-center gap-2">
                           <span className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{deal.productCode}</span>
                           {deal.createdAt && (
                             <span className="text-[9px] font-bold text-slate-300 ml-1">Posted: {formatTimeAgo(deal.createdAt)}</span>
                           )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 group-hover:text-indigo-400 transition-colors">
                           {deal.brandName} • {deal.productDetails}
                        </p>
                        {boughtText && !isOut && (
                           <motion.div 
                             initial={{ opacity: 0 }}
                             animate={{ opacity: 1 }}
                             className="mt-1"
                           >
                             <span className="text-[8px] font-black text-rose-600 uppercase tracking-tight animate-pulse bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 shadow-sm inline-block">
                               {boughtText}
                             </span>
                           </motion.div>
                        )}
                     </div>
                  </div>
                </td>
                <td className="px-6 py-6 text-center">
                  <div className="flex flex-col items-center gap-2">
                     <span className={`px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                      deal.marketplace === 'Amazon' ? "bg-orange-50 text-orange-600 border border-orange-100" :
                      deal.marketplace === 'Flipkart' ? "bg-blue-50 text-blue-600 border border-blue-100" :
                      deal.marketplace === 'Meesho' ? "bg-pink-50 text-pink-600 border border-pink-100" :
                      deal.marketplace === 'Snapdeal' ? "bg-red-50 text-red-600 border border-red-100" :
                      deal.marketplace === 'Myntra' ? "bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100" :
                      deal.marketplace === 'Nykaa' ? "bg-rose-50 text-rose-600 border border-rose-100" :
                      deal.marketplace === 'Blinkit' ? "bg-yellow-50 text-yellow-700 border border-yellow-200" :
                      "bg-slate-50 text-slate-600 border border-slate-100"
                    }`}>
                      {deal.marketplace || 'N/A'}
                    </span>
                    <div className="flex items-center gap-1.5">
                       <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tight border ${deal.dealType === 'Original' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : deal.dealType === 'Exchange' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-indigo-50 text-indigo-600 border-indigo-100"}`}>
                          {deal.dealType}
                       </span>
                       <span className="text-slate-200 opacity-50">•</span>
                       <span className="text-[8px] font-black text-indigo-400/70 uppercase tracking-widest">{deal.reviewType === "SUBMITTED" ? "REVIEW SUBMITTED" : deal.reviewType}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6 text-center">
                   <div className="flex flex-col items-center gap-1.5">
                      <div className="flex items-center gap-2">
                         <div className="w-20 h-1.5 bg-indigo-50 rounded-full overflow-hidden border border-indigo-100/30">
                            <div 
                              className={`h-full transition-all duration-700 ${deal.remainingSlots === 0 ? "bg-rose-500" : (deal.remainingSlots / (deal.totalSlots || 1)) < 0.2 ? "bg-orange-500" : "bg-indigo-600"}`}
                              style={{ width: `${((deal.remainingSlots || 0) / (deal.totalSlots || 1)) * 100}%` }}
                            />
                         </div>
                         {(deal.remainingSlots || 0) > 0 && (deal.remainingSlots || 0) < 5 && (
                           <motion.span 
                             animate={{ opacity: [1, 0.5, 1], scale: [1, 1.05, 1] }} 
                             transition={{ duration: 1.5, repeat: Infinity }}
                             className="text-[7px] font-black italic text-rose-500 uppercase tracking-tighter bg-rose-50 px-1 py-0.5 rounded border border-rose-100"
                           >
                              Hurry Up!
                           </motion.span>
                         )}
                         {(deal.remainingSlots || 0) <= 0 && isAdm && (
                            <span className="text-[7px] font-black bg-rose-600 text-white px-2 py-0.5 rounded uppercase tracking-tighter">Stock Completed</span>
                         )}
                      </div>
                      
                      {isAdm || role === 'MEDIATOR' ? (
                        <div className="flex flex-col gap-1">
                           <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 justify-center">
                              {deal.reviewSlots > 0 && (
                                <>
                                  <span className="text-[9px] font-black text-slate-400">R:</span>
                                  <span className="text-[9px] font-black text-slate-900">{deal.remainingReview || 0} / {deal.reviewSlots || 0}</span>
                                </>
                              )}
                              {deal.ratingSlots > 0 && (
                                <>
                                  <span className="text-[9px] font-black text-slate-400 ml-1">RT:</span>
                                  <span className="text-[9px] font-black text-slate-900">{deal.remainingRating || 0} / {deal.ratingSlots || 0}</span>
                                </>
                              )}
                              {deal.onlyOrderSlots > 0 && (
                                <>
                                  <span className="text-[9px] font-black text-slate-400 ml-1">O:</span>
                                  <span className="text-[9px] font-black text-slate-900">{deal.remainingOnly || 0} / {deal.onlyOrderSlots || 0}</span>
                                </>
                              )}
                              {deal.submittedSlots > 0 && (
                                <>
                                  <span className="text-[9px] font-black text-slate-400 ml-1">RS:</span>
                                  <span className="text-[9px] font-black text-slate-900">{deal.remainingSubmitted || 0} / {deal.submittedSlots || 0}</span>
                                </>
                              )}
                           </div>
                           <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest text-center">Total: {deal.remainingSlots || 0} left</span>
                        </div>
                      ) : (
                        <span className={`text-[10px] font-black uppercase tracking-tighter ${deal.remainingSlots === 0 ? "text-rose-500" : "text-emerald-600"}`}>
                           {deal.remainingSlots > 0 ? "Stocks Available" : "Out of Stock"}
                        </span>
                      )}
                   </div>
                </td>
                {role !== 'USER' && (
                  <td className="px-6 py-6 text-center">
                     {deal.displayPayout !== undefined ? (
                        <div className="flex flex-col items-center">
                           <div className="flex items-center gap-1.5">
                              <span className={`text-[11px] font-black transition-colors ${(deal.displayPayout || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {(deal.displayPayout || 0) >= 0 ? '+' : '-'}₹{Math.abs(deal.displayPayout || 0)}
                              </span>
                           </div>
                           <div className="flex flex-col items-center mt-1">
                              <span className={`text-[8px] font-black uppercase tracking-wider ${(deal.displayPayout || 0) >= 0 ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
                                 {(deal.displayPayout || 0) >= 0 ? 'Price + Comm.' : 'Price - Less'}
                              </span>
                              {role === 'ADMIN' && deal.juhiCommission !== undefined && (
                                 <span className="text-[7px] font-bold text-indigo-400 uppercase mt-0.5 px-1.5 py-0.5 bg-indigo-50 rounded-md">
                                    Juhi's Less: ₹{deal.juhiCommission}
                                 </span>
                              )}
                           </div>
                        </div>
                     ) : (
                        <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest italic">Protected</span>
                     )}
                  </td>
                )}
                <td className="px-6 py-6 text-center">
                   {deal.productLink ? (
                      <div className="flex flex-col items-center gap-1">
                         <a 
                        href={deal.productLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="h-10 w-10 mx-auto rounded-xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm group/btn"
                      >
                         <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </a>
                                          <span className="text-[7px] font-black uppercase text-indigo-400/70 tracking-widest group-hover:text-indigo-600">View Link</span>
                    </div>
                 ) : (
                      <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest italic">Private</span>
                   )}
                </td>
              {!isAdm && (
                <td className="px-6 py-6 text-center">
                  {(() => {
                    const displayRemark = role === 'USER' ? deal.userRemarks : deal.mediatorRemarks;
                    return displayRemark ? (
                      <div className="relative group/remark flex justify-center">
                        <button 
                          className={`h-9 w-9 rounded-full flex items-center justify-center transition-all ${role === 'USER' ? "bg-indigo-50 text-indigo-500 hover:bg-indigo-100" : "bg-amber-50 text-amber-500 hover:bg-amber-100"}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            // If we want a simple clickable popup, we could use a state, 
                            // but a hover tooltip is often cleaner for "Info".
                            // Let's implement a premium hover-based tooltip since the user suggested hover.
                          }}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        
                        {/* Premium Hover Card */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 opacity-0 invisible group-hover/remark:opacity-100 group-hover/remark:visible transition-all duration-300 z-[110] translate-y-2 group-hover/remark:translate-y-0">
                          <div className={`rounded-2xl p-4 shadow-2xl border ${role === 'USER' ? "bg-white border-indigo-100" : "bg-white border-amber-100"}`}>
                            <div className="flex items-center gap-2 mb-2">
                               <div className={`h-2 w-2 rounded-full ${role === 'USER' ? "bg-indigo-500" : "bg-amber-500"}`} />
                               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Deal Remarks</span>
                            </div>
                            <p className="text-[11px] font-medium leading-relaxed text-slate-600 text-left italic">
                               "{displayRemark}"
                            </p>
                            {/* Arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent border-t-white" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[9px] font-black text-slate-200 uppercase tracking-widest italic opacity-40">None</span>
                    );
                  })()}
                </td>
              )}
                <td className="px-6 py-6 text-center">
                   <div className="flex items-center justify-center gap-3">
                      {role === 'USER' ? (
                        <>
                          {deal.remainingSlots > 0 ? (
                            <Link 
                              href={`/app/orders/new?brand=${encodeURIComponent(deal.brandName)}&product=${deal.productCode}&dealType=${deal.dealType}`}
                              className="px-6 h-10 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-indigo-600/20"
                            >
                               <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                               Fill Form
                            </Link>
                          ) : (
                            <div className="px-6 h-10 bg-slate-50 border border-slate-100 text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 cursor-not-allowed">
                               <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                               Unavailable
                            </div>
                          )}
                        </>
                      ) : isAdm ? (
                        <>
                          {isArchived ? (
                            <button 
                              onClick={() => {
                                setDealToEdit({
                                  ...deal,
                                  commission: deal.commission ?? (deal.dealType === 'Empty Box' ? 0 : deal.displayPayout),
                                  juhiCommission: deal.juhiCommission ?? 0,
                                  totalSlots: deal.totalSlots ?? 0,
                                  productLink: deal.productLink ?? "",
                                  userRemarks: deal.userRemarks ?? "",
                                  mediatorRemarks: deal.mediatorRemarks ?? ""
                                });
                                setShowEditModal(true);
                              }}
                              className="px-4 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 hover:bg-amber-500 hover:text-white transition-all shadow-sm group/restore text-[10px] font-black uppercase tracking-widest gap-2"
                              title="Make Deal Live Again"
                            >
                               <svg className="w-4 h-4 group-hover/restore:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                               Restore
                            </button>
                          ) : (
                            <>
                              <button 
                                onClick={() => {
                                  setDealToEdit({
                                    ...deal,
                                    commission: deal.commission ?? (deal.dealType === 'Empty Box' ? 0 : deal.displayPayout),
                                    juhiCommission: deal.juhiCommission ?? 0,
                                    totalSlots: deal.totalSlots ?? 0,
                                    productLink: deal.productLink ?? "",
                                    userRemarks: deal.userRemarks ?? "",
                                    mediatorRemarks: deal.mediatorRemarks ?? ""
                                  });
                                  setShowEditModal(true);
                                }}
                                className="h-10 w-10 rounded-xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-500 hover:bg-indigo-600 hover:text-white transition-all shadow-sm group/edit"
                                title="Edit Deal Economics & Stock"
                              >
                                 <svg className="w-4 h-4 group-hover/edit:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                              <button 
                                onClick={() => {
                                  setDealToDelete(deal);
                                  setShowDeleteModal(true);
                                }}
                                className="h-10 w-10 rounded-xl bg-white border border-rose-100 flex items-center justify-center text-rose-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm group/purge"
                                title="Delete Deal"
                              >
                                 <svg className="w-4 h-4 group-hover/purge:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </>
                          )}
                        </>
                      ) : (
                        <button 
                          onClick={() => handleWhatsAppShare(deal)}
                          className="px-6 h-10 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-emerald-600/20"
                        >
                           <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.393 0 12.03c0 2.122.554 4.197 1.613 6.06L0 24l6.117-1.605a11.803 11.803 0 005.925 1.586h.005c6.632 0 12.028-5.396 12.033-12.034a11.846 11.846 0 00-3.486-8.417z"/></svg>
                           Share
                        </button>
                      )}
                   </div>
                </td>
              </tr>
              );
            })}
            {paginatedDeals.length === 0 && (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center">
                  <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">No manifestations found matching your criteria</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Desktop Pagination Footer */}
      <div className="hidden md:flex flex-col md:flex-row items-center justify-between gap-6 px-4">
        <div className="flex items-center gap-4">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
             SHOWING <span className="text-indigo-600">{paginatedDeals.length}</span> OF <span className="text-slate-900">{filteredDeals.length}</span> DEALS
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
             {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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

      <div className="md:hidden">
        <MobileActiveDeals 
          deals={paginatedDeals} 
          loading={loading}
          isAdm={isAdm} 
          role={role || 'USER'} 
          onRefresh={onRefresh} 
          brandFilter={brandFilter}
          setBrandFilter={setBrandFilter}
          uniqueBrands={uniqueBrands}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
        />
      </div>

      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-[2px]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-xl bg-white rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden border border-slate-100 ring-1 ring-black/5"
            >
              <div className="p-8 md:p-12 text-center space-y-8">
                <div className="flex justify-center gap-4">
                   <div className="h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center border-2 border-amber-100 shadow-sm">
                      <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                   </div>
                   <div className="h-16 w-16 bg-rose-50 rounded-2xl flex items-center justify-center border-2 border-rose-100 shadow-sm">
                      <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                   </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Manage Manifest Lifecycle</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-4">
                    Choose the termination protocol for <span className="text-indigo-600">[{dealToDelete?.productCode}]</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {/* Archive Option */}
                   <button 
                     onClick={() => handleDelete("archive")}
                     className="group p-6 rounded-[32px] bg-slate-50 border border-slate-200 text-left hover:bg-white hover:border-amber-400 hover:shadow-xl hover:shadow-amber-400/10 transition-all duration-300"
                   >
                      <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                         <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 uppercase mb-1">Archive Deal</h4>
                      <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">
                         Sets stock to <span className="text-amber-600">ZERO</span> but keeps the product code in registry.
                      </p>
                   </button>

                   {/* Delete Option */}
                   <button 
                     onClick={() => handleDelete("delete")}
                     className="group p-6 rounded-[32px] bg-slate-50 border border-slate-200 text-left hover:bg-white hover:border-rose-400 hover:shadow-xl hover:shadow-rose-400/10 transition-all duration-300"
                   >
                      <div className="h-10 w-10 bg-rose-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                         <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" /></svg>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 uppercase mb-1">Delete Deal</h4>
                      <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">
                         <span className="text-rose-600">PURGES</span> everything from registry. Cannot be undone.
                      </p>
                   </button>
                </div>

                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-slate-600 transition-colors"
                >
                  Cancel Protocol
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6 bg-slate-950/40 backdrop-blur-[2px]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-3xl bg-white rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden border border-slate-100 ring-1 ring-black/5"
            >
              <div className="p-5 md:p-8 space-y-5">
                <div className="flex justify-between items-center -mt-2">
                  <div className="space-y-0.5">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Edit Economics</h3>
                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest leading-none">
                       [{dealToEdit?.productCode}] Global Adjustment
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowEditModal(false)}
                    className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100 hover:bg-indigo-100 transition-colors"
                  >
                    <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-5">
                  {/* Left Column: Stats & Links */}
                  <div className="space-y-5">
                    <div className="space-y-3 p-5 bg-slate-50/50 rounded-[28px] border border-slate-100">
                       <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Stock Configuration
                       </h4>
                       <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <div className="flex justify-between items-center px-1">
                               <label className="text-[8px] font-black uppercase text-slate-400">Review</label>
                               <span className="text-[8px] font-black text-indigo-500 uppercase">{dealToEdit?.remainingReview || 0} Left</span>
                            </div>
                            <input 
                               type="number"
                               className="w-full h-10 bg-white border-2 border-slate-200 rounded-lg px-3 text-xs font-black text-slate-900 outline-none focus:border-indigo-500 transition-all font-mono"
                               value={dealToEdit?.reviewSlots || ""}
                               onChange={(e) => setDealToEdit({ ...dealToEdit, reviewSlots: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center px-1">
                               <label className="text-[8px] font-black uppercase text-slate-400">Rating</label>
                               <span className="text-[8px] font-black text-indigo-500 uppercase">{dealToEdit?.remainingRating || 0} Left</span>
                            </div>
                            <input 
                               type="number"
                               className="w-full h-10 bg-white border-2 border-slate-200 rounded-lg px-3 text-xs font-black text-slate-900 outline-none focus:border-indigo-500 transition-all font-mono"
                               value={dealToEdit?.ratingSlots || ""}
                               onChange={(e) => setDealToEdit({ ...dealToEdit, ratingSlots: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center px-1">
                               <label className="text-[8px] font-black uppercase text-slate-400">Order</label>
                               <span className="text-[8px] font-black text-indigo-500 uppercase">{dealToEdit?.remainingOnly || 0} Left</span>
                            </div>
                            <input 
                               type="number"
                               className="w-full h-10 bg-white border-2 border-slate-200 rounded-lg px-3 text-xs font-black text-slate-900 outline-none focus:border-indigo-500 transition-all font-mono"
                               value={dealToEdit?.onlyOrderSlots || ""}
                               onChange={(e) => setDealToEdit({ ...dealToEdit, onlyOrderSlots: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center px-1">
                               <label className="text-[8px] font-black uppercase text-slate-400">Review Submitted</label>
                               <span className="text-[8px] font-black text-indigo-500 uppercase">{dealToEdit?.remainingSubmitted || 0} Left</span>
                            </div>
                            <input 
                               type="number"
                               className="w-full h-10 bg-white border-2 border-slate-200 rounded-lg px-3 text-xs font-black text-slate-900 outline-none focus:border-indigo-500 transition-all font-mono"
                               value={dealToEdit?.submittedSlots || ""}
                               onChange={(e) => setDealToEdit({ ...dealToEdit, submittedSlots: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                            />
                          </div>
                       </div>
                       <div className="flex items-center justify-between px-1">
                          <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Total Active Stock</span>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">{(dealToEdit?.remainingReview || 0) + (dealToEdit?.remainingRating || 0) + (dealToEdit?.remainingOnly || 0) + (dealToEdit?.remainingSubmitted || 0)} Left</span>
                             <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">{(dealToEdit?.reviewSlots || 0) + (dealToEdit?.ratingSlots || 0) + (dealToEdit?.onlyOrderSlots || 0) + (dealToEdit?.submittedSlots || 0)} Total</span>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-1">Marketplace Link</label>
                      <input 
                         type="text"
                         placeholder="https://..."
                         className="w-full h-11 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 text-xs font-black text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                         value={dealToEdit?.productLink || ''}
                         onChange={(e) => setDealToEdit({ ...dealToEdit, productLink: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Right Column: Remarks & Payouts */}
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-indigo-400 tracking-widest pl-1 leading-none">User Remarks</label>
                        <textarea 
                           className="w-full h-20 lg:h-24 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-xs font-black text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner resize-none"
                           placeholder="External..."
                           value={dealToEdit?.userRemarks || ""}
                           onChange={(e) => setDealToEdit({ ...dealToEdit, userRemarks: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-amber-500 tracking-widest pl-1 leading-none">Internal Notes</label>
                        <textarea 
                           className="w-full h-20 lg:h-24 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-xs font-black text-slate-900 outline-none focus:border-amber-500 focus:bg-white transition-all shadow-inner resize-none"
                           placeholder="Internal..."
                           value={dealToEdit?.mediatorRemarks || ""}
                           onChange={(e) => setDealToEdit({ ...dealToEdit, mediatorRemarks: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="p-5 bg-slate-50/50 rounded-[28px] border border-slate-100 space-y-3">
                       <div className="flex items-center justify-between">
                          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                             <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Payout Adjustment
                          </h4>
                          <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest bg-white px-2 py-1 rounded-full border border-indigo-50">
                             (+) Comm | (-) Less
                          </span>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className={`text-[8px] font-black uppercase tracking-widest pl-1 ${(dealToEdit?.commission || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              Std Rate
                            </label>
                            <input 
                               type="number"
                               className={`w-full h-11 bg-white border-2 rounded-xl px-4 text-xs font-black outline-none transition-all shadow-inner ${
                                 (dealToEdit?.commission || 0) >= 0 ? 'border-emerald-100 focus:border-emerald-500 text-emerald-900' : 'border-rose-100 focus:border-rose-500 text-rose-900'
                               }`}
                               value={dealToEdit?.commission ?? ''}
                               onChange={(e) => setDealToEdit({ ...dealToEdit, commission: e.target.value === '' ? '' : parseInt(e.target.value) })}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className={`text-[8px] font-black uppercase tracking-widest pl-1 ${(dealToEdit?.juhiCommission || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              Juhi Rate
                            </label>
                            <input 
                               type="number"
                               className={`w-full h-11 bg-white border-2 rounded-xl px-4 text-xs font-black outline-none transition-all shadow-inner ${
                                 (dealToEdit?.juhiCommission || 0) >= 0 ? 'border-emerald-100 focus:border-emerald-500 text-emerald-900' : 'border-rose-100 focus:border-rose-500 text-rose-900'
                               }`}
                               value={dealToEdit?.juhiCommission ?? ''}
                               onChange={(e) => setDealToEdit({ ...dealToEdit, juhiCommission: e.target.value === '' ? '' : parseInt(e.target.value) })}
                            />
                          </div>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-100">
                  <button 
                    onClick={() => setShowEditModal(false)}
                    className="w-full lg:w-40 h-11 bg-slate-50 text-slate-500 font-bold text-[9px] uppercase tracking-widest rounded-xl border border-slate-200 hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleEdit({
                      reviewSlots: parseInt(dealToEdit.reviewSlots as any) || 0,
                      ratingSlots: parseInt(dealToEdit.ratingSlots as any) || 0,
                      onlyOrderSlots: parseInt(dealToEdit.onlyOrderSlots as any) || 0,
                      submittedSlots: parseInt(dealToEdit.submittedSlots as any) || 0,
                      commission: parseInt(dealToEdit.commission as any) || 0,
                      juhiCommission: parseInt(dealToEdit.juhiCommission as any) || 0,
                      productLink: dealToEdit.productLink,
                      userRemarks: dealToEdit.userRemarks,
                      mediatorRemarks: dealToEdit.mediatorRemarks,
                      ...(isArchived ? { isActive: true } : {})
                    })}
                    className="flex-1 h-11 bg-indigo-600 text-white font-black text-[9px] uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:scale-[1.01] active:scale-95 transition-all"
                  >
                    {isArchived ? "Make Deal Live Again" : "Save & Sync Globally"}
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
