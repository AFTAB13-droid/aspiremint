"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Search,
  ExternalLink,
  Copy,
  Download,
  Star,
  ShieldCheck,
  Image as ImageIcon,
  ThumbsUp,
  X,
  Check,
  RefreshCw,
  ShoppingBag,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ClipboardPaste,
  Sparkles,
  Trash2,
  ArrowRight,
} from "lucide-react";

interface FlipkartReview {
  id: string;
  rating: string | number;
  title?: string;
  text?: string;
  name?: string;
  location?: string;
  date?: string;
  verified?: boolean;
  images?: string[];
  helpful?: number;
  attributes?: string;
  permalink?: string;
  ref?: string;
}

export default function ReviewFinderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialUrl = searchParams.get("url") || "";
  const linkedOrderId = searchParams.get("orderId") || "";

  const [inputUrl, setInputUrl] = useState(initialUrl);
  const [isScanning, setIsScanning] = useState(false);
  const [statusLog, setStatusLog] = useState("");
  const [reviews, setReviews] = useState<FlipkartReview[]>([]);
  const [totalPagesFound, setTotalPagesFound] = useState(0);
  const [totalReviewsCount, setTotalReviewsCount] = useState(0);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("ALL");
  const [withPhotosOnly, setWithPhotosOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "rating-high" | "rating-low" | "helpful">("recent");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Active Lightbox Image
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  // Download screenshot state
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Autofill to Refund Modal State
  const [showAutofillModal, setShowAutofillModal] = useState(false);
  const [selectedReviewForAutofill, setSelectedReviewForAutofill] = useState<FlipkartReview | null>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [attachingOrderId, setAttachingOrderId] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reviewsMapRef = useRef<Map<string, FlipkartReview>>(new Map());
  const isStoppedRef = useRef(false);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isStoppedRef.current = true;
      if (eventSourceRef.current) {
        eventSourceRef.current.onmessage = null;
        eventSourceRef.current.onerror = null;
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Auto-scan if URL is passed in query parameters
  useEffect(() => {
    if (initialUrl && !isScanning && reviews.length === 0) {
      startScan(initialUrl);
    }
  }, [initialUrl]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputUrl(text.trim());
        toast.success("Link pasted!");
      }
    } catch {
      toast.error("Please paste link directly into the box.");
    }
  };

  const stopScan = () => {
    isStoppedRef.current = true;
    if (eventSourceRef.current) {
      eventSourceRef.current.onmessage = null;
      eventSourceRef.current.onerror = null;
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsScanning(false);
    const count = reviewsMapRef.current.size;
    setStatusLog(count > 0 ? `Scan stopped. Preserved ${count} reviews.` : "Scan stopped.");
    toast("Scanning stopped. Current reviews preserved.", { icon: "⏸️" });
  };

  const clearAll = () => {
    isStoppedRef.current = true;
    if (eventSourceRef.current) {
      eventSourceRef.current.onmessage = null;
      eventSourceRef.current.onerror = null;
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsScanning(false);
    setInputUrl("");
    setReviews([]);
    reviewsMapRef.current = new Map();
    setTotalPagesFound(0);
    setTotalReviewsCount(0);
    setSearchQuery("");
    setRatingFilter("ALL");
    setWithPhotosOnly(false);
    setVerifiedOnly(false);
    setStatusLog("");
    setCurrentPage(1);
    toast.success("Search & reviews cleared.");
  };

  const startScan = (urlToScan?: string) => {
    const rawTarget = (urlToScan || inputUrl).trim();
    if (!rawTarget) {
      toast.error("Please enter a Flipkart product link!");
      return;
    }

    if (!rawTarget.includes("flipkart.com") && !rawTarget.includes("fkrt.it")) {
      toast.error("Please enter a valid Flipkart product link.");
      return;
    }

    // Reset previous stream connection
    if (eventSourceRef.current) {
      eventSourceRef.current.onmessage = null;
      eventSourceRef.current.onerror = null;
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    isStoppedRef.current = false;

    // Reset state for new scan
    setReviews([]);
    reviewsMapRef.current = new Map();
    setTotalPagesFound(0);
    setTotalReviewsCount(0);
    setIsScanning(true);
    setStatusLog("Scanning product reviews...");
    setCurrentPage(1);

    // Primary: direct connection (with CORS enabled on upstream), fallback: our edge proxy
    const directUrl = `https://rikome.com/api/review-finder?url=${encodeURIComponent(rawTarget)}`;
    const proxyUrl = `/api/tools/review-stream?url=${encodeURIComponent(rawTarget)}`;

    const initiateStream = (targetEndpoint: string, isFallback = false) => {
      if (isStoppedRef.current) return;
      const es = new EventSource(targetEndpoint);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        if (isStoppedRef.current) {
          es.close();
          return;
        }
        try {
          const payload = JSON.parse(event.data);
          switch (payload.type) {
            case "log":
              setStatusLog(payload.msg || "Extracting reviews...");
              break;
            case "meta":
              if (payload.total_pages) setTotalPagesFound(payload.total_pages);
              if (payload.total_reviews) setTotalReviewsCount(payload.total_reviews);
              break;
            case "batch":
              if (Array.isArray(payload.reviews)) {
                payload.reviews.forEach((rev: FlipkartReview) => {
                  const key = rev.id || rev.permalink || rev.ref || Math.random().toString();
                  if (!reviewsMapRef.current.has(key)) {
                    reviewsMapRef.current.set(key, rev);
                  }
                });
                setReviews(Array.from(reviewsMapRef.current.values()));
              }
              break;
            case "patch":
              if (Array.isArray(payload.reviews)) {
                payload.reviews.forEach((p: { id: string; permalink: string }) => {
                  if (reviewsMapRef.current.has(p.id)) {
                    const item = reviewsMapRef.current.get(p.id)!;
                    reviewsMapRef.current.set(p.id, { ...item, permalink: p.permalink });
                  }
                });
                setReviews(Array.from(reviewsMapRef.current.values()));
              }
              break;
            case "done":
              setIsScanning(false);
              setStatusLog(`Scan complete! ${reviewsMapRef.current.size} reviews loaded.`);
              toast.success(`${reviewsMapRef.current.size} reviews found!`);
              es.close();
              break;
            case "error":
              setIsScanning(false);
              setStatusLog(payload.msg || "Could not retrieve reviews");
              toast.error(payload.msg || "Could not retrieve reviews.");
              es.close();
              break;
            default:
              break;
          }
        } catch (err) {
          console.error("Chunk parse error:", err);
        }
      };

      es.onerror = () => {
        es.close();
        if (isStoppedRef.current) return;
        if (!isFallback && reviewsMapRef.current.size === 0) {
          // Attempt fallback through edge proxy
          initiateStream(proxyUrl, true);
        } else {
          setIsScanning(false);
          if (reviewsMapRef.current.size === 0) {
            setStatusLog("Could not connect. Ensure product URL includes pid or is active.");
            toast.error("Could not load reviews. Please verify the Flipkart link.");
          } else {
            setStatusLog(`Scan finished with ${reviewsMapRef.current.size} reviews.`);
          }
        }
      };
    };

    initiateStream(directUrl, false);
  };

  const handleOpenAutofillModal = async (review: FlipkartReview) => {
    setSelectedReviewForAutofill(review);
    setShowAutofillModal(true);
    if (userOrders.length === 0) {
      setLoadingOrders(true);
      try {
        const res = await fetch("/api/orders");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setUserOrders(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch user orders:", err);
        toast.error("Could not fetch orders list");
      } finally {
        setLoadingOrders(false);
      }
    }
  };

  const handleSelectOrderForAutofill = async (order: any) => {
    if (!selectedReviewForAutofill) return;
    setAttachingOrderId(order._id);

    try {
      const permalink = selectedReviewForAutofill.permalink || "";
      const screenshotUrl = `${window.location.origin}/api/tools/review-screenshot?url=${encodeURIComponent(permalink)}`;

      const storageKey = `refund_form_${order._id}`;
      let existingDraft: any = {};
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) existingDraft = JSON.parse(saved);
      } catch {}

      const updatedDraft = {
        ...existingDraft,
        reviewScreenshot: screenshotUrl,
        reviewLink: permalink,
        autofilledAt: new Date().toISOString(),
        autofilledAuthor: selectedReviewForAutofill.name,
        autofilledRating: selectedReviewForAutofill.rating,
      };

      localStorage.setItem(storageKey, JSON.stringify(updatedDraft));
      localStorage.setItem(
        `review_finder_autofill_${order._id}`,
        JSON.stringify({
          reviewScreenshot: screenshotUrl,
          reviewLink: permalink,
          author: selectedReviewForAutofill.name,
          rating: selectedReviewForAutofill.rating,
        })
      );

      toast.success(`Attaching proof to Order #${order.userOrderId}...`);
      setShowAutofillModal(false);
      router.push(`/app/refunds/fill/${order._id}?autofill=1`);
    } catch (err: any) {
      toast.error("Failed to attach proof: " + err.message);
      setAttachingOrderId(null);
    }
  };

  const filteredOrders = useMemo(() => {
    if (!Array.isArray(userOrders)) return [];

    let list = userOrders.filter((o) => {
      return (
        o.status === "REFUND_FORM_PENDING" ||
        o.status === "UNDER_VERIFICATION" ||
        o.status === "REFUND_REJECTED"
      );
    });

    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase().trim();
      list = list.filter(
        (o) =>
          o.userOrderId?.toLowerCase().includes(q) ||
          o.brandName?.toLowerCase().includes(q) ||
          o.productCode?.toLowerCase().includes(q) ||
          o.marketplace?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const aMatches =
        (inputUrl && a.productLink && inputUrl.includes(a.productLink)) ||
        (a.productLink && inputUrl.includes(a.productLink));
      const bMatches =
        (inputUrl && b.productLink && inputUrl.includes(b.productLink)) ||
        (b.productLink && inputUrl.includes(b.productLink));
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;

      if (a.status === "REFUND_FORM_PENDING" && b.status !== "REFUND_FORM_PENDING") return -1;
      if (a.status !== "REFUND_FORM_PENDING" && b.status === "REFUND_FORM_PENDING") return 1;

      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    return list;
  }, [userOrders, orderSearchQuery, inputUrl]);

  const handleCopyLink = async (permalink: string, id: string) => {
    if (!permalink) {
      toast.error("Permalink not available for this review.");
      return;
    }
    try {
      await navigator.clipboard.writeText(permalink);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
      toast.success("Review link copied!");
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  const handleDownloadScreenshot = async (permalink: string, id: string) => {
    if (!permalink) {
      toast.error("Review link is missing.");
      return;
    }

    setDownloadingId(id);
    const toastId = toast.loading("Generating review proof screenshot...");

    try {
      // Use direct screenshot generator or local proxy
      const downloadUrl = `https://rikome.com/api/review-screenshot?url=${encodeURIComponent(permalink)}`;
      const res = await fetch(downloadUrl);

      if (!res.ok) {
        throw new Error("Screenshot service error");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `flipkart-review-${id.slice(0, 8)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Screenshot downloaded!", { id: toastId });
    } catch (err: any) {
      // Fallback to internal route
      try {
        const fallbackRes = await fetch(`/api/tools/review-screenshot?url=${encodeURIComponent(permalink)}&download=true`);
        if (!fallbackRes.ok) throw new Error("Could not generate proof screenshot");
        const blob = await fallbackRes.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `flipkart-review-${id.slice(0, 8)}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("Screenshot downloaded!", { id: toastId });
      } catch (fallbackErr: any) {
        toast.error(fallbackErr?.message || "Failed to download screenshot", { id: toastId });
      }
    } finally {
      setDownloadingId(null);
    }
  };

  // Filtered Reviews
  const filteredReviews = useMemo(() => {
    let list = [...reviews];

    if (ratingFilter !== "ALL") {
      const targetStar = parseInt(ratingFilter, 10);
      list = list.filter((r) => Math.round(Number(r.rating)) === targetStar);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.name?.toLowerCase().includes(q) ||
          r.title?.toLowerCase().includes(q) ||
          r.text?.toLowerCase().includes(q) ||
          r.location?.toLowerCase().includes(q) ||
          r.attributes?.toLowerCase().includes(q)
      );
    }

    if (withPhotosOnly) {
      list = list.filter((r) => Array.isArray(r.images) && r.images.length > 0);
    }

    if (verifiedOnly) {
      list = list.filter((r) => Boolean(r.verified));
    }

    list.sort((a, b) => {
      if (sortBy === "rating-high") {
        return Number(b.rating || 0) - Number(a.rating || 0);
      }
      if (sortBy === "rating-low") {
        return Number(a.rating || 0) - Number(b.rating || 0);
      }
      if (sortBy === "helpful") {
        return Number(b.helpful || 0) - Number(a.helpful || 0);
      }
      return 0;
    });

    return list;
  }, [reviews, ratingFilter, searchQuery, withPhotosOnly, verifiedOnly, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / itemsPerPage));
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReviews.slice(start, start + itemsPerPage);
  }, [filteredReviews, currentPage, itemsPerPage]);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 md:pb-12 space-y-5">
      {/* Clean, Minimalist Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Flipkart Review Finder
          </h1>
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
            Extract customer reviews, copy permalinks & download proof screenshots
          </p>
        </div>

        {/* Demo Link Button */}
        <button
          type="button"
          onClick={() => {
            const demoUrl =
              "https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm6ac6485515ae4?pid=MOBGTAGPTB3VS24W";
            setInputUrl(demoUrl);
            startScan(demoUrl);
          }}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#111827] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />
          <span>Try Sample Link</span>
        </button>
      </div>

      {/* Prominent, High-End Search Bar */}
      <div className="w-full bg-white dark:bg-[#0E1526] p-3 sm:p-4 rounded-[28px] sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            startScan();
          }}
          className="flex flex-col sm:flex-row items-stretch gap-2.5"
        >
          {/* Input field with embedded search icon, clear button, and paste pill */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Paste Flipkart product link here..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full h-14 sm:h-16 pl-12 pr-24 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-[#152037] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />

            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {inputUrl && (
                <button
                  type="button"
                  onClick={() => setInputUrl("")}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={handlePaste}
                className="h-8 px-2.5 rounded-xl bg-white dark:bg-[#1C2640] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase tracking-wider hover:bg-slate-100 transition-all flex items-center gap-1"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-blue-500" />
                <span>Paste</span>
              </button>
            </div>
          </div>

          {/* Action Buttons: Big & Touch-Friendly */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {(inputUrl || reviews.length > 0) && (
              <button
                type="button"
                onClick={clearAll}
                className="w-full sm:w-auto h-14 sm:h-16 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                title="Clear input link and all loaded reviews"
              >
                <Trash2 className="w-4 h-4 text-slate-400" />
                <span>Clear All</span>
              </button>
            )}

            {isScanning ? (
              <button
                type="button"
                onClick={stopScan}
                className="w-full sm:w-auto h-14 sm:h-16 px-8 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-600/25 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Stop Scan</span>
              </button>
            ) : (
              <button
                type="submit"
                className="w-full sm:w-auto h-14 sm:h-16 px-8 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-blue-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Scan Reviews</span>
              </button>
            )}
          </div>
        </form>

        {/* Live Status Bar */}
        {statusLog && (
          <div className="flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isScanning ? (
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
            ) : (
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
            )}
            <span>{statusLog}</span>
          </div>
        )}
      </div>

      {/* Filter and In-Review Search Hub */}
      {reviews.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0E1526] border border-slate-100 dark:border-slate-800 shadow-sm space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Star Rating Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 shrink-0 mr-1">
                Rating:
              </span>
              {["ALL", "5", "4", "3", "2", "1"].map((star) => {
                const isSelected = ratingFilter === star;
                const count =
                  star === "ALL"
                    ? reviews.length
                    : reviews.filter((r) => Math.round(Number(r.rating)) === parseInt(star, 10)).length;

                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setRatingFilter(star);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all shrink-0 ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800"
                    }`}
                  >
                    {star !== "ALL" && (
                      <Star
                        className={`w-3 h-3 ${
                          isSelected ? "fill-white" : "fill-amber-400 text-amber-400"
                        }`}
                      />
                    )}
                    <span>{star === "ALL" ? "All" : `${star}★`}</span>
                    <span className="text-[9px] opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Keyword Search */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search by name or text..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-10 pl-9 pr-7 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setWithPhotosOnly((p) => !p);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all ${
                  withPhotosOnly
                    ? "bg-purple-600 text-white"
                    : "bg-slate-50 dark:bg-[#111827] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
                }`}
              >
                <ImageIcon className="w-3 h-3" />
                <span>Photos Only</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setVerifiedOnly((p) => !p);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all ${
                  verifiedOnly
                    ? "bg-teal-600 text-white"
                    : "bg-slate-50 dark:bg-[#111827] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Certified Buyers Only</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black uppercase text-slate-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-8 px-2 rounded-lg bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="recent">Most Recent</option>
                <option value="rating-high">Highest Rating</option>
                <option value="rating-low">Lowest Rating</option>
                <option value="helpful">Most Helpful</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Cards List (Full-Width on Mobile & Desktop) */}
      {filteredReviews.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Showing {paginatedReviews.length} of {filteredReviews.length} Reviews
            </span>
          </div>

          <div className="space-y-4">
            {paginatedReviews.map((review, idx) => {
              const ratingNum = Number(review.rating) || 5;
              const hasImages = Array.isArray(review.images) && review.images.length > 0;
              const isDownloading = downloadingId === review.id;
              const isCopied = copiedId === review.id;

              return (
                <motion.div
                  key={review.id || idx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="w-full bg-white dark:bg-[#0E1526] rounded-[28px] p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-md transition-all space-y-4 relative overflow-hidden"
                >
                  {/* Review Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Rating Badge */}
                      <div
                        className={`h-9 px-3 rounded-xl flex items-center justify-center gap-1 text-white font-black text-xs shrink-0 shadow-sm ${
                          ratingNum >= 4
                            ? "bg-emerald-600"
                            : ratingNum === 3
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                      >
                        <span>{ratingNum}</span>
                        <Star className="w-3 h-3 fill-white" />
                      </div>

                      {/* Title & Reviewer details */}
                      <div className="min-w-0">
                        <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                          {review.title || "Customer Review"}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-400">
                          <span className="text-slate-800 dark:text-slate-200 uppercase font-black">
                            {review.name || "Flipkart Customer"}
                          </span>
                          {review.verified && (
                            <span className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Certified Buyer</span>
                            </span>
                          )}
                          {review.location && (
                            <span className="inline-flex items-center gap-1 text-slate-400">
                              <MapPin className="w-3 h-3" />
                              <span>{review.location}</span>
                            </span>
                          )}
                          {review.date && (
                            <span className="inline-flex items-center gap-1 text-slate-400">
                              <Calendar className="w-3 h-3" />
                              <span>{review.date}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Variant specs */}
                    {review.attributes && (
                      <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-slate-400 text-[9px] font-bold uppercase tracking-wider border border-slate-200/50 dark:border-slate-800 self-start sm:self-auto shrink-0">
                        {review.attributes}
                      </span>
                    )}
                  </div>

                  {/* Review Text */}
                  {review.text && (
                    <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap select-text">
                      {review.text}
                    </p>
                  )}

                  {/* Customer Photos */}
                  {hasImages && (
                    <div className="pt-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                        Customer Photos ({review.images!.length}):
                      </span>
                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                        {review.images!.map((imgUrl, imgIdx) => (
                          <div
                            key={imgIdx}
                            onClick={() => setActivePhoto(imgUrl)}
                            className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 group/img cursor-pointer shrink-0"
                          >
                            <img
                              src={imgUrl}
                              alt="Review attachment"
                              className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Maximize2 className="w-4 h-4" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions Bar (Mobile-first responsive) */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase">
                      <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
                      <span>{review.helpful ? `${review.helpful} Helpful` : "Helpful feedback"}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      {/* Auto Fill to Refund */}
                      <button
                        type="button"
                        onClick={() => handleOpenAutofillModal(review)}
                        className="flex-1 sm:flex-initial h-10 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                        title="Auto-fill this review & proof into a pending refund form"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                        <span>Auto Fill to Refund</span>
                      </button>

                      {/* Copy Permalink */}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(review.permalink || "", review.id)}
                        disabled={!review.permalink}
                        className="flex-1 sm:flex-initial h-10 px-3.5 rounded-xl bg-slate-100 dark:bg-[#111827] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                        title="Copy official Flipkart review link"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-500">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>

                      {/* Download Proof Screenshot */}
                      <button
                        type="button"
                        onClick={() => handleDownloadScreenshot(review.permalink || "", review.id)}
                        disabled={!review.permalink || isDownloading}
                        className="flex-1 sm:flex-initial h-10 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60 cursor-pointer"
                        title="Generate high-resolution PNG receipt"
                      >
                        {isDownloading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>Screenshot</span>
                          </>
                        )}
                      </button>

                      {/* View on Flipkart */}
                      {review.permalink && (
                        <a
                          href={review.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-[#111827] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all active:scale-95 shrink-0"
                          title="View live review on Flipkart"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Desktop Pagination Footer */}
          {totalPages > 1 && (
            <div className="hidden md:flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Page <span className="text-blue-600">{currentPage}</span> of{" "}
                <span className="text-slate-900 dark:text-white">{totalPages}</span> (
                {filteredReviews.length} Reviews)
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-9 px-3 rounded-xl bg-slate-100 dark:bg-[#111827] text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider disabled:opacity-30 transition-all flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5) {
                      if (currentPage > 3 && currentPage < totalPages - 2) {
                        pageNum = currentPage - 2 + i;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      }
                    }
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-9 w-9 rounded-xl text-[10px] font-black transition-all ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                            : "bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-9 px-3 rounded-xl bg-slate-100 dark:bg-[#111827] text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider disabled:opacity-30 transition-all flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 rounded-[28px] bg-white dark:bg-[#0E1526] border border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center space-y-2.5">
          <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
            {reviews.length > 0 ? "No Reviews Match Your Current Filters" : "Ready to Find Reviews"}
          </h3>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 max-w-sm">
            {reviews.length > 0
              ? "Try resetting your star rating or clearing the search text."
              : "Paste any Flipkart product link above and click 'Scan Reviews'."}
          </p>
        </div>
      )}

      {/* Official Fixed-Bottom Pagination for Mobile (Used in all AspireMint pages) */}
      {totalPages >= 1 && filteredReviews.length > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/90 dark:bg-[#0E1526]/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex flex-col items-center py-2 px-6 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          {/* Status Indicator */}
          <div className="flex items-center gap-3 mb-2">
            <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
              PAGE <span className="text-slate-900 dark:text-white">{currentPage}</span> OF{" "}
              <span className="text-slate-900 dark:text-white">{totalPages}</span>
            </p>
            <div className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />
            <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
              <span className="text-slate-900 dark:text-white">{filteredReviews.length}</span> REVIEWS
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 dark:bg-[#111827] border border-transparent dark:border-slate-700/60 rounded-full p-1 shadow-xl">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`h-9 w-9 rounded-full flex items-center justify-center transition-all ${
                currentPage === 1 ? "text-slate-700" : "text-white active:scale-95"
              }`}
            >
              <ChevronLeft className="w-4 h-4 stroke-[3]" />
            </button>

            <div className="flex items-center gap-1 px-1">
              {(() => {
                const rangeSize = 3;
                let start = Math.max(1, currentPage - 1);
                let end = Math.min(totalPages, start + rangeSize - 1);
                if (end - start + 1 < rangeSize) {
                  start = Math.max(1, end - rangeSize + 1);
                }
                return Array.from(
                  { length: Math.max(0, end - start + 1) },
                  (_, i) => start + i
                );
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
                      layoutId="fixedBottomReviewPill"
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
              className={`h-9 w-9 rounded-full flex items-center justify-center transition-all ${
                currentPage === totalPages ? "text-slate-700" : "text-white active:scale-95"
              }`}
            >
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {activePhoto && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePhoto(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-3xl max-h-[85vh] bg-[#0E1526] rounded-3xl overflow-hidden border border-slate-700 p-2 shadow-2xl z-10"
            >
              <button
                type="button"
                onClick={() => setActivePhoto(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-all z-20"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={activePhoto}
                alt="Enlarged review photo"
                className="max-h-[80vh] w-auto object-contain rounded-2xl mx-auto"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Autofill to Refund Modal */}
      <AnimatePresence>
        {showAutofillModal && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAutofillModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-xl max-h-[90vh] bg-white dark:bg-[#0E1526] rounded-[28px] sm:rounded-[36px] border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden z-10"
            >
              {/* Modal Header */}
              <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <span>Auto-Fill to Refund</span>
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                    Select a pending order to attach this review screenshot proof
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAutofillModal(false)}
                  className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Review Summary Card */}
              {selectedReviewForAutofill && (
                <div className="px-5 sm:px-6 pt-3 pb-2 shrink-0">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-slate-900 dark:text-white truncate">
                          {selectedReviewForAutofill.name || "Customer Review"}
                        </span>
                        <div className="flex items-center gap-0.5 text-amber-500 text-[10px] font-black">
                          <Star className="w-3 h-3 fill-amber-500" />
                          <span>{selectedReviewForAutofill.rating}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {selectedReviewForAutofill.title || selectedReviewForAutofill.text || "Verified purchase review"}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider shrink-0">
                      Proof Ready
                    </span>
                  </div>
                </div>
              )}

              {/* Order Search Filter */}
              <div className="px-5 sm:px-6 py-2 shrink-0">
                <div className="relative">
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder="Search your pending orders by ID, Brand, Product..."
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500 transition-all"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Scrollable Order List */}
              <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-2 space-y-2.5">
                {loadingOrders ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mb-3" />
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">Loading your pending refunds...</p>
                  </div>
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((ord) => {
                    const isAttaching = attachingOrderId === ord._id;
                    const isMatching =
                      (inputUrl && ord.productLink && inputUrl.includes(ord.productLink)) ||
                      (ord.productLink && inputUrl.includes(ord.productLink));

                    return (
                      <div
                        key={ord._id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isMatching
                            ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/60"
                            : "bg-white dark:bg-[#111827] border-slate-100 dark:border-slate-800/80 hover:border-slate-200"
                        }`}
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                              {ord.brandName || "Brand"}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-slate-900 dark:text-white select-all">
                              {ord.userOrderId}
                            </span>
                            {isMatching && (
                              <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>Matching Product</span>
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[8px] font-black uppercase tracking-wider">
                              {ord.status === "REFUND_FORM_PENDING" ? "Form Pending" : ord.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                            <span>Payout: ₹{ord.refundDetails?.expectedPayout || ord.amount || 0}</span>
                            <span>•</span>
                            <span>Type: {ord.reviewType || "REVIEW"}</span>
                            {ord.marketplace && (
                              <>
                                <span>•</span>
                                <span>{ord.marketplace}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectOrderForAutofill(ord)}
                          disabled={isAttaching}
                          className="w-full sm:w-auto h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
                        >
                          {isAttaching ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Attaching...</span>
                            </>
                          ) : (
                            <>
                              <span>Attach & Open</span>
                              <ArrowRight className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-10 text-center space-y-2">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                      {orderSearchQuery ? "No matching pending refunds found." : "No pending refunds found."}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      You don't have any orders waiting for refund submission.
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push("/app/orders")}
                      className="mt-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider cursor-pointer"
                    >
                      View All Orders
                    </button>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-400 shrink-0">
                <span>{filteredOrders.length} Eligible Orders</span>
                <button
                  type="button"
                  onClick={() => setShowAutofillModal(false)}
                  className="px-3 py-1 text-slate-500 hover:text-slate-800 dark:hover:text-white uppercase font-black tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
