"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { MediationTableView } from "@/components/user/MediationTableView";
import { useRouter } from "next/navigation";
import { BulkPaymentModal } from "@/components/admin/BulkPaymentModal";
import { PayoutSelectionModal } from "@/components/admin/PayoutSelectionModal";
import { RefundPayersModal } from "@/components/mediator/RefundPayersModal";
import { CsvBulkPaymentModal } from "@/components/mediator/CsvBulkPaymentModal";
import { FileSpreadsheet } from "lucide-react";

export default function MediationsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [mediations, setMediations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ONGOING");
  
  // Selection & Modal States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionModalOpen, setSelectionModalOpen] = useState(false);
  const [isBulkModalOpen, setBulkModalOpen] = useState(false);
  const [isPayersModalOpen, setPayersModalOpen] = useState(false);
  const [isCsvModalOpen, setCsvModalOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [payers, setPayers] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchMediations = async () => {
    try {
      const res = await fetch("/api/orders?isMediator=true");
      const json = await res.json();
      if (json.success) setMediations(json.data);
    } catch (err) {
      toast.error("Failed to load assigned mediations");
    } finally {
      setLoading(false);
    }
  };

  const fetchPayers = async () => {
    try {
      const res = await fetch("/api/mediator/refund-payers");
      const json = await res.json();
      if (json.success) {
        // Prepend mediator's own name to the list
        const mediatorName = session?.user?.name || "ME (Mediator)";
        const mediatorPayer = { name: mediatorName, isSelf: true, _id: "mediator-self" };
        setPayers([mediatorPayer, ...json.data]);
      }
    } catch (err) {
      console.error("Failed to load payers");
    }
  };

  const handleAddPayer = async (name: string, detail: string) => {
    const res = await fetch("/api/mediator/refund-payers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, detail }),
    });
    const json = await res.json();
    if (json.success) fetchPayers();
    else throw new Error(json.message);
  };

  const handleRemovePayer = async (id: string) => {
    const res = await fetch(`/api/mediator/refund-payers?id=${id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (json.success) {
      fetchPayers();
      toast.success("Payer removed");
    } else {
      toast.error(json.message);
    }
  };

  useEffect(() => {
    fetchMediations();
    fetchPayers();
  }, [session]);

  const filtered = useMemo(() => {
    return mediations.filter(order => {
      if (filter === "ONGOING") {
        return [
          "PENDING_APPROVAL", 
          "ESCROW_PAYMENT_PENDING", 
          "ACTIVE_ESCROW", 
          "REFUND_FORM_PENDING", 
          "UNDER_VERIFICATION",
          "REFUND_FORM_SUBMITTED", 
          "APPROVED",
          "REFUND_REJECTED",
          "REFUND_APPROVED",
          "DISPUTE_RAISED",
          "REFUND_PROCESSING",
          "CANCELLED"
        ].includes(order.status);
      }
      if (filter === "COMPLETED") {
        return ["COMPLETED", "RELEASED", "REJECTED", "REFUNDED", "PAST"].includes(order.status);
      }
      return true;
    });
  }, [mediations, filter]);

  const ordersReadyForPayout = useMemo(() => {
    return mediations.filter(o => o.status === "REFUND_APPROVED");
  }, [mediations]);

  const totalSelectedAmount = useMemo(() => {
    return mediations
      .filter(o => selectedIds.includes(o._id))
      .reduce((acc, curr) => acc + (curr.refundDetails?.expectedPayout || 0), 0);
  }, [mediations, selectedIds]);

  const handleSelectionConfirm = (ids: string[]) => {
    setSelectedIds(ids);
    setSelectionModalOpen(false);
    setBulkModalOpen(true);
  };

  const handleBulkPay = async (transactionId: string, paidBy: string) => {
    setIsProcessing(true);
    const loadingId = toast.loading(`Processing payment for ${selectedIds.length} orders...`);
    try {
      const res = await fetch("/api/orders/bulk-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: selectedIds, transactionId, paidBy }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message, { id: loadingId });
        setBulkModalOpen(false);
        setSelectedIds([]);
        fetchMediations();
      } else {
        toast.error(json.message, { id: loadingId });
      }
    } catch (err) {
      toast.error("Network error during bulk processing", { id: loadingId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCsvBulkPay = async (payments: any[]) => {
    setIsProcessing(true);
    const loadingId = toast.loading(`Processing bulk CSV payments for ${payments.length} orders...`);
    try {
      const res = await fetch("/api/orders/bulk-pay-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payments }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message, { id: loadingId });
        setCsvModalOpen(false);
        fetchMediations();
      } else {
        toast.error(json.message, { id: loadingId });
      }
    } catch (err) {
      toast.error("Network error during bulk CSV processing", { id: loadingId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePay = (id: string) => {
    setSelectedIds([id]);
    setBulkModalOpen(true);
  };

  const onViewDetails = (id: string) => {
    router.push(`/app/orders/${id}`);
  };

  const handleUpdateAmount = async (id: string, newAmount: number) => {
    const loadingId = toast.loading("Synchronizing financial parameters...");
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newLessAmount: newAmount }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Parameters synchronized globally", { id: loadingId });
        fetchMediations(); // Refresh list to show updated profit/expectedPayout
      } else {
        throw new Error(json.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Cloud synchronization failed", { id: loadingId });
    }
  };

  if (loading || authStatus === "loading") {
    return (
      <div className="flex flex-col gap-8 pb-12">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4">
               <Skeleton className="h-10 w-64" />
               <Skeleton className="h-4 w-full max-w-xl" />
            </div>
         </div>
         <div className="flex justify-center py-4">
            <Skeleton className="h-14 w-96 rounded-3xl" />
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
               <Skeleton key={i} className="h-64 rounded-[32px]" />
            ))}
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-5 pb-16 overflow-x-hidden min-h-screen">
      
      {/* Navigation Bar & Action Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-6 px-2 md:px-0">
          {/* Tabs on the left */}
          <div className="sticky top-0 z-[40] -mx-4 px-4 py-4 xl:relative xl:top-auto xl:z-auto xl:p-0 bg-white/95 xl:bg-transparent border-b border-slate-100 xl:border-none">
              <div className="relative w-full xl:w-auto">
                  <div className="flex items-center w-full p-1.5 bg-slate-100/50 rounded-[20px] md:rounded-full border border-slate-100 shadow-inner">
                    {["ONGOING", "COMPLETED"].map((f) => (
                         <button 
                           key={f} 
                           onClick={() => setFilter(f)} 
                           className={`flex-1 xl:flex-none xl:px-12 xl:whitespace-nowrap flex items-center justify-center gap-2 py-3.5 rounded-[16px] md:rounded-full text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${filter === f ? "bg-white text-slate-900 shadow-sm border border-slate-100/50 xl:shadow-xl xl:shadow-slate-200/50" : "text-slate-400 hover:text-slate-600"}`}
                         >
                             {f} DEALS
                         </button>
                    ))}
                  </div>
              </div>
          </div>
 
         {/* Action buttons on the right (Desktop only) */}
         <div className="hidden md:flex flex-row gap-4 items-center w-full xl:w-auto mt-2 xl:mt-0">
           <motion.button 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             onClick={() => setPayersModalOpen(true)}
             className="h-14 md:h-16 px-8 bg-white text-slate-900 rounded-[22px] md:rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200/50 hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-3 border border-slate-100"
           >
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              Refund Payers
           </motion.button>

           <motion.button 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             onClick={() => setCsvModalOpen(true)}
             className="h-14 md:h-16 px-8 bg-white text-slate-900 rounded-[22px] md:rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200/50 hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-3 border border-slate-100"
           >
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              CSV Bulk Payout
           </motion.button>

           <motion.button 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             onClick={() => setSelectionModalOpen(true)}
             className="h-16 px-10 bg-slate-900 text-white rounded-[22px] md:rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-4"
           >
              <div className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                 Batch Payouts
              </div>
              <span className="bg-white/10 px-3 py-1.5 rounded-full text-[9px] font-black border border-white/5">{ordersReadyForPayout.length} READY</span>
           </motion.button>
         </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={filter}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <MediationTableView 
            orders={filtered} 
            onViewDetails={onViewDetails}
            onPay={handlePay}
            onUpdateAmount={handleUpdateAmount}
          />
        </motion.div>
      </AnimatePresence>

      <PayoutSelectionModal 
        isOpen={isSelectionModalOpen}
        onClose={() => setSelectionModalOpen(false)}
        orders={ordersReadyForPayout}
        onConfirm={handleSelectionConfirm}
      />

      <BulkPaymentModal 
        isOpen={isBulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        count={selectedIds.length}
        totalAmount={totalSelectedAmount}
        onConfirm={handleBulkPay}
        loading={isProcessing}
        payers={payers}
      />

      <RefundPayersModal 
        isOpen={isPayersModalOpen}
        onClose={() => setPayersModalOpen(false)}
        payers={payers}
        onAdd={handleAddPayer}
        onRemove={handleRemovePayer}
      />

      <CsvBulkPaymentModal
        isOpen={isCsvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        orders={ordersReadyForPayout}
        payers={payers}
        onConfirm={handleCsvBulkPay}
        loading={isProcessing}
      />

      {/* Floating Action Button (Mobile Only) */}
      <div className="md:hidden fixed bottom-[38px] right-6 z-[60] flex flex-col items-end gap-3 pointer-events-none">
         <AnimatePresence>
            {isFabOpen && (
               <motion.div 
                 initial={{ opacity: 0, y: 10, scale: 0.9 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, y: 10, scale: 0.9 }}
                 className="flex flex-col gap-3 items-end pointer-events-auto"
               >
                  <button 
                    onClick={() => { setPayersModalOpen(true); setIsFabOpen(false); }} 
                    className="h-14 px-6 bg-white rounded-full flex items-center gap-3 text-[10px] font-black text-slate-900 uppercase tracking-widest shadow-xl shadow-slate-200/50 border border-slate-100 active:scale-95 transition-all"
                  >
                     <span className="mt-[2px]">Refund Payers</span>
                     <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  </button>
                  <button 
                    onClick={() => { setCsvModalOpen(true); setIsFabOpen(false); }} 
                    className="h-14 px-6 bg-white rounded-full flex items-center gap-3 text-[10px] font-black text-slate-900 uppercase tracking-widest shadow-xl shadow-slate-200/50 border border-slate-100 active:scale-95 transition-all"
                  >
                     <span className="mt-[2px]">CSV Bulk Payout</span>
                     <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  </button>
                  <button 
                    onClick={() => { setSelectionModalOpen(true); setIsFabOpen(false); }} 
                    className="h-14 px-6 bg-slate-900 rounded-full flex items-center gap-3 text-[10px] font-black text-white uppercase tracking-widest shadow-xl shadow-slate-900/30 active:scale-95 transition-all"
                  >
                     <span className="mt-[2px]">Batch Payouts</span>
                     <span className="bg-white/10 px-2 py-1 rounded-[8px] text-[8px] border border-white/5">{ordersReadyForPayout.length} READY</span>
                  </button>
               </motion.div>
            )}
         </AnimatePresence>
         
         <button 
           onClick={() => setIsFabOpen(!isFabOpen)} 
           className={`h-14 w-14 rounded-full flex items-center justify-center shadow-xl transition-all pointer-events-auto z-10 ${isFabOpen ? 'bg-white text-slate-900 shadow-slate-200' : 'bg-indigo-600 text-white shadow-indigo-600/30'} active:scale-90`}
         >
           <motion.div animate={{ rotate: isFabOpen ? 180 : 0 }}>
              {isFabOpen ? (
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z M14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                 </svg>
              )}
           </motion.div>
         </button>
      </div>

      {/* Backdrop for FAB Menu */}
      <AnimatePresence>
         {isFabOpen && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsFabOpen(false)}
               className="md:hidden fixed inset-0 z-[50] bg-slate-900/20 backdrop-blur-sm"
            />
         )}
      </AnimatePresence>

    </div>
  );
}
