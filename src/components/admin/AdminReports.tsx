"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface AdminReportsProps {
  orders: any[];
  allBrands: any[];
}

export const AdminReports: React.FC<AdminReportsProps> = ({ orders = [], allBrands = [] }) => {
  const [filterPeriod, setFilterPeriod] = useState<"DAY" | "MONTH" | "ALL">("DAY");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // YYYY-MM-DD
  });
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`; // YYYY-MM
  });
  const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
  const [showDetailedOrders, setShowDetailedOrders] = useState(false);

  // Google Sheets Settings State
  const [webAppUrl, setWebAppUrl] = useState("");
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Fetch Google Sheets settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/config?key=google_sheets_settings");
        const json = await res.json();
        if (json.success && json.data?.webAppUrl) {
          setWebAppUrl(json.data.webAppUrl);
        }
      } catch (err) {
        console.error("Failed to load sheets config:", err);
      }
    };
    fetchSettings();
  }, []);

  // Save Web App URL configuration
  const handleSaveConfig = async () => {
    if (!webAppUrl.trim()) {
      return toast.error("Please enter a valid Apps Script URL");
    }
    setIsSavingConfig(true);
    const loadId = toast.loading("Saving Sheets Configuration...");
    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "google_sheets_settings",
          value: { webAppUrl: webAppUrl.trim() },
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Google Sheets configuration synced", { id: loadId });
      } else {
        throw new Error(json.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save configuration", { id: loadId });
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Filter orders matching active date and brand queries
  const matchingOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Brand filtering
      if (selectedBrand !== "ALL" && order.brandName !== selectedBrand) {
        return false;
      }

      // 2. Period filtering
      const orderDate = new Date(order.createdAt);
      if (filterPeriod === "DAY") {
        const localDate = orderDate.toLocaleDateString("en-CA"); // YYYY-MM-DD format
        return localDate === selectedDate;
      } else if (filterPeriod === "MONTH") {
        const year = orderDate.getFullYear();
        const month = String(orderDate.getMonth() + 1).padStart(2, "0");
        const localMonth = `${year}-${month}`; // YYYY-MM
        return localMonth === selectedMonth;
      }

      return true; // ALL-TIME
    });
  }, [orders, filterPeriod, selectedDate, selectedMonth, selectedBrand]);

  // Aggregate stats brand-wise
  const brandSummaries = useMemo(() => {
    const summaries: { [key: string]: any } = {};

    matchingOrders.forEach((o) => {
      const brand = o.brandName || "Unknown Brand";
      if (!summaries[brand]) {
        summaries[brand] = {
          brandName: brand,
          totalCount: 0,
          doneCount: 0,
          cancelledCount: 0,
          verifyingCount: 0,
          totalPayout: 0,
          adminProfit: 0,
          mediatorCommission: 0,
        };
      }

      summaries[brand].totalCount += 1;
      if (o.status === "CANCELLED") {
        summaries[brand].cancelledCount += 1;
      } else {
        summaries[brand].doneCount += 1; // "Done" count strictly excludes CANCELLED
      }

      if (o.status === "UNDER_VERIFICATION" || o.status === "REFUND_FORM_SUBMITTED") {
        summaries[brand].verifyingCount += 1;
      }

      const payout = o.refundDetails?.expectedPayout || (Number(o.amount) || 0) + (Number(o.lessAmount) || 0);
      summaries[brand].totalPayout += payout;
      summaries[brand].adminProfit += Number(o.adminProfit) || 0;
      summaries[brand].mediatorCommission += Number(o.mediatorCommission) || 0;
    });

    return Object.values(summaries).sort((a, b) => b.totalCount - a.totalCount);
  }, [matchingOrders]);

  // Totals calculations
  const totals = useMemo(() => {
    const t = {
      totalCount: 0,
      doneCount: 0,
      cancelledCount: 0,
      verifyingCount: 0,
      totalPayout: 0,
      adminProfit: 0,
      mediatorCommission: 0,
    };
    brandSummaries.forEach((s) => {
      t.totalCount += s.totalCount;
      t.doneCount += s.doneCount;
      t.cancelledCount += s.cancelledCount;
      t.verifyingCount += s.verifyingCount;
      t.totalPayout += s.totalPayout;
      t.adminProfit += s.adminProfit;
      t.mediatorCommission += s.mediatorCommission;
    });
    return t;
  }, [brandSummaries]);

  // Helpers to format CSV cells
  const escapeCsv = (val: any) => {
    if (val === undefined || val === null) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const getActivePeriodLabel = () => {
    if (filterPeriod === "DAY") return `Daily (${selectedDate})`;
    if (filterPeriod === "MONTH") return `Monthly (${selectedMonth})`;
    return "All Time";
  };

  // Download aggregated CSV report
  const downloadSummaryCsv = () => {
    if (brandSummaries.length === 0) {
      return toast.error("No data available to export");
    }

    const headers = [
      "Brand Name",
      "Period",
      "Total Orders",
      "Done Orders (Non-Cancelled)",
      "Cancelled Orders",
      "Verifying Claims",
      "Total Payout (INR)",
      "Admin Profit (INR)",
      "Mediator Commission (INR)",
    ];

    const rows = brandSummaries.map((s) => [
      s.brandName,
      getActivePeriodLabel(),
      s.totalCount,
      s.doneCount,
      s.cancelledCount,
      s.verifyingCount,
      s.totalPayout,
      s.adminProfit,
      s.mediatorCommission,
    ]);

    // Append total row
    rows.push([
      "TOTAL",
      getActivePeriodLabel(),
      totals.totalCount,
      totals.doneCount,
      totals.cancelledCount,
      totals.verifyingCount,
      totals.totalPayout,
      totals.adminProfit,
      totals.mediatorCommission,
    ]);

    const csvContent =
      "\uFEFF" + // UTF-8 BOM
      [headers.join(","), ...rows.map((row) => row.map(escapeCsv).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Brand_Wise_Orders_Summary_${getActivePeriodLabel().replace(/[\s()]/g, "_")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Summary spreadsheet downloaded");
  };

  // Download Detailed CSV report
  const downloadDetailedCsv = () => {
    if (matchingOrders.length === 0) {
      return toast.error("No order details available to export");
    }

    const headers = [
      "System Order ID",
      "Buyer Order ID",
      "Buyer Email",
      "Brand Name",
      "Product Code",
      "Amount",
      "Adjustments (Less Amount)",
      "Expected Payout",
      "Status",
      "Created At",
    ];

    const rows = matchingOrders.map((o) => [
      o.aspireOrderId,
      o.userOrderId || "N/A",
      o.buyerEmail || "N/A",
      o.brandName,
      o.productCode,
      o.amount,
      o.lessAmount || 0,
      o.refundDetails?.expectedPayout || (Number(o.amount) || 0) + (Number(o.lessAmount) || 0),
      o.status,
      new Date(o.createdAt).toLocaleString("en-GB"),
    ]);

    const csvContent =
      "\uFEFF" + // UTF-8 BOM
      [headers.join(","), ...rows.map((row) => row.map(escapeCsv).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Detailed_Orders_${getActivePeriodLabel().replace(/[\s()]/g, "_")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Detailed orders spreadsheet downloaded");
  };

  // Push Summary report to Google Sheets
  const pushToGoogleSheet = async () => {
    if (!webAppUrl) {
      return toast.error("Please configure and save your Google Apps Script URL first!");
    }
    if (brandSummaries.length === 0) {
      return toast.error("No active report data to push");
    }

    setIsPushing(true);
    const pushLoadId = toast.loading("Transmitting data to Google Sheets...");

    try {
      const headers = [
        "Brand Name",
        "Period",
        "Total Orders",
        "Done Orders (Non-Cancelled)",
        "Cancelled Orders",
        "Verifying Claims",
        "Total Payout (INR)",
        "Admin Profit (INR)",
        "Mediator Commission (INR)",
        "Synced Timestamp"
      ];

      const currentTimestamp = new Date().toLocaleString("en-GB");

      const rows = brandSummaries.map((s) => [
        s.brandName,
        getActivePeriodLabel(),
        s.totalCount,
        s.doneCount,
        s.cancelledCount,
        s.verifyingCount,
        s.totalPayout,
        s.adminProfit,
        s.mediatorCommission,
        currentTimestamp
      ]);

      // Push total row
      rows.push([
        "TOTAL SUMMARY",
        getActivePeriodLabel(),
        totals.totalCount,
        totals.doneCount,
        totals.cancelledCount,
        totals.verifyingCount,
        totals.totalPayout,
        totals.adminProfit,
        totals.mediatorCommission,
        currentTimestamp
      ]);

      const res = await fetch("/api/admin/push-to-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webAppUrl: webAppUrl.trim(),
          headers,
          rows,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Spreadsheet data successfully appended to Google Sheets!", { id: pushLoadId });
      } else {
        throw new Error(json.message || "Failed to append rows to Google Sheets.");
      }
    } catch (err: any) {
      toast.error(err.message || "Spreadsheet Synchronization Failed", { id: pushLoadId });
    } finally {
      setIsPushing(false);
    }
  };

  const appScriptCode = `function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Write headers if spreadsheet is brand new
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(payload.headers);
    }
    
    // Write report summary rows
    for (var i = 0; i < payload.rows.length; i++) {
      sheet.appendRow(payload.rows[i]);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Sheet synchronized successfully." }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  return (
    <div className="flex flex-col gap-8 md:gap-10 pb-10">
      
      {/* Tab Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Orders Reports Center</h2>
          <p className="mt-1 text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed max-w-lg">
            Generate and export daily brand-wise aggregates or detailed sheets. Seamlessly synchronize records straight to Google Sheets.
          </p>
        </div>
      </div>

      {/* Grid of Tools and Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Filters and Config Panel (Left Column) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Section 1: Filters */}
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" /> Configure Report Filters
            </h3>

            {/* Period selector buttons */}
            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest pl-1">Aggregate Interval</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/50 rounded-2xl border border-slate-100">
                {(["DAY", "MONTH", "ALL"] as const).map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setFilterPeriod(period)}
                    className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterPeriod === period ? "bg-white text-blue-600 shadow-sm border border-blue-50" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    {period === "DAY" ? "Daily" : period === "MONTH" ? "Monthly" : "All Time"}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Pickers */}
            {filterPeriod === "DAY" && (
              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest pl-1">Selected Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 outline-none text-xs font-bold text-slate-700 focus:bg-white focus:border-blue-500 transition-all font-mono"
                />
              </div>
            )}

            {filterPeriod === "MONTH" && (
              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest pl-1">Selected Month</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 outline-none text-xs font-bold text-slate-700 focus:bg-white focus:border-blue-500 transition-all font-mono"
                />
              </div>
            )}

            {/* Brand Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest pl-1">Filter Brand Name</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 outline-none text-xs font-bold text-slate-700 focus:bg-white focus:border-blue-500 transition-all"
              >
                <option value="ALL">ALL BRANDS</option>
                {allBrands.map((b) => (
                  <option key={b._id} value={b.name}>
                    {b.name.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Google Sheets Push Config */}
          <div className="bg-slate-900 rounded-[32px] p-6 text-white relative overflow-hidden shadow-xl border border-slate-800 space-y-6">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 h-36 w-36 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Google Sheets Sync
              </h3>
              <button
                type="button"
                onClick={() => setShowInstructions(!showInstructions)}
                className="text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
              >
                {showInstructions ? "Hide Instructions" : "Setup Code"}
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest pl-1">Apps Script Web App URL</label>
                <input
                  type="url"
                  placeholder="Paste script URL..."
                  value={webAppUrl}
                  onChange={(e) => setWebAppUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 outline-none text-xs font-medium text-white placeholder:text-slate-600 focus:bg-white/10 focus:border-emerald-500 transition-all font-mono"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={isSavingConfig}
                  className="flex-1 py-3 bg-white/10 border border-white/10 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-white/20 active:scale-95 transition-all text-white disabled:opacity-50"
                >
                  {isSavingConfig ? "Saving..." : "Save Settings"}
                </button>

                <button
                  type="button"
                  onClick={pushToGoogleSheet}
                  disabled={isPushing || brandSummaries.length === 0}
                  className="flex-[2] py-3 bg-emerald-600 rounded-2xl font-black text-[9px] uppercase tracking-widest text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-40"
                >
                  {isPushing ? "Pushing Data..." : "Push to Sheet"}
                </button>
              </div>
            </div>

            {/* Setup instructions drop-down */}
            <AnimatePresence>
              {showInstructions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-4 pt-4 border-t border-white/10 text-slate-300 text-[10px] leading-relaxed uppercase tracking-wider"
                >
                  <p className="font-bold text-white">To link your spreadsheet:</p>
                  <ol className="list-decimal pl-4 space-y-2 text-[9px]">
                    <li>Open your Google Sheet.</li>
                    <li>Go to <span className="text-white">Extensions &gt; Apps Script</span>.</li>
                    <li>Delete any code and paste the script below:</li>
                  </ol>
                  
                  <div className="relative">
                    <pre className="p-3 bg-black/60 rounded-xl font-mono text-[8px] text-emerald-400 overflow-x-auto select-all max-h-[150px] custom-scrollbar normal-case">
                      {appScriptCode}
                    </pre>
                  </div>

                  <ol className="list-decimal pl-4 space-y-2 text-[9px] start-[4]">
                    <li>Click <span className="text-white">Deploy &gt; New deployment</span>.</li>
                    <li>Select type: <span className="text-white">Web app</span>.</li>
                    <li>Set execute as: <span className="text-white">Me</span>, set access: <span className="text-white">Anyone</span>.</li>
                    <li>Deploy, authorize Google permissions, and copy the Web App URL here!</li>
                  </ol>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Aggregated Results Table (Right Column) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Spreadsheet Exporters */}
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Spreadsheet Actions</p>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mt-1">{matchingOrders.length} Matching Orders Listed</h4>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={downloadSummaryCsv}
                disabled={brandSummaries.length === 0}
                className="flex-1 sm:flex-initial px-5 py-3.5 bg-slate-900 hover:bg-black text-white text-[9px] font-black uppercase tracking-widest rounded-2xl active:scale-95 shadow-lg shadow-slate-900/10 transition-all flex items-center justify-center gap-2.5 disabled:opacity-40"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Download Summary
              </button>

              <button
                type="button"
                onClick={downloadDetailedCsv}
                disabled={matchingOrders.length === 0}
                className="flex-1 sm:flex-initial px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black uppercase tracking-widest rounded-2xl active:scale-95 shadow-lg shadow-blue-600/10 transition-all flex items-center justify-center gap-2.5 disabled:opacity-40"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Detailed Spreadsheet
              </button>
            </div>
          </div>

          {/* Grouped Table View */}
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aggregation Registry</span>
                <h3 className="text-lg font-black text-slate-900 uppercase mt-0.5">Brand-wise Orders Summary</h3>
              </div>
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 uppercase tracking-widest">
                {getActivePeriodLabel()}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Brand Name</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Total Orders</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Done (Completed)</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Cancelled</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Verifying</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Total Payout</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[11px] font-bold text-slate-700">
                  {brandSummaries.map((s) => (
                    <tr key={s.brandName} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 text-slate-900 uppercase font-black">{s.brandName}</td>
                      <td className="px-6 py-4 text-center">{s.totalCount}</td>
                      <td className="px-6 py-4 text-center text-emerald-600 bg-emerald-50/30 font-black">{s.doneCount}</td>
                      <td className="px-6 py-4 text-center text-rose-500">{s.cancelledCount}</td>
                      <td className="px-6 py-4 text-center text-blue-600">{s.verifyingCount}</td>
                      <td className="px-6 py-4 text-right text-slate-900 font-mono">₹{s.totalPayout.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-emerald-600 font-black font-mono">₹{s.adminProfit.toLocaleString()}</td>
                    </tr>
                  ))}

                  {brandSummaries.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">
                        No orders recorded matching filter coordinates
                      </td>
                    </tr>
                  )}

                  {brandSummaries.length > 0 && (
                    <tr className="bg-slate-50/80 font-black text-slate-900 border-t-2 border-slate-100">
                      <td className="px-6 py-5 text-sm uppercase">GRAND TOTALS</td>
                      <td className="px-6 py-5 text-center text-sm">{totals.totalCount}</td>
                      <td className="px-6 py-5 text-center text-sm text-emerald-600">{totals.doneCount}</td>
                      <td className="px-6 py-5 text-center text-sm text-rose-500">{totals.cancelledCount}</td>
                      <td className="px-6 py-5 text-center text-sm text-blue-600">{totals.verifyingCount}</td>
                      <td className="px-6 py-5 text-right text-sm font-mono text-slate-900">₹{totals.totalPayout.toLocaleString()}</td>
                      <td className="px-6 py-5 text-right text-sm font-mono text-emerald-600">₹{totals.adminProfit.toLocaleString()}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Toggle Raw Detail List */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setShowDetailedOrders(!showDetailedOrders)}
              className="w-full py-4 bg-white hover:bg-slate-50 border border-slate-100 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-3 text-slate-600 hover:text-slate-900"
            >
              <svg className={`w-4 h-4 transition-transform duration-300 ${showDetailedOrders ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              {showDetailedOrders ? "Collapse Detailed Mappings" : "Expand Detailed Mappings"}
            </button>

            <AnimatePresence>
              {showDetailedOrders && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden"
                >
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 sticky top-0 z-10 backdrop-blur-md">
                          <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Order Reference</th>
                          <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Brand Name</th>
                          <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Product Code</th>
                          <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Expected Payout</th>
                          <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                          <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Date Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-[10px] font-bold text-slate-600">
                        {matchingOrders.map((o) => (
                          <tr key={o._id} className="hover:bg-slate-50/20 transition-colors">
                            <td className="px-6 py-3 font-mono text-slate-900 select-all">{o.userOrderId || o.aspireOrderId}</td>
                            <td className="px-6 py-3 uppercase text-slate-800">{o.brandName}</td>
                            <td className="px-6 py-3 uppercase font-mono">{o.productCode}</td>
                            <td className="px-6 py-3 text-right font-mono text-slate-800">
                              ₹{(o.refundDetails?.expectedPayout || (Number(o.amount) || 0) + (Number(o.lessAmount) || 0)).toLocaleString()}
                            </td>
                            <td className="px-6 py-3 text-center">
                              <span className="inline-block px-2.5 py-1 text-[8px] font-black uppercase rounded-lg border bg-slate-50 border-slate-100 text-slate-500">
                                {o.status.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-right text-slate-400">
                              {new Date(o.createdAt).toLocaleDateString("en-GB")}
                            </td>
                          </tr>
                        ))}

                        {matchingOrders.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-10 text-[9px] font-black text-slate-300 uppercase tracking-widest italic">
                              No raw orders mapped to active coordinates
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
