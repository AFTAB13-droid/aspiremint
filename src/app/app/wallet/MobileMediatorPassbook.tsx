import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, History, FileText, ArrowDownLeft, ArrowUpRight, CheckCircle2, Filter, X } from "lucide-react";
import formatDate from "@/utils/formatDate";

export default function MobileMediatorPassbook({ 
   walletDetails, 
   transactions, 
   activeOrders 
}: { 
   walletDetails: any, 
   transactions: any[], 
   activeOrders: any[] 
}) {
  const [activeTab, setActiveTab] = useState<"PASSBOOK" | "CLAIMS">("PASSBOOK");
  
  // Filters
  const [filterMode, setFilterMode] = useState<"ALL" | "MONTH" | "DATE">("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const isNegative = (walletDetails.netBalance || 0) < 0;
  const displayBalance = Math.abs(walletDetails.netBalance || 0).toLocaleString();

  const filteredTransactions = transactions.filter(tx => {
     if (filterMode === "ALL") return true;
     const txDate = new Date(tx.createdAt);
     if (filterMode === "MONTH" && selectedMonth) {
        const [yyyy, mm] = selectedMonth.split("-");
        return txDate.getFullYear() === parseInt(yyyy) && (txDate.getMonth() + 1) === parseInt(mm);
     }
     if (filterMode === "DATE" && selectedDate) {
        const [yyyy, mm, dd] = selectedDate.split("-");
        return txDate.getFullYear() === parseInt(yyyy) && (txDate.getMonth() + 1) === parseInt(mm) && txDate.getDate() === parseInt(dd);
     }
     return true;
  });

  const filteredOrders = activeOrders.filter(order => {
     if (filterMode === "ALL") return true;
     const oDate = new Date(order.createdAt);
     if (filterMode === "MONTH" && selectedMonth) {
        const [yyyy, mm] = selectedMonth.split("-");
        return oDate.getFullYear() === parseInt(yyyy) && (oDate.getMonth() + 1) === parseInt(mm);
     }
     if (filterMode === "DATE" && selectedDate) {
        const [yyyy, mm, dd] = selectedDate.split("-");
        return oDate.getFullYear() === parseInt(yyyy) && (oDate.getMonth() + 1) === parseInt(mm) && oDate.getDate() === parseInt(dd);
     }
     return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 -mt-4 pb-24">
      
      {/* HEADER CARD - App Style Full Width */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 rounded-b-[40px] p-6 pt-8 text-white relative overflow-hidden shadow-xl"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-fuchsia-500/20 rounded-full blur-2xl -ml-10 -mb-10" />
        
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
               <Wallet className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">My Passbook</p>
               <h1 className="text-sm font-black tracking-tight">{walletDetails.name}</h1>
            </div>
          </div>
          <div className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-bold border border-white/10">
             INR
          </div>
        </div>

        <div className="relative z-10 text-center mb-8">
           <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2">Net Outstanding Balance</p>
           <h2 className="text-5xl font-black tracking-tighter">
              {isNegative ? "-" : ""}₹{displayBalance}
           </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 relative z-10 pt-6 border-t border-white/10">
           <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Active Claims</p>
              <p className="text-base font-black text-white">-₹{(walletDetails.activeOrdersLiability || 0).toLocaleString()}</p>
           </div>
           <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Received</p>
              <p className="text-base font-black text-emerald-400">+₹{(walletDetails.totalPaidByAdmin || 0).toLocaleString()}</p>
           </div>
        </div>
      </motion.div>

      {/* SEGMENTED CONTROL & FILTERS BUTTON */}
      <div className="px-4 mt-6">
         <div className="flex gap-2">
            <div className="flex p-1 bg-white rounded-2xl shadow-sm border border-slate-100 relative flex-1">
               <button 
                  onClick={() => setActiveTab("PASSBOOK")}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all relative z-10 ${activeTab === 'PASSBOOK' ? 'text-white' : 'text-slate-400'}`}
               >
                  <span className="flex items-center justify-center gap-2"><History className="w-3.5 h-3.5" /> Passbook</span>
               </button>
               <button 
                  onClick={() => setActiveTab("CLAIMS")}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all relative z-10 ${activeTab === 'CLAIMS' ? 'text-white' : 'text-slate-400'}`}
               >
                  <span className="flex items-center justify-center gap-2"><FileText className="w-3.5 h-3.5" /> Claims</span>
               </button>
               
               {/* Animated background pill */}
               <motion.div 
                  className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-indigo-600 rounded-xl"
                  initial={false}
                  animate={{ left: activeTab === 'PASSBOOK' ? '4px' : 'calc(50%)' }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
               />
            </div>

            <button 
               onClick={() => setShowFilters(!showFilters)}
               className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${showFilters || filterMode !== "ALL" ? "bg-indigo-600 text-white shadow-md" : "bg-white text-slate-400 border border-slate-100"}`}
            >
               <Filter className="w-4 h-4" />
            </button>
         </div>
      </div>

      {/* FILTER PANEL */}
      <AnimatePresence>
         {showFilters && (
            <motion.div 
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: "auto" }}
               exit={{ opacity: 0, height: 0 }}
               className="overflow-hidden px-4"
            >
               <div className="mt-4 bg-white p-4 rounded-[24px] shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Statement Filters</p>
                     {filterMode !== "ALL" && (
                        <button onClick={() => setFilterMode("ALL")} className="text-[9px] font-bold text-rose-500 flex items-center gap-1">
                           <X className="w-3 h-3" /> Clear
                        </button>
                     )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                     <button 
                        onClick={() => setFilterMode(filterMode === "MONTH" ? "ALL" : "MONTH")}
                        className={`py-2 rounded-xl text-[10px] font-black uppercase transition-colors ${filterMode === "MONTH" ? "bg-indigo-50 text-indigo-600 border border-indigo-200" : "bg-slate-50 text-slate-500"}`}
                     >
                        Monthly
                     </button>
                     <button 
                        onClick={() => setFilterMode(filterMode === "DATE" ? "ALL" : "DATE")}
                        className={`py-2 rounded-xl text-[10px] font-black uppercase transition-colors ${filterMode === "DATE" ? "bg-indigo-50 text-indigo-600 border border-indigo-200" : "bg-slate-50 text-slate-500"}`}
                     >
                        Specific Date
                     </button>
                  </div>

                  {filterMode === "MONTH" && (
                     <div className="mt-3">
                        <input 
                           type="month" 
                           value={selectedMonth}
                           onChange={(e) => setSelectedMonth(e.target.value)}
                           className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                        />
                     </div>
                  )}

                  {filterMode === "DATE" && (
                     <div className="mt-3">
                        <input 
                           type="date" 
                           value={selectedDate}
                           onChange={(e) => setSelectedDate(e.target.value)}
                           className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                        />
                     </div>
                  )}
               </div>
            </motion.div>
         )}
      </AnimatePresence>

      {/* LIST CONTENT */}
      <div className="mt-6">
         <AnimatePresence mode="wait">
            
            {/* PASSBOOK TAB (Continuous List) */}
            {activeTab === "PASSBOOK" && (
               <motion.div 
                  key="passbook"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
               >
                  <div className="bg-white overflow-y-auto shadow-sm border-y border-slate-100 max-h-[55vh]">
                     {filteredTransactions.length > 0 ? (
                        <div className="divide-y divide-slate-100/80">
                           {filteredTransactions.map((tx, i) => {
                              const isCredit = tx.type === "CREDIT";
                              return (
                                 <div key={i} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                       <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${isCredit ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                                          {isCredit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                       </div>
                                       <div className="overflow-hidden">
                                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight truncate max-w-[160px]">{tx.note || "Settlement"}</h4>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 flex items-center gap-1.5 flex-wrap">
                                             {formatDate(tx.createdAt)}
                                             <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                                                By {tx.sender?.name || "System"}
                                             </span>
                                          </p>
                                       </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-2">
                                       <h4 className={`text-[15px] font-black tracking-tighter ${isCredit ? 'text-emerald-500' : 'text-amber-500'}`}>
                                          {isCredit ? "+" : "-"}₹{(tx.amount || 0).toLocaleString()}
                                       </h4>
                                       <p className="text-[8px] font-black uppercase text-slate-300 mt-1 truncate max-w-[70px]">Ref: {tx.referenceId?.slice(-4)}</p>
                                    </div>
                                 </div>
                              );
                           })}
                        </div>
                     ) : (
                        <div className="py-16 flex flex-col items-center justify-center text-center text-slate-300 bg-white">
                           <History className="w-12 h-12 mb-3 opacity-50" />
                           <p className="text-[10px] font-black uppercase tracking-widest">No passbook entries</p>
                        </div>
                     )}
                  </div>
               </motion.div>
            )}

            {/* CLAIMS TAB (Continuous List) */}
            {activeTab === "CLAIMS" && (
               <motion.div 
                  key="claims"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
               >
                  <div className="bg-white overflow-y-auto shadow-sm border-y border-slate-100 max-h-[55vh]">
                     {filteredOrders.length > 0 ? (
                        <div className="divide-y divide-slate-100/80">
                           {filteredOrders.map((order, i) => (
                              <div key={i} className="p-5 hover:bg-slate-50 transition-colors">
                                 <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-50 border-dashed">
                                    <div className="flex items-center gap-3">
                                       <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm">
                                          {order.brandName?.[0] || 'O'}
                                       </div>
                                       <div>
                                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">{order.brandName}</h4>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase">{order.aspireOrderId || order._id.slice(-6)}</p>
                                       </div>
                                    </div>
                                    <div className="text-right">
                                       <span className="px-2 py-1 bg-slate-50 text-slate-600 rounded-md text-[8px] font-black uppercase tracking-widest border border-slate-100">
                                          {order.status.replace(/_/g, ' ')}
                                       </span>
                                    </div>
                                 </div>
                                 <div className="flex justify-between items-end px-1">
                                    <div className="space-y-1">
                                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Order Amount</p>
                                       <p className="text-xs font-black text-slate-800">₹{(order.amount || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="text-right space-y-1">
                                       <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Liability Value</p>
                                       <p className="text-[15px] font-black text-rose-600 font-mono">-₹{(order.totalClaim || 0).toLocaleString()}</p>
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <div className="py-16 flex flex-col items-center justify-center text-center text-slate-300 bg-white">
                           <CheckCircle2 className="w-12 h-12 mb-3 opacity-50" />
                           <p className="text-[10px] font-black uppercase tracking-widest">No active claims found</p>
                        </div>
                     )}
                  </div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>

    </div>
  );
}
