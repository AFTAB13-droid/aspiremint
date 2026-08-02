"use client";

import React, { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Outfit } from "next/font/google";

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
      
      {/* DESKTOP BACKGROUND */}
      <div className="absolute inset-0 hidden lg:block overflow-hidden z-0">
         {/* Sky Background Image */}
         <div 
           className="absolute inset-0 bg-cover bg-center bg-no-repeat"
           style={{ backgroundImage: "url('/back.png')" }}
         />
         {/* Light overlay to match the soft look */}
         <div className="absolute inset-0 bg-white/20" />
      </div>

      {/* MOBILE BACKGROUND */}
      <div className="absolute inset-0 block lg:hidden pointer-events-none z-0">
         <div 
           className="absolute inset-0 bg-cover bg-center bg-no-repeat"
           style={{ backgroundImage: "url('/back.png')" }}
         />
         <div className="absolute inset-0 bg-white/30" />
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
