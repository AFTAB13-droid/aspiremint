"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect to login
    router.push("/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="mx-auto h-12 w-12 rounded-2xl border-4 border-blue-600 border-t-transparent shadow-xl shadow-blue-500/20"
        />
        <h1 className="mt-8 text-2xl font-black tracking-tight text-slate-900 uppercase">AspireMint</h1>
        <p className="mt-2 text-sm font-bold text-slate-400 uppercase tracking-widest">Entering Secure Gateway...</p>
      </div>
    </div>
  );
}
