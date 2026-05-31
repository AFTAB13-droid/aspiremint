"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { Select } from "@/components/ui/Select";

interface FieldConfig {
  enabled: boolean;
  required: boolean;
  label: string;
  type: string;
  placeholder: string;
}

interface Config {
  [key: string]: FieldConfig;
}

const SYSTEM_KEYS: { [key: string]: string } = {
  brandName: "Brand Master",
  productCode: "Product Master",
  userOrderId: "Order Reference",
  reviewName: "Identity Check",
  amount: "Financial Value",
  dealType: "Deal Logic",
  lessAmount: "Adjustments",
  mediator: "Mediation Node",
  screenshot: "Artifact Capture",
  aspireMintId: "System Identity",
  buyerEmail: "Ghost Alias",
};

export const FormEngine: React.FC = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/config");
      const json = await res.json();
      if (json.success) setConfig(json.data);
    } catch (err) {
      toast.error("Failed to load config");
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (newConfig: Config) => {
     setConfig(newConfig);
     try {
       const res = await fetch("/api/admin/config", {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(newConfig),
       });
       if (res.ok) toast.success("Configuration Synced");
     } catch (err) {
       toast.error("Cloud Sync Failed");
     }
  };

  const handleToggle = (field: string, key: "enabled" | "required") => {
    if (!config) return;
    const newConfig = {
      ...config,
      [field]: { ...config[field], [key]: !config[field][key] }
    };
    
    if (key === "enabled" && !newConfig[field].enabled) {
      newConfig[field].required = false;
    }
    updateConfig(newConfig);
  };

  const handleMetadataChange = (field: string, key: string, value: string) => {
    if (!config) return;
    const newConfig = {
      ...config,
      [field]: { ...config[field], [key]: value }
    };
    setConfig(newConfig);
  };

  if (loading || !config) {
    return (
      <div className="flex flex-col gap-10 animate-in fade-in duration-500">
        <div className="space-y-2">
           <Skeleton className="h-8 w-48" />
           <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
           {[1,2,3,4,5,6].map(i => (
             <Skeleton key={i} className="h-40 w-full rounded-[32px]" />
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Form Engine</h2>
           <p className="mt-1 text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed max-w-lg">Advanced Form Schema Orchestration. Customize how buyers interact with every transaction field.</p>
        </div>
        <div className="px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100 flex items-center gap-2">
           <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Real-time Deployment Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {Object.keys(SYSTEM_KEYS).map((field) => (
            <motion.div 
               layout
               key={field}
               className={`p-1 rounded-[40px] border transition-all duration-500 ${config[field].enabled ? "bg-white border-slate-100 shadow-xl shadow-slate-200/40" : "bg-slate-50/50 border-transparent opacity-80"}`}
            >
               <div className="p-7">
                  <div className="flex items-start justify-between mb-8">
                     <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{SYSTEM_KEYS[field]}</span>
                        <h3 className="text-base font-black text-slate-900 uppercase tracking-tighter truncate max-w-[150px]">{config[field].label}</h3>
                     </div>
                     <div 
                        onClick={() => handleToggle(field, "enabled")}
                        className={`h-6 w-12 rounded-full p-1 cursor-pointer transition-all duration-300 ${config[field].enabled ? "bg-blue-600 shadow-lg shadow-blue-600/20" : "bg-slate-200"}`}
                     >
                        <motion.div 
                           animate={{ x: config[field].enabled ? 24 : 0 }}
                           className="h-4 w-4 rounded-full bg-white shadow-sm" 
                        />
                     </div>
                  </div>

                  <div className="flex items-center gap-2 mb-6">
                     <button 
                        disabled={!config[field].enabled}
                        onClick={() => handleToggle(field, "required")}
                        className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${config[field].required ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"}`}
                     >
                        {config[field].required ? "Mandatory" : "Optional"}
                     </button>
                     <button 
                        onClick={() => setEditingField(editingField === field ? null : field)}
                        className={`p-2 rounded-xl border transition-all ${editingField === field ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-100 hover:bg-slate-50"}`}
                     >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                     </button>
                  </div>

                  <AnimatePresence>
                     {editingField === field && (
                        <motion.div 
                           initial={{ opacity: 0, height: 0 }}
                           animate={{ opacity: 1, height: "auto" }}
                           exit={{ opacity: 0, height: 0 }}
                           className="overflow-hidden space-y-5 pt-4 border-t border-slate-50"
                        >
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Display Label</label>
                              <input 
                                 type="text" value={config[field].label}
                                 onChange={(e) => handleMetadataChange(field, "label", e.target.value)}
                                 className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all"
                              />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Input Type (HTML)</label>
                              <Select 
                                 value={config[field].type}
                                 onChange={(val) => handleMetadataChange(field, "type", val)}
                                 options={[
                                    { label: "TEXT", value: "text" },
                                    { label: "NUMBER", value: "number" },
                                    { label: "EMAIL", value: "email" },
                                    { label: "PHONE", value: "tel" },
                                    { label: "DATE", value: "date" },
                                    { label: "URL", value: "url" },
                                    { label: "RADIO", value: "radio" },
                                    { label: "SELECT", value: "select" },
                                    { label: "FILE", value: "file" },
                                 ]}
                              />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ghost Placeholder</label>
                              <input 
                                 type="text" value={config[field].placeholder}
                                 onChange={(e) => handleMetadataChange(field, "placeholder", e.target.value)}
                                 className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all"
                                 placeholder="Enter placeholder text..."
                              />
                           </div>
                           <button 
                              onClick={() => { updateConfig(config); setEditingField(null); }}
                              className="w-full py-3 mt-4 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all"
                           >
                              Deploy Metadata
                           </button>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>
            </motion.div>
         ))}
      </div>

      {/* Safety Guard Card */}
      <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-2xl">
               <h4 className="text-2xl font-black uppercase tracking-tight mb-2">Global Schema Lock</h4>
               <p className="text-sm font-medium text-slate-400 leading-relaxed uppercase tracking-widest">The engine currently synchronizes across all distributed nodes in ~150ms. Use caution when modifying field types for active deals.</p>
            </div>
            <div className="flex-shrink-0 h-16 w-16 rounded-3xl border border-white/10 flex items-center justify-center bg-white/5">
                <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
         </div>
      </div>
    </div>
  );
};
