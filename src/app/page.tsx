"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    if (session?.user) {
      router.replace("/app");
    } else {
      router.replace("/app/review-finder");
    }
  }, [session, status, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0B0F19]">
      <div className="text-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="mx-auto h-12 w-12 rounded-2xl border-4 border-blue-600 border-t-transparent shadow-xl shadow-blue-500/20"
        />
        <h1 className="mt-8 text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">AspireMint</h1>
        <p className="mt-2 text-sm font-bold text-slate-400 uppercase tracking-widest">Entering Gateway...</p>
      </div>
    </div>
  );
}
