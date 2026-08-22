"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { formatTimeAgo } from "@/utils/formatTimeAgo";
import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";

interface MobileActiveDealsProps {
  deals: any[];
  loading?: boolean;
  isAdm: boolean;
  role: string;
  onRefresh: () => void;
  brandFilter: string;
  setBrandFilter: (val: string) => void;
  uniqueBrands: string[];
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
}

export function MobileActiveDeals({ 
  deals, loading, isAdm, role, onRefresh, 
  brandFilter, setBrandFilter, uniqueBrands,
  searchQuery, setSearchQuery,
  currentPage, setCurrentPage, totalPages
}: MobileActiveDealsProps) {
  const router = useRouter();
  const [selectedRemark, setSelectedRemark] = useState<string | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Stats for the mobile header
  const totalSlots = deals.reduce((sum, d) => sum + (d.remainingSlots || 0), 0);
  const urgentDeals = deals.filter(d => (d.remainingSlots || 0) > 0 && (d.remainingSlots || 0) < 5).length;

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Integrated Action Bar - Search and Filter */}
      <div className="flex items-center justify-between gap-3 p-1 rounded-[24px] bg-white border border-slate-200 shadow-sm mt-2">
         <div className="flex-1 h-11 rounded-2xl flex items-center px-4 gap-3">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Search Manifests..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-[10px] font-black text-slate-700 w-full placeholder:text-slate-300 uppercase tracking-widest"
            />
         </div>
         
         <div className="flex items-center gap-1.5 bg-blue-50/50 px-3 py-1.5 rounded-xl border border-blue-100/50">
            <span className="text-[11px] font-black text-blue-600">{deals.length}</span>
         </div>

         <button 
           onClick={() => setIsFilterDrawerOpen(true)}
           className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all ${
             brandFilter !== "All Brands" 
             ? "bg-blue-600 text-white shadow-lg" 
             : "bg-slate-50 text-slate-500 border border-slate-100 shadow-sm"
           }`}
         >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
         </button>
      </div>
      

      {/* Filter Drawer - Sync with My Orders Dashboard */}
      <AnimatePresence>
         {isFilterDrawerOpen && (
            <div className="fixed inset-0 z-[110] flex items-end justify-center p-0">
               <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 onClick={() => setIsFilterDrawerOpen(false)}
                 className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
               />
               <motion.div
                 initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                 transition={{ type: "spring", damping: 25, stiffness: 200 }}
                 className="w-full bg-white rounded-t-[40px] p-8 pb-12 relative z-10 shadow-2xl border-t border-slate-100"
               >
                  <div className="h-1.5 w-12 bg-slate-100 rounded-full mx-auto mb-8" />
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Filter Registry</h3>
                     <button onClick={() => setBrandFilter("All Brands")} className="text-[10px] font-black text-blue-600 uppercase tracking-widest underline decoration-2 underline-offset-4">Reset</button>
                  </div>
                  
                  <div className="space-y-6">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Brand Specialty</label>
                        <div className="grid grid-cols-2 gap-2">
                           {uniqueBrands.map(brand => (
                              <button
                                key={brand}
                                onClick={() => { setBrandFilter(brand); setIsFilterDrawerOpen(false); }}
                                className={`px-4 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                                   brandFilter === brand 
                                   ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20" 
                                   : "bg-slate-50 text-slate-500 border-slate-100"
                                }`}
                              >
                                 {brand === "All Brands" ? "Global Market" : brand}
                              </button>
                           ))}
                        </div>
                     </div>
                  </div>
                  
                  <button 
                    onClick={() => setIsFilterDrawerOpen(false)}
                    className="w-full h-16 bg-blue-600 text-white rounded-[24px] text-[11px] font-black uppercase tracking-widest mt-10 active:scale-95 transition-all shadow-xl shadow-blue-600/20"
                  >
                     Apply Manifest
                  </button>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* Manifestation Cards */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={`mob-skeleton-${i}`} className="bg-white rounded-[32px] p-5 border border-slate-100 shadow-sm animate-pulse">
              <div className="flex gap-4">
                <Skeleton className="h-20 w-20 rounded-2xl" />
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-3 w-32" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-2 w-full" />
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <Skeleton className="h-2 w-10" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-11 w-28 rounded-2xl" />
                </div>
              </div>
            </div>
          ))
        ) : deals.map((deal, idx) => {
          const isHurry = deal.remainingSlots > 0 && deal.remainingSlots < 4;
          const isLimited = deal.remainingSlots >= 4 && deal.remainingSlots < 7;
          const isOut = deal.remainingSlots <= 0;
          
          const consumedSlots = (deal.totalSlots || 0) - (deal.remainingSlots || 0);
          const isHotDeal = deal.createdAt && (Date.now() - new Date(deal.createdAt).getTime() < 24 * 60 * 60 * 1000);
          
          let boughtText = "";
          if (consumedSlots > 10) {
            boughtText = "🔥 Trending";
          }

          const getStockStatus = () => {
            if (isOut) return { text: "Out of Stock", style: "bg-rose-50 text-rose-500 border-rose-100" };
            if (isHurry) return { text: "Hurry up! Few slots left only", style: "bg-rose-50 text-rose-600 border-rose-200 animate-pulse shadow-sm" };
            if (isLimited) return { text: "Limited Stock", style: "bg-orange-50 text-orange-600 border-orange-200" };
            return { text: "Stock Available", style: "bg-emerald-50 text-emerald-600 border-emerald-100" };
          };

          const status = getStockStatus();
          return (
            <motion.div 
              key={deal._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => router.push(`/app/activedeals/${deal.productCode || deal._id}`)}
              className="relative bg-white rounded-[32px] p-5 border border-slate-100 shadow-sm overflow-hidden group active:scale-[0.98] transition-all cursor-pointer hover:border-indigo-200"
            >
              {/* Background Accent */}
              <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-[0.03] pointer-events-none -mr-10 -mt-10 ${isOut ? 'bg-rose-500' : 'bg-blue-500'}`} />

              {/* Hot Deal Badge */}
              {isHotDeal && !isOut && (
                <div className="absolute top-0 left-0 bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-br-2xl shadow-md z-10">
                   HOT DEAL
                </div>
              )}

              <div className={`flex gap-4 ${isHotDeal && !isOut ? 'mt-3' : ''}`}>
                {/* Product Image / Icon */}
                <div className="relative flex-shrink-0">
                  <div className="h-20 w-20 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shadow-inner">
                    {deal.productImage ? (
                      <img 
                        src={deal.productImage?.includes('cloudinary.com') ? deal.productImage.replace('/image/upload/', '/image/upload/q_auto,f_auto,w_250,c_fill/') : deal.productImage} 
                        alt="" 
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-opacity duration-500 ease-in-out" 
                        onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                        style={{ opacity: 0 }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                    )}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${isOut ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                    <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  </div>
                </div>

                {/* Core Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/app/activedeals/${deal.productCode || deal._id}`} className="text-[13px] font-black text-slate-900 uppercase tracking-tight break-all leading-tight hover:text-blue-600 transition-colors">
                      {deal.productCode}
                    </Link>
                    <span className="text-[8px] font-black text-slate-300 uppercase whitespace-nowrap mt-1 shrink-0">{formatTimeAgo(deal.createdAt)}</span>
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">{deal.brandName}</p>
                  
                  {deal.productDetails && (
                     <Link href={`/app/activedeals/${deal.productCode || deal._id}`} className="text-[10px] font-black text-slate-700 uppercase tracking-tight mt-1 leading-relaxed break-words line-clamp-2 block hover:text-blue-600 transition-colors">
                       {deal.productDetails}
                     </Link>
                   )}
                  
                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tight border ${
                      deal.dealType === 'Original' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                      deal.dealType === 'Exchange' ? "bg-blue-50 text-blue-600 border-blue-100" : 
                      "bg-indigo-50 text-indigo-600 border-indigo-100"
                    }`}>
                      {deal.dealType}
                    </span>
                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{deal.marketplace}</span>
                    <span className="text-slate-200 opacity-50">•</span>
                    <span className="text-[8px] font-black text-indigo-400/70 uppercase tracking-widest">{deal.reviewType === "SUBMITTED" ? "REVIEW SUBMITTED" : deal.reviewType}</span>
                  </div>
                </div>
              </div>

              {/* Manifest Details Context Row */}
              <div className="mt-4 flex items-center justify-between px-1">
                 <div className="flex items-center gap-3">
                    <Link href={`/app/activedeals/${deal.productCode || deal._id}`} className="flex items-center gap-1.5 group/link">
                       <div className="h-7 w-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center border border-indigo-100 group-hover/link:bg-indigo-600 group-hover/link:text-white transition-all">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                       </div>
                       <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">View Page</span>
                    </Link>

                    {deal.productLink && (
                       <a href={deal.productLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 group/link">
                          <div className="h-7 w-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center border border-blue-100 group-hover/link:bg-blue-600 group-hover/link:text-white transition-all">
                             <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          </div>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Link</span>
                       </a>
                    )}
                    <div 
                      className="flex items-center gap-1.5 cursor-pointer" 
                      onClick={(e) => {
                        e.stopPropagation();
                        const remarks = (role === 'ADMIN' || role === 'MEDIATOR') ? deal.mediatorRemarks : deal.userRemarks;
                        const fallback = "No Remarks added by Admin yet.";
                        setSelectedRemark(remarks || fallback);
                      }}
                    >
                       {(() => {
                         const remarks = (role === 'ADMIN' || role === 'MEDIATOR') ? deal.mediatorRemarks : deal.userRemarks;
                         const hasRemark = Boolean(remarks && remarks.trim().length > 0);
                         return (
                           <>
                             <div className={`h-7 w-7 rounded-lg flex items-center justify-center border active:scale-90 transition-all duration-300 ${hasRemark ? "relative overflow-hidden bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-[0_5px_15px_rgba(245,158,11,0.5),inset_0_2px_4px_rgba(255,255,255,0.4)] border-amber-300/50 animate-[bounce_2s_infinite]" : "bg-indigo-50 text-indigo-400 border-indigo-100"}`}>
                                {hasRemark && <div className="absolute inset-0 bg-white/20 blur-sm animate-[spin_3s_linear_infinite]" />}
                                <svg className={`w-4 h-4 relative z-10 ${hasRemark ? "drop-shadow-md animate-pulse" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                             </div>
                             <span className={`text-[8px] font-black uppercase tracking-widest ${hasRemark ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600 font-extrabold drop-shadow-sm" : "text-slate-400"}`}>Remarks</span>
                           </>
                         );
                       })()}
                    </div>
                 </div>
              </div>

              {/* Stock Bar & Payout */}
              <div className="mt-5 space-y-3">
                {boughtText && !isOut && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1.5 -mb-1"
                  >
                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-tight animate-pulse bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                      {boughtText}
                    </span>
                  </motion.div>
                )}

                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">STOCKS</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tight border ${status.style}`}>
                    {status.text}
                  </span>
                </div>
                
                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(deal.remainingSlots / deal.totalSlots) * 100}%` }}
                    className={`h-full rounded-full transition-all duration-1000 ${isOut ? 'bg-rose-500' : isHurry ? 'bg-rose-600' : isLimited ? 'bg-orange-500' : 'bg-blue-600'}`}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  {role !== 'USER' ? (
                    <div className="flex flex-col">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Amount</p>
                      {deal.displayPayout === "N/A" ? (
                        <p className="text-xs font-black text-indigo-600 mt-1">N/A</p>
                      ) : Number(deal.displayPayout) === 0 ? (
                        <p className="text-xs font-black text-emerald-600 mt-1">Full Refund</p>
                      ) : (
                        <p className={`text-base font-black tracking-tighter mt-1 ${Number(deal.displayPayout) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {Number(deal.displayPayout) >= 0 ? '+' : '-'}₹{Math.abs(Number(deal.displayPayout))}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-none">Comm./Less</p>
                      <div className="flex items-center gap-1.5 mt-1 bg-indigo-50/50 px-2 py-1 rounded-xl border border-indigo-100 shadow-sm self-start">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        {deal.juhiCommission === undefined || deal.juhiCommission === null || deal.juhiCommission === "N/A" ? (
                          <span className="text-xs font-black text-indigo-600">Ask Juhi</span>
                        ) : Number(deal.juhiCommission) === 0 ? (
                          <span className="text-xs font-black text-emerald-600">Full Refund</span>
                        ) : (
                          <span className={`text-xs font-black ${Number(deal.juhiCommission) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {Number(deal.juhiCommission) >= 0 ? '+' : '-'}₹{Math.abs(Number(deal.juhiCommission))}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {role === 'USER' ? (
                      deal.remainingSlots > 0 ? (
                        <Link 
                          href={`/app/orders/new?brand=${encodeURIComponent(deal.brandName)}&product=${deal.productCode}&dealType=${deal.dealType}`}
                          className="h-11 px-6 bg-blue-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                        >
                          Fill Form
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        </Link>
                      ) : (
                        <div className="h-11 px-6 bg-slate-50 border border-slate-100 text-slate-300 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed">
                          Sold Out
                        </div>
                      )
                    ) : (
                      <button 
                        onClick={async () => {
                          const directUrl = typeof window !== 'undefined' ? `${window.location.origin}/app/activedeals/${deal.productCode || deal._id}` : '';
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
                            `✨ *Claim Deal Link:* ${directUrl}`,
                            `*Click link above to view details & claim cashback!* 🚀`
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
                          
                          window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                        }}
                        className="h-11 px-6 bg-emerald-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                      >
                         Share
                         <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.393 0 12.03c0 2.122.554 4.197 1.613 6.06L0 24l6.117-1.605a11.803 11.803 0 005.925 1.586h.005c6.632 0 12.028-5.396 12.033-12.034a11.846 11.846 0 00-3.486-8.417z"/></svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Premium Fixed-Bottom Pagination for Mobile */}
      {totalPages >= 1 && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-md border-t border-slate-100 flex flex-col items-center py-2 px-6 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
           {/* Status Indicator */}
           <div className="flex items-center gap-3 mb-2">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                PAGE <span className="text-slate-900">{currentPage}</span> OF <span className="text-slate-900">{totalPages}</span>
              </p>
              <div className="h-1 w-1 rounded-full bg-slate-200" />
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                <span className="text-slate-900">{deals.length}</span> MANIFESTS
              </p>
           </div>

           {totalPages >= 1 && (
              <div className="flex items-center gap-1 bg-slate-900 rounded-full p-1 shadow-lg">
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
                            layoutId="fixedBottomPagePill"
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

      {/* Remarks Modal */}
      <AnimatePresence>
         {selectedRemark && (
            <div className="fixed inset-0 z-[120] flex items-end justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
               <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="w-full max-w-sm bg-white rounded-[32px] p-8 pb-10 shadow-2xl relative"
               >
                  <div className="h-1.5 w-12 bg-slate-100 rounded-full mx-auto mb-6" />
                  <div className="flex items-center gap-4 mb-4">
                     <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     </div>
                     <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                        {(role === 'ADMIN' || role === 'MEDIATOR') ? "Specialist Remarks" : "Buyer Remarks"}
                     </h3>
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight bg-slate-50 p-5 rounded-2xl border border-slate-100">
                     {selectedRemark}
                  </p>
                  <button 
                     onClick={() => setSelectedRemark(null)}
                     className="w-full h-14 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest mt-6 active:scale-95 transition-all shadow-lg shadow-slate-900/20"
                  >
                     Got it, Close
                  </button>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {deals.length === 0 && (
        <div className="py-20 text-center">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No active manifests found</p>
        </div>
      )}
    </div>
  );
}
