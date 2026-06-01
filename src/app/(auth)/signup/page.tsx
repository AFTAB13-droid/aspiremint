"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Logo } from "@/components/common/Logo";
import { User, Mail, Phone, Lock, Shield, ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

function getPasswordStrength(pwd: string) {
  if (!pwd) return { score: 0, label: "", color: "bg-slate-200", text: "text-slate-400" };
  let score = 0;
  
  const hasMinLength = pwd.length >= 8;
  const hasLowercase = /[a-z]/.test(pwd);
  const hasUppercase = /[A-Z]/.test(pwd);
  const hasDigit = /\d/.test(pwd);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/]/.test(pwd);

  if (hasMinLength) score += 1;
  if (hasLowercase && hasUppercase) score += 1;
  if (hasDigit) score += 1;
  if (hasSpecial) score += 1;

  switch (score) {
    case 0:
    case 1:
      return { score, label: "Weak", color: "bg-rose-500", text: "text-rose-500" };
    case 2:
      return { score, label: "Fair", color: "bg-amber-500", text: "text-amber-500" };
    case 3:
      return { score, label: "Strong", color: "bg-blue-500", text: "text-blue-500" };
    case 4:
      return { score, label: "Very Secure", color: "bg-emerald-500", text: "text-emerald-500" };
    default:
      return { score: 0, label: "", color: "bg-slate-200", text: "text-slate-400" };
  }
}

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState("USER");
  const [showPassword, setShowPassword] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  useEffect(() => {
    if (showOtp && otpInputRef.current) {
      setTimeout(() => {
        otpInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        otpInputRef.current?.focus();
      }, 300);
    }
  }, [showOtp]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const checkScreen = () => setIsLargeScreen(window.innerWidth >= 1024);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.05 }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  const handleSendOtp = async () => {
    if (!formData.name || !formData.email || !formData.mobile || !formData.password || !formData.confirmPassword) {
      return toast.error("Please fill all fields first");
    }
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/]).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      return toast.error("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
    }

    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    if (formData.mobile.length !== 10) {
      return toast.error("Enter a valid 10-digit mobile number");
    }

    setSendingOtp(true);
    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, mobile: formData.mobile }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Identity Verification Code Sent");
        setShowOtp(true);
        setResendCountdown(30); // 30 seconds cooldown for OTP resend
      } else {
        toast.error(result.message || "Failed to send OTP");
      }
    } catch (error) {
      toast.error("Network failure during code transmission");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!showOtp) {
      handleSendOtp();
      return;
    }

    if (!otp || otp.length !== 6) {
      return toast.error("Enter 6-digit OTP code");
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role, otp }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.message || "Signup failed");
        setIsLoading(false);
        return;
      }

      if (result.data.role === "MEDIATOR") {
        toast.success("Deployment Request Sent");
        setTimeout(() => router.push("/registration-pending"), 1000);
      } else {
        toast.success("Core Identity Initialized");
        setTimeout(() => router.push("/login"), 1000);
      }
    } catch (error) {
      toast.error("Network synchronization failure");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] lg:min-h-screen flex flex-col lg:justify-center bg-white lg:bg-transparent pt-8 lg:py-0 overflow-visible">
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-col w-full h-full flex-1"
      >
        {/* IDENTITY MODULE */}
        <motion.div 
          variants={item}
          className="mb-4 lg:mb-12 flex flex-col items-center text-center px-4 shrink-0"
        >
          <div className="h-10 w-10 lg:h-16 lg:w-16 bg-slate-50 lg:bg-white rounded-[12px] lg:rounded-[24px] shadow-none lg:shadow-2xl border border-slate-100 flex items-center justify-center mb-4 lg:mb-8 hover:rotate-6 transition-transform cursor-pointer">
             <Logo size={24} variant="blue" className="lg:hidden" />
             <Logo size={40} variant="blue" className="hidden lg:block" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter leading-none mb-1.5 lg:mb-3 uppercase">
             CREATE<br className="lg:hidden"/> IDENTITY
          </h1>
          <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] lg:tracking-[0.4em]">
             Initialize Core Enrollment
          </p>
        </motion.div>

        {/* SIGNUP CORE CARD */}
        <motion.div 
          variants={item}
          className="relative group flex-1 flex flex-col min-h-0"
        >
        <div className="relative group overflow-hidden rounded-none lg:rounded-[56px] bg-white lg:bg-white/40 backdrop-blur-2xl border-none lg:border lg:border-white/60 shadow-none lg:shadow-[0_32px_80px_-15px_rgba(0,0,0,0.1)] flex-1 flex flex-col min-h-0">
            {/* SPEEDY ANIMATED BACKGROUND - Primary Visual Layer */}
            {isLargeScreen && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                 <div className="absolute inset-0 bg-white/40" />
                 <div className="absolute inset-0 opacity-[0.45]">
                   {[...Array(15)].map((_, i) => (
                     <motion.div
                       key={i}
                       initial={{ x: "-100%", y: `${i * 6.5 + 2}%`, opacity: 0 }}
                       animate={{ 
                         x: "200%", 
                         opacity: [0, 1, 0] 
                       }}
                       transition={{ 
                         duration: 0.8 + Math.random() * 1.5, 
                         repeat: Infinity, 
                         delay: i * 0.15,
                         ease: "linear"
                       }}
                       className="absolute h-[3px] w-80 bg-blue-600 shadow-[0_0_25px_rgba(37,99,235,0.9)]"
                     />
                   ))}
                 </div>
                 <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-40" />
              </div>
            )}

            <form onSubmit={handleSubmit} className="relative z-10 flex-1 flex flex-col min-h-0">

              <div className="flex-1 overflow-y-auto p-6 pb-4 lg:p-12 lg:pb-0 space-y-4 lg:space-y-8 flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8 relative z-10 shrink-0">
                  <div className="space-y-1.5 lg:space-y-2">
                    <label className="text-[8px] lg:text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-5 flex items-center text-slate-400">
                         <User className="w-4 h-4 lg:w-5 lg:h-5" />
                      </div>
                      <input 
                        type="text" 
                        name="name" 
                        placeholder="Full Name" 
                        required 
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full h-12 lg:h-16 pl-12 lg:pl-14 pr-6 bg-slate-50/70 lg:bg-slate-50/50 border border-slate-100 lg:border-none focus:bg-white rounded-[16px] lg:rounded-[24px] shadow-none lg:shadow-inner font-bold text-xs lg:text-sm transition-all focus:border-blue-200 focus:ring-4 focus:ring-blue-500/5 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 lg:space-y-2">
                    <label className="text-[8px] lg:text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Direct Mail</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-5 flex items-center text-slate-400">
                         <Mail className="w-4 h-4 lg:w-5 lg:h-5" />
                      </div>
                      <input 
                        type="email" 
                        name="email" 
                        placeholder="name@mail.com" 
                        required 
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full h-12 lg:h-16 pl-12 lg:pl-14 pr-6 bg-slate-50/70 lg:bg-slate-50/50 border border-slate-100 lg:border-none focus:bg-white rounded-[16px] lg:rounded-[24px] shadow-none lg:shadow-inner font-bold text-xs lg:text-sm transition-all focus:border-blue-200 focus:ring-4 focus:ring-blue-500/5 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8 relative z-10 shrink-0">
                  <div className="space-y-1.5 lg:space-y-2">
                    <label className="text-[8px] lg:text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Secure Mobile</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-5 flex items-center text-slate-400">
                         <Phone className="w-4 h-4 lg:w-5 lg:h-5" />
                      </div>
                      <input 
                        type="tel" 
                        name="mobile" 
                        placeholder="10-Digit ID" 
                        required 
                        maxLength={10}
                        pattern="[0-9]{10}"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/[^0-9]/g, '') })}
                        className="w-full h-12 lg:h-16 pl-12 lg:pl-14 pr-6 bg-slate-50/70 lg:bg-slate-50/50 border border-slate-100 lg:border-none focus:bg-white rounded-[16px] lg:rounded-[24px] shadow-none lg:shadow-inner font-bold text-xs lg:text-sm transition-all focus:border-blue-200 focus:ring-4 focus:ring-blue-500/5 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 lg:space-y-2">
                    <label className="text-[8px] lg:text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Role Type</label>
                    <div className="flex gap-2 h-12 lg:h-16">
                       {[
                         { id: 'USER', label: 'Buyer', icon: User },
                         { id: 'MEDIATOR', label: 'Mediator', icon: Shield }
                       ].map((opt) => (
                         <button
                           key={opt.id}
                           type="button"
                           onClick={() => setRole(opt.id)}
                           className={`flex-1 rounded-[16px] lg:rounded-[24px] border flex items-center justify-center gap-2 transition-all ${
                             role === opt.id 
                               ? 'bg-blue-600 border-blue-600 text-white shadow-md lg:shadow-xl shadow-blue-600/20' 
                               : 'bg-white border-slate-200 text-slate-500 hover:border-blue-200'
                           }`}
                         >
                            <opt.icon className="w-3.5 h-3.5 lg:w-5 lg:h-5" />
                            <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                            <input type="radio" name="role" value={opt.id} checked={role === opt.id} onChange={() => {}} className="hidden" />
                         </button>
                       ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8 relative z-10 shrink-0">
                  <div className="space-y-1.5 lg:space-y-2">
                    <label className="text-[8px] lg:text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-5 flex items-center text-slate-400">
                         <Lock className="w-4 h-4 lg:w-5 lg:h-5" />
                      </div>
                      <input 
                        type={showPassword ? "text" : "password"} 
                        name="password" 
                        placeholder="Enter Password" 
                        required 
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full h-12 lg:h-16 pl-12 lg:pl-14 pr-12 lg:pr-14 bg-slate-50/70 lg:bg-slate-50/50 border border-slate-100/50 focus:bg-white rounded-[16px] lg:rounded-[24px] shadow-none lg:shadow-inner font-bold text-xs lg:text-sm transition-all focus:border-blue-200 focus:ring-4 focus:ring-blue-500/5 outline-none"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-4 lg:right-5 flex items-center text-slate-400 hover:text-blue-600 transition-colors"
                      >
                         {showPassword ? <EyeOff className="w-4 h-4 lg:w-5 lg:h-5" /> : <Eye className="w-4 h-4 lg:w-5 lg:h-5" />}
                      </button>
                    </div>

                    {/* LIVE PASSWORD STRENGTH DISPLAY */}
                    {formData.password && (
                      <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        {/* Bars and Label */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 flex gap-1">
                            {[1, 2, 3, 4].map((step) => {
                              const strength = getPasswordStrength(formData.password);
                              const isActive = step <= strength.score;
                              return (
                                <div 
                                  key={step} 
                                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                    isActive ? strength.color : "bg-slate-100"
                                  }`} 
                                />
                              );
                            })}
                          </div>
                          <span className={`text-[8.5px] font-black uppercase tracking-widest shrink-0 ${getPasswordStrength(formData.password).text}`}>
                            {getPasswordStrength(formData.password).label}
                          </span>
                        </div>

                        {/* Checklist */}
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 border-t border-slate-100/30">
                          {[
                            { test: (p: string) => p.length >= 8, label: "8+ Characters" },
                            { test: (p: string) => /[A-Z]/.test(p), label: "1 Uppercase (A-Z)" },
                            { test: (p: string) => /[a-z]/.test(p), label: "1 Lowercase (a-z)" },
                            { test: (p: string) => /\d/.test(p), label: "1 Number (0-9)" },
                            { test: (p: string) => /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/]/.test(p), label: "1 Special Char" },
                          ].map((check, idx) => {
                            const isMet = check.test(formData.password);
                            return (
                              <div key={idx} className="flex items-center gap-1.5">
                                <div className={`h-2 w-2 rounded-full transition-colors ${isMet ? "bg-emerald-500" : "bg-slate-200"}`} />
                                <span className={`text-[8px] font-bold uppercase tracking-wider ${isMet ? "text-emerald-600" : "text-slate-400"}`}>
                                  {check.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 lg:space-y-2">
                    <label className="text-[8px] lg:text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-5 flex items-center text-slate-400">
                         <Lock className="w-4 h-4 lg:w-5 lg:h-5" />
                      </div>
                      <input 
                        type={showPassword ? "text" : "password"} 
                        name="confirmPassword" 
                        placeholder="Confirm Password" 
                        required 
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full h-12 lg:h-16 pl-12 lg:pl-14 pr-12 lg:pr-14 bg-slate-50/70 lg:bg-slate-50/50 border border-slate-100 lg:border-none focus:bg-white rounded-[16px] lg:rounded-[24px] shadow-none lg:shadow-inner font-bold text-xs lg:text-sm transition-all focus:border-blue-200 focus:ring-4 focus:ring-blue-500/5 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {showOtp && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="space-y-1.5 lg:space-y-2 pt-2 relative z-10 shrink-0"
                  >
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[8px] lg:text-[11px] font-black text-blue-600 uppercase tracking-widest">Identity Verification Code</label>
                      <button
                        type="button"
                        disabled={sendingOtp || isLoading || resendCountdown > 0}
                        onClick={handleSendOtp}
                        className="text-[8px] lg:text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest hover:underline disabled:opacity-50 flex items-center gap-1 transition-all"
                      >
                        {sendingOtp ? (
                          "Resending..."
                        ) : resendCountdown > 0 ? (
                          `Resend in ${resendCountdown}s`
                        ) : (
                          "Resend Code"
                        )}
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-5 flex items-center text-blue-600">
                        <Shield className="w-4 h-4 lg:w-5 lg:h-5" />
                      </div>
                      <input 
                        ref={otpInputRef}
                        type="text" 
                        required 
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="6-DIGIT OTP" 
                        className="w-full h-12 lg:h-16 pl-12 lg:pl-14 pr-6 bg-blue-50 border-2 border-blue-100 focus:bg-white rounded-[16px] lg:rounded-[24px] shadow-none lg:shadow-inner font-black text-xs lg:text-lg transition-all focus:ring-4 focus:ring-blue-500/5 outline-none tracking-[0.5em] text-blue-600"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="px-6 pb-6 pt-4 lg:px-12 lg:pb-12 lg:pt-8 relative z-20 shrink-0 bg-white lg:bg-transparent border-t border-slate-100 lg:border-none">
                <button 
                  type="submit" 
                  disabled={isLoading || sendingOtp}
                  className="w-full h-14 lg:h-20 bg-slate-900 text-white rounded-[16px] lg:rounded-[32px] font-black uppercase tracking-[0.4em] text-[10px] lg:text-[11px] shadow-xl lg:shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 group/btn relative overflow-hidden"
                >
                   <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
                   <span className="relative z-10">
                     {sendingOtp ? "VERIFYING..." : isLoading ? "VALIDATING..." : showOtp ? "VERIFY" : "CREATE ACCOUNT"}
                   </span>
                   {(!isLoading && !sendingOtp) && <ArrowRight className="w-4 h-4 relative z-10 group-hover/btn:translate-x-2 transition-transform" />}
                </button>
              </div>
            </form>
        </div>
      </motion.div>

        {/* FOOTER LINK MODULE */}
        <motion.div 
          variants={item}
          className="mt-0 lg:mt-10 p-5 lg:p-8 bg-slate-50 lg:bg-slate-50/50 backdrop-blur-xl rounded-none lg:rounded-[32px] border-t border-slate-100 flex flex-row lg:flex-col items-center justify-between lg:justify-center gap-4 pb-safe"
        >
          <p className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest">Already have an account?</p>
          <Link href="/login" className="flex-1 lg:w-full max-w-[140px] lg:max-w-none">
             <button className="w-full py-2.5 lg:py-2 bg-white border border-slate-200 text-blue-600 rounded-[12px] lg:rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all shadow-sm lg:shadow-none">
                Sign In
             </button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
