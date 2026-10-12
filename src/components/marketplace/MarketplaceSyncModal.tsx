"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export interface SyncedOrder {
  orderId: string;
  marketplace: string;
  title: string;
  brandName?: string;
  productCode?: string;
  dealType?: string;
  reviewType?: string;
  amount: number;
  lessAmount?: number;
  orderDate: string;
  status: string;
  imageUrl?: string;
  productLink?: string;
  isAlreadySubmitted?: boolean;
  reviewerName?: string;
  platformDisplayName?: string;
}

export interface RefundProofs {
  reviewLink?: string;
  reviewScreenshot?: string;
  sellerFeedbackScreenshot?: string;
  returnPeriodScreenshot?: string;
  deliveryScreenshot?: string;
  invoiceScreenshot?: string;
  invoiceOrderId?: string;
  isDelivered?: boolean;
  deliveryDate?: string;
  isReturnWindowClosed?: boolean;
  returnClosedDate?: string;
  reviewRating?: number;
  reviewTitle?: string;
  reviewerName?: string;
}

interface MarketplaceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "ORDER_SELECT" | "REFUND_FETCH";
  currentMarketplace?: string;
  lockedPlatform?: string;
  orderId?: string; // used in REFUND_FETCH
  onSelectOrder?: (order: SyncedOrder) => void;
  onApplyProofs?: (proofs: RefundProofs) => void;
}

const PLATFORMS = [
  { id: "amazon", name: "Amazon", icon: "📦", color: "from-amber-500 to-orange-500", border: "border-orange-500/30", bg: "bg-orange-500/10", text: "text-orange-500" },
  { id: "flipkart", name: "Flipkart", icon: "🛍️", color: "from-blue-500 to-indigo-600", border: "border-blue-500/30", bg: "bg-blue-500/10", text: "text-blue-500" },
  { id: "blinkit", name: "Blinkit", icon: "⚡", color: "from-yellow-400 to-amber-500", border: "border-amber-400/30", bg: "bg-yellow-500/10", text: "text-amber-500" },
];

