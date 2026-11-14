"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Clock,
  Coins,
  Users,
  Search,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  ExternalLink,
  MessageCircle,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { CustomDropdown } from "@/components/ui/CustomDropdown";

export default function StuckVerificationsPage() {
  const { data: session } = useSession();

  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activeMediators, setActiveMediators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [daysRange, setDaysRange] = useState("ALL");
  const [selectedMediator, setSelectedMediator] = useState("ALL");
  const [selectedMarketplace, setSelectedMarketplace] = useState("ALL");
  const [sortBy, setSortBy] = useState("oldest_stuck");

  // Pagination (Matching User Directory)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Bulk Selection & Reject Modal (Reassign Removed)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [singleActionOrderId, setSingleActionOrderId] = useState<string | null>(null);

  const fetchStuckOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search,
        daysRange,
        mediatorId: selectedMediator,
        marketplace: selectedMarketplace,
        sortBy,
      });

      const res = await fetch(`/api/admin/stuck-verifications?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setOrders(json.orders);
        setStats(json.stats);
        setTotalPages(json.pagination.totalPages || 1);
        setTotalCount(json.pagination.totalCount || 0);
        if (json.activeMediators) {
          setActiveMediators(json.activeMediators);
        }
      } else {
        toast.error(json.message || "Failed to load delayed verifications");
      }
    } catch (err: any) {
      toast.error("Network error loading delayed orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStuckOrders();
  }, [currentPage, itemsPerPage, search, daysRange, selectedMediator, selectedMarketplace, sortBy]);

  // Handle Multi-select
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(orders.map((o) => o._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  // Perform Actions: APPROVE or REJECT (Reassign Removed)
  const handleExecuteAction = async (action: "APPROVE" | "REJECT") => {
    const targetIds = singleActionOrderId ? [singleActionOrderId] : selectedIds;
    if (targetIds.length === 0) {
      toast.error("Please select at least one order.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/stuck-verifications/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          orderIds: targetIds,
          rejectionReason: action === "REJECT" ? rejectionReason : undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(json.message || `Action executed successfully!`);
        setSelectedIds([]);
        setSingleActionOrderId(null);
        setIsRejectModalOpen(false);
        setRejectionReason("");
        fetchStuckOrders();
      } else {
        toast.error(json.message || "Failed to execute action.");
      }
    } catch (err: any) {
      toast.error(err.message || "Error processing action.");
    } finally {
      setActionLoading(false);
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    if (orders.length === 0) {
      toast.error("No orders to export.");
      return;
    }

    const headers = [
      "Order ID",
      "User Order ID",
      "Brand",
      "Marketplace",
      "Product Code",
      "Buyer Name",
      "Buyer Mobile",
      "Buyer Email",
      "Buyer Aspire ID",
      "Refund Form Submitted Date",
      "Days Stuck in Verification",
      "Severity Tier",
      "Refund Amount",
      "Assigned Mediator",
      "Mediator Mobile",
    ];

    const rows = orders.map((o) => [
      o.aspireOrderId || o._id,
      o.userOrderId || "N/A",
      o.brandName,
      o.marketplace || "N/A",
      o.productCode,
      o.buyer?.name || "N/A",
      o.buyer?.mobile || "N/A",
      o.buyer?.email || "N/A",
      o.buyer?.aspireMintId || "N/A",
      new Date(o.refundFormSubmittedAt).toLocaleDateString("en-IN"),
      o.daysStuck,
      o.severity,
      o.calculatedPayout,
      o.mediator?.systemDisplayName || o.mediator?.name || "Unassigned",
      o.mediator?.mobile || "N/A",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `delayed_verifications_30d_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported delayed verifications to CSV!");
  };

  return (
    <div className="w-full flex flex-col gap-8 md:gap-10 pb-20 px-4 md:px-0 pt-6">
      {/* 1. TOP HEADER & BREADCRUMBS (FULL WIDTH) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 w-full">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/app/refunds"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Delayed Verifications Hub
              </h1>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
              30+ Days SLA Alert
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2">
            Orders where the user filled the refund form &gt; 30 days ago that remain unresolved in Under Verification status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStuckOrders}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm"
            title="Refresh order list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-600/20 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. EXECUTIVE SUMMARY METRICS (FULL WIDTH) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full">
        {/* Card 1: Total Stuck */}
        <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-[32px] p-6 md:p-8 text-white shadow-xl shadow-rose-500/20 relative overflow-hidden border border-white/20">
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <Clock className="w-24 h-24 -mt-8 -mr-8" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-100">
            Delayed Orders (&gt;30d)
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-3xl md:text-4xl font-black tracking-tight">
              {stats ? stats.totalStuckOrders : <Skeleton className="h-9 w-16" />}
            </h3>
            <span className="text-xs font-bold text-rose-200">Orders</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-rose-100">
            <span>Critical (60d+): {stats?.tierCriticalCount || 0}</span>
            <span>•</span>
            <span>High (45d+): {stats?.tierHighCount || 0}</span>
          </div>
        </div>

        {/* Card 2: Total Liability */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-[32px] p-6 md:p-8 text-white shadow-xl shadow-amber-500/20 relative overflow-hidden border border-white/20">
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <Coins className="w-24 h-24 -mt-8 -mr-8" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100">
            Pending Escrow Liability
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-3xl md:text-4xl font-black tracking-tight">
              ₹{stats ? stats.totalPayoutLiability.toLocaleString("en-IN") : <Skeleton className="h-9 w-24" />}
            </h3>
            <span className="text-xs font-bold text-amber-200">INR</span>
          </div>
          <p className="mt-3 text-[10px] font-bold text-amber-100">
            Held cashback awaiting mediator verification
          </p>
        </div>

        {/* Card 3: Oldest Delayed */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[32px] p-6 md:p-8 text-white shadow-xl shadow-purple-600/20 relative overflow-hidden border border-white/20">
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <AlertCircle className="w-24 h-24 -mt-8 -mr-8" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-200">
            Longest In Verification
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-3xl md:text-4xl font-black tracking-tight">
              {stats ? `${stats.maxDaysStuck}` : <Skeleton className="h-9 w-16" />}
            </h3>
            <span className="text-xs font-bold text-purple-200">Days</span>
          </div>
          <p className="mt-3 text-[10px] font-bold text-purple-200">
            Counted from exact refund form submission
          </p>
        </div>

        {/* Card 4: Mediator Bottleneck */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[32px] p-6 md:p-8 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden border border-white/20">
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <Users className="w-24 h-24 -mt-8 -mr-8" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Top Delaying Mediator
          </span>
          <div className="mt-2">
            <h3 className="text-lg font-black truncate">
              {stats?.mediatorBreakdown?.[0]?.name || "None / All Clear"}
            </h3>
            <p className="text-xs font-bold text-rose-400 mt-1">
              {stats?.mediatorBreakdown?.[0]
                ? `${stats.mediatorBreakdown[0].count} orders delayed (₹${stats.mediatorBreakdown[0].liability.toLocaleString("en-IN")})`
                : "No mediator breaches recorded"}
            </p>
          </div>
          <p className="mt-2 text-[10px] font-bold text-slate-400">
            Immediate accountability tracking
          </p>
        </div>
      </div>

      {/* 3. MEDIATOR BOTTLENECK INSPECTION CARD (FULL WIDTH) */}
      {stats?.mediatorBreakdown && stats.mediatorBreakdown.length > 0 && (
        <div className="bg-white dark:bg-[#0E1526] border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 shadow-sm w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Mediator Delay Breakdown
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              Click &quot;Nudge&quot; to prompt mediator on WhatsApp with their exact delayed orders count
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.mediatorBreakdown.map((med: any) => {
              const whatsappUrl = med.mobile
                ? `https://wa.me/${med.mobile.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Hello ${med.name}, you have ${med.count} orders in AspireMint that have been stuck in Under Verification for more than 30 days (Total Payout: ₹${med.liability}). Please review and verify or reject them immediately.`
                  )}`
                : null;

              return (
                <div
                  key={med.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between"
                >
                  <div className="overflow-hidden">
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate">{med.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                      <span className="font-bold text-rose-500">{med.count} orders</span>
                      <span className="text-slate-400">•</span>
                      <span className="font-mono text-slate-600 dark:text-slate-400">₹{med.liability}</span>
                    </div>
                  </div>

                  {whatsappUrl ? (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 transition-all shadow-sm shrink-0"
                      title="Nudge on WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">No Mobile</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. FILTER BAR (FULL WIDTH) */}
      <div className="bg-white dark:bg-[#0E1526] rounded-[32px] p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-4 w-full">
        <div className="flex flex-col md:flex-row items-center gap-3 w-full">
          {/* Search Input */}
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Order ID, Buyer Name, Mobile, Email, or AspireMint ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-12 pr-4 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Days Range Filter */}
          <div className="w-full md:w-56">
            <select
              value={daysRange}
              onChange={(e) => {
                setDaysRange(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="ALL">All 30+ Days (All Delayed)</option>
              <option value="30_45">🟡 30 - 44 Days (Warning)</option>
              <option value="45_60">🟠 45 - 59 Days (High Alert)</option>
              <option value="60_PLUS">🔴 60+ Days (Severe Breach)</option>
            </select>
          </div>

          {/* Mediator Filter */}
          <div className="w-full md:w-52">
            <select
              value={selectedMediator}
              onChange={(e) => {
                setSelectedMediator(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="ALL">All Mediators</option>
              {activeMediators.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.systemDisplayName || m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="w-full md:w-52">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="oldest_stuck">Longest Delayed First</option>
              <option value="newest_stuck">Shortest Delayed First</option>
              <option value="amount_high">Highest Amount First</option>
              <option value="amount_low">Lowest Amount First</option>
            </select>
          </div>
        </div>

        {/* BULK ACTIONS TOOLBAR (Approve & Reject Only - Reassign Removed) */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-black">
                  {selectedIds.length} Selected
                </span>
                <span className="text-xs text-slate-500">Apply resolution to selected orders:</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExecuteAction("APPROVE")}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Bulk Approve</span>
                </button>

                <button
                  onClick={() => {
                    setSingleActionOrderId(null);
                    setIsRejectModalOpen(true);
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Bulk Reject</span>
                </button>

                <button
                  onClick={() => setSelectedIds([])}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold"
                >
                  Deselect All
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. STUCK ORDERS TABLE (DESKTOP - FULL WIDTH CARD) */}
      <div className="hidden md:block rounded-[40px] border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#0E1526] shadow-xl shadow-slate-200/40 relative overflow-hidden w-full">
        <div className="max-h-[640px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 dark:bg-[#0B101D] border-b border-slate-100 dark:border-slate-800/80 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-6 py-5 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={orders.length > 0 && selectedIds.length === orders.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                </th>
                <th className="px-6 py-5">Order &amp; Brand</th>
                <th className="px-6 py-5">Buyer Identity</th>
                <th className="px-6 py-5">Refund Form Filled</th>
                <th className="px-6 py-5 text-center">Delay SLA</th>
                <th className="px-6 py-5">Assigned Mediator</th>
                <th className="px-6 py-5 text-right">Amount</th>
                <th className="px-6 py-5 text-right">Resolution Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="p-4">
                      <Skeleton className="h-14 w-full rounded-2xl" />
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Zero Delayed Verifications!
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      No orders in Under Verification have exceeded the 30-day SLA window.
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((ord) => {
                  const isSelected = selectedIds.includes(ord._id);
                  const buyerWhatsapp = ord.buyer?.mobile
                    ? `https://wa.me/${ord.buyer.mobile.replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Hello ${ord.buyer.name}, this is from AspireMint Admin regarding your order ${ord.userOrderId || ord.aspireOrderId}. We are expediting your verification.`
                      )}`
                    : null;

                  return (
                    <tr
                      key={ord._id}
                      className={`hover:bg-slate-50/50 dark:hover:bg-[#172138] transition-colors ${
                        isSelected ? "bg-rose-50/40 dark:bg-rose-950/20" : ""
                      }`}
                    >
                      <td className="px-6 py-5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(ord._id)}
                          className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                        />
                      </td>

                      {/* Order & Brand */}
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                              {ord.aspireOrderId || "AM-ORDER"}
                            </span>
                            {ord.marketplace && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {ord.marketplace}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-500 mt-0.5">{ord.brandName}</span>
                          <span className="text-[10px] font-mono text-slate-400 truncate max-w-[140px]">
                            Ext: {ord.userOrderId || "N/A"}
                          </span>
                        </div>
                      </td>

                      {/* Buyer Identity */}
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                              {ord.buyer?.name || "Shopper"}
                            </span>
                            {ord.buyer?.aspireMintId && (
                              <span className="text-[9px] font-mono font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                                {ord.buyer.aspireMintId}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                            {ord.buyer?.mobile && (
                              <span className="font-mono flex items-center gap-1">
                                📞 {ord.buyer.mobile}
                              </span>
                            )}
                            {buyerWhatsapp && (
                              <a
                                href={buyerWhatsapp}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 hover:text-emerald-700 font-bold"
                                title="Contact Buyer on WhatsApp"
                              >
                                💬
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Refund Form Submission Date */}
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                            {new Date(ord.refundFormSubmittedAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Refund Form Filled
                          </span>
                        </div>
                      </td>

                      {/* Delay SLA Badge */}
                      <td className="px-6 py-5 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 ${
                              ord.severity === "CRITICAL"
                                ? "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800 animate-pulse"
                                : ord.severity === "HIGH"
                                ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800"
                                : "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/60 dark:text-yellow-300 dark:border-yellow-800"
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>{ord.daysStuck} Days</span>
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase">
                            {ord.severity === "CRITICAL"
                              ? "Severe Breach"
                              : ord.severity === "HIGH"
                              ? "High Alert"
                              : "Overdue"}
                          </span>
                        </div>
                      </td>

                      {/* Assigned Mediator */}
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[140px]">
                            {ord.mediator?.systemDisplayName || ord.mediator?.name || "Unassigned"}
                          </span>
                          {ord.mediator?.mobile && (
                            <span className="text-[10px] font-mono text-slate-400">
                              {ord.mediator.mobile}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Refund Amount */}
                      <td className="px-6 py-5 text-right">
                        <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                          ₹{ord.calculatedPayout}
                        </span>
                      </td>

                      {/* Action Buttons (Approve & Reject Only - Reassign Removed) */}
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Approve */}
                          <button
                            onClick={() => {
                              setSingleActionOrderId(ord._id);
                              handleExecuteAction("APPROVE");
                            }}
                            className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-400 transition-all shadow-sm active:scale-95"
                            title="Direct Approve Verification"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>

                          {/* Quick Reject */}
                          <button
                            onClick={() => {
                              setSingleActionOrderId(ord._id);
                              setIsRejectModalOpen(true);
                            }}
                            className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 dark:text-rose-400 transition-all shadow-sm active:scale-95"
                            title="Reject Verification"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>

                          {/* View Full Order Details */}
                          <Link
                            href={`/app/orders/${ord._id}`}
                            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all shadow-sm"
                            title="View Full Order Details"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. MOBILE CARDS VIEW (FULL WIDTH) */}
      <div className="md:hidden space-y-4 w-full">
        {loading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-44 w-full rounded-[32px]" />)
        ) : orders.length === 0 ? (
          <div className="py-12 text-center bg-white dark:bg-[#0E1526] rounded-[32px] p-6 border border-slate-100 dark:border-slate-800">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-base font-black">Zero Delayed Verifications</h3>
            <p className="text-xs text-slate-500 mt-1">All refund forms are within the 30-day window.</p>
          </div>
        ) : (
          orders.map((ord) => (
            <div
              key={ord._id}
              className="bg-white dark:bg-[#0E1526] rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 shadow-lg space-y-3 relative overflow-hidden"
            >
              {/* Top row */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-black">{ord.aspireOrderId}</span>
                  <p className="text-xs font-bold text-slate-500">{ord.brandName}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    ord.severity === "CRITICAL"
                      ? "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300"
                      : "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300"
                  }`}
                >
                  {ord.daysStuck} Days Stuck
                </span>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-50 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Buyer</span>
                  <p className="font-black text-slate-900 dark:text-white truncate">{ord.buyer?.name}</p>
                  <p className="font-mono text-slate-500 text-[10px]">{ord.buyer?.mobile}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Mediator</span>
                  <p className="font-black text-slate-900 dark:text-white truncate">
                    {ord.mediator?.systemDisplayName || ord.mediator?.name || "Unassigned"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Form Submitted</span>
                  <p className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {new Date(ord.refundFormSubmittedAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Payout</span>
                  <p className="font-mono font-black text-emerald-600 text-sm">₹{ord.calculatedPayout}</p>
                </div>
              </div>

              {/* Mobile Actions: Approve & Reject Only */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-50 dark:border-slate-800">
                <button
                  onClick={() => {
                    setSingleActionOrderId(ord._id);
                    handleExecuteAction("APPROVE")}
                  }
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase text-center shadow-sm"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    setSingleActionOrderId(ord._id);
                    setIsRejectModalOpen(true);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase text-center shadow-sm"
                >
                  Reject
                </button>
                <Link
                  href={`/app/orders/${ord._id}`}
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 7. PAGINATION (EXACT SAME AS USER DIRECTORY / APP USERS) */}
      {orders.length > 0 && (
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-4 md:mt-8 pb-10 w-full">
          {/* Show Limit Dropdown */}
          <div className="flex items-center gap-4 px-4 py-2 bg-white dark:bg-[#0E1526] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm order-2 md:order-1 h-[42px] overflow-visible z-20">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
              Show Limit
            </span>
            <div className="w-[110px] scale-[0.85] origin-left">
              <CustomDropdown
                options={["8 rows", "15 rows", "25 rows", "50 rows", "100 rows"]}
                value={`${itemsPerPage} rows`}
                onChange={(val) => {
                  setItemsPerPage(parseInt(val));
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Numbered Page Buttons with Arrows */}
          <div className="flex items-center gap-4 order-1 md:order-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="h-10 w-10 bg-white dark:bg-[#0E1526] border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 disabled:opacity-30 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-x-auto max-w-[200px] md:max-w-none custom-scrollbar pb-1 md:pb-0">
              {(() => {
                const rangeSize = 3;
                let start = Math.max(1, currentPage - 1);
                let end = Math.min(totalPages, start + rangeSize - 1);
                if (end - start + 1 < rangeSize) {
                  start = Math.max(1, end - rangeSize + 1);
                }
                return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
              })().map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 shrink-0 rounded-lg text-[10px] font-black transition-all ${
                    currentPage === p
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:bg-white dark:hover:bg-slate-700"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="h-10 w-10 bg-white dark:bg-[#0E1526] border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 disabled:opacity-30 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: REJECT VERIFICATION */}
      <AnimatePresence>
        {isRejectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-600" />
                  <h3 className="text-base font-black">Reject Verification</h3>
                </div>
                <button
                  onClick={() => setIsRejectModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Reject verification for{" "}
                <span className="font-bold text-slate-900 dark:text-white">
                  {singleActionOrderId ? "1 order" : `${selectedIds.length} orders`}
                </span>
                . The buyer will receive this note.
              </p>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Rejection Reason / Note
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Return period screenshot is unreadable or seller review not found..."
                  className="w-full mt-1.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setIsRejectModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleExecuteAction("REJECT")}
                  disabled={actionLoading}
                  className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider disabled:opacity-50"
                >
                  {actionLoading ? "Rejecting..." : "Confirm Reject"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
