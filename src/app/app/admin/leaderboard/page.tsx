"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Trophy, Award, BarChart2, Star, Calendar, Bell, Users, Search, AlertCircle, RefreshCw } from "lucide-react";
import { CustomDropdown } from "@/components/ui/CustomDropdown";

export default function LeaderboardAdminPage() {
  const [activeTab, setActiveTab] = useState<"LEADERBOARD" | "ANALYSIS">("LEADERBOARD");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({ leaderboard: [], stats: { totalOrders: 0, totalCancelled: 0, totalCompleted: 0, brandShare: [] } });
  const [searchQuery, setSearchQuery] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Generate last 12 months for dropdown options
  const monthOptions = useMemo(() => {
    const options = [];
    const date = new Date();
    for (let i = 0; i < 12; i++) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      options.push(`${year}-${month}`);
      date.setMonth(date.getMonth() - 1);
    }
    return options;
  }, []);

  useEffect(() => {
    if (monthOptions.length > 0 && !selectedMonth) {
      setSelectedMonth(monthOptions[0]);
    }
  }, [monthOptions, selectedMonth]);

  const fetchLeaderboardData = async () => {
    if (!selectedMonth) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/leaderboard?month=${selectedMonth}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        toast.error(json.message || "Failed to fetch leaderboard data");
      }
    } catch (err) {
      toast.error("Internal Server Error loading stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboardData();
  }, [selectedMonth]);

  const handleIssueReward = async (userId: string, rank: number, isTest = false) => {
    setIsUpdating(true);
    const toastId = toast.loading(isTest ? "Sending test reward..." : "Issuing monthly reward...");
    try {
      const res = await fetch("/api/admin/leaderboard/reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          rank,
          month: selectedMonth,
          isTest
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message, { id: toastId });
        fetchLeaderboardData(); // Reload to reflect badge updates
      } else {
        throw new Error(json.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Action failed", { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredLeaderboard = useMemo(() => {
    return data.leaderboard.filter((u: any) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.aspireMintId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data.leaderboard, searchQuery]);

  const topUser = data.leaderboard[0] || null;

  // Find user with most cancellations
  const mostCancellationsUser = useMemo(() => {
    if (data.leaderboard.length === 0) return null;
    return [...data.leaderboard].sort((a, b) => b.cancelledOrders - a.cancelledOrders)[0];
  }, [data.leaderboard]);

  return (
    <div className="flex flex-col gap-6 pb-16 overflow-x-hidden">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Leaderboard & Metrics</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Admin Monthly Buyer Achievements & Analytics</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Target Month:</span>
            <CustomDropdown 
              options={monthOptions} 
              value={selectedMonth} 
              onChange={setSelectedMonth} 
              placeholder="Select Month" 
            />
          </div>
          <button 
            onClick={fetchLeaderboardData}
            className="h-11 w-11 bg-white hover:bg-slate-50 border border-slate-100 text-slate-600 rounded-2xl flex items-center justify-center transition-all shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/50 rounded-[24px] border border-slate-100 shadow-sm w-fit">
        <button
          onClick={() => setActiveTab("LEADERBOARD")}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === "LEADERBOARD" ? "bg-white text-indigo-600 shadow-md border border-indigo-50" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Trophy className="w-4 h-4" />
          🏆 Buyer Leaderboard
        </button>
        <button
          onClick={() => setActiveTab("ANALYSIS")}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === "ANALYSIS" ? "bg-white text-indigo-600 shadow-md border border-indigo-50" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          📊 Order & User Analysis
        </button>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <span className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregating Monthly Ledger...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === "LEADERBOARD" ? (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Highlight Cards for Top 3 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Gold Card */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-100/50 border border-amber-200/60 rounded-[32px] p-6 relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 h-32 w-32 bg-amber-500/10 blur-2xl rounded-full" />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-200/50 px-3 py-1 rounded-full">1st Place Champion</span>
                    <span className="text-3xl">🥇</span>
                  </div>
                  {data.leaderboard[0] ? (
                    <div>
                      <h4 className="text-xl font-black text-slate-800 uppercase truncate">{data.leaderboard[0].name}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {data.leaderboard[0].aspireMintId}</p>
                      <div className="mt-4 flex items-end justify-between">
                        <div>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Total Orders</span>
                          <span className="text-2xl font-black text-amber-700">{data.leaderboard[0].totalOrders} Orders</span>
                        </div>
                        {data.leaderboard[0].leaderboardBadge?.active && data.leaderboard[0].leaderboardBadge?.rank === 1 ? (
                          <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded-md uppercase tracking-widest animate-pulse">Badge Active</span>
                        ) : (
                          <button
                            onClick={() => handleIssueReward(data.leaderboard[0]._id, 1)}
                            disabled={isUpdating}
                            className="px-4 py-2 bg-amber-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-md shadow-amber-600/20 active:scale-95"
                          >
                            Reward
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300 italic font-bold">No orders recorded this month</p>
                  )}
                </div>

                {/* Silver Card */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-200/50 border border-slate-200/60 rounded-[32px] p-6 relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 h-32 w-32 bg-slate-500/10 blur-2xl rounded-full" />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 bg-slate-200/50 px-3 py-1 rounded-full">2nd Place</span>
                    <span className="text-3xl">🥈</span>
                  </div>
                  {data.leaderboard[1] ? (
                    <div>
                      <h4 className="text-xl font-black text-slate-800 uppercase truncate">{data.leaderboard[1].name}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {data.leaderboard[1].aspireMintId}</p>
                      <div className="mt-4 flex items-end justify-between">
                        <div>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Total Orders</span>
                          <span className="text-2xl font-black text-slate-700">{data.leaderboard[1].totalOrders} Orders</span>
                        </div>
                        {data.leaderboard[1].leaderboardBadge?.active && data.leaderboard[1].leaderboardBadge?.rank === 2 ? (
                          <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded-md uppercase tracking-widest animate-pulse">Badge Active</span>
                        ) : (
                          <button
                            onClick={() => handleIssueReward(data.leaderboard[1]._id, 2)}
                            disabled={isUpdating}
                            className="px-4 py-2 bg-slate-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all shadow-md shadow-slate-600/20 active:scale-95"
                          >
                            Reward
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300 italic font-bold">No 2nd place runner-up yet</p>
                  )}
                </div>

                {/* Bronze Card */}
                <div className="bg-gradient-to-br from-amber-50/30 to-yellow-100/20 border border-orange-100/50 rounded-[32px] p-6 relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 h-32 w-32 bg-orange-600/10 blur-2xl rounded-full" />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-1 rounded-full">3rd Place</span>
                    <span className="text-3xl">🥉</span>
                  </div>
                  {data.leaderboard[2] ? (
                    <div>
                      <h4 className="text-xl font-black text-slate-800 uppercase truncate">{data.leaderboard[2].name}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {data.leaderboard[2].aspireMintId}</p>
                      <div className="mt-4 flex items-end justify-between">
                        <div>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Total Orders</span>
                          <span className="text-2xl font-black text-amber-800">{data.leaderboard[2].totalOrders} Orders</span>
                        </div>
                        {data.leaderboard[2].leaderboardBadge?.active && data.leaderboard[2].leaderboardBadge?.rank === 3 ? (
                          <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded-md uppercase tracking-widest animate-pulse">Badge Active</span>
                        ) : (
                          <button
                            onClick={() => handleIssueReward(data.leaderboard[2]._id, 3)}
                            disabled={isUpdating}
                            className="px-4 py-2 bg-amber-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-800 transition-all shadow-md shadow-amber-600/10 active:scale-95"
                          >
                            Reward
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300 italic font-bold">No 3rd place candidate yet</p>
                  )}
                </div>
              </div>

              {/* Leaderboard Table List */}
              <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="relative w-full sm:max-w-xs">
                    <input
                      type="text"
                      placeholder="Search User..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-10 bg-slate-50 border border-slate-100 rounded-xl px-9 text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                  </div>
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                    Showing {filteredLeaderboard.length} of {data.leaderboard.length} Monthly active users
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Rank</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">User ID & Name</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Total Orders</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Completed</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Cancelled</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Spend (₹)</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Active Badge</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeaderboard.map((u: any, index: number) => {
                        const globalRank = index + 1;
                        const medal = globalRank === 1 ? "🥇" : globalRank === 2 ? "🥈" : globalRank === 3 ? "🥉" : `${globalRank}`;

                        return (
                          <tr key={u._id} className="hover:bg-slate-50/50 transition-all border-b border-slate-100">
                            <td className="px-6 py-4 text-xs font-black text-slate-900 text-left">
                              <span className="text-base mr-1">{medal}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{u.name}</span>
                                <span className="text-[8px] text-slate-300 font-bold uppercase mt-0.5">{u.aspireMintId}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center text-xs font-black text-slate-700">{u.totalOrders}</td>
                            <td className="px-6 py-4 text-center text-xs font-black text-emerald-600">{u.completedOrders}</td>
                            <td className="px-6 py-4 text-center text-xs font-black text-rose-600">{u.cancelledOrders}</td>
                            <td className="px-6 py-4 text-xs font-black text-slate-900">₹{u.totalSpend}</td>
                            <td className="px-6 py-4 text-center">
                              {u.leaderboardBadge?.active ? (
                                <span className="text-[7px] font-black px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-md uppercase tracking-wider">
                                  Rank #{u.leaderboardBadge.rank} ({u.leaderboardBadge.month})
                                </span>
                              ) : (
                                <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest italic">None</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {/* Reward button for top 3 */}
                                {globalRank <= 3 && (
                                  <button
                                    onClick={() => handleIssueReward(u._id, globalRank)}
                                    disabled={isUpdating || u.leaderboardBadge?.active && u.leaderboardBadge?.rank === globalRank}
                                    className="px-3 py-1.5 bg-indigo-600 text-white text-[8px] font-black rounded-lg uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50"
                                  >
                                    Reward
                                  </button>
                                )}
                                {/* Test button for all users */}
                                <button
                                  onClick={() => handleIssueReward(u._id, 1, true)}
                                  disabled={isUpdating}
                                  className="px-3 py-1.5 bg-slate-900 text-white text-[8px] font-black rounded-lg uppercase tracking-widest hover:bg-black transition-all"
                                  title="Test golden animated notification and badge updates on this profile"
                                >
                                  Test
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredLeaderboard.length === 0 && (
                  <div className="py-16 text-center">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">No Monthly Records Found</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Analytics summary rows */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-100 rounded-[32px] p-6 flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Monthly Received Orders</span>
                    <h3 className="text-3xl font-black text-slate-800 mt-2">{data.stats.totalOrders}</h3>
                    <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Across all marketplace listings</p>
                  </div>
                  <div className="h-12 w-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center">
                    <Award className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-[32px] p-6 flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Successful Settlements</span>
                    <h3 className="text-3xl font-black text-emerald-600 mt-2">{data.stats.totalCompleted}</h3>
                    <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Completed & Refunded</p>
                  </div>
                  <div className="h-12 w-12 bg-emerald-50 text-emerald-505 rounded-2xl flex items-center justify-center text-emerald-500">
                    <Award className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-[32px] p-6 flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Cancelled Transactions</span>
                    <h3 className="text-3xl font-black text-rose-600 mt-2">{data.stats.totalCancelled}</h3>
                    <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Cancellations & Invalidated</p>
                  </div>
                  <div className="h-12 w-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Advanced user behaviors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Performer Details */}
                <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    Top Active Buyer
                  </h3>
                  {topUser ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Username / Buyer</span>
                        <span className="text-sm font-black text-slate-900">{topUser.name}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">AspireMint ID</span>
                        <span className="text-xs font-bold text-indigo-600 uppercase">{topUser.aspireMintId}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Monthly Purchases</span>
                        <span className="text-sm font-black text-slate-800">{topUser.totalOrders} Orders</span>
                      </div>
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Completed Ratio</span>
                        <span className="text-xs font-black text-emerald-600">
                          {Math.round((topUser.completedOrders / topUser.totalOrders) * 100)}% ({topUser.completedOrders} / {topUser.totalOrders})
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300 italic">No buyer data available</p>
                  )}
                </div>

                {/* Abuse Risk Tracking */}
                <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                    High Cancellation Warning
                  </h3>
                  {mostCancellationsUser && mostCancellationsUser.cancelledOrders > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Flagged Buyer</span>
                        <span className="text-sm font-black text-slate-900">{mostCancellationsUser.name}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">AspireMint ID</span>
                        <span className="text-xs font-bold text-slate-700 uppercase">{mostCancellationsUser.aspireMintId}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cancelled Transactions</span>
                        <span className="text-sm font-black text-rose-600">{mostCancellationsUser.cancelledOrders} Orders</span>
                      </div>
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cancellation Ratio</span>
                        <span className="text-xs font-black text-rose-600">
                          {Math.round((mostCancellationsUser.cancelledOrders / mostCancellationsUser.totalOrders) * 100)}% ({mostCancellationsUser.cancelledOrders} / {mostCancellationsUser.totalOrders})
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300 italic font-bold">No suspicious transaction cancellations flagged</p>
                  )}
                </div>
              </div>

              {/* Brand Distribution Analysis */}
              <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6">Marketplace Brand Share Distribution</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {data.stats.brandShare.map((b: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block truncate">{b.brand}</span>
                      <span className="text-xl font-black text-slate-800 mt-2 block">{b.count} orders</span>
                    </div>
                  ))}
                  {data.stats.brandShare.length === 0 && (
                    <div className="col-span-full py-8 text-center text-xs text-slate-300 font-bold uppercase tracking-wider">No brand logs found</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

    </div>
  );
}
