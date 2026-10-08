"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { EditAmountModal } from "@/components/common/EditAmountModal";

export default function OrderDetailsPage() {
  const { data: session } = useSession();
  const { id } = useParams();
  const router = useRouter();
  const role = (session?.user as any)?.role || "USER";
  const isSubAdmin = role === "SUBADMIN";

  const maskName = (name: string) => {
    if (!name) return "N/A";
    const parts = name.split(" ");
    return parts.map(p => p.length > 2 ? `${p[0]}***${p.slice(-1)}` : `${p[0]}*`).join(" ");
  };

  const maskUpi = (upi: string) => {
    if (!upi) return "N/A";
    const [local, domain] = upi.split("@");
    if (!domain) return "****";
    return `${local.slice(0, 2)}***@${domain}`;
  };
  const isAdm = role === "ADMIN" || role === "SUBADMIN";
  const [order, setOrder] = useState<any>(null);
  const isMed = role === "MEDIATOR" && (order?.mediator?._id === session?.user?.id || order?.mediator === session?.user?.id);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({ transactionId: "", screenshot: "" });
  const [isLedgerVisible, setIsLedgerVisible] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleStatusUpdate = async (newStatus: string) => {
      if (newStatus === "REFUND_REJECTED" && !rejectionNote) {
         return toast.error("Please provide a rejection reason");
      }
      
      const loadingId = toast.loading(`Updating to ${newStatus}...`);
      try {
         const res = await fetch(`/api/orders/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
               status: newStatus,
               "refundDetails.rejectionNote": rejectionNote || undefined
            }),
         });
         const json = await res.json();
         if (json.success) {
            setOrder(json.data);
            toast.success("Order Status Synchronized", { id: loadingId });
            setIsRejecting(false);
         } else { throw new Error(json.message); }
      } catch (err: any) {
         toast.error(err.message || "Cloud Update Failed", { id: loadingId });
      }
   };

  const handleUpdateStatus = async (status: string, extra = {}) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...extra }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      toast.success("Deal updated successfully!");
      setOrder(json.data);
      setShowPaymentModal(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update deal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAmount = async (newAmount: number) => {
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
        setOrder(json.data);
      } else {
        throw new Error(json.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Cloud synchronization failed", { id: loadingId });
    }
  };

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`/api/orders/${id}`);
        const json = await res.json();
        
        if (json.success) {
          setOrder(json.data);
          const params = new URLSearchParams(window.location.search);
          if (params.get('action') === 'fill-refund' && json.data.status === 'REFUND_FORM_PENDING') {
             router.push(`/app/refunds/fill/${id}`);
          }
        } else { toast.error("Order not found"); }
      } catch (err) { toast.error("Resource acquisition failed"); } finally { setLoading(false); }
    };
    if (id) {
       fetchDetails();
       
       const handleFcmRefresh = () => {
         fetchDetails();
       };
       window.addEventListener("FCM_REFRESH_DATA", handleFcmRefresh);
       return () => {
         window.removeEventListener("FCM_REFRESH_DATA", handleFcmRefresh);
       };
    }
  }, [id, router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl pb-20">
         <div className="mb-10 p-6 md:p-0 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
               <Skeleton className="h-4 w-32" />
               <Skeleton className="h-10 w-80" />
               <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-12 w-40 rounded-full" />
         </div>
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-6 md:px-0">
            <div className="lg:col-span-2 space-y-8">
               <Skeleton className="h-[300px] rounded-[32px]" />
               <Skeleton className="h-40 rounded-[28px]" />
            </div>
            <Skeleton className="h-[500px] rounded-[32px]" />
         </div>
      </div>
    );
  }

  if (!order) return <div className="text-center p-20 text-slate-500 font-bold text-xl uppercase tracking-widest">Order not found.</div>;

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'REFUND_FORM_PENDING': return 'Refund Form Pending';
      case 'UNDER_VERIFICATION': return 'Under Verification';
      case 'REFUND_FORM_SUBMITTED': return 'Under Verification';
      case 'ESCROW_PAYMENT_PENDING': return 'Verifying Payment';
      case 'ACTIVE_ESCROW': return 'Secure Settlement Active';
      case 'REFUND_APPROVED': return 'Refund Approved';
      case 'REFUND_REJECTED': return 'Refund Rejected';
      default: return status.replace(/_/g, " ");
    }
  };

  const getStatusColor = (status: string) => {
     switch(status) {
        case 'REFUND_FORM_PENDING': return 'bg-amber-100/50 text-amber-700 border-amber-200';
        case 'UNDER_VERIFICATION': return 'bg-blue-100/50 text-blue-700 border-blue-200';
        case 'REFUND_FORM_SUBMITTED': return 'bg-blue-100/50 text-blue-700 border-blue-200';
        case 'REFUND_APPROVED': return 'bg-emerald-100/50 text-emerald-700 border-emerald-200';
        case 'REFUND_REJECTED': return 'bg-rose-100/60 text-rose-700 border-rose-300 shadow-rose-100/20';
        case 'ESCROW_PAYMENT_PENDING': return 'bg-indigo-100/50 text-indigo-700 border-indigo-200';
        case 'ACTIVE_ESCROW': return 'bg-purple-100/50 text-purple-700 border-purple-200 shadow-purple-100/20';
        case 'COMPLETED': return 'bg-emerald-100/50 text-emerald-700 border-emerald-200';
        case 'REFUNDED': return 'bg-emerald-100/50 text-emerald-700 border-emerald-200';
        case 'APPROVED': return 'bg-emerald-100/50 text-emerald-700 border-emerald-200';
        case 'DISPUTE_RAISED': return 'bg-rose-100/50 text-rose-700 border-rose-200';
        case 'CANCELLED': return 'bg-slate-100 text-slate-500 border-slate-200';
        case 'REJECTED': return 'bg-rose-100/50 text-rose-700 border-rose-200';
        default: return 'bg-slate-50 text-slate-500 border-slate-100';
     }
  };

  const renderDesktopView = () => {
    return (
      <div className="mx-auto max-w-5xl pb-20 px-4 md:px-0">
        
        {/* Header Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 overflow-hidden pt-4 md:pt-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
               <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 shadow-sm transition-all">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
               </button>
               <span className="text-xs font-black uppercase tracking-widest text-slate-400">Registry Snapshot</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">{order.brandName || "Unnamed Deal"}</h1>
            <div className="flex items-center gap-3 mt-2">
               <p className="text-slate-500 font-black tracking-widest uppercase text-sm">Ref ID: {order.aspireOrderId}</p>
               <div className="h-1 w-1 rounded-full bg-slate-200" />
               <p className="text-blue-500 font-black tracking-widest uppercase text-sm">Order: {order.userOrderId || "N/A"}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Status</p>
                 <span className={`inline-block mt-1 rounded-full border px-4 py-1.5 text-[11px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                   {getStatusDisplay(order.status)}
                 </span>
             </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Columns (Details & Proofs) */}
          <div className="lg:col-span-2 space-y-8">
             
             {/* Section 2: Special Instructions (Based on Role) */}
             {((role === "USER" && order.userRemarks) || ((isAdm || isMed) && order.mediatorRemarks)) && (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 rounded-[32px] bg-indigo-50 border border-indigo-100 mb-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-24 w-24 bg-blue-600/5 blur-3xl rounded-full" />
                  <div className="flex items-center gap-4 mb-4 relative z-10">
                     <div className="h-10 w-10 rounded-2xl bg-white border border-indigo-200 flex items-center justify-center text-indigo-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Registry Note</p>
                        <p className="text-xl font-black text-slate-900 leading-tight">Special Instructions</p>
                     </div>
                  </div>
                  <div className="p-6 bg-white rounded-2xl border border-indigo-50 text-sm font-medium text-slate-600 italic relative z-10 leading-relaxed shadow-sm">
                     "{role === "USER" ? order.userRemarks : order.mediatorRemarks}"
                  </div>
               </motion.div>
             )}

             {/* Section 1: Core Deal Details */}
             <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="rounded-[32px] border border-slate-100 bg-white p-6 md:p-10 shadow-xl shadow-slate-100/50">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-3">
                   <div className="h-4 w-1 bg-slate-900 rounded-full" /> Deal Blueprint
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order ID</p>
                      <p className="text-lg font-black text-slate-900 mt-1 uppercase truncate">{order.userOrderId || "N/A"}</p>
                   </div>
                   {(order.refundDetails?.invoiceOrderId || order.invoiceOrderId) && (
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-1">
                            <span>🧾</span> Invoice Order ID
                         </p>
                         <p className="text-lg font-black text-slate-900 mt-1 uppercase truncate select-all font-mono">
                            {order.refundDetails?.invoiceOrderId || order.invoiceOrderId}
                         </p>
                      </div>
                   )}
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Brand Designation</p>
                      <p className="text-lg font-black text-slate-900 mt-1 uppercase underline decoration-blue-100 decoration-4 underline-offset-4">{order.brandName}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Product Code</p>
                      <p className="text-lg font-black text-slate-900 mt-1 uppercase">{order.productCode || "N/A"}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reviewer Name</p>
                      <p className="text-lg font-bold text-slate-900 mt-1">{order.reviewName || "N/A"}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Review Type</p>
                      <p className="text-lg font-black text-blue-600 mt-1 uppercase">{order.reviewType === "SUBMITTED" ? "REVIEW SUBMITTED" : (order.reviewType || "N/A")}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deal Type</p>
                      <p className="text-lg font-black text-slate-900 mt-1 uppercase tracking-tight">{order.dealType || "Standard"}</p>
                   </div>
                   <div>
                      <div className="relative group/edit">
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{(order.lessAmount || 0) >= 0 ? "Commission" : "Less Amount"}</p>
                         <div className="flex items-center gap-3">
                            <p className={`text-lg font-black mt-1 ${(order.lessAmount || 0) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                               {(order.lessAmount || 0) >= 0 ? "+" : ""} ₹{order.lessAmount?.toLocaleString() || "0"}
                            </p>
                            {(role === "ADMIN" || isMed) && order.status !== 'COMPLETED' && (
                               <button onClick={() => setIsEditModalOpen(true)} className="h-7 w-7 rounded-lg bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all shadow-sm">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                               </button>
                            )}
                         </div>
                      </div>
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order Amount</p>
                      <p className="text-lg font-black text-slate-900 mt-1">₹{order.amount?.toLocaleString()}</p>
                   </div>
                </div>

                {order.dealType === "Exchange" && order.exchangeProduct && (
                   <div className="col-span-full p-6 bg-indigo-50/40 border border-indigo-100 rounded-[32px] flex items-center gap-6 mt-8 mb-4">
                      <div className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-white shadow-xl shadow-indigo-100/50 bg-white flex-shrink-0 flex items-center justify-center">
                         {order.exchangeProduct.image ? (
                            <img src={order.exchangeProduct.image} alt={order.exchangeProduct.name} className="w-full h-full object-cover" />
                         ) : (
                            <svg className="w-8 h-8 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                         )}
                      </div>
                      <div>
                         <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1.5">EXCHANGE PRODUCT SELECTED</p>
                         <p className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">{order.exchangeProduct.name}</p>
                      </div>
                   </div>
                )}

                {order.screenshot && (
                   <div className="mt-8 pt-8 border-t border-slate-50">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Order Media (Screenshot)</p>
                      <div className="relative h-48 w-full md:w-80 rounded-3xl overflow-hidden border border-slate-100 shadow-sm group cursor-pointer" onClick={() => window.open(order.screenshot, '_blank')}>
                         <img src={order.screenshot} className="h-full w-full object-cover transition-transform group-hover:scale-105" alt="Order Proof" />
                         <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-xl text-[8px] font-black uppercase tracking-widest text-slate-900">View Full Media</span>
                         </div>
                      </div>
                   </div>
                )}
             </motion.div>

             {/* Section 4: Rejection Feedback (Visible if rejected) */}
             {order.status === "REFUND_REJECTED" && order.refundDetails?.rejectionNote && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 rounded-[32px] bg-rose-50 border border-rose-100 mb-8">
                   <div className="flex items-center gap-4 mb-4">
                      <div className="h-10 w-10 rounded-2xl bg-white border border-rose-200 flex items-center justify-center text-rose-600">
                         <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Claim Disposition: REJECTED</p>
                         <p className="text-xl font-black text-slate-900 leading-tight">Review Feedback</p>
                      </div>
                   </div>
                   <div className="p-6 bg-white rounded-2xl border border-rose-100 text-sm font-medium text-slate-600 italic">
                      "{order.refundDetails.rejectionNote}"
                   </div>
                   {role === "USER" && (
                      <button onClick={() => router.push(`/app/refunds/fill/${id}`)} className="mt-8 w-full py-4 bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-rose-200 active:scale-95 transition-all">
                         Resubmit Updated Claim
                      </button>
                   )}
                </motion.div>
             )}

             {/* Admin Approval Control */}
             {role === "ADMIN" && order.status === "UNDER_VERIFICATION" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-10 rounded-[40px] bg-slate-900 text-white shadow-2xl mb-8 relative overflow-hidden">
                   <div className="absolute top-0 right-0 h-40 w-40 bg-blue-600/20 blur-[100px] rounded-full -mr-20 -mt-20" />
                   <div className="relative z-10">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Management Actions</p>
                      
                      {!isRejecting ? (
                         <div className="flex flex-col sm:flex-row gap-4">
                            <button 
                              onClick={() => handleStatusUpdate("REFUND_APPROVED")}
                              className="flex-1 py-5 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-900/40 transition-all flex items-center justify-center gap-3"
                            >
                               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                               Authorize Refund
                            </button>
                            <button 
                              onClick={() => setIsRejecting(true)}
                              className="flex-1 py-5 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/30 rounded-2xl font-black text-[10px] uppercase tracking-widest text-rose-400 transition-all flex items-center justify-center gap-3"
                            >
                               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                               Reject Claim
                            </button>
                         </div>
                      ) : (
                         <div className="space-y-6 animate-in slide-in-from-bottom-2">
                            <div>
                               <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Reason for Rejection *</label>
                               <textarea 
                                 value={rejectionNote}
                                 onChange={(e) => setRejectionNote(e.target.value)}
                                 placeholder="Specify why this refund is being rejected..."
                                 className="w-full h-32 bg-slate-800 border-none rounded-2xl p-4 text-sm font-medium text-white placeholder:text-slate-600 focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                               />
                            </div>
                            <div className="flex gap-3">
                               <button onClick={() => setIsRejecting(false)} className="px-8 py-4 bg-slate-800 text-slate-400 font-bold text-[10px] uppercase tracking-widest rounded-xl">Back</button>
                               <button 
                                  onClick={() => handleStatusUpdate("REFUND_REJECTED")}
                                  className="flex-1 py-4 bg-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-900/40"
                               >
                                  Confirm Rejection
                               </button>
                            </div>
                         </div>
                      )}
                   </div>
                </motion.div>
             )}
             {order.status !== 'REFUND_FORM_PENDING' && order.refundDetails && (
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-[40px] border border-blue-100 bg-blue-50/20 p-8 md:p-12 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                     <svg className="w-32 h-32" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-10 flex items-center gap-3">
                     <div className="h-4 w-1 bg-blue-600 rounded-full" /> Refund Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 relative z-10">
                     <div className="space-y-8">
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Refund Destination (UPI)</p>
                           <p className="text-xl font-black text-blue-700 mt-2 font-mono">{isSubAdmin ? maskUpi(order.refundDetails.upiId || '') : (order.refundDetails.upiId || 'N/A')}</p>
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payee Account Holder</p>
                           <p className="text-sm font-black text-slate-900 mt-1 uppercase tracking-tight">{isSubAdmin ? maskName(order.refundDetails.accountHolderName || '') : (order.refundDetails.accountHolderName || 'N/A')}</p>
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Refund Amount</p>
                           <p className="text-3xl font-black text-emerald-600 mt-2">₹{order.refundDetails.expectedPayout?.toLocaleString() || '0'}</p>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verification Media</p>
                        <div className="grid grid-cols-2 gap-4">
                           {[
                             { label: "Review Proof", src: order.refundProof?.reviewScreenshot },
                             { label: (order.marketplace?.toLowerCase().includes("blinkit") || order.brandName?.toLowerCase().includes("blinkit")) ? "Invoice" : "Return Period", src: order.refundProof?.returnPeriodScreenshot },
                             { label: "Delivery Doc", src: order.refundProof?.deliveryScreenshot }
                           ].filter(i => i.src).map((item, idx) => (
                             <div key={idx} className="group cursor-pointer space-y-2" onClick={() => window.open(item.src, '_blank')}>
                                <div className="h-32 w-full rounded-2xl overflow-hidden border border-slate-200 bg-white p-1">
                                   <img src={item.src} className="h-full w-full object-cover rounded-xl transition-transform group-hover:scale-105" alt={item.label} />
                                </div>
                                <p className="text-[8px] font-black text-center text-slate-400 uppercase tracking-widest">{item.label}</p>
                             </div>
                           ))}
                        </div>
                        {order.refundProof?.reviewLink && (
                          <a href={order.refundProof.reviewLink} target="_blank" className="block text-[10px] font-black text-blue-600 uppercase tracking-widest bg-white border border-blue-100 rounded-xl p-4 text-center hover:bg-blue-50 transition-all">
                             Open Review URL
                          </a>
                        )}
                     </div>
                  </div>
               </motion.div>
             )}
          </div>

          {/* Right Column (Parties & Activity Log) */}
          <div className="space-y-8">
             
             {/* Section 3: Parties involved */}
             
             {/* 1. Buyer Information (Visible to Admin & Mediator) */}
             {(isAdm || isMed) && (
                <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 font-mono">Buyer Information</h4>
                   <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-[20px] flex items-center justify-center text-xl font-black text-white shadow-lg bg-indigo-600">
                         {order.buyer?.name?.charAt(0)}
                      </div>
                      <div>
                         <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{order.buyer?.name || ''}</p>
                         <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{order.buyer?.aspireMintId || 'BUYER_REF'}</p>
                      </div>
                   </div>
                   {order.buyer?.mobile && (
                      <div className="mt-6 pt-6 border-t border-slate-50">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Registered Contact</p>
                         <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            </div>
                            <p className="text-xs font-black text-slate-900 tracking-tight">{isSubAdmin ? `+91 ${order.buyer.mobile.slice(0, 3)}*****${order.buyer.mobile.slice(-2)}` : `+91 ${order.buyer.mobile}`}</p>
                         </div>
                      </div>
                   )}
                </div>
             )}

             {/* 2. Assigned Mediator (Visible to Admin & User) */}
             {(isAdm || (!isMed && !isAdm)) && (
                <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 font-mono">Assigned Mediator</h4>
                   <div className="flex items-center gap-4">
                      <div className={`h-14 w-14 rounded-[20px] flex items-center justify-center text-xl font-black text-white shadow-lg ${isAdm ? "bg-slate-900" : "bg-blue-600"}`}>
                         {order.mediator?.name?.charAt(0)}
                      </div>
                      <div>
                         <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{order.mediator?.name || ''}</p>
                         <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{order.mediator?.aspireMintId}</p>
                      </div>
                   </div>
                </div>
             )}

             {/* Refund Info (Accountability Section) */}
             {(order.status === 'COMPLETED' || order.status === 'REFUNDED') && (
                <div className="rounded-[32px] border border-emerald-100 bg-emerald-50/20 p-8 shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/10 blur-[40px] rounded-full -mr-12 -mt-12" />
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-6 font-mono">Disbursement Details</h4>
                   
                   <div className="space-y-5 relative z-10">
                      <div className="p-4 rounded-2xl bg-white border border-emerald-50 shadow-sm">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Paid By / Disbursed By</p>
                         <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{order.paymentDetails?.paidByName || "System Disbursed"}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                         <div className="p-4 rounded-2xl bg-white border border-emerald-50 shadow-sm">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Clearance Date</p>
                            <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">
                               {(order.paymentDetails?.paidAt || order.updatedAt) ? new Date(order.paymentDetails?.paidAt || order.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                            </p>
                         </div>
                         <div className="p-4 rounded-2xl bg-white border border-emerald-50 shadow-sm">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Clearance Time</p>
                            <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">
                               {(order.paymentDetails?.paidAt || order.updatedAt) ? new Date(order.paymentDetails?.paidAt || order.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A'}
                            </p>
                         </div>
                      </div>

                      {order.paymentDetails?.transactionId && (
                         <div className="p-4 rounded-2xl bg-white border border-emerald-50 shadow-sm flex items-center justify-between">
                            <div>
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Transaction Ref (UTR)</p>
                               <p className="text-xs font-black font-mono text-slate-900">{order.paymentDetails.transactionId}</p>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(order.paymentDetails.transactionId);
                                toast.success("UTR Copied");
                              }}
                              className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                              title="Copy UTR"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                         </div>
                      )}

                      {order.paymentDetails?.paymentScreenshot && (
                         <div className="p-4 rounded-2xl bg-white border border-emerald-50 shadow-sm">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment Receipt</p>
                            <div className="aspect-[16/9] rounded-xl overflow-hidden border border-slate-100 cursor-pointer" onClick={() => window.open(order.paymentDetails.paymentScreenshot, '_blank')}>
                               <img src={order.paymentDetails.paymentScreenshot} className="w-full h-full object-cover" alt="Receipt" />
                            </div>
                         </div>
                      )}
                   </div>
                </div>
             )}

             {/* Section 4: Activity Log (Mediator & Admin Only) */}
             {(isAdm || isMed) && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="rounded-[40px] bg-slate-900 p-8 md:p-10 text-white shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 h-40 w-40 bg-blue-500/10 blur-[60px] rounded-full" />
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-10 font-mono">Activity Ledger</h4>
                   
                   <div className="space-y-10 relative z-10">
                      {order.activities && order.activities.length > 0 ? (
                        [...order.activities].reverse().map((activity: any, idx: number) => (
                          <div key={idx} className="flex gap-6">
                            <div className="flex flex-col items-center">
                              <div className={`h-4 w-4 rounded-full ${
                                activity.action?.includes('REJECTED') || activity.action?.includes('CANCELLED') ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]' :
                                activity.action?.includes('AUTHORIZED') || activity.action?.includes('COMPLETED') || activity.action?.includes('APPROVED') ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' :
                                'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                              }`} />
                              {idx !== order.activities.length - 1 && <div className="h-10 w-0.5 bg-slate-800 my-2" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">
                                  {activity.action?.replace(/_/g, ' ')}
                                </p>
                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter px-1 rounded border border-slate-800 bg-slate-800/30">
                                  {activity.performedByName || 'System'}
                                </span>
                              </div>
                              <p className="text-xs font-black uppercase text-slate-100 leading-snug">
                                {activity.message}
                              </p>
                              <p className="text-[9px] font-bold text-slate-500 mt-2 font-mono">
                                {new Date(activity.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <>
                          {/* Fallback to basic creation date if no activities yet */}
                          <div className="flex gap-6">
                             <div className="flex flex-col items-center">
                                <div className="h-4 w-4 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                                <div className="h-10 w-0.5 bg-slate-800 my-2" />
                             </div>
                             <div>
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Initialization</p>
                                <p className="text-xs font-black mt-1 uppercase text-slate-100">Order Record Created</p>
                                <p className="text-[10px] font-bold text-slate-500 mt-2">{new Date(order.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                             </div>
                          </div>
                   
                          {/* Refund Submission Action (Static Check for Legacy) */}
                          {order.refundDetails?.submittedAt && (
                             <div className="flex gap-6">
                                <div className="flex flex-col items-center">
                                   <div className="h-4 w-4 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                                </div>
                                <div>
                                   <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Documentation Submission</p>
                                   <p className="text-xs font-black mt-1 uppercase text-slate-100">Refund Form Uploaded</p>
                                   <p className="text-[10px] font-bold text-slate-500 mt-2">{new Date(order.refundDetails.submittedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                </div>
                             </div>
                           )}
                        </>
                      )}
                      
                      {order.status === "UNDER_VERIFICATION" && !order.refundDetails?.authorizedAt && !order.refundDetails?.rejectedAt && (
                        <div className="flex gap-6 items-center pt-4">
                           <div className="h-4 w-4 rounded-full border-2 border-orange-500 animate-pulse" />
                           <p className="text-[10px] font-black uppercase tracking-widest text-orange-500/60 font-mono italic">Audit In Progress...</p>
                        </div>
                      )}
                   </div>

                   <div className="mt-12 p-5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Status Restriction</p>
                      <p className="text-[9px] font-medium text-slate-400 italic leading-relaxed">This ledger tracks every high-level status transition. Visible only to management.</p>
                   </div>
                </motion.div>
             )}

             {/* Sticky Interaction (If pending) */}
             {role === "USER" && order.status === "REFUND_FORM_PENDING" && (
                <div className="p-8 rounded-[40px] bg-blue-600 text-white shadow-2xl shadow-blue-500/20 text-center">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-70">Fill Refund Form</p>
                   <button 
                     onClick={() => router.push(`/app/refunds/fill/${id}`)}
                     className="w-full rounded-2xl bg-white py-4 text-[11px] font-black text-blue-600 uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                   >
                      Apply Now
                   </button>
                </div>
             )}
          </div>
        </div>
      </div>
    );
  };

  const renderMobileView = () => {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-32">
        {/* Native-style Floating Header */}
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-900 active:scale-90 transition-transform">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Order ID</p>
            <p className="text-sm font-black text-slate-900 font-mono tracking-tight underline decoration-blue-500/30 decoration-2 underline-offset-4">{order.userOrderId || "N/A"}</p>
          </div>
          <div className="w-10" />
        </div>

        <div className="p-6 space-y-6">
          {/* Status Banner */}
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`rounded-[32px] p-8 border flex flex-col items-center text-center gap-4 shadow-xl ${getStatusColor(order.status)}`}>
            <div className="h-16 w-16 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center">
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-current animate-pulse" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Transaction Status</p>
              <h2 className="text-xl font-black uppercase tracking-tight leading-tight">{getStatusDisplay(order.status)}</h2>
            </div>
          </motion.div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Brand</p>
              <p className="text-lg font-black text-slate-900 uppercase truncate">{order.brandName}</p>
            </div>
            <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount</p>
              <p className="text-lg font-black text-slate-900 tabular-nums">₹{order.amount?.toLocaleString()}</p>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Deal Blueprint</h4>
              <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest">{order.dealType || "Standard"}</span>
            </div>
            <div className="p-8 space-y-6">
              {[
                { label: "Product Code", value: order.productCode || "N/A" },
                { label: "Reviewer Name", value: order.reviewName || "N/A" },
                { label: "Review Type", value: order.reviewType === "SUBMITTED" ? "REVIEW SUBMITTED" : (order.reviewType || "N/A"), color: "text-blue-600 italic" }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-end border-b border-slate-50 pb-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                  <p className={`text-sm font-black text-slate-900 uppercase ${item.color || ""}`}>{item.value}</p>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{(order.lessAmount || 0) >= 0 ? "Commission" : "Less Amount"}</p>
                <div className="flex items-center gap-3">
                   <p className={`text-lg font-black ${(order.lessAmount || 0) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                     {(order.lessAmount || 0) >= 0 ? "+" : ""} ₹{order.lessAmount?.toLocaleString() || "0"}
                   </p>
                   {(role === "ADMIN" || isMed) && order.status !== 'COMPLETED' && (
                      <button onClick={() => setIsEditModalOpen(true)} className="h-8 w-8 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100 shadow-sm active:scale-90 transition-all">
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                   )}
                </div>
              </div>
            </div>
          </div>

          {/* Screenshot */}
          {order.screenshot && (
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Registry Snapshot</p>
              <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-slate-100 shadow-inner" onClick={() => window.open(order.screenshot, '_blank')}>
                <img src={order.screenshot} className="w-full h-full object-cover" alt="Media" />
              </div>
            </div>
          )}

          {/* Refund Info Section */}
          {order.status !== 'REFUND_FORM_PENDING' && order.refundDetails && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl shadow-indigo-500/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 font-mono">Refund Details</p>
              <div className="space-y-6">
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-600 mb-1.5">UPI ID DESTINATION</p>
                  <p className="text-xl font-black font-mono tracking-tight text-blue-400">{isSubAdmin ? maskUpi(order.refundDetails.upiId || '') : (order.refundDetails.upiId || 'N/A')}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-600 mb-1.5">REFUND AMOUNT</p>
                  <p className="text-3xl font-black">₹{order.refundDetails.expectedPayout?.toLocaleString() || '0'}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Payment Settlement & Clearance Details (Mobile) */}
          {(order.status === 'COMPLETED' || order.status === 'REFUNDED') && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 p-6 md:p-8 rounded-[36px] text-white shadow-2xl shadow-emerald-950/40 border border-emerald-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-36 w-36 bg-emerald-500/15 blur-[50px] rounded-full pointer-events-none" />
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400 font-mono">Disbursement Status</p>
                    <h4 className="text-base font-black uppercase text-white tracking-tight">Payment Settled</h4>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Cleared
                </span>
              </div>

              <div className="space-y-4 relative z-10">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Paid By / Disbursed By</p>
                  <p className="text-sm font-black text-white uppercase tracking-tight">
                    {order.paymentDetails?.paidByName || "System Disbursed"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Date</p>
                    <p className="text-xs font-black text-white uppercase tracking-tight font-mono">
                      {(order.paymentDetails?.paidAt || order.updatedAt) 
                        ? new Date(order.paymentDetails?.paidAt || order.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Time</p>
                    <p className="text-xs font-black text-white uppercase tracking-tight font-mono">
                      {(order.paymentDetails?.paidAt || order.updatedAt) 
                        ? new Date(order.paymentDetails?.paidAt || order.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {order.paymentDetails?.transactionId && (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Transaction Ref (UTR)</p>
                      <p className="text-xs font-black font-mono text-emerald-300 tracking-tight">{order.paymentDetails.transactionId}</p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(order.paymentDetails.transactionId);
                        toast.success("UTR Copied");
                      }}
                      className="h-8 w-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 transition-all active:scale-95"
                      title="Copy UTR"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                )}

                {order.paymentDetails?.paymentScreenshot && (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment Receipt</p>
                    <div className="aspect-[16/9] rounded-xl overflow-hidden border border-white/10 cursor-pointer" onClick={() => window.open(order.paymentDetails.paymentScreenshot, '_blank')}>
                      <img src={order.paymentDetails.paymentScreenshot} className="w-full h-full object-cover" alt="Payment Receipt" />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Parties */}
          <div className="space-y-3">
            <div className="bg-white px-6 py-4 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-sm font-black text-white">{order.buyer?.name?.charAt(0)}</div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Buyer</p>
                  <p className="text-xs font-black text-slate-900 uppercase mt-0.5">{order.buyer?.name || ''}</p>
                </div>
              </div>
            </div>
            <div className="bg-white px-6 py-4 rounded-2xl border border-slate-100 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-sm font-black text-white">{order.mediator?.name?.charAt(0)}</div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Specialist</p>
                <p className="text-xs font-black text-slate-900 uppercase mt-0.5">{order.mediator?.name || ''}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Action Bar */}
        <AnimatePresence>
          {((role === "ADMIN" && order.status === "UNDER_VERIFICATION") || (role === "USER" && order.status === "REFUND_FORM_PENDING")) && (
            <motion.div initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }} className="fixed bottom-0 left-0 right-0 z-50 p-6 bg-white/80 backdrop-blur-2xl border-t border-slate-100 rounded-t-[40px] shadow-2xl">
              {role === "ADMIN" && (
                <div className="flex flex-col gap-3">
                  {!isRejecting ? (
                    <div className="flex gap-3">
                      <button onClick={() => handleStatusUpdate("REFUND_APPROVED")} className="flex-1 py-5 bg-emerald-600 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest active:scale-95 transition-all">Authorize</button>
                      <button onClick={() => setIsRejecting(true)} className="px-8 py-5 bg-rose-50 text-rose-600 rounded-2xl font-black text-[12px] uppercase tracking-widest active:scale-95 transition-all">Reject</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <textarea value={rejectionNote} onChange={(e) => setRejectionNote(e.target.value)} placeholder="Specify reason..." className="w-full h-24 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500" />
                      <div className="flex gap-3">
                        <button onClick={() => setIsRejecting(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-xl text-[10px] uppercase tracking-widest">Back</button>
                        <button onClick={() => handleStatusUpdate("REFUND_REJECTED")} className="flex-[2] py-4 bg-rose-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-xl shadow-rose-200">Confirm Reject</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {role === "USER" && order.status === "REFUND_FORM_PENDING" && (
                <button onClick={() => router.push(`/app/refunds/fill/${id}`)} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-xl shadow-blue-200 active:scale-95 transition-all">
                  Complete Claim Form
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <>
      {isMobile ? renderMobileView() : renderDesktopView()}
      <EditAmountModal 
         isOpen={isEditModalOpen}
         onClose={() => setIsEditModalOpen(false)}
         currentAmount={order.lessAmount || 0}
         baseAmount={order.amount || 0}
         orderId={order.aspireOrderId || ""}
         onConfirm={handleUpdateAmount}
      />
    </>
  );
}
