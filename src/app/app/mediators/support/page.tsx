"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import formatDate from "@/utils/formatDate";

type Tab = 'ACTIVE' | 'RESOLVED';

export default function MediatorSupportPage() {
  const { data: session } = useSession();
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
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

  const [sendingQueries, setSendingQueries] = useState<Record<string, boolean>>({});
  const [resolvingQueries, setResolvingQueries] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchQueries();
    const interval = setInterval(fetchQueries, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeQueries = queries.filter(q => q.status === 'OPEN');
  const resolvedQueries = queries.filter(q => q.status === 'CLOSED' || q.status === 'RESOLVED');
  const selectedTicket = queries.find(q => q._id === selectedTicketId);

  const prevMessageCount = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!selectedTicketId || !selectedTicket) return;
    const currentCount = selectedTicket.messages?.length || 0;
    const prevCount = prevMessageCount.current[selectedTicketId] || 0;
    if (currentCount > prevCount || !prevMessageCount.current.hasOwnProperty(selectedTicketId)) {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }
    prevMessageCount.current[selectedTicketId] = currentCount;
  }, [selectedTicketId, selectedTicket?.messages?.length]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth > 1024) {
      if (activeTab === 'ACTIVE' && queries.length > 0 && !selectedTicketId) {
        const activeOnly = queries.filter(q => q.status === 'OPEN');
        if (activeOnly.length > 0) setSelectedTicketId(activeOnly[0]._id);
      }
    }
  }, [queries, activeTab, selectedTicketId]);

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

  const filteredItems = (activeTab === 'ACTIVE' ? activeQueries : resolvedQueries).filter(q => 
    q.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.order?.aspireOrderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.order?.userOrderId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReply = async (queryId: string, text: string) => {
    if (!text.trim() || sendingQueries[queryId]) return;
    setSendingQueries(prev => ({ ...prev, [queryId]: true }));
    const optimisticMessage = {
      sender: session?.user?.id,
      senderRole: 'MEDIATOR',
      text: text,
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };
    setQueries(prev => prev.map(q => q._id === queryId ? { ...q, messages: [...(q.messages || []), optimisticMessage] } : q));
    try {
      const res = await fetch(`/api/support/${queryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, senderRole: 'MEDIATOR' })
      });
      const json = await res.json();
      if (json.success) setQueries(prev => prev.map(q => q._id === queryId ? { ...q, messages: json.data.messages } : q));
      else { toast.error(json.message); fetchQueries(); }
    } catch (err) { toast.error("Reply failed"); fetchQueries(); }
    finally { setSendingQueries(prev => ({ ...prev, [queryId]: false })); }
  };

  const handleResolve = async (queryId: string) => {
    if (resolvingQueries[queryId]) return;
    setResolvingQueries(prev => ({ ...prev, [queryId]: true }));
    setConfModal(prev => ({ ...prev, isOpen: false }));
    const originalQueries = [...queries];
    setQueries(prev => prev.map(q => q._id === queryId ? { ...q, status: 'CLOSED' } : q));
    if (window.innerWidth <= 1024) setSelectedTicketId(null);
    toast.success("Ticket Resolved");
    try {
      const res = await fetch(`/api/support/${queryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: 'CLOSED' })
      });
      if (!res.ok) throw new Error("Failed to resolve");
      await fetchQueries();
    } catch (err) { setQueries(originalQueries); toast.error("Action failed"); }
    finally { setResolvingQueries(prev => ({ ...prev, [queryId]: false })); }
  };

  const handleDelete = async (queryId: string) => {
    setConfModal(prev => ({ ...prev, isOpen: false }));
    const originalQueries = [...queries];
    setQueries(prev => prev.filter(q => q._id !== queryId));
    if (selectedTicketId === queryId) setSelectedTicketId(null);
    toast.success("Deleted Permanently");
    try {
      const res = await fetch(`/api/support/${queryId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Delete failed");
      await fetchQueries();
    } catch (err) { setQueries(originalQueries); toast.error("Delete failed"); }
  };

  const getWhatsAppLink = (mobile: string, name: string, orderId: string) => {
    const text = encodeURIComponent(`Hi ${name}, I am your mediator for Order ${orderId}. I saw your support query regarding this order.`);
    return `https://wa.me/${mobile.replace(/\D/g, '')}?text=${text}`;
  };

  return (
    <div className="h-[calc(100dvh-120px)] lg:h-[calc(100vh-140px)] flex flex-col bg-slate-50 overflow-hidden">
      
      {/* Top Header */}
      <div className={`flex-shrink-0 bg-white border-b border-slate-100 z-40 px-6 py-3 lg:py-5 ${selectedTicketId ? 'hidden lg:flex' : 'flex'}`}>
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="hidden lg:flex items-center gap-3">
            <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 uppercase tracking-tight italic leading-none">MEDIATOR SUPPORT HUB</h1>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">DISPUTE RESOLUTION CENTER</p>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner w-full lg:w-auto max-w-sm lg:max-w-none mx-auto lg:mx-0">
            <button 
              onClick={() => { setActiveTab('ACTIVE'); setSelectedTicketId(null); }}
              className={`flex-1 px-4 lg:px-8 py-2.5 lg:py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'ACTIVE' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
            >
              ACTIVE ({activeQueries.length})
            </button>
            <button 
              onClick={() => { setActiveTab('RESOLVED'); setSelectedTicketId(null); }}
              className={`flex-1 px-4 lg:px-8 py-2.5 lg:py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'RESOLVED' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
            >
              RESOLVED ({resolvedQueries.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 lg:p-6">
          <div className="max-w-7xl mx-auto h-full">
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full p-4 lg:p-0">
                <Skeleton className="h-full rounded-[40px] lg:col-span-1" />
                <Skeleton className="h-full rounded-[40px] lg:col-span-2" />
              </div>
            ) : activeTab === 'ACTIVE' ? (
              /* ACTIVE TAB: Split-Pane Chat Interface */
              <div className="flex flex-col lg:flex-row h-full lg:bg-white lg:rounded-[40px] lg:shadow-2xl lg:border lg:border-slate-100 overflow-hidden">
                
                {/* Sidebar List */}
                <div className={`w-full lg:w-[380px] lg:border-r lg:border-slate-100 flex flex-col bg-slate-50 lg:bg-slate-50/30 min-h-0 ${selectedTicketId ? 'hidden lg:flex' : 'flex'}`}>
                  <div className="p-4 lg:p-6 bg-white lg:bg-transparent lg:border-b lg:border-slate-100">
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="SEARCH ACTIVE..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-100 lg:bg-white border-none rounded-2xl py-3.5 pl-5 pr-5 text-[10px] font-black uppercase tracking-widest outline-none shadow-sm lg:shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-5 space-y-4 min-h-0">
                    {filteredItems.length === 0 ? (
                      <div className="p-10 text-center italic text-slate-300 text-[10px] font-black uppercase tracking-widest">No active queries</div>
                    ) : (
                      filteredItems.map(q => (
                        <div 
                          key={q._id}
                          onClick={() => setSelectedTicketId(q._id)}
                          className={`p-6 rounded-[32px] cursor-pointer transition-all duration-300 group ${selectedTicketId === q._id ? 'bg-slate-900 text-white shadow-2xl scale-[1.02]' : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-100 shadow-sm'}`}
                        >
                          <div className="flex items-center justify-between mb-4">
                             <div className="flex items-center gap-2">
                               <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                               <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${selectedTicketId === q._id ? 'bg-sky-500 text-white' : 'bg-emerald-500 text-white'}`}>OPEN</span>
                               {q.order && <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${selectedTicketId === q._id ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-400'}`}>ORDER</span>}
                             </div>
                             <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">{formatDate(q.updatedAt)}</span>
                          </div>
                          <h3 className={`text-sm font-black uppercase tracking-tight mb-1 truncate ${selectedTicketId === q._id ? 'text-white' : 'text-slate-900'}`}>{q.subject}</h3>
                          <p className={`text-[10px] font-black uppercase tracking-widest truncate ${selectedTicketId === q._id ? 'text-sky-300' : 'text-indigo-500'}`}>{q.user?.name} {q.order?.brandName ? `• ${q.order.brandName}` : ''}</p>
                          {q.messages && q.messages.length > 0 && (
                            <p className={`mt-3 text-[10px] font-black opacity-40 italic truncate ${selectedTicketId === q._id ? 'text-white' : 'text-slate-500'}`}>"{q.messages[q.messages.length - 1].text}"</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Detail View / Chat */}
                <div className={`fixed inset-0 lg:relative lg:inset-auto z-[60] lg:z-auto flex-1 flex flex-col bg-white min-h-0 ${!selectedTicketId ? 'hidden lg:flex' : 'flex'}`}>
                  {selectedTicket ? (
                    <>
                      <div className="px-6 py-4 lg:py-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-xl z-10 sticky top-0">
                        <div className="flex items-center gap-4">
                          <button onClick={() => setSelectedTicketId(null)} className="h-10 w-10 flex items-center justify-center bg-slate-50 rounded-full text-slate-900 shadow-sm border border-slate-100 lg:hidden">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                          </button>
                          <div>
                            <h2 className="text-[13px] lg:text-[15px] font-black text-slate-900 uppercase truncate max-w-[180px] lg:max-w-md">{selectedTicket.subject}</h2>
                            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{selectedTicket.user?.name} • BUYER</p>
                          </div>
                        </div>
                        <a href={getWhatsAppLink(selectedTicket.user?.mobile || "", selectedTicket.user?.name || "", selectedTicket.order?.aspireOrderId || "")} target="_blank" rel="noopener noreferrer" className="h-10 w-10 flex items-center justify-center bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-200 active:scale-90 transition-all">
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" /></svg>
                        </a>
                      </div>

                      <div ref={chatContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/30 space-y-6 min-h-0">
                        {/* Context Card */}
                        <div className="bg-slate-900 rounded-[28px] p-5 lg:p-7 shadow-2xl relative overflow-hidden mb-8 border border-white/5">
                           <div className="absolute top-0 right-0 h-40 w-40 bg-sky-500/5 blur-3xl rounded-full -mr-20 -mt-20" />
                           <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                            <div>
                              <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Order ID</p>
                              <p className="text-[11px] font-black text-white uppercase truncate font-mono">#{selectedTicket.order?.userOrderId || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Brand Partner</p>
                              <p className="text-[11px] font-black text-sky-400 uppercase truncate">{selectedTicket.order?.brandName || 'DIRECT'}</p>
                            </div>
                            <div>
                              <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Review Type</p>
                              <p className="text-[11px] font-black text-amber-400 uppercase truncate">{selectedTicket.order?.reviewType || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Deal Type</p>
                              <p className={`text-[11px] font-black uppercase truncate ${selectedTicket.order?.dealType === 'ORIGINAL' ? 'text-emerald-400' : 'text-indigo-400'}`}>{selectedTicket.order?.dealType || 'N/A'}</p>
                            </div>
                            <div className="col-span-2 lg:col-span-1 border-t border-white/5 pt-4 lg:pt-0 lg:border-none">
                              <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Buyer Name</p>
                              <p className="text-[11px] font-black text-slate-200 uppercase truncate">{selectedTicket.user?.name}</p>
                            </div>
                            <div className="col-span-2 lg:col-span-1 border-t border-white/5 pt-4 lg:pt-0 lg:border-none">
                              <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Submitted On</p>
                              <p className="text-[11px] font-black text-slate-400 uppercase truncate">{new Date(selectedTicket.createdAt).toLocaleDateString()} {new Date(selectedTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <div className="col-span-2 border-t border-white/5 pt-4 lg:pt-0 lg:border-none lg:col-span-2">
                              <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Issue Classification</p>
                              <p className="text-[11px] font-black text-emerald-400 uppercase truncate">{selectedTicket.type.replace(/_/g, ' ')}</p>
                            </div>
                          </div>
                        </div>

                        {selectedTicket.messages?.map((msg: any, idx: number) => (
                          <div key={idx} className={`flex flex-col ${msg.senderRole === 'MEDIATOR' ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[85%] lg:max-w-[75%] p-4 lg:p-5 rounded-[24px] shadow-sm text-[13px] lg:text-[14px] font-medium leading-relaxed transition-all hover:shadow-md ${msg.senderRole === 'MEDIATOR' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'}`}>
                              {msg.text}
                              {idx === 0 && selectedTicket.screenshot && (
                                <div className="mt-4 rounded-2xl overflow-hidden border border-slate-100 shadow-sm cursor-pointer" onClick={() => window.open(selectedTicket.screenshot, "_blank")}>
                                   <img src={selectedTicket.screenshot} className="w-full max-h-60 object-cover" alt="User Proof" />
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-2 px-1">
                              <span className="text-[7px] lg:text-[8px] font-black text-slate-400 uppercase tracking-widest">{msg.senderRole === 'MEDIATOR' ? 'YOU' : 'BUYER'} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {msg.senderRole === 'MEDIATOR' && <svg className="w-2.5 h-2.5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-5 lg:p-7 border-t border-slate-100 bg-white shadow-2xl">
                        <div className="max-w-4xl mx-auto flex flex-col gap-4">
                          <form 
                            onSubmit={(e: any) => {
                              e.preventDefault();
                              handleReply(selectedTicket._id, e.target.reply.value);
                              e.target.reset();
                            }}
                            className="flex items-center gap-3 bg-slate-100 p-2 rounded-[24px] shadow-inner border border-slate-200"
                          >
                            <input name="reply" placeholder="Type message..." className="flex-1 bg-transparent border-none outline-none px-5 text-xs lg:text-sm font-black text-slate-900 placeholder:text-slate-400" autoComplete="off" disabled={sendingQueries[selectedTicket._id]} />
                            <button type="submit" disabled={sendingQueries[selectedTicket._id]} className="h-12 w-12 flex items-center justify-center bg-slate-900 text-white rounded-2xl shadow-xl active:scale-95 transition-all">
                               {sendingQueries[selectedTicket._id] ? <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <svg className="w-6 h-6 rotate-45 transform -translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
                            </button>
                          </form>
                          <div className="flex gap-3">
                            <button onClick={() => setConfModal({ isOpen: true, title: "Resolve Ticket", message: "Are you sure you want to resolve and close this support thread?", onConfirm: () => handleResolve(selectedTicket._id), variant: 'success', confirmText: "Resolve Now" })} disabled={resolvingQueries[selectedTicket._id]} className="flex-1 py-3.5 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 active:scale-95">RESOLVE TICKET</button>
                            <button onClick={() => setConfModal({ isOpen: true, title: "Delete Permanently", message: "This action is irreversible. Delete this thread?", onConfirm: () => handleDelete(selectedTicket._id), variant: 'danger', confirmText: "Delete" })} className="px-6 py-3.5 bg-rose-50 text-rose-500 border border-rose-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all active:scale-95">DELETE</button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/50">
                       <div className="h-20 w-20 bg-white rounded-full shadow-xl flex items-center justify-center mb-6"><svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg></div>
                       <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight italic">READY TO HELP?</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3 max-w-[250px] leading-relaxed">SELECT A CONVERSATION FROM THE SIDEBAR TO START RESOLVING DISPUTES.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* RESOLVED TAB: Grid of cards like Admin */
              <div className="p-4 lg:p-0">
                <div className="mb-6">
                  <input 
                    type="text"
                    placeholder="SEARCH RESOLVED..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full lg:max-w-md bg-white border border-slate-100 rounded-[24px] py-4 px-6 text-[10px] font-black uppercase tracking-widest outline-none shadow-xl shadow-slate-200/40"
                  />
                </div>
                {filteredItems.length === 0 ? (
                  <div className="p-20 text-center italic text-slate-300 text-[12px] font-black uppercase tracking-widest">No resolved queries found</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map(q => (
                      <motion.div 
                        layout
                        key={q._id}
                        className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/40 border border-slate-50 relative group overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-4">
                           <div className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[8px] font-black uppercase tracking-widest">RESOLVED</div>
                        </div>

                        <div className="mb-6">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{q.order?.brandName || 'DIRECT SUPPORT'}</p>
                          <h3 className="text-sm lg:text-md font-black text-slate-900 uppercase tracking-tight line-clamp-2 leading-tight mb-2">{q.subject}</h3>
                          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{q.user?.name}</p>
                        </div>

                        <div className="space-y-3 mb-8">
                          <div className="flex items-center justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">
                             <span>Order ID</span>
                             <span className="text-slate-900">#{q.order?.userOrderId || 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                             <span>Resolved On</span>
                             <span className="text-slate-900">{formatDate(q.updatedAt)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                           <button 
                            onClick={() => { setSelectedTicketId(q._id); setActiveTab('ACTIVE'); }}
                            className="flex-1 py-3 bg-slate-100 text-slate-900 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all active:scale-95"
                           >
                             VIEW CHAT
                           </button>
                           <button 
                            onClick={() => setConfModal({ isOpen: true, title: "Delete Record", message: "This will permanently remove the resolved ticket history.", onConfirm: () => handleDelete(q._id), variant: 'danger', confirmText: "Delete" })}
                            className="h-12 w-12 flex items-center justify-center bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                           >
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                           </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
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
  );
}
