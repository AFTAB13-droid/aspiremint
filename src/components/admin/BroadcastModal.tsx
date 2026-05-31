import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Megaphone } from "lucide-react";
import toast from "react-hot-toast";
import { CustomDropdown } from "../ui/CustomDropdown";

interface BroadcastModalProps {
  onClose: () => void;
}

export function BroadcastModal({ onClose }: BroadcastModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    target: "ALL_USERS",
    title: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to broadcast");

      toast.success(json.message);
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
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
         className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-8 border-b border-slate-100 bg-indigo-50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <Megaphone className="w-5 h-5 text-indigo-600" />
               <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Broadcast Center</h2>
            </div>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Send system-wide notifications instantly.</p>
          </div>
          <button onClick={onClose} className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Target Audience</label>
                <CustomDropdown 
                   options={["ALL_USERS", "ALL_MEDIATORS"]} 
                   value={formData.target} 
                   onChange={(val) => setFormData(prev => ({ ...prev, target: val }))} 
                   placeholder="Select Audience" 
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Message Title</label>
                <input 
                  type="text" 
                  required 
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="e.g. Platform Update, Important Notice"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Message Content</label>
                <textarea 
                  required 
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none custom-scrollbar"
                  placeholder="Enter your broadcast message here..."
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                 <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                 <>
                    <Send className="w-4 h-4" />
                    Dispatch Broadcast
                 </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
