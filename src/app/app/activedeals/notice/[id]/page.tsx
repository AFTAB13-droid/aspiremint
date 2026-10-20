"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, ArrowLeft, ExternalLink, Clock, ShieldCheck, 
  Sparkles, CheckCircle2, ChevronRight, ShoppingBag
} from "lucide-react";
import toast from "react-hot-toast";

export default function DealNoticePage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params?.id as string;

  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(7);
  const [timerFinished, setTimerFinished] = useState(false);

  useEffect(() => {
    if (!dealId) return;

    const fetchDeal = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/deals/active/${dealId}?v=${Date.now()}`);
        const json = await res.json();
        if (json.success && json.data) {
          const dealData = json.data;
          setDeal(dealData);

          // If no admin remarks are present, directly open the product link!
          const remarks = dealData.userRemarks?.trim();
          if (!remarks) {
            if (dealData.productLink) {
              window.location.replace(dealData.productLink);
            } else {
              router.replace(`/app/activedeals/${dealData.productCode || dealId}`);
            }
          }
        } else {
          toast.error(json.message || "Could not load deal guidelines");
          router.replace("/app/activedeals");
        }
      } catch (err) {
        toast.error("Failed to load deal instructions");
        router.replace("/app/activedeals");
      } finally {
        setLoading(false);
      }
    };

    fetchDeal();
  }, [dealId, router]);

  // Enforce 7-second reading countdown
  useEffect(() => {
    if (loading || !deal?.userRemarks?.trim()) return;

    if (secondsLeft > 0) {
      const interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setTimerFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [loading, deal, secondsLeft]);

  const handleContinue = () => {
    if (!timerFinished) return;
    if (deal?.productLink) {
      window.open(deal.productLink, "_blank", "noopener,noreferrer");
      // Also provide a smooth return path
      router.push(`/app/activedeals/${deal.productCode || dealId}`);
    } else {
      router.push(`/app/activedeals/${deal.productCode || dealId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 animate-spin mb-4">
          <Clock className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
          Checking Deal Protocol & Guidelines...
        </h3>
      </div>
    );
  }

  if (!deal) return null;

  const totalDuration = 7;
  const progressPercent = ((totalDuration - secondsLeft) / totalDuration) * 100;

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 md:p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl bg-white dark:bg-[#0E1526] rounded-[36px] sm:rounded-[44px] border-2 border-amber-300/80 dark:border-amber-500/30 p-6 sm:p-10 shadow-2xl shadow-amber-500/10 dark:shadow-black/50 relative overflow-hidden"
      >
        {/* Glowing backdrop elements */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 h-64 w-64 rounded-full bg-amber-500/10 dark:bg-amber-500/5 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 h-64 w-64 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-[80px] pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest">
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse text-amber-500" />
              <span>Mandatory Reading</span>
            </div>
          </div>

          {/* Deal Metadata Pill */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 dark:bg-[#111827] rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/40">
              {deal.brandName}
            </span>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">•</span>
            <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
              {deal.productCode}
            </span>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">•</span>
            <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase tracking-wider border border-emerald-100 dark:border-emerald-800/50">
              {deal.marketplace}
            </span>
            {deal.dealType && (
              <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[8px] font-black uppercase tracking-wider border border-blue-100 dark:border-blue-800/50">
                {deal.dealType}
              </span>
            )}
          </div>

          {/* Attention Title */}
          <div className="text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Special Instructions
            </h2>
          </div>

          {/* The Remarks Card - Hero Attraction Point */}
          <div className="relative p-5 sm:p-7 rounded-[28px] bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-2 border-amber-400/70 dark:border-amber-500/50 shadow-inner space-y-3">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <span className="text-[11px] font-black uppercase tracking-widest">Admin Remark</span>
            </div>
            <div className="p-4 sm:p-6 rounded-2xl bg-white/95 dark:bg-[#111827]/95 border border-amber-200/70 dark:border-amber-500/30 backdrop-blur-sm shadow-sm">
              <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-relaxed uppercase tracking-tight whitespace-pre-wrap select-text">
                {deal.userRemarks}
              </p>
            </div>
          </div>

          {/* Countdown & Reading Tracker */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
              <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Reading Verification
              </span>
              <span className={timerFinished ? "text-emerald-500 font-black" : "text-amber-500 font-mono"}>
                {timerFinished ? "Completed — Ready to Proceed" : `Please wait ${secondsLeft}s...`}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full rounded-full transition-all duration-300 ${timerFinished ? "bg-emerald-500" : "bg-amber-500"}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => router.push(`/app/activedeals/${deal.productCode || dealId}`)}
              className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-black text-[10px] uppercase tracking-widest transition-all order-2 sm:order-1"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleContinue}
              disabled={!timerFinished}
              className={`w-full sm:flex-1 h-12 sm:h-13 rounded-2xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all order-1 sm:order-2 ${
                timerFinished
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/30 hover:scale-[1.01] active:scale-95 cursor-pointer ring-4 ring-emerald-500/20"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none opacity-80"
              }`}
            >
              {timerFinished ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                  <span>Open Product Link</span>
                  <ExternalLink className="w-3.5 h-3.5 text-white shrink-0" />
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 text-amber-500 animate-spin shrink-0" />
                  <span>Wait ({secondsLeft}s)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
