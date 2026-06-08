"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface AliasManagerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mediators: any[];
  onRefresh: () => void;
}

export function AliasManagerDrawer({ isOpen, onClose, mediators, onRefresh }: AliasManagerDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [aliasInputs, setAliasInputs] = useState<Record<string, string>>({});

  const filteredMediators = useMemo(() => {
    return mediators.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.systemDisplayName || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [mediators, searchQuery]);

  const handleAliasChange = (id: string, value: string) => {
    setAliasInputs(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveAlias = async (id: string) => {
    setUpdatingId(id);
    try {
      const systemDisplayName = aliasInputs[id] !== undefined ? aliasInputs[id] : mediators.find(m => m._id === id)?.systemDisplayName || "";
      
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemDisplayName })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("System Username Saved!");
        onRefresh();
      } else {
        toast.error(json.message || "Failed to save alias");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setUpdatingId(null);
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
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-[101] w-full max-w-2xl bg-slate-50 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-white p-8 border-b border-slate-100 relative">
               <button onClick={onClose} className="absolute right-8 top-8 h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>

               <div className="flex flex-col">
                  <div>
                     <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Alias Manager</h2>
                     </div>
                     <p className="text-slate-500 font-medium text-sm mt-1">Assign system display names directly to your specialists.</p>
                  </div>
               </div>

               {/* Search Box */}
               <div className="mt-6 relative">
                  <input 
                    type="text" 
                    placeholder="SEARCH SPECIALISTS..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-12 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-300"
                  />
                  <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              {filteredMediators.length === 0 ? (
                <div className="bg-white rounded-[32px] py-12 text-center border-2 border-dashed border-slate-100">
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No specialists found</p>
                </div>
              ) : (
                filteredMediators.map((med) => {
                  const currentInputVal = aliasInputs[med._id] !== undefined ? aliasInputs[med._id] : (med.systemDisplayName || "");
                  return (
                    <div key={med._id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col gap-4">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
                               {(med.systemDisplayName || med.name).charAt(0)}
                            </div>
                            <div className="flex flex-col">
                               <span className="text-[12px] font-black text-slate-900 uppercase tracking-tight">{med.name}</span>
                               <span className="text-[9px] font-bold text-slate-400 uppercase">{med.email}</span>
                            </div>
                         </div>
                       </div>
                       
                       <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                         <input 
                            type="text" 
                            placeholder="NO SYSTEM ALIAS ASSIGNED" 
                            value={currentInputVal}
                            onChange={(e) => handleAliasChange(med._id, e.target.value)}
                            className="flex-1 h-10 bg-transparent px-4 text-[10px] font-black uppercase tracking-widest outline-none placeholder:text-slate-300"
                         />
                         <button 
                            onClick={() => handleSaveAlias(med._id)}
                            disabled={updatingId === med._id}
                            className={`h-10 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${updatingId === med._id ? 'bg-slate-200 text-slate-400' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700'}`}
                         >
                            {updatingId === med._id ? "Saving..." : "Save Alias"}
                         </button>
                       </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
