"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ShieldCheck, ArrowRight, RefreshCw, CheckCircle2, AlertCircle, X, KeyRound } from "lucide-react";
import toast from "react-hot-toast";

interface ChangeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
  onSuccess: (newEmail: string) => void;
  isAdm?: boolean;
}

export function ChangeEmailModal({
  isOpen,
  onClose,
  currentEmail,
  onSuccess,
  isAdm = false,
}: ChangeEmailModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Timer for resend countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setNewEmail("");
      setOtp("");
      setLoading(false);
      setResendCountdown(0);
      setErrorMsg(null);
    }
  }, [isOpen]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const emailTrimmed = newEmail.trim().toLowerCase();
    if (!emailTrimmed) {
      setErrorMsg("Please enter a new email address.");
      return;
    }

    if (emailTrimmed === currentEmail.trim().toLowerCase()) {
      setErrorMsg("The new email must be different from your current email.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailTrimmed)) {
      setErrorMsg("Please enter a valid email address (e.g., name@example.com).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/email/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: emailTrimmed }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to send verification code.");
      }

      toast.success(data.message || `Code sent to ${emailTrimmed}!`);
      setStep(2);
      setResendCountdown(60);
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong.");
      toast.error(err.message || "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0 || loading) return;
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/user/email/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: newEmail.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to resend code.");
      }

      toast.success("New verification code dispatched!");
      setResendCountdown(60);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resend code.");
      toast.error(err.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setErrorMsg("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/email/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newEmail: newEmail.trim().toLowerCase(),
          otp: cleanOtp,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Verification failed.");
      }

      toast.success("Email address updated successfully!");
      onSuccess(newEmail.trim().toLowerCase());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Verification code is invalid or expired.");
      toast.error(err.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={loading ? undefined : onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#0E1526] rounded-[40px] p-8 md:p-10 shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
        >
          {/* Accent glow orb */}
          <div
            className={`absolute top-0 right-0 -mr-12 -mt-12 h-44 w-44 rounded-full blur-3xl opacity-20 pointer-events-none ${
              isAdm ? "bg-indigo-600" : "bg-sky-500"
            }`}
          />

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div
                  className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-md ${
                    isAdm
                      ? "bg-gradient-to-tr from-indigo-600 to-indigo-500 shadow-indigo-600/20"
                      : "bg-gradient-to-tr from-sky-600 to-blue-500 shadow-sky-500/20"
                  }`}
                >
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {step === 1 ? "Change Direct Mail" : "Verify New Mail"}
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                    {step === 1 ? "Step 1 of 2: New Address" : "Step 2 of 2: Confirm OTP"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
                <div className="text-xs font-bold leading-relaxed">{errorMsg}</div>
              </motion.div>
            )}

            {/* Current email pill */}
            <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                  Current Mail
                </span>
                <span className="text-xs font-black text-slate-700 dark:text-slate-200 break-all">{currentEmail}</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[8px] font-black uppercase tracking-wider">
                Active
              </span>
            </div>

            {/* STEP 1: Enter New Email */}
            {step === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    New Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 dark:group-focus-within:text-white transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="e.g. yourname@domain.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      disabled={loading}
                      className="w-full h-16 pl-14 pr-6 bg-slate-50 dark:bg-[#111827] border border-slate-200/70 dark:border-slate-700 focus:bg-white dark:focus:bg-[#161F36] rounded-[24px] shadow-inner font-bold text-sm outline-none transition-all focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-900/40 focus:border-sky-500 disabled:opacity-60 text-slate-900 dark:text-white"
                    />
                  </div>
                  <p className="text-[10px] font-medium text-slate-400 ml-1 leading-normal">
                    A 6-digit confirmation code will be dispatched to this new address.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || !newEmail}
                    className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
                      isAdm
                        ? "bg-indigo-600 shadow-indigo-600/20 hover:bg-indigo-700"
                        : "bg-sky-600 shadow-sky-600/20 hover:bg-sky-700"
                    } disabled:opacity-50`}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending Security Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Verification Code</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* STEP 2: Verify OTP */
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                  <div className="text-xs font-bold text-sky-900 dark:text-sky-200 leading-relaxed">
                    Code dispatched to <span className="font-black text-sky-700 dark:text-sky-400 underline">{newEmail}</span>.
                    Please check your inbox or spam folder.
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Enter 6-Digit OTP
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setOtp("");
                        setErrorMsg(null);
                      }}
                      className="text-[10px] font-black text-sky-600 dark:text-sky-400 hover:text-sky-700 uppercase tracking-wider underline"
                    >
                      Change email
                    </button>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 dark:group-focus-within:text-white transition-colors">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      autoFocus
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      disabled={loading}
                      className="w-full h-16 pl-14 pr-6 bg-slate-50 dark:bg-[#111827] border border-slate-200/70 dark:border-slate-700 focus:bg-white dark:focus:bg-[#161F36] rounded-[24px] shadow-inner font-mono font-black text-lg tracking-[0.3em] outline-none transition-all focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-900/40 focus:border-sky-500 text-slate-900 dark:text-white disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Didn&apos;t receive code?
                  </span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCountdown > 0 || loading}
                    className="text-[10px] font-black text-sky-600 hover:text-sky-700 uppercase tracking-wider disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : "Resend Code"}
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
                      isAdm
                        ? "bg-indigo-600 shadow-indigo-600/20 hover:bg-indigo-700"
                        : "bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700"
                    } disabled:opacity-50`}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying & Updating...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm & Update Mail</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
