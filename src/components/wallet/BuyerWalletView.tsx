"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";
import { 
  Wallet, ArrowDownLeft, ArrowUpRight, Clock, ShieldCheck, 
  Sparkles, RefreshCw, AlertCircle, CheckCircle2, ChevronRight, 
  X, Send, Building, Smartphone, Info, Gift, ArrowRight
} from "lucide-react";
import { SoundFX } from "@/utils/soundEffects";
import formatDate from "@/utils/formatDate";

interface TransactionItem {
  _id: string;
  type: "CREDIT" | "DEBIT";
  category: string;
  amount: number;
  balanceAfter: number;
  status: "PENDING" | "COMPLETED" | "FAILED";
  referenceId?: string;
  note?: string;
  createdAt: string;
}

interface BuyerWalletData {
  walletId: string;
  balance: number;
  availableBalance: number;
  pendingBalance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  lifetimeWithdrawn: number;
  minWithdrawalThreshold: number;
  isWithdrawalEligible: boolean;
  progressPercentage: number;
}

export default function BuyerWalletView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    wallet: BuyerWalletData;
    transactions: TransactionItem[];
  } | null>(null);

  const [activeFilter, setActiveFilter] = useState<"ALL" | "CREDIT" | "DEBIT" | "PENDING">("ALL");
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  // Withdrawal form
  const [withdrawMethod, setWithdrawMethod] = useState<"UPI" | "BANK">("UPI");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [upiId, setUpiId] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankName, setBankName] = useState("");

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/wallet/buyer");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        if (json.data.wallet.minWithdrawalThreshold) {
          setWithdrawAmount(String(Math.min(json.data.wallet.availableBalance, json.data.wallet.minWithdrawalThreshold)));
        }
      }
    } catch (err) {
      toast.error("Failed to load wallet details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    const threshold = data?.wallet?.minWithdrawalThreshold || 90;

    if (!amount || amount < threshold) {
      toast.error(`Minimum withdrawal amount is ₹${threshold}`);
      return;
    }

    if (amount > (data?.wallet?.availableBalance || 0)) {
      toast.error("Withdrawal amount cannot exceed available balance");
      return;
    }

    if (withdrawMethod === "UPI" && (!upiId || !upiId.includes("@"))) {
      toast.error("Enter a valid UPI ID (e.g. yourname@okhdfc)");
      return;
    }

    if (withdrawMethod === "BANK" && (!accountNumber || !ifscCode)) {
      toast.error("Account number and IFSC code are required");
      return;
    }

    try {
      setWithdrawing(true);
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          paymentMethod: withdrawMethod,
          upiId,
          bankName,
          accountNumber,
          ifscCode,
        }),
      });

      const result = await res.json();
      if (result.success) {
        SoundFX.playCashRegister();
        toast.success(result.message || "Withdrawal requested!");
        setShowWithdrawModal(false);
        fetchWallet();
      } else {
        toast.error(result.message || "Withdrawal failed");
      }
    } catch (err) {
      toast.error("Network error during withdrawal request");
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-7 h-7 text-indigo-600 animate-spin mb-2" />
        <p className="text-xs font-semibold text-slate-500">Loading your wallet...</p>
      </div>
    );
  }

  const wallet = data?.wallet;
  const transactions = data?.transactions || [];

  const filteredTx = transactions.filter((tx) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "PENDING") return tx.status === "PENDING";
    return tx.type === activeFilter;
  });

  return (
    <div className="w-full max-w-4xl mx-auto pb-20 space-y-3 sm:space-y-5">
      {/* FULL WIDTH NATIVE APP HEADER CARD */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-b-[32px] sm:rounded-[32px] p-5 sm:p-7 shadow-xl relative overflow-hidden border-b sm:border border-indigo-500/20"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />

        {/* TOP BAR: WALLET ID & BADGE */}
        <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300 block leading-tight">My Wallet</span>
              <span className="text-xs font-mono font-bold text-slate-300">{wallet?.walletId || "WLT-AM"}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[10px] font-bold text-emerald-300">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Active</span>
          </div>
        </div>

        {/* COMPACT BALANCES SECTION (SIDE-BY-SIDE) */}
        <div className="relative z-10 grid grid-cols-2 gap-3 my-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
              Available Cash
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                ₹{wallet?.availableBalance?.toLocaleString() || 0}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">INR</span>
            </div>
            <span className="text-[10px] text-slate-300 block mt-1 leading-tight">
              Ready to withdraw or spend
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4">
            <div className="flex items-center gap-1 text-slate-400 mb-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider block">Pending Escrow</span>
              <Clock className="w-2.5 h-2.5 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                ₹{wallet?.pendingBalance?.toLocaleString() || 0}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1 leading-tight">
              7-Day Return Shield
            </span>
          </div>
        </div>

        {/* INLINE THRESHOLD PROGRESS */}
        <div className="relative z-10 pt-2 border-t border-white/10 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-slate-300">Min. Payout: ₹{wallet?.minWithdrawalThreshold}</span>
            <span className={wallet?.isWithdrawalEligible ? "text-emerald-400 font-black" : "text-amber-400 font-semibold"}>
              {wallet?.isWithdrawalEligible ? "✅ Ready to Withdraw" : `Earn ₹${(wallet?.minWithdrawalThreshold || 90) - (wallet?.availableBalance || 0)} more`}
            </span>
          </div>
          <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${wallet?.progressPercentage || 0}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`h-full rounded-full ${
                wallet?.isWithdrawalEligible
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                  : "bg-gradient-to-r from-amber-500 to-orange-400"
              }`}
            />
          </div>
        </div>

        {/* FULL-WIDTH MOBILE ACTION BUTTONS */}
        <div className="relative z-10 mt-4 grid grid-cols-2 gap-2.5">
          <button
            onClick={() => {
              if (!wallet?.isWithdrawalEligible) {
                toast.error(`Min ₹${wallet?.minWithdrawalThreshold} required. Refer friends to earn quickly!`);
                return;
              }
              SoundFX.playCoinChime();
              setShowWithdrawModal(true);
            }}
            disabled={!wallet?.isWithdrawalEligible}
            className={`py-3 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md ${
              wallet?.isWithdrawalEligible
                ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer"
                : "bg-white/10 text-slate-400 border border-white/10 cursor-not-allowed opacity-60"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Withdraw to UPI</span>
          </button>

          <Link
            href="/app/referral"
            onClick={() => SoundFX.playCoinChime()}
            className="py-3 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition"
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Earn ₹90 / Friend</span>
          </Link>
        </div>
      </motion.div>

      {/* COMPACT ACTIVITY LEDGER (FULL WIDTH CONTAINER) */}
      <div className="px-3.5 sm:px-0">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-[28px] p-4 sm:p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5">
              Wallet Activity
            </h3>

            {/* COMPACT PILL FILTERS */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
              {(["ALL", "CREDIT", "DEBIT", "PENDING"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    SoundFX.playCoinChime();
                    setActiveFilter(f);
                  }}
                  className={`px-2 py-1 rounded-md transition ${
                    activeFilter === f
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                      : "text-slate-500"
                  }`}
                >
                  {f === "CREDIT" ? "Earned" : f === "DEBIT" ? "Spent" : f === "PENDING" ? "Pending" : "All"}
                </button>
              ))}
            </div>
          </div>

          {filteredTx.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-1.5" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No activity recorded yet</p>
              <p className="text-[10px] text-slate-400">Referral rewards and withdrawals will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTx.map((tx) => {
                const isCredit = tx.type === "CREDIT";
                const isPending = tx.status === "PENDING";
                return (
                  <div key={tx._id} className="py-2.5 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isPending
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600"
                            : isCredit
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600"
                            : "bg-rose-50 dark:bg-rose-950/40 text-rose-600"
                        }`}
                      >
                        {isPending ? (
                          <Clock className="w-4 h-4" />
                        ) : isCredit ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                          {tx.note || tx.category.replace(/_/g, " ")}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                          <span>{formatDate(tx.createdAt)}</span>
                          <span
                            className={`px-1 py-0.2 rounded font-bold text-[9px] ${
                              tx.status === "COMPLETED"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : tx.status === "PENDING"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            }`}
                          >
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs sm:text-sm font-black ${
                          isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isCredit ? "+" : "-"}₹{tx.amount}
                      </span>
                      <p className="text-[9px] text-slate-400">Bal: ₹{tx.balanceAfter}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* WITHDRAWAL MODAL */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-white dark:bg-slate-900 p-5 rounded-t-[28px] sm:rounded-3xl max-w-md w-full border border-slate-100 dark:border-slate-800 shadow-2xl space-y-3.5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Withdraw Available Cash</h3>
                </div>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleWithdrawSubmit} className="space-y-3">
                {/* METHOD TOGGLE */}
                <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      SoundFX.playCoinChime();
                      setWithdrawMethod("UPI");
                    }}
                    className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      withdrawMethod === "UPI"
                        ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                        : "text-slate-500"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    UPI (Instant)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      SoundFX.playCoinChime();
                      setWithdrawMethod("BANK");
                    }}
                    className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      withdrawMethod === "BANK"
                        ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                        : "text-slate-500"
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" />
                    Bank Account
                  </button>
                </div>

                {/* AMOUNT INPUT */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Withdrawal Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-400">₹</span>
                    <input
                      type="number"
                      required
                      min={wallet?.minWithdrawalThreshold || 100}
                      max={wallet?.availableBalance || 0}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-black text-sm"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Available: ₹{wallet?.availableBalance} (Min threshold: ₹{wallet?.minWithdrawalThreshold})
                  </span>
                </div>

                {/* UPI INPUT */}
                {withdrawMethod === "UPI" ? (
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      UPI ID (GPay / PhonePe / Paytm)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. mobile@okhdfcbank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. HDFC Bank, SBI"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Account Number
                      </label>
                      <input
                        type="text"
                        required
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="HDFC0001234"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 uppercase font-mono text-xs"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={withdrawing}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {withdrawing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Processing Payout...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Submit Withdrawal
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
