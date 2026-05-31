"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell
} from "recharts";
import { 
  TrendingUp, ShoppingBag, 
  RefreshCw, LayoutDashboard, Wallet, CheckCircle2, Activity, Zap, Package, 
  Clock, DollarSign, Target, Trophy, Medal, Star, Sparkles, ShieldCheck, XCircle, Layers, ArrowRight, ExternalLink, BarChart3, PieChart as PieIcon, Briefcase
} from "lucide-react";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { MobileMediatorAnalytics } from "./MobileMediatorAnalytics";

type MediatorTab = 'OVERVIEW' | 'EARNINGS' | 'INVENTORY' | 'RANKINGS';

export default function MediatorAnalyticsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MediatorTab>('OVERVIEW');

  const isJuhi = session?.user?.name?.toLowerCase().includes("juhi") || false;

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    const checkMobile = () => setIsMobile(window.innerWidth < 1024); // lg breakpoint
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mediator/analytics");
      const json = await res.json();
      if (json.success) setData(json.data);
      else toast.error(json.message);
    } catch (err) {
      toast.error("Failed to load your analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      <Skeleton className="h-12 w-1/3 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
      </div>
      <Skeleton className="h-[500px] w-full rounded-[40px]" />
    </div>
  );

  if (isMobile) {
    return <MobileMediatorAnalytics data={data} onRefresh={fetchAnalytics} isJuhi={isJuhi} />;
  }

  const resolutionData = [
    { name: 'Completed', value: data.orderStats.completed, color: '#10b981' },
    { name: 'Approved', value: data.orderStats.refundApproved, color: '#3b82f6' },
    { name: 'Verification', value: data.orderStats.verification, color: '#f59e0b' },
    { name: 'Rejected', value: data.orderStats.rejected, color: '#ef4444' },
    { name: 'Pending', value: data.orderStats.pending, color: '#94a3b8' },
  ].filter(d => d.value > 0);

  const BRAND_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const hasChartData = data?.performanceChartData?.some((d: any) => d.completed > 0 || d.earnings > 0);
  const hasLoadData = data?.performanceChartData?.some((d: any) => d.total > 0) || false;

  return (
    <div className="p-4 lg:p-8 bg-slate-50 min-h-screen pb-20">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigation Area */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-3 lg:gap-4 overflow-x-auto pb-2 lg:pb-0">
            <div className="flex bg-white p-1.5 rounded-[22px] shadow-xl shadow-slate-200/50 border border-slate-100 flex-shrink-0">
              <TabButton active={activeTab === 'OVERVIEW'} onClick={() => setActiveTab('OVERVIEW')} icon={<LayoutDashboard className="w-3.5 h-3.5" />} label="Overview" />
              {!isJuhi && (
                <TabButton active={activeTab === 'EARNINGS'} onClick={() => setActiveTab('EARNINGS')} icon={<Wallet className="w-3.5 h-3.5" />} label="Earnings" />
              )}
              <TabButton active={activeTab === 'INVENTORY'} onClick={() => setActiveTab('INVENTORY')} icon={<Layers className="w-3.5 h-3.5" />} label="Inventory" />
              <TabButton active={activeTab === 'RANKINGS'} onClick={() => setActiveTab('RANKINGS')} icon={<Trophy className="w-3.5 h-3.5" />} label="My Ranking" />
            </div>
            <button onClick={fetchAnalytics} className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-white rounded-2xl shadow-lg border border-slate-100 hover:bg-slate-50 transition-all">
              <RefreshCw className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic tracking-[0.2em]">Live Intelligence Stream</span>
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
            {activeTab === 'OVERVIEW' && (
              <div className="space-y-8">
                <div className={`grid grid-cols-1 md:grid-cols-2 ${isJuhi ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-6`}>
                  <StatCard title="Orders Handled" value={data.personal.totalOrders} icon={<ShoppingBag />} color="blue" delay={0.1} />
                  {!isJuhi && (
                    <StatCard title="Total Commissions" value={`₹${data.personal.totalCommissions.toLocaleString()}`} icon={<TrendingUp />} color="emerald" trend="+12.5%" delay={0.2} />
                  )}
                  <StatCard title="Global Rank" value={`#${data.ranking.rank}`} icon={<Trophy />} color="amber" delay={0.3} />
                  <StatCard title="Queries Resolved" value={data.personal.queriesResolved} icon={<CheckCircle2 />} color="indigo" delay={0.4} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                   {/* Main Success Area Chart */}
                   <div className="lg:col-span-8 bg-white rounded-[48px] p-8 lg:p-10 shadow-2xl shadow-slate-200/40 border border-slate-50 relative overflow-hidden">
                      <div className="absolute top-0 right-0 h-40 w-40 bg-emerald-50/50 rounded-full blur-3xl -mr-20 -mt-20" />
                      <div className="flex items-center justify-between mb-10 relative z-10">
                         <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic flex items-center gap-3"><CheckCircle2 className="w-6 h-6 text-emerald-600" /> Success Velocity</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Order performance trend for last 14 days</p>
                         </div>
                      </div>
                      
                      <div className="h-[350px] relative z-10">
                        {hasLoadData ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.performanceChartData}>
                              <defs>
                                <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                              <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 900 }} />
                              <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={6} fillOpacity={1} fill="url(#colorSuccess)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full w-full flex flex-col items-center justify-center space-y-4 text-slate-200">
                             <CheckCircle2 className="w-16 h-16 opacity-20" />
                             <p className="text-[11px] font-black uppercase tracking-[0.4em]">Success data stream pending</p>
                          </div>
                        )}
                      </div>
                   </div>

                   {/* Right Side Donut Chart - Portfolio Mix */}
                   <div className="lg:col-span-4 bg-slate-900 rounded-[48px] p-8 lg:p-10 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                      <div className="relative z-10">
                         <h3 className="text-lg font-black text-white uppercase tracking-tight italic flex items-center gap-3"><PieIcon className="w-5 h-5 text-blue-400" /> Resolution Mix</h3>
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Portfolio distribution</p>
                      </div>

                      <div className="h-[250px] relative z-10 my-6">
                         {resolutionData.length > 0 ? (
                           <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                 <Pie data={resolutionData} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                                    {resolutionData.map((entry, index) => (
                                       <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                 </Pie>
                                 <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', backgroundColor: '#0f172a', color: '#fff', fontSize: '10px', fontWeight: 900 }} />
                              </PieChart>
                           </ResponsiveContainer>
                         ) : (
                           <div className="h-full w-full flex items-center justify-center text-slate-700">
                              <PieIcon className="w-12 h-12 opacity-20" />
                           </div>
                         )}
                      </div>

                      <div className="space-y-3 relative z-10">
                         {resolutionData.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.name}</span>
                               </div>
                               <span className="text-xs font-black text-white">{item.value}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'EARNINGS' && (
              <div className="space-y-12">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                       <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic flex items-center gap-4">
                          <DollarSign className="w-10 h-10 text-emerald-600" />
                          Profit Engine
                       </h2>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 ml-14">Specialist yield analysis & live income stream</p>
                    </div>
                    <div className="h-14 px-8 bg-white rounded-[24px] border border-slate-100 shadow-xl flex items-center gap-3">
                       <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Revenue Pipeline Active</span>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <StatCard title="Daily Income" value={`₹${data.personal.dailyEarnings.toLocaleString()}`} icon={<Zap />} color="blue" delay={0.1} />
                    <StatCard title="Weekly Yield" value={`₹${data.personal.weeklyEarnings.toLocaleString()}`} icon={<Activity />} color="emerald" delay={0.2} />
                    <StatCard title="Total Earnings" value={`₹${data.personal.totalCommissions.toLocaleString()}`} icon={<DollarSign />} color="indigo" delay={0.3} />
                 </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 bg-white rounded-[48px] p-8 lg:p-12 shadow-2xl shadow-slate-200/40 border border-slate-50 relative overflow-hidden">
                       <div className="absolute top-0 right-0 h-40 w-40 bg-blue-50/30 rounded-full blur-3xl -mr-20 -mt-20" />
                       <div className="mb-10 relative z-10">
                          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic flex items-center gap-3"><TrendingUp className="w-6 h-6 text-blue-600" /> Yield Velocity</h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Chronological earnings distribution</p>
                       </div>
                       <div className="h-[350px] relative z-10">
                          <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={data.performanceChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 900 }} />
                                <Bar dataKey="earnings" fill="#3b82f6" radius={[12, 12, 0, 0]} barSize={24} />
                             </BarChart>
                          </ResponsiveContainer>
                       </div>
                    </div>

                    <div className="lg:col-span-4 bg-slate-900 rounded-[48px] p-10 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                       <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-indigo-600/10 opacity-50" />
                       <div className="relative z-10">
                          <h3 className="text-lg font-black text-white uppercase tracking-tight italic flex items-center gap-3"><Star className="w-5 h-5 text-amber-400" /> Yield Insights</h3>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Efficiency breakdown</p>
                       </div>
                       
                       <div className="space-y-6 relative z-10">
                          <div className="p-6 bg-white/5 rounded-[32px] border border-white/5">
                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Avg Profit Per Deal</p>
                             <h4 className="text-4xl font-black text-white italic tracking-tighter">₹{(data.personal.totalCommissions / (data.personal.completedOrders || 1)).toFixed(0)}</h4>
                          </div>
                          <div className="p-6 bg-white/5 rounded-[32px] border border-white/5">
                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Success Rate</p>
                             <h4 className="text-4xl font-black text-emerald-400 italic tracking-tighter">{((data.personal.completedOrders / (data.personal.totalOrders || 1)) * 100).toFixed(1)}%</h4>
                          </div>
                       </div>

                       <div className="pt-6 relative z-10 border-t border-white/5">
                          <p className="text-[9px] font-medium text-slate-500 italic leading-relaxed">
                             "Your earnings are automatically calculated upon refund form submission based on administrative protocol offsets."
                          </p>
                       </div>
                    </div>
                 </div>

                 {/* NEW: Brand Performance Breakdown */}
                 <div className="space-y-10">
                    <div>
                       <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic flex items-center gap-4">
                          <Briefcase className="w-8 h-8 text-blue-600" />
                          Brand Performance Breakdown
                       </h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Order counts and individual profit per brand</p>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                       {data.brandEarnings?.map((brand: any, idx: number) => (
                         <motion.div 
                           key={brand.name}
                           initial={{ opacity: 0, x: -20 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ delay: idx * 0.1 }}
                           className="bg-white rounded-[40px] p-8 lg:p-10 shadow-xl border border-slate-50 relative overflow-hidden"
                         >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                               <div className="flex items-center gap-6">
                                  <div className="h-16 w-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 font-black text-2xl shadow-inner border border-blue-100/50">
                                     {brand.name.charAt(0)}
                                  </div>
                                  <div>
                                     <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">{brand.name}</h4>
                                     <div className="flex items-center gap-4 mt-1">
                                        <div className="flex items-center gap-1.5">
                                           <ShoppingBag className="w-3 h-3 text-slate-400" />
                                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{brand.count} Orders</span>
                                        </div>
                                        <div className="h-1 w-1 rounded-full bg-slate-300" />
                                        <div className="flex items-center gap-1.5">
                                           <TrendingUp className="w-3 h-3 text-emerald-500" />
                                           <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">₹{brand.earnings.toLocaleString()} Profit</span>
                                        </div>
                                     </div>
                                  </div>
                               </div>

                               <div className="flex-1 lg:max-w-xl">
                                  <div className="bg-slate-50/50 rounded-[32px] border border-slate-100 p-6">
                                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Activity className="w-3 h-3" /> Recent Transactions
                                     </p>
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {brand.orders.slice(0, 4).map((order: any, oIdx: number) => (
                                          <div key={oIdx} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                             <div className="overflow-hidden">
                                                <p className="text-[10px] font-black text-slate-900 truncate">{order.productCode}</p>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter truncate mt-0.5">{order.id}</p>
                                             </div>
                                             <div className="text-right flex-shrink-0 ml-4">
                                                <p className="text-[11px] font-black text-emerald-600">+₹{order.profit}</p>
                                             </div>
                                          </div>
                                        ))}
                                        {brand.orders.length > 4 && (
                                          <div className="sm:col-span-2 text-center pt-2">
                                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">+ {brand.orders.length - 4} more transactions</p>
                                          </div>
                                        )}
                                     </div>
                                  </div>
                               </div>
                            </div>
                         </motion.div>
                       ))}
                  </div>
               </div>
            </div>
            )}

            {activeTab === 'INVENTORY' && (
              <div className="space-y-12">
                 {/* Inventory Order Status Grid */}
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <div>
                          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Live Order Status</h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Lifecycle distribution of assigned orders</p>
                       </div>
                       <Link href="/dashboard/mediations">
                          <button className="px-6 py-3 bg-blue-600 text-white rounded-[18px] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-900 transition-all shadow-xl shadow-blue-500/10">
                             Open My Activity <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                       </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                       <PortfolioCard icon={<ShieldCheck />} label="Verification" value={data.orderStats.verification} color="amber" delay={0.1} />
                       <PortfolioCard icon={<CheckCircle2 />} label="Refund Approved" value={data.orderStats.refundApproved} color="emerald" delay={0.2} />
                       <PortfolioCard icon={<DollarSign />} label="Completed (Paid)" value={data.orderStats.completed} color="blue" delay={0.3} />
                       <PortfolioCard icon={<XCircle />} label="Rejected" value={data.orderStats.rejected} color="rose" delay={0.4} />
                       <PortfolioCard icon={<Clock />} label="Pending Form" value={data.orderStats.pending} color="slate" delay={0.5} />
                    </div>
                 </div>

                 <div className="h-px bg-slate-100" />

                 {/* Inventory Deal Section */}
                 <div className="space-y-6">
                    <div>
                       <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Assigned Deal Inventory</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time slot tracking for assigned products</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {data.inventoryData.map((deal: any) => (
                         <div key={deal.productCode} className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-50 hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/30 rounded-bl-[80px] -mr-8 -mt-8" />
                            
                            <div>
                               <div className="flex items-center justify-between mb-8 relative z-10">
                                  <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-xl uppercase">{deal.brand.charAt(0)}</div>
                                  <div className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${deal.remaining < 5 ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                                     {deal.remaining < 5 ? 'Low Stock' : 'Active'}
                                  </div>
                               </div>
                               <div className="mb-8 relative z-10">
                                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">{deal.productName}</h4>
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Code: {deal.productCode}</p>
                               </div>
                               <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                                  <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50"><p className="text-[8px] font-black text-slate-500 uppercase mb-1">Total Slots</p><p className="text-sm font-black text-slate-900">{deal.total}</p></div>
                                  <div className="p-4 bg-blue-600/5 rounded-2xl border border-blue-600/10"><p className="text-[8px] font-black text-blue-500 uppercase mb-1">Left</p><p className="text-sm font-black text-blue-600">{deal.remaining}</p></div>
                               </div>
                               <div className="space-y-3 relative z-10 mb-8">
                                  <div className="flex justify-between text-[9px] font-black uppercase text-slate-400"><span>Fill Rate</span><span>{deal.fillRate.toFixed(1)}%</span></div>
                                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${deal.fillRate}%` }} /></div>
                               </div>
                            </div>

                            <Link href="/dashboard/mediations">
                               <button className="w-full h-12 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10 relative z-10">
                                  View Mediations
                                  <ExternalLink className="w-3.5 h-3.5" />
                               </button>
                            </Link>
                         </div>
                       ))}
                       {data.inventoryData.length === 0 && (
                         <div className="col-span-full py-32 text-center border-2 border-dashed border-slate-100 rounded-[48px] bg-white flex flex-col items-center justify-center space-y-12">
                            <div className="h-24 w-24 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-200 shadow-inner">
                               <Package className="w-12 h-12" />
                            </div>
                            <Link href="/dashboard/mediations">
                               <button className="px-12 py-6 bg-slate-900 text-white rounded-[28px] text-sm font-black uppercase tracking-[0.2em] flex items-center gap-4 hover:bg-blue-600 transition-all shadow-2xl shadow-slate-900/30 group">
                                  Open My Activity 
                                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                               </button>
                            </Link>
                         </div>
                       )}
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'RANKINGS' && (
              <div className="max-w-4xl mx-auto py-12">
                 <div className="bg-slate-900 rounded-[64px] p-12 lg:p-20 shadow-2xl shadow-blue-900/20 relative overflow-hidden text-center">
                    <div className="absolute top-0 right-0 h-[500px] w-[500px] bg-blue-600/10 blur-[150px] rounded-full -mr-64 -mt-64" />
                    <div className="absolute bottom-0 left-0 h-[300px] w-[300px] bg-indigo-600/10 blur-[120px] rounded-full -ml-32 -mb-32" />
                    
                    <div className="relative z-10 space-y-12">
                       <div className="space-y-4">
                          <div className="h-20 w-20 bg-blue-600 rounded-[32px] flex items-center justify-center text-white mx-auto shadow-2xl shadow-blue-500/20 animate-bounce">
                             <Trophy className="w-10 h-10" />
                          </div>
                          <h3 className="text-4xl font-black text-white uppercase tracking-tighter italic">Global Performance Rank</h3>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Real-time Platform Standing</p>
                       </div>

                       <div className="flex flex-col md:flex-row items-center justify-center gap-12">
                          <div className="space-y-2">
                             <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">CURRENT RANK</p>
                             <h2 className="text-8xl lg:text-9xl font-black text-white italic tracking-tighter flex items-start justify-center gap-2">
                                <span className="text-4xl text-blue-500 mt-4">#</span>{data.ranking.rank}
                             </h2>
                          </div>
                          <div className="h-24 w-px bg-white/10 hidden md:block" />
                          <div className="space-y-2">
                             <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">TOTAL POINTS</p>
                             <h2 className="text-8xl lg:text-9xl font-black text-white italic tracking-tighter">
                                {data.ranking.score}
                             </h2>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <RankDetailCard icon={<Medal />} label="Specialist Tier" value={data.ranking.rank <= 3 ? "Elite" : "Pro"} delay={0.1} />
                          <RankDetailCard icon={<Star />} label="Percentile" value={`Top ${Math.max(1, (100 - data.ranking.percentile)).toFixed(0)}%`} delay={0.2} />
                          <RankDetailCard icon={<Sparkles />} label="Global Load" value={`#${data.ranking.totalMediators} Users`} delay={0.3} />
                       </div>

                       <div className="pt-10 border-t border-white/5">
                          <p className="text-sm font-medium text-slate-400 italic">"Your performance score is calculated based on successful transactions and resolved support queries."</p>
                       </div>
                    </div>
                 </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2.5 px-8 py-3 rounded-xl transition-all duration-500 ${active ? 'bg-blue-600 text-white shadow-2xl shadow-blue-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function StatCard({ title, value, icon, color, trend, trendDown, delay = 0 }: any) {
  const themes: any = { 
    blue: { primary: "#3b82f6", bg: "from-blue-50 to-white", glow: "rgba(59, 130, 246, 0.5)" },
    emerald: { primary: "#10b981", bg: "from-emerald-50 to-white", glow: "rgba(16, 185, 129, 0.5)" },
    amber: { primary: "#f59e0b", bg: "from-amber-50 to-white", glow: "rgba(245, 158, 11, 0.5)" },
    indigo: { primary: "#6366f1", bg: "from-indigo-50 to-white", glow: "rgba(99, 102, 241, 0.5)" }
  };
  const theme = themes[color];

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

function PortfolioCard({ icon, label, value, color, delay = 0 }: any) {
  const themes: any = { 
    amber: "bg-amber-600 shadow-amber-500/40", 
    emerald: "bg-emerald-600 shadow-emerald-500/40", 
    rose: "bg-rose-600 shadow-rose-500/40", 
    blue: "bg-blue-600 shadow-blue-500/40", 
    indigo: "bg-indigo-600 shadow-indigo-500/40",
    slate: "bg-slate-800 shadow-slate-900/40"
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -10 }}
      className={`relative p-8 rounded-[48px] ${themes[color]} shadow-2xl group overflow-hidden border border-white/10`}
    >
       <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-2xl group-hover:bg-white/10 transition-all" />
       
       <div className="relative z-10">
          <div className="h-14 w-14 rounded-[22px] bg-white/20 backdrop-blur-xl flex items-center justify-center mb-8 border border-white/20 shadow-inner group-hover:scale-110 transition-transform">
            {React.cloneElement(icon as React.ReactElement, { size: 24, strokeWidth: 2.5, className: "text-white" })}
          </div>
          <div className="space-y-1">
             <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">{label}</p>
             <p className="text-4xl font-black text-white italic tracking-tighter">{value}</p>
          </div>
       </div>
    </motion.div>
  );
}

function RankDetailCard({ icon, label, value, delay = 0 }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-slate-800/50 border border-white/5 p-10 rounded-[54px] text-center backdrop-blur-3xl group hover:bg-slate-800 transition-all shadow-2xl"
    >
       <div className="h-16 w-16 bg-blue-600/20 rounded-3xl flex items-center justify-center mx-auto mb-8 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xl group-hover:shadow-blue-500/30">
         {React.cloneElement(icon as React.ReactElement, { size: 28, strokeWidth: 2.5 })}
       </div>
       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
       <p className="text-2xl font-black text-white italic tracking-tighter">{value}</p>
    </motion.div>
  );
}
