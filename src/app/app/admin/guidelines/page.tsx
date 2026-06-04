"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, FileText, CheckCircle2, AlertTriangle, Search, 
  HelpCircle, Eye, Sliders, Info, ArrowRight, Zap, Target, BookOpen, Layers, CheckSquare, Sparkles
} from "lucide-react";
import toast from "react-hot-toast";

type GuidelineTab = "SCREENSHOTS" | "DISPUTES" | "BUYERS" | "POLICIES";

export default function SOPGuidelinesPage() {
  const [activeTab, setActiveTab] = useState<GuidelineTab>("SCREENSHOTS");
  const [progress, setProgress] = useState<Record<string, boolean>>({
    step1: false,
    step2: false,
    step3: false,
    step4: false,
    step5: false,
  });

  // Simulator state
  const [analysisMode, setAnalysisMode] = useState<"ORIGINAL" | "ELA" | "METADATA">("ORIGINAL");
  const [highlightSuspect, setHighlightSuspect] = useState(false);

  const toggleStep = (step: string) => {
    setProgress(prev => {
      const next = { ...prev, [step]: !prev[step] };
      const checkedCount = Object.values(next).filter(Boolean).length;
      if (checkedCount === 5) {
        toast.success("🎯 SOP Checklist Mastered! You're ready to audit.");
      }
      return next;
    });
  };

  const checklistProgress = (Object.values(progress).filter(Boolean).length / 5) * 100;

  return (
    <div className="p-4 lg:p-8 bg-slate-50 min-h-screen pb-20">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Operational Center Desk</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight italic flex items-center gap-3">
              <FileText className="w-8 h-8 text-indigo-600" /> SOP Verification & Auditing Guidelines
            </h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
              Standard operating directives and visual evidence analysis console for platform moderators.
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Clearance Level: SUBADMIN</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex bg-white p-1.5 rounded-[22px] shadow-xl shadow-slate-200/50 border border-slate-100 flex-wrap gap-1">
            {[
              { id: "SCREENSHOTS", label: "Screenshot Audits", icon: <Layers className="w-4 h-4" /> },
              { id: "DISPUTES", label: "Dispute Resolutions", icon: <Target className="w-4 h-4" /> },
              { id: "BUYERS", label: "Buyer Authenticity", icon: <Sparkles className="w-4 h-4" /> },
              { id: "POLICIES", label: "Platform Policies", icon: <BookOpen className="w-4 h-4" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as GuidelineTab)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-500 ${
                  activeTab === tab.id 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tab.icon}
                <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Auditing Manual v2.4</span>
          </div>
        </div>

        {/* SOP Content Layout */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            
            {/* Left Column: Guidelines / Cheat Sheets */}
            <div className="lg:col-span-7 space-y-8">
              
              {activeTab === "SCREENSHOTS" && (
                <div className="bg-white rounded-[44px] p-8 lg:p-10 shadow-xl border border-slate-100 space-y-8">
                  <div>
                     <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic mb-2">Screenshot Integrity Checklist</h3>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">How to distinguish legitimate reviews from fake generated proofs</p>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100 space-y-4">
                      <div className="flex items-center gap-2.5 text-rose-700">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <h4 className="text-xs font-black uppercase tracking-wider">Red Flags for Manipulation</h4>
                      </div>
                      <ul className="space-y-2 text-[11px] font-bold text-rose-900/80 list-disc list-inside">
                        <li>Font discrepancy in the order values or product identifiers</li>
                        <li>Over-compression or blurred pixel artifacts around text blocks</li>
                        <li>Mismatched delivery status relative to time signatures</li>
                        <li>Absent or double-shadow overlays in system elements</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest pl-1">Standard Operational Protocol</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {[
                          { title: "Invoice Matching", desc: "Compare the billing items directly with system order ledger data." },
                          { title: "Browser Context Check", desc: "Verify full mobile status indicators or browser bar details are consistent." },
                          { title: "Exif Consistency", desc: "Confirm the photo contains expected metadata parameters for standard devices." }
                        ].map((item, i) => (
                          <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4">
                            <div className="h-8 w-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center font-black text-xs text-indigo-600 shadow-sm shrink-0">
                              0{i + 1}
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-900 uppercase tracking-wide">{item.title}</p>
                              <p className="text-[10px] font-bold text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "DISPUTES" && (
                <div className="bg-white rounded-[44px] p-8 lg:p-10 shadow-xl border border-slate-100 space-y-8">
                  <div>
                     <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic mb-2">Dispute Resolution SOP</h3>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Directives for resolving escalations between Buyers and Mediators</p>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">Step A</span>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide mt-3 mb-2">Initiate Review</h4>
                        <p className="text-[10px] font-bold text-slate-500 leading-relaxed">Lock the transaction status and audit the mediator’s assigned logs.</p>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Step B</span>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide mt-3 mb-2">Cross-Examination</h4>
                        <p className="text-[10px] font-bold text-slate-500 leading-relaxed">Check standard screenshots against active escrow liabilities.</p>
                      </div>
                    </div>

                    <div className="p-6 bg-indigo-950 text-white rounded-[32px] relative overflow-hidden">
                      <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-600/20 blur-xl rounded-full" />
                      <h4 className="text-xs font-black uppercase tracking-wider mb-2 text-indigo-300">Operational Resolution Guide</h4>
                      <p className="text-[10px] font-bold text-slate-300 leading-relaxed pl-1">
                        SubAdmins assist Mediators by preparing dispute dossiers. When evidence remains inconclusive, escalate immediately to a full Admin for terminal Escrow release. Do not attempt manually adjusted payout dispatches.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "BUYERS" && (
                <div className="bg-white rounded-[44px] p-8 lg:p-10 shadow-xl border border-slate-100 space-y-8">
                  <div>
                     <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic mb-2">Buyer Account Authenticity</h3>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identifying automated bot accounts and review farms</p>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                      {[
                        { title: "Velocity Control Check", val: "Audit user order density. Fresh profiles checking out > 5 orders within 24 hours must be temporarily suspended for inspection.", color: "text-amber-600", bg: "bg-amber-50/50" },
                        { title: "Return Window Violations", val: "Check return period screenshot tags to ensure no double-returns are processed under independent accounts.", color: "text-rose-600", bg: "bg-rose-50/50" }
                      ].map((item, idx) => (
                        <div key={idx} className={`p-6 ${item.bg} rounded-[28px] border border-slate-100`}>
                          <h4 className={`text-xs font-black uppercase tracking-wider ${item.color} mb-2`}>{item.title}</h4>
                          <p className="text-[10px] font-bold text-slate-600 leading-relaxed">{item.val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "POLICIES" && (
                <div className="bg-white rounded-[44px] p-8 lg:p-10 shadow-xl border border-slate-100 space-y-8">
                  <div>
                     <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic mb-2">Platform Policies & Escalations</h3>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Standard guidelines for operating within restricted permissions</p>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-400" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Moderator Boundaries</h4>
                      </div>
                      <p className="text-[11px] font-bold text-slate-300 leading-relaxed">
                        SubAdmins are platform curators. You are granted operational permission to verify evidence, reject invalid review entries, and flag suspicious accounts. You do not hold clearance authority to alter core database structures, payout channels, or access levels.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Interactive Training Console */}
              <div className="bg-slate-900 text-white rounded-[44px] p-8 lg:p-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-600/20 blur-[50px] rounded-full" />
                
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between">
                     <div>
                        <h3 className="text-lg font-black uppercase tracking-tight italic flex items-center gap-3 text-white">
                           <Sliders className="w-5 h-5 text-indigo-400" /> Visual Verification Simulator
                        </h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Interactive training console for detecting fake review proofs</p>
                     </div>
                  </div>

                  {/* Simulator Screen */}
                  <div className="bg-slate-950 rounded-3xl p-6 border border-white/5 relative overflow-hidden flex flex-col items-center">
                    
                    {/* Simulator Image Display */}
                    <div className="w-full max-w-[280px] aspect-[4/3] bg-slate-900 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center p-4 border border-white/10 shadow-inner">
                      
                      {analysisMode === "ORIGINAL" && (
                        <div className="flex flex-col items-center text-center space-y-3">
                          <div className="w-48 bg-slate-800 h-28 rounded-lg p-2 border border-slate-700 flex flex-col justify-between">
                            <div className="flex justify-between items-center text-[7px] text-slate-400 uppercase">
                              <span>Amazon Pay Receipt</span>
                              <span className="text-emerald-500">Delivered</span>
                            </div>
                            <div className="my-2 text-center">
                              <p className="text-[6px] text-slate-500 uppercase font-black">Expected Refund</p>
                              <p className="text-sm font-black text-white leading-none mt-1">₹4,999.00</p>
                            </div>
                            <div className="text-[6px] text-slate-500 text-left font-mono">
                              UTR: 2309-8837-9928-11A
                            </div>
                          </div>
                          <span className="text-[7px] font-black uppercase tracking-widest text-slate-500">LEGITIMATE ORDER PROOF</span>
                        </div>
                      )}

                      {analysisMode === "ELA" && (
                        <div className="flex flex-col items-center text-center space-y-3 w-full h-full justify-center">
                          <div className={`w-48 bg-slate-950 h-28 rounded-lg p-2 border border-slate-800 flex flex-col justify-between relative ${highlightSuspect ? 'ring-2 ring-rose-500 animate-pulse' : ''}`}>
                            <div className="flex justify-between items-center text-[7px] text-slate-600 uppercase">
                              <span>Amazon Pay Receipt</span>
                              <span className="text-slate-600">Delivered</span>
                            </div>
                            <div className="my-2 text-center relative">
                              <p className="text-[6px] text-slate-700 uppercase font-black">Expected Refund</p>
                              <p className="text-sm font-black text-slate-800 leading-none mt-1">₹4,999.00</p>
                              {/* Suspect pixel overlay highlight */}
                              {highlightSuspect && (
                                <div className="absolute inset-0 bg-rose-500/20 border-2 border-rose-500 rounded flex items-center justify-center">
                                  <span className="text-[5px] font-black text-rose-500 bg-rose-950 px-1 py-0.5 rounded uppercase">Mismatched Compression</span>
                                </div>
                              )}
                            </div>
                            <div className="text-[6px] text-slate-700 text-left font-mono">
                              UTR: 2309-8837-9928-11A
                            </div>
                          </div>
                          <span className="text-[7px] font-black uppercase tracking-widest text-rose-500">ELA ERROR LEVEL ANALYSIS MAP</span>
                        </div>
                      )}

                      {analysisMode === "METADATA" && (
                        <div className="text-left w-full space-y-2 p-3 font-mono text-[7px] text-slate-400">
                          <p className="text-indigo-400 font-bold uppercase tracking-widest mb-1 text-[8px]">EXIF METADATA DOSSIER</p>
                          <p>• Device: Apple iPhone 14 Pro Max</p>
                          <p>• Software: Photoshop Express CC (Windows)</p>
                          <p className="text-rose-400">• Alert: Last modification parameters suggest pixel injection.</p>
                          <p>• Creation Date: 2026-05-23T11:42:15Z</p>
                        </div>
                      )}

                    </div>

                    {/* Mode Selectors */}
                    <div className="grid grid-cols-3 gap-2 w-full mt-6">
                      {[
                        { id: "ORIGINAL", label: "Original View" },
                        { id: "ELA", label: "ELA Grid Map" },
                        { id: "METADATA", label: "Metadata Dossier" }
                      ].map(mode => (
                        <button
                          key={mode.id}
                          onClick={() => {
                            setAnalysisMode(mode.id as any);
                            if (mode.id !== "ELA") setHighlightSuspect(false);
                          }}
                          className={`py-2 text-[8px] font-black uppercase tracking-wider rounded-xl transition-colors border ${
                            analysisMode === mode.id 
                              ? "bg-indigo-600 text-white border-indigo-500" 
                              : "bg-slate-900 hover:bg-slate-800 text-slate-400 border-white/5"
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>

                    {analysisMode === "ELA" && (
                      <button
                        onClick={() => setHighlightSuspect(!highlightSuspect)}
                        className="mt-4 px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[8px] font-black uppercase tracking-widest rounded-xl transition-all"
                      >
                        {highlightSuspect ? "Hide Suspect Areas" : "Highlight Pixel Incongruity"}
                      </button>
                    )}

                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Progressive SOP Verification Checklist */}
            <div className="lg:col-span-5 space-y-8">
              
              <div className="bg-white rounded-[44px] p-8 lg:p-10 shadow-xl border border-slate-100 flex flex-col h-full justify-between">
                <div className="space-y-6">
                  
                  {/* Header */}
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight italic flex items-center gap-3">
                       <CheckSquare className="w-5 h-5 text-indigo-600 animate-pulse" /> Active SOP Trainer
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Audit verification progressive checkpoint</p>
                  </div>

                  {/* Progressive Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center pl-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">TRAINING MILESTONE</span>
                      <span className="text-xs font-black text-slate-800">{checklistProgress}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${checklistProgress}%` }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600"
                      />
                    </div>
                  </div>

                  {/* Checklist Items */}
                  <div className="space-y-3 pt-4">
                    {[
                      { key: "step1", label: "Check Billing Items Against Deal ledger parameters", level: "SOP-1" },
                      { key: "step2", label: "Analyze Screenshot compression patterns for copy-paste tags", level: "SOP-2" },
                      { key: "step3", label: "Examine status codes and device network operators matches", level: "SOP-3" },
                      { key: "step4", label: "Prepare Mediator dispute dossiers without disbursing manual escrow", level: "SOP-4" },
                      { key: "step5", label: "Check Exif software signatures for design tool modification traces", level: "SOP-5" }
                    ].map(item => (
                      <div 
                        key={item.key}
                        onClick={() => toggleStep(item.key)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                          progress[item.key] 
                            ? "bg-emerald-50 border-emerald-100 text-emerald-800 shadow-sm" 
                            : "bg-slate-50 border-slate-100 hover:bg-white hover:border-slate-200 text-slate-600"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-5 w-5 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                            progress[item.key] 
                              ? "bg-emerald-500 border-emerald-500 text-white" 
                              : "bg-white border-slate-300 group-hover:border-slate-400"
                          }`}>
                            {progress[item.key] && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                          <span className="text-[11px] font-bold uppercase leading-tight tracking-wide">{item.label}</span>
                        </div>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-md ${
                          progress[item.key] 
                            ? "bg-emerald-100 text-emerald-700" 
                            : "bg-slate-200/60 text-slate-400 group-hover:bg-slate-300/40"
                        }`}>{item.level}</span>
                      </div>
                    ))}
                  </div>

                </div>

                {/* Progress Complete Celebration Box */}
                {checklistProgress === 100 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-8 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-3xl text-center space-y-3"
                  >
                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.25em] pl-1">⚡ CERTIFICATE ACQUIRED</p>
                    <h4 className="text-sm font-black text-slate-900 uppercase">Verification Specialist Clearance</h4>
                    <p className="text-[9px] font-bold text-slate-500 leading-relaxed uppercase tracking-wider">
                      You have fully completed the SOP Verification & Auditing simulation course!
                    </p>
                  </motion.div>
                )}

              </div>

            </div>

          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}
