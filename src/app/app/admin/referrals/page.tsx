"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { 
  Users, Gift, ShieldAlert, CheckCircle2, XCircle, Search, 
  ArrowUpRight, Clock, AlertTriangle, RefreshCw, Send, Check, 
  ChevronDown, ChevronUp, DollarSign, ExternalLink
} from "lucide-react";
import formatDate from "@/utils/formatDate";
import { SoundFX } from "@/utils/soundEffects";

interface ReferralRecord {
  _id: string;
  referralCode: string;
  status: string;
  hasAmazonOrder: boolean;
  baseRewardEarned: boolean;
  followOnCount: number;
  totalEarned: number;
  riskFlags: string[];
  createdAt: string;
  referrer: {
    name: string;
    email: string;
    mobile: string;
    aspireMintId: string;
  };
  referee: {
    name: string;
    email: string;
    mobile: string;
    aspireMintId: string;
  };
  orders: any[];
}

interface PendingWithdrawal {
  _id: string;
  amount: number;
  balanceAfter: number;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  note?: string;
  createdAt: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    mobile: string;
    aspireMintId: string;
    paymentDetails?: any;
  };
}

export default function AdminReferralsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<PendingWithdrawal[]>([]);
  
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState(false);

  // Approval modal
  const [selectedTx, setSelectedTx] = useState<PendingWithdrawal | null>(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [modalMode, setModalMode] = useState<"APPROVE" | "REJECT" | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/referrals?filter=${activeFilter}&search=${encodeURIComponent(search)}`);
      const json = await res.json();
      if (json.success) {
        setStats(json.data.stats || {});
        setReferrals(json.data.referrals || []);
        setPendingWithdrawals(json.data.pendingWithdrawals || []);
      } else {
        toast.error(json.message || "Failed to load referrals");
      }
    } catch (err) {
      toast.error("Network error loading referrals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [activeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAdminData();
  };

  const handleAction = async () => {
    if (!selectedTx || !modalMode) return;

    try {
      setActionLoading(true);
      const res = await fetch("/api/admin/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: modalMode === "APPROVE" ? "APPROVE_WITHDRAWAL" : "REJECT_WITHDRAWAL",
          transactionId: selectedTx._id,
          utr: utrNumber,
          rejectionReason: rejectReason,
        }),
      });

      const json = await res.json();
      if (json.success) {
        SoundFX.playCashRegister();
        toast.success(json.message);
        setModalMode(null);
        setSelectedTx(null);
        setUtrNumber("");
        setRejectReason("");
        fetchAdminData();
      } else {
        toast.error(json.message || "Operation failed");
      }
    } catch (err) {
      toast.error("Network failure during approval");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismissFlag = async (referralId: string) => {
    try {
      const res = await fetch("/api/admin/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DISMISS_FLAG",
          referralId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Flag dismissed");
        fetchAdminData();
      }
    } catch (err) {
      toast.error("Failed to dismiss flag");
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Gift className="w-3.5 h-3.5" />
            <span>Growth & Loyalty Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Referrals & Buyer Wallets
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Track user referral loops, Amazon anchor completions, pending escrow, and disburse buyer payouts.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="self-start sm:self-auto py-2.5 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-2 shadow-sm transition active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Registry
        </button>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Referrals</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {stats.totalReferrals || 0}
          </div>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
            {stats.conversionRate || 0}% Amazon Qualified
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Amazon Qualified (Base ₹50)</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.amazonQualified || 0}
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">Completed Anchor Orders</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Return Escrow</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-500 mt-1">
            ₹{stats.totalPending || 0}
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">Locked in 7-day return shield</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Disbursed Payouts</span>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            ₹{stats.totalLifetimeWithdrawn || 0}
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">Withdrawn to UPI / Banks</p>
        </div>
      </div>

      {/* PENDING WITHDRAWALS SECTION */}
      {pendingWithdrawals.length > 0 && (
        <div className="p-6 rounded-[28px] bg-amber-500/10 border border-amber-500/20 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <h2 className="font-bold text-base sm:text-lg">
                Pending Buyer Withdrawal Requests ({pendingWithdrawals.length})
              </h2>
            </div>
            <span className="text-xs font-bold text-amber-600">Action Required</span>
          </div>

          <div className="divide-y divide-amber-500/15">
            {pendingWithdrawals.map((pw) => (
              <div key={pw._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{pw.sender?.name}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                      {pw.sender?.aspireMintId}
                    </span>
                    <span className="text-xs text-slate-400">({pw.sender?.mobile})</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1">
                    {pw.note || `Payout Request: ₹${pw.amount}`}
                  </p>
                  <span className="text-[10px] text-slate-400">Requested: {formatDate(pw.createdAt)}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    ₹{pw.amount}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedTx(pw);
                      setModalMode("APPROVE");
                    }}
                    className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve (UTR)
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTx(pw);
                      setModalMode("REJECT");
                    }}
                    className="py-2 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MASTER REFERRAL DIRECTORY */}
      <div className="p-6 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <h2 className="font-bold text-lg text-slate-900 dark:text-white">
              All Referral Relationships & Tracking ({referrals.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit individual referee order progress, anchor Amazon qualification, and fraud flags
            </p>
          </div>

          {/* FILTERS & SEARCH */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              {[
                { label: "All", val: "ALL" },
                { label: "Amazon Qualified", val: "AMAZON_QUALIFIED" },
                { label: "Completed (₹90)", val: "COMPLETED" },
                { label: "Flagged", val: "FLAGGED" },
              ].map((f) => (
                <button
                  key={f.val}
                  onClick={() => setActiveFilter(f.val)}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeFilter === f.val
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search referrer or referee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="py-1.5 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs w-48 sm:w-64"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="pb-3 px-2">Referrer</th>
                <th className="pb-3 px-2">Invited Friend (Referee)</th>
                <th className="pb-3 px-2">Amazon Anchor</th>
                <th className="pb-3 px-2">Follow-ons</th>
                <th className="pb-3 px-2">Total Earned</th>
                <th className="pb-3 px-2">Risk Status</th>
                <th className="pb-3 px-2 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {referrals.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                  <td className="py-3 px-2 font-bold text-slate-900 dark:text-white">
                    <div>{r.referrer?.name || "Referrer"}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{r.referrer?.aspireMintId}</div>
                  </td>
                  <td className="py-3 px-2 font-bold text-slate-900 dark:text-white">
                    <div>{r.referee?.name || "Referee"}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{r.referee?.aspireMintId}</div>
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        r.hasAmazonOrder
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}
                    >
                      {r.hasAmazonOrder ? "Amazon Verified ✅ (+₹50)" : "Pending Amazon ⏳"}
                    </span>
                  </td>
                  <td className="py-3 px-2 font-semibold">
                    {r.followOnCount} / 4 Orders
                  </td>
                  <td className="py-3 px-2 font-black text-emerald-600 dark:text-emerald-400">
                    ₹{r.totalEarned} / ₹90
                  </td>
                  <td className="py-3 px-2">
                    {r.riskFlags?.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[9px] flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          {r.riskFlags[0]}
                        </span>
                        <button
                          onClick={() => handleDismissFlag(r._id)}
                          className="text-[9px] text-slate-400 hover:text-slate-600 underline"
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400">Normal</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-right text-slate-400 text-[10px]">
                    {formatDate(r.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* APPROVE / REJECT MODAL */}
      <AnimatePresence>
        {modalMode && selectedTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl max-w-sm w-full border border-slate-100 dark:border-slate-800 shadow-2xl space-y-4"
            >
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {modalMode === "APPROVE" ? "Approve Withdrawal Payout" : "Reject Withdrawal Request"}
              </h3>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
                <div><strong>User:</strong> {selectedTx.sender?.name} ({selectedTx.sender?.aspireMintId})</div>
                <div><strong>Amount:</strong> ₹{selectedTx.amount}</div>
                <div><strong>Note:</strong> {selectedTx.note}</div>
              </div>

              {modalMode === "APPROVE" ? (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Bank UTR / Transaction ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UTR1982736410"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Rejection Reason (Funds will be refunded to wallet)
                  </label>
                  <textarea
                    required
                    placeholder="e.g. Invalid UPI handle / account mismatch"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                    rows={3}
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAction}
                  disabled={actionLoading}
                  className={`flex-1 py-2 rounded-xl text-white font-bold text-xs transition ${
                    modalMode === "APPROVE" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"
                  }`}
                >
                  {actionLoading ? "Processing..." : modalMode === "APPROVE" ? "Confirm Payout" : "Reject & Refund"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
