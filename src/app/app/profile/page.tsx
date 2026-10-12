"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/app/settings?tab=profile");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-[#0B101D]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
          Loading Profile Settings...
        </p>
      </div>
    </div>
  );
}
