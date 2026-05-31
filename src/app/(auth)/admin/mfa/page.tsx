"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Logo } from "@/components/common/Logo";
import { Shield, Key, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";

export default function AdminMfaPage() {
  const { data: session, update, status } = useSession();
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Redirect if they aren't authenticated or don't need MFA
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated" && !session?.user?.mfaPending) {
      router.replace("/dashboard");
    }
  }, [session, status, router]);

  useEffect(() => {
    // Auto-focus OTP input
    if (otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, []);

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      return toast.error("Enter a valid 6-digit passcode");
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/verify-mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.message || "Invalid OTP code");
        setIsLoading(false);
        return;
      }

      toast.success("Security Clearance Granted");

      // Update the NextAuth session dynamically to clear the mfaPending flag
      await update({ mfaPending: false });
      
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error("Security authorization failed");
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col w-full"
    >
      {/* IDENTITY MODULE */}
      <motion.div 
        variants={item}
        className="mb-12 flex flex-col items-center text-center"
      >
        <div className="flex items-center justify-center gap-4 mb-4">
           <div className="h-16 w-16 bg-slate-900 rounded-[20px] shadow-2xl flex shrink-0 items-center justify-center hover:rotate-6 transition-transform cursor-pointer relative z-10 border border-slate-800">
              <Logo size={40} variant="white" />
           </div>
           <div className="relative">
              <span className="text-4xl sm:text-5xl font-black tracking-tighter text-slate-900 leading-none">
                 Auth Clearance
              </span>
           </div>
        </div>
        <h1 className="text-sm font-black text-blue-600 tracking-[0.2em] leading-none mb-3 uppercase flex items-center justify-center gap-2">
           <Shield className="w-4 h-4" /> SECURE GATEWAY DETECTED
        </h1>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
           Multi-Factor Identity Validation
        </p>
      </motion.div>

      {/* CORE FORM CARD */}
      <motion.div 
        variants={item}
        className="relative group"
      >
        <div className="absolute -inset-4 bg-blue-600/5 blur-[80px] rounded-full -z-10" />
        
        <div className="relative overflow-hidden rounded-[40px] bg-white border border-slate-100 shadow-[0_32px_80px_-15px_rgba(0,0,0,0.08)]">
            <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

            <form onSubmit={handleSubmit} className="p-6 lg:p-12 space-y-8 relative z-10">
              <div className="text-center space-y-2">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Key className="w-5 h-5 animate-pulse" />
                </div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Security Passcode</h3>
                <p className="text-xs text-slate-500 font-bold max-w-sm mx-auto leading-relaxed">
                   Enter the 6-digit security code sent to <b>{session?.user?.email}</b> to complete your administrative authentication.
                </p>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-5 flex items-center text-blue-600">
                     <ShieldCheck className="w-5 h-5" />
                  </div>
                  <input 
                    ref={otpInputRef}
                    type="text" 
                    required 
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="ENTER MFA CODE" 
                    className="w-full h-16 pl-14 pr-6 bg-slate-50 border-2 border-slate-100 focus:border-blue-500/20 focus:bg-white rounded-[24px] shadow-inner font-black text-sm tracking-[0.5em] focus:ring-8 focus:ring-blue-500/5 outline-none placeholder:text-slate-300 text-center text-blue-600 placeholder:tracking-normal"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-16 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-[0.3em] text-[11px] shadow-xl hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-4 group/btn overflow-hidden relative"
                >
                   <span className="relative z-10">{isLoading ? "VERIFYING AUTHORIZATION..." : "CONFIRM SECURE PORTAL"}</span>
                   {!isLoading && <ArrowRight className="w-4 h-4 relative z-10 group-hover/btn:translate-x-2 transition-transform" />}
                </button>
              </div>
            </form>
        </div>
      </motion.div>

      {/* SUPPORT FOOTER LINK */}
      <motion.div 
        variants={item}
        className="mt-8 text-center"
      >
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
           <HelpCircle className="w-3.5 h-3.5" /> Code didn&apos;t arrive? Check spam folders or verify GMAIL config.
        </p>
      </motion.div>
    </motion.div>
  );
}
