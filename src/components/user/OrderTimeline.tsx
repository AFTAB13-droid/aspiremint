"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface TimelineStep {
  id: string;
  label: string;
  subLabel?: string;
  isCompleted: boolean;
  isActive: boolean;
  timestamp?: string;
  meta?: React.ReactNode;
}

interface OrderTimelineProps {
  status: string;
  createdAt: string;
  updatedAt?: string;
  refundSubmittedAt?: string;
  paymentDetails?: {
    transactionId?: string;
    paidAt?: Date | string;
    paidBy?: { name: string };
    paidByName?: string;
  };
}

export function OrderTimeline({ 
  status, 
  createdAt, 
  updatedAt, 
  refundSubmittedAt,
  paymentDetails
}: OrderTimelineProps) {
  
  const formatDate = (dateStr?: string): string | undefined => {
    if (!dateStr) return undefined;
    return new Date(dateStr).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getExpectedDate = () => {
    if (!refundSubmittedAt) return "TBD";
    const d = new Date(refundSubmittedAt);
    d.setDate(d.getDate() + 25);
    return d.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const steps: TimelineStep[] = [
    {
      id: "initialized",
      label: "Order Placed",
      subLabel: "Deal registered in registry",
      isCompleted: true,
      isActive: status === "REFUND_FORM_PENDING",
      timestamp: formatDate(createdAt),
    },
    {
      id: "form_pending",
      label: status === "CANCELLED" ? "Order Cancelled" : "Refund Form",
      subLabel: status === "CANCELLED" ? "Transaction terminated by user" : "Bank & payment registration",
      isCompleted: status !== "REFUND_FORM_PENDING" && status !== "CANCELLED",
      isActive: status === "REFUND_FORM_PENDING" || status === "CANCELLED",
      timestamp: status === "CANCELLED" ? formatDate(updatedAt) : formatDate(refundSubmittedAt),
    },
    {
      id: "verification",
      label: "Under Verification",
      subLabel: "Admin checking deal integrity",
      isCompleted: ["REFUND_APPROVED", "APPROVED", "COMPLETED", "REFUNDED", "REFUND_REJECTED"].includes(status),
      isActive: status === "REFUND_FORM_SUBMITTED" || status === "UNDER_VERIFICATION",
      timestamp: (["REFUND_APPROVED", "APPROVED", "COMPLETED", "REFUNDED", "REFUND_REJECTED"].includes(status)) ? formatDate(updatedAt) : undefined,
    },
    {
      id: "approval",
      label: status === "REFUND_REJECTED" ? "Refund Rejected" : "Refund Approved",
      subLabel: status === "REFUND_REJECTED" ? "Your refund has been rejected" : "Decision: Verification Success",
      isCompleted: ["COMPLETED", "REFUNDED"].includes(status),
      isActive: status === "REFUND_APPROVED" || status === "APPROVED" || status === "REFUND_REJECTED",
      timestamp: (status === "REFUND_APPROVED" || status === "APPROVED" || status === "REFUND_REJECTED") ? formatDate(updatedAt) : undefined,
    },
    {
      id: "payment",
      label: "Refund Paid",
      subLabel: "Payout dispatched to recipient",
      isCompleted: ["COMPLETED", "REFUNDED"].includes(status),
      isActive: ["COMPLETED", "REFUNDED"].includes(status),
      timestamp: ["COMPLETED", "REFUNDED"].includes(status) ? formatDate(updatedAt) : undefined,
      meta: (["COMPLETED", "REFUNDED"].includes(status)) ? (
        <div className="mt-3 md:mt-4 p-4 md:p-5 bg-slate-900 rounded-2xl md:rounded-[24px] border border-slate-800 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all" />
           
           <div className="relative z-10 space-y-3 md:space-y-4">
              <div className="flex items-center gap-3">
                 <div className="h-7 w-7 md:h-8 md:w-8 rounded-lg md:rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 </div>
                 <span className="text-[9px] md:text-[10px] font-black text-emerald-400 uppercase tracking-widest">Refund Details</span>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                 <div>
                    <p className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5 md:mb-1">Paid By</p>
                    <p className="text-[10px] md:text-[11px] font-black text-white uppercase tracking-tight truncate">
                       {paymentDetails?.paidByName || paymentDetails?.paidBy?.name || "System"}
                    </p>
                 </div>
                 <div>
                    <p className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5 md:mb-1">Reference</p>
                    <p className="text-[10px] md:text-[11px] font-black text-emerald-400 family-mono truncate">
                       {paymentDetails?.transactionId || "INTERNAL"}
                    </p>
                 </div>
              </div>

              {paymentDetails?.paidAt && (
                <div className="pt-2 md:pt-3 border-t border-slate-800">
                   <p className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5 md:mb-1">Settlement Time</p>
                   <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">
                      {new Date(paymentDetails.paidAt.toString()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} • {new Date(paymentDetails.paidAt.toString()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </p>
                </div>
              )}
           </div>
        </div>
      ) : (status === "REFUND_APPROVED" || status === "APPROVED") ? (
        <div className="mt-3 md:mt-4 p-4 md:p-5 bg-amber-50 rounded-2xl md:rounded-[24px] border border-amber-100 shadow-sm relative overflow-hidden">
           <div className="flex flex-col justify-between gap-3">
              <div className="flex items-center gap-3">
                 <div className="h-8 w-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 </div>
                 <div>
                   <span className="text-[9px] md:text-[10px] font-black text-amber-600 uppercase tracking-widest block">Expected Payout Date</span>
                   <span className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-tight">{getExpectedDate()}</span>
                 </div>
              </div>
              <div className="pt-3 border-t border-amber-200/50">
                 <p className="text-[9px] md:text-[10px] font-bold text-amber-700/80 uppercase tracking-widest leading-relaxed">
                   Notice: Refund is normally paid under 20-25 days. For more queries, please contact admin.
                 </p>
              </div>
           </div>
        </div>
      ) : undefined
    }
  ];

  const getStepIcon = (step: TimelineStep) => {
    if (step.id === "form_pending" && status === "CANCELLED") {
       return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>;
    }
    if (step.id === "approval" && status === "REFUND_REJECTED") {
       return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
    }
    
    switch (step.id) {
      case 'initialized': return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
      case 'form_pending': return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
      case 'verification': return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
      case 'approval': return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'payment': return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
      default: return null;
    }
  };

  return (
    <div className="relative">
      {/* Connector Line */}
      <div className="absolute left-[13px] md:left-[15px] top-6 bottom-6 w-0.5 bg-slate-100" />

      <div className="space-y-8 md:space-y-12">
        {steps.map((step, idx) => (
          <div key={step.id} className="relative pl-10 md:pl-12 flex items-start gap-4 md:gap-6 group">
            {/* Status Dot */}
            <div className={`absolute left-0 top-1.5 h-8 w-8 rounded-full border-4 border-white shadow-lg z-10 flex items-center justify-center transition-all duration-500 ${
              step.isCompleted ? 'bg-emerald-500 shadow-emerald-500/20' : 
              step.isActive ? (
                (status === "CANCELLED" || status === "REFUND_REJECTED") ? 'bg-rose-500 shadow-rose-500/20' : 'bg-blue-600 shadow-blue-600/20 scale-110'
              ) : 'bg-slate-200 shadow-slate-100'
            }`}>
              <div className="text-white">
                {step.isCompleted ? (
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  getStepIcon(step)
                )}
              </div>
            </div>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                   <h4 className={`text-sm font-black uppercase tracking-tight transition-colors ${
                     step.isActive ? (
                       (status === "CANCELLED" || status === "REFUND_REJECTED") ? 'text-rose-600' : 'text-blue-600'
                     ) : step.isCompleted ? 'text-slate-900' : 'text-slate-400'
                   }`}>
                     {step.label}
                   </h4>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                     {step.subLabel}
                   </p>
                </div>
                {step.timestamp && (
                  <div className="px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-[9px] font-black text-slate-700 uppercase tracking-tighter whitespace-nowrap">
                       {step.timestamp}
                    </p>
                  </div>
                )}
              </div>
              {step.meta && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-3"
                >
                  {step.meta}
                </motion.div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
