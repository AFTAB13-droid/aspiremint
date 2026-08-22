"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatTimeAgo } from "@/utils/formatTimeAgo";
import { 
  ArrowLeft, Share2, Copy, Check, ExternalLink, Sparkles, 
  Flame, ShoppingBag, Info, AlertTriangle, MessageSquare, 
  Clock, Tag, ShieldCheck, DollarSign, Send
} from "lucide-react";

export default function SingleDealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  const dealId = params?.id as string;
  const role = (session?.user as any)?.role || "USER";
  const isAdm = role === "ADMIN";
  const isMediator = role === "MEDIATOR";

  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (dealId) {
      fetchDealDetails();
    }
  }, [dealId]);

  const fetchDealDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/deals/active/${dealId}?v=${Date.now()}`);
      const json = await res.json();
      if (json.success) {
        if (!json.data.isActive && role !== "ADMIN") {
          toast.error("This campaign has been archived and is no longer available.");
          router.push("/app/activedeals");
          return;
        }
        setDeal(json.data);
      } else {
        if (role !== "ADMIN") {
          toast.error("This campaign has been archived and is no longer available.");
          router.push("/app/activedeals");
          return;
        }
        toast.error(json.message || "Failed to load deal details");
      }
    } catch (err) {
      toast.error("Network error loading deal");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreDeal = async () => {
    if (!deal) return;
    const loadingId = toast.loading("Restoring deal to live...");
    try {
      const res = await fetch(`/api/deals/active/${deal._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Deal restored to live!", { id: loadingId });
        fetchDealDetails();
      } else {
        toast.error(json.message || "Failed to restore deal", { id: loadingId });
      }
    } catch (err) {
      toast.error("Failed to restore deal", { id: loadingId });
    }
  };

  const getShareableUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/app/activedeals/${deal?.productCode || deal?._id || dealId}`;
    }
    return "";
  };

  const handleCopyLink = () => {
    const url = getShareableUrl();
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Deal link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = async () => {
    if (!deal) return;
    const directUrl = getShareableUrl();
    const messageParts = [
      deal.productImage ? `🖼️ *Preview:* ${deal.productImage}` : null,
      `🔥 *EXCLUSIVE DEAL ALERT!* 🔥`,
      `📦 *Product:* ${deal.productDetails}`,
      `🏷️ *Code:* ${deal.productCode}`,
      `🏢 *Brand:* ${deal.brandName}`,
      `🛒 *Marketplace:* ${deal.marketplace}`,
      `📋 *Deal Type:* ${deal.dealType}`,
      `⭐ *Review Type:* ${deal.reviewType === "SUBMITTED" ? "REVIEW SUBMITTED" : deal.reviewType}`,
      `💰 *Less/Commission:* ₹________`,
      deal.productLink ? `🔗 *Product Link:* ${deal.productLink}` : null,
      `✨ *Claim Deal Link:* ${directUrl}`,
      `*Click the link above to view details & claim cashback now!* 🚀`
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
      console.log("Native share bypassed, opening WhatsApp web/app link.", err);
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <Skeleton className="h-[420px] w-full rounded-[36px]" />
          </div>
          <div className="lg:col-span-7 space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="max-w-xl mx-auto my-20 p-10 bg-white rounded-[36px] border border-slate-100 shadow-xl text-center space-y-6">
        <div className="h-20 w-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Deal Manifest Not Found</h2>
          <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">The deal link may have expired or been removed from active inventory.</p>
        </div>
        <button
          onClick={() => router.push("/app/activedeals")}
          className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all"
        >
          Return to Active Deals
        </button>
      </div>
    );
  }

  const isHotDeal = deal.createdAt && (Date.now() - new Date(deal.createdAt).getTime() < 24 * 60 * 60 * 1000);
  const consumedSlots = (deal.totalSlots || 0) - (deal.remainingSlots || 0);
  const isOut = deal.remainingSlots <= 0;
  const isHurry = deal.remainingSlots > 0 && deal.remainingSlots < 4;
  const isLimited = deal.remainingSlots >= 4 && deal.remainingSlots < 7;

  let boughtText = "";
  if (consumedSlots >= 50) {
    boughtText = "🔥 50+ users bought this deal";
  } else if (consumedSlots >= 10) {
    boughtText = `🔥 ${consumedSlots} users bought this deal`;
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-3 sm:py-6 pb-28 space-y-4 sm:space-y-8 overflow-x-hidden">
      {/* Dynamic Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 backdrop-blur-md p-3.5 sm:p-5 rounded-[24px] sm:rounded-[28px] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 2 && document.referrer && document.referrer.includes(window.location.host)) {
                router.back();
              } else {
                router.push("/app/activedeals");
              }
            }}
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all active:scale-95 shadow-sm shrink-0"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <Link href="/app/activedeals" className="hover:text-indigo-600 transition-colors">Active Deals</Link>
              <span>/</span>
              <span className="text-indigo-600">{deal.brandName}</span>
            </div>
            <h1 className="text-sm sm:text-base md:text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              {deal.productCode}
              {!deal.isActive && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest shadow-sm">
                  ARCHIVED
                </span>
              )}
              {isHotDeal && !isOut && deal.isActive && (
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[8px] font-black uppercase tracking-widest shadow-sm">
                  HOT DEAL
                </span>
              )}
            </h1>
          </div>
        </div>

        {/* Quick Action Pills (Only shown to Admin and Mediator) */}
        {role !== 'USER' && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {!deal.isActive && isAdm && (
              <button
                onClick={handleRestoreDeal}
                className="h-10 sm:h-11 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
              >
                Restore Deal
              </button>
            )}

            <button
              onClick={handleCopyLink}
              className="h-10 sm:h-11 px-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied Link" : "Copy Link"}
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="h-10 sm:h-11 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              Share Deal
            </button>
          </div>
        )}
      </div>

      {/* Main Single Deal View Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8">
        
        {/* Left Section: Product Image Showcase */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-6">
          <div className="relative bg-white rounded-[32px] sm:rounded-[36px] p-4 sm:p-6 border border-slate-100 shadow-sm overflow-hidden group">
            {/* Background Accent */}
            <div className={`absolute top-0 right-0 w-48 h-48 blur-3xl opacity-10 pointer-events-none ${isOut ? 'bg-rose-500' : 'bg-indigo-500'}`} />

            <div 
              onClick={() => deal.productImage && setShowImageModal(true)}
              className="relative aspect-square w-full rounded-[28px] bg-slate-50 border border-slate-100 overflow-hidden cursor-pointer group-hover:shadow-md transition-all flex items-center justify-center"
            >
              {deal.productImage ? (
                <>
                  {!imageLoaded && (
                    <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
                    </div>
                  )}
                  <img
                    src={deal.productImage?.includes('cloudinary.com') ? deal.productImage.replace('/image/upload/', '/image/upload/q_auto,f_auto,w_800,c_limit/') : deal.productImage}
                    alt={deal.productDetails}
                    loading="eager"
                    decoding="async"
                    onLoad={() => setImageLoaded(true)}
                    className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out ${
                      imageLoaded ? "opacity-100 blur-0 scale-100" : "opacity-0 blur-lg scale-105"
                    }`}
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-300 gap-2">
                  <ShoppingBag className="w-16 h-16 opacity-30" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">No Image Preview</span>
                </div>
              )}

              {deal.productImage && (
                <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Tap to Expand
                </div>
              )}
            </div>

            {/* Quick Status Badges Row */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${
                  deal.marketplace === 'Amazon' ? "bg-orange-50 text-orange-600 border border-orange-100" :
                  deal.marketplace === 'Flipkart' ? "bg-blue-50 text-blue-600 border border-blue-100" :
                  deal.marketplace === 'Meesho' ? "bg-pink-50 text-pink-600 border border-pink-100" :
                  "bg-slate-100 text-slate-700"
                }`}>
                  {deal.marketplace}
                </span>

                <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                  deal.dealType === 'Original' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                  deal.dealType === 'Exchange' ? "bg-blue-50 text-blue-600 border-blue-100" :
                  "bg-indigo-50 text-indigo-600 border-indigo-100"
                }`}>
                  {deal.dealType}
                </span>
              </div>

              {deal.createdAt && (
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-500" />
                  {formatTimeAgo(deal.createdAt)}
                </span>
              )}
            </div>
          </div>

          {/* Product Marketplace Direct Link Card */}
          {deal.productLink && (
            <a
              href={deal.productLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-[28px] shadow-xl flex items-center justify-between group hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/10 group-hover:rotate-12 transition-transform">
                  <ExternalLink className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Marketplace Item Page</p>
                  <p className="text-sm font-black text-white uppercase tracking-tight mt-0.5">Open {deal.marketplace} Link</p>
                </div>
              </div>
              <div className="h-10 px-4 bg-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-blue-600/30">
                Visit Link
              </div>
            </a>
          )}
        </div>

        {/* Right Section: Core Specifications, Inventory & CTA */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-6">
          <div className="bg-white rounded-[32px] sm:rounded-[36px] p-5 sm:p-8 border border-slate-100 shadow-sm space-y-5 sm:space-y-6">
            
            {/* Title & Product Code Bar */}
            <div className="space-y-3 pb-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                  {deal.brandName}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Protocol: {deal.reviewType === "SUBMITTED" ? "REVIEW SUBMITTED" : deal.reviewType}
                </span>
              </div>

              <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight leading-snug">
                {deal.productDetails}
              </h2>

              <div className="flex items-center gap-3 pt-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-black text-slate-800 uppercase tracking-widest">{deal.productCode}</span>
                </div>
                {boughtText && !isOut && (
                  <span className="text-[9px] font-black text-rose-600 uppercase tracking-tight bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-100 animate-pulse">
                    {boughtText}
                  </span>
                )}
              </div>
            </div>

            {/* Inventory & Stock Real-time Tracker */}
            <div className="space-y-4 p-6 bg-slate-50/70 rounded-[28px] border border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${isOut ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`} />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Realtime Manifest Stock</h3>
                </div>

                <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                  isOut ? "bg-rose-50 text-rose-500 border-rose-100" :
                  isHurry ? "bg-rose-50 text-rose-600 border-rose-200 animate-pulse" :
                  isLimited ? "bg-orange-50 text-orange-600 border-orange-200" :
                  "bg-emerald-50 text-emerald-600 border-emerald-100"
                }`}>
                  {isOut ? "Out of Stock" : isHurry ? "Hurry Up! Few slots left" : isLimited ? "Limited Stock" : "Stock Available"}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-3 w-full bg-slate-200/60 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(0, ((deal.remainingSlots || 0) / (deal.totalSlots || 1)) * 100))}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className={`h-full rounded-full ${isOut ? 'bg-rose-500' : isHurry ? 'bg-rose-600' : isLimited ? 'bg-orange-500' : 'bg-indigo-600'}`}
                />
              </div>

              {/* Granular Breakdown (Shown only to Admin & Mediator) */}
              {role !== 'USER' ? (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <p className="text-xs font-black text-slate-700">
                    <span className="text-indigo-600 font-extrabold text-sm">{deal.remainingSlots || 0}</span> / {deal.totalSlots || 0} Total Slots Remaining
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    {deal.reviewSlots > 0 && (
                      <span className="text-[9px] font-black text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        Review: {deal.remainingReview || 0}/{deal.reviewSlots}
                      </span>
                    )}
                    {deal.ratingSlots > 0 && (
                      <span className="text-[9px] font-black text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        Rating: {deal.remainingRating || 0}/{deal.ratingSlots}
                      </span>
                    )}
                    {deal.onlyOrderSlots > 0 && (
                      <span className="text-[9px] font-black text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        Order: {deal.remainingOnly || 0}/{deal.onlyOrderSlots}
                      </span>
                    )}
                    {deal.submittedSlots > 0 && (
                      <span className="text-[9px] font-black text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        Submitted: {deal.remainingSubmitted || 0}/{deal.submittedSlots}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="pt-1 flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Realtime Availability Status
                  </p>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                    {isOut ? "Unavailable" : "Active Campaign"}
                  </span>
                </div>
              )}
            </div>

            {/* Juhi's Commission / Less Card */}
            <div className="p-5 bg-gradient-to-r from-indigo-50 to-indigo-50/30 rounded-[28px] border border-indigo-100/60 flex items-center justify-between shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Juhi's Commission / Less</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Deduction or Incentive tier</p>
              </div>
              <div className="text-right bg-white px-4 py-2 rounded-2xl border border-indigo-100 shadow-sm relative z-10 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                {deal.juhiCommission === undefined || deal.juhiCommission === null || deal.juhiCommission === 0 ? (
                  <span className="text-sm font-black text-indigo-600">Ask Juhi</span>
                ) : (
                  <span className={`text-base font-black ${deal.juhiCommission >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {deal.juhiCommission >= 0 ? '+' : '-'}₹{Math.abs(deal.juhiCommission)}
                  </span>
                )}
              </div>
            </div>

            {/* Economics & Yield Card (For Admin & Mediator) */}
            {role !== 'USER' && deal.displayPayout !== undefined && (
              <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50/50 rounded-[28px] border border-emerald-100/60 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Sponsor Yield / Mediator Payout</p>
                  <p className={`text-2xl font-black tracking-tight mt-0.5 ${deal.displayPayout >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {deal.displayPayout >= 0 ? '+' : '-'}₹{Math.abs(deal.displayPayout || 0)}
                  </p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {deal.displayPayout >= 0 ? 'Price + Commission Rate' : 'Price - Deduction'}
                  </p>
                </div>

                {isAdm && deal.juhiCommission !== undefined && (
                  <div className="text-right bg-white p-3 rounded-2xl border border-emerald-100 shadow-sm">
                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Juhi's Special Commission</p>
                    <p className="text-base font-black text-indigo-600 mt-0.5">₹{deal.juhiCommission}</p>
                  </div>
                )}
              </div>
            )}

            {/* Remarks Section */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                Campaign Instructions & Remarks
              </h3>

              {(() => {
                const remarksText = (isAdm || isMediator) ? deal.mediatorRemarks : deal.userRemarks;
                const fallbackText = (isAdm || isMediator) ? deal.userRemarks : deal.mediatorRemarks;
                const displayText = (remarksText && remarksText.trim().length > 0) ? remarksText : (fallbackText && fallbackText.trim().length > 0) ? fallbackText : "No specific remarks added by administrator for this campaign.";
                
                return (
                  <div className="p-5 bg-slate-50 rounded-[24px] border border-slate-100 relative">
                    <p className="text-xs font-bold text-slate-700 leading-relaxed uppercase tracking-tight italic">
                      "{displayText}"
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Main Action CTAs */}
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
              {role === 'USER' ? (
                deal.remainingSlots > 0 ? (
                  <Link
                    href={`/app/orders/new?brand=${encodeURIComponent(deal.brandName)}&product=${deal.productCode}&dealType=${deal.dealType}`}
                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 active:scale-95 transition-all"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    Fill Order Form Now
                  </Link>
                ) : (
                  <div className="w-full h-14 bg-slate-100 text-slate-400 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed">
                    <AlertTriangle className="w-5 h-5" />
                    Campaign Sold Out
                  </div>
                )
              ) : (
                <>
                  <Link
                    href={`/app/orders/new?brand=${encodeURIComponent(deal.brandName)}&product=${deal.productCode}&dealType=${deal.dealType}`}
                    className="w-full sm:flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 active:scale-95 transition-all"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    Fill Form For Order
                  </Link>

                  <button
                    onClick={handleWhatsAppShare}
                    className="w-full sm:w-auto h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                  >
                    <Share2 className="w-5 h-5" />
                    Share
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-slate-100 p-4 shadow-[0_-8px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-3">
          {role === 'USER' ? (
            deal.remainingSlots > 0 ? (
              <Link
                href={`/app/orders/new?brand=${encodeURIComponent(deal.brandName)}&product=${deal.productCode}&dealType=${deal.dealType}`}
                className="w-full h-12 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
              >
                Fill Order Form
                <ShoppingBag className="w-4 h-4" />
              </Link>
            ) : (
              <div className="w-full h-12 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed">
                Sold Out
              </div>
            )
          ) : (
            <>
              <Link
                href={`/app/orders/new?brand=${encodeURIComponent(deal.brandName)}&product=${deal.productCode}&dealType=${deal.dealType}`}
                className="flex-1 h-12 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
              >
                Fill Order Form
                <ShoppingBag className="w-4 h-4" />
              </Link>

              <button
                onClick={handleWhatsAppShare}
                className="h-12 w-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20 active:scale-95 transition-all shrink-0"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* High-res Image Modal Overlay */}
      <AnimatePresence>
        {showImageModal && deal.productImage && (
          <div 
            onClick={() => setShowImageModal(false)}
            className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh] bg-white rounded-[36px] overflow-hidden p-4 shadow-2xl"
            >
              <img
                src={deal.productImage}
                alt={deal.productDetails}
                className="w-full h-full max-h-[80vh] object-contain rounded-[28px]"
              />
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-6 right-6 h-10 w-10 bg-slate-900/80 text-white rounded-full flex items-center justify-center backdrop-blur-md hover:bg-slate-900 transition-colors"
              >
                ✕
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
