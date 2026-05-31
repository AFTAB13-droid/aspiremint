"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell
} from "recharts";
import { 
  TrendingUp, ShoppingBag, RefreshCw, LayoutDashboard, Wallet, 
  CheckCircle2, Activity, Zap, Clock, DollarSign, Trophy, Medal, 
  Star, Sparkles, ShieldCheck, XCircle, Layers, ExternalLink, Briefcase, PieChart as PieIcon, ArrowRight
} from "lucide-react";
import Link from "next/link";

type MediatorTab = 'OVERVIEW' | 'EARNINGS' | 'INVENTORY' | 'RANKINGS';

interface MobileMediatorAnalyticsProps {
  data: any;
  onRefresh: () => void;
  isJuhi: boolean;
}

export function MobileMediatorAnalytics({ data, onRefresh, isJuhi }: MobileMediatorAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<MediatorTab>('OVERVIEW');

  const resolutionData = [
    { name: 'Completed', value: data.orderStats.completed, color: '#10b981' },
    { name: 'Approved', value: data.orderStats.refundApproved, color: '#3b82f6' },
    { name: 'Verification', value: data.orderStats.verification, color: '#f59e0b' },
    { name: 'Rejected', value: data.orderStats.rejected, color: '#ef4444' },
    { name: 'Pending', value: data.orderStats.pending, color: '#94a3b8' },
  ].filter(d => d.value > 0);

  const hasLoadData = data?.performanceChartData?.some((d: any) => d.total > 0) || false;

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-32">
      {/* Top Header */}
      <div className="bg-white px-6 pt-6 pb-4 rounded-b-[32px] shadow-sm border-b border-slate-100 sticky top-0 z-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Feed</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Analytics</h1>
          </div>
          <button 
            onClick={onRefresh}
            className="h-10 w-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
          <TabButton active={activeTab === 'OVERVIEW'} onClick={() => setActiveTab('OVERVIEW')} icon={<LayoutDashboard />} label="Overview" />
          {!isJuhi && (
            <TabButton active={activeTab === 'EARNINGS'} onClick={() => setActiveTab('EARNINGS')} icon={<Wallet />} label="Earnings" />
          )}
          <TabButton active={activeTab === 'INVENTORY'} onClick={() => setActiveTab('INVENTORY')} icon={<Layers />} label="Inventory" />
          <TabButton active={activeTab === 'RANKINGS'} onClick={() => setActiveTab('RANKINGS')} icon={<Trophy />} label="Rankings" />
        </div>
      </div>

      <div className="p-4 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* OVERVIEW TAB */}
            {activeTab === 'OVERVIEW' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <StatCard title="Orders" value={data.personal.totalOrders} icon={<ShoppingBag />} color="blue" />
                  {!isJuhi && (
                    <StatCard title="Commissions" value={`₹${data.personal.totalCommissions.toLocaleString()}`} icon={<TrendingUp />} color="emerald" />
                  )}
                  <StatCard title="Rank" value={`#${data.ranking.rank}`} icon={<Trophy />} color="amber" />
                  <StatCard title="Queries" value={data.personal.queriesResolved} icon={<CheckCircle2 />} color="indigo" />
                </div>

                {/* Area Chart */}
                <div className="bg-white rounded-[32px] p-5 shadow-sm border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-50 rounded-full blur-2xl -mr-16 -mt-16" />
                  <div className="mb-6 relative z-10">
                    <h3 className="text-[15px] font-black text-slate-900 uppercase tracking-tight italic flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Success Velocity
                    </h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">14-Day Performance Trend</p>
                  </div>
                  
                  <div className="h-[200px] relative z-10 -ml-4">
                    {hasLoadData ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.performanceChartData}>
                          <defs>
                            <linearGradient id="colorSuccessMob" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: '#cbd5e1' }} />
                          <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 900 }} />
                          <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorSuccessMob)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-200">
                        <CheckCircle2 className="w-10 h-10 opacity-30" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Donut Chart */}
                <div className="bg-slate-900 rounded-[32px] p-6 shadow-xl relative overflow-hidden text-white">
                  <div className="mb-4 relative z-10">
                    <h3 className="text-[15px] font-black uppercase tracking-tight italic flex items-center gap-2">
                      <PieIcon className="w-4 h-4 text-blue-400" /> Resolution Mix
                    </h3>
                  </div>

                  <div className="flex flex-row items-center gap-4">
                    <div className="h-[120px] w-[120px] shrink-0 relative z-10">
                      {resolutionData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={resolutionData} innerRadius={35} outerRadius={55} paddingAngle={5} dataKey="value">
                              {resolutionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff', fontSize: '9px', fontWeight: 900 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-700">
                          <PieIcon className="w-8 h-8 opacity-30" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-2.5 relative z-10">
                      {resolutionData.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.name}</span>
                          </div>
                          <span className="text-[11px] font-black">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EARNINGS TAB */}
            {activeTab === 'EARNINGS' && (
              <div className="space-y-4">
                <div className="bg-emerald-600 rounded-[32px] p-6 text-white shadow-xl shadow-emerald-600/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-40 w-40 bg-emerald-500 rounded-full blur-2xl -mr-10 -mt-10" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-6">
                      <DollarSign className="w-6 h-6 text-emerald-200" />
                      <h2 className="text-xl font-black uppercase tracking-tighter italic">Profit Engine</h2>
                    </div>
                    <div className="space-y-1 mb-6">
                      <p className="text-[10px] font-black text-emerald-200 uppercase tracking-widest">Total Earnings</p>
                      <h3 className="text-4xl font-black italic tracking-tighter">₹{data.personal.totalCommissions.toLocaleString()}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-emerald-500/50">
                      <div>
                        <p className="text-[8px] font-black text-emerald-200 uppercase tracking-widest">Daily Yield</p>
                        <p className="text-lg font-black tracking-tight">₹{data.personal.dailyEarnings.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-emerald-200 uppercase tracking-widest">Weekly Yield</p>
                        <p className="text-lg font-black tracking-tight">₹{data.personal.weeklyEarnings.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[32px] p-5 shadow-sm border border-slate-100">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-tight italic flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-500" /> Yield Velocity
                      </h3>
                    </div>
                  </div>
                  <div className="h-[180px] -ml-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.performanceChartData}>
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: '#cbd5e1' }} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 900 }} />
                        <Bar dataKey="earnings" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={12} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900 p-4 rounded-[24px] shadow-lg text-white">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Profit/Deal</p>
                    <h4 className="text-2xl font-black italic tracking-tighter">₹{(data.personal.totalCommissions / (data.personal.completedOrders || 1)).toFixed(0)}</h4>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-[24px] shadow-lg text-white">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Success Rate</p>
                    <h4 className="text-2xl font-black italic tracking-tighter text-emerald-400">{((data.personal.completedOrders / (data.personal.totalOrders || 1)) * 100).toFixed(1)}%</h4>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <h3 className="text-[15px] font-black text-slate-900 uppercase tracking-tight italic flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-600" /> Brand Breakdown
                  </h3>
                  <div className="space-y-3">
                    {data.brandEarnings?.map((brand: any, idx: number) => (
                      <div key={idx} className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-[16px] flex items-center justify-center font-black text-xl shrink-0">
                          {brand.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">{brand.name}</h4>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{brand.count} Orders</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[12px] font-black text-emerald-600">+₹{brand.earnings.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* INVENTORY TAB */}
            {activeTab === 'INVENTORY' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <MiniPortfolioCard label="Verification" value={data.orderStats.verification} bg="bg-amber-500" icon={<ShieldCheck />} />
                  <MiniPortfolioCard label="Approved" value={data.orderStats.refundApproved} bg="bg-emerald-500" icon={<CheckCircle2 />} />
                  <MiniPortfolioCard label="Completed" value={data.orderStats.completed} bg="bg-blue-500" icon={<DollarSign />} />
                  <MiniPortfolioCard label="Rejected" value={data.orderStats.rejected} bg="bg-rose-500" icon={<XCircle />} />
                </div>

                <div className="pt-2">
                  <h3 className="text-[15px] font-black text-slate-900 uppercase tracking-tighter italic mb-3">Live Inventory</h3>
                  <div className="space-y-4">
                    {data.inventoryData.map((deal: any) => (
                      <div key={deal.productCode} className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex gap-3 items-center">
                            <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center font-black text-lg text-slate-700">
                              {deal.brand.charAt(0)}
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight line-clamp-1">{deal.productName}</h4>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Code: {deal.productCode}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex-1 bg-slate-50 rounded-xl p-2.5 text-center">
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total</p>
                            <p className="text-[13px] font-black text-slate-900">{deal.total}</p>
                          </div>
                          <div className="flex-1 bg-blue-50 rounded-xl p-2.5 text-center">
                            <p className="text-[7px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Remaining</p>
                            <p className="text-[13px] font-black text-blue-600">{deal.remaining}</p>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                            <span>Fill Rate</span>
                            <span>{deal.fillRate.toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${deal.fillRate}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Link href="/dashboard/mediations" className="block">
                   <button className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-slate-900/10">
                      My Mediations <ArrowRight className="w-3.5 h-3.5" />
                   </button>
                </Link>
              </div>
            )}

            {/* RANKINGS TAB */}
            {activeTab === 'RANKINGS' && (
              <div className="py-6">
                <div className="bg-slate-900 rounded-[40px] p-8 text-center text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-40 w-40 bg-blue-500/20 blur-3xl rounded-full -mr-10 -mt-10" />
                  <div className="absolute bottom-0 left-0 h-32 w-32 bg-indigo-500/20 blur-2xl rounded-full -ml-10 -mb-10" />
                  
                  <div className="relative z-10 space-y-6">
                    <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-600/30">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tighter italic">Global Rank</h3>
                      <div className="flex justify-center items-start mt-2">
                        <span className="text-2xl text-blue-400 mt-1">#</span>
                        <span className="text-6xl font-black italic tracking-tighter">{data.ranking.rank}</span>
                      </div>
                    </div>

                    <div className="h-px bg-white/10" />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Points</p>
                        <p className="text-2xl font-black italic">{data.ranking.score}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Percentile</p>
                        <p className="text-2xl font-black italic">Top {Math.max(1, (100 - data.ranking.percentile)).toFixed(0)}%</p>
                      </div>
                    </div>

                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Specialist Tier</p>
                      <p className="text-lg font-black italic text-white flex items-center justify-center gap-1.5">
                        <Medal className="w-4 h-4 text-amber-400" />
                        {data.ranking.rank <= 3 ? "Elite" : "Pro"}
                      </p>
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
    <button 
      onClick={onClick} 
      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-[14px] whitespace-nowrap transition-all flex-shrink-0 ${active ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}
    >
      {React.cloneElement(icon, { className: "w-3.5 h-3.5" })}
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const themes: any = { 
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100"
  };
  
  return (
    <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden">
      <div className={`absolute top-0 right-0 p-2 rounded-bl-[16px] ${themes[color]}`}>
        {React.cloneElement(icon, { className: "w-3.5 h-3.5" })}
      </div>
      <div className="mt-2 space-y-0.5">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <h4 className="text-xl font-black text-slate-900 italic tracking-tighter truncate">{value}</h4>
      </div>
    </div>
  );
}

function MiniPortfolioCard({ label, value, bg, icon }: any) {
  return (
    <div className={`${bg} rounded-[24px] p-4 text-white relative overflow-hidden shadow-lg`}>
      <div className="absolute -right-2 -bottom-2 opacity-20">
        {React.cloneElement(icon, { className: "w-12 h-12" })}
      </div>
      <div className="relative z-10">
        <p className="text-[8px] font-black text-white/70 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black italic tracking-tighter leading-none">{value}</p>
      </div>
    </div>
  );
}