export function MarketplaceSyncModal({
  isOpen,
  onClose,
  mode,
  currentMarketplace,
  lockedPlatform,
  orderId,
  onSelectOrder,
  onApplyProofs,
}: MarketplaceSyncModalProps) {
  // Determine locked platform if predefined
  const normalizedLocked = (() => {
    const raw = (lockedPlatform || currentMarketplace || "").toLowerCase().trim();
    if (!raw) return null;
    if (raw.includes("flipkart")) return "flipkart";
    if (raw.includes("blinkit")) return "blinkit";
    if (raw.includes("amazon")) return "amazon";
    return null;
  })();

  // Determine initial platform
  const initialPlatform = (() => {
    if (normalizedLocked) return normalizedLocked;
    const norm = (currentMarketplace || "").toLowerCase();
    if (norm.includes("flipkart")) return "flipkart";
    if (norm.includes("blinkit")) return "blinkit";
    return "amazon";
  })();

  const [activePlatform, setActivePlatform] = useState<string>(initialPlatform);
  const [platformStatuses, setPlatformStatuses] = useState<Record<string, any>>({});
  const [orders, setOrders] = useState<SyncedOrder[]>([]);
  const [refundProofs, setRefundProofs] = useState<RefundProofs | null>(null);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [showSecurityDetails, setShowSecurityDetails] = useState(false);

  // Sync activePlatform if locked or currentMarketplace prop changes
  useEffect(() => {
    if (normalizedLocked) {
      setActivePlatform(normalizedLocked);
    } else if (currentMarketplace) {
      const norm = currentMarketplace.toLowerCase();
      if (norm.includes("flipkart")) setActivePlatform("flipkart");
      else if (norm.includes("blinkit")) setActivePlatform("blinkit");
      else setActivePlatform("amazon");
    }
  }, [normalizedLocked, currentMarketplace]);

  // Load user's linked platforms on open
  useEffect(() => {
    if (!isOpen) return;
    fetchPlatformStatuses();
  }, [isOpen]);

  // Load orders or refund proofs when activePlatform or modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (mode === "ORDER_SELECT") {
      fetchOrders(activePlatform);
    } else if (mode === "REFUND_FETCH") {
      fetchRefundProofs(orderId || "", activePlatform);
    }
  }, [isOpen, activePlatform, mode, orderId]);

  const fetchPlatformStatuses = async () => {
    try {
      const res = await fetch("/api/user/platforms");
      const data = await res.json();
      if (data.success && data.platforms) {
        setPlatformStatuses(data.platforms);
      }
    } catch (err) {
      console.error("Error fetching platforms status:", err);
    }
  };

  const fetchOrders = async (platform: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/platforms/orders?marketplace=${platform}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Error fetching platform orders:", err);
      toast.error("Could not fetch orders from marketplace bridge");
    } finally {
      setLoading(false);
    }
  };

  const fetchRefundProofs = async (oid: string, platform: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/platforms/refund-proofs?orderId=${encodeURIComponent(oid)}&marketplace=${platform}`);
      const data = await res.json();
      if (data.success && data.proofs) {
        setRefundProofs(data.proofs);
      }
    } catch (err) {
      console.error("Error fetching refund proofs:", err);
      toast.error("Could not fetch automated proofs");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleConnect = async (platform: string, currentlyConnected: boolean) => {
    setConnecting(true);
    const action = currentlyConnected ? "disconnect" : "connect";
    const toastId = toast.loading(
      currentlyConnected
        ? `Disconnecting ${platform.toUpperCase()}...`
        : `Connecting ${platform.toUpperCase()} via Secure Bridge...`
    );

    try {
      const res = await fetch("/api/user/platforms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, action }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message || "Updated successfully", { id: toastId });
        await fetchPlatformStatuses();
        if (mode === "ORDER_SELECT") {
          await fetchOrders(platform);
        } else if (mode === "REFUND_FETCH") {
          await fetchRefundProofs(orderId || "", platform);
        }
      } else {
        toast.error(data.message || "Action failed", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || "Connection error", { id: toastId });
    } finally {
      setConnecting(false);
    }
  };

  if (!isOpen) return null;

  const currentStatus = platformStatuses[activePlatform] || {};
  const isConnected = Boolean(currentStatus.connected);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md">
        {/* Backdrop click */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal / Sheet Container */}
        <motion.div
          initial={{ y: "100%", opacity: 0.8 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="relative w-full sm:max-w-2xl bg-white dark:bg-[#0E1526] rounded-t-[32px] sm:rounded-[36px] shadow-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] z-10"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between bg-slate-50/50 dark:bg-[#0B101D]/60 shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Sandboxed Bridge 2.0
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Read-Only Sync
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <span>⚡</span>
                {mode === "ORDER_SELECT"
                  ? "Auto-Fetch Marketplace Order"
                  : "Auto-Fetch Delivery & Reviews"}
              </h2>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {mode === "ORDER_SELECT"
                  ? "Select your recent purchase to auto-fill Order ID & Amount in 1 click."
                  : "Automatically retrieve verified review link and delivery proofs."}
              </p>
            </div>

            <button
              onClick={onClose}
              className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all active:scale-95 shrink-0"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Platform Selector or Locked Notice */}
          <div className="px-6 py-3 bg-white dark:bg-[#0E1526] border-b border-slate-100 dark:border-slate-800/80 shrink-0">
            {normalizedLocked ? (
              <div className="flex items-center justify-between p-2.5 px-3.5 rounded-2xl bg-indigo-50/70 dark:bg-[#151F36] border border-indigo-200/80 dark:border-indigo-800/60">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{PLATFORMS.find((p) => p.id === normalizedLocked)?.icon}</span>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Predefined Deal Marketplace
                    </span>
                    <h4 className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-tight">
                      {PLATFORMS.find((p) => p.id === normalizedLocked)?.name} (Locked)
                    </h4>
                  </div>
                </div>
                <span className="text-[8px] font-black uppercase tracking-wider bg-indigo-600 text-white px-2.5 py-1 rounded-full shadow-sm">
                  Deal Specific
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-[#151F36] rounded-2xl">
                {PLATFORMS.map((p) => {
                  const isSelected = activePlatform === p.id;
                  const pConnected = Boolean(platformStatuses[p.id]?.connected);
                  return (
                    <button
                      key={p.id}
                      onClick={() => setActivePlatform(p.id)}
                      className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                        isSelected
                          ? "bg-white dark:bg-[#0E1526] text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <span>{p.icon}</span>
                      <span className="truncate">{p.name}</span>
                      {pConnected && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Connected" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Body Content (Scrollable) */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
            {/* Connection Status Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#151F36] border border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                    isConnected ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  {isConnected ? "✓" : "🔗"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      {PLATFORMS.find((p) => p.id === activePlatform)?.name} Account
                    </p>
                    <span
                      className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isConnected
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {isConnected ? "Linked & Active" : "Not Linked"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {isConnected
                      ? `Bridge User: ${currentStatus.accountName || "User"} (${currentStatus.accountIdentifier || "Secure Session"})`
                      : "Link once to auto-sync purchase receipts and order numbers safely."}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2 self-end sm:self-auto">
                {isConnected ? (
                  <button
                    onClick={() => handleToggleConnect(activePlatform, true)}
                    disabled={connecting}
                    className="text-[10px] font-bold text-rose-500 dark:text-rose-400 hover:underline px-2 py-1 active:scale-95 disabled:opacity-50"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleConnect(activePlatform, false)}
                    disabled={connecting}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {connecting ? "Connecting..." : "⚡ 1-Click Connect"}
                  </button>
                )}
              </div>
            </div>

            {/* MODE: ORDER SELECT */}
            {mode === "ORDER_SELECT" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
                    <span>Recent Marketplace Orders</span>
                    {orders.length > 0 && (
                      <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {orders.length}
                      </span>
                    )}
                  </h3>
                  {isConnected && (
                    <button
                      onClick={() => fetchOrders(activePlatform)}
                      className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline flex items-center gap-1"
                    >
                      <svg className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </button>
                  )}
                </div>

                {!isConnected ? (
                  <div className="text-center py-10 px-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#121A2D]">
                    <div className="text-3xl mb-2">🔒</div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">
                      Platform Not Connected
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                      Connect your {PLATFORMS.find((p) => p.id === activePlatform)?.name} account above to view your recent orders and auto-fill in one tap.
                    </p>
                    <button
                      onClick={() => handleToggleConnect(activePlatform, false)}
                      disabled={connecting}
                      className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                    >
                      ⚡ Connect {PLATFORMS.find((p) => p.id === activePlatform)?.name} Now
                    </button>
                  </div>
                ) : loading ? (
                  <div className="space-y-3 py-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"
                      />
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 px-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#121A2D]">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                      No recent orders found for this platform.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {orders.map((order, idx) => (
                      <div
                        key={order.orderId || idx}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                          order.isAlreadySubmitted
                            ? "bg-slate-50/60 dark:bg-[#101728] border-slate-200/60 dark:border-slate-800/50 opacity-80"
                            : "bg-white dark:bg-[#121A2D] border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-sm"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Image */}
                          <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                            {order.imageUrl ? (
                              <img
                                src={order.imageUrl}
                                alt={order.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xl">
                                📦
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  {order.status}
                                </span>
                                <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1 mt-1">
                                  {order.title}
                                </h4>
                              </div>
                              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 shrink-0">
                                ₹{order.amount}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                              <span>
                                ID: <span className="font-bold text-slate-700 dark:text-slate-200 select-all">{order.orderId}</span>
                              </span>
                              <span>•</span>
                              <span>{order.orderDate}</span>
                            </div>

                            {/* Actions / CTA */}
                            <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                              <div className="text-[9px] text-slate-400 truncate">
                                {order.brandName && (
                                  <span className="font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mr-1.5">
                                    {order.brandName}
                                  </span>
                                )}
                                {order.productCode && `Code: ${order.productCode}`}
                              </div>

                              {order.isAlreadySubmitted ? (
                                <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900">
                                  Already Registered
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onSelectOrder) onSelectOrder(order);
                                    toast.success(`Auto-filled order ${order.orderId}!`);
                                    onClose();
                                  }}
                                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black text-[10px] uppercase tracking-wider shadow-sm hover:from-indigo-700 hover:to-blue-700 active:scale-95 transition-all flex items-center gap-1 shrink-0"
                                >
                                  <span>⚡ Auto-Fill</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MODE: REFUND FETCH */}
            {mode === "REFUND_FETCH" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-blue-600 dark:text-blue-400 font-black text-sm">🎯 Target Order</span>
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 select-all">
                      {orderId || "Current Order"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Querying {PLATFORMS.find((p) => p.id === activePlatform)?.name} bridge for verified delivery status, return window completion, and published review URL.
                  </p>
                </div>

                {loading ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Querying Sandboxed Bridge...
                    </p>
                  </div>
                ) : refundProofs ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Delivery Status */}
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#121A2D] border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-500 text-base">✓</span>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                              Delivery Verified
                            </p>
                            <p className="text-xs font-black text-slate-800 dark:text-white">
                              {refundProofs.deliveryDate || "Delivered"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Return Period */}
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#121A2D] border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-500 text-base">✓</span>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                              Return Window
                            </p>
                            <p className="text-xs font-black text-slate-800 dark:text-white">
                              Closed on {refundProofs.returnClosedDate || "Past Period"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Review Link / Blinkit Invoice */}
                      {refundProofs.reviewLink ? (
                        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#121A2D] border border-slate-200 dark:border-slate-800 sm:col-span-2">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                            Verified Review URL
                          </p>
                          <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 truncate select-all">
                            {refundProofs.reviewLink}
                          </p>
                        </div>
                      ) : null}

                      {refundProofs.invoiceOrderId ? (
                        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#121A2D] border border-slate-200 dark:border-slate-800 sm:col-span-2">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                            Blinkit Invoice ID
                          </p>
                          <p className="text-xs font-mono font-bold text-slate-800 dark:text-white select-all">
                            {refundProofs.invoiceOrderId}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (onApplyProofs && refundProofs) {
                            onApplyProofs(refundProofs);
                            toast.success("Applied verified proofs to refund form!");
                            onClose();
                          }
                        }}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <span>⚡ Apply All Verified Proofs to Form</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-xs text-slate-500">Could not retrieve proofs for this order ID.</p>
                  </div>
                )}
              </div>
            )}

            {/* Privacy & Trust Assurance Box */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#0B101D]/80 p-3.5">
              <button
                type="button"
                onClick={() => setShowSecurityDetails(!showSecurityDetails)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🛡️</span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Bank-Grade Privacy & Sandboxed Security
                  </span>
                </div>
                <span className="text-slate-400 text-xs">
                  {showSecurityDetails ? "▲" : "▼"}
                </span>
              </button>

              {showSecurityDetails && (
                <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold shrink-0">✓</span>
                    <span><strong>Zero Password Storage:</strong> AspireMint never asks for or stores your marketplace passwords or payment cards.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold shrink-0">✓</span>
                    <span><strong>Read-Only Access:</strong> The sandboxed bridge only checks order numbers and delivery confirmation for cashback payout.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold shrink-0">✓</span>
                    <span><strong>100% Manual Override:</strong> You can edit or change any auto-filled value anytime before submitting.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-slate-50 dark:bg-[#0B101D] border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Prefer typing manually?
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider transition-all"
            >
              Fill Manually
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
