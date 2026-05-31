"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface Mediator {
  _id: string;
  name: string;
  email: string;
}

interface Brand {
  _id: string;
  name: string;
}

interface ParsedRow {
  brandName: string;
  productDetails: string;
  productLink: string;
  marketplace: string;
  dealType: "Original" | "Empty Box" | "Exchange";
  reviewType: string;
  reviewSlots: number;
  ratingSlots: number;
  onlyOrderSlots: number;
  submittedSlots: number;
  commission: number;
  juhiCommission: number;
  originalCommission: number;
  productImage: string;
  userRemarks: string;
  mediatorRemarks: string;
  remarks: string;
  mediatorsStr: string;
}

interface ValidatedRow {
  index: number;
  data: ParsedRow;
  generatedCode: string;
  isValid: boolean;
  errors: string[];
  resolvedMediators: { mediatorId: string; commission: number; name: string }[];
}

interface Props {
  onSuccess: () => void;
}

const DEFAULT_IMAGE_PLACEHOLDER = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60";

export const BulkDealsUpload: React.FC<Props> = ({ onSuccess }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [mediators, setMediators] = useState<Mediator[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [brandsRes, mediatorsRes] = await Promise.all([
        fetch("/api/brands"),
        fetch("/api/users?role=MEDIATOR&limit=100")
      ]);
      const brandsJson = await brandsRes.json();
      const mediatorsJson = await mediatorsRes.json();

      if (brandsJson.success) setBrands(brandsJson.data);
      if (mediatorsJson.success) {
        setMediators(mediatorsJson.data.filter((m: any) => !m.name.toLowerCase().includes("juhi")));
      }
    } catch (err) {
      toast.error("Failed to load active system brands and mediators");
    } finally {
      setLoadingData(false);
    }
  };

  // Helper to parse simple CSV line
  const parseCSVLine = (text: string): string[] => {
    const result: string[] = [];
    let insideQuote = false;
    let entry = "";
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        result.push(entry.trim());
        entry = "";
      } else {
        entry += char;
      }
    }
    result.push(entry.trim());
    return result;
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length <= 1) {
        toast.error("CSV contains no data rows");
        return;
      }

      // Headers mapping
      const rawHeaders = parseCSVLine(lines[0]);
      const headers = rawHeaders.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ""));

      const rows: ParsedRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length < 2) continue; // Skip blank lines

        const getVal = (possibleHeaders: string[], fallbackVal: string = ""): string => {
          for (const ph of possibleHeaders) {
            const index = headers.indexOf(ph.toLowerCase().replace(/[^a-z0-9]/g, ""));
            if (index !== -1 && values[index] !== undefined) {
              return values[index];
            }
          }
          return fallbackVal;
        };

        const getNum = (possibleHeaders: string[], fallbackVal: number = 0): number => {
          const raw = getVal(possibleHeaders, fallbackVal.toString());
          const clean = raw.replace(/[^0-9.-]/g, "");
          const num = parseFloat(clean);
          return isNaN(num) ? fallbackVal : num;
        };

        const brandName = getVal(["brandName", "brand", "brand_name"]);
        const productDetails = getVal(["productDetails", "product", "product_details", "description"]);
        const productLink = getVal(["productLink", "link", "product_link", "url"]);
        const marketplace = getVal(["marketplace", "site", "platform"], "Flipkart");
        
        let dealTypeRaw = getVal(["dealType", "deal_type", "type"], "Original").toLowerCase();
        let dealType: "Original" | "Empty Box" | "Exchange" = "Original";
        if (dealTypeRaw.includes("empty")) dealType = "Empty Box";
        else if (dealTypeRaw.includes("exchange")) dealType = "Exchange";

        const reviewType = getVal(["reviewType", "review_type", "strategies"], "REVIEW");

        const reviewSlots = getNum(["reviewSlots", "review_stock", "stock_review"], 0);
        const ratingSlots = getNum(["ratingSlots", "rating_stock", "stock_rating"], 0);
        const onlyOrderSlots = getNum(["onlyOrderSlots", "order_stock", "stock_order"], 0);
        const submittedSlots = getNum(["submittedSlots", "submitted_stock", "stock_submitted"], 0);

        const commission = getNum(["commission", "rate", "standard_rate"], 0);
        const juhiCommission = getNum(["juhiCommission", "juhi_rate", "juhi_less"], 0);
        const originalCommission = getNum(["originalCommission", "original_rate", "admin_rate"], 0);

        const productImage = getVal(["productImage", "image", "photo_url", "photo"], "");
        const userRemarks = getVal(["userRemarks", "user_notes", "buyer_remarks"], "");
        const mediatorRemarks = getVal(["mediatorRemarks", "mediator_notes", "internal_notes"], "");
        const remarks = getVal(["remarks", "notes", "general_remarks"], "");
        const mediatorsStr = getVal(["mediators", "mediator", "mediator_names", "assigned_mediators", "specialists"], "");

        rows.push({
          brandName,
          productDetails,
          productLink,
          marketplace,
          dealType,
          reviewType,
          reviewSlots,
          ratingSlots,
          onlyOrderSlots,
          submittedSlots,
          commission,
          juhiCommission,
          originalCommission,
          productImage,
          userRemarks,
          mediatorRemarks,
          remarks,
          mediatorsStr
        });
      }

      validateAndParseRows(rows);
    };

    reader.readAsText(file);
  };

  const validateAndParseRows = async (parsed: ParsedRow[]) => {
    const results: ValidatedRow[] = [];
    const generatedCodesSet = new Set<string>();

    for (let idx = 0; idx < parsed.length; idx++) {
      const row = parsed[idx];
      const errors: string[] = [];

      // Required fields
      if (!row.brandName) errors.push("Brand Name is required.");
      if (!row.productDetails) errors.push("Product Description is required.");
      if (!row.productLink) errors.push("Direct Purchase Link is required.");

      // Fuzzy check for Brand matching existing database Brands
      const matchedBrand = brands.find(b => b.name.toLowerCase() === row.brandName.toLowerCase());
      let correctedBrandName = row.brandName;
      if (!matchedBrand && row.brandName) {
        // Try fuzzy check (case-insensitive substring match)
        const fuzzyMatch = brands.find(b => b.name.toLowerCase().includes(row.brandName.toLowerCase()) || row.brandName.toLowerCase().includes(b.name.toLowerCase()));
        if (fuzzyMatch) {
          correctedBrandName = fuzzyMatch.name;
        } else {
          errors.push(`Brand "${row.brandName}" is not registered in the system.`);
        }
      } else if (matchedBrand) {
        correctedBrandName = matchedBrand.name;
      }

      // Generate unique product code
      let generatedCode = "";
      if (correctedBrandName && row.productDetails) {
        const bPrefix = correctedBrandName.substring(0, 3).toUpperCase().replace(/\s+/g, '');
        const pPrefix = row.productDetails.substring(0, 4).toUpperCase().replace(/\s+/g, '');
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        generatedCode = `${bPrefix}-${pPrefix}-${randomPart}`;

        // Check if duplicated in this spreadsheet
        if (generatedCodesSet.has(generatedCode)) {
          // Regenerate suffix
          const backupRandom = Math.floor(1000 + Math.random() * 9000);
          generatedCode = `${bPrefix}-${pPrefix}-${backupRandom}`;
        }
        generatedCodesSet.add(generatedCode);
      }

      // Validate URL
      if (row.productLink && !row.productLink.startsWith("http://") && !row.productLink.startsWith("https://")) {
        errors.push("Product Link must be a valid HTTP/HTTPS URL.");
      }

      // Valid review types check
      const validTypes = ["REVIEW", "RATING", "ONLY_ORDER", "SUBMITTED"];
      const providedTypes = row.reviewType.split(",").map(s => s.trim().toUpperCase());
      const allValid = providedTypes.every(t => validTypes.includes(t));
      if (!allValid) {
        errors.push("Review type contains invalid strategy. Must be combination of: REVIEW, RATING, ONLY_ORDER, SUBMITTED");
      }

      // Slots validation
      const totalSlots = row.reviewSlots + row.ratingSlots + row.onlyOrderSlots + row.submittedSlots;
      if (totalSlots <= 0) {
        errors.push("At least one slot type must have stock greater than 0.");
      }

      // Parsed & Fuzzy Matched Mediator Assignments
      let resolvedMediators: { mediatorId: string; commission: number; name: string }[] = [];
      const mStr = row.mediatorsStr.trim();
      
      if (!mStr || mStr.toUpperCase() === "ALL") {
        // Defaults to assigning to ALL mediators
        resolvedMediators = mediators.map(m => ({
          mediatorId: m._id,
          commission: row.commission,
          name: m.name
        }));
      } else {
        const names = mStr.split(",").map(n => n.trim()).filter(Boolean);
        for (const name of names) {
          // 1. Exact case-insensitive match (name or email)
          let match = mediators.find(m => m.name.toLowerCase() === name.toLowerCase() || m.email.toLowerCase() === name.toLowerCase());
          
          // 2. Fuzzy case-insensitive substring match
          if (!match) {
            match = mediators.find(m => m.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(m.name.toLowerCase()));
          }

          if (match) {
            resolvedMediators.push({
              mediatorId: match._id,
              commission: row.commission,
              name: match.name
            });
          } else {
            errors.push(`Mediator "${name}" is not registered in the system (no match found).`);
          }
        }
      }

      results.push({
        index: idx + 1,
        data: {
          ...row,
          brandName: correctedBrandName,
          productImage: row.productImage || ""
        },
        generatedCode,
        isValid: errors.length === 0,
        errors,
        resolvedMediators
      });
    }

    setValidatedRows(results);
    toast.success(`Successfully parsed ${parsed.length} rows from CSV`);
  };

  const triggerDownloadTemplate = () => {
    const csvContent = "brandName,productDetails,productLink,marketplace,dealType,reviewType,reviewSlots,ratingSlots,onlyOrderSlots,submittedSlots,commission,juhiCommission,originalCommission,productImage,userRemarks,mediatorRemarks,remarks,mediators\n" +
      "SAMSUNG,S24 Ultra Back Armor Case,https://amazon.in/s24-case,Amazon,Original,REVIEW,10,0,0,0,150,180,200,,Must ship next day,Internal dispatch standard,Premium sample,ALL\n" +
      "APPLE,iPhone 15 Matte Screen Shield,https://flipkart.com/iph15,Flipkart,Original,REVIEW,RATING,5,5,0,0,100,120,150,,Placeholder image will apply automatically,,,Rohan Sharma, Anita Verma";
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "aspiremint_bulk_deals_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleImportDeals = async () => {
    const validItems = validatedRows.filter(r => r.isValid);
    if (validItems.length === 0) {
      toast.error("No valid deals found to import");
      return;
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: validItems.length });

    let successCount = 0;
    let failedCount = 0;

    for (let idx = 0; idx < validItems.length; idx++) {
      const item = validItems[idx];
      setImportProgress(prev => ({ ...prev, current: idx + 1 }));

      const payload = {
        brandName: item.data.brandName,
        productDetails: item.data.productDetails,
        productLink: item.data.productLink,
        marketplace: item.data.marketplace,
        reviewSlots: item.data.reviewSlots,
        ratingSlots: item.data.ratingSlots,
        onlyOrderSlots: item.data.onlyOrderSlots,
        submittedSlots: item.data.submittedSlots,
        dealType: item.data.dealType,
        reviewType: item.data.reviewType,
        commission: item.data.commission,
        juhiCommission: item.data.juhiCommission,
        productImage: item.data.productImage,
        userRemarks: item.data.userRemarks,
        mediatorRemarks: item.data.mediatorRemarks,
        remarks: item.data.remarks,
        originalCommission: item.data.originalCommission,
        assignedMediators: item.resolvedMediators.map(m => ({ mediatorId: m.mediatorId, commission: m.commission })),
      };

      try {
        const res = await fetch("/api/deals/active", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (json.success) {
          successCount++;
        } else {
          failedCount++;
          console.error(`Import failed for row ${item.index}:`, json.message);
        }
      } catch (err) {
        failedCount++;
        console.error(`Import failed for row ${item.index} due to network error`);
      }
    }

    setIsImporting(false);
    if (successCount > 0) {
      toast.success(`Import Manifest Complete! ${successCount} deals deployed successfully.`);
      if (failedCount > 0) {
        toast.error(`${failedCount} deals failed standard validations.`);
      }
      setValidatedRows([]);
      onSuccess();
    } else {
      toast.error("Import failed entirely due to backend validation conflicts.");
    }
  };

  const allValid = validatedRows.length > 0 && validatedRows.every(r => r.isValid);
  const someValid = validatedRows.length > 0 && validatedRows.some(r => r.isValid);

  const getMediatorsDisplay = (row: ValidatedRow) => {
    if (!row.data.mediatorsStr || row.data.mediatorsStr.toUpperCase() === "ALL") {
      return "ALL SPECIALISTS";
    }
    return row.resolvedMediators.map(m => m.name).join(", ");
  };

  if (loadingData) {
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compiling active system registry...</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-[40px] border border-slate-100 shadow-sm p-8 md:p-12 w-full relative z-10 space-y-8">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-50 pb-8">
        <div>
          <div className="flex items-center gap-3">
             <span className="h-2.5 w-2.5 bg-indigo-500 rounded-full animate-pulse" />
             <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Bulk Upload Active Deals</h2>
          </div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Deploy multiple active deals directly to live specialists</p>
        </div>

        <button 
          onClick={triggerDownloadTemplate}
          className="h-12 px-6 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 font-black text-[9px] uppercase tracking-widest transition-all self-start flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Download standard csv Template
        </button>
      </div>

      {/* UPLOAD ZONE */}
      <AnimatePresence mode="wait">
        {validatedRows.length === 0 ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center h-72 rounded-[36px] border-4 border-dashed transition-all cursor-pointer overflow-hidden ${
              dragActive ? "bg-indigo-50 border-indigo-500" : "bg-slate-50 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20"
            }`}
          >
            <input 
              type="file" 
              accept=".csv"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            
            <div className="text-center p-8 space-y-4">
              <div className="h-16 w-16 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-center mx-auto text-slate-400">
                <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase">Drag & Drop Excel/CSV File here</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Automatic dynamic product code matching & placeholders allocation</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            {/* STATS STRIP */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase">Parsed Manifest</p>
                  <p className="text-base font-black text-slate-900">{validatedRows.length} Rows</p>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <p className="text-[8px] font-black text-emerald-500 uppercase">Verified Valid</p>
                  <p className="text-base font-black text-emerald-600">{validatedRows.filter(r => r.isValid).length} Rows</p>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <p className="text-[8px] font-black text-rose-500 uppercase">Failing Errors</p>
                  <p className="text-base font-black text-rose-600">{validatedRows.filter(r => !r.isValid).length} Rows</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setValidatedRows([])}
                  className="h-10 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  Clear List
                </button>
                
                <button 
                  onClick={handleImportDeals}
                  disabled={!someValid || isImporting}
                  className="h-10 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] uppercase tracking-widest transition-all shadow-md shadow-indigo-600/10 disabled:opacity-40"
                >
                  {isImporting ? `Deploying (${importProgress.current}/${importProgress.total})...` : `Deploy ${validatedRows.filter(r => r.isValid).length} Valid Deals`}
                </button>
              </div>
            </div>

            {/* PREVIEW GRID TABLE */}
            <div className="overflow-x-auto bg-white rounded-3xl border border-slate-100 shadow-inner">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Row / Status</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Generated Code</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Brand / Details</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Marketplace</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Stocks (R/RT/O/S)</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Payout</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Assigned Specialists</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Preview Photo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {validatedRows.map((row) => (
                    <tr key={row.index} className={`hover:bg-slate-50/50 transition-colors ${!row.isValid ? "bg-rose-50/30" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-slate-500">#{row.index}</span>
                          <span className={`inline-block h-2 w-2 rounded-full ${row.isValid ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                        </div>
                        {!row.isValid && (
                          <div className="mt-1.5 space-y-1 max-w-xs">
                            {row.errors.map((err, i) => (
                              <p key={i} className="text-[10px] font-black text-rose-500 uppercase tracking-wide leading-normal">{err}</p>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-black text-slate-800">{row.generatedCode || "N/A"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{row.data.brandName}</span>
                          <span className="text-[9px] font-bold text-slate-400 truncate max-w-[150px]">{row.data.productDetails}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{row.data.marketplace}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-black text-slate-800">
                          {row.data.reviewSlots}/{row.data.ratingSlots}/{row.data.onlyOrderSlots}/{row.data.submittedSlots}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-black text-emerald-600">₹{row.data.originalCommission}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase tracking-tight ${row.data.mediatorsStr.trim().toUpperCase() === "ALL" || !row.data.mediatorsStr.trim() ? "text-indigo-600 bg-indigo-50 border border-indigo-100" : "text-amber-600 bg-amber-50 border border-amber-100"} px-2.5 py-0.5 rounded`}>
                          {getMediatorsDisplay(row)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          {row.data.productImage ? (
                            <button 
                              onClick={() => setActivePhotoUrl(row.data.productImage)}
                              className="relative group focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
                              type="button"
                            >
                              <img 
                                src={row.data.productImage} 
                                alt="Preview" 
                                className="h-10 w-10 object-cover rounded-xl border border-slate-100 shadow-sm transition-all duration-300 group-hover:scale-110 cursor-zoom-in"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = DEFAULT_IMAGE_PLACEHOLDER;
                                }}
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center pointer-events-none">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              </div>
                            </button>
                          ) : (
                            <div className="h-10 w-10 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 group hover:border-slate-300 transition-colors" title="No Image - Will display marketplace icon">
                              <span className="text-[8px] font-black leading-none uppercase tracking-tighter opacity-60">
                                {row.data.marketplace === "Amazon" ? "AMZN" : row.data.marketplace === "Flipkart" ? "FLIP" : "DEAL"}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox / Full-size photo viewer modal */}
      <AnimatePresence>
        {activePhotoUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActivePhotoUrl(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl max-h-[85vh] bg-white/10 p-2 rounded-[32px] border border-white/20 shadow-2xl overflow-hidden cursor-default"
            >
              <img 
                src={activePhotoUrl} 
                alt="Full size view" 
                className="max-w-full max-h-[80vh] object-contain rounded-3xl"
              />
              <button 
                onClick={() => setActivePhotoUrl(null)}
                className="absolute top-4 right-4 h-10 w-10 bg-white/80 hover:bg-white text-slate-800 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                type="button"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
