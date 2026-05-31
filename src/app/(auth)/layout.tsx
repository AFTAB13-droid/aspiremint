"use client";

import React, { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Outfit } from "next/font/google";
import { Logo } from "@/components/common/Logo";

const outfit = Outfit({ subsets: ["latin"] });

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [isLargeScreen, setIsLargeScreen] = React.useState(false);

  useEffect(() => {
    const checkScreen = () => setIsLargeScreen(window.innerWidth >= 1024);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  return (
    <div className={`flex min-h-[100dvh] w-full bg-slate-50 relative overflow-hidden ${outfit.className} antialiased`}>
      {/* BACKGROUND AESTHETICS - Shared across both sides */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {isLargeScreen ? (
          <>
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-100 rounded-full blur-[120px] mix-blend-multiply"
            />
            <motion.div 
              animate={{ 
                scale: [1, 1.3, 1],
                rotate: [0, -90, 0],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-[10%] -right-[5%] w-[50%] h-[50%] bg-indigo-100 rounded-full blur-[100px] mix-blend-multiply"
            />
          </>
        ) : (
          <>
            <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-100 rounded-full blur-[120px] opacity-40 mix-blend-multiply" />
            <div className="absolute -bottom-[10%] -right-[5%] w-[50%] h-[50%] bg-indigo-100 rounded-full blur-[100px] opacity-30 mix-blend-multiply" />
          </>
        )}
      </div>

      {/* LEFT VISUAL SIDE - Desktop Only */}
      <div className="relative hidden w-1/2 overflow-hidden bg-slate-900 lg:block shadow-[20px_0_60px_rgba(0,0,0,0.1)]">
        {/* Abstract Tech Patterns */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        </div>

        <motion.div 
          animate={{
            background: [
              "linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1e1b4b 100%)",
              "linear-gradient(135deg, #1e40af 0%, #1e1b4b 50%, #171717 100%)",
              "linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1e1b4b 100%)"
            ]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0"
        />
        
        {/* Floating Glassmorphism Geometric Elements with LOGOS */}
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: 45 }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[15%] left-[20%] h-32 w-32 rounded-[32px] bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl flex items-center justify-center overflow-hidden group"
        >
           <motion.div animate={{ rotate: -45 }} className="opacity-40 group-hover:opacity-100 transition-opacity">
              <Logo size={60} variant="white" />
           </motion.div>
        </motion.div>

        <motion.div 
          animate={{ y: [0, 30, 0], rotate: -15 }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[20%] right-[15%] h-48 w-48 rounded-[48px] bg-blue-500/10 backdrop-blur-2xl border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden group"
        >
           <motion.div animate={{ rotate: 15 }} className="opacity-30 group-hover:opacity-100 transition-opacity">
              <Logo size={100} variant="white" />
           </motion.div>
        </motion.div>
        
        {/* Core Branding Content */}
        <div className="relative flex h-full flex-col items-start justify-center p-24 z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-full backdrop-blur-xl shadow-inner">
               <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-200">ASPIREMINT CORE</span>
            </div>
            
            <h2 className="text-7xl font-black leading-[0.9] tracking-tighter text-white">
              CREATE<br/>
              TRANSACT<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-white">& EARN.</span>
            </h2>
            
            <p className="text-blue-100/60 text-xl max-w-md font-medium leading-relaxed tracking-tight">
              Manage your deals with high-authority precision and maximize your earnings through our global command infrastructure.
            </p>

            <div className="pt-12 grid grid-cols-2 gap-8 border-t border-white/5">
               <div className="space-y-1">
                  <p className="text-3xl font-black text-white">99.9%</p>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Global Uptime</p>
               </div>
               <div className="space-y-1">
                  <p className="text-3xl font-black text-white">256-bit</p>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Encrypted Flow</p>
               </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Attribution */}
        <div className="absolute bottom-12 left-24 flex items-center gap-4 text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">
           <span>Core v4.5</span>
           <div className="h-px w-12 bg-white/10" />
           <span>AspireMint Architecture</span>
        </div>
      </div>

      {/* RIGHT FORM SIDE - Responsive / App-like on Mobile */}
      <div className="flex w-full flex-col justify-center px-6 lg:w-1/2 lg:px-24 xl:px-32 relative z-10 min-h-[100dvh]">
        
        {/* Mobile Edge Decorations */}
        <div className="lg:hidden absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600" />
        
        <div className="relative z-10 w-full max-w-md lg:max-w-3xl mx-auto py-12 lg:py-0">
          {children}
        </div>

        {/* Footer Support - App Style */}
        <div className="mt-auto py-4 lg:py-8 text-center border-t border-slate-100 lg:border-none">
           <div className="flex items-center justify-center gap-6">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-blue-600 cursor-pointer transition-colors">Security</span>
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-blue-600 cursor-pointer transition-colors">Privacy</span>
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-blue-600 cursor-pointer transition-colors">Support</span>
           </div>
        </div>
      </div>

      <Toaster 
        position="top-right" 
        toastOptions={{
          className: 'rounded-2xl shadow-3xl border border-white/50 backdrop-blur-xl',
          style: { 
            padding: '20px', 
            color: '#1e293b',
            fontSize: '13px',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          },
        }} 
      />
    </div>
  );
}
