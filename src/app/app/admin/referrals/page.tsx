"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { 
  Users, Gift, ShieldAlert, CheckCircle2, XCircle, Search, 
  ArrowUpRight, Clock, AlertTriangle, RefreshCw, Send, Check, 
  ChevronDown, ChevronUp, DollarSign, ExternalLink, Sparkles,
  ShieldCheck, CreditCard, ShoppingBag, ArrowRight
} from "lucide-react";
import formatDate from "@/utils/formatDate";
import { SoundFX } from "@/utils/soundEffects";
import { getUserAvatar } from "@/data/avatars";

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
    avatar?: string;
  };
  referee: {
    name: string;
    email: string;
    mobile: string;
    aspireMintId: string;
    avatar?: string;
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
    avatar?: string;
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
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

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

    if (modalMode === "APPROVE" && !utrNumber.trim()) {
      toast.error("Please enter a valid Bank UTR / Transaction reference number");
      return;
    }

    if (modalMode === "REJECT" && !rejectReason.trim()) {
      toast.error("Please enter a reason for rejecting the withdrawal");
      return;
    }

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

  const toggleRow = (id: string) => {
    setExpandedRow(prev => prev === id ? null : id);
  };

  return (
    <div className="w-full space-y-6 md:space-y-8 pb-24 px-3 sm:px-6 md:px-0">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-blue-500/10 dark:from-indigo-500/20 dark:to-blue-500/20 border border-indigo-200/50 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300 text-[11px] font-black uppercase tracking-[0.2em] mb-2">
            <Gift className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Growth & Loyalty Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Referral Network & Buyer Wallets
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 max-w-3xl">
            Track user referral loops, Amazon anchor completions (₹50 base), 7-day safety return escrow, and disburse buyer wallet payouts.
          </p>
        </div>

        <button
          onClick={() => {
            SoundFX.playCoinChime();
            fetchAdminData();
          }}
          className="self-start md:self-auto h-12 px-5 rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2.5 shadow-sm transition active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 text-indigo-600 dark:text-indigo-400 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Desk</span>
        </button>
      </div>

      {/* KPI METRICS (Edge-to-Edge Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Referrals */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 sm:p-7 rounded-[32px] text-white shadow-xl shadow-blue-600/20 relative overflow-hidden group border border-white/10"
        >
          <div className="absolute top-0 right-0 p-6 opacity-15 group-hover:scale-110 group-hover:opacity-25 transition-all duration-700 pointer-events-none">
            <Users className="w-24 h-24 -mt-4 -mr-4 text-white" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 block mb-2">Total Referrals</span>
          <div className="text-3xl sm:text-4xl font-black tracking-tight leading-none">
            {stats.totalReferrals || 0}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-100/90 font-bold">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{stats.conversionRate || 0}% Amazon Qualified</span>
          </div>
        </motion.div>

        {/* Amazon Qualified */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 sm:p-7 rounded-[32px] text-white shadow-xl shadow-emerald-600/20 relative overflow-hidden group border border-white/10"
        >
          <div className="absolute top-0 right-0 p-6 opacity-15 group-hover:scale-110 group-hover:opacity-25 transition-all duration-700 pointer-events-none">
            <CheckCircle2 className="w-24 h-24 -mt-4 -mr-4 text-white" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200 block mb-2">Amazon Anchor (Base ₹50)</span>
          <div className="text-3xl sm:text-4xl font-black tracking-tight leading-none">
            {stats.amazonQualified || 0}
          </div>
          <p className="mt-3 text-xs text-emerald-100/90 font-bold">
            Unlocked Base Referral Rewards
          </p>
        </motion.div>

        {/* Pending Escrow */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 sm:p-7 rounded-[32px] text-white shadow-xl shadow-amber-500/20 relative overflow-hidden group border border-white/10"
        >
          <div className="absolute top-0 right-0 p-6 opacity-15 group-hover:scale-110 group-hover:opacity-25 transition-all duration-700 pointer-events-none">
            <Clock className="w-24 h-24 -mt-4 -mr-4 text-white" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200 block mb-2">Return Escrow Balance</span>
          <div className="text-3xl sm:text-4xl font-black tracking-tight leading-none">
            ₹{stats.totalPending || 0}
          </div>
          <p className="mt-3 text-xs text-amber-100/90 font-bold">
            Locked in 7-Day Safety Escrow
          </p>
        </motion.div>

        {/* Disbursed Payouts */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-purple-600 via-indigo-700 to-violet-800 p-6 sm:p-7 rounded-[32px] text-white shadow-xl shadow-purple-600/20 relative overflow-hidden group border border-white/10"
        >
          <div className="absolute top-0 right-0 p-6 opacity-15 group-hover:scale-110 group-hover:opacity-25 transition-all duration-700 pointer-events-none">
            <DollarSign className="w-24 h-24 -mt-4 -mr-4 text-white" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-200 block mb-2">Disbursed Wallet Payouts</span>
          <div className="text-3xl sm:text-4xl font-black tracking-tight leading-none">
            ₹{stats.totalLifetimeWithdrawn || 0}
          </div>
          <p className="mt-3 text-xs text-purple-100/90 font-bold">
            Paid to Buyer UPI / Bank Accounts
          </p>
        </motion.div>
      </div>

      {/* PENDING WITHDRAWALS SECTION */}
      {pendingWithdrawals.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-5 sm:p-7 rounded-[32px] bg-amber-500/10 border border-amber-500/25 dark:bg-amber-950/20 dark:border-amber-500/30 shadow-lg shadow-amber-500/5 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-500/20">
            <div className="flex items-center gap-3 text-amber-800 dark:text-amber-300">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="font-black text-base sm:text-lg tracking-tight leading-tight">
                  Action Required: Buyer Withdrawal Requests ({pendingWithdrawals.length})
                </h2>
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  Buyers have crossed the ₹100 threshold and requested payouts to their accounts.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-500 text-white font-black text-[10px] uppercase tracking-widest self-start sm:self-auto">
              Pending Payouts
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {pendingWithdrawals.map((pw) => (
              <div 
                key={pw._id} 
                className="p-5 rounded-2xl bg-white dark:bg-[#0E1526] border border-amber-200/80 dark:border-amber-900/40 shadow-sm flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xs font-black shadow-sm overflow-hidden">
                        <img 
                          src={getUserAvatar(pw.sender?.avatar, pw.sender?.name)} 
                          alt="" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div>
                        <span className="font-black text-sm text-slate-900 dark:text-white leading-tight block">
                          {pw.sender?.name}
                        </span>
                        <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                          {pw.sender?.aspireMintId} • {pw.sender?.mobile}
                        </span>
                      </div>
                    </div>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                      ₹{pw.amount}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 text-xs text-slate-700 dark:text-slate-300 font-medium">
                    <p className="font-bold text-slate-900 dark:text-white">{pw.note || "Standard UPI Withdrawal"}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Requested: {formatDate(pw.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      SoundFX.playCoinChime();
                      setSelectedTx(pw);
                      setModalMode("APPROVE");
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve (UTR)
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTx(pw);
                      setModalMode("REJECT");
                    }}
                    className="py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 dark:text-rose-400 font-black text-xs uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white dark:bg-[#0E1526] rounded-[28px] p-4 sm:p-5 shadow-sm border border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:flex-1 max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
          <input 
            type="text" 
            placeholder="Search by Referrer, Referee or AspireMint ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-6 h-12 rounded-2xl bg-slate-50 dark:bg-[#131B2E] border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:bg-white dark:focus:bg-[#0B101D] focus:ring-indigo-100 dark:focus:ring-indigo-900 transition-all font-bold text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </form>

        <div className="w-full md:w-auto flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {[
            { label: "All Referrals", val: "ALL" },
            { label: "Amazon Qualified", val: "AMAZON_QUALIFIED" },
            { label: "Max Done (₹90)", val: "COMPLETED" },
            { label: "Flagged Risk", val: "FLAGGED" },
          ].map((f) => (
            <button
              key={f.val}
              onClick={() => {
                SoundFX.playCoinChime();
                setActiveFilter(f.val);
              }}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider whitespace-nowrap transition-all active:scale-95 ${
                activeFilter === f.val
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                  : "bg-slate-50 dark:bg-[#131B2E] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-100 dark:border-slate-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* DESKTOP VIEW: FULL-WIDTH TABLE */}
      <div className="hidden md:block rounded-[32px] border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#0E1526] shadow-xl shadow-slate-200/40 relative overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#0B101D] border-b border-slate-100 dark:border-slate-800/80">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Referrer</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Invited Referee</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Amazon Anchor</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Follow-on Orders</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Total Earned</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Risk Shield</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {referrals.map((r) => (
                <React.Fragment key={r._id}>
                  <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Referrer */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xs overflow-hidden shrink-0">
                          <img 
                            src={getUserAvatar(r.referrer?.avatar, r.referrer?.name)} 
                            alt="" 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div>
                          <p className="font-black text-sm text-slate-900 dark:text-white leading-snug">
                            {r.referrer?.name || "Referrer"}
                          </p>
                          <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md">
                            {r.referrer?.aspireMintId || "N/A"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Referee */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-xs overflow-hidden shrink-0">
                          <img 
                            src={getUserAvatar(r.referee?.avatar, r.referee?.name)} 
                            alt="" 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div>
                          <p className="font-black text-sm text-slate-900 dark:text-white leading-snug">
                            {r.referee?.name || "Referee"}
                          </p>
                          <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                            {r.referee?.aspireMintId || "N/A"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Amazon Anchor */}
                    <td className="px-6 py-4">
                      {r.hasAmazonOrder ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-black">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Qualified (+₹50)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-black">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Awaiting Amazon</span>
                        </span>
                      )}
                    </td>

                    {/* Follow-on count */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4].map((step) => (
                            <span 
                              key={step} 
                              className={`w-2.5 h-2.5 rounded-full ${
                                step <= r.followOnCount 
                                  ? "bg-indigo-600 dark:bg-indigo-400" 
                                  : "bg-slate-200 dark:bg-slate-700"
                              }`} 
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          {r.followOnCount} of 4 orders (+₹{r.followOnCount * 10})
                        </span>
                      </div>
                    </td>

                    {/* Total Earned */}
                    <td className="px-6 py-4">
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                        ₹{r.totalEarned}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-bold">Max ₹90 cap</span>
                    </td>

                    {/* Risk Status */}
                    <td className="px-6 py-4">
                      {r.riskFlags && r.riskFlags.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-black text-[10px] flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            {r.riskFlags[0]}
                          </span>
                          <button
                            onClick={() => handleDismissFlag(r._id)}
                            className="text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-white underline font-bold"
                          >
                            Dismiss
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs font-bold">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          <span>Clean</span>
                        </span>
                      )}
                    </td>

                    {/* Actions / Expand */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleRow(r._id)}
                        className="py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs inline-flex items-center gap-1.5 transition active:scale-95"
                      >
                        <span>{r.orders?.length || 0} Orders</span>
                        {expandedRow === r._id ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* EXPANDABLE DETAIL DRAWER FOR DESKTOP */}
                  {expandedRow === r._id && (
                    <tr className="bg-slate-50/70 dark:bg-[#0B101D]/70">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="p-4 rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-100 dark:border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-black text-xs uppercase tracking-wider text-slate-400">
                              Attributed Referral Orders for {r.referee?.name}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Code: {r.referralCode} • Joined {formatDate(r.createdAt)}
                            </span>
                          </div>

                          {r.orders && r.orders.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {r.orders.map((ord: any, idx: number) => (
                                <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs space-y-1">
                                  <div className="flex items-center justify-between font-bold">
                                    <span className="text-slate-900 dark:text-white">Order #{ord.orderId || `ORD-${idx+1}`}</span>
                                    <span className="text-emerald-600 dark:text-emerald-400">+{ord.rewardEarned ? `₹${ord.rewardEarned}` : "₹10"}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 font-medium">Platform: {ord.platform || "Amazon"}</p>
                                  <p className="text-[10px] text-slate-400">{formatDate(ord.completedAt || ord.createdAt || new Date().toISOString())}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No orders logged yet by referee.</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE VIEW: FULL-WIDTH APP-LIKE CARDS */}
      <div className="md:hidden space-y-4">
        {referrals.map((r) => (
          <motion.div
            key={r._id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white dark:bg-[#0E1526] rounded-[28px] border border-slate-100 dark:border-slate-800 p-5 shadow-lg shadow-slate-200/30 space-y-4"
          >
            {/* Top row: Referrer & Referee */}
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xs overflow-hidden shrink-0">
                  <img 
                    src={getUserAvatar(r.referrer?.avatar, r.referrer?.name)} 
                    alt="" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="overflow-hidden">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Referrer</span>
                  <p className="font-black text-xs text-slate-900 dark:text-white truncate">{r.referrer?.name}</p>
                  <span className="text-[9px] font-mono text-blue-600 dark:text-blue-400 font-bold">{r.referrer?.aspireMintId}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-xs overflow-hidden shrink-0">
                  <img 
                    src={getUserAvatar(r.referee?.avatar, r.referee?.name)} 
                    alt="" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="overflow-hidden">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Referee</span>
                  <p className="font-black text-xs text-slate-900 dark:text-white truncate">{r.referee?.name}</p>
                  <span className="text-[9px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">{r.referee?.aspireMintId}</span>
                </div>
              </div>
            </div>

            {/* Middle row: Badges and Progress */}
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">Anchor Status</span>
                {r.hasAmazonOrder ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-black text-[10px]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Amazon Verified (+₹50)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 font-black text-[10px]">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>Awaiting Amazon</span>
                  </span>
                )}
              </div>

              <div className="text-right">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">Total Earned</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  ₹{r.totalEarned} <span className="text-[10px] text-slate-400 font-normal">/ ₹90</span>
                </span>
              </div>
            </div>

            {/* Follow on orders bar */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#131B2E] flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Follow-on Orders: {r.followOnCount} of 4 (+₹{r.followOnCount * 10})
              </span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4].map((step) => (
                  <span 
                    key={step} 
                    className={`w-2.5 h-2.5 rounded-full ${
                      step <= r.followOnCount 
                        ? "bg-indigo-600 dark:bg-indigo-400" 
                        : "bg-slate-200 dark:bg-slate-700"
                    }`} 
                  />
                ))}
              </div>
            </div>

            {/* Bottom row: Risk & Accordion Button */}
            <div className="flex items-center justify-between pt-2">
              {r.riskFlags && r.riskFlags.length > 0 ? (
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 font-black text-[9px] flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    {r.riskFlags[0]}
                  </span>
                  <button
                    onClick={() => handleDismissFlag(r._id)}
                    className="text-[9px] text-slate-400 hover:text-slate-700 underline font-bold"
                  >
                    Dismiss
                  </button>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-500 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Verified Clean</span>
                </span>
              )}

              <button
                onClick={() => toggleRow(r._id)}
                className="py-1 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center gap-1"
              >
                <span>{r.orders?.length || 0} Orders</span>
                {expandedRow === r._id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Expandable Order Details in Mobile */}
            {expandedRow === r._id && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2"
              >
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Orders Breakdown
                </span>
                {r.orders && r.orders.length > 0 ? (
                  r.orders.map((ord: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs flex items-center justify-between font-bold">
                      <div>
                        <span className="text-slate-900 dark:text-white block">#{ord.orderId || `ORD-${idx+1}`}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{formatDate(ord.completedAt || ord.createdAt)}</span>
                      </div>
                      <span className="text-emerald-600 dark:text-emerald-400 font-black">+{ord.rewardEarned ? `₹${ord.rewardEarned}` : "₹10"}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No orders logged yet.</p>
                )}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* ZERO MATCHES STATE */}
      {referrals.length === 0 && !loading && (
        <div className="py-24 text-center">
          <div className="h-16 w-16 bg-slate-50 dark:bg-slate-800/60 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-600">
            <Gift className="w-8 h-8" />
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">No referral relationships found</p>
        </div>
      )}

      {/* APPROVE / REJECT MODAL */}
      <AnimatePresence>
        {modalMode && selectedTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#0E1526] p-6 sm:p-7 rounded-[32px] max-w-md w-full border border-slate-100 dark:border-slate-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className={`h-11 w-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md ${
                  modalMode === "APPROVE" ? "bg-emerald-600" : "bg-rose-600"
                }`}>
                  {modalMode === "APPROVE" ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                    {modalMode === "APPROVE" ? "Approve & Disburse Payout" : "Reject Withdrawal Request"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {modalMode === "APPROVE" ? "Record bank UTR number and post to ledger" : "Refund balance back to buyer wallet"}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131B2E] border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Buyer Account:</span>
                  <span className="font-black text-slate-900 dark:text-white">{selectedTx.sender?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">AspireMint ID:</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedTx.sender?.aspireMintId}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                  <span className="text-slate-500 font-bold">Payout Amount:</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">₹{selectedTx.amount}</span>
                </div>
                {selectedTx.note && (
                  <div className="pt-1 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                    <strong>Note:</strong> {selectedTx.note}
                  </div>
                )}
              </div>

              {modalMode === "APPROVE" ? (
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
                    Bank UTR / Transaction Reference ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UTR1982736410 or UPI-Ref-982173"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    className="w-full h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#131B2E] text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-slate-900 dark:text-white"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
                    Rejection Reason (Transmitted to Buyer)
                  </label>
                  <textarea
                    required
                    placeholder="e.g. Invalid UPI handle / bank account mismatch. Please update payment details."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#131B2E] text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500 transition-all text-slate-900 dark:text-white"
                    rows={3}
                  />
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="flex-1 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-wider transition active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAction}
                  disabled={actionLoading}
                  className={`flex-1 h-12 rounded-2xl text-white font-black text-xs uppercase tracking-wider transition active:scale-95 shadow-md flex items-center justify-center gap-2 ${
                    modalMode === "APPROVE" ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20" : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20"
                  }`}
                >
                  {actionLoading ? "Processing..." : modalMode === "APPROVE" ? "Disburse Payout" : "Reject & Refund"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
