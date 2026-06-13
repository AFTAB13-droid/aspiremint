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
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await signIn("credentials", { email, password, redirect: false });

      if (res?.error) {
        toast.error(res.error);
        setIsLoading(false);
      } else {
        toast.success("Authentication Successful");
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("onboarding_dismissed");
        }
        window.location.href = "/app";
      }
    } catch (error) {
      toast.error("System connection failure");
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
        <div className="flex items-center justify-center gap-4 lg:gap-6 mb-4 lg:mb-6">
           <div className="h-16 w-16 lg:h-24 lg:w-24 bg-white rounded-[24px] lg:rounded-[32px] shadow-2xl border border-slate-100 flex shrink-0 items-center justify-center hover:rotate-6 transition-transform cursor-pointer relative z-10">
              <Logo size={44} variant="blue" className="lg:hidden" />
              <Logo size={64} variant="blue" className="hidden lg:block" />
           </div>
           <div className="relative">
             <motion.span 
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ duration: 0.5, delay: 0.2 }}
               className="text-4xl sm:text-5xl lg:text-[4.5rem] font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 relative z-10 leading-none"
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
        <h1 className="text-xl lg:text-2xl font-black text-slate-700 tracking-[0.2em] lg:tracking-[0.3em] leading-none mb-3 uppercase">
           WELCOME
        </h1>
        <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
           Initialize Core Synchronization
        </p>
      </motion.div>

      {/* LOGIN CORE CARD */}
      <motion.div 
        variants={item}
        whileHover={{ scale: 1.01, y: -5 }}
        className="relative group"
      >
        <div className="absolute -inset-4 bg-blue-600/10 blur-[100px] rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        
        <div className="relative group overflow-hidden rounded-[40px] lg:rounded-[56px] bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_32px_80px_-15px_rgba(0,0,0,0.1)]">
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

            <form onSubmit={handleSubmit} className="p-6 lg:p-12 space-y-6 lg:space-y-10 relative z-10">

          <div className="space-y-3 relative z-10">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Email ID</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-5 flex items-center text-slate-400">
                 <Mail className="w-5 h-5" />
              </div>
              <input 
                type="email" 
                name="email" 
                placeholder="root@aspiremint.com" 
                required 
                className="w-full h-16 pl-14 pr-6 bg-slate-50/50 border-none focus:bg-white rounded-[24px] shadow-inner font-bold text-sm transition-all focus:ring-8 focus:ring-blue-500/5 outline-none placeholder:text-slate-300"
              />
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            <div className="flex justify-between items-center px-1">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Password</label>
              <Link href="/forgot-password" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Forgot Password?</Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-5 flex items-center text-slate-400">
                 <Lock className="w-5 h-5" />
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                placeholder="••••••••••••" 
                required 
                className="w-full h-16 pl-14 pr-14 bg-slate-50/50 border-none focus:bg-white rounded-[24px] shadow-inner font-bold text-sm transition-all focus:ring-8 focus:ring-blue-500/5 outline-none placeholder:text-slate-300"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-5 flex items-center text-slate-400 hover:text-blue-600 transition-colors"
              >
                 {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="pt-4 relative z-10">
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-16 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-[0.3em] text-[11px] shadow-3xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-4 group/btn overflow-hidden relative"
            >
               <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
               <span className="relative z-10">{isLoading ? "AUTHENTICATING..." : "SIGN IN TO PORTAL"}</span>
               {!isLoading && <ArrowRight className="w-4 h-4 relative z-10 group-hover/btn:translate-x-2 transition-transform" />}
            </button>
          </div>
        </form>
      </div>
    </motion.div>

      {/* FOOTER LINK MODULE */}
      <motion.div 
        variants={item}
        className="mt-12 p-8 bg-slate-50 rounded-[32px] border border-slate-100 flex flex-col items-center text-center gap-4"
      >
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Don&apos;t have an account?</p>
        <Link href="/signup" className="w-full">
           <button className="w-full py-4 bg-white border border-slate-200 text-blue-600 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all active:scale-95 flex items-center justify-center gap-3">
              Create New Account <Plus className="w-3 h-3" />
           </button>
        </Link>
      </motion.div>

      {/* SYSTEM TRUST BARS */}
      <motion.div 
        variants={item}
        className="mt-12 grid grid-cols-3 gap-4"
      >
        {[Shield, Command, Activity].map((Icon, i) => (
          <div key={i} className="flex flex-col items-center gap-2 opacity-20">
             <Icon className="w-5 h-5 text-slate-900" />
             <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
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
