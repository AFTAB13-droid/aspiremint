import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, Mail, Phone, KeyRound, User } from "lucide-react";
import toast from "react-hot-toast";
import { CustomDropdown } from "../ui/CustomDropdown";

interface StaffCreationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function StaffCreationModal({ onClose, onSuccess }: StaffCreationModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    role: "SUBADMIN",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/staff-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to create staff account");

      toast.success(json.message);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
         initial={{ opacity: 0 }} 
         animate={{ opacity: 1 }} 
         exit={{ opacity: 0 }} 
         className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
         onClick={onClose} 
      />
      <motion.div 
         initial={{ opacity: 0, scale: 0.95, y: 20 }}
         animate={{ opacity: 1, scale: 1, y: 0 }}
         exit={{ opacity: 0, scale: 0.95, y: 20 }}
         className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <ShieldCheck className="w-5 h-5 text-indigo-600" />
               <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Staff Creation</h2>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Create administrative or mediation accounts directly.</p>
          </div>
          <button onClick={onClose} className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm border border-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Account Role</label>
                <CustomDropdown 
                   options={["SUBADMIN", "MEDIATOR"]} 
                   value={formData.role} 
                   onChange={(val) => setFormData(prev => ({ ...prev, role: val }))} 
                   placeholder="Select Role" 
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    placeholder="e.g. Liam Smith"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" 
                    required 
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    placeholder="liam@aspiremint.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="tel" 
                    required 
                    value={formData.mobile}
                    onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                    className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Initial Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="password" 
                    required 
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    placeholder="Enter a secure password"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading ? (
                 <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                 <>
                    <ShieldCheck className="w-5 h-5" />
                    Create Staff
                 </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
