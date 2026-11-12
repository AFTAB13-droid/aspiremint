"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Sparkles,
  Users,
  MessageSquare,
  Zap,
  Coins,
  TrendingUp,
  Search,
  RefreshCw,
  Send,
  AlertTriangle,
  ShieldCheck,
  Package,
  Layers,
  ArrowRight,
  ExternalLink,
  Bot,
  BarChart3,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";

export default function SanaAdminPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"analytics" | "copilot">("analytics");

  // Analytics State
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d" | "all">("7d");
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Copilot Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string; cards?: any[] }>>([
    {
      role: "assistant",
      content: "Namaste Admin! 🌸 I am your **Sana Operations Copilot**.\n\nI have direct administrative access to live database metrics. Ask me to calculate pending refund liabilities, scan for duplicate order submissions, check mediator turnaround times, or inspect deal slot capacity!",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchAnalytics = async (tf = timeframe, q = searchQuery) => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`/api/admin/sana/analytics?timeframe=${tf}&search=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (json.success) {
        setAnalyticsData(json.data);
      } else {
        toast.error(json.message || "Failed to load analytics");
      }
    } catch (err) {
      toast.error("Network error fetching Sana analytics");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(timeframe, searchQuery);
  }, [timeframe]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAnalytics(timeframe, searchQuery);
  };

  const handleSendCopilotMessage = async (customMessage?: string) => {
    const textToSend = (customMessage || chatInput).trim();
    if (!textToSend || chatLoading) return;

    setChatInput("");
    const newMessages = [...chatMessages, { role: "user" as const, content: textToSend }];
    setChatMessages(newMessages);
    setChatLoading(true);

    try {
      const res = await fetch("/api/admin/sana/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: json.data.reply,
            cards: json.data.cards,
          },
        ]);
      } else {
        toast.error(json.message || "Failed to get copilot response");
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "⚠️ I encountered an error executing that administrative tool. Please try again.",
          },
        ]);
      }
    } catch {
      toast.error("Network error with Admin Copilot");
    } finally {
      setChatLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const quickPrompts = [
    { label: "💰 Pending Refund Liability", query: "Calculate our total pending refund liability grouped by brand." },
    { label: "🛡️ Scan Fraud & Duplicates", query: "Scan the database for duplicate order IDs and suspicious buyer activity." },
    { label: "⚡ Mediator Workload & Speed", query: "Check mediator active workloads and pending orders waiting for verification." },
    { label: "📦 Deal Slot Occupancy", query: "Show active deals running low on slots or nearing capacity." },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="text-2xl p-1.5 rounded-2xl bg-pink-100 dark:bg-pink-950/60 border border-pink-200 dark:border-pink-900/60">
              🌸
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Sana AI Command Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              GPT-4o Mini
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Buyer Usage Analytics, Token Cost Intelligence, and Autonomous Operations Copilot for Admins.
          </p>
        </div>

        {/* TAB CONTROLS */}
        <div className="flex items-center p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "analytics"
                ? "bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Usage Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab("copilot")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "copilot"
                ? "bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Sana Admin Copilot</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: USAGE ANALYTICS & DISTINCT USER INTELLIGENCE             */}
      {/* ============================================================== */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* TIMEFRAME & REFRESH BAR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Timeframe:</span>
              {(["24h", "7d", "30d", "all"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all ${
                    timeframe === tf
                      ? "bg-pink-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {tf === "24h" ? "24 Hours" : tf === "7d" ? "Last 7 Days" : tf === "30d" ? "Last 30 Days" : "All Time"}
                </button>
              ))}
            </div>

            <button
              onClick={() => fetchAnalytics(timeframe, searchQuery)}
              disabled={analyticsLoading}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${analyticsLoading ? "animate-spin" : ""}`} />
              <span>Refresh Data</span>
            </button>
          </div>

          {/* 4 TOP KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. DISTINCT ACTIVE USERS */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Distinct Shoppers
                </span>
                <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {analyticsLoading ? "..." : analyticsData?.summary?.distinctUsersCount ?? 0}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Unique logged-in buyers who engaged with Sana
              </p>
            </div>

            {/* 2. TOTAL CONVERSATIONS */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Queries
                </span>
                <div className="p-2 rounded-2xl bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {analyticsLoading ? "..." : (analyticsData?.summary?.totalQueries ?? 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Total chat turns & platform questions resolved
              </p>
            </div>

            {/* 3. TOTAL TOKENS & AVERAGE EFFICIENCY */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Tokens
                </span>
                <div className="p-2 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {analyticsLoading ? "..." : (analyticsData?.summary?.totalTokens ?? 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Avg ~{analyticsData?.summary?.avgTokensPerQuery ?? 0} tokens / query
              </p>
            </div>

            {/* 4. REAL-TIME ESTIMATED SPEND (INR & USD) */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total AI Spend
                </span>
                <div className="p-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                {analyticsLoading ? "..." : `₹${analyticsData?.summary?.totalSpendInr ?? 0}`}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                ≈ ${analyticsData?.summary?.totalSpendUsd ?? 0} USD (gpt-4o-mini rates)
              </p>
            </div>
          </div>

          {/* INTENT BREAKDOWN & COST ANALYSIS BANNER */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Intent Breakdown */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-pink-600" />
                <span>Buyer Inquiries Breakdown</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Categorization of questions asked by shoppers across the app.
              </p>

              <div className="space-y-3 pt-2">
                {(analyticsData?.intentBreakdown || []).map((item: any, i: number) => {
                  const labelMap: Record<string, string> = {
                    ORDER_TRACKING: "📦 Order Status & Lookup",
                    REFUND_STATUS: "💰 Refund Timeline & Payout",
                    DEAL_DISCOVERY: "🎁 100% Deals & Discovery",
                    RULES_FAQ: "📚 Guidelines & Rules FAQ",
                    OFF_TOPIC: "🛡️ Off-Topic Deflections",
                    GENERAL: "💬 General Greetings",
                  };
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-700 dark:text-slate-300">
                          {labelMap[item.category] || item.category}
                        </span>
                        <span className="text-slate-900 dark:text-white">
                          {item.count} ({item.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-pink-500 to-indigo-600 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {(!analyticsData?.intentBreakdown || analyticsData.intentBreakdown.length === 0) && (
                  <p className="text-xs text-slate-400 italic py-4 text-center">No inquiries logged yet for this timeframe.</p>
                )}
              </div>
            </div>

            {/* Token & Guardrail Architecture Analysis */}
            <div className="lg:col-span-2 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 text-white p-6 rounded-3xl border border-indigo-800/40 space-y-4 shadow-xl">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <h3 className="text-base font-black tracking-tight">
                  Token Optimization & Domain Guardrail Intelligence
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 pt-2 leading-relaxed">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Off-Topic Trivia Guardrail Active</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Sana is strictly restricted to AspireMint deals and orders. If a user asks general trivia (e.g. politics, PM of India, homework), Sana immediately deflects in 1 short sentence, preventing multi-turn chatter.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>OpenAI Prompt Caching (50% Off)</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Sana's system prompt and tool definitions exceed 1,024 tokens. OpenAI automatically caches the prompt prefix, giving a <strong>50% discount</strong> ($0.075/1M tokens) on cached input tokens!
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
                <span>💡 Current Average Query Cost: <strong>~₹0.024 (2.4 paise)</strong></span>
                <span className="font-mono text-[10px] text-emerald-400 font-bold">gpt-4o-mini Verified</span>
              </div>
            </div>
          </div>

          {/* DISTINCT SHOPPERS LEADERBOARD */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Distinct Shoppers Engagement</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Individual buyers who interacted with Sana AI, sorted by query volume.
                </p>
              </div>

              {/* SEARCH BOX */}
              <form onSubmit={handleSearchSubmit} className="relative min-w-[260px]">
                <input
                  type="text"
                  placeholder="Search buyer name, email, or order..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </form>
            </div>

            {/* SHOPPER TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-black">
                    <th className="py-3 px-3">Shopper</th>
                    <th className="py-3 px-3">Role / ID</th>
                    <th className="py-3 px-3 text-center">Queries</th>
                    <th className="py-3 px-3 text-center">Total Tokens</th>
                    <th className="py-3 px-3 text-center">Total Cost</th>
                    <th className="py-3 px-3">Last Active</th>
                    <th className="py-3 px-3">Orders Inquired</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {(analyticsData?.topUsers || []).map((u: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{u.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {u.aspireMintId || u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-black text-slate-900 dark:text-white">
                        {u.totalMessages}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {u.totalTokens.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center font-black text-emerald-600 dark:text-emerald-400">
                        ₹{u.totalCostInr}
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {new Date(u.lastActive).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-3">
                        {u.ordersInquired && u.ordersInquired.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {u.ordersInquired.map((oid: string, oIdx: number) => (
                              <span
                                key={oIdx}
                                className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                              >
                                {oid}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!analyticsData?.topUsers || analyticsData.topUsers.length === 0) && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 text-xs italic">
                        No user chats recorded yet in this timeframe. As buyers chat with Sana, their analytics will appear here.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* RECENT CONVERSATIONS LOG AUDIT */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-pink-600" />
              <span>Live Conversation Audit Log (Latest 40)</span>
            </h3>

            <div className="space-y-2.5">
              {(analyticsData?.recentLogs || []).map((log: any) => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <div
                    key={log.id}
                    className="border border-slate-100 dark:border-slate-800 rounded-2xl p-3.5 hover:border-slate-200 dark:hover:border-slate-700 transition space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{log.userName}</span>
                        <span className="text-[10px] text-slate-400">{log.userEmail}</span>
                        <span className="px-2 py-0.2 rounded-full text-[9px] font-bold uppercase bg-pink-50 dark:bg-pink-950 text-pink-600 dark:text-pink-400">
                          {log.intentCategory}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                        <span>{log.tokens?.totalTokens} tok</span>
                        <span>₹{log.costInr}</span>
                        <span>
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="text-pink-600 font-bold"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      <span className="text-pink-500 font-black mr-1.5">Q:</span>
                      {log.userMessage}
                    </div>

                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl whitespace-pre-wrap">
                        <div className="font-bold text-pink-600 mb-1 flex items-center gap-1.5">
                          <span>🌸 Sana Reply:</span>
                          {log.toolsUsed?.length > 0 && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded">
                              Tools: {log.toolsUsed.join(", ")}
                            </span>
                          )}
                        </div>
                        {log.sanaReply}
                      </div>
                    )}
                  </div>
                );
              })}
              {(!analyticsData?.recentLogs || analyticsData.recentLogs.length === 0) && (
                <p className="text-xs text-slate-400 italic py-6 text-center">No conversation logs found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: SANA ADMIN COPILOT & EXECUTIVE TOOLS                     */}
      {/* ============================================================== */}
      {activeTab === "copilot" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* LEFT COLUMN: QUICK OPERATIONS PALETTE */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-pink-600" />
                <span>Executive 1-Tap Prompts</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Click any automated analysis prompt to execute live administrative tools:
              </p>

              <div className="space-y-2 pt-1">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendCopilotMessage(p.query)}
                    className="w-full text-left p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 hover:bg-pink-50 dark:hover:bg-pink-950/40 border border-slate-200/70 dark:border-slate-700/60 transition group cursor-pointer"
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400">
                      {p.label}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{p.query}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* ACTIVE COPILOT TOOLS LIST */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-2.5 text-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Connected Admin Tools
              </span>
              <ul className="space-y-2 text-slate-600 dark:text-slate-300 text-[11px]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Real-Time Payout Liability Aggregator</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Duplicate & Multi-Account Fraud Sentinel</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Mediator Pending Queue Auditor</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Campaign Deal Slot Capacity Checker</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Deep Order Audit & Screenshot Forensics</span>
                </li>
              </ul>
            </div>
          </div>

          {/* RIGHT COLUMN: INTERACTIVE COPILOT CHAT WORKSPACE */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex flex-col h-[700px] shadow-xs overflow-hidden">
            {/* CHAT HEADER */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-600 to-indigo-600 text-white flex items-center justify-center text-lg shadow-xs">
                  🌸
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>Sana Admin Operations Copilot</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </h3>
                  <p className="text-[10px] text-slate-400">Direct query interface into MongoDB Atlas & Cloudinary</p>
                </div>
              </div>
              <button
                onClick={() =>
                  setChatMessages([
                    {
                      role: "assistant",
                      content: "Namaste Admin! 🌸 Workspace reset. How can I assist you with platform operations?",
                    },
                  ])
                }
                className="text-[10px] font-bold text-slate-400 hover:text-pink-600 transition"
              >
                Clear History
              </button>
            </div>

            {/* CHAT MESSAGES STREAM */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {chatMessages.map((msg, i) => {
                const isUser = msg.role === "user";
                return (
                  <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                      <div
                        className={`p-4 rounded-3xl text-xs leading-relaxed whitespace-pre-wrap ${
                          isUser
                            ? "bg-pink-600 text-white rounded-br-xs font-medium shadow-xs"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-200/60 dark:border-slate-700/60"
                        }`}
                      >
                        {msg.content}
                      </div>

                      {/* RENDER ADMIN GENERATIVE UI CARDS */}
                      {msg.cards && msg.cards.length > 0 && (
                        <div className="space-y-3 pt-1">
                          {msg.cards.map((card, cIdx) => (
                            <div key={cIdx}>
                              {/* 1. FINANCIAL LIABILITY CARD */}
                              {card.type === "ADMIN_LIABILITY_CARD" && (
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950 to-slate-900 text-white border border-indigo-800/60 shadow-lg space-y-3 text-xs">
                                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                    <span className="font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                                      <span>💰 Payout Liability Summary</span>
                                    </span>
                                    <span className="text-[11px] font-mono text-slate-300">
                                      {card.data.totalOrders} Pending Orders
                                    </span>
                                  </div>

                                  <div className="text-2xl font-black text-emerald-400">
                                    ₹{card.data.totalLiability?.toLocaleString("en-IN")}
                                  </div>

                                  <div className="space-y-1.5 pt-1">
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Brand Breakdown:</span>
                                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                                      {(card.data.brandBreakdown || []).map((b: any, bIdx: number) => (
                                        <div key={bIdx} className="p-2 rounded-xl bg-white/5 flex items-center justify-between">
                                          <span className="font-bold text-slate-200 truncate">{b._id}</span>
                                          <span className="font-black text-emerald-300">₹{b.totalAmount}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* 2. FRAUD & DUPLICATE ALERT CARD */}
                              {card.type === "ADMIN_FRAUD_ALERT_CARD" && (
                                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-900 shadow-md space-y-2 text-xs">
                                  <div className="flex items-center justify-between font-black uppercase text-[11px]">
                                    <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                                      <AlertTriangle className="w-4 h-4" />
                                      <span>Duplicate Order IDs Flagged</span>
                                    </span>
                                    <span>{card.data.duplicateCount} Cases</span>
                                  </div>

                                  <div className="space-y-2 pt-1">
                                    {(card.data.duplicates || []).map((d: any, dIdx: number) => (
                                      <div key={dIdx} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/60 space-y-1">
                                        <div className="flex items-center justify-between font-mono font-bold text-rose-700 dark:text-rose-400">
                                          <span>Order: {d.orderId}</span>
                                          <span className="text-[10px] bg-rose-100 dark:bg-rose-950 px-1.5 py-0.2 rounded font-black">
                                            {d.count} Submissions
                                          </span>
                                        </div>
                                        <div className="text-[10px] text-slate-500">
                                          Unique Buyer Accounts: <strong className="text-slate-800 dark:text-slate-200">{d.uniqueBuyers}</strong> • Brands: {d.brands.join(", ")}
                                        </div>
                                      </div>
                                    ))}
                                    {card.data.duplicateCount === 0 && (
                                      <p className="text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                                        ✅ Clean Scan! No duplicate marketplace order IDs detected.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* 3. MEDIATOR WORKLOAD CARD */}
                              {card.type === "ADMIN_MEDIATOR_CARD" && (
                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900 shadow-md space-y-2 text-xs">
                                  <div className="font-black text-indigo-700 dark:text-indigo-400 uppercase text-[11px] pb-1 border-b border-slate-100 dark:border-slate-800">
                                    ⚡ Mediator Pending Queues
                                  </div>
                                  <div className="space-y-2 pt-1">
                                    {(card.data.mediators || []).map((m: any, mIdx: number) => (
                                      <div key={mIdx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px]">
                                        <div>
                                          <div className="font-bold text-slate-900 dark:text-white">{m.name}</div>
                                          <div className="text-[9px] text-slate-400">{m.email}</div>
                                        </div>
                                        <div className="text-right">
                                          <div className="font-black text-amber-600 dark:text-amber-400">
                                            {m.totalPending} Pending
                                          </div>
                                          <div className="text-[9px] text-slate-400">
                                            {m.pendingVerification} Review • {m.approvedWaitingPayout} Payout
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="p-3.5 rounded-3xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-pink-600" />
                    <span>Sana is querying database & analyzing...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* CHAT INPUT BAR */}
            <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask Sana Admin anything (e.g. 'What is Rahul's pending payout total?')..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendCopilotMessage()}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-pink-500"
              />
              <button
                onClick={() => handleSendCopilotMessage()}
                disabled={chatLoading || !chatInput.trim()}
                className="p-2.5 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold transition disabled:opacity-50 active:scale-95 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
