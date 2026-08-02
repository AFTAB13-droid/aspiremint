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
      router.replace("/app");
    }
  }, [status, router]);

  return (
    <div className={`flex min-h-[100dvh] w-full relative overflow-hidden ${outfit.className} antialiased`}>
      
      {/* DESKTOP BACKGROUND (Sky & Clouds) */}
      <div className="absolute inset-0 hidden lg:block overflow-hidden z-0">
         {/* Sky Background Image */}
         <div 
           className="absolute inset-0 bg-cover bg-center bg-no-repeat"
           style={{ backgroundImage: "url('https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=2560&q=80')" }}
         />
         {/* Light overlay to match the soft look */}
         <div className="absolute inset-0 bg-white/20" />
         
         {/* Concentric Arcs / Rings */}
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
            <div className="w-[600px] h-[600px] rounded-full border-[1.5px] border-white/70 absolute" />
            <div className="w-[1000px] h-[1000px] rounded-full border-[1.5px] border-white/50 absolute" />
            <div className="w-[1400px] h-[1400px] rounded-full border-[1.5px] border-white/30 absolute" />
            <div className="w-[1800px] h-[1800px] rounded-full border-[1.5px] border-white/10 absolute" />
         </div>

         {/* Left Side Ads / High Tech Stats */}
         <div className="absolute top-0 bottom-0 left-0 w-[25%] p-12 flex flex-col justify-between z-10">
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="space-y-6"
            >
               <div className="h-20 w-20 bg-blue-600 rounded-[32px] shadow-[0_20px_40px_rgba(37,99,235,0.3)] flex items-center justify-center border border-blue-400/50">
                  <Logo size={48} variant="white" />
               </div>
               <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-blue-50 border border-blue-100 rounded-full shadow-sm">
                  <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">ASPIREMINT CORE</span>
               </div>
            </motion.div>
            
            <div className="space-y-6">
               <h2 className="text-6xl 2xl:text-7xl font-black leading-[0.9] tracking-tighter text-slate-900">
                  CREATE<br/>TRANSACT<br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">& EARN.</span>
               </h2>
               <p className="text-slate-500 text-xs 2xl:text-sm font-bold max-w-xs leading-relaxed">
                  Manage your deals with high-authority precision and maximize your earnings through our global command infrastructure.
               </p>
            </div>
         </div>

         {/* Right Side Ads / High Tech Animations */}
         <div className="absolute top-0 bottom-0 right-0 w-[25%] p-12 flex flex-col justify-between items-end text-right z-10">
            <motion.div 
               animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
               transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
               className="h-32 w-32 2xl:h-40 2xl:w-40 rounded-[32px] 2xl:rounded-[40px] bg-white backdrop-blur-xl border border-blue-100 shadow-[0_20px_40px_rgba(37,99,235,0.1)] flex items-center justify-center relative overflow-hidden group"
            >
               <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               <Logo size={70} variant="blue" className="opacity-80 group-hover:scale-110 transition-transform duration-500" />
            </motion.div>
            
            <div className="space-y-10 flex flex-col items-end">
               <div className="space-y-1 text-right">
                  <p className="text-4xl 2xl:text-5xl font-black text-slate-900">99.9%</p>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Global Uptime</p>
               </div>
               <div className="space-y-1 text-right">
                  <p className="text-4xl 2xl:text-5xl font-black text-slate-900">256-bit</p>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Encrypted Flow</p>
               </div>
               <div className="h-px w-24 bg-slate-200 mt-4" />
               <div className="flex items-center gap-3 opacity-50">
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">Architecture v4.5</span>
               </div>
            </div>
         </div>
      </div>

      {/* MOBILE BACKGROUND */}
      <div className="absolute inset-0 block lg:hidden pointer-events-none z-0">
         <div 
           className="absolute inset-0 bg-cover bg-center bg-no-repeat"
           style={{ backgroundImage: "url('https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1080&q=80')" }}
         />
         <div className="absolute inset-0 bg-white/30" />
         
         {/* Concentric Arcs / Rings for mobile */}
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
            <div className="w-[300px] h-[300px] rounded-full border-[1.5px] border-white/70 absolute" />
            <div className="w-[600px] h-[600px] rounded-full border-[1.5px] border-white/50 absolute" />
         </div>
      </div>

      {/* CENTER FORM SIDE - Middle on Desktop, Full on Mobile */}
      <div className="flex w-full flex-col justify-center px-6 lg:w-[600px] xl:w-[700px] 2xl:w-[800px] lg:mx-auto relative z-20 min-h-[100dvh]">
         {/* Mobile Edge Decorations */}
         <div className="lg:hidden absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600" />
         
         <div className="relative z-10 w-full max-w-md lg:max-w-none mx-auto py-12 lg:py-8 lg:px-4">
           {children}
         </div>

         {/* Footer Support - App Style */}
         <div className="mt-auto py-4 lg:py-6 text-center border-t border-slate-100 lg:border-none">
            <div className="flex items-center justify-center gap-6">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 cursor-pointer transition-colors">Security</span>
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 cursor-pointer transition-colors">Privacy</span>
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 cursor-pointer transition-colors">Support</span>
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
