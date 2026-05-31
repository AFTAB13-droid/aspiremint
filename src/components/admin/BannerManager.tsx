"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Save, Megaphone, AlertCircle, Sparkles, User, RefreshCw, LayoutTemplate, ArrowUpRight } from "lucide-react";

export type BannerTemplateType = "DEFAULT" | "SALE" | "NOTICE" | "MILESTONE";
export type BannerTargetAudience = "ALL" | "BUYER" | "MEDIATOR";

export interface BannerConfig {
  isActive: boolean;
  template: BannerTemplateType;
  title: string;
  subtitle: string;
  icon: string;
  primaryColor: string;
  bgGradient: string;
  animationType: "NONE" | "PULSE" | "SHIMMER" | "SPARKLE";
  expiresAt?: string;
  targetAudience: BannerTargetAudience;
  actionLink?: string;
}

const TEMPLATES: Record<BannerTemplateType, BannerConfig> = {
  DEFAULT: {
    isActive: false,
    template: "DEFAULT",
    title: "",
    subtitle: "",
    icon: "user",
    primaryColor: "blue",
    bgGradient: "linear-gradient(135deg, #0f172a, #1e293b)",
    animationType: "NONE",
    targetAudience: "ALL"
  },
  SALE: {
    isActive: true,
    template: "SALE",
    title: "MEGA SALE ACTIVE",
    subtitle: "Flat 50% off on platform fees for the next 24 hours!",
    icon: "sparkles",
    primaryColor: "rose",
    bgGradient: "linear-gradient(135deg, #e11d48, #be123c, #9f1239)",
    animationType: "SHIMMER",
    targetAudience: "ALL",
    actionLink: "/deals"
  },
  NOTICE: {
    isActive: true,
    template: "NOTICE",
    title: "SYSTEM UPDATE",
    subtitle: "Scheduled maintenance at 02:00 AM UTC. Expect minor delays.",
    icon: "alert",
    primaryColor: "amber",
    bgGradient: "linear-gradient(135deg, #f59e0b, #d97706, #b45309)",
    animationType: "PULSE",
    targetAudience: "ALL"
  },
  MILESTONE: {
    isActive: true,
    template: "MILESTONE",
    title: "10K MILESTONE REACHED",
    subtitle: "Thank you for trusting AspireMint. 10,000+ secured deals globally!",
    icon: "megaphone",
    primaryColor: "indigo",
    bgGradient: "linear-gradient(135deg, #4f46e5, #4338ca, #3730a3)",
    animationType: "SPARKLE",
    targetAudience: "ALL"
  }
};

