"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import formatDate from "@/utils/formatDate";
import { Search, X, Package, ShieldCheck, ChevronRight, MessageSquare, Info, Plus } from "lucide-react";

export default function SupportPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [queries, setQueries] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'HISTORY' | 'NEW_QUERY'>('NEW_QUERY');
  const [sendingQueries, setSendingQueries] = useState<Record<string, boolean>>({});
  const [ticketType, setTicketType] = useState<'ORDER_DISPUTE' | 'GENERAL_QUERY' | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Type Select, 2: Order Select (if dispute), 3: Form
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [orderSearch, setOrderSearch] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    subject: "",
    query: "",
    screenshot: "",
  });

  useEffect(() => {
    fetchQueries();
    fetchOrders();
    const interval = setInterval(fetchQueries, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (window.innerWidth > 1024) {
      if (activeTab === 'HISTORY' && queries.length > 0 && !selectedTicketId) {
        setSelectedTicketId(queries[0]._id);
      }
    }
  }, [queries, activeTab, selectedTicketId]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [selectedTicketId, queries]);

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

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const json = await res.json();
      if (json.success) setOrders(json.data);
    } catch (err) {
      toast.error("Failed to load orders");
    } finally {
      setLoadingOrders(false);
    }
  };

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1000;
          if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } }
          else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => { if (blob) resolve(blob); else reject(new Error('Compression failed')); }, 'image/jpeg', 0.6);
        };
        img.onerror = () => reject(new Error('Image failed'));
      };
      reader.onerror = () => reject(new Error('Read failed'));
    });
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isUploading) return;
    setIsUploading(true);
    const loadingId = toast.loading("Optimizing...");
    try {
      const compressedBlob = await compressImage(file);
      const signRes = await fetch("/api/upload/sign");
      const signData = await signRes.json();
      if (!signData.success) throw new Error(signData.message);
      const uploadData = new FormData();
      uploadData.append("file", compressedBlob);
      uploadData.append("api_key", signData.api_key);
      uploadData.append("timestamp", signData.timestamp.toString());
      uploadData.append("signature", signData.signature);
      uploadData.append("folder", signData.folder);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloud_name}/image/upload`, { method: "POST", body: uploadData });
      const json = await res.json();
      if (json.secure_url) {
        setFormData(prev => ({ ...prev, screenshot: json.secure_url }));
        toast.success("Screenshot Linked", { id: loadingId });
      } else { throw new Error(json.error?.message); }
    } catch (err: any) { toast.error(err.message || "Upload Failed", { id: loadingId }); } finally { setIsUploading(false); e.target.value = ""; }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketType === 'ORDER_DISPUTE' && !selectedOrder) return toast.error("Please select an order first");
    if (!formData.subject || !formData.query) return toast.error("Please fill required fields");
    setSubmitting(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...formData, 
          orderId: selectedOrder?._id,
          type: ticketType 
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(ticketType === 'ORDER_DISPUTE' ? "Query sent to Mediator!" : "Query sent to Admin!");
        setFormData({ subject: "", query: "", screenshot: "" });
        setSelectedOrder(null);
        setTicketType(null);
        setActiveTab('HISTORY');
        fetchQueries();
      } else {
        toast.error(json.message);
      }
    } catch (err) {
      toast.error("Failed to send query");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (queryId: string, text: string) => {
    if (!text.trim() || sendingQueries[queryId]) return;
    setSendingQueries(prev => ({ ...prev, [queryId]: true }));
    
    const optimisticMessage = {
      sender: session?.user?.id,
      senderRole: 'USER',
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
        body: JSON.stringify({ message: text })
      });
      const json = await res.json();
      if (json.success) {
        setQueries(prev => prev.map(q => 
          q._id === queryId 
            ? { ...q, messages: json.data.messages } // Merge messages only
            : q
        ));
      } else {
        toast.error(json.message);
        fetchQueries();
      }
    } catch (err) {
      toast.error("Failed to send message");
      fetchQueries();
    } finally {
      setSendingQueries(prev => ({ ...prev, [queryId]: false }));
    }
  };

  const handleDeleteQuery = (queryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTicketToDelete(queryId);
    setShowDeleteModal(true);
  };

  const confirmDeleteQuery = async () => {
    if (!ticketToDelete) return;
    const queryId = ticketToDelete;
    
    const loadingId = toast.loading("Purging chat history...");
    setShowDeleteModal(false);
    
    try {
      const res = await fetch(`/api/support/${queryId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Chat history purged", { id: loadingId });
        if (selectedTicketId === queryId) setSelectedTicketId(null);
        fetchQueries();
      } else {
        toast.error(json.message, { id: loadingId });
      }
    } catch (err) {
      toast.error("Deletion failed", { id: loadingId });
    } finally {
      setTicketToDelete(null);
    }
  };

  const renderOrderList = () => {
    // 1. Filter by status (exclude COMPLETED and REFUND_REJECTED)
    // 2. Filter by search query (order ID or brand name)
    const filteredOrders = orders.filter(o => 
      o.status !== 'COMPLETED' && 
      o.status !== 'REFUND_REJECTED' &&
      (
        o.aspireOrderId?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.userOrderId?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.brandName?.toLowerCase().includes(orderSearch.toLowerCase())
      )
    );
    
    return (
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="relative">
           <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
           </div>
           <input 
             type="text"
             placeholder="Search by Order ID or Brand..."
             value={orderSearch}
             onChange={(e) => setOrderSearch(e.target.value)}
             className="w-full h-14 pl-12 pr-5 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all outline-none placeholder:text-slate-300 shadow-sm"
           />
           {orderSearch && (
             <button 
               onClick={() => setOrderSearch("")}
               className="absolute inset-y-0 right-4 flex items-center text-slate-300 hover:text-slate-600"
             >
                <X className="w-4 h-4" />
             </button>
           )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {loadingOrders ? (
            [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)
          ) : filteredOrders.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white border border-dashed border-slate-200 rounded-[40px]">
              <Info className="w-10 h-10 text-slate-200 mx-auto mb-4" />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No matching orders found</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <motion.div 
                whileHover={{ y: -4, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.08)" }}
                whileTap={{ scale: 0.98 }}
                key={order._id}
                onClick={() => { setSelectedOrder(order); setStep(3); }}
                className="bg-white p-6 rounded-[32px] border border-slate-100 hover:border-sky-300 transition-all cursor-pointer group relative overflow-hidden flex flex-col shadow-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-col">
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Order</span>
                     <span className="text-[13px] font-black text-sky-600 uppercase tracking-tight">{order.userOrderId || 'N/A'}</span>
                  </div>
                  <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-sky-600 group-hover:text-white transition-all">
                     <Package className="w-5 h-5" />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-[17px] font-black text-slate-900 uppercase truncate leading-none">{order.brandName}</p>
                  <div className="flex items-center gap-2">
                     <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{order.status.replace(/_/g, ' ')}</p>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between">
                   <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Reference: {order.aspireOrderId}</p>
                   <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100dvh-120px)] lg:h-[calc(100vh-140px)] flex flex-col bg-slate-50/50 overflow-hidden">
      {/* Navigation Bar */}
      <div className={`flex-shrink-0 bg-white border-b border-slate-100 z-40 px-6 py-3 ${selectedTicketId ? 'hidden lg:flex' : 'flex'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl shadow-slate-900/10">
              <MessageSquare className="w-5 h-5" />
            </div>
            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">SUPPORT HUB</p>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner">
            <button 
              onClick={() => { setActiveTab('NEW_QUERY'); setStep(1); setTicketType(null); setSelectedTicketId(null); }}
              className={`px-8 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'NEW_QUERY' ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20' : 'text-slate-400 hover:text-slate-600'}`}
            >
              NEW
            </button>
            <button 
              onClick={() => { setActiveTab('HISTORY'); setSelectedTicketId(null); }}
              className={`px-8 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'HISTORY' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              ACTIVE
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <div className={`absolute inset-0 ${activeTab === 'NEW_QUERY' ? 'overflow-y-auto' : 'overflow-hidden'} custom-scrollbar`}>
          <div className={`max-w-7xl mx-auto h-full ${activeTab === 'HISTORY' ? 'p-0 lg:p-6' : 'p-4 lg:p-6'}`}>
            <AnimatePresence mode="wait">
              {activeTab === 'NEW_QUERY' ? (
                <motion.div 
                  key="new"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-4xl mx-auto"
                >
                  {step === 1 ? (
                    <div className="max-w-4xl mx-auto space-y-10 py-10">
                      <div className="text-center space-y-4">
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 uppercase tracking-tighter italic">Initiate a Query</h2>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Secure communication with admin and mediators</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
                        <div 
                          onClick={() => { setTicketType('ORDER_DISPUTE'); setStep(2); }}
                          className="bg-white p-10 rounded-[48px] border border-slate-100 hover:border-sky-500 cursor-pointer transition-all hover:shadow-3xl group flex flex-col items-center text-center shadow-sm"
                        >
                          <div className="h-20 w-20 bg-sky-50 rounded-3xl flex items-center justify-center text-sky-600 group-hover:scale-110 transition-transform mb-8 shadow-inner">
                            <Package className="w-10 h-10" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">ORDER SPECIFIC QUERIES</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase leading-relaxed tracking-wider">Issues with a specific transaction</p>
                          </div>
                        </div>

                        <div 
                          onClick={() => { setTicketType('GENERAL_QUERY'); setStep(3); }}
                          className="bg-white p-10 rounded-[48px] border border-slate-100 hover:border-indigo-500 cursor-pointer transition-all hover:shadow-3xl group flex flex-col items-center text-center shadow-sm"
                        >
                          <div className="h-20 w-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform mb-8 shadow-inner">
                            <ShieldCheck className="w-10 h-10" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">GENERAL QUERIES</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase leading-relaxed tracking-wider">Direct assistance from administration</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : step === 2 ? (
                    <div className="space-y-10 pt-10">
                      <div className="flex items-center justify-between px-2">
                         <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Select Order</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Showing only eligible active orders</p>
                         </div>
                         <button onClick={() => setStep(1)} className="px-6 py-3 rounded-xl border border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all">Back</button>
                      </div>
                      {renderOrderList()}
                    </div>
                  ) : (
                    <div className="max-w-2xl mx-auto space-y-10 pt-10">
                      <div className="flex items-center justify-between p-6 bg-slate-900 rounded-[32px] shadow-2xl border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 h-full w-40 bg-sky-500/10 -mr-16 skew-x-12" />
                        <div className="flex items-center gap-6 relative z-10">
                          <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/20">
                            {ticketType === 'ORDER_DISPUTE' ? <Package className="w-7 h-7" /> : <ShieldCheck className="w-7 h-7" />}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-sky-400 uppercase tracking-[0.3em] mb-1">{ticketType === 'ORDER_DISPUTE' ? 'ORDER QUERIES' : 'GENERAL QUERY'}</p>
                            <p className="text-lg font-black text-white uppercase italic">{ticketType === 'ORDER_DISPUTE' ? selectedOrder.brandName : 'Direct Admin Inquiry'}</p>
                          </div>
                        </div>
                        <button onClick={() => setStep(1)} className="h-10 px-6 rounded-xl text-[9px] font-black text-white/50 uppercase tracking-widest hover:text-white transition-all border border-white/10 relative z-10">Change</button>
                      </div>

                      <form onSubmit={handleSubmit} className="bg-white rounded-[48px] shadow-3xl border border-slate-100 overflow-hidden mb-10">
                        <div className="p-10 space-y-10">
                           <div className="space-y-6">
                              <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject</p>
                                <input 
                                  placeholder="Briefly state your issue..."
                                  value={formData.subject}
                                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                  className="w-full h-16 px-8 bg-slate-50 border-none focus:bg-white rounded-[24px] shadow-inner font-bold text-sm transition-all focus:ring-8 focus:ring-sky-500/5 outline-none"
                                />
                              </div>
                              <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detailed Description</p>
                                <textarea 
                                  rows={6}
                                  placeholder="Provide all relevant details..."
                                  className="w-full rounded-[32px] border-none bg-slate-50 p-8 text-sm font-bold outline-none focus:bg-white focus:ring-8 focus:ring-sky-500/5 transition-all shadow-inner resize-none min-h-[200px]"
                                  value={formData.query}
                                  onChange={(e) => setFormData({ ...formData, query: e.target.value })}
                                />
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                              {!formData.screenshot ? (
                                <div className="relative h-48 rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center bg-slate-50/50 border-slate-200 group/upload hover:bg-white hover:border-sky-400 transition-all cursor-pointer overflow-hidden">
                                  <input type="file" accept="image/*" onChange={handleScreenshotUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" disabled={isUploading} />
                                  <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center text-sky-600 mb-3 group-hover/upload:scale-110 transition-transform shadow-sm">
                                    <Plus className="w-6 h-6" />
                                  </div>
                                  <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase">{isUploading ? "OPTIMIZING..." : "UPLOAD PROOF"}</p>
                                </div>
                              ) : (
                                <div className="relative rounded-[32px] overflow-hidden h-48 group shadow-xl">
                                  <img src={formData.screenshot} className="w-full h-full object-cover" alt="Proof" />
                                  <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center">
                                    <button type="button" onClick={() => setFormData({ ...formData, screenshot: "" })} className="h-14 w-14 bg-white rounded-2xl text-rose-500 shadow-2xl flex items-center justify-center hover:scale-110 transition-all">
                                      <X className="w-6 h-6" />
                                    </button>
                                  </div>
                                </div>
                              )}
                              
                              <button 
                                type="submit" 
                                disabled={submitting}
                                className="w-full h-20 bg-slate-900 text-white rounded-[32px] shadow-2xl font-black uppercase tracking-[0.4em] text-[11px] hover:bg-sky-600 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-4"
                              >
                                {submitting ? "SENDING..." : "SUBMIT TICKET"}
                              </button>
                           </div>
                        </div>
                      </form>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="history"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-0"
                >
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-3xl" />)}
                    </div>
                  ) : queries.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center bg-white border border-slate-100 rounded-[64px] shadow-sm space-y-8">
                      <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                        <MessageSquare className="w-10 h-10" />
                      </div>
                      <div className="text-center">
                         <p className="text-sm font-black text-slate-900 uppercase tracking-tighter">No active support channels</p>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Initiate a new query to start a conversation</p>
                      </div>
                      <Button onClick={() => setActiveTab('NEW_QUERY')} className="bg-sky-600 text-white px-12 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-sky-600/20">New Query</Button>
                    </div>
                  ) : (
                    <div className={`flex flex-col lg:flex-row h-full bg-white ${selectedTicketId ? 'fixed inset-0 z-[60] lg:relative lg:inset-auto lg:z-auto lg:h-full lg:rounded-[48px]' : 'rounded-[48px] relative h-full'} shadow-3xl border-none overflow-hidden`}>
                      {/* Sidebar List */}
                      <div className={`w-full lg:w-[400px] border-r border-slate-100 flex flex-col bg-slate-50/50 min-h-0 ${selectedTicketId ? 'hidden lg:flex' : 'flex'}`}>
                        <div className="p-8 border-b border-slate-100 bg-white flex items-center justify-between">
                           <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">COMMUNICATIONS</p>
                           <div className="h-6 w-10 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-black">{queries.length}</div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4 min-h-0">
                           {queries.map(q => (
                             <div 
                               key={q._id}
                               onClick={() => setSelectedTicketId(q._id)}
                               className={`p-6 rounded-[32px] cursor-pointer transition-all duration-300 group relative ${selectedTicketId === q._id ? 'bg-slate-900 text-white shadow-3xl translate-x-3' : 'bg-white hover:bg-slate-100 border border-slate-100 shadow-sm'}`}
                             >
                               <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                     <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${selectedTicketId === q._id ? 'bg-sky-500 text-white' : q.status === 'OPEN' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{q.status}</span>
                                     {q.type === 'ORDER_DISPUTE' && <span className="text-[8px] font-black text-sky-400 uppercase tracking-widest bg-sky-400/5 px-2 py-1 rounded-lg border border-sky-400/10">DISPUTE</span>}
                                  </div>
                                  <span className={`text-[9px] font-black uppercase ${selectedTicketId === q._id ? 'text-slate-500' : 'text-slate-300'}`}>{new Date(q.updatedAt).toLocaleDateString()}</span>
                               </div>
                               <p className={`text-[15px] font-black truncate italic tracking-tight ${selectedTicketId === q._id ? 'text-white' : 'text-slate-900'}`}>{q.subject}</p>
                               <div className="mt-4 flex items-center justify-between">
                                  <p className={`text-[10px] font-bold uppercase truncate max-w-[200px] ${selectedTicketId === q._id ? 'text-slate-400' : 'text-slate-400'}`}>{q.type === 'ORDER_DISPUTE' ? q.order?.brandName : 'Direct Support'}</p>
                                  <div className="flex items-center gap-3">
                                     {q.status !== 'OPEN' && (
                                       <button 
                                         onClick={(e) => handleDeleteQuery(q._id, e)}
                                         className={`p-1.5 rounded-lg transition-all ${selectedTicketId === q._id ? 'bg-white/10 text-white/40 hover:text-white hover:bg-white/20' : 'bg-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50'}`}
                                       >
                                          <X className="w-3.5 h-3.5" />
                                       </button>
                                     )}
                                     <div className={`h-2.5 w-2.5 rounded-full ${q.status === 'OPEN' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                                  </div>
                               </div>
                             </div>
                           ))}
                        </div>
                      </div>

                      {/* Detail View */}
                      <div className={`flex-1 flex flex-col bg-white relative min-h-0 ${!selectedTicketId ? 'hidden lg:flex' : 'flex'}`}>
                        {selectedTicketId && queries.find(q => q._id === selectedTicketId) ? (() => {
                          const query = queries.find(q => q._id === selectedTicketId);
                          return (
                            <>
                              {/* Detail Header */}
                              <div className="flex-shrink-0 px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10 shadow-sm">
                                <div className="flex items-center gap-5">
                                  <button onClick={() => setSelectedTicketId(null)} className="h-12 w-12 flex items-center justify-center bg-slate-50 rounded-2xl text-slate-400 active:scale-90 transition-all">
                                    <X className="w-5 h-5" />
                                  </button>
                                  <div className="overflow-hidden">
                                    <h3 className="text-lg font-black text-slate-900 italic leading-tight mb-1 truncate max-w-[250px] lg:max-w-none tracking-tighter">{query.subject}</h3>
                                    <p className="text-[10px] font-black text-sky-500 uppercase tracking-[0.3em]">{query.type === 'ORDER_DISPUTE' ? `TRANSACTION ID: ${query.order?.aspireOrderId}` : 'DIRECT ADMINISTRATIVE CHANNEL'}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Chat Area */}
                              <div 
                                ref={chatContainerRef}
                                className="flex-1 p-8 lg:p-12 space-y-10 overflow-y-auto custom-scrollbar flex flex-col bg-slate-50/10 min-h-0"
                              >
                                <div className="max-w-4xl mx-auto w-full space-y-10">
                                  {query.messages.map((msg: any, idx: number) => (
                                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} key={idx} className={`flex flex-col ${msg.senderRole === 'USER' ? 'items-end' : 'items-start'}`}>
                                      <div className={`max-w-[85%] lg:max-w-[70%] px-6 py-5 rounded-[32px] relative transition-all shadow-sm ${msg.senderRole === 'USER' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                                        <p className="text-[15px] font-medium leading-relaxed">{msg.text}</p>
                                        
                                        {idx === 0 && query.screenshot && (
                                          <div className="mt-4 rounded-3xl overflow-hidden border border-slate-200 cursor-pointer shadow-lg hover:shadow-2xl transition-all" onClick={() => window.open(query.screenshot, "_blank")}>
                                            <img src={query.screenshot} className="w-full max-h-80 object-cover" alt="Proof" />
                                          </div>
                                        )}
                                      </div>
                                      <div className={`mt-3 flex items-center gap-3 px-3 ${msg.senderRole === 'USER' ? 'justify-end' : 'justify-start'}`}>
                                        <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${msg.senderRole === 'USER' ? 'text-slate-400' : 'text-sky-500'}`}>
                                          {msg.senderRole === 'USER' ? 'AUTHORIZED USER' : 
                                           msg.senderRole === 'MEDIATOR' ? (msg.senderName ? `${msg.senderName} (Specialist)` : 'VERIFIED MEDIATOR') :
                                           msg.senderRole === 'SUBADMIN' ? (msg.senderName ? `${msg.senderName} (SubAdmin)` : 'PLATFORM SUBADMIN') :
                                           (msg.senderName ? `${msg.senderName} (Admin)` : 'PLATFORM ADMIN')}
                                        </p>
                                        <div className="h-1 w-1 bg-slate-200 rounded-full" />
                                        <p className="text-[8px] font-black text-slate-300 uppercase">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>

                              {/* Footer Reply */}
                              {query.status === 'OPEN' ? (
                                <div className="p-6 lg:p-8 bg-white border-t border-slate-50 sticky bottom-0 z-10">
                                  <div className="max-w-4xl mx-auto">
                                    <form onSubmit={(e: any) => { e.preventDefault(); handleReply(query._id, e.target.reply.value); e.target.reset(); }} className="flex items-center gap-3 bg-slate-900 p-2 rounded-[32px] shadow-3xl border border-white/10">
                                      <input name="reply" placeholder="Secure message stream..." className="bg-transparent border-none outline-none flex-1 px-6 text-sm font-bold text-white placeholder:text-slate-600 placeholder:text-[10px] placeholder:uppercase placeholder:tracking-[0.2em]" autoComplete="off" disabled={sendingQueries[query._id]} />
                                      <button type="submit" disabled={sendingQueries[query._id]} className="h-14 w-14 flex items-center justify-center bg-sky-600 text-white rounded-full active:scale-95 transition-all shadow-xl shadow-sky-600/30">
                                        {sendingQueries[query._id] ? <div className="h-6 w-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <ChevronRight className="w-6 h-6" />}
                                      </button>
                                    </form>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-6 bg-slate-100 text-center border-t border-slate-200">
                                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Operational channel terminated • query resolved</p>
                                </div>
                              )}
                            </>
                          );
                        })() : (
                          <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6">
                             <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                               <Info className="w-10 h-10" />
                             </div>
                             <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em] italic">Secure communication bridge pending selection</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-[2px]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-white rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden border border-slate-100 ring-1 ring-black/5"
            >
              <div className="p-8 md:p-12 text-center space-y-6">
                <div className="h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto border-2 border-rose-100 shadow-inner">
                   <X className="w-10 h-10 text-rose-500" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Purge Chat?</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                    This action will permanently erase all communication logs for this terminated operational channel. This cannot be undone.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                  <button 
                    onClick={() => setShowDeleteModal(false)}
                    className="w-full h-14 bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-widest rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all"
                  >
                    Hold On, Back
                  </button>
                  <button 
                    onClick={confirmDeleteQuery}
                    className="w-full h-14 bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-rose-600/20 hover:bg-rose-700 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Confirm & Purge
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
