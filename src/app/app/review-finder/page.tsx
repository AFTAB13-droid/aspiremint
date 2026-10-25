"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Search,
  Sparkles,
  ExternalLink,
  Copy,
  Download,
  Star,
  ShieldCheck,
  Image as ImageIcon,
  ThumbsUp,
  X,
  Filter,
  Check,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  Clock,
  ArrowRight,
  Maximize2,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
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

  // Initial URL from query params if passed (e.g. from deal or refund page)
  const initialUrl = searchParams.get("url") || "";
  const linkedOrderId = searchParams.get("orderId") || "";

  const [inputUrl, setInputUrl] = useState(initialUrl);
  const [isScanning, setIsScanning] = useState(false);
  const [statusLog, setStatusLog] = useState("");
  const [reviews, setReviews] = useState<FlipkartReview[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalFound, setTotalFound] = useState(0);
  const [productInfo, setProductInfo] = useState<{
    pid?: string;
    itm?: string;
    slug?: string;
  } | null>(null);

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

  const eventSourceRef = useRef<EventSource | null>(null);
  const reviewsMapRef = useRef<Map<string, FlipkartReview>>(new Map());

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
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
        toast.success("Link pasted from clipboard!");
      }
    } catch {
      toast.error("Please allow clipboard access or paste manually.");
    }
  };

  const stopScan = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsScanning(false);
    setStatusLog("Scan stopped.");
  };

  const startScan = (urlToScan?: string) => {
    const target = (urlToScan || inputUrl).trim();
    if (!target) {
      toast.error("Please paste a Flipkart product link first!");
      return;
    }

    if (!target.includes("flipkart.com") && !target.includes("fkrt.it")) {
      toast.error("Please provide a valid Flipkart link (flipkart.com or fkrt.it)");
      return;
    }

    // Reset previous results
    stopScan();
    setReviews([]);
    reviewsMapRef.current = new Map();
    setTotalPages(0);
    setTotalFound(0);
    setProductInfo(null);
    setIsScanning(true);
    setStatusLog("Connecting to Flipkart review engine...");
    setCurrentPage(1);

    const sseUrl = `/api/tools/review-stream?url=${encodeURIComponent(target)}`;
    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        switch (payload.type) {
          case "init":
            setProductInfo({
              pid: payload.pid,
              itm: payload.itm,
              slug: payload.slug,
            });
            break;
          case "log":
            setStatusLog(payload.msg || "Scanning...");
            break;
          case "meta":
            if (payload.total_pages) setTotalPages(payload.total_pages);
            if (payload.total_reviews) setTotalFound(payload.total_reviews);
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
            setStatusLog(`Scan completed! Discovered ${reviewsMapRef.current.size} reviews.`);
            toast.success(`${reviewsMapRef.current.size} reviews loaded!`);
            es.close();
            break;
          case "error":
            setIsScanning(false);
            setStatusLog(`Error: ${payload.msg || "Scan encountered an issue"}`);
            toast.error(payload.msg || "Could not retrieve reviews.");
            es.close();
            break;
          default:
            break;
        }
      } catch (err) {
        console.error("Error parsing review chunk:", err);
      }
    };

    es.onerror = () => {
      es.close();
      setIsScanning(false);
      if (reviewsMapRef.current.size === 0) {
        setStatusLog("Could not connect. Please check the Flipkart link.");
        toast.error("Could not load reviews. Ensure the link is a valid Flipkart product.");
      } else {
        setStatusLog(`Scan completed with ${reviewsMapRef.current.size} reviews.`);
      }
    };
  };

  const handleCopyLink = async (permalink: string, id: string) => {
    if (!permalink) {
      toast.error("Permalink is not available for this review yet.");
      return;
    }
    try {
      await navigator.clipboard.writeText(permalink);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
      toast.success("Review permalink copied to clipboard!");
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
    const toastId = toast.loading("Generating high-res proof screenshot...");

    try {
      const res = await fetch(
        `/api/tools/review-screenshot?url=${encodeURIComponent(permalink)}&download=true`
      );

      if (!res.ok) {
        throw new Error("Screenshot service temporarily unavailable");
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

      toast.success("Screenshot downloaded successfully!", { id: toastId });
    } catch (err: any) {
      toast.error(err?.message || "Failed to download screenshot", { id: toastId });
    } finally {
      setDownloadingId(null);
    }
  };

  // Filtered & Sorted Reviews
  const filteredReviews = useMemo(() => {
    let list = [...reviews];

    // Star rating filter
    if (ratingFilter !== "ALL") {
      const targetStar = parseInt(ratingFilter, 10);
      list = list.filter((r) => Math.round(Number(r.rating)) === targetStar);
    }

    // Text & Keyword search
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

    // With Photos filter
    if (withPhotosOnly) {
      list = list.filter((r) => Array.isArray(r.images) && r.images.length > 0);
    }

    // Verified Buyers only
    if (verifiedOnly) {
      list = list.filter((r) => Boolean(r.verified));
    }

    // Sorting
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
      return 0; // Natural chronological order as received
    });

    return list;
  }, [reviews, ratingFilter, searchQuery, withPhotosOnly, verifiedOnly, sortBy]);

  // Pagination calculation
  const totalFilteredPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReviews.slice(start, start + itemsPerPage);
  }, [filteredReviews, currentPage, itemsPerPage]);

  // Rating stats summary
  const stats = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let photosCount = 0;
    let verifiedCount = 0;
    let totalScore = 0;

    reviews.forEach((r) => {
      const star = Math.round(Number(r.rating) || 0);
      if (counts[star] !== undefined) counts[star]++;
      if (r.images && r.images.length > 0) photosCount++;
      if (r.verified) verifiedCount++;
      totalScore += Number(r.rating) || 0;
    });

    const avg = reviews.length > 0 ? (totalScore / reviews.length).toFixed(1) : "0.0";
    return { counts, photosCount, verifiedCount, avg };
  }, [reviews]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 space-y-6">
      {/* Top Header Card */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-gradient-to-br from-white via-white to-blue-50/40 dark:from-[#0E1526] dark:via-[#0E1526] dark:to-[#172340] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 text-[#2563EB] dark:text-blue-400 text-[10px] font-black uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>Flipkart Intelligence Tool</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Flipkart Review Finder & Proof Generator
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 max-w-2xl">
              Extract every Flipkart review, find reviewer names, generate high-resolution screenshot proofs, and grab instant permalinks for refund verification.
            </p>
          </div>

          {/* Quick Demo Pill Button */}
          <button
            type="button"
            onClick={() => {
              const demoUrl =
                "https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm6ac6485515ae4?pid=MOBGTAGPTB3VS24W";
              setInputUrl(demoUrl);
              startScan(demoUrl);
            }}
            className="self-start md:self-center px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-indigo-500" />
            <span>Try Sample Product</span>
          </button>
        </div>

        {/* Input Bar */}
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              startScan();
            }}
            className="flex flex-col sm:flex-row items-stretch gap-2.5"
          >
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Paste any Flipkart product link (e.g. https://www.flipkart.com/... or fkrt.it/...)"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="w-full h-13 pl-11 pr-24 rounded-2xl bg-white dark:bg-[#111827] border-2 border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />

              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {inputUrl && (
                  <button
                    type="button"
                    onClick={() => setInputUrl("")}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handlePaste}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider transition-all"
                >
                  Paste
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isScanning ? (
                <button
                  type="button"
                  onClick={stopScan}
                  className="flex-1 sm:flex-initial h-13 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-rose-600/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Stop Scan</span>
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial h-13 px-7 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-xl shadow-blue-600/25 active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Scan Reviews</span>
                </button>
              )}
            </div>
          </form>

          {/* Status Message */}
          {statusLog && (
            <div className="mt-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isScanning ? (
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
              )}
              <span>{statusLog}</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary Analytics Banner */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                Total Reviews
              </span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {reviews.length.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 fill-emerald-500" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                Avg. Rating
              </span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {stats.avg} <span className="text-xs text-slate-400 font-bold">/ 5</span>
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                With Photos
              </span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {stats.photosCount.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                Certified Buyers
              </span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {stats.verifiedCount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      {reviews.length > 0 && (
        <div className="p-5 rounded-[28px] bg-white dark:bg-[#0E1526] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Star Rating Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1.5 shrink-0">
                Rating:
              </span>
              {["ALL", "5", "4", "3", "2", "1"].map((star) => {
                const isSelected = ratingFilter === star;
                const count =
                  star === "ALL"
                    ? reviews.length
                    : stats.counts[parseInt(star, 10)] || 0;

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
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
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
                    <span>{star === "ALL" ? "All Stars" : `${star} Star`}</span>
                    <span
                      className={`ml-1 text-[9px] px-1.5 py-0.2 rounded-md ${
                        isSelected
                          ? "bg-blue-700/60 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* In-Review Search */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search by buyer name or review text..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-10 pl-9 pr-8 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#152037] focus:border-blue-500 transition-all outline-none"
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

          {/* Secondary Toggles & Sort Options */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setWithPhotosOnly((prev) => !prev);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                  withPhotosOnly
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-slate-50 dark:bg-[#111827] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Photos Only</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setVerifiedOnly((prev) => !prev);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                  verifiedOnly
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-slate-50 dark:bg-[#111827] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Certified Buyers Only</span>
              </button>
            </div>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
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

      {/* Reviews Cards List */}
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
                  initial={{ opacity: 0, y: 15 }}
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

                      {/* Review Title & Author Info */}
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

                    {/* Variant / Attributes Pill */}
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

                  {/* Customer Upload Photos */}
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

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase">
                      <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
                      <span>{review.helpful ? `${review.helpful} Helpful` : "Helpful feedback"}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Copy Permalink */}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(review.permalink || "", review.id)}
                        disabled={!review.permalink}
                        className="h-9 px-3.5 rounded-xl bg-slate-100 dark:bg-[#111827] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
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
                        className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 active:scale-95 disabled:opacity-60 cursor-pointer"
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
                            <span>Screenshot Proof</span>
                          </>
                        )}
                      </button>

                      {/* View on Flipkart */}
                      {review.permalink && (
                        <a
                          href={review.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-[#111827] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all active:scale-95"
                          title="View live review on Flipkart"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {/* Use in Refund Form Shortcut */}
                      {linkedOrderId && (
                        <button
                          type="button"
                          onClick={() => {
                            router.push(
                              `/app/refunds/fill/${linkedOrderId}?reviewLink=${encodeURIComponent(
                                review.permalink || ""
                              )}`
                            );
                          }}
                          className="h-9 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                        >
                          <span>Use for Refund</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalFilteredPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Page {currentPage} of {totalFilteredPages}
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

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalFilteredPages, p + 1))}
                  disabled={currentPage === totalFilteredPages}
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
        /* Empty / Idle State */
        <div className="p-12 sm:p-16 rounded-[32px] bg-white dark:bg-[#0E1526] border border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center space-y-3">
          <div className="h-16 w-16 rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner mb-2">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
            {reviews.length > 0
              ? "No Reviews Match Your Current Filters"
              : "Ready to Scan Flipkart Reviews"}
          </h3>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 max-w-md">
            {reviews.length > 0
              ? "Try clearing your search query or selecting a different star rating filter above."
              : "Paste any Flipkart product URL above and click 'Scan Reviews' to extract customer ratings, full comments, photos, and auto-generated proof screenshots."}
          </p>
          {reviews.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setRatingFilter("ALL");
                setWithPhotosOnly(false);
                setVerifiedOnly(false);
              }}
              className="mt-3 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider transition-all"
            >
              Reset All Filters
            </button>
          )}
        </div>
      )}

      {/* Image Lightbox Modal */}
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
    </div>
  );
}
