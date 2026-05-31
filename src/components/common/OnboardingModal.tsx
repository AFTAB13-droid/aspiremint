"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export const OnboardingModal = () => {
  const { data: session, update } = useSession();
  
  const role = session?.user?.role || "USER";
  const isAdm = role === "ADMIN";

  // Only render if the user exists, is not an admin, and their profile is not complete
  const showModal = session?.user && !isAdm && session?.user?.isProfileComplete === false;
  
  const [loading, setLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  // Persistence: Check if dismissed in this session
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = sessionStorage.getItem("onboarding_dismissed");
      if (dismissed === "true") setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("onboarding_dismissed", "true");
    }
  };

  const [verifyingIFSC, setVerifyingIFSC] = useState(false);
  const [formData, setFormData] = useState({
    upiId: "",
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    ifscCode: "",
    branchName: "",
    bankDetails: "" // Legacy backup
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const verifyIFSC = async () => {
    if (!formData.ifscCode || formData.ifscCode.length < 11) {
      toast.error("Invalid IFSC format");
      return;
    }

    setVerifyingIFSC(true);
    try {
      const res = await fetch(`https://ifsc.razorpay.com/${formData.ifscCode}`);
      if (!res.ok) throw new Error("Invalid IFSC");
      
      const data = await res.json();
      setFormData(prev => ({
        ...prev,
        bankName: data.BANK,
        branchName: `${data.BRANCH} (${data.CITY})`
      }));
      toast.success("Bank Verified!");
    } catch (err) {
      toast.error("IFSC check failed");
    } finally {
      setVerifyingIFSC(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const resp = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.message || "Something went wrong");
      }
      
      toast.success("Profile Setup Complete!");
      // Force session update here to drop the modal
      await update({ isProfileComplete: true });
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!showModal || isDismissed) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md overflow-y-auto text-slate-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative w-full max-w-lg overflow-hidden rounded-[32px] bg-white shadow-2xl my-8"
        >
          {/* Close Button */}
          <button 
             onClick={handleDismiss} 
             className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/10 text-white hover:bg-black/20 transition-all opacity-70 hover:opacity-100"
          >
             <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
          </button>

          {/* Header */}
          <div className={`h-28 w-full p-6 text-white relative flex flex-col justify-end ${isAdm ? "bg-indigo-600" : "bg-blue-600"}`}>
             <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full bg-white/10 blur-2xl"></div>
             <h2 className="relative z-10 text-xl font-black tracking-tight uppercase">Complete Profile</h2>
             <p className="relative z-10 text-[10px] uppercase font-bold tracking-widest opacity-80 mt-1">Payment Endpoint Setup</p>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-4">
                {/* UPI Section */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">UPI Identifier (Primary) <span className="text-red-500">*</span></label>
                  <input
                    name="upiId" type="text" required value={formData.upiId} onChange={handleChange} placeholder="phone@upi"
                    className="block w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>

                {/* Bank Section */}
                <div className="pt-4 border-t border-slate-50">
                   <div className="mb-4 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Direct Bank Settlement (Optional)</span>
                      <span className="text-[9px] font-bold text-slate-300">WIRE TRANSFER</span>
                   </div>

                   <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-[9px] font-black uppercase text-slate-400">Account Holder Name</label>
                        <input
                          name="accountHolder" type="text" value={formData.accountHolder} onChange={handleChange} placeholder="As per bank records"
                          className="block w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[9px] font-black uppercase text-slate-400">Account Number</label>
                        <input
                          name="accountNumber" type="text" value={formData.accountNumber} onChange={handleChange} placeholder="10-18 Digits"
                          className="block w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[9px] font-black uppercase text-slate-400">IFSC Code</label>
                        <div className="flex gap-2">
                           <input
                             name="ifscCode" type="text" value={formData.ifscCode} onChange={handleChange} placeholder="SBIN..."
                             className="block w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs font-black text-slate-900 uppercase focus:bg-white focus:ring-4 focus:ring-blue-50"
                           />
                           <button type="button" onClick={verifyIFSC} disabled={verifyingIFSC} className="px-3 py-2 bg-slate-900 text-[10px] font-black text-white uppercase rounded-xl hover:bg-black active:scale-95 disabled:opacity-50">
                              {verifyingIFSC ? "..." : "Verify"}
                           </button>
                        </div>
                      </div>

                      {formData.bankName && (
                        <div className="sm:col-span-2 rounded-xl bg-emerald-50 p-3 flex items-center gap-3">
                           <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                           <div>
                              <p className="text-[10px] font-black text-emerald-800 uppercase leading-none">{formData.bankName}</p>
                              <p className="text-[9px] font-bold text-emerald-600 mt-1 uppercase leading-none">{formData.branchName}</p>
                           </div>
                        </div>
                      )}
                   </div>
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-4 text-sm font-black text-white shadow-xl shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-70"
                  >
                    {loading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      "Complete Profile Setup"
                    )}
                  </button>
                  <p className="mt-4 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">Ensured by AspireMint Escrow Protection</p>
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
