"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, ChevronLeft, ArrowRight, ShieldCheck, 
  AlertCircle, Loader2, Info, CheckCircle2, XCircle, Clock, RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";

export default function RefundVerifyPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foundOrder, setFoundOrder] = useState<any | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setLoading(true);
    setError(null);
    setFoundOrder(null);

    try {
      const res = await fetch(`/api/orders?aspireOrderId=${encodeURIComponent(orderId.trim())}`);
      const json = await res.json();

      if (json.success && json.data && json.data.length > 0) {
        const order = json.data[0];
        
        if (order.status === "REFUND_FORM_PENDING") {
          toast.success("Identity Confirmed. Accessing Refund Form...");
          router.push(`/app/refunds/fill/${order._id}`);
        } else {
          // Order found but in different status
          setFoundOrder(order);
        }
      } else {
        setError("Invalid Order ID. We could not locate this transaction in our ledger.");
      }
    } catch (err) {
      toast.error("Network Synchronicity Error. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'UNDER_VERIFICATION': 
      case 'REFUND_FORM_SUBMITTED': 
        return { 
          label: "In Review", 
          icon: <Clock className="w-8 h-8 text-blue-500" />, 
          bg: "bg-blue-50", 
          color: "text-blue-600",
          desc: "Your refund request has been received and is currently being audited by a system mediator."
        };
      case 'REFUND_APPROVED': 
      case 'APPROVED': 
      case 'COMPLETED':
      case 'REFUNDED':
        return { 
          label: "Approved / Completed", 
          icon: <CheckCircle2 className="w-8 h-8 text-emerald-500" />, 
          bg: "bg-emerald-50", 
          color: "text-emerald-600",
          desc: "This transaction has already been cleared and processed. No further action is required."
        };
      case 'CANCELLED': 
      case 'INVALIDATED':
        return { 
          label: "Terminated", 
          icon: <XCircle className="w-8 h-8 text-rose-500" />, 
          bg: "bg-rose-50", 
          color: "text-rose-600",
          desc: "This order was cancelled or invalidated, making it ineligible for refund requests."
        };
      default:
        return { 
          label: status.replace(/_/g, ' '), 
          icon: <Info className="w-8 h-8 text-slate-500" />, 
          bg: "bg-slate-50", 
          color: "text-slate-600",
          desc: `The current status of this order is ${status}. Refund form access is restricted.`
        };
    }
  };

  return (
    <div className="min-h-[100dvh] md:min-h-[80vh] flex flex-col items-center justify-center p-0 md:px-4 md:py-12 relative overflow-hidden bg-white md:bg-transparent">
      
      {/* Background HUD Elements */}
      <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none opacity-20">
         <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="w-full h-full border-2 border-dashed border-blue-500/30 rounded-full"
         />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full h-full min-h-[100dvh] md:min-h-0 md:h-auto max-w-xl bg-white md:bg-white/40 md:backdrop-blur-3xl px-6 py-8 md:p-12 md:rounded-[48px] md:border md:border-white/60 md:shadow-2xl relative z-10 flex flex-col"
      >
        <button 
          onClick={() => router.back()}
          className="group mb-10 md:mb-12 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors mt-2 md:mt-0"
        >
          <div className="h-8 w-8 rounded-full bg-slate-50 md:bg-white border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
             <ChevronLeft className="w-4 h-4" />
          </div>
          Return to Dashboard
        </button>

        <div className="mb-10 md:mb-12">
          <div className="h-14 w-14 md:h-16 md:w-16 bg-indigo-600 rounded-[20px] md:rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 mb-6 md:mb-8">
             <RefreshCw className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">Refund Form</h1>
          <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] md:tracking-[0.3em] mt-3 md:mt-4 leading-relaxed md:leading-loose">enter order id to proceed here</p>
        </div>

        <div className="flex-1 flex flex-col">

        <AnimatePresence mode="wait">
          {!foundOrder ? (
            <motion.form 
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleVerify} 
              className="space-y-6"
            >
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                   <Search className="w-5 h-5" />
                </div>
                <input 
                  required
                  autoFocus
                  value={orderId}
                  onChange={(e) => {
                    setOrderId(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  placeholder="E.G. OD337..."
                  className="w-full h-20 bg-white border-2 border-slate-100 rounded-[28px] pl-16 pr-8 text-lg font-black text-slate-900 placeholder:text-slate-200 outline-none focus:border-indigo-600 focus:ring-8 focus:ring-indigo-600/5 transition-all uppercase tracking-widest"
                />
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-rose-50 border border-rose-100 p-5 rounded-3xl flex items-start gap-4"
                >
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold text-rose-600 leading-relaxed uppercase tracking-wide">{error}</p>
                </motion.div>
              )}

              <button 
                type="submit"
                disabled={loading || !orderId.trim()}
                className="w-full h-20 bg-slate-900 text-white rounded-[28px] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale shadow-xl shadow-slate-900/10 mt-8"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify Order ID <ArrowRight className="w-4 h-4" /></>}
              </button>
            </motion.form>
          ) : (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className={`p-8 rounded-[36px] border ${getStatusDisplay(foundOrder.status).bg} border-slate-100`}>
                <div className="flex items-center gap-5 mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                    {getStatusDisplay(foundOrder.status).icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Status</p>
                    <h3 className={`text-xl font-black uppercase tracking-tight ${getStatusDisplay(foundOrder.status).color}`}>
                      {getStatusDisplay(foundOrder.status).label}
                    </h3>
                  </div>
                </div>
                
                <p className="text-sm font-medium text-slate-600 leading-relaxed mb-8">
                  {getStatusDisplay(foundOrder.status).desc}
                </p>

                <div className="flex items-center justify-between p-5 bg-white/50 rounded-2xl border border-white">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Order</span>
                  <span className="text-xs font-black text-slate-900">{foundOrder.userOrderId || foundOrder.aspireOrderId}</span>
                </div>
              </div>

              <button 
                onClick={() => { setFoundOrder(null); setOrderId(""); }}
                className="w-full h-16 bg-slate-900 text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg shadow-slate-900/10"
              >
                Understood
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        <div className="mt-auto md:mt-12 pt-8 md:pt-12 border-t border-slate-100/50 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 text-[9px] font-black text-slate-400 uppercase tracking-widest pb-4 md:pb-0">
           <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Identity Encrypted</span>
           </div>
           <span>AspireMint Registry v2.0</span>
        </div>
      </motion.div>

    </div>
  );
}
