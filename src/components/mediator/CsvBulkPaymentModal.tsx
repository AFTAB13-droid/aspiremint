"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Download, Upload, CheckCircle2, AlertTriangle, X, 
  FileSpreadsheet, Calendar, User, Clock, RefreshCw, HelpCircle 
} from "lucide-react";
import toast from "react-hot-toast";

interface CsvBulkPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: any[];
  payers: { _id: string; name: string }[];
  onConfirm: (payments: any[]) => Promise<void>;
  loading: boolean;
}

interface ParsedPaymentRow {
  orderId: string;
  orderRef: string;
  buyerOrderId: string;
  buyerEmail: string;
  expectedAmount: number;
  paidByName: string;
  paidAmount: number;
  paidAt: string;
  transactionId: string;
  status: "VALID" | "WARNING" | "ERROR" | "SKIPPED";
  statusText: string;
}

export function CsvBulkPaymentModal({
  isOpen,
  onClose,
  orders = [],
  payers = [],
  onConfirm,
  loading
}: CsvBulkPaymentModalProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [defaultDate, setDefaultDate] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedPaymentRow[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Download CSV Template with current pending orders
  const handleDownloadTemplate = () => {
    if (orders.length === 0) {
      toast.error("No approved refunds currently require payment.");
      return;
    }

    const headers = [
      "System ID (DO NOT EDIT)",
      "Order Reference",
      "Buyer Order ID",
      "Buyer Email",
      "Expected Refund Amount",
      "Refund Payer Name (Optional)",
      "Paid Amount (Optional - Defaults to Expected)",
      "Payment Date YYYY-MM-DD (Optional - Defaults to Selector/Today)",
      "Transaction ID / UTR (Optional)"
    ];

    const rows = orders.map(order => [
      order._id,
      order.aspireOrderId || "",
      order.userOrderId || "",
      order.buyerEmail || "",
      order.refundDetails?.expectedPayout || order.amount || 0,
      "", // Payer Name (optional)
      "", // Paid Amount (optional)
      "", // Payment Date (optional)
      ""  // Transaction ID (optional)
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Approved_Refunds_Template_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Active refunds CSV template downloaded.");
  };

  // 2. Parse CSV text into tokens
  const parseCSV = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentToken = "";

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          currentToken += '"';
          i++; // skip next quote
        } else if (char === '"') {
          inQuotes = false;
        } else {
          currentToken += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          row.push(currentToken.trim());
          currentToken = "";
        } else if (char === '\r' || char === '\n') {
          row.push(currentToken.trim());
          currentToken = "";
          if (row.length > 0 && row.some(cell => cell !== "")) {
            lines.push(row);
          }
          row = [];
          if (char === '\r' && nextChar === '\n') {
            i++; // skip next char
          }
        } else {
          currentToken += char;
        }
      }
    }

    if (currentToken || row.length > 0) {
      row.push(currentToken.trim());
      if (row.some(cell => cell !== "")) {
        lines.push(row);
      }
    }

    return lines;
  };

  // 3. Process the file uploaded
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a valid CSV file.");
      return;
    }

    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      try {
        const lines = parseCSV(text);
        if (lines.length < 2) {
          toast.error("CSV has no data rows.");
          return;
        }

        // Header mapping
        const headers = lines[0].map(h => h.toLowerCase().trim());
        const sysIdIdx = headers.findIndex(h => h.includes("system id") || h.includes("id"));
        const orderRefIdx = headers.findIndex(h => h.includes("order reference") || h.includes("ref"));
        const expectedAmtIdx = headers.findIndex(h => h.includes("expected") || h.includes("refund amount"));
        const payerNameIdx = headers.findIndex(h => h.includes("payer name") || h.includes("paid by"));
        const paidAmtIdx = headers.findIndex(h => h.includes("paid amount") || h.includes("refund amount"));
        const dateIdx = headers.findIndex(h => h.includes("date"));
        const txIdIdx = headers.findIndex(h => h.includes("transaction") || h.includes("utr"));

        const parsedRowsTemp: ParsedPaymentRow[] = [];

        for (let i = 1; i < lines.length; i++) {
          const row = lines[i];
          if (row.length === 0 || row.every(cell => cell === "")) continue;

          // Attempt matching order
          const sysId = sysIdIdx !== -1 ? row[sysIdIdx] : "";
          const orderRef = orderRefIdx !== -1 ? row[orderRefIdx] : "";
          
          let matchedOrder = orders.find(o => 
            (sysId && o._id?.toString() === sysId) || 
            (orderRef && o.aspireOrderId?.toString() === orderRef)
          );

          // Payer Details
          const rawPayerName = payerNameIdx !== -1 ? row[payerNameIdx] : "";
          const rawPaidAmt = paidAmtIdx !== -1 ? row[paidAmtIdx] : "";
          const rawDate = dateIdx !== -1 ? row[dateIdx] : "";
          const rawTxId = txIdIdx !== -1 ? row[txIdIdx] : "";

          // Translate "me" payer name if mediator paid it themselves
          const mediatorPayer = payers.find(p => (p as any).isSelf || p._id === "mediator-self");
          const mediatorName = mediatorPayer ? mediatorPayer.name : "ME (Mediator)";
          let finalPayerName = rawPayerName;
          if (rawPayerName.trim().toLowerCase() === "me") {
            finalPayerName = mediatorName;
          }

          const expectedAmount = matchedOrder ? (matchedOrder.refundDetails?.expectedPayout || matchedOrder.amount || 0) : 0;
          const paidAmount = rawPaidAmt ? parseFloat(rawPaidAmt) : expectedAmount;
          const paidAt = rawDate || defaultDate || ""; // Leave empty if not in CSV and not in date picker

          // Check if row is explicitly skipped by the user (skip/no in name or amount, or amount is 0)
          const lowerPayerName = rawPayerName.trim().toLowerCase();
          const lowerPaidAmt = rawPaidAmt.trim().toLowerCase();
          const isSkipped = 
            lowerPayerName === "skip" || 
            lowerPayerName === "no" || 
            lowerPaidAmt === "skip" || 
            lowerPaidAmt === "no" || 
            lowerPaidAmt === "0" ||
            (rawPaidAmt.trim() !== "" && parseFloat(rawPaidAmt) === 0);
          
          let status: "VALID" | "WARNING" | "ERROR" | "SKIPPED" = "VALID";
          let statusText = "Ready to pay";

          if (isSkipped) {
            status = "SKIPPED";
            statusText = "Skipped by user";
          } else if (!matchedOrder) {
            status = "ERROR";
            statusText = "Order not found in pending list";
          } else if (matchedOrder.status !== "REFUND_APPROVED") {
            status = "WARNING";
            statusText = `Current status is ${matchedOrder.status}`;
          } else if (isNaN(paidAmount) || paidAmount <= 0) {
            status = "ERROR";
            statusText = "Invalid payout amount";
          }

          parsedRowsTemp.push({
            orderId: matchedOrder?._id || sysId || "",
            orderRef: matchedOrder?.aspireOrderId || orderRef || "Unknown",
            buyerOrderId: matchedOrder?.userOrderId || "N/A",
            buyerEmail: matchedOrder?.buyerEmail || "N/A",
            expectedAmount,
            paidByName: finalPayerName,
            paidAmount,
            paidAt,
            transactionId: rawTxId,
            status,
            statusText
          });
        }

        setParsedRows(parsedRowsTemp);
        toast.success(`Parsed ${parsedRowsTemp.length} rows successfully.`);
      } catch (err) {
        console.error(err);
        toast.error("Error parsing CSV. Please check formatting.");
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleClear = () => {
    setCsvFile(null);
    setParsedRows([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirmSubmit = async () => {
    const validPayments = parsedRows.filter(r => r.status !== "ERROR" && r.status !== "SKIPPED");
    if (validPayments.length === 0) {
      toast.error("No valid orders are available to pay in this preview.");
      return;
    }

    const payload = validPayments.map(p => ({
      orderId: p.orderId,
      transactionId: p.transactionId,
      paidByName: p.paidByName,
      paidAmount: p.paidAmount,
      paidAt: p.paidAt || defaultDate || "" // Empty string fallback allows backend to use current server time
    }));

    await onConfirm(payload);
    handleClear();
  };

  const errorsCount = parsedRows.filter(r => r.status === "ERROR").length;
  const warningsCount = parsedRows.filter(r => r.status === "WARNING").length;
  const validCount = parsedRows.filter(r => r.status === "VALID").length;
  const skippedCount = parsedRows.filter(r => r.status === "SKIPPED").length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 50 }}
        className="relative w-full max-w-5xl bg-white rounded-[32px] md:rounded-[40px] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Header Design */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white relative shrink-0">
          <div className="absolute top-0 right-0 h-32 w-32 bg-white/5 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none" />
          
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 h-8 w-8 flex items-center justify-center rounded-full bg-white/10 border border-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all z-10"
          >
             <X className="w-4 h-4" />
          </button>

          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            CSV Bulk Payment Manager
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Disburse approved refunds dynamically via spreadsheet upload</p>
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar flex flex-col">
          
          {parsedRows.length === 0 ? (
            // Upload & Download Section
            <div className="space-y-6 flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
              {/* Instructions and Guidelines Card */}
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  CSV Formatting Instructions
                </h4>
                <ul className="list-disc list-inside text-[11px] text-slate-500 font-bold space-y-1.5 leading-relaxed uppercase tracking-tight">
                  <li>
                    <span className="text-slate-700 font-black">Refund Payer Name</span>: Enter any custom payer name. If you paid it yourself, enter <code className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-black text-[10px]">me</code>.
                  </li>
                  <li>
                    <span className="text-slate-700 font-black">Payment Date</span>: Enter the date (YYYY-MM-DD). If left blank, the system uses the <span className="text-slate-700 font-black">Default Payment Date</span> selector below. If both are unselected, the server uses the <span className="text-slate-700 font-black">Current Payout Execution Time</span>.
                  </li>
                  <li>
                    <span className="text-slate-700 font-black">System ID</span>: DO NOT modify the ID value; it identifies the order in the database.
                  </li>
                  <li>
                    <span className="text-slate-700 font-black">How to Skip Payouts</span>: If you have e.g. 300 entries in the sheet but want to pay only 200, you can either **delete the 100 rows** you don't want to pay, or write <code className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-black text-[10px]">skip</code> or <code className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-black text-[10px]">no</code> in the <span className="text-slate-700 font-black">Refund Payer Name</span> or <span className="text-slate-700 font-black">Paid Amount</span> columns, or set <span className="text-slate-700 font-black">Paid Amount</span> to 0. Those rows will be safely ignored.
                  </li>
                </ul>
              </div>

              <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-600" />
                  Step 1: Download Active Payouts
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Get a CSV template pre-populated with all orders that are currently approved for refund and assigned to you. Fill in the optional Payer Name, Custom Payout Amount, and UTR code in Excel/Google Sheets.
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  className="h-12 px-6 bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all inline-flex items-center gap-2 shadow-md active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  Generate CSV template ({orders.length} Pending)
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  Step 2: Upload Filled Payout CSV
                </h3>
                
                {/* Drag and Drop Container */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 ${
                    isDragOver 
                    ? "border-blue-500 bg-blue-50/50 scale-[0.99] shadow-inner" 
                    : "border-slate-200 hover:border-blue-400 hover:bg-slate-50/50"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".csv"
                    className="hidden"
                  />
                  <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-700">Drag & drop your CSV file here</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">or click to browse local files</p>
                  </div>
                </div>
              </div>

              {/* Date Selector */}
              <div className="flex flex-col gap-1.5 max-w-xs">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Default Payment Date (Optional)
                </span>
                <input 
                  type="date" 
                  value={defaultDate} 
                  onChange={(e) => setDefaultDate(e.target.value)}
                  className="h-12 bg-white border border-slate-200 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
                />
              </div>
            </div>
          ) : (
            // Preview Section
            <div className="flex-1 flex flex-col min-h-0 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-100 shrink-0">
                <div className="flex items-center gap-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">
                    Payout Preview
                  </h3>
                  <div className="flex gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 text-[9px] font-black border border-emerald-200">
                      {validCount} READY
                    </span>
                    {skippedCount > 0 && (
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[9px] font-black border border-slate-200">
                        {skippedCount} SKIPPED
                      </span>
                    )}
                    {warningsCount > 0 && (
                      <span className="px-2.5 py-1 rounded-md bg-orange-100 text-orange-700 text-[9px] font-black border border-orange-200">
                        {warningsCount} WARNINGS
                      </span>
                    )}
                    {errorsCount > 0 && (
                      <span className="px-2.5 py-1 rounded-md bg-red-100 text-red-700 text-[9px] font-black border border-red-200">
                        {errorsCount} ERRORS
                      </span>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={handleClear}
                  className="h-9 px-4 rounded-xl border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-600 bg-white text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  Upload New File
                </button>
              </div>

              {/* Table wrapper */}
              <div className="flex-1 min-h-[300px] border border-slate-100 rounded-3xl overflow-hidden bg-white shadow-inner flex flex-col">
                <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
                  <table className="hidden md:table w-full text-left border-separate border-spacing-0">
                    <thead>
                      <tr className="bg-slate-50/60 sticky top-0 backdrop-blur-md z-10">
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Order ID</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Buyer</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Expected Amount</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Paid Amount</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Payer Name</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Paid Date</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">UTR / Tx ID</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {parsedRows.map((row, idx) => (
                        <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-[12px] font-black text-slate-900 tracking-tight block uppercase">{row.orderRef}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 block">Cust ID: {row.buyerOrderId}</span>
                          </td>
                          <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{row.buyerEmail}</td>
                          <td className="px-6 py-4 text-center text-[11px] font-black text-slate-400">₹{row.expectedAmount}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`text-[12px] font-black ${row.paidAmount !== row.expectedAmount ? 'text-orange-600' : 'text-slate-900'}`}>
                              ₹{row.paidAmount}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                            {row.paidByName || <span className="text-slate-300 italic">Default</span>}
                          </td>
                          <td className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 tracking-wider">
                            {row.paidAt || <span className="text-slate-300 italic">Current Time</span>}
                          </td>
                          <td className="px-6 py-4 text-[10px] font-bold text-slate-500 tracking-wider">
                            {row.transactionId || <span className="text-slate-300 italic">Auto-gen</span>}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {row.status === "VALID" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                              {row.status === "WARNING" && <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />}
                              {row.status === "ERROR" && <X className="w-3.5 h-3.5 text-red-500" />}
                              {row.status === "SKIPPED" && <X className="w-3.5 h-3.5 text-slate-400" />}
                              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                row.status === "VALID" ? "bg-emerald-50 text-emerald-600" :
                                row.status === "WARNING" ? "bg-orange-50 text-orange-600" :
                                row.status === "SKIPPED" ? "bg-slate-100 text-slate-500" :
                                "bg-red-50 text-red-600"
                              }`}>
                                {row.statusText}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Mobile Card Layout */}
                  <div className="md:hidden divide-y divide-slate-100 flex flex-col p-4 space-y-4">
                    {parsedRows.map((row, idx) => (
                      <div key={idx} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 space-y-3">
                         {/* Header: Order ID & Status */}
                         <div className="flex justify-between items-start gap-2">
                            <div>
                               <span className="text-[11px] font-black text-slate-900 tracking-tight block uppercase">{row.orderRef}</span>
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">Cust ID: {row.buyerOrderId}</span>
                            </div>
                            <div className="inline-flex items-center gap-1 shrink-0">
                               {row.status === "VALID" && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                               {row.status === "WARNING" && <AlertTriangle className="w-3 h-3 text-orange-500" />}
                               {row.status === "ERROR" && <X className="w-3.5 h-3.5 text-red-500" />}
                               {row.status === "SKIPPED" && <X className="w-3 h-3 text-slate-400" />}
                               <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                 row.status === "VALID" ? "bg-emerald-50 text-emerald-600" :
                                 row.status === "WARNING" ? "bg-orange-50 text-orange-600" :
                                 row.status === "SKIPPED" ? "bg-slate-100 text-slate-500" :
                                 "bg-red-50 text-red-600"
                               }`}>
                                 {row.statusText}
                               </span>
                            </div>
                         </div>

                         {/* Details Grid */}
                         <div className="grid grid-cols-2 gap-3 text-[10px] pt-2 border-t border-slate-100/50">
                            <div>
                               <span className="text-slate-400 font-bold uppercase tracking-widest block text-[8px] mb-0.5">Buyer</span>
                               <span className="font-bold text-slate-600 truncate block lowercase">{row.buyerEmail}</span>
                            </div>
                            <div>
                               <span className="text-slate-400 font-bold uppercase tracking-widest block text-[8px] mb-0.5">Expected / Paid</span>
                               <span className="font-black text-slate-900 block">
                                 ₹{row.expectedAmount} / <span className={row.paidAmount !== row.expectedAmount ? 'text-orange-600' : 'text-emerald-600'}>₹{row.paidAmount}</span>
                               </span>
                            </div>
                            <div>
                               <span className="text-slate-400 font-bold uppercase tracking-widest block text-[8px] mb-0.5">Payer Name</span>
                               <span className="font-bold text-slate-700 block uppercase">{row.paidByName || "Default"}</span>
                            </div>
                            <div>
                               <span className="text-slate-400 font-bold uppercase tracking-widest block text-[8px] mb-0.5">Date & UTR</span>
                               <span className="font-bold text-slate-500 block uppercase truncate">
                                 {row.paidAt || "Current Time"} • {row.transactionId || "Auto-gen"}
                               </span>
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Informative Label */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-start gap-3 shrink-0">
                <HelpCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-800">Preview Confirmation Note</p>
                  <p className="text-[11px] font-bold text-slate-500 leading-relaxed mt-1 uppercase tracking-tight">
                    This is a preview of the bulk payments to be processed. Confirming this action will update the matched {validCount} orders as successfully paid and completed in the system database under that refund payer.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <button 
            onClick={onClose}
            className="h-12 px-8 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 text-[10px] font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all shadow-sm"
          >
            Cancel
          </button>
          
          {parsedRows.length > 0 && (
            <button 
              disabled={loading || validCount === 0}
              onClick={handleConfirmSubmit}
              className="h-12 px-10 bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Process ({validCount} Payments)</span>
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
