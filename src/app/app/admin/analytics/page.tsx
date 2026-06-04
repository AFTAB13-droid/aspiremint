"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { 
  TrendingUp, TrendingDown, Users, ShoppingBag, 
  RotateCcw, XCircle, ShieldAlert, Trophy, Search, 
  Sparkles, Filter, Calendar, RefreshCw, Ban, UserCheck, LayoutDashboard, Wallet, BrainCircuit, MessageSquare, CheckCircle2, ChevronRight, Activity, Zap, ArrowRight, Layers, DollarSign, PieChart as PieIcon, BarChart3, Package, Info, History, Briefcase, Clock
} from "lucide-react";
import toast from "react-hot-toast";
import { parseAIQuery, AIQueryResult } from "@/lib/analytics/ai-parser";
import { Skeleton } from "@/components/ui/Skeleton";
import { format } from "date-fns";

type AnalyticsTab = 'OVERVIEW' | 'FINANCIALS' | 'EARNINGS' | 'LEADERBOARD' | 'AI_COMMAND';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [earningsData, setEarningsData] = useState<any>(null);
  const [earningsPeriod, setEarningsPeriod] = useState<'day' | 'week' | 'month' | 'all'>('month');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('OVERVIEW');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [aiQuery, setAiQuery] = useState("");
  const [aiResult, setAiResult] = useState<AIQueryResult | null>(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    if (activeTab === 'EARNINGS') {
      fetchEarnings();
    } else {
      fetchAnalytics(true);
    }
  }, [activeTab, earningsPeriod, selectedMonth, selectedYear]);

  useEffect(() => {
    if (data && activeTab !== 'EARNINGS') fetchAnalytics(false);
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (!aiQuery.trim()) {
      setAiResult(null);
    }
  }, [aiQuery]);

  const fetchAnalytics = async (isInitial: boolean) => {
    if (isInitial) setLoading(true);
    else setIsRefreshing(true);
    
    try {
      const res = await fetch(`/api/admin/analytics?month=${selectedMonth}&year=${selectedYear}`);
      const json = await res.json();
      if (json.success) setData(json.data);
      else toast.error(json.message);
    } catch (err) {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/earnings?period=${earningsPeriod}&month=${selectedMonth}&year=${selectedYear}`);
      const json = await res.json();
      if (json.success) setEarningsData(json.data);
      else toast.error(json.message);
    } catch (err) {
      toast.error("Failed to load earnings data");
    } finally {
      setLoading(false);
    }
  };

  const handleAIQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    
    setIsProcessingAI(true);
    setAiResult(null);
    
    setTimeout(() => {
      const result = parseAIQuery(aiQuery);
      setAiResult(result);
      
      if (result.view === 'leaderboard') setActiveTab('LEADERBOARD');
      else if (result.view === 'financials') setActiveTab('FINANCIALS');
      
      toast.success("Intelligence Processed");
      setIsProcessingAI(false);
    }, 1500);
  };

  const handleUserAction = async (userId: string, action: 'RESTRICT' | 'BAN' | 'RESTORE') => {
    const loadingId = toast.loading("Updating user status...");
    try {
      const body: any = {};
      if (action === 'RESTRICT') body.isActive = false;
      if (action === 'BAN') body.isTerminated = true;
      if (action === 'RESTORE') { body.isActive = true; body.isTerminated = false; }

      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (json.success) {
        toast.success("User updated successfully", { id: loadingId });
        fetchAnalytics(false);
      } else {
        toast.error(json.message, { id: loadingId });
      }
    } catch (err) {
      toast.error("Action failed", { id: loadingId });
    }
  };

  if (loading && !data && !earningsData) return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      <Skeleton className="h-12 w-1/3 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
      </div>
      <Skeleton className="h-[500px] w-full rounded-[40px]" />
    </div>
  );

  return (
    <div className="p-4 lg:p-8 bg-slate-50 min-h-screen pb-20">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigation Area */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-3 lg:gap-4 overflow-x-auto pb-2 lg:pb-0">
            <div className="flex bg-white p-1.5 rounded-[22px] shadow-xl shadow-slate-200/50 border border-slate-100 flex-shrink-0">
              <TabButton active={activeTab === 'OVERVIEW'} onClick={() => setActiveTab('OVERVIEW')} icon={<LayoutDashboard className="w-3.5 h-3.5" />} label="Overview" />
              <TabButton active={activeTab === 'FINANCIALS'} onClick={() => setActiveTab('FINANCIALS')} icon={<Wallet className="w-3.5 h-3.5" />} label="Financials" />
              <TabButton active={activeTab === 'EARNINGS'} onClick={() => setActiveTab('EARNINGS')} icon={<DollarSign className="w-3.5 h-3.5" />} label="Earnings" />
              <TabButton active={activeTab === 'LEADERBOARD'} onClick={() => setActiveTab('LEADERBOARD')} icon={<Trophy className="w-3.5 h-3.5" />} label="Ranking" />
              <TabButton active={activeTab === 'AI_COMMAND'} onClick={() => setActiveTab('AI_COMMAND')} icon={<BrainCircuit className="w-3.5 h-3.5" />} label="AI Center" />
            </div>

            <div className="flex items-center gap-2">
              <div className="relative group">
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="appearance-none bg-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-100 shadow-xl outline-none cursor-pointer hover:bg-slate-50 transition-all pr-8"
                >
                  {months.map((m, idx) => <option key={m} value={idx}>{m}</option>)}
                </select>
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-slate-400 pointer-events-none" />
              </div>

              <div className="relative group">
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="appearance-none bg-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-100 shadow-xl outline-none cursor-pointer hover:bg-slate-50 transition-all pr-8"
                >
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-slate-400 rotate-90 pointer-events-none" />
              </div>
            </div>

            <button onClick={() => activeTab === 'EARNINGS' ? fetchEarnings() : fetchAnalytics(false)} className={`h-10 w-10 flex-shrink-0 flex items-center justify-center bg-white rounded-2xl shadow-lg border border-slate-100 hover:bg-slate-50 transition-all ${isRefreshing ? 'opacity-50' : ''}`}>
              <RefreshCw className={`w-4 h-4 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic tracking-[0.2em]">Platform Intelligence Stream</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'OVERVIEW' && data && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard title="Total Orders" value={data.summary.totalOrders} icon={<ShoppingBag />} color="blue" delay={0.1} />
                  <StatCard title="Total Revenue" value={`₹${data.summary.totalRevenue.toLocaleString()}`} icon={<TrendingUp />} color="emerald" trend="+12.5%" delay={0.2} />
                  <StatCard title="Total Refunds" value={`₹${data.summary.totalRefunds.toLocaleString()}`} icon={<RotateCcw />} color="rose" trend="+3.2%" trendDown delay={0.3} />
                  <StatCard title="Cancellations" value={data.summary.totalCancellations} icon={<XCircle />} color="amber" delay={0.4} />
                </div>

                <div className="bg-white rounded-[40px] p-8 shadow-2xl shadow-slate-200/40 border border-slate-50">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight italic flex items-center gap-3">ORDER RISK INDICATOR</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">High cancellation threshold analysis</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                          <th className="pb-4 pl-4">USER IDENTITY</th>
                          <th className="pb-4">TOTAL ORDERS</th>
                          <th className="pb-4">CANCEL RATE</th>
                          <th className="pb-4">RISK STATUS</th>
                          <th className="pb-4 pr-4 text-right">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {data.userRiskData.slice(0, 8).map((user: any) => (
                          <tr key={user._id} className="hover:bg-slate-50/50 transition-all">
                            <td className="py-5 pl-4 font-black text-xs text-slate-900 uppercase">{user.name}</td>
                            <td className="py-5 text-xs font-black text-slate-500">{user.totalOrders}</td>
                            <td className="py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-20 bg-slate-100 h-1 rounded-full overflow-hidden">
                                  <div className={`h-full ${user.risk === 'HIGH' ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${user.cancelRate}%` }} />
                                </div>
                                <span className="text-[10px] font-black text-slate-400">{user.cancelRate.toFixed(1)}%</span>
                              </div>
                            </td>
                            <td className="py-5">
                               <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${user.risk === 'HIGH' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>{user.risk}</span>
                            </td>
                            <td className="py-5 pr-4 text-right">
                               <button onClick={() => handleUserAction(user._id, user.isTerminated ? 'RESTORE' : 'BAN')} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${user.isTerminated ? 'bg-emerald-500 text-white shadow-lg' : 'bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white'}`}>
                                 {user.isTerminated ? 'RESTORE' : 'BAN USER'}
                               </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'FINANCIALS' && data && (
              <div className="space-y-8">
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 bg-white rounded-[48px] p-8 lg:p-10 shadow-2xl border border-slate-50 relative overflow-hidden">
                      {isRefreshing && <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-[48px]"><RefreshCw className="w-8 h-8 text-blue-600 animate-spin" /></div>}
                      <div className="absolute top-0 right-0 h-40 w-40 bg-blue-50/30 rounded-full blur-3xl -mr-20 -mt-20" />
                      <div className="flex items-center justify-between mb-10 relative z-10">
                         <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic flex items-center gap-3"><Activity className="w-6 h-6 text-blue-600" /> Operational Metrics</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Growth velocity for {months[selectedMonth]}</p>
                         </div>
                      </div>
                      <div className="h-[380px] relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={data.chartData}>
                            <defs>
                              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                            <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 900 }} />
                            <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                            <Area name="Revenue (₹)" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={5} fillOpacity={1} fill="url(#colorRev)" />
                            <Area name="New Orders" type="monotone" dataKey="newOrders" stroke="#8b5cf6" strokeWidth={3} fill="none" strokeDasharray="5 5" />
                            <Area name="Completed Orders" type="monotone" dataKey="completedOrders" stroke="#10b981" strokeWidth={3} fill="none" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="lg:col-span-4 bg-slate-900 rounded-[48px] p-10 shadow-2xl flex flex-col justify-between overflow-hidden relative group">
                       {isRefreshing && <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-[48px]"><RefreshCw className="w-8 h-8 text-blue-400 animate-spin" /></div>}
                       <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-indigo-600/10 opacity-50" />
                       <div className="relative z-10">
                          <h3 className="text-lg font-black text-white uppercase tracking-tight italic flex items-center gap-3"><DollarSign className="w-5 h-5 text-emerald-400" /> Capital Flow</h3>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Payouts vs Platform Retention</p>
                       </div>
                       <div className="h-[240px] relative z-10 my-8">
                          <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                                <Pie data={data.financialFlow} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                                   {data.financialFlow.map((entry: any, index: number) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                   ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', backgroundColor: '#0f172a', color: '#fff', fontSize: '10px', fontWeight: 900 }} />
                             </PieChart>
                          </ResponsiveContainer>
                       </div>
                       <div className="space-y-4 relative z-10">
                          {data.financialFlow.map((item: any, idx: number) => (
                             <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-[24px] border border-white/5 group-hover:bg-white/10 transition-all">
                                <div className="flex items-center gap-3">
                                   <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.name}</span>
                                </div>
                                <span className="text-sm font-black text-white">₹{item.value.toLocaleString()}</span>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4 bg-white rounded-[40px] p-8 shadow-xl border border-slate-50 flex flex-col">
                       <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight italic flex items-center gap-3 mb-8"><Briefcase className="w-5 h-5 text-blue-600" /> Profitability Matrix</h3>
                       <div className="space-y-6 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                          {data.brandMatrix.map((brand: any, idx: number) => (
                             <div key={idx} className="p-5 bg-slate-50 rounded-[32px] border border-slate-100 group hover:bg-blue-600 transition-all duration-500">
                                <div className="flex items-center justify-between mb-4">
                                   <h4 className="text-xs font-black text-slate-900 uppercase italic group-hover:text-white">{brand.name}</h4>
                                   <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full group-hover:bg-white/20 group-hover:text-white">{brand.profitMargin.toFixed(1)}% MARGIN</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                   <div><p className="text-[8px] font-black text-slate-400 uppercase group-hover:text-white/60">NET PROFIT</p><p className="text-sm font-black text-slate-900 group-hover:text-white tracking-tighter">₹{brand.netProfit.toLocaleString()}</p></div>
                                   <div className="text-right"><p className="text-[8px] font-black text-slate-400 uppercase group-hover:text-white/60">REFUND LOSS</p><p className="text-sm font-black text-rose-500 group-hover:text-white/90">₹{brand.refunds.toLocaleString()}</p></div>
                                </div>
                                <div className="mt-3 h-1 w-full bg-slate-200 rounded-full overflow-hidden group-hover:bg-white/20"><div className="h-full bg-blue-500 group-hover:bg-white transition-all" style={{ width: `${brand.profitMargin}%` }} /></div>
                             </div>
                          ))}
                       </div>
                    </div>

                    <div className="lg:col-span-5 bg-white rounded-[40px] p-8 shadow-xl border border-slate-50 overflow-hidden relative">
                       {/* INDIVIDUAL REFRESH OVERLAY FOR THIS CARD */}
                       {isRefreshing && (
                          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center rounded-[40px]">
                             <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
                             <p className="mt-4 text-[10px] font-black text-blue-600 uppercase tracking-widest">Updating Intensity...</p>
                          </div>
                       )}
                       
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                          <div>
                             <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight italic flex items-center gap-3"><Zap className="w-5 h-5 text-amber-500" /> Profit Density</h3>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Transaction intensity analysis</p>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-7 md:grid-cols-10 lg:grid-cols-15 xl:grid-cols-31 gap-2">
                          {data.heatmap.map((day: any, idx: number) => (
                             <motion.div 
                                key={idx}
                                whileHover={{ scale: 1.1, zIndex: 10 }}
                                style={{ 
                                  backgroundColor: day.intensity > 0 ? `rgba(59, 130, 246, ${Math.min(1, 0.2 + (day.intensity / 5))})` : '#f8fafc',
                                  boxShadow: day.intensity > 2 ? '0 10px 20px rgba(59, 130, 246, 0.15)' : 'none'
                                }}
                                className="aspect-square rounded-xl flex items-center justify-center border border-slate-100 group relative cursor-pointer"
                             >
                                <span className={`text-[9px] font-black ${day.intensity > 1 ? 'text-white' : 'text-slate-300'}`}>{day.day}</span>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-3 bg-slate-900 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                                   <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">{day.date}</p>
                                   <div className="space-y-1">
                                      <div className="flex justify-between text-[10px] font-black text-white italic"><span>Orders:</span><span>{day.intensity}</span></div>
                                      <div className="flex justify-between text-[10px] font-black text-emerald-400 italic"><span>Revenue:</span><span>₹{day.revenue.toLocaleString()}</span></div>
                                   </div>
                                   <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
                                </div>
                             </motion.div>
                          ))}
                       </div>
                    </div>

                    <div className="lg:col-span-3 bg-slate-50 rounded-[40px] p-8 shadow-inner border border-slate-100 flex flex-col">
                       <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight italic flex items-center gap-3 mb-6"><History className="w-5 h-5 text-slate-400" /> Live Ticker</h3>
                       <div className="space-y-4 flex-1 overflow-hidden relative">
                          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-50 to-transparent z-10 pointer-events-none" />
                          <div className="space-y-3">
                             {data.recentTransactions.map((tx: any, idx: number) => (
                                <div key={tx._id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                                   <div className={`h-8 w-8 rounded-full flex items-center justify-center ${tx.type === 'REFUND' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                      {tx.type === 'REFUND' ? <RotateCcw size={14} /> : <CheckCircle2 size={14} />}
                                   </div>
                                   <div className="flex-1 min-w-0">
                                      <p className="text-[10px] font-black text-slate-900 uppercase truncate italic">{tx.user}</p>
                                      <p className="text-[8px] font-black text-slate-400 uppercase">{format(new Date(tx.createdAt), 'HH:mm')} • {tx.brand}</p>
                                   </div>
                                   <p className="text-xs font-black text-slate-900 tracking-tighter italic">₹{tx.amount}</p>
                                </div>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'EARNINGS' && earningsData && (
              <div className="space-y-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                   <div>
                      <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Profit Engine</h2>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Net platform yields for <span className="text-blue-600 underline underline-offset-4 decoration-2">{earningsPeriod.toUpperCase()}</span></p>
                   </div>

                   <div className="flex p-1.5 bg-white rounded-[22px] shadow-xl shadow-slate-200/50 border border-slate-100 self-start">
                      {[
                        { id: 'day', label: 'Today' },
                        { id: 'week', label: 'Week' },
                        { id: 'month', label: 'Month' },
                        { id: 'all', label: 'All Time' }
                      ].map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setEarningsPeriod(p.id as any)}
                          className={`px-6 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${earningsPeriod === p.id ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                        >
                          {p.label}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: `${earningsPeriod === 'all' ? 'Total' : earningsPeriod.charAt(0).toUpperCase() + earningsPeriod.slice(1)} Profit`, value: earningsData.summary.periodTotal, icon: <Zap />, color: "indigo", delay: 0.1 },
                    { label: "Daily Baseline", value: earningsData.summary.daily, icon: <Activity />, color: "blue", delay: 0.2 },
                    { label: "Monthly Snapshot", value: earningsData.summary.monthly, icon: <BarChart3 />, color: "purple", delay: 0.3 },
                    { label: "Platform Total", value: earningsData.summary.total, icon: <DollarSign />, color: "emerald", delay: 0.4 }
                  ].map((stat, idx) => (
                    <StatCard key={idx} title={stat.label} value={`₹${stat.value.toLocaleString()}`} icon={stat.icon} color={stat.color} delay={stat.delay} />
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-8 bg-white p-10 rounded-[48px] shadow-2xl shadow-slate-200/40 border border-slate-50">
                     <div className="flex items-center justify-between mb-10">
                        <div>
                          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Performance Vector</h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Chronological Profit distribution</p>
                        </div>
                        <div className="h-10 px-4 bg-slate-50 rounded-xl flex items-center gap-2 border border-slate-100">
                           <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                           <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Live Ledger</span>
                        </div>
                     </div>
                     <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={earningsData.chartData.length > 0 ? earningsData.chartData : [{ date: format(new Date(), 'yyyy-MM-dd'), value: 0 }]}>
                              <defs>
                                 <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/><stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/></linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }} tickFormatter={(str) => format(new Date(str), 'dd MMM')} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }} />
                              <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)' }} labelStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: '#64748b' }} />
                              <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={5} fillOpacity={1} fill="url(#colorProfit)" />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-4 bg-white p-10 rounded-[48px] shadow-2xl shadow-slate-200/40 border border-slate-50 flex flex-col">
                     <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic mb-8">Brand Portfolio</h3>
                     <div className="flex-1 overflow-y-auto space-y-6 pr-2 -mr-2 custom-scrollbar">
                        {earningsData.brandEarnings.length === 0 ? (
                          <div className="py-20 text-center opacity-30"><Package className="w-12 h-12 mx-auto mb-4" /><p className="text-[10px] font-black uppercase tracking-widest">No Asset Data Detected</p></div>
                        ) : (
                          earningsData.brandEarnings.map((brand: any, idx: number) => (
                            <div key={idx} className="group relative">
                              <div className="flex items-center justify-between p-6 rounded-[32px] bg-slate-50 border border-slate-100 group-hover:bg-slate-900 transition-all duration-500 shadow-sm hover:shadow-xl hover:shadow-slate-200">
                                <div className="flex items-center gap-4">
                                  <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-xs font-black text-slate-900 group-hover:rotate-12 transition-transform shadow-inner">
                                    {brand.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-black text-slate-900 uppercase truncate max-w-[120px] group-hover:text-white transition-colors">{brand.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-500">{brand.count} Orders Captured</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-black text-indigo-600 group-hover:text-emerald-400 transition-colors">₹{brand.profit.toLocaleString()}</p>
                                  <button 
                                    onClick={() => setSelectedBrand(brand)}
                                    className="mt-2 text-[9px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-500 flex items-center gap-1 group-hover:text-white transition-colors"
                                  >
                                    View Full Details <ChevronRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                     </div>
                  </motion.div>
                </div>
              </div>
            )}

            {activeTab === 'LEADERBOARD' && data && (
              <div className="space-y-12">
                <div className="bg-white rounded-[40px] p-8 lg:p-16 shadow-2xl shadow-slate-200/40 border border-slate-50 relative overflow-hidden">
                  <div className="text-center mb-16 relative z-10"><h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Top Specialists</h3></div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 relative z-10 items-end max-w-5xl mx-auto">
                    {data.mediatorLeaderboard.slice(0, 3).map((med: any, idx: number) => (
                      <div key={med._id} className={`flex flex-col items-center group ${idx === 0 ? 'order-1 lg:order-2 lg:scale-110 mb-10' : idx === 1 ? 'order-2 lg:order-1' : 'order-3'}`}>
                        <div className="relative mb-8"><div className={`h-32 w-32 rounded-[48px] overflow-hidden shadow-2xl transition-all duration-700 group-hover:rotate-6 ${idx === 0 ? 'ring-8 ring-amber-400/20 p-1.5 bg-white' : 'ring-4 ring-slate-100 p-1 bg-white'}`}>{med.profileImage ? <img src={med.profileImage} className="w-full h-full object-cover rounded-[40px]" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-3xl font-black text-slate-300 uppercase">{med.name.charAt(0)}</div>}</div></div>
                        <div className="text-center w-full"><h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2 italic">{med.name}</h4><div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest inline-block">{med.score} POINTS</div></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'AI_COMMAND' && data && (
              <div className="max-w-5xl mx-auto space-y-12">
                 <div className="text-center space-y-4">
                    <div className="h-24 w-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[36px] flex items-center justify-center text-white mx-auto shadow-2xl shadow-blue-200 relative group"><BrainCircuit className="w-12 h-12 group-hover:scale-110 transition-transform" /></div>
                    <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Intelligence Command</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] max-w-md mx-auto leading-relaxed">Search Orders, Users, or Live Stocks instantly.</p>
                 </div>

                 <form onSubmit={handleAIQuery} className="relative">
                    <div className="absolute inset-0 bg-blue-600/10 blur-[120px] rounded-full scale-110 opacity-50" />
                    <div className="relative flex bg-white rounded-[48px] p-3 shadow-2xl border border-slate-100 ring-4 ring-blue-50/50">
                       <div className="h-16 w-16 flex items-center justify-center text-blue-600">{isProcessingAI ? <RefreshCw className="w-8 h-8 animate-spin" /> : <Sparkles className="w-8 h-8 drop-shadow-blue" />}</div>
                       <input value={aiQuery} onChange={(e) => setAiQuery(e.target.value)} placeholder="Ask: 'Stocks of Apple', 'How many slots left for Samsung?', 'Revenue last 7 days'..." className="flex-1 bg-transparent border-none outline-none text-lg font-bold text-slate-800 px-4 placeholder:text-slate-300" />
                       <button type="submit" className="h-16 px-12 bg-blue-600 text-white rounded-[40px] text-xs font-black uppercase tracking-widest shadow-2xl hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all">EXECUTE QUERY</button>
                    </div>
                 </form>

                 <AnimatePresence mode="wait">
                   {aiResult && (
                     <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 rounded-[56px] p-12 shadow-2xl relative overflow-hidden group">
                       <div className="absolute top-0 right-0 h-64 w-64 bg-blue-500/10 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:scale-150 transition-all duration-1000" />
                       <div className="flex flex-col lg:flex-row gap-12 relative z-10">
                          <div className="flex-1 space-y-8">
                             <div className="flex items-center gap-4">
                                <div className="h-14 w-14 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20"><Zap className="w-7 h-7" /></div>
                                <div><h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Engine Results</h3><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Intelligence Match Found</p></div>
                             </div>
                             <div className="p-8 bg-white/5 rounded-[40px] border border-white/5 space-y-4">
                                <p className="text-blue-100/90 text-lg font-bold leading-relaxed">{aiResult.summary}</p>
                                <div className="flex flex-wrap gap-2">{aiResult.insights?.map((insight: string, idx: number) => (<div key={idx} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-[10px] font-black text-slate-400 uppercase border border-white/5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> {insight}</div>))}</div>
                             </div>
                             {aiResult.metric === 'stocks' && (
                               <div className="space-y-6">
                                  {data.stockData.filter((s: any) => !aiResult.filterValue || s.brand.toLowerCase() === aiResult.filterValue.toLowerCase()).map((stock: any) => (
                                    <div key={stock.brand} className="bg-white/5 rounded-[32px] p-6 border border-white/5">
                                       <div className="flex items-center justify-between mb-6">
                                          <div className="flex items-center gap-3"><Package className="w-5 h-5 text-blue-400" /><h4 className="text-lg font-black text-white uppercase italic">{stock.brand}</h4></div>
                                          <div className="px-4 py-1 bg-blue-600 text-[10px] font-black text-white rounded-full uppercase">Stock Health: Good</div>
                                       </div>
                                       <div className="grid grid-cols-3 gap-4 mb-6">
                                          <div className="p-4 bg-white/5 rounded-2xl"><p className="text-[8px] font-black text-slate-500 uppercase mb-1">Total Slots</p><p className="text-sm font-black text-white">{stock.totalInventory}</p></div>
                                          <div className="p-4 bg-blue-600/20 rounded-2xl border border-blue-600/30"><p className="text-[8px] font-black text-blue-400 uppercase mb-1">Remaining</p><p className="text-sm font-black text-white">{stock.remainingInventory}</p></div>
                                          <div className="p-4 bg-emerald-600/20 rounded-2xl border border-emerald-600/30"><p className="text-[8px] font-black text-emerald-400 uppercase mb-1">Completed</p><p className="text-sm font-black text-white">{stock.completedInventory}</p></div>
                                       </div>
                                       <div className="space-y-3">
                                          {stock.products.slice(0, 3).map((p: any) => (
                                            <div key={p.code} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                               <div className="flex-1 min-w-0 pr-4"><p className="text-[10px] font-bold text-white truncate">{p.name}</p><p className="text-[8px] font-black text-slate-500 uppercase mt-0.5">{p.code}</p></div>
                                               <div className="flex items-center gap-4 shrink-0">
                                                  <div className="text-right"><p className="text-[8px] font-black text-blue-400 uppercase">Left</p><p className="text-xs font-black text-white">{p.remaining}</p></div>
                                                  <div className="h-8 w-px bg-white/10" /><div className="text-right"><p className="text-[8px] font-black text-emerald-400 uppercase">Done</p><p className="text-xs font-black text-white">{p.completed}</p></div>
                                               </div>
                                            </div>
                                          ))}
                                       </div>
                                    </div>
                                  ))}
                               </div>
                             )}
                          </div>
                          <div className="w-full lg:w-80 space-y-6 shrink-0">
                             <div className="p-8 bg-blue-600 rounded-[40px] shadow-2xl text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 h-20 w-20 bg-white/10 blur-xl rounded-full" /><p className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 opacity-70">METRIC DETECTED</p>
                                <h4 className="text-4xl font-black italic tracking-tighter mb-2 uppercase">{aiResult.metric}</h4>
                             </div>
                             {aiResult.metric !== 'stocks' && (
                                <div className="h-[200px] bg-white/5 rounded-[40px] p-6 border border-white/5">
                                   <ResponsiveContainer width="100%" height="100%"><AreaChart data={data.chartData}><Area type="monotone" dataKey={aiResult.metric === 'revenue' ? 'revenue' : 'orders'} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} /></AreaChart></ResponsiveContainer>
                                </div>
                             )}
                          </div>
                       </div>
                     </motion.div>
                   )}
                 </AnimatePresence>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-10">
                    <DeepSuggestion onClick={setAiQuery} text="Stocks of Apple" icon={<Package className="w-4 h-4" />} />
                    <DeepSuggestion onClick={setAiQuery} text="Samsung inventory report" icon={<Layers className="w-4 h-4" />} />
                    <DeepSuggestion onClick={setAiQuery} text="Revenue for last 7 days" icon={<TrendingUp className="w-4 h-4" />} />
                    <DeepSuggestion onClick={setAiQuery} text="Top 5 risky users" icon={<ShieldAlert className="w-4 h-4" />} />
                 </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Brand Details Intelligence Modal */}
        <AnimatePresence>
          {selectedBrand && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8 bg-slate-950/60 backdrop-blur-md">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: 20 }}
                 className="w-full max-w-4xl bg-white rounded-[48px] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] overflow-hidden border border-white/20 flex flex-col max-h-[90vh]"
               >
                  <div className="p-8 lg:p-12 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                     <div className="flex items-center gap-6">
                        <div className="h-20 w-20 bg-white rounded-[32px] shadow-2xl flex items-center justify-center text-2xl font-black text-slate-900 border border-slate-100">
                          {selectedBrand.name.charAt(0)}
                        </div>
                        <div>
                           <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">{selectedBrand.name}</h3>
                           <div className="flex items-center gap-4 mt-2">
                              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest">{selectedBrand.count} Total Orders</span>
                              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">₹{selectedBrand.profit.toLocaleString()} Total Profit</span>
                           </div>
                        </div>
                     </div>
                     <button onClick={() => setSelectedBrand(null)} className="h-14 w-14 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:rotate-90 transition-all shadow-xl border border-slate-100">
                        <XCircle size={24} />
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
                     <div className="space-y-6">
                        <div className="flex items-center justify-between mb-4">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Chronological Asset Audit</h4>
                           <div className="h-px flex-1 bg-slate-100 mx-6" />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                           {selectedBrand.orders.map((order: any, idx: number) => (
                             <div key={idx} className="flex items-center justify-between p-6 bg-slate-50 rounded-[32px] border border-slate-100 hover:border-blue-400 hover:bg-white transition-all group">
                                <div className="flex items-center gap-6">
                                   <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                                      <ShoppingBag size={20} />
                                   </div>
                                   <div>
                                      <p className="text-sm font-black text-slate-900 uppercase italic">[{order.productCode || 'N/A'}]</p>
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{format(new Date(order.date), 'dd MMM yyyy • HH:mm')}</p>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <p className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">₹{order.profit.toLocaleString()}</p>
                                   <p className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter mt-1">Net Profit</p>
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Verified Transaction Intelligence</p>
                     </div>
                     <button onClick={() => setSelectedBrand(null)} className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Close Audit</button>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2.5 px-6 py-3 rounded-xl transition-all duration-500 ${active ? 'bg-blue-600 text-white shadow-2xl shadow-blue-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function StatCard({ title, value, icon, color, trend, trendDown, delay = 0 }: any) {
  const themes: any = { 
    blue: { primary: "#3b82f6", bg: "from-blue-50 to-white", glow: "rgba(59, 130, 246, 0.5)" },
    emerald: { primary: "#10b981", bg: "from-emerald-50 to-white", glow: "rgba(16, 185, 129, 0.5)" },
    rose: { primary: "#f43f5e", bg: "from-rose-50 to-white", glow: "rgba(244, 63, 94, 0.5)" },
    amber: { primary: "#f59e0b", bg: "from-amber-50 to-white", glow: "rgba(245, 158, 11, 0.5)" },
    indigo: { primary: "#6366f1", bg: "from-indigo-50 to-white", glow: "rgba(99, 102, 241, 0.5)" },
    purple: { primary: "#a855f7", bg: "from-purple-50 to-white", glow: "rgba(168, 85, 247, 0.5)" }
  };
  const theme = themes[color] || themes.blue;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, type: "spring" }}
      whileHover={{ scale: 1.02 }}
      className="relative p-[1px] rounded-[42px] overflow-hidden group shadow-xl"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-200 to-transparent group-hover:via-slate-400 transition-all duration-1000" />
      <div className={`relative bg-white p-8 rounded-[41px] h-full flex flex-col justify-between overflow-hidden`}>
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${theme.bg} rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity`} />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-10">
            <div 
              style={{ backgroundColor: theme.primary, boxShadow: `0 10px 30px ${theme.glow}` }}
              className="h-16 w-16 rounded-3xl flex items-center justify-center text-white transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110"
            >
              {React.cloneElement(icon as React.ReactElement, { size: 28, strokeWidth: 2.5 })}
            </div>
            {trend && (
              <div className={`px-3 py-1.5 rounded-full text-[10px] font-black italic tracking-tighter ${trendDown ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {trend}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
            <h4 className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none">{value}</h4>
          </div>
        </div>
        <div className="absolute bottom-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-slate-100 to-transparent group-hover:via-blue-500/20 transition-all" />
      </div>
    </motion.div>
  );
}

function DeepSuggestion({ text, onClick, icon }: any) {
  return (
    <button onClick={() => onClick(text)} className="p-6 bg-white border border-slate-100 rounded-[36px] text-left hover:border-blue-600 hover:shadow-2xl transition-all group">
      <div className="h-10 w-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all mb-4">{icon}</div>
      <p className="text-[11px] font-bold text-slate-900 leading-tight">"{text}"</p>
    </button>
  );
}
