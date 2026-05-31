"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface AddMediatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: any;
}

export function AddMediatorDrawer({ isOpen, onClose, onSuccess, editData }: AddMediatorDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: editData?.name || "",
    email: editData?.email || "",
    mobile: editData?.mobile || "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editData ? `/api/users/${editData._id}` : "/api/auth/signup";
      const method = editData ? "PATCH" : "POST";
      
      const payload = { 
        ...formData, 
        role: "MEDIATOR",
        // Only include password if creating new or if specifically changed
        ...(editData && !formData.password ? { password: undefined } : {})
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(editData ? "Mediator updated" : "Mediator registered");
        onSuccess();
        onClose();
      } else {
        toast.error(json.message || "Operation failed");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-indigo-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[101] max-h-[90vh] overflow-y-auto bg-white rounded-t-[40px] shadow-2xl border-t border-slate-100 p-8 md:p-12"
          >
            <div className="max-w-xl mx-auto">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-black text-indigo-600 uppercase tracking-tight">
                    {editData ? "Edit Specialist" : "Add Specialist"}
                  </h2>
                  <p className="text-slate-500 font-medium text-sm mt-1">
                    {editData ? "Refine credential oversight." : "Onboard a new professional mediator."}
                  </p>
                </div>
                <button onClick={onClose} className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-400 hover:bg-indigo-100 transition-all">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Full Legal Identity</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="E.G. ALEX STEVENS"
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-bold uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-50 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="MEDIATOR@ASPIREMINT"
                      className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-bold tracking-widest outline-none focus:ring-4 focus:ring-indigo-50 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Mobile Contact</label>
                    <input
                      type="tel"
                      required
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-bold tracking-widest outline-none focus:ring-4 focus:ring-indigo-50 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                    {editData ? "Update Encryption Pass" : "Security Password"}
                  </label>
                  <input
                    type="password"
                    required={!editData}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-bold tracking-widest outline-none focus:ring-4 focus:ring-indigo-50 focus:bg-white transition-all"
                  />
                </div>

                <div className="pt-6">
                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full h-16 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      editData ? "Update credentials" : "Confirm registration"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
