"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/Skeleton";
import formatDate from "@/utils/formatDate";
import MobileMediatorPassbook from "./MobileMediatorPassbook";

interface Transaction {
  _id: string;
  amount: number;
  type: string;
  category: string;
  referenceId: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  note: string;
  sender?: {
    name: string;
    aspireMintId: string;
    role?: string;
  };
  createdAt: string;
}

interface ActiveOrder {
  _id: string;
  aspireOrderId: string;
  brandName: string;
  productCode: string;
  amount: number;
  refundAmount: number;
  commission: number;
  totalClaim: number;
  status: string;
  createdAt: string;
}

interface MediatorSummary {
  _id: string;
  name: string;
  email: string;
  aspireMintId: string;
  paymentDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
  };
  activeOrdersCount: number;
  activeOrdersLiability: number;
  totalPaidByAdmin: number;
  netBalance: number;
}

export default function PassbookPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summaryList, setSummaryList] = useState<MediatorSummary[]>([]);
  const [selectedMedId, setSelectedMedId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Specific mediator detailed view
  const [walletDetails, setWalletDetails] = useState<any>(null);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<"LEDGER" | "CLAIMS">("LEDGER");
  const [selectedLedgerDate, setSelectedLedgerDate] = useState<string | null>(null);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [timeframe, setTimeframe] = useState<"all" | "week" | "month" | "year">("all");

  const displayedTransactions = useMemo(() => {
    if (!selectedLedgerDate) return transactions;
    return transactions.filter(tx => formatDate(tx.createdAt) === selectedLedgerDate);
  }, [transactions, selectedLedgerDate]);

  const displayedActiveOrders = useMemo(() => {
    if (!selectedLedgerDate) return activeOrders;
    return activeOrders.filter(order => formatDate(order.createdAt) === selectedLedgerDate);
  }, [activeOrders, selectedLedgerDate]);

  useEffect(() => {
    setSelectedLedgerDate(null);
  }, [selectedMedId, timeframe, activeTab]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Modal / Drawer state for "Make Transaction"
  const [isMakeTransactionOpen, setIsMakeTransactionOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  
  // Form fields
  const [sendAmount, setSendAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [note, setNote] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState(false);

  const userRole = (session?.user as any)?.role || "USER";
  const isAdminOrSub = userRole === "ADMIN" || userRole === "SUBADMIN";
  const isSubAdmin = userRole === "SUBADMIN";
  const isFullAdmin = userRole === "ADMIN";

  const maskEmail = (email: string) => {
    if (!email) return "N/A";
    const [local, domain] = email.split("@");
    if (!domain) return "****";
    return `${local.slice(0, 3)}***@${domain}`;
  };

  const maskName = (name: string) => {
    if (!name) return "N/A";
    const parts = name.split(" ");
    return parts.map(p => p.length > 2 ? `${p[0]}***${p.slice(-1)}` : `${p[0]}*`).join(" ");
  };

  // Web Audio Google Pay-like sound synthesizer
  const playSuccessSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playTone = (freq: number, startDelay: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startDelay);
        gain.gain.setValueAtTime(0, ctx.currentTime + startDelay);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + startDelay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration);
        osc.start(ctx.currentTime + startDelay);
        osc.stop(ctx.currentTime + startDelay + duration);
      };

      // Google Pay cheerful arpeggio sound: G5 -> C6 -> E6 -> G6 (fast and bright)
      playTone(783.99, 0, 0.25);      // G5
      playTone(1046.50, 0.07, 0.25);   // C6
      playTone(1318.51, 0.14, 0.3);    // E6
      playTone(1567.98, 0.21, 0.4);    // G6
    } catch (e) {
      console.warn("Web Audio Context blocked or not supported:", e);
    }
  };

  // Fetch all mediators summary list (Admin Master View)
  const fetchSummary = async (selectedTimeframe = timeframe) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/wallet?timeframe=${selectedTimeframe}`);
      const json = await res.json();
      if (json.success && json.data.summary) {
        setSummaryList(json.data.summary);
      }
    } catch (err) {
      toast.error("Failed to load passbook summary");
    } finally {
      setLoading(false);
    }
  };

  // Fetch single mediator passbook details (Active Orders & Admin Payments)
  const fetchPassbookDetails = async (mediatorId: string, selectedTimeframe = timeframe) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/wallet?mediatorId=${mediatorId}&timeframe=${selectedTimeframe}`);
      const json = await res.json();
      if (json.success && json.data) {
        setWalletDetails(json.data.wallet);
        setActiveOrders(json.data.activeOrders);
        setTransactions(json.data.transactions);
        
        // Auto fill bank details if mediator profile has them
        const medPay = json.data.wallet.paymentDetails || {};
        setBankName(medPay.bankName || "");
        setAccountNumber(medPay.accountNumber || "");
        setIfscCode(medPay.ifscCode || "");
      }
    } catch (err) {
      toast.error("Failed to sync secure ledger");
    } finally {
      setLoading(false);
    }
  };

  // Run initial fetch
  useEffect(() => {
    if (session?.user) {
      if (isAdminOrSub) {
        if (selectedMedId) {
          fetchPassbookDetails(selectedMedId, timeframe);
        } else {
          fetchSummary(timeframe);
        }
      } else if (userRole === "MEDIATOR") {
        fetchPassbookDetails(session.user.id, timeframe);
      }
    }
  }, [session, selectedMedId, timeframe]);

  // Generate beautiful mock UTR for speed/convenience
  const handleAutoFillMockUTR = () => {
    const mockRef = `UTR-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    setReferenceId(mockRef);
    toast.success("UTR Reference auto-generated!");
  };

  // Trigger Confirmation Modal instead of directly submitting
  const handlePayClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendAmount || parseFloat(sendAmount) === 0 || isNaN(parseFloat(sendAmount))) {
      return toast.error("Enter a valid transaction amount");
    }
    if (!referenceId.trim()) return toast.error("Enter a bank transaction UTR Reference ID");
    
    // Open the confirmation modal!
    setIsConfirmModalOpen(true);
  };

  // Submit offline payment log (Disbursement) after double confirmation
  const handleFinalConfirmTransaction = async () => {
    setIsConfirmModalOpen(false);
    try {
      setIsSubmitting(true);
      const payload = {
        mediatorId: selectedMedId,
        amount: sendAmount,
        note: note || "Settlement Transaction",
        paymentMethod: "OFFLINE",
        bankName: bankName || "N/A",
        accountNumber: accountNumber || "N/A",
        ifscCode: ifscCode || "N/A",
        referenceId: referenceId.trim(),
        transactionDate: transactionDate ? new Date(transactionDate).toISOString() : new Date().toISOString()
      };

      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        // Trigger Google Pay-like payout chime!
        playSuccessSound();
        setSuccessAnimation(true);
        
        setTimeout(() => {
          setIsMakeTransactionOpen(false);
          setSuccessAnimation(false);
          setSendAmount("");
          setNote("");
          setReferenceId("");
          setTransactionDate("");
          if (selectedMedId) fetchPassbookDetails(selectedMedId);
        }, 3000);
      } else {
        toast.error(json.message || "Failed to authorize ledger transaction");
      }
    } catch (err) {
      toast.error("Internal service error during transaction dispatch");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Master sums for Admin Summary dashboard
  const masterStats = useMemo(() => {
    let totalLiability = 0;
    let totalSettled = 0;
    summaryList.forEach(m => {
      totalLiability += m.activeOrdersLiability;
      totalSettled += m.totalPaidByAdmin;
    });
    return {
      totalLiability,
      totalSettled,
      netPending: totalSettled - totalLiability
    };
  }, [summaryList]);

  // Identify the top payee mediator
  const topRecipient = useMemo(() => {
    if (summaryList.length === 0) return null;
    return [...summaryList]
      .filter(m => m.totalPaidByAdmin > 0)
      .sort((a, b) => b.totalPaidByAdmin - a.totalPaidByAdmin)[0] || null;
  }, [summaryList]);

  // Filtered mediators for directory
  const filteredMediators = useMemo(() => {
    if (!searchQuery) return summaryList;
    return summaryList.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.aspireMintId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [summaryList, searchQuery]);

  if (isSubAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-12 bg-white rounded-[40px] border border-slate-100/80 shadow-sm max-w-lg mx-auto mt-16">
        <div className="h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center mb-6 text-rose-500 border border-rose-100 shadow-sm animate-pulse text-3xl">
          🔒
        </div>
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-3">Restricted Clearance Level</h2>
        <p className="text-xs text-slate-500 font-bold max-w-sm uppercase tracking-wider leading-relaxed mb-6">
          Access Denied: SubAdmin sessions do not hold the required authorization level to audit or view the administrative double-entry ledger.
        </p>
        <button
          onClick={() => router.push('/app')}
          className="px-8 h-12 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-black transition-all"
        >
          Return to Command Center
        </button>
      </div>
    );
  }

  if (loading && !walletDetails && summaryList.length === 0) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-44 w-full rounded-[40px]" />
        <Skeleton className="h-[500px] w-full rounded-[48px]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-24 mt-4 overflow-x-hidden relative">
      
      {/* 1. ADMIN MASTER VIEW (DIRECTORY) */}
      {isAdminOrSub && !selectedMedId && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-8"
        >
          {/* Dashboard Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[36px] border border-slate-100/80 shadow-sm">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Transaction Control Desk</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Mediator Passbook Audit</h1>
              <p className="text-xs text-slate-500 font-medium max-w-xl font-semibold">Live double-entry reconciliation portal. Manage active approved refund liabilities and execute double-entry ledger transactions.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
              {/* Timeframe Selector Pills */}
              <div className="flex bg-slate-100/80 p-1 rounded-2xl border border-slate-200/50">
                {(["all", "week", "month", "year"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeframe(t)}
                    className={`h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                      timeframe === t 
                        ? "bg-white text-indigo-600 shadow-sm font-black border border-slate-100" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {t === "all" ? "All Time" : t === "week" ? "Weekly" : t === "month" ? "Monthly" : "Yearly"}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <input 
                  type="text" 
                  placeholder="Search specialist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 rounded-2xl bg-slate-50 border border-slate-100 px-5 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all shadow-inner"
                />
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
          </div>

          {/* Master Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900 rounded-[38px] p-8 text-white relative overflow-hidden shadow-xl shadow-slate-950/10">
              <div className="absolute top-0 right-0 -mr-10 -mt-10 h-36 w-36 bg-orange-500/10 rounded-full blur-2xl" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-3">Mediator Claims Liability</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black tracking-tight text-orange-400">-₹{masterStats.totalLiability.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-slate-400">INR</span>
              </div>
              <p className="text-[9px] text-slate-400 mt-5 font-bold uppercase tracking-wider">Outstanding claims from active approved orders</p>
            </div>

            <div className="bg-white border border-slate-100 rounded-[38px] p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-10 -mt-10 h-36 w-36 bg-emerald-50/5 rounded-full blur-2xl" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-3">Total Settlements Sent</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black tracking-tight text-emerald-600">+₹{masterStats.totalSettled.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-slate-400">INR</span>
              </div>
              <p className="text-[9px] text-slate-400 mt-5 font-bold uppercase tracking-wider">Actual completed manual payments sent to date</p>
            </div>

            <div className="bg-white border border-slate-100 rounded-[38px] p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-10 -mt-10 h-36 w-36 bg-indigo-500/5 rounded-full blur-2xl" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-3">Net Deposit</span>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-3xl font-black tracking-tight ${masterStats.netPending < 0 ? "text-rose-500" : "text-emerald-600"}`}>
                  {masterStats.netPending < 0 ? "-" : "+"}₹{Math.abs(masterStats.netPending).toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-slate-400">INR</span>
              </div>
              <p className="text-[9px] text-slate-400 mt-5 font-bold uppercase tracking-wider">Current outstanding administrative balance</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/30 border border-indigo-100/80 rounded-[38px] p-8 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 -mr-10 -mt-10 h-36 w-36 bg-indigo-500/10 rounded-full blur-2xl animate-pulse" />
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 block mb-3">Top Recipient Specialist</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black tracking-tight text-indigo-900 uppercase truncate max-w-[200px] block">
                    {topRecipient ? topRecipient.name : "None"}
                  </span>
                </div>
              </div>
              <p className="text-[9px] text-indigo-700/80 mt-5 font-bold uppercase tracking-wider leading-relaxed">
                {topRecipient 
                  ? `Total Payouts: ₹${topRecipient.totalPaidByAdmin.toLocaleString()} across ${topRecipient.activeOrdersCount} claims` 
                  : "No manual payouts logged in this timeframe"
                }
              </p>
            </div>
          </div>

          {/* Directory Grid */}
          <div className="bg-white rounded-[44px] border border-slate-100 shadow-sm overflow-hidden p-8">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6 pl-2">Specialist Directories ({filteredMediators.length})</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMediators.map((med) => {
                const isNegative = med.netBalance < 0;
                return (
                  <motion.div 
                    key={med._id}
                    whileHover={{ y: -4, scale: 1.01 }}
                    onClick={() => setSelectedMedId(med._id)}
                    className="p-6 bg-slate-50/50 rounded-[32px] border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all shadow-sm flex flex-col justify-between min-h-[220px] cursor-pointer"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 text-sm font-black border border-indigo-100 shadow-sm">
                            {med.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight line-clamp-1">{med.name}</h3>
                            <span className="text-[8px] font-black text-indigo-500 uppercase tracking-wider">{med.aspireMintId}</span>
                          </div>
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${isNegative ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
                          {isNegative ? "TRANSACTION DUE" : "CLEARED"}
                        </span>
                      </div>

                      <div className="mt-6 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <span>Active Claims ({med.activeOrdersCount})</span>
                          <span className="text-slate-700 font-mono">-₹{med.activeOrdersLiability.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <span>Total Paid</span>
                          <span className="text-slate-700 font-mono">+₹{med.totalPaidByAdmin.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100/80 pt-4 mt-6 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Net Deposit</span>
                        <span className={`text-base font-black tracking-tight font-mono ${isNegative ? "text-rose-500" : "text-emerald-600"}`}>
                          {isNegative ? "-" : ""}₹{Math.abs(med.netBalance).toLocaleString()}
                        </span>
                      </div>
                      <span className="h-8 px-4 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 hover:text-white transition-all flex items-center shadow-sm">
                        {isFullAdmin ? "Make Transaction" : "View Passbook"}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
              
              {filteredMediators.length === 0 && (
                <div className="col-span-full py-16 text-center text-xs font-black uppercase tracking-widest text-slate-300">
                  No specialists matched your search query.
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* 2. SPECIFIC PASSBOOK VIEW (DETAILED LEDGER) */}
      {(selectedMedId || userRole === "MEDIATOR") && walletDetails && (
        userRole === "MEDIATOR" && isMobile ? (
          <MobileMediatorPassbook 
            walletDetails={walletDetails} 
            transactions={transactions} 
            activeOrders={activeOrders} 
          />
        ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col gap-8"
        >
          {/* Back button & Title Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {isAdminOrSub && (
                <button 
                  onClick={() => setSelectedMedId(null)}
                  className="h-12 w-12 bg-white border border-slate-100 hover:border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 transition-all shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
              )}
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {isAdminOrSub ? `Auditing Ledger: ${walletDetails.name}` : "Personal Passbook Desk"}
                </span>
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight font-black">
                  {walletDetails.name} ({walletDetails.aspireMintId})
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {/* Timeframe Selector Pills */}
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50">
                {(["all", "week", "month", "year"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeframe(t)}
                    className={`h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                      timeframe === t 
                        ? "bg-white text-indigo-600 shadow-sm font-black border border-slate-100" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {t === "all" ? "All Time" : t === "week" ? "Weekly" : t === "month" ? "Monthly" : "Yearly"}
                  </button>
                ))}
              </div>

              {isFullAdmin && (
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsMakeTransactionOpen(true)}
                  className="h-12 px-6 bg-indigo-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 flex items-center gap-2 hover:bg-indigo-700 transition-all"
                >
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                  Make Transaction
                </motion.button>
              )}
            </div>
          </div>

          {/* Mediator Passbook Interactive Visual Widget */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* The Passbook Bankcard */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-gradient-to-br from-indigo-700 via-indigo-900 to-slate-900 rounded-[38px] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-950/20 aspect-[1.6/1] flex flex-col justify-between border border-indigo-500/10">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 bg-white/5 rounded-full blur-3xl" />
                
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black uppercase tracking-widest text-indigo-300">Reconciliation Desk</span>
                    <span className="text-sm font-black tracking-widest uppercase">ASPIREMINT</span>
                  </div>
                  <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 backdrop-blur-md">
                    <svg className="w-5 h-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-200">
                    {isAdminOrSub ? "Outstanding Approved Liability" : "Pending Wallet Payout"}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-black tracking-tight font-mono ${walletDetails.netBalance < 0 ? "text-orange-400" : "text-emerald-400"}`}>
                      {walletDetails.netBalance < 0 ? "-" : ""}₹{Math.abs(walletDetails.netBalance).toLocaleString()}
                    </span>
                    <span className="text-[10px] font-black text-indigo-300">INR</span>
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black uppercase tracking-widest text-indigo-300">Specialist Holder</span>
                    <span className="text-[10px] font-black uppercase tracking-tight line-clamp-1">{walletDetails.name}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[7px] font-black uppercase tracking-widest text-indigo-300">Aspire ID</span>
                    <span className="text-[10px] font-black font-mono tracking-wide">{walletDetails.aspireMintId}</span>
                  </div>
                </div>
              </div>

              {/* Quick Details List */}
              <div className="bg-white border border-slate-100 rounded-[38px] p-6 shadow-sm space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 pl-1">Financial Reconciliation Snapshot</h3>
                
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>{isAdminOrSub ? "Approved Claims Liability" : "My Dynamic Claims Value"}</span>
                  <span className="text-slate-800 font-mono">-₹{walletDetails.activeOrdersLiability.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>{isAdminOrSub ? "Total Payments Sent" : "Total Payments Received"}</span>
                  <span className="text-slate-800 font-mono">+₹{walletDetails.totalPaidByAdmin.toLocaleString()}</span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-black text-slate-900 uppercase tracking-widest">
                  <span>{isAdminOrSub ? "Outstanding Net Liability" : "My Outstanding Payouts"}</span>
                  <span className={`font-mono text-sm ${walletDetails.netBalance < 0 ? "text-orange-500" : "text-emerald-500"}`}>
                    {walletDetails.netBalance < 0 ? "-" : ""}₹{Math.abs(walletDetails.netBalance).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Verification Message */}
              {walletDetails.netBalance < 0 && (
                <div className="bg-orange-50/50 border border-orange-100/60 p-5 rounded-[28px] flex gap-3.5 items-start">
                  <div className="h-8 w-8 bg-orange-500 text-white rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0">!</div>
                  <div className="flex-1 space-y-1">
                    <h4 className="text-[10px] font-black text-orange-800 uppercase tracking-wider">Settlement Transfer Pending</h4>
                    <p className="text-[9px] text-orange-700/80 font-bold uppercase leading-relaxed tracking-wide">
                      {isAdminOrSub 
                        ? `The administrator owes ₹${Math.abs(walletDetails.netBalance).toLocaleString()} to clear this mediator's active approved liability.`
                        : `Your outstanding payout of ₹${Math.abs(walletDetails.netBalance).toLocaleString()} is awaiting bank dispatch.`
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Passbook Tabs & Ledger Tables */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 bg-slate-100/40 border border-slate-100 p-1.5 rounded-[24px]">
                  <button 
                    onClick={() => setActiveTab("LEDGER")}
                    className={`h-11 px-6 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === "LEDGER" ? "bg-white text-indigo-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    Passbook
                  </button>
                  <button 
                    onClick={() => setActiveTab("CLAIMS")}
                    className={`h-11 px-6 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === "CLAIMS" ? "bg-white text-indigo-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    Active Approved Claims ({activeOrders.length})
                  </button>
                </div>

                {selectedLedgerDate && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-wider shadow-sm"
                  >
                    <span>Showing Date: {selectedLedgerDate}</span>
                    <button 
                      onClick={() => setSelectedLedgerDate(null)}
                      className="h-4 w-4 bg-indigo-200 hover:bg-indigo-300 rounded-full flex items-center justify-center text-indigo-700 transition-colors font-bold text-[8px] ml-1"
                    >
                      ✕
                    </button>
                  </motion.div>
                )}
              </div>

              <div className="bg-white dark:bg-[#0E1526] border border-slate-100 dark:border-slate-800/80 rounded-[44px] shadow-sm overflow-hidden">
                <AnimatePresence mode="wait">
                  
                  {/* TAB 1: PASSBOOK LEDGER JOURNAL */}
                  {activeTab === "LEDGER" && (
                    <motion.div 
                      key="ledger"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="overflow-x-auto"
                    >
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50 dark:bg-[#0B101D] border-b border-slate-100 dark:border-slate-800/80">
                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-10">Reconciliation Time</th>
                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized By</th>
                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Memo Note</th>
                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-10">Amount (Cr/Dr)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 font-mono">
                          {displayedTransactions.map((tx) => {
                            const isCredit = tx.type === "CREDIT";
                            const txDateStr = formatDate(tx.createdAt);
                            const isFiltered = selectedLedgerDate === txDateStr;
                            return (
                              <tr key={tx._id} className="hover:bg-slate-50/30 dark:hover:bg-[#172138] transition-colors">
                                <td className="p-6 pl-10">
                                  <div className="flex flex-col gap-0.5">
                                    <span 
                                      onClick={() => setSelectedLedgerDate(isFiltered ? null : txDateStr)}
                                      className={`text-xs font-black hover:underline cursor-pointer transition-colors ${
                                        isFiltered 
                                          ? "text-indigo-600 font-extrabold underline decoration-indigo-400 decoration-2" 
                                          : "text-slate-900 dark:text-slate-100 hover:text-indigo-500"
                                      }`}
                                      title="Click to filter by this date"
                                    >
                                      {txDateStr}
                                    </span>
                                    <span className="text-[8px] font-bold text-slate-400">
                                      {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-6">
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[8px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100/60 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                        {tx.sender?.role || "ADMIN"}
                                      </span>
                                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase">
                                        {tx.sender?.name || "System Admin"}
                                      </span>
                                    </div>
                                    <div className="space-y-0.5">
                                      <p className="text-[9px] font-black text-slate-400 font-mono">UTR: {tx.referenceId}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-6">
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block max-w-[200px] truncate">{tx.note || "Settlement Settlement"}</span>
                                </td>
                                <td className="p-6 text-right pr-10">
                                  <span className={`text-base font-black ${isCredit ? "text-emerald-500" : "text-amber-500"}`}>
                                    {isCredit ? "+" : "-"}₹{tx.amount.toLocaleString()}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}

                          {displayedTransactions.length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-16 text-center text-xs font-black uppercase tracking-widest text-slate-300">
                                No bank settlements recorded for this filter.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </motion.div>
                  )}

                  {/* TAB 2: ACTIVE CLAIMS */}
                  {activeTab === "CLAIMS" && (
                    <motion.div 
                      key="claims"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="overflow-x-auto"
                    >
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50 dark:bg-[#0B101D] border-b border-slate-100 dark:border-slate-800/80">
                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-10">Creation Date</th>
                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Details</th>
                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial breakdown</th>
                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-10">Total Liability Contribution</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 font-mono">
                          {displayedActiveOrders.map((order) => {
                            const orderDateStr = formatDate(order.createdAt);
                            const isFiltered = selectedLedgerDate === orderDateStr;
                            return (
                              <tr key={order._id} className="hover:bg-slate-50/30 dark:hover:bg-[#172138] transition-colors">
                                <td className="p-6 pl-10">
                                  <span 
                                    onClick={() => setSelectedLedgerDate(isFiltered ? null : orderDateStr)}
                                    className={`text-xs font-black hover:underline cursor-pointer transition-colors ${
                                      isFiltered 
                                        ? "text-indigo-600 font-extrabold underline decoration-indigo-400 decoration-2" 
                                        : "text-slate-900 dark:text-slate-100 hover:text-indigo-500"
                                    }`}
                                    title="Click to filter by this date"
                                  >
                                    {orderDateStr}
                                  </span>
                                </td>
                                <td className="p-6">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">{order.brandName}</span>
                                    <span className="text-[9px] font-black text-indigo-500">{order.aspireOrderId}</span>
                                    <span className="text-[8px] font-bold text-slate-400">Code: {order.productCode}</span>
                                  </div>
                                </td>
                                <td className="p-6">
                                  <div className="space-y-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                    <div className="flex justify-between max-w-[180px]">
                                      <span>Refund Amount:</span>
                                      <span className="text-slate-600 dark:text-slate-300">₹{((order as any).refundDetails?.expectedPayout ?? ((order as any).dealType === 'Empty Box' ? ((order as any).amount + ((order as any).lessAmount || 0)) : ((order as any).amount - ((order as any).lessAmount || 0)))).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between max-w-[180px]">
                                      <span>Mediator Earning:</span>
                                      <span className="text-slate-600 dark:text-slate-300">+₹{(order.commission || 0).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-6 text-right pr-10">
                                  <span className="text-base font-black text-rose-500">
                                    -₹{(order.totalClaim || 0).toLocaleString()}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}

                          {displayedActiveOrders.length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-16 text-center text-xs font-black uppercase tracking-widest text-slate-300">
                                No active approved claims found for this filter.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
        )
      )}

      {/* 3. MAKE TRANSACTION DRAWER (ADMIN ONLY) */}
      <AnimatePresence>
        {isMakeTransactionOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsMakeTransactionOpen(false)}
              className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ x: "100%" }} 
              animate={{ x: 0 }} 
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 h-full w-full max-w-md z-[101] bg-white shadow-3xl flex flex-col"
            >
              
              {/* Drawer Header */}
              <div className="bg-slate-900 p-10 relative overflow-hidden flex-shrink-0">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 h-36 w-36 bg-indigo-500/10 rounded-full blur-2xl" />
                <h3 className="text-xl font-black text-white uppercase mb-1">Make Transaction</h3>
                <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Bank Ledger Authorizer</p>
                <button 
                  onClick={() => setIsMakeTransactionOpen(false)} 
                  className="absolute top-10 right-10 h-8 w-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all text-xs font-black"
                >
                  ✕
                </button>
              </div>

              {/* Form Input fields */}
              <form onSubmit={handlePayClick} className="flex-1 p-10 space-y-6 overflow-y-auto custom-scrollbar">
                
                {/* Recipient Profile Card */}
                {walletDetails && (
                  <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 space-y-4 shadow-inner">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Recipient Profile Credentials</span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Name</p>
                        <p className="text-xs font-black text-slate-800 uppercase truncate leading-tight">{walletDetails.name}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Email ID</p>
                        <p className="text-xs font-bold text-slate-600 truncate leading-tight">{isSubAdmin ? maskEmail(walletDetails.email) : walletDetails.email}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Mobile Number</p>
                        <p className="text-xs font-black text-slate-850 font-mono leading-tight">{isSubAdmin ? (walletDetails.mobile ? `+91 ${walletDetails.mobile.slice(0, 3)}*****${walletDetails.mobile.slice(-2)}` : "N/A") : (walletDetails.mobile || "N/A")}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">UPI ID</p>
                        <p className="text-xs font-black text-indigo-600 font-mono truncate leading-tight">{isSubAdmin ? (walletDetails.paymentDetails?.upiId ? `${walletDetails.paymentDetails.upiId.split("@")[0].slice(0, 2)}***@${walletDetails.paymentDetails.upiId.split("@")[1] || ""}` : "N/A") : (walletDetails.paymentDetails?.upiId || "N/A")}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 1. Transaction Amount */}
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Amount to Pay (INR)</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">₹</span>
                    <input 
                      type="number" 
                      required
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-20 bg-slate-50 border border-slate-100 rounded-3xl text-3xl font-black text-slate-950 focus:bg-white focus:ring-2 focus:ring-indigo-500 pl-12 pr-6 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* 3. UTR Reference */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center pr-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Bank UTR / Transaction Reference ID</label>
                    <button 
                      type="button"
                      onClick={handleAutoFillMockUTR}
                      className="text-[8px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest"
                    >
                      Autofill Mock
                    </button>
                  </div>
                  <input 
                    type="text" 
                    required
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    placeholder="UTR-XXXXXX-XXXX"
                    className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-mono font-bold text-slate-950 px-5 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                {/* 4. Custom Transaction Date (Optional) */}
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Select Date & Time (Optional)</label>
                  <input 
                    type="datetime-local" 
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-950 px-5 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                {/* 5. Audit Memo (Optional) */}
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Memo / Audit Notes (Optional)</label>
                  <textarea 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Notes about the transfer..."
                    className="w-full h-24 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-950 p-5 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

              </form>

              {/* Drawer Footer Actions */}
              <div className="p-10 border-t border-slate-100 flex flex-col gap-4 flex-shrink-0 bg-white">
                <button 
                  type="button"
                  onClick={handlePayClick}
                  disabled={isSubmitting}
                  className="w-full h-16 bg-slate-900 text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-950/20 disabled:opacity-50 active:scale-95 transition-all hover:bg-slate-800"
                >
                  {isSubmitting ? "Processing..." : "Authorize Transaction"}
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Double Confirmation Modal Dialog */}
      <AnimatePresence>
        {isConfirmModalOpen && walletDetails && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfirmModalOpen(false)}
              className="fixed inset-0 z-[200] bg-slate-950/70 backdrop-blur-[2px]"
            />
            <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 overflow-y-auto">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-md bg-white rounded-[40px] p-8 border border-slate-100 shadow-2xl flex flex-col gap-6"
              >
                <div className="flex items-center gap-3 text-red-500 border-b border-slate-50 pb-3 pl-1">
                  <div className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 text-sm font-black border border-rose-100">!</div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-800">Verify & Confirm Transaction</h4>
                </div>

                <div className="space-y-4">
                  <div className="text-center py-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">TRANSACTION VALUE</p>
                    <p className="text-4xl font-black text-slate-900 font-mono">₹{parseFloat(sendAmount).toLocaleString()}.00</p>
                  </div>

                  <div className="space-y-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                    <div className="flex justify-between">
                      <span>Payee Name:</span>
                      <span className="text-slate-800 font-black">{walletDetails.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>UPI ID:</span>
                      <span className="text-slate-800 font-mono">{walletDetails.paymentDetails?.upiId || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mobile Number:</span>
                      <span className="text-slate-800 font-mono">{walletDetails.mobile || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>UTR Ref ID:</span>
                      <span className="text-slate-800 font-mono">{referenceId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Log Date:</span>
                      <span className="text-slate-850 font-black">
                        {transactionDate ? new Date(transactionDate).toLocaleString() : "Current Time (Real-Time)"}
                      </span>
                    </div>
                  </div>

                  {/* CAUTION WARNING */}
                  <div className="bg-rose-50/50 border border-rose-100 p-4.5 rounded-2xl">
                    <p className="text-[9px] text-rose-700 font-bold uppercase leading-relaxed tracking-wider">
                      ⚠️ Caution: This ledger entry is final and permanent. It CANNOT be deleted, modified, or rolled back. Please double-check payment receipt status before continuing.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsConfirmModalOpen(false)}
                    className="h-14 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-black uppercase tracking-widest rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={handleFinalConfirmTransaction}
                    className="h-14 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-indigo-600/10"
                  >
                    Confirm Payout
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Google Pay-like Payout Success Screen Overlay */}
      <AnimatePresence>
        {successAnimation && walletDetails && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-slate-900 flex flex-col items-center justify-center p-8 text-center text-white"
          >
            {/* The Google Pay Circular Pulse Ring */}
            <div className="relative flex items-center justify-center mb-8">
              
              {/* Outer pulsing ring */}
              <motion.div 
                initial={{ scale: 0.6, opacity: 0.8 }}
                animate={{ scale: [0.8, 1.6, 0.8], opacity: [0.6, 0, 0.6] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                className="absolute h-48 w-48 rounded-full border border-emerald-500 bg-emerald-500/10"
              />
              <motion.div 
                initial={{ scale: 0.6, opacity: 0.5 }}
                animate={{ scale: [0.6, 1.3, 0.6], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut", delay: 0.6 }}
                className="absolute h-48 w-48 rounded-full border border-emerald-400 bg-emerald-400/5"
              />

              {/* Main Emerald Circle */}
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 150, damping: 18 }}
                className="relative h-28 w-28 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30 border-4 border-emerald-400"
              >
                {/* SVG Checkmark draws itself */}
                <motion.svg 
                  className="w-14 h-14 text-white" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth={3.5}
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <motion.path 
                    d="M20 6L9 17L4 12" 
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
                  />
                </motion.svg>
              </motion.div>
            </div>

            {/* Success Details */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="space-y-4 max-w-sm"
            >
              <h2 className="text-4xl font-black font-mono tracking-tight text-emerald-400">
                ₹{parseFloat(sendAmount).toLocaleString()}.00
              </h2>
              <div className="space-y-1">
                <p className="text-base font-black uppercase tracking-widest text-slate-100">Transaction Authorized</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                  Ledger synchronized & sent to payee: <br/>
                  <span className="text-indigo-400 font-black">{walletDetails.name}</span>
                </p>
              </div>

              <div className="pt-8 border-t border-slate-800/80 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] font-mono">
                Ref ID: {referenceId}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
