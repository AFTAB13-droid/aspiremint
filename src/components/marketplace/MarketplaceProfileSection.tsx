"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, Shield, RefreshCw, ExternalLink, Unlink, Link2, Sparkles } from "lucide-react";

interface PlatformInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  tagline: string;
}

const PLATFORMS_CONFIG: PlatformInfo[] = [
  {
    id: "amazon",
    name: "Amazon India",
    icon: "📦",
    color: "from-amber-500 to-orange-500",
    accentBg: "bg-orange-50 dark:bg-orange-950/20",
    accentBorder: "border-orange-200/80 dark:border-orange-900/40",
    accentText: "text-orange-600 dark:text-orange-400",
    tagline: "Syncs 403-XXXXXXX-XXXXXXX orders & reviews",
  },
  {
    id: "flipkart",
    name: "Flipkart",
    icon: "🛍️",
    color: "from-blue-500 to-indigo-600",
    accentBg: "bg-blue-50 dark:bg-blue-950/20",
    accentBorder: "border-blue-200/80 dark:border-blue-900/40",
    accentText: "text-blue-600 dark:text-blue-400",
    tagline: "Syncs OD33XXXXXXXXXXXXXX orders & delivery status",
  },
  {
    id: "blinkit",
    name: "Blinkit Instant",
    icon: "⚡",
    color: "from-yellow-400 to-amber-500",
    accentBg: "bg-amber-50 dark:bg-amber-950/20",
    accentBorder: "border-amber-200/80 dark:border-amber-900/40",
    accentText: "text-amber-600 dark:text-amber-400",
    tagline: "Syncs ORDXXXXXXXXXXX invoice IDs & instant delivery",
  },
];

export function MarketplaceProfileSection() {
  const [platformStatuses, setPlatformStatuses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [updatingPlatform, setUpdatingPlatform] = useState<string | null>(null);
  const [browserDetected, setBrowserDetected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchStatuses();
    detectBrowserSessions();
  }, []);

  const detectBrowserSessions = () => {
    // Check if the current browser environment has stored marketplace cookies/bridge indicators
    try {
      const hasAmazon = localStorage.getItem("aspire_amazon_session") !== null || document.cookie.includes("amz");
      const hasFlipkart = localStorage.getItem("aspire_flipkart_session") !== null || document.cookie.includes("fk");
      const hasBlinkit = localStorage.getItem("aspire_blinkit_session") !== null || document.cookie.includes("blk");
      
      setBrowserDetected({
        amazon: hasAmazon,
        flipkart: hasFlipkart,
        blinkit: hasBlinkit,
      });
    } catch (e) {
      // Ignore localStorage restrictions
    }
  };

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/platforms");
      const data = await res.json();
      if (data.success && data.platforms) {
        setPlatformStatuses(data.platforms);
      }
    } catch (err) {
      console.error("Failed to load platform statuses:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleConnection = async (platformId: string, currentlyConnected: boolean) => {
    setUpdatingPlatform(platformId);
    const action = currentlyConnected ? "disconnect" : "connect";
    const toastId = toast.loading(
      currentlyConnected
        ? `Disconnecting ${platformId.toUpperCase()}...`
        : `Connecting ${platformId.toUpperCase()} via browser bridge...`
    );

    try {
      const res = await fetch("/api/user/platforms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: platformId, action }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message || "Updated successfully", { id: toastId });
        // Set local storage flag for fast browser detection
        if (!currentlyConnected) {
          localStorage.setItem(`aspire_${platformId}_session`, "active");
        } else {
          localStorage.removeItem(`aspire_${platformId}_session`);
        }
        await fetchStatuses();
        detectBrowserSessions();
      } else {
        toast.error(data.message || "Update failed", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || "Connection failed", { id: toastId });
    } finally {
      setUpdatingPlatform(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Marketplace Integrations
            </h3>
            <span className="text-[8px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800">
              Sandboxed Bridge
            </span>
          </div>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
            Link your Amazon, Flipkart & Blinkit accounts to automatically fetch order details & review proofs without manual entry.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchStatuses}
          disabled={loading}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Status
        </button>
      </div>

      {/* Trust & Privacy Notice */}
      <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-[#121A2D] border border-slate-200/80 dark:border-slate-800/80 flex items-start gap-3">
        <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800">
          <Shield className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
            100% Privacy & Zero Password Storage Guarantee
          </h4>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            AspireMint uses a read-only sandboxed browser bridge. We <strong>never</strong> ask for, view, or store your passwords or payment cards. It only detects order numbers and delivery confirmation for cashback payout verification.
          </p>
        </div>
      </div>

      {/* Platforms Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLATFORMS_CONFIG.map((p) => {
          const status = platformStatuses[p.id] || {};
          const isConnected = Boolean(status.connected);
          const isUpdating = updatingPlatform === p.id;
          const detected = Boolean(browserDetected[p.id]);

          return (
            <div
              key={p.id}
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                isConnected
                  ? "bg-white dark:bg-[#0E1526] border-emerald-300 dark:border-emerald-900/60 shadow-sm ring-1 ring-emerald-500/10"
                  : "bg-white dark:bg-[#0E1526] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
              }`}
            >
              <div>
                {/* Top Badge & Icon */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{p.icon}</span>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        {p.name}
                      </h4>
                      <p className="text-[9px] text-slate-400 font-mono">
                        {p.tagline}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                      isConnected
                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {isConnected ? "✓ Linked" : "Not Linked"}
                  </span>
                </div>

                {/* Account Details / Detection Info */}
                <div className="py-2.5 my-2 border-y border-slate-100 dark:border-slate-800/80">
                  {isConnected ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{status.accountName || "Connected User"}</span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 truncate">
                        ID: {status.accountIdentifier || "Browser Bridge Active"}
                      </p>
                      {status.lastSyncedAt && (
                        <p className="text-[9px] text-slate-400">
                          Last sync: {new Date(status.lastSyncedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {detected ? (
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Browser session detected. Tap below to link.
                        </span>
                      ) : (
                        "Connect your browser session to unlock 1-click auto-fill on deal order forms."
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                {isConnected ? (
                  <button
                    type="button"
                    onClick={() => handleToggleConnection(p.id, true)}
                    disabled={isUpdating}
                    className="w-full py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    {isUpdating ? "Disconnecting..." : "Disconnect Platform"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleToggleConnection(p.id, false)}
                    disabled={isUpdating}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    {isUpdating ? "Connecting..." : `⚡ Connect ${p.name}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