export const BannerManager = () => {
  const [config, setConfig] = useState<BannerConfig>(TEMPLATES.DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/config/banner");
      const json = await res.json();
      if (json.success && json.data) {
        setConfig(json.data);
      }
    } catch (error) {
      toast.error("Failed to load banner configuration");
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/config/banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banner: config })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Global Banner Updated!");
      } else {
        toast.error(json.message || "Failed to update");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = (type: BannerTemplateType) => {
    setConfig(TEMPLATES[type]);
  };

  const renderIcon = (iconName: string, className = "w-6 h-6") => {
    switch (iconName) {
      case "sparkles": return <Sparkles className={className} />;
      case "alert": return <AlertCircle className={className} />;
      case "megaphone": return <Megaphone className={className} />;
      default: return <User className={className} />;
    }
  };

  if (loading) {
    return <div className="p-10 flex justify-center"><RefreshCw className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      {/* Settings Panel */}
      <div className="bg-white/40 backdrop-blur-3xl rounded-[48px] p-10 border border-white/60 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
        
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Global Banner Config</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Control user dashboard headers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
          {/* Templates */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-4">
              <LayoutTemplate className="w-4 h-4 text-blue-600" /> Pre-designed Templates
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {(Object.keys(TEMPLATES) as BannerTemplateType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => applyTemplate(type)}
                  className={`p-4 rounded-2xl border text-left transition-all ${config.template === type ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-300 bg-white'}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-xl bg-${TEMPLATES[type].primaryColor}-100 text-${TEMPLATES[type].primaryColor}-600`}>
                      {renderIcon(TEMPLATES[type].icon, "w-4 h-4")}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{type}</span>
                  </div>
                  <p className="text-[9px] font-medium text-slate-500 leading-tight line-clamp-2">
                    {TEMPLATES[type].title || "Default Profile View"}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Configuration Editor */}
          <div className="space-y-6">
             <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50">
                <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Banner Status</span>
                <label className="relative inline-flex items-center cursor-pointer">
                   <input type="checkbox" className="sr-only peer" checked={config.isActive} onChange={(e) => setConfig({...config, isActive: e.target.checked})} />
                   <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
             </div>

             {config.template !== "DEFAULT" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Target Audience</label>
                    <select 
                      value={config.targetAudience}
                      onChange={(e) => setConfig({...config, targetAudience: e.target.value as BannerTargetAudience})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    >
                      <option value="ALL">ALL USERS</option>
                      <option value="BUYER">BUYERS ONLY</option>
                      <option value="MEDIATOR">MEDIATORS ONLY</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Headline</label>
                    <input 
                      type="text" 
                      value={config.title}
                      onChange={(e) => setConfig({...config, title: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Subtext</label>
                    <textarea 
                      value={config.subtitle}
                      onChange={(e) => setConfig({...config, subtitle: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none h-20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Expiry Date & Time</label>
                      <input 
                        type="datetime-local" 
                        value={config.expiresAt || ""}
                        onChange={(e) => setConfig({...config, expiresAt: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Button Link (URL)</label>
                      <input 
                        type="text" 
                        value={config.actionLink || ""}
                        onChange={(e) => setConfig({...config, actionLink: e.target.value})}
                        placeholder="/dashboard/deals"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
             )}
          </div>
        </div>

        {/* Deploy Button (Centered) */}
        <div className="pt-12 flex justify-center relative z-10">
           <button 
             onClick={saveConfig}
             disabled={saving}
             className="flex items-center gap-3 px-12 py-5 bg-slate-900 text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all disabled:opacity-50 active:scale-95"
           >
             {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
             Deploy Banner
           </button>
        </div>
      </div>

      {/* Live Preview */}
      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[48px] p-10 flex flex-col items-center">
         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 text-center">Live User Dashboard Preview</h3>
         
         <div className="w-full max-w-4xl mx-auto">
            <motion.div 
               className={`w-full px-8 py-6 rounded-[32px] flex items-center justify-between gap-6 shadow-xl relative overflow-hidden`}
               style={{
                  background: config.template !== "DEFAULT" && config.isActive
                     ? `linear-gradient(135deg, var(--tw-gradient-stops))`
                     : `rgba(255, 255, 255, 0.4)`
               }}
            >
               {config.template !== "DEFAULT" && config.isActive ? (
                  <>
                     <div className="absolute inset-0 z-0" style={{ background: config.bgGradient }} />
                     
                     {/* Animations */}
                     {config.animationType === "SHIMMER" && (
                        <motion.div 
                           animate={{ x: ["-100%", "200%"] }}
                           transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                           className="absolute top-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[30deg] z-0"
                        />
                     )}
                     {config.animationType === "PULSE" && (
                        <motion.div 
                           animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
                           transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                           className="absolute inset-0 bg-white/10 mix-blend-overlay z-0"
                        />
                     )}
                     
                     <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-32 -mt-32 z-0" />
                     <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/20 rounded-full blur-3xl -ml-24 -mb-24 z-0" />
                     
                     <div className="relative z-10 flex items-center gap-6">
                        <motion.div 
                           animate={config.animationType === "SPARKLE" ? { rotate: [0, 10, -10, 0] } : {}}
                           transition={{ repeat: Infinity, duration: 2 }}
                           className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner"
                        >
                           {renderIcon(config.icon, "w-8 h-8")}
                        </motion.div>
                        <div>
                           <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-white text-[9px] font-black uppercase tracking-widest mb-2 backdrop-blur-md border border-white/30 shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_white]" />
                              {config.template === "SALE" ? "EXCLUSIVE OFFER" : "SYSTEM NOTICE"}
                           </div>
                           <h1 className="text-3xl font-black text-white tracking-tight leading-tight drop-shadow-md">{config.title || "Banner Title"}</h1>
                           <p className="text-white/90 text-sm font-bold mt-1 drop-shadow-sm">{config.subtitle || "Banner description goes here."}</p>
                        </div>
                     </div>
                     <div className="relative z-10 hidden sm:block">
                        <motion.button 
                           whileHover={{ scale: 1.05 }}
                           whileTap={{ scale: 0.95 }}
                           className="px-8 py-4 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors shadow-2xl flex items-center gap-2"
                        >
                           {config.template === "SALE" ? "Claim Offer" : "View Details"}
                           <ArrowUpRight className="w-4 h-4" />
                        </motion.button>
                     </div>
                  </>
               ) : (
                  <div className="w-full flex items-center justify-between">
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center text-white text-2xl font-black shadow-2xl relative overflow-hidden">
                           U
                        </div>
                        <div>
                           <div className="flex items-center gap-3">
                              <h1 className="text-2xl font-black text-slate-900 tracking-tight">John Doe</h1>
                           </div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                              Authorized User Command
                           </p>
                        </div>
                     </div>
                  </div>
               )}
            </motion.div>
         </div>
      </div>
    </div>
  );
};
