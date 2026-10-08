"use client";

import React, { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileSpreadsheet, Download, Upload, CheckCircle2, AlertTriangle, 
  X, Filter, Calendar, RefreshCw, AlertCircle, Info, ChevronRight,
  Check, ArrowRight, ShieldCheck, HelpCircle
} from "lucide-react";
import toast from "react-hot-toast";

interface CsvBulkVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: any[];
  brands: string[];
  onSuccess: () => void;
}

interface ParsedVerificationRow {
  systemId: string;
  refId: string;
  brandName: string;
  dealType: string;
  userOrderId: string;
  amount: number;
  buyerMobile: string;
  currentStatus: string;
  approveVal: string;
  rejectVal: string;
  rejectionReason: string;
  action: "APPROVE" | "REJECT" | "SKIP";
  isValid: boolean;
  validationError?: string;
}

export function CsvBulkVerificationModal({
  isOpen,
  onClose,
  orders = [],
  brands = [],
  onSuccess,
}: CsvBulkVerificationModalProps) {
  const [activeTab, setActiveTab] = useState<"DOWNLOAD" | "UPLOAD">("DOWNLOAD");

  // Filters for template download
  const [selectedBrand, setSelectedBrand] = useState("ALL BRANDS");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedReviewType, setSelectedReviewType] = useState("ALL");
  const [selectedDealType, setSelectedDealType] = useState("ALL");
  const [showInstructions, setShowInstructions] = useState(true);

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedVerificationRow[]>([]);
  const [previewFilter, setPreviewFilter] = useState<"ALL" | "VALID" | "ERRORS" | "SKIPPED">("ALL");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Base list of orders in verifying status
  const verifyingOrders = useMemo(() => {
    return orders.filter(o => 
      ["UNDER_VERIFICATION", "REFUND_FORM_SUBMITTED"].includes(o.status)
    );
  }, [orders]);

  // Filtered orders matching user criteria for download
  const filteredOrders = useMemo(() => {
    return verifyingOrders.filter(order => {
      // 1. Brand Filter
      if (selectedBrand !== "ALL BRANDS" && order.brandName !== selectedBrand) {
        return false;
      }

      // 2. Date Range Filter
      const orderDate = order.createdAt ? new Date(order.createdAt) : null;
      if (startDate && orderDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (orderDate < start) return false;
      }
      if (endDate && orderDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (orderDate > end) return false;
      }

      // 3. Review Type Filter
      if (selectedReviewType !== "ALL" && order.reviewType !== selectedReviewType) {
        return false;
      }

      // 4. Deal Type Filter
      if (selectedDealType !== "ALL" && order.dealType !== selectedDealType) {
        return false;
      }

      return true;
    });
  }, [verifyingOrders, selectedBrand, startDate, endDate, selectedReviewType, selectedDealType]);

  if (!isOpen) return null;

  // Native RFC-4180 CSV Parser
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
          i++; // skip escaped quote
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
            i++; // skip newline char
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

  // 1. Download CSV Verification Sheet (BOM-encoded for seamless Excel / Sheets compatibility)
  const handleDownloadSheet = () => {
    if (filteredOrders.length === 0) {
      toast.error("No orders in 'Under Verification' match your selected filters.");
      return;
    }

    const headers = [
      "System ID (DO NOT EDIT)",
      "Ref ID (DO NOT EDIT)",
      "Brand Name",
      "Deal Type",
      "Order ID",
      "Refund Amount",
      "Buyer Number",
      "Status",
      "Approve (Enter YES)",
      "Reject (Enter YES)",
      "Reason of Rejection (Mandatory if Reject)"
    ];

    const dataRows = filteredOrders.map(ord => {
      const refundAmt = ord.refundDetails?.expectedPayout !== undefined && ord.refundDetails?.expectedPayout !== null
        ? ord.refundDetails.expectedPayout
        : (ord.dealType === "Empty Box" ? (ord.amount + (ord.lessAmount || 0)) : (ord.amount - (ord.lessAmount || 0)));

      const buyerPhone = ord.buyer?.mobile || ord.mobile || "N/A";

      return [
        ord.aspireOrderId || "",
        ord._id?.toString() || "",
        ord.brandName || "",
        ord.dealType || "Original",
        ord.userOrderId || "",
        refundAmt || 0,
        buyerPhone,
        ord.status || "UNDER_VERIFICATION",
        "", // Approve
        "", // Reject
        ""  // Reason
      ];
    });

    const csvContent = [
      headers.join(","),
      ...dataRows.map(row => row.map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `AspireMint_Bulk_Verification_${selectedBrand.replace(/\s+/g, '_')}_${dateStr}.csv`;
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Downloaded ${filteredOrders.length} orders for bulk verification!`);
  };

  // 2. Parse & Validate Uploaded File (.csv native, .xlsx dynamic)
  const handleFileUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    try {
      let rawRows: any[][] = [];

      const isExcel = uploadedFile.name.endsWith(".xlsx") || uploadedFile.name.endsWith(".xls");
      if (isExcel) {
        const XLSX = await import("xlsx");
        const data = await uploadedFile.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      } else {
        const text = await uploadedFile.text();
        rawRows = parseCSV(text);
      }

      if (rawRows.length < 2) {
        toast.error("The uploaded file is empty or missing data rows.");
        return;
      }

      // Quick lookup map of existing verifying orders
      const orderLookup = new Map<string, any>();
      verifyingOrders.forEach(ord => {
        orderLookup.set(ord._id.toString(), ord);
        if (ord.aspireOrderId) orderLookup.set(ord.aspireOrderId, ord);
      });

      const parsed: ParsedVerificationRow[] = [];

      // Start from index 1 to skip header
      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0 || row.every(cell => !cell)) continue;

        const systemId = String(row[0] || "").trim();
        const refId = String(row[1] || "").trim();
        const brandName = String(row[2] || "").trim();
        const dealType = String(row[3] || "").trim();
        const userOrderId = String(row[4] || "").trim();
        const amount = Number(row[5]) || 0;
        const buyerMobile = String(row[6] || "").trim();
        const currentStatus = String(row[7] || "").trim();

        const approveRaw = String(row[8] || "").trim().toUpperCase();
        const rejectRaw = String(row[9] || "").trim().toUpperCase();
        const reason = String(row[10] || "").trim();

        const isApprove = approveRaw === "YES" || approveRaw === "Y" || approveRaw === "APPROVE";
        const isReject = rejectRaw === "YES" || rejectRaw === "Y" || rejectRaw === "REJECT";

        // Validation logic
        let action: "APPROVE" | "REJECT" | "SKIP" = "SKIP";
        let isValid = true;
        let validationError: string | undefined = undefined;

        // Check if order exists in DB
        const matchedOrder = (refId && orderLookup.get(refId)) || (systemId && orderLookup.get(systemId));
        if (!matchedOrder) {
          isValid = false;
          validationError = "Order ID not found or already verified";
        } else if (isApprove && isReject) {
          isValid = false;
          validationError = "Conflict: Both Approve and Reject marked YES";
        } else if (isReject) {
          action = "REJECT";
          if (!reason) {
            isValid = false;
            validationError = "Rejection Reason is mandatory";
          }
        } else if (isApprove) {
          action = "APPROVE";
        } else {
          action = "SKIP";
        }

        parsed.push({
          systemId: systemId || matchedOrder?.aspireOrderId || "",
          refId: refId || matchedOrder?._id?.toString() || "",
          brandName: brandName || matchedOrder?.brandName || "",
          dealType: dealType || matchedOrder?.dealType || "",
          userOrderId: userOrderId || matchedOrder?.userOrderId || "",
          amount: amount || matchedOrder?.refundDetails?.expectedPayout || matchedOrder?.amount || 0,
          buyerMobile: buyerMobile || matchedOrder?.buyer?.mobile || "",
          currentStatus: currentStatus || matchedOrder?.status || "UNDER_VERIFICATION",
          approveVal: approveRaw,
          rejectVal: rejectRaw,
          rejectionReason: reason,
          action,
          isValid,
          validationError
        });
      }

      setParsedRows(parsed);
      toast.success(`Parsed ${parsed.length} rows successfully!`);
    } catch (err: any) {
      console.error("Error reading file:", err);
      toast.error("Failed to parse file. Please upload a valid .csv or .xlsx sheet.");
    }
  };

  // Upload summary counters
  const stats = useMemo(() => {
    let toApprove = 0;
    let toReject = 0;
    let errors = 0;
    let skipped = 0;

    parsedRows.forEach(r => {
      if (!r.isValid) errors++;
      else if (r.action === "APPROVE") toApprove++;
      else if (r.action === "REJECT") toReject++;
      else skipped++;
    });

    return {
      total: parsedRows.length,
      toApprove,
      toReject,
      errors,
      skipped,
      validActionCount: toApprove + toReject
    };
  }, [parsedRows]);

  // Filtered rows for the preview table
  const previewRows = useMemo(() => {
    return parsedRows.filter(r => {
      if (previewFilter === "VALID") return r.isValid && (r.action === "APPROVE" || r.action === "REJECT");
      if (previewFilter === "ERRORS") return !r.isValid;
      if (previewFilter === "SKIPPED") return r.isValid && r.action === "SKIP";
      return true;
    });
  }, [parsedRows, previewFilter]);

  // 3. Confirm & Execute Bulk Verification
  const handleConfirmProcessing = async () => {
    if (stats.validActionCount === 0) {
      toast.error("No valid orders marked for approval or rejection.");
      return;
    }

    if (stats.errors > 0) {
      const confirmContinue = window.confirm(
        `There are ${stats.errors} order(s) with errors (e.g. missing rejection reason). Proceed with the remaining ${stats.validActionCount} valid orders only?`
      );
      if (!confirmContinue) return;
    }

    const payloadItems = parsedRows
      .filter(r => r.isValid && (r.action === "APPROVE" || r.action === "REJECT"))
      .map(r => ({
        orderId: r.refId || r.systemId,
        refId: r.refId,
        action: r.action,
        reason: r.rejectionReason || undefined
      }));

    setIsProcessing(true);
    const loadingToast = toast.loading(`Processing ${payloadItems.length} orders in bulk...`);

    try {
      const res = await fetch("/api/orders/bulk-verify-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payloadItems }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to process bulk verification");
      }

      toast.success(json.message || "Orders updated successfully!", { id: loadingToast });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Error processing bulk verification", { id: loadingToast });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={isProcessing ? undefined : onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />

      {/* Main Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-[36px] shadow-2xl flex flex-col overflow-hidden border border-slate-100"
      >
        {/* Header */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-56 w-56 rounded-full blur-3xl opacity-20 bg-indigo-500 pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white shadow-inner border border-white/10">
                <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">
                    CSV Bulk Verification
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase tracking-widest border border-emerald-500/30">
                    Admin
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mt-0.5">
                  Approve or Reject hundreds of Under Verification refunds at once via Excel / CSV
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isProcessing}
              className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-all disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step Tabs Navigation */}
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10">
            <button
              onClick={() => setActiveTab("DOWNLOAD")}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === "DOWNLOAD"
                  ? "bg-white text-slate-900 shadow-md"
                  : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>1. Filter & Download Sheet</span>
              <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[8px] font-black">
                {filteredOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("UPLOAD")}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === "UPLOAD"
                  ? "bg-white text-slate-900 shadow-md"
                  : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>2. Upload & Process</span>
              {parsedRows.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[8px] font-black">
                  {parsedRows.length} Rows
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {activeTab === "DOWNLOAD" ? (
            /* TAB 1: FILTER & DOWNLOAD */
            <div className="space-y-6">
              {/* Instructions Banner */}
              {showInstructions && (
                <div className="p-5 rounded-[24px] bg-indigo-50/70 border border-indigo-100 text-indigo-950 relative">
                  <button
                    onClick={() => setShowInstructions(false)}
                    className="absolute top-4 right-4 text-indigo-400 hover:text-indigo-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="space-y-2 text-xs">
                      <h4 className="font-black uppercase tracking-wide text-indigo-900">
                        How Bulk Verification Works:
                      </h4>
                      <ol className="list-decimal pl-4 space-y-1 font-medium text-slate-700 leading-relaxed">
                        <li>
                          <strong>Apply Filters:</strong> Select brand, date duration, review type, or deal type below to target specific orders.
                        </li>
                        <li>
                          <strong>Download Sheet:</strong> Click <em>&quot;Download Verification Sheet&quot;</em> to get an Excel file containing all 11 columns with currently verifying orders.
                        </li>
                        <li>
                          <strong>Fill in Excel:</strong>
                          <ul className="list-disc pl-4 mt-1 space-y-0.5">
                            <li>To <strong>Approve</strong>: Type <code className="bg-white px-1.5 py-0.5 rounded text-emerald-700 font-bold border">YES</code> in the <em>Approve</em> column.</li>
                            <li>To <strong>Reject</strong>: Type <code className="bg-white px-1.5 py-0.5 rounded text-rose-700 font-bold border">YES</code> in the <em>Reject</em> column and enter the mandatory reason in <em>Reason of Rejection</em>.</li>
                            <li>To <strong>Skip</strong>: Leave both blank, and the order will remain in Under Verification.</li>
                          </ul>
                        </li>
                        <li>
                          <strong>Upload in Step 2:</strong> Drop the saved sheet back in, preview the changes, and click confirm. Up to 400 orders are processed with automatic emails sent to buyers.
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {/* Filter Controls Box */}
              <div className="p-6 rounded-[28px] bg-slate-50 border border-slate-100 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Export Filters
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Matching: {filteredOrders.length} / {verifyingOrders.length} orders
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Brand Filter */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
                      Brand
                    </label>
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="w-full h-12 px-3.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      {brands.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  {/* Review Type Filter */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
                      Review Type
                    </label>
                    <select
                      value={selectedReviewType}
                      onChange={(e) => setSelectedReviewType(e.target.value)}
                      className="w-full h-12 px-3.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      <option value="ALL">All Review Types</option>
                      <option value="Review">Review</option>
                      <option value="Rating">Rating</option>
                      <option value="Order">Order Only</option>
                    </select>
                  </div>

                  {/* Deal Type Filter */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
                      Deal Type
                    </label>
                    <select
                      value={selectedDealType}
                      onChange={(e) => setSelectedDealType(e.target.value)}
                      className="w-full h-12 px-3.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      <option value="ALL">All Deal Types</option>
                      <option value="Original">Original</option>
                      <option value="Empty Box">Empty Box</option>
                      <option value="Exchange">Exchange</option>
                    </select>
                  </div>

                  {/* Reset Filters */}
                  <div className="space-y-1.5 flex flex-col justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBrand("ALL BRANDS");
                        setStartDate("");
                        setEndDate("");
                        setSelectedReviewType("ALL");
                        setSelectedDealType("ALL");
                      }}
                      className="h-12 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-white text-[10px] font-black uppercase tracking-wider transition-all"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>

                {/* Date Duration Filter */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      From Date (Duration Start)
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full h-12 px-3.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      To Date (Duration End)
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full h-12 px-3.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Action Banner with Download Button */}
              <div className="p-6 rounded-[28px] bg-gradient-to-tr from-slate-900 to-indigo-900 text-white flex flex-col sm:flex-row items-center justify-between gap-5 shadow-lg">
                <div>
                  <h4 className="text-sm md:text-base font-black uppercase tracking-tight">
                    Ready to Export {filteredOrders.length} Orders
                  </h4>
                  <p className="text-[11px] font-medium text-slate-300 mt-0.5">
                    Generates Excel sheet with System ID, Ref ID, Order ID, Payout Amount, and Decision columns.
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleDownloadSheet}
                    disabled={filteredOrders.length === 0}
                    className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Verification Sheet</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("UPLOAD")}
                    className="px-5 py-4 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2"
                  >
                    <span>Next: Upload</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: UPLOAD & PROCESS */
            <div className="space-y-6">
              {/* Drag & Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 md:p-12 rounded-[32px] border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center text-center ${
                  isDragOver
                    ? "border-indigo-500 bg-indigo-50/50"
                    : "border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                  }}
                />

                <div className="h-16 w-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-sm border border-indigo-100">
                  <Upload className="w-8 h-8" />
                </div>

                <h3 className="text-sm md:text-base font-black uppercase tracking-tight text-slate-800">
                  {file ? file.name : "Drop Filled Excel / CSV File Here"}
                </h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Supports .xlsx, .xls, and .csv files with up to 400 orders
                </p>

                {file && (
                  <span className="mt-3 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-200">
                    ✓ File Loaded: {(file.size / 1024).toFixed(1)} KB
                  </span>
                )}
              </div>

              {/* Statistics Counters */}
              {parsedRows.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                      Total Rows
                    </span>
                    <span className="text-xl font-black text-slate-800 mt-1 block">
                      {stats.total}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block">
                      To Approve
                    </span>
                    <span className="text-xl font-black text-emerald-700 mt-1 block">
                      {stats.toApprove}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
                    <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest block">
                      To Reject
                    </span>
                    <span className="text-xl font-black text-rose-700 mt-1 block">
                      {stats.toReject}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest block">
                      Errors
                    </span>
                    <span className="text-xl font-black text-amber-700 mt-1 block">
                      {stats.errors}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 col-span-2 sm:col-span-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                      Skipped
                    </span>
                    <span className="text-xl font-black text-slate-600 mt-1 block">
                      {stats.skipped}
                    </span>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {parsedRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Parsed Verification Preview ({previewRows.length})
                    </h4>

                    {/* Filter Preview Tabs */}
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-[9px] font-black uppercase tracking-wider">
                      {(["ALL", "VALID", "ERRORS", "SKIPPED"] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setPreviewFilter(tab)}
                          className={`px-3 py-1.5 rounded-lg transition-all ${
                            previewFilter === tab
                              ? "bg-white text-slate-900 shadow-sm"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border border-slate-200/80 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-[9px] font-black text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Order ID</th>
                          <th className="py-3 px-4">Brand</th>
                          <th className="py-3 px-4">Buyer Phone</th>
                          <th className="py-3 px-4">Refund Amount</th>
                          <th className="py-3 px-4">Action</th>
                          <th className="py-3 px-4">Rejection Reason / Note</th>
                          <th className="py-3 px-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {previewRows.map((row, idx) => (
                          <tr
                            key={idx}
                            className={`hover:bg-slate-50/60 transition-colors ${
                              !row.isValid ? "bg-rose-50/30" : ""
                            }`}
                          >
                            <td className="py-3 px-4 font-mono font-bold text-slate-800">
                              {row.userOrderId || row.systemId}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-700">
                              {row.brandName}
                            </td>
                            <td className="py-3 px-4 text-slate-600 font-mono">
                              {row.buyerMobile}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              ₹{row.amount.toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              {row.action === "APPROVE" ? (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider">
                                  Approve
                                </span>
                              ) : row.action === "REJECT" ? (
                                <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[9px] font-black uppercase tracking-wider">
                                  Reject
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-wider">
                                  Skip
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                              {row.validationError ? (
                                <span className="text-rose-600 font-bold flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  {row.validationError}
                                </span>
                              ) : (
                                row.rejectionReason || "—"
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {row.isValid ? (
                                <span className="text-emerald-600 font-bold text-[10px] uppercase">
                                  ✓ Ready
                                </span>
                              ) : (
                                <span className="text-rose-600 font-bold text-[10px] uppercase">
                                  ✕ Error
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Confirmation Bar (Shown in Tab 2 when rows are loaded) */}
        {activeTab === "UPLOAD" && parsedRows.length > 0 && (
          <div className="p-6 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            <div>
              <div className="text-xs font-black text-slate-900 uppercase">
                Ready to Process: {stats.validActionCount} Orders
              </div>
              <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                {stats.toApprove} will be approved, {stats.toReject} will be rejected with notifications dispatched.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setParsedRows([]);
                  setFile(null);
                }}
                disabled={isProcessing}
                className="px-5 py-3.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-white text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
              >
                Clear File
              </button>

              <button
                type="button"
                onClick={handleConfirmProcessing}
                disabled={isProcessing || stats.validActionCount === 0}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-black uppercase tracking-wider shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Processing In Batches...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Confirm & Process {stats.validActionCount} Orders</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
