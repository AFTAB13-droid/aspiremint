"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Logo } from "@/components/common/Logo";
import { Mail, Lock, ArrowRight, Shield, ShieldCheck, Key, RefreshCw, ChevronLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("OTP sent to your email");
        setStep(2);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Identity Verified");
        setStep(3);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return toast.error("Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.");
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, otp, password }),
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Password Security Updated");
        router.push("/login");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Reset failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center">
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-col w-full"
      >
        {/* HEADER MODULE */}
        <motion.div variants={item} className="mb-10 flex flex-col items-center text-center">
          <div className="h-16 w-16 bg-white rounded-[24px] shadow-2xl border border-slate-100 flex items-center justify-center mb-6">
             <Logo size={40} variant="blue" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-2">
             {step === 1 ? "RECOVERY" : step === 2 ? "VERIFY" : "SECURE"}
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
             {step === 1 ? "Initialize Identity Sync" : step === 2 ? "Authentication Protocol" : "Update Core Credentials"}
          </p>
        </motion.div>

        {/* CORE CARD */}
        <div className="relative group overflow-hidden rounded-[48px] bg-white/40 backdrop-blur-2xl border border-white/60 shadow-2xl">
            {/* SPEEDY ANIMATED BACKGROUND - Primary Visual Layer */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
               <div className="absolute inset-0 bg-white/40" />
               <div className="absolute inset-0 opacity-[0.45]">
                 {[...Array(10)].map((_, i) => (
                   <motion.div
                     key={i}
                     initial={{ x: "-100%", y: `${i * 10 + 2}%`, opacity: 0 }}
                     animate={{ 
                       x: "200%", 
                       opacity: [0, 1, 0] 
                     }}
                     transition={{ 
                       duration: 1 + Math.random() * 1.5, 
                       repeat: Infinity, 
                       delay: i * 0.2,
                       ease: "linear"
                     }}
                     className="absolute h-[3px] w-64 bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.8)]"
                   />
                 ))}
               </div>
               <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1.5px,transparent_1.5px)] [background-size:20px_20px] opacity-30" />
            </div>

            <div className="p-10 relative z-10">

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSendOTP} 
                className="space-y-6 relative z-10"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Registered Email</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="email" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter account mail"
                      className="w-full h-16 pl-14 pr-6 bg-slate-50 border-none rounded-3xl font-bold text-sm focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                    />
                  </div>
                </div>
                <button 
                  disabled={isLoading}
                  className="w-full h-16 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 group"
                >
                  {isLoading ? "PROBING..." : "SEND SECURITY CODE"}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOTP} 
                className="space-y-6 relative z-10"
              >
                <div className="space-y-2 text-center mb-4">
                  <p className="text-xs font-bold text-slate-500">Security code sent to</p>
                  <p className="text-sm font-black text-blue-600">{email}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">6-Digit Code</label>
                  <div className="relative">
                    <Shield className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text" 
                      required 
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="••••••"
                      className="w-full h-20 pl-14 pr-6 bg-slate-50 border-none rounded-3xl font-black text-2xl tracking-[0.5em] text-center focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                    />
                  </div>
                </div>
                <button 
                  disabled={isLoading}
                  className="w-full h-16 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {isLoading ? "VERIFYING..." : "AUTHORIZE ACCESS"}
                  <ShieldCheck className="w-5 h-5" />
                </button>
                <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"
                >
                   Change Email
                </button>
              </motion.form>
            )}

            {step === 3 && (
              <motion.form 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleResetPassword} 
                className="space-y-6 relative z-10"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-16 pl-14 pr-14 bg-slate-50 border-none rounded-3xl font-bold text-sm focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm Identity</label>
                  <div className="relative">
                    <Key className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-16 pl-14 pr-14 bg-slate-50 border-none rounded-3xl font-bold text-sm focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                    />
                  </div>
                </div>
                <button 
                  disabled={isLoading}
                  className="w-full h-16 bg-emerald-600 text-white rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {isLoading ? "UPDATING..." : "OVERWRITE CREDENTIALS"}
                  <RefreshCw className="w-4 h-4" />
                </button>
              </motion.form>
            )}
            </AnimatePresence>
          </div>
        </div>

        <motion.div variants={item} className="mt-8 flex justify-center">
          <Link href="/login" className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Login
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
