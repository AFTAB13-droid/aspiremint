"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";
import { 
  Wallet, ArrowDownLeft, ArrowUpRight, Clock, ShieldCheck, 
  Sparkles, RefreshCw, AlertCircle, CheckCircle2, ChevronRight, 
  X, Send, Building, Smartphone, Info, Gift
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
      toast.error("Failed to load wallet passbook");
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
    const threshold = data?.wallet?.minWithdrawalThreshold || 100;

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
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-500">Loading your wallet passbook...</p>
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
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-6">
      {/* WALLET PASSBOOK CARD */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-2xl border border-indigo-500/20"
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300">AspireMint Digital Passbook</span>
              <h2 className="text-xl font-black text-white tracking-tight">Buyer Wallet</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white/10 border border-white/15 text-slate-300">
              ID: {wallet?.walletId || "WLT-AM"}
            </span>
          </div>
        </div>

        {/* BALANCES GRID */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-6 my-6">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Available Balance (Withdrawable)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-emerald-400">
                ₹{wallet?.availableBalance?.toLocaleString() || 0}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase">INR</span>
            </div>
            <p className="text-xs text-slate-300 mt-2">
              Ready to spend instantly on marketplace deals or transfer to UPI/Bank.
            </p>
          </div>

          <div className="sm:border-l sm:border-white/10 sm:pl-6">
            <div className="flex items-center gap-1.5">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Pending Escrow</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-amber-400">
                ₹{wallet?.pendingBalance?.toLocaleString() || 0}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Locked during the 7-day return shield. Automatically moves to Available balance once cleared!
            </p>
          </div>
        </div>

        {/* THRESHOLD PROGRESS BAR */}
        <div className="relative z-10 pt-4 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-300">Minimum Withdrawal Threshold: ₹{wallet?.minWithdrawalThreshold}</span>
            <span className={wallet?.isWithdrawalEligible ? "text-emerald-400 font-black" : "text-amber-400"}>
              {wallet?.isWithdrawalEligible ? "✅ Eligible to Withdraw" : `Earn ₹${(wallet?.minWithdrawalThreshold || 100) - (wallet?.availableBalance || 0)} more to unlock`}
            </span>
          </div>
          <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${wallet?.progressPercentage || 0}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${
                wallet?.isWithdrawalEligible
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/50"
                  : "bg-gradient-to-r from-amber-500 to-orange-400"
              }`}
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="relative z-10 mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => {
              if (!wallet?.isWithdrawalEligible) {
                toast.error(`Minimum ₹${wallet?.minWithdrawalThreshold} required to withdraw. Refer friends to earn fast!`);
                return;
              }
              SoundFX.playCoinChime();
              setShowWithdrawModal(true);
            }}
            disabled={!wallet?.isWithdrawalEligible}
            className={`py-3.5 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition active:scale-95 shadow-lg ${
              wallet?.isWithdrawalEligible
                ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-900/40 cursor-pointer"
                : "bg-white/10 text-slate-400 border border-white/10 cursor-not-allowed opacity-60"
            }`}
          >
            <Send className="w-4 h-4" />
            Withdraw to UPI / Bank
          </button>

          <Link
            href="/app/referral"
            onClick={() => SoundFX.playCoinChime()}
            className="py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/40 transition"
          >
            <Gift className="w-4 h-4" />
            Refer Friends (+₹90 Each)
          </Link>
        </div>
      </motion.div>

      {/* TRANSACTION LEDGER */}
      <div className="p-6 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              Passbook Ledger & History
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Complete audit trail of all referral credits, deal discounts, and withdrawals
            </p>
          </div>

          {/* FILTERS */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            {(["ALL", "CREDIT", "DEBIT", "PENDING"] as const).map((f) => (
              <button
                key={f}
                onClick={() => {
                  SoundFX.playCoinChime();
                  setActiveFilter(f);
                }}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeFilter === f
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filteredTx.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No transactions found</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Credits earned from referral deals will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTx.map((tx) => {
              const isCredit = tx.type === "CREDIT";
              const isPending = tx.status === "PENDING";
              return (
                <div key={tx._id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isPending
                          ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
                          : isCredit
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isPending ? (
                        <Clock className="w-5 h-5" />
                      ) : isCredit ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {tx.note || tx.category.replace(/_/g, " ")}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400">{formatDate(tx.createdAt)}</span>
                        {tx.referenceId && (
                          <span className="text-[9px] font-mono text-slate-400">
                            Ref: {tx.referenceId.slice(0, 16)}
                          </span>
                        )}
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
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
                      className={`text-sm font-black ${
                        isCredit
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isCredit ? "+" : "-"}₹{tx.amount}
                    </span>
                    <p className="text-[10px] text-slate-400">Bal: ₹{tx.balanceAfter}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* WITHDRAWAL MODAL */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl max-w-md w-full border border-slate-100 dark:border-slate-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Withdraw Available Funds</h3>
                </div>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                {/* METHOD TOGGLE */}
                <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      SoundFX.playCoinChime();
                      setWithdrawMethod("UPI");
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                      withdrawMethod === "UPI"
                        ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    UPI Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      SoundFX.playCoinChime();
                      setWithdrawMethod("BANK");
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                      withdrawMethod === "BANK"
                        ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    Bank Account
                  </button>
                </div>

                {/* AMOUNT INPUT */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Withdrawal Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400">₹</span>
                    <input
                      type="number"
                      required
                      min={wallet?.minWithdrawalThreshold || 100}
                      max={wallet?.availableBalance || 0}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-black text-sm"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Available: ₹{wallet?.availableBalance} (Min threshold: ₹{wallet?.minWithdrawalThreshold})
                  </span>
                </div>

                {/* UPI INPUT */}
                {withdrawMethod === "UPI" ? (
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      UPI ID (VPA)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. mobile@okhdfcbank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. HDFC Bank, SBI"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Account Number
                      </label>
                      <input
                        type="text"
                        required
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="HDFC0001234"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-mono text-xs"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={withdrawing}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {withdrawing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Processing Payout Request...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
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
