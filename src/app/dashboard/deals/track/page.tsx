"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { OrderTimeline } from '@/components/user/OrderTimeline';

export default function TrackOrderPage() {
  const router = useRouter();
  const [searchId, setSearchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'details'>('timeline');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const tid = searchId.trim();
    if (!tid) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/orders?aspireOrderId=${encodeURIComponent(tid)}&t=${Date.now()}`, {
        cache: 'no-store'
      });
      const json = await res.json();
      
      if (json.success && json.data.length > 0) {
        setOrder(json.data[0]);
        toast.success("Order Found!");
      } else {
        setOrder(null);
        toast.error("No such order found in our registry");
      }
    } catch (err) {
      toast.error("Search failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || !window.confirm("Are you sure you want to cancel this order? This action cannot be undone.")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${order._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "CANCELLED",
          cancellationReason: "User cancelled via Tracker"
        })
      });
      const json = await res.json();
      if (json.success) {
        setOrder(json.data);
        toast.success("Order Cancelled Successfully");
      } else {
        toast.error(json.message);
      }
    } catch (err) {
      toast.error("Cancellation failed");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'REFUNDED': return 'bg-emerald-500 shadow-emerald-500/20';
      case 'REFUND_REJECTED': 
      case 'CANCELLED': return 'bg-rose-500 shadow-rose-500/20';
      case 'REFUND_FORM_PENDING': return 'bg-amber-500 shadow-amber-500/20';
      default: return 'bg-blue-500 shadow-blue-500/20';
    }
  };

  return (
    <div className="min-h-[100dvh] md:min-h-screen bg-white md:bg-slate-50/50 -mx-4 -mt-8 md:-mx-8 md:-mt-10 px-4 py-8 md:py-12 md:px-8">
      <div className="max-w-5xl mx-auto space-y-8 md:space-y-12">
        
        {/* Search Section */}
        <div className="text-center space-y-3 md:space-y-6 pt-2 md:pt-0">
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 bg-slate-50 md:bg-blue-50 rounded-full border border-slate-100 md:border-blue-100 mb-0 md:mb-2"
           >
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-[8px] md:text-[10px] font-black text-slate-500 md:text-blue-600 uppercase tracking-widest">Live Ledger Control</span>
           </motion.div>
           <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight">Track Your Order</h1>
           <p className="text-slate-400 text-[10px] md:text-sm font-bold uppercase tracking-widest px-4">enter your order id to track order..</p>

           <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative group mt-6 md:mt-10">
              <input 
                type="text" 
                placeholder="Ex: OD337066357..." 
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="w-full h-14 md:h-20 pl-6 md:pl-8 pr-32 md:pr-40 rounded-[20px] md:rounded-[32px] bg-slate-50 md:bg-white border border-slate-100 md:border-slate-100 shadow-none md:shadow-2xl shadow-slate-200/60 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-black text-sm md:text-lg tracking-tight placeholder:text-slate-300 uppercase"
              />
              <button 
                type="submit"
                disabled={loading}
                className="absolute right-1.5 md:right-2 top-1.5 md:top-2 bottom-1.5 md:bottom-2 px-5 md:px-10 bg-blue-600 rounded-[16px] md:rounded-[24px] text-white text-[10px] md:text-xs font-black uppercase tracking-widest shadow-md md:shadow-xl shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2 md:gap-3 disabled:opacity-50"
              >
                 {loading ? "Sync..." : (
                   <>
                     Track <svg className="w-3 md:w-4 h-3 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7-7 7" /></svg>
                   </>
                 )}
              </button>
           </form>
        </div>

        {/* Results Area */}
        <AnimatePresence mode="wait">
          {loading ? (
             <motion.div 
               key="loading" 
               initial={{ opacity: 0, scale: 0.95 }} 
               animate={{ opacity: 1, scale: 1 }} 
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white rounded-[40px] p-12 md:p-20 shadow-sm border border-slate-100 text-center space-y-6 flex flex-col items-center justify-center relative overflow-hidden"
             >
                <div className="absolute top-0 right-0 h-48 w-48 bg-blue-500/5 blur-[60px] rounded-full -mr-24 -mt-24" />
                <div className="relative mb-4 md:mb-6">
                   <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-xl animate-pulse" />
                   <div className="h-16 w-16 md:h-24 md:w-24 rounded-full border-4 border-blue-50 border-t-blue-600 animate-spin relative z-10" />
                </div>
                <h3 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-[0.2em] animate-pulse">Syncing Live Ledger Registry...</h3>
                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-xs mx-auto">Please wait while we establish a secure database connection and locate your transaction records.</p>
             </motion.div>
          ) : !hasSearched ? (
            <>
               {/* Desktop Empty State */}
               <motion.div 
                 key="empty-desktop" 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 className="hidden md:flex py-20 flex-col items-center justify-center opacity-20 filter grayscale"
               >
                  <svg className="w-32 h-32 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <p className="mt-4 text-sm font-black uppercase tracking-[0.3em] text-slate-400">Waiting for Order ID</p>
               </motion.div>
               
               {/* Restructured Mobile Empty State */}
               <motion.div 
                 key="empty-mobile" 
                 initial={{ opacity: 0, scale: 0.95 }} 
                 animate={{ opacity: 1, scale: 1 }} 
                 className="md:hidden pt-12 pb-24 flex flex-col items-center justify-center"
               >
                  <div className="relative mb-8">
                     <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-2xl animate-pulse" />
                     <div className="h-36 w-36 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center relative z-10 shadow-sm">
                        <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center shadow-inner border border-slate-50">
                           <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                     </div>
                  </div>
                  <div className="text-center px-8">
                     <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-3">Ready to Track</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Enter your tracking code above to sync live status updates securely.</p>
                  </div>
               </motion.div>
            </>
          ) : order ? (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
               {/* --- DESKTOP VIEW (Unchanged) --- */}
               <div className="hidden md:block space-y-6">
                 {/* Desktop Header Card */}
                 <div className="bg-white rounded-[40px] p-12 shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-64 w-64 bg-blue-500/5 blur-[80px] rounded-full -mr-32 -mt-32" />
                    <div className="flex items-center justify-between gap-8 relative z-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                              <span className={`px-5 py-2.5 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg ${getStatusColor(order.status)}`}>
                                {order.status.replace(/_/g, " ")}
                              </span>
                              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{order.aspireMintId}</h2>
                           </div>
                           <div className="flex items-center gap-6">
                              <div className="flex flex-col">
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block">Order Date</span>
                                 <span className="text-sm font-black text-slate-900 uppercase">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              </div>
                           </div>
                        </div>

                        {order.status === "REFUND_FORM_PENDING" && (
                          <div className="flex items-center gap-4">
                           <button onClick={handleCancelOrder} className="px-10 py-5 bg-rose-50 border border-rose-100 rounded-3xl text-rose-600 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all active:scale-95">Cancel Order</button>
                           <Link href={`/dashboard/refunds/fill/${order._id}`}>
                              <button className="px-10 py-5 bg-slate-900 rounded-3xl text-white text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-slate-900/20 hover:bg-black transition-all flex items-center justify-center gap-4 active:scale-95 group">Fill Refund Form <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7-7 7" /></svg></button>
                           </Link>
                          </div>
                        )}
                    </div>
                 </div>

                 {/* Desktop Details & Timeline Grid */}
                 <div className="grid grid-cols-2 gap-6 items-start">
                    <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 flex flex-col h-full">
                       <div className="flex items-center gap-3 mb-8">
                          <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Order Details</h3>
                       </div>

                       <div className="space-y-6 flex-1">
                         {[
                           { label: "Product Code", value: order.productCode, icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
                           { label: "AspireMint ID", value: order.aspireMintId, icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg> },
                           { label: "Refund Amount", value: `₹${order.amount}`, icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                           { label: "Phone", value: order.buyer?.mobile || "N/A", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg> },
                         ].map((item, idx) => (
                           <div key={idx} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-[20px] border border-slate-100/50 hover:bg-slate-50 transition-colors group">
                              <div className="flex items-center gap-4">
                                 <div className="h-9 w-9 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                    {item.icon}
                                 </div>
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                              </div>
                              <span className={`text-xs font-black uppercase ${item.label === 'Refund Amount' ? 'text-blue-600' : 'text-slate-900'}`}>
                                 {item.value}
                              </span>
                           </div>
                         ))}
                       </div>
                      
                      <div className="mt-8 pt-6 border-t border-slate-50">
                         <div className="flex items-center gap-4 p-4 bg-slate-900 rounded-[32px] shadow-2xl shadow-slate-900/10">
                            <div className="h-12 w-12 rounded-full border-2 border-slate-800 p-1">
                               <div className="h-full w-full rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-xs">
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                               </div>
                            </div>
                            <div className="flex flex-col">
                               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Mediator</span>
                               <span className="text-sm font-black text-white uppercase tracking-tight">{order.mediator?.name || "Pending Selection"}</span>
                            </div>
                         </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 h-full relative overflow-hidden">
                      <div className="absolute top-0 right-0 h-64 w-64 bg-emerald-500/5 blur-[80px] rounded-full -mr-32 -mt-32" />
                      <div className="flex items-center gap-3 mb-10 relative z-10">
                         <div className="h-10 w-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                         </div>
                         <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Tracker</h3>
                      </div>

                      <OrderTimeline 
                        status={order.status}
                        createdAt={order.createdAt}
                        updatedAt={order.updatedAt}
                        refundSubmittedAt={order.refundDetails?.submittedAt}
                        paymentDetails={order.paymentDetails}
                      />
                    </div>
                 </div>
               </div>

               {/* --- RESTRUCTURED NATIVE APP MOBILE VIEW --- */}
               <div className="md:hidden space-y-4 pb-28">
                  {/* Digital Pass Card */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[32px] p-6 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10" />
                     <div className="flex justify-between items-start mb-6 relative z-10">
                        <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${getStatusColor(order.status).replace(/shadow-[a-z0-9-/]+/g, '')} bg-white/20 backdrop-blur-md border border-white/10`}>
                           {order.status.replace(/_/g, " ")}
                        </span>
                        <div className="text-right">
                           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Refund Amount</p>
                           <p className="text-xl font-black tracking-tight text-emerald-400">₹{order.amount}</p>
                        </div>
                     </div>
                     
                     <div className="relative z-10">
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">ASPIREMINT ID</p>
                       <h2 className="text-3xl font-black uppercase tracking-tighter mb-1 break-all">{order.aspireMintId}</h2>
                       <p className="text-[10px] font-bold text-slate-300 tracking-wide">{order.productCode}</p>
                     </div>
                     
                     <div className="mt-8 pt-5 border-t border-white/10 flex justify-between items-center relative z-10">
                        <div>
                           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Registered Date</p>
                           <p className="text-[11px] font-bold uppercase mt-0.5">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Assigned Mediator</p>
                           <p className="text-[11px] font-bold uppercase mt-0.5">{order.mediator?.name || "Pending"}</p>
                        </div>
                     </div>
                  </div>

                  {/* Tracking Timeline Component */}
                  <div className="bg-slate-50/50 rounded-[32px] p-6 border border-slate-100">
                     <div className="flex items-center gap-3 mb-8">
                        <div className="h-8 w-8 rounded-xl bg-blue-100/50 flex items-center justify-center text-blue-600">
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Live Tracking</h3>
                     </div>
                     <OrderTimeline 
                       status={order.status}
                       createdAt={order.createdAt}
                       updatedAt={order.updatedAt}
                       refundSubmittedAt={order.refundDetails?.submittedAt}
                       paymentDetails={order.paymentDetails}
                     />
                  </div>

                  {/* Sticky Mobile Actions */}
                  {order.status === "REFUND_FORM_PENDING" && (
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-slate-100 z-[100] flex gap-3 pb-safe">
                       <button 
                         onClick={handleCancelOrder}
                         className="flex-1 py-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                       >
                          Cancel
                       </button>
                       <Link href={`/dashboard/refunds/fill/${order._id}`} className="flex-[2]">
                          <button className="w-full py-4 bg-slate-900 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 active:scale-95 transition-all">
                             Fill Form
                             <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7-7 7" /></svg>
                          </button>
                       </Link>
                    </div>
                  )}
               </div>
            </motion.div>
          ) : (
            <motion.div 
               key="notfound"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-white rounded-[40px] p-20 shadow-sm border border-slate-100 text-center space-y-4"
            >
               <div className="h-20 w-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
               </div>
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Null Search Result</h3>
               <p className="text-slate-400 max-w-sm mx-auto text-sm">We couldn't locate any deal associated with ID <span className="text-slate-900 font-bold">{searchId}</span>. Please verify the code and try again.</p>
               <button onClick={() => { setOrder(null); setHasSearched(false); }} className="mt-8 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Clear Diagnostics</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Link back to History */}
        <div className="text-center pt-8">
           <Link href="/dashboard/deals" className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Return to Ledger Registry
           </Link>
        </div>

      </div>
    </div>
  );
}
