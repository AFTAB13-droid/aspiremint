"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import formatDate from "@/utils/formatDate";
import { Button } from "@/components/ui/Button";

type Tab = 'ACTIVE' | 'RESOLVED';

export default function AdminSupportPage() {
  const { data: session } = useSession();
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [confModal, setConfModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'success' | 'info';
    confirmText: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    variant: 'info',
    confirmText: "Confirm"
  });

  useEffect(() => {
    fetchQueries();
    const interval = setInterval(fetchQueries, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueries = async () => {
    try {
      const res = await fetch("/api/support");
      const json = await res.json();
      if (json.success) setQueries(json.data);
    } catch (err) {
      toast.error("Failed to load queries");
    } finally {
      setLoading(false);
    }
  };

  const [sendingQueries, setSendingQueries] = useState<Record<string, boolean>>({});
  const [resolvingQueries, setResolvingQueries] = useState<Record<string, boolean>>({});

  const activeQueries = queries.filter(q => q.status === 'OPEN');
  const resolvedQueries = queries.filter(q => q.status === 'CLOSED' || q.status === 'RESOLVED');

  const filteredItems = (activeTab === 'ACTIVE' ? activeQueries : resolvedQueries).filter(q => 
    q.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.order?.aspireOrderId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedTicket = queries.find(q => q._id === selectedTicketId);

  const handleReply = async (queryId: string, text: string) => {
    if (!text.trim() || sendingQueries[queryId]) return;
    
    setSendingQueries(prev => ({ ...prev, [queryId]: true }));
    
    const optimisticMessage = {
      sender: session?.user?.id,
      senderRole: 'ADMIN',
      text: text,
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };

    setQueries(prev => prev.map(q => 
      q._id === queryId 
        ? { ...q, messages: [...(q.messages || []), optimisticMessage] }
        : q
    ));

    try {
      const res = await fetch(`/api/support/${queryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, senderRole: 'ADMIN' })
      });
      const json = await res.json();
      if (json.success) {
        setQueries(prev => prev.map(q => 
          q._id === queryId 
            ? { ...q, messages: json.data.messages } // Only update messages to avoid Context Card refresh
            : q
        ));
      } else {
        toast.error(json.message);
        fetchQueries();
      }
    } catch (err) {
      toast.error("Reply failed");
      fetchQueries();
    } finally {
      setSendingQueries(prev => ({ ...prev, [queryId]: false }));
    }
  };

  const handleResolve = async (queryId: string) => {
    if (resolvingQueries[queryId]) return;
    
    setResolvingQueries(prev => ({ ...prev, [queryId]: true }));
    setConfModal(prev => ({ ...prev, isOpen: false }));

    // Turbo Faster: Optimistic Update
    const originalQueries = [...queries];
    setQueries(prev => prev.map(q => q._id === queryId ? { ...q, status: 'CLOSED' } : q));
    if (selectedTicketId === queryId) setSelectedTicketId(null);
    toast.success("Ticket Resolved");

    try {
      const res = await fetch(`/api/support/${queryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: 'CLOSED' })
      });
      if (!res.ok) throw new Error("Failed to resolve");
      await fetchQueries();
    } catch (err) {
      setQueries(originalQueries); // Rollback
      toast.error("Action failed");
    } finally {
      setResolvingQueries(prev => ({ ...prev, [queryId]: false }));
    }
  };

  const handleDelete = async (queryId: string) => {
    setConfModal(prev => ({ ...prev, isOpen: false }));
    
    // Turbo Faster: Optimistic Update
    const originalQueries = [...queries];
    setQueries(prev => prev.filter(q => q._id !== queryId));
    if (selectedTicketId === queryId) setSelectedTicketId(null);
    toast.success("Deleted Permanently");

    try {
      const res = await fetch(`/api/support/${queryId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Delete failed");
      fetchQueries();
    } catch (err) { 
      setQueries(originalQueries); // Rollback
      toast.error("Delete failed"); 
    }
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      
      {/* Fixed Top Navigation */}
      <div className="flex-shrink-0 bg-white border-b border-slate-100 shadow-sm px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4 z-30">
        <div className="flex items-center gap-4">
           <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
           </div>
           <div>
             <h1 className="text-sm font-black text-slate-900 uppercase tracking-tight italic leading-none mb-1">Admin Support Hub</h1>
             <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Inquiries & System Support</p>
           </div>
        </div>

        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl shadow-inner flex-1 md:flex-none">
            <button 
              onClick={() => { setActiveTab('ACTIVE'); setSelectedTicketId(null); }}
              className={`px-6 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'ACTIVE' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              PENDING ({activeQueries.length})
            </button>
            <button 
              onClick={() => { setActiveTab('RESOLVED'); setSelectedTicketId(null); }}
              className={`px-6 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'RESOLVED' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              RESOLVED ({resolvedQueries.length})
            </button>
          </div>

          <div className="relative flex-1 hidden md:block">
            <input 
              type="text" 
              placeholder="SEARCH BY USER, SUBJECT OR ORDER..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-5 pr-5 text-[9px] font-black uppercase tracking-widest outline-none focus:bg-white focus:ring-8 focus:ring-indigo-600/5 transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto custom-scrollbar px-4 py-6">
           <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
            </div>
          ) : selectedTicketId && selectedTicket ? (
            /* Admin Chat View */
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[75vh] border border-slate-100 max-w-5xl mx-auto"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedTicketId(null)} className="h-9 w-9 flex items-center justify-center bg-white rounded-lg shadow-sm border border-slate-100 text-slate-400 hover:text-slate-900 transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div>
                    <p className="text-[12px] font-black text-slate-900 uppercase truncate max-w-[300px] leading-tight mb-1">{selectedTicket.subject}</p>
                    <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest leading-none">{selectedTicket.user?.name} ({selectedTicket.user?.email})</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                   {selectedTicket.user?.mobile && (
                     <a 
                       href={`https://wa.me/${selectedTicket.user.mobile.replace(/\D/g, '')}`} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"
                     >
                       <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                       Contact WhatsApp
                     </a>
                   )}
                   <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-widest shadow-sm">{selectedTicket.type === 'ORDER_DISPUTE' ? 'ORDER QUERY' : 'GENERAL QUERY'}</span>
                </div>
              </div>

              <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar flex flex-col bg-slate-50/50">
                {/* Admin Context Banner */}
                <div className="flex-shrink-0 bg-slate-900 rounded-2xl p-5 shadow-xl mb-2 border border-white/5 relative overflow-hidden">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                      <div>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Requester Information</p>
                        <p className="text-[11px] font-black text-white uppercase truncate">{selectedTicket.user?.name}</p>
                        <p className="text-[9px] font-black text-sky-400 font-mono mt-0.5">{selectedTicket.user?.aspireMintId || 'NO_ID'}</p>
                      </div>
                      
                      {selectedTicket.order ? (
                        <div>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Related Order</p>
                          <p className="text-[11px] font-black text-slate-200 uppercase truncate">{selectedTicket.order?.brandName}</p>
                          <p className="text-[9px] font-black text-emerald-400 uppercase font-mono mt-0.5">#{selectedTicket.order?.aspireOrderId}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Channel Type</p>
                          <p className="text-[11px] font-black text-indigo-400 uppercase">DIRECT ADMIN QUERY</p>
                        </div>
                      )}

                      <div>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Opened At</p>
                        <p className="text-[11px] font-black text-slate-200 uppercase truncate">{formatDate(selectedTicket.createdAt)}</p>
                      </div>
                   </div>
                </div>

                {selectedTicket.messages?.map((msg: any, idx: number) => (
                  <div key={idx} className={`flex flex-col ${msg.senderRole === 'ADMIN' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-[13px] font-bold leading-relaxed ${msg.senderRole === 'ADMIN' ? 'bg-slate-900 text-white rounded-tr-sm' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-sm'}`}>
                      {msg.text}
                      {idx === 0 && selectedTicket.screenshot && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-slate-100 shadow-sm cursor-pointer" onClick={() => window.open(selectedTicket.screenshot, "_blank")}>
                           <img src={selectedTicket.screenshot} className="w-full max-h-48 object-cover" alt="Verification" />
                        </div>
                      )}
                    </div>
                    <span className="text-[7px] font-black text-slate-400 mt-1 uppercase px-2">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-white border-t border-slate-100">
                <form 
                  onSubmit={(e: any) => {
                    e.preventDefault();
                    handleReply(selectedTicket._id, e.target.reply.value);
                    e.target.reset();
                  }}
                  className="flex items-center gap-3 bg-slate-900 p-2 rounded-2xl shadow-xl"
                >
                    <input 
                      name="reply"
                      placeholder="Reply as Administrator..."
                      className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-black text-white placeholder:text-slate-600 placeholder:text-[8px] placeholder:tracking-widest"
                      autoComplete="off"
                      disabled={sendingQueries[selectedTicket._id]}
                    />
                  <button type="submit" disabled={sendingQueries[selectedTicket._id]} className="h-12 w-12 flex items-center justify-center bg-indigo-600 text-white rounded-xl shadow-lg active:scale-95 transition-all">
                     {sendingQueries[selectedTicket._id] ? <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <svg className="w-5 h-5 rotate-45 transform -translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
                  </button>
                </form>
                <div className="mt-4 flex justify-center">
                  {selectedTicket.type === 'GENERAL_QUERY' ? (
                    <button 
                      onClick={() => setConfModal({
                        isOpen: true,
                        title: "Resolve Ticket",
                        message: "Are you sure you want to resolve and close this support thread? This action will notify the user.",
                        onConfirm: () => handleResolve(selectedTicket._id),
                        variant: 'success',
                        confirmText: "Resolve Now"
                      })} 
                      disabled={resolvingQueries[selectedTicket._id]} 
                      className="px-8 py-2.5 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"
                    >
                      RESOLVE TICKET
                    </button>
                  ) : (
                    <div className="px-6 py-3 bg-slate-100 rounded-xl border border-slate-200">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Monitoring Mode: Order Queries are handled by Mediators</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            /* Admin List View */
            <motion.div layout className="grid grid-cols-1 gap-3">
              {filteredItems.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-slate-100">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No inquiries found</p>
                </div>
              ) : (
                filteredItems.map((q) => (
                  <motion.div 
                    layout
                    key={q._id}
                    onClick={() => activeTab === 'ACTIVE' && setSelectedTicketId(q._id)}
                    className={`bg-white rounded-2xl border border-slate-100 shadow-sm relative group overflow-hidden transition-all duration-300 flex items-center p-4 hover:shadow-xl hover:border-indigo-100 ${activeTab === 'ACTIVE' ? 'cursor-pointer hover:bg-indigo-50/10' : ''}`}
                  >
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-white shadow-md flex-shrink-0 ${q.type === 'GENERAL_QUERY' ? 'bg-indigo-600' : 'bg-slate-400'}`}>
                       <span className="font-black uppercase text-xs">{q.user?.name?.charAt(0) || 'U'}</span>
                    </div>

                    <div className="ml-4 flex-1 min-w-0">
                       <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[11px] font-black text-slate-900 uppercase truncate leading-none">{q.subject}</p>
                          {q.type === 'ORDER_DISPUTE' && (
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 bg-sky-500 text-white rounded text-[7px] font-black uppercase tracking-widest shadow-sm">ORDER QUERY</span>
                              {q.mediator?.name && (
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded text-[7px] font-black uppercase tracking-widest">HANDLER: {q.mediator.name}</span>
                              )}
                            </div>
                          )}
                       </div>
                       <p className="text-[8px] font-black text-slate-400 uppercase truncate tracking-wider">{q.user?.name} • {q.type === 'GENERAL_QUERY' ? 'GENERAL SUPPORT' : q.order?.brandName}</p>
                    </div>

                    <div className="ml-4 text-right flex-shrink-0">
                       {activeTab === 'RESOLVED' ? (
                         <div className="flex items-center gap-3">
                            <span className="text-[8px] font-black text-slate-300 uppercase italic">{formatDate(q.updatedAt)}</span>
                             <button 
                               onClick={(e) => { 
                                 e.stopPropagation(); 
                                 setConfModal({
                                   isOpen: true,
                                   title: "Delete Thread",
                                   message: "This action is permanent. Are you sure you want to delete this support channel and all its history?",
                                   onConfirm: () => handleDelete(q._id),
                                   variant: 'danger',
                                   confirmText: "Delete Permanently"
                                 });
                               }} 
                               className="h-8 w-8 flex items-center justify-center bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"
                             >
                               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                             </button>
                         </div>
                       ) : (
                         <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 bg-indigo-600 rounded-full animate-pulse" />
                            <svg className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                         </div>
                       )}
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
     </div>
      <ConfirmationModal 
        isOpen={confModal.isOpen}
        onClose={() => setConfModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confModal.onConfirm}
        title={confModal.title}
        message={confModal.message}
        confirmText={confModal.confirmText}
        variant={confModal.variant}
        isLoading={resolvingQueries[selectedTicketId || '']}
      />
    </div>
   </div>
  );
}
