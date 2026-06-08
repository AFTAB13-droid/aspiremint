"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { AddMediatorDrawer } from "@/components/admin/AddMediatorDrawer";
import { MediatorPortfolioDrawer } from "@/components/admin/MediatorPortfolioDrawer";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";

import { AliasManagerDrawer } from "@/components/admin/AliasManagerDrawer";

export default function AdminMediatorsHub() {
  const [mediators, setMediators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"REGISTRY" | "PENDING">("REGISTRY");
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isPortfolioDrawerOpen, setIsPortfolioDrawerOpen] = useState(false);
  const [isAliasDrawerOpen, setIsAliasDrawerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [mediatorToDelete, setMediatorToDelete] = useState<string | null>(null);
  const [editingMediator, setEditingMediator] = useState<any>(null);
  const [selectedMediator, setSelectedMediator] = useState<any>(null);
  const [isAutoAssignEnabled, setIsAutoAssignEnabled] = useState(true);

  const fetchGlobalSettings = async () => {
    try {
      const res = await fetch("/api/admin/config?key=global_admin_settings");
      const json = await res.json();
      if (json.success && json.data) {
        setIsAutoAssignEnabled(json.data.isAutoAssignEnabled);
      }
    } catch (err) {
      console.error("Settings fetch failed");
    }
  };

  useEffect(() => {
    fetchGlobalSettings();
  }, []);

  const toggleAutoAssign = async () => {
    const newVal = !isAutoAssignEnabled;
    setIsAutoAssignEnabled(newVal);
    try {
      await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "global_admin_settings",
          value: { isAutoAssignEnabled: newVal }
        })
      });
      toast.success(newVal ? "Auto-assignment optimized" : "Manual assignment mode active");
    } catch (err) {
      toast.error("Cloud sync failed");
      setIsAutoAssignEnabled(!newVal);
    }
  };

  const fetchMediators = async () => {
    try {
      setLoading(true);
      const isApprovedParam = activeTab === "REGISTRY" ? "true" : "false";
      const res = await fetch(`/api/users?role=MEDIATOR&isApproved=${isApprovedParam}`);
      const json = await res.json();
      if (json.success) setMediators(json.data);
    } catch (err) {
      toast.error("Failed to load mediators registry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMediators();
  }, [activeTab]);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: true })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Mediator approved and added to registry");
        fetchMediators();
      } else {
        toast.error(json.message || "Approval failed");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const filteredMediators = useMemo(() => {
    return mediators.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.aspireMintId || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [mediators, searchQuery]);

  const handleEdit = (med: any) => {
    setEditingMediator(med);
    setIsAddDrawerOpen(true);
  };

  const handleDelete = (med: any) => {
    if (med.activeDealsCount > 0) {
      toast.error(`He has ${med.activeDealsCount} global orders active, we can't delete him.`, {
        duration: 5000,
        style: {
          background: "#fff",
          color: "#ef4444",
          fontSize: "10px",
          fontWeight: "900",
          textTransform: "uppercase",
          letterSpacing: "1px",
          borderRadius: "16px",
          border: "2px solid #ef4444",
          padding: "16px"
        }
      });
      return;
    }
    setMediatorToDelete(med._id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!mediatorToDelete) return;
    try {
      const res = await fetch(`/api/users/${mediatorToDelete}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Specialist removed from registry");
        fetchMediators();
      } else {
        toast.error(json.message || "Removal failed");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsDeleteModalOpen(false);
      setMediatorToDelete(null);
    }
  };

  const handleViewPortfolio = (med: any) => {
    setSelectedMediator(med);
    setIsPortfolioDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-10 pb-20 mt-4">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4">
               <Skeleton className="h-4 w-32" />
               <Skeleton className="h-10 w-64" />
               <Skeleton className="h-4 w-full max-w-xl" />
            </div>
            <Skeleton className="h-12 w-48 rounded-2xl" />
         </div>
         <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1,2,3].map(i => (
               <Skeleton key={i} className="h-80 rounded-[40px]" />
            ))}
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-20 mt-4 overflow-x-hidden">
      {/* Optimized Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/50 rounded-[28px] border border-slate-100 shadow-sm self-start">
           {[
             { id: "REGISTRY", label: "Mediator Registry", count: mediators.length && activeTab === 'REGISTRY' ? mediators.length : null },
             { id: "PENDING", label: "Pending Requests", count: mediators.length && activeTab === 'PENDING' ? mediators.length : null }
           ].map((tab) => (
             <button 
               key={tab.id} 
               onClick={() => setActiveTab(tab.id as any)}
               className={`whitespace-nowrap flex items-center justify-center gap-3 px-8 py-3 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? "bg-white text-indigo-600 shadow-md border border-indigo-50" : "text-slate-400 hover:text-slate-600"}`}
             >
                {tab.label}
                {tab.count !== null && (
                  <span className={`px-2 py-0.5 rounded-full text-[8px] ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                    {tab.count}
                  </span>
                )}
             </button>
           ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
           {/* Auto-Assign Toggle */}
           <div className="h-14 px-6 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-6">
              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Auto-Assign</span>
                 <span className={`text-[10px] font-black uppercase tracking-tight ${isAutoAssignEnabled ? 'text-emerald-600' : 'text-amber-500'}`}>
                    {isAutoAssignEnabled ? 'Optimized' : 'Manual Only'}
                 </span>
              </div>
              <button 
                onClick={toggleAutoAssign}
                className={`w-12 h-6 rounded-full relative transition-all duration-300 ${isAutoAssignEnabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
              >
                 <motion.div 
                   animate={{ x: isAutoAssignEnabled ? 26 : 4 }}
                   className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                 />
              </button>
           </div>

           <motion.button 
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
             onClick={() => setIsAliasDrawerOpen(true)}
             className="h-14 px-8 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 flex items-center gap-3"
           >
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             Manage System Aliases
           </motion.button>

           <motion.button 
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
             onClick={() => { setEditingMediator(null); setIsAddDrawerOpen(true); }}
             className="h-14 px-8 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 flex items-center gap-3"
           >
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
             Register New Mediator
           </motion.button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-[32px] p-4 shadow-sm border border-slate-100 flex items-center gap-4">
         <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="SEARCH BY NAME, ID OR EMAIL..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-12 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-300"
            />
            <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
         </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
           key={activeTab}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -10 }}
           transition={{ duration: 0.2 }}
        >
          {filteredMediators.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="py-32 text-center border-2 border-dashed border-slate-100 rounded-[40px] bg-white group hover:border-indigo-100 transition-colors"
            >
               <div className="h-16 w-16 bg-indigo-50 rounded-3xl mx-auto flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
               </div>
               <p className="text-xs font-black text-slate-300 uppercase tracking-[0.4em]">No Mediators Found</p>
            </motion.div>
          ) : activeTab === 'PENDING' ? (
             <div className="bg-white border border-slate-100 rounded-[40px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="bg-slate-50/50">
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Mediator Name</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Contact Details</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {filteredMediators.map((med) => (
                            <tr key={med._id} className="group hover:bg-slate-50/50 transition-colors">
                               <td className="px-8 py-6">
                                  <div className="flex items-center gap-4">
                                     <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 font-bold text-xs uppercase">
                                        {(med.systemDisplayName || med.name).charAt(0)}
                                     </div>
                                     <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{med.systemDisplayName || med.name}</span>
                                  </div>
                               </td>
                               <td className="px-8 py-6">
                                  <div className="flex flex-col gap-1">
                                     <span className="text-[10px] font-bold text-slate-600 lowercase">{med.email}</span>
                                     <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{med.mobile}</span>
                                  </div>
                               </td>
                               <td className="px-8 py-6">
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-full border border-amber-100">
                                     <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                     <span className="text-[9px] font-black text-amber-600 uppercase tracking-tight">Pending Approval</span>
                                  </div>
                               </td>
                               <td className="px-8 py-6">
                                  <div className="flex items-center justify-end gap-2">
                                     <button 
                                       onClick={() => handleApprove(med._id)}
                                       className="h-10 px-6 rounded-xl bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-slate-900 transition-all active:scale-95"
                                     >
                                        Approve
                                     </button>
                                     <button 
                                       onClick={() => handleDelete(med)}
                                       className="h-10 w-10 rounded-xl bg-red-50 text-red-400 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all active:scale-95"
                                       title="Reject Application"
                                     >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                     </button>
                                  </div>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {filteredMediators.map((med) => (
                <motion.div
                  layout
                  key={med._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group relative overflow-hidden rounded-[40px] border border-slate-100 bg-white p-6 shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 flex flex-col justify-between min-h-[320px]"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-[80px] -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                  
                  <div>
                    <div className="relative flex items-center justify-between mb-8">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none truncate pr-4">{med.systemDisplayName || med.name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                           <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">{med.aspireMintId || 'MEDIATOR'}</span>
                           <span className="h-1 w-1 rounded-full bg-slate-200" />
                           <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">PRO-TIER</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <button onClick={() => handleDelete(med)} className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-600 hover:text-white transition-all shadow-sm" title="Delete Mediator">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                         </button>
                         <button onClick={() => handleEdit(med)} className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="Edit Mediator">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                         </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                       <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100/50">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Escrow Health</p>
                          <div className="flex items-end gap-1">
                             <span className="text-lg font-black text-slate-900 leading-none">{med.successRate || '100.0'}</span>
                             <span className="text-[10px] font-bold text-emerald-500 mb-0.5 leading-none">%</span>
                          </div>
                       </div>
                       <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100/50">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Active Deals</p>
                          <div className="flex items-end gap-1">
                             <span className="text-lg font-black text-slate-900 leading-none">{med.activeDealsCount || 0}</span>
                             <span className="text-[9px] font-bold text-indigo-500 mb-0.5 leading-none">QTY</span>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-3 mb-5">
                      <div className="flex items-center justify-between py-1 px-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verification</p>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                           <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                           <p className="text-[9px] font-black text-emerald-600 uppercase tracking-tight">Active Mediator</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-1 px-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Connect</p>
                        <p className="text-[10px] font-bold text-slate-600 lowercase truncate max-w-[150px]">{med.email}</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleViewPortfolio(med)}
                    className="w-full h-11 rounded-xl bg-white border-2 border-indigo-600 text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] shadow-lg shadow-indigo-50/50 hover:bg-indigo-600 hover:text-white transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
                  >
                     Portfolio View
                     <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <AddMediatorDrawer 
        isOpen={isAddDrawerOpen} 
        onClose={() => { setIsAddDrawerOpen(false); setEditingMediator(null); }} 
        onSuccess={fetchMediators}
        editData={editingMediator}
      />

      <MediatorPortfolioDrawer
        isOpen={isPortfolioDrawerOpen}
        onClose={() => setIsPortfolioDrawerOpen(false)}
        mediator={selectedMediator}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setMediatorToDelete(null); }}
        onConfirm={confirmDelete}
        title="Revoke Access"
        message="Are you sure you want to permanently delete this specialist? This action cannot be undone."
        confirmLabel="Delete Identity"
        isDanger={true}
      />

      <AliasManagerDrawer 
         isOpen={isAliasDrawerOpen}
         onClose={() => setIsAliasDrawerOpen(false)}
         mediators={mediators}
         onRefresh={fetchMediators}
      />
    </div>
  );
}
