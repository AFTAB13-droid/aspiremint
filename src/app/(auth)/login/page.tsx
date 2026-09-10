"use client";

import React, { useState } from "react";
import { motion, Variants } from "framer-motion";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Logo } from "@/components/common/Logo";
import { Mail, Lock, ArrowRight, Shield, Command, Activity, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  const [email, setEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);

  React.useEffect(() => {
    const savedEmail = localStorage.getItem("remembered_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  React.useEffect(() => {
    const checkScreen = () => setIsLargeScreen(window.innerWidth >= 1024);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
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
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const emailVal = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await signIn("credentials", { email: emailVal, password, redirect: false });

      if (res?.error) {
        toast.error(res.error);
        setIsLoading(false);
      } else {
        if (rememberMe) {
          localStorage.setItem("remembered_email", emailVal);
        } else {
          localStorage.removeItem("remembered_email");
        }

        toast.success("Authentication Successful");
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("onboarding_dismissed");
        }
        router.replace("/app");
        router.refresh();
      }
    } catch (error) {
      toast.error("System connection failure");
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!email.trim()) {
      return toast.error("Please enter your Email ID first to scan biometrics");
    }

    setIsBiometricLoading(true);
    const loadingId = toast.loading("Checking registered credentials...");
    try {
      const { startAuthentication } = await import("@simplewebauthn/browser");

      // 1. Get authentication challenge options
      const optionsRes = await fetch(`/api/auth/webauthn/login?email=${encodeURIComponent(email.toLowerCase().trim())}`);
      const optionsJson = await optionsRes.json();
      if (!optionsJson.success || !optionsJson.data) {
        throw new Error(optionsJson.message || "No biometric credentials found. Please register device in settings first.");
      }

      toast.loading("Scanning Touch ID / Face ID...", { id: loadingId });

      // 2. Browser biometric scanning challenge assertion
      const authenticationResponse = await startAuthentication(optionsJson.data);

      toast.loading("Verifying signature credentials...", { id: loadingId });

      // 3. Post assertion payload back to verification api
      const verifyRes = await fetch("/api/auth/webauthn/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authenticationResponse),
      });
      const verifyJson = await verifyRes.json();

      if (!verifyJson.success || !verifyJson.token) {
        throw new Error(verifyJson.message || "Credential verification failed.");
      }

      // 4. Authenticate session bypass
      const nextAuthRes = await signIn("credentials", {
        email: verifyJson.email,
        webauthnToken: verifyJson.token,
        redirect: false
      });

      if (nextAuthRes?.error) {
        throw new Error(nextAuthRes.error);
      }

      if (rememberMe) {
        localStorage.setItem("remembered_email", email);
      } else {
        localStorage.removeItem("remembered_email");
      }

      toast.success("Welcome back! Authentication Successful", { id: loadingId });
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("onboarding_dismissed");
      }
      router.replace("/app");
      router.refresh();
    } catch (err: any) {
      console.error("Biometric login failed:", err);
      toast.error(err.message || "Device authentication failed or cancelled.", { id: loadingId });
    } finally {
      setIsBiometricLoading(false);
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
        className="mb-4 lg:mb-6 flex flex-col items-center text-center"
      >
        <div className="flex items-center justify-center gap-3 lg:gap-5 mb-2 lg:mb-3">
           <div className="h-12 w-12 lg:h-16 lg:w-16 bg-white rounded-[18px] lg:rounded-[24px] shadow-xl border border-slate-100 flex shrink-0 items-center justify-center hover:rotate-6 transition-transform cursor-pointer relative z-10">
              <Logo size={32} variant="blue" className="lg:hidden" />
              <Logo size={44} variant="blue" className="hidden lg:block" />
           </div>
           <div className="relative">
             <motion.span 
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ duration: 0.5, delay: 0.2 }}
               className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 relative z-10 leading-none"
             >
                AspireMint
             </motion.span>
             {/* Shine effect over text */}
             <motion.div 
               animate={{ x: ['-100%', '200%'] }} 
               transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
               className="absolute top-0 bottom-0 w-8 lg:w-16 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12 z-20 pointer-events-none"
             />
           </div>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-xs lg:text-sm font-black text-slate-700 tracking-[0.2em] uppercase">
             WELCOME
          </h1>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <Link href="/signup" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1">
             New User? Register <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </motion.div>

      {/* LOGIN CORE CARD */}
      <motion.div 
        variants={item}
        whileHover={{ scale: 1.01, y: -3 }}
        className="relative group"
      >
        <div className="absolute -inset-4 bg-blue-600/10 blur-[100px] rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        
        <div className="relative group overflow-hidden rounded-[28px] lg:rounded-[40px] bg-gradient-to-b from-[#e0f7fa]/90 via-white/90 to-white/90 backdrop-blur-2xl border border-white/60 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.08)]">
            {/* SPEEDY ANIMATED BACKGROUND - Moved to base layer */}
            {isLargeScreen && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                 <div className="absolute inset-0 bg-white/40" />
                 <div className="absolute inset-0 opacity-[0.4]">
                   {[...Array(12)].map((_, i) => (
                     <motion.div
                       key={i}
                       initial={{ x: "-100%", y: `${i * 8 + 2}%`, opacity: 0 }}
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
                 <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-30" />
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 lg:p-8 space-y-4 lg:space-y-5 relative z-10">

          <div className="space-y-1.5 relative z-10">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email ID</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                 <Mail className="w-4 h-4" />
              </div>
              <input 
                type="email" 
                name="email" 
                placeholder="root@aspiremint.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 lg:h-14 pl-12 pr-5 bg-slate-50/50 border-none focus:bg-white rounded-[18px] lg:rounded-[20px] shadow-inner font-bold text-xs lg:text-sm transition-all focus:ring-4 focus:ring-blue-500/10 outline-none placeholder:text-slate-300"
              />
            </div>
          </div>

          <div className="space-y-1.5 relative z-10">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Password</label>
              <Link href="/forgot-password" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Forgot Password?</Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                 <Lock className="w-4 h-4" />
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                placeholder="••••••••••••" 
                required 
                className="w-full h-12 lg:h-14 pl-12 pr-12 bg-slate-50/50 border-none focus:bg-white rounded-[18px] lg:rounded-[20px] shadow-inner font-bold text-xs lg:text-sm transition-all focus:ring-4 focus:ring-blue-500/10 outline-none placeholder:text-slate-300"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-blue-600 transition-colors"
              >
                 {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center gap-2 px-1 relative z-10">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded-md border-slate-200 text-blue-600 focus:ring-blue-500/10 cursor-pointer"
              />
              <span className="text-[10px] font-bold text-slate-500">
                Remember email for quick logins
              </span>
            </label>
          </div>

          <div className="pt-2 relative z-10">
            <button 
              type="submit" 
              disabled={isLoading || isBiometricLoading}
              className="w-full h-12 lg:h-14 bg-slate-900 text-white rounded-[18px] lg:rounded-[20px] font-black uppercase tracking-[0.25em] text-[10px] lg:text-[11px] shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-3 group/btn overflow-hidden relative"
            >
               <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
               <span className="relative z-10">{isLoading ? "AUTHENTICATING..." : "SIGN IN TO PORTAL"}</span>
               {!isLoading && <ArrowRight className="w-4 h-4 relative z-10 group-hover/btn:translate-x-1.5 transition-transform" />}
            </button>
          </div>

          {/* Biometric Bypass Button */}
          <div className="pt-1 relative z-10 flex flex-col items-center">
            <div className="flex items-center w-full gap-3 mb-2.5">
              <div className="h-px bg-slate-100/70 flex-1" />
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">or bypass with</span>
              <div className="h-px bg-slate-100/70 flex-1" />
            </div>

            <button 
              type="button"
              disabled={isLoading || isBiometricLoading}
              onClick={handleBiometricLogin}
              className="w-full h-11 lg:h-12 bg-white hover:bg-slate-50 border border-slate-100 rounded-[18px] lg:rounded-[20px] text-slate-700 font-black uppercase tracking-[0.15em] text-[9px] shadow-sm flex items-center justify-center gap-2.5 transition-all active:scale-95 disabled:opacity-50"
            >
              <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11c0-1.18-.91-2.164-2.09-2.201a5.122 5.122 0 00-4.756 5.11 9.96 9.96 0 00.322 2.501M12 11c0-3.517 1.009-6.799 2.753-9.571m3.44 2.04l-.054.09A13.916 13.916 0 0015 11c0 1.18.91 2.164 2.09 2.201a5.122 5.122 0 004.756-5.11 9.96 9.96 0 00-.322-2.501M12 21c-2.907 0-5.525-1.125-7.5-2.965m15 0A14.902 14.902 0 0112 21z" />
              </svg>
              <span>{isBiometricLoading ? "SCANNING BIOMETRIC..." : "TOUCH / FACE ID QUICK LOGIN"}</span>
            </button>
          </div>

          {/* Quick Register Link inside form */}
          <div className="pt-2 text-center relative z-10 border-t border-slate-100/80 mt-2">
            <p className="text-xs text-slate-500 font-medium pt-1">
              Don&apos;t have an account?{" "}
              <Link 
                href="/signup" 
                className="font-black text-blue-600 hover:text-blue-700 underline uppercase tracking-wider text-[11px] ml-1"
              >
                Register / Sign Up →
              </Link>
            </p>
          </div>
        </form>
      </div>
    </motion.div>

      {/* SYSTEM TRUST BARS */}
      <motion.div 
        variants={item}
        className="mt-4 grid grid-cols-3 gap-3"
      >
        {[Shield, Command, Activity].map((Icon, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 opacity-20">
             <Icon className="w-4 h-4 text-slate-900" />
             <div className="h-0.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <motion.div animate={{ x: [-20, 40] }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="h-full w-1/2 bg-slate-900" />
             </div>
          </div>
        ))}
      </motion.div>

    </motion.div>
  );
}

const Plus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
);
