"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { CustomDropdown } from "../ui/CustomDropdown";
import { IMarketplace } from "@/modules/brand/marketplace.model";

interface Mediator {
  _id: string;
  name: string;
  email: string;
  systemDisplayName?: string;
}

interface Brand {
  _id: string;
  name: string;
}

interface Props {
  onCreated: () => void;
}

export const DealCreationForm: React.FC<Props> = ({ onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<"idle" | "deploying" | "success">("idle");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [mediators, setMediators] = useState<Mediator[]>([]);
  const [marketplaces, setMarketplaces] = useState<IMarketplace[]>([]);
  const [juhiAmId, setJuhiAmId] = useState<string>("");
  const [isLoadingBrands, setIsLoadingBrands] = useState(true);

  // Form State
  const [formData, setFormData] = useState<{
    brandName: string;
    productDetails: string;
    productLink: string;
    marketplace: string;
    reviewSlots: number;
    ratingSlots: number;
    onlyOrderSlots: number;
    submittedSlots: number;
    dealType: string;
    reviewType: string;
    commission: number | string;
    juhiCommission: number | string;
    productImage: string;
    userRemarks: string;
    mediatorRemarks: string;
    remarks: string;
    originalCommission: number | string;
  }>({
    brandName: "",
    productDetails: "",
    productLink: "",
    marketplace: "Flipkart",
    reviewSlots: 0,
    ratingSlots: 0,
    onlyOrderSlots: 0,
    submittedSlots: 0,
    dealType: "Original",
    reviewType: "REVIEW",
    commission: "N/A",
    juhiCommission: "N/A",
    productImage: "",
    userRemarks: "",
    mediatorRemarks: "",
    remarks: "",
    originalCommission: "N/A",
  });

  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [previewCode, setPreviewCode] = useState("");
  const [randomSuffix, setRandomSuffix] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (!randomSuffix) {
      setRandomSuffix(Math.floor(1000 + Math.random() * 9000).toString());
    }
  }, []);

  useEffect(() => {
    if (formData.brandName && formData.productDetails) {
      const bPrefix = formData.brandName.substring(0, 3).toUpperCase().replace(/\s+/g, '');
      const pPrefix = formData.productDetails.substring(0, 4).toUpperCase().replace(/\s+/g, '');
      setPreviewCode(`${bPrefix}-${pPrefix}-${randomSuffix}`);
    } else {
      setPreviewCode("");
    }
  }, [formData.brandName, formData.productDetails, randomSuffix]);

  const fetchInitialData = async () => {
    try {
      setIsLoadingBrands(true);
      const [brandsRes, mediatorsRes, marketplacesRes] = await Promise.all([
        fetch("/api/brands"),
        fetch("/api/users?role=MEDIATOR&limit=100"),
        fetch("/api/marketplaces")
      ]);
      const brandsJson = await brandsRes.json();
      const mediatorsJson = await mediatorsRes.json();
      const marketplacesJson = await marketplacesRes.json();

      if (brandsJson.success) setBrands(brandsJson.data);
      if (marketplacesJson.success) setMarketplaces(marketplacesJson.data);
      if (mediatorsJson.success) {
        // Exclude mediators whose campaign is paused
        const activeMediators = mediatorsJson.data.filter((m: any) => !m.isCampaignPaused);
        const juhiUser = activeMediators.find((m: any) => m.name.toLowerCase().includes("juhi"));
        if (juhiUser) setJuhiAmId(juhiUser.aspireMintId || "");
        const sorted = activeMediators.sort((a: any, b: any) => {
          if (a.name.toLowerCase().includes("juhi")) return -1;
          if (b.name.toLowerCase().includes("juhi")) return 1;
          return 0;
        });
        setMediators(sorted);
      }
    } catch (err) {
      toast.error("Failed to load dependency data");
    } finally {
      setIsLoadingBrands(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || "Upload failed");
    return json.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brandName || !formData.productDetails) {
      return toast.error("Please fill required fields (Brand and Product Details)");
    }

    setLoading(true);
    setDeploymentStatus("deploying");

    try {
      let finalImageUrl = formData.productImage;
      
      // Handle File Upload if exists
      if (imageFile) {
        toast.loading("Uploading product media...");
        finalImageUrl = await handleFileUpload(imageFile);
        setFormData(prev => ({ ...prev, productImage: finalImageUrl }));
      }

      const payload = {
        brandName: formData.brandName,
        productDetails: formData.productDetails,
        productLink: formData.productLink,
        marketplace: formData.marketplace,
        reviewSlots: formData.reviewSlots,
        ratingSlots: formData.ratingSlots,
        onlyOrderSlots: formData.onlyOrderSlots,
        submittedSlots: formData.submittedSlots,
        dealType: formData.dealType,
        reviewType: formData.reviewType,
        commission: "N/A",
        juhiCommission: formData.juhiCommission,
        productImage: finalImageUrl,
        userRemarks: formData.userRemarks,
        mediatorRemarks: "",
        remarks: formData.remarks,
        originalCommission: formData.originalCommission,
        assignedMediators: mediators.map(m => ({ mediatorId: m._id, commission: "N/A" })),
      };

      const res = await fetch("/api/deals/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Deal Active!");
        setCreatedCode(json.data.productCode);
        setDeploymentStatus("success");
      } else {
        toast.error(json.message);
        setDeploymentStatus("idle");
      }
    } catch (err: any) {
      toast.error(err.message || "Network Error");
      setDeploymentStatus("idle");
    } finally {
      setLoading(false);
    }
  };

  // Auto-Redirect after 3 seconds of success
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (deploymentStatus === "success") {
      timeout = setTimeout(() => {
        setDeploymentStatus("idle");
        setCreatedCode(null);
        onCreated();
      }, 1500);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [deploymentStatus, onCreated]);

  return (
    <div className="relative">
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 -right-24 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="bg-white/80 backdrop-blur-xl rounded-[40px] border border-slate-100 shadow-sm p-8 md:p-14 max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16 pb-10 border-b border-slate-50">
           <div>
              <div className="flex items-center gap-3 mb-2">
                 <span className="h-2 w-2 bg-blue-600 rounded-full animate-pulse" />
                 <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Post New Deal</h2>
              </div>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
             <div className="lg:col-span-12 space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-indigo-950 pl-1">Target Brand</label>
                <CustomDropdown
                  options={brands.map(b => b.name)}
                  value={formData.brandName}
                  onChange={(val) => setFormData({...formData, brandName: val})}
                  className="h-[60px] border-slate-200 bg-white focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-50"
                  placeholder="Select Brand..."
                  isLoading={isLoadingBrands}
                  searchable={true}
                />
             </div>
             
              <div className="lg:col-span-12 space-y-2">
                 <div className="flex items-center justify-between pl-1">
                  <label className="text-[11px] font-black uppercase tracking-widest text-indigo-950">Product Details</label>
                  {previewCode && (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black text-indigo-400 uppercase">Live:</span>
                      <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">{previewCode}</span>
                    </motion.div>
                  )}
                 </div>
                 <input 
                   type="text"
                   placeholder="e.g. Facewash, Mobile Case..."
                   value={formData.productDetails}
                   onChange={(e) => setFormData({...formData, productDetails: e.target.value})}
                   className="w-full h-[60px] px-6 rounded-xl bg-white border border-slate-200 font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                 />
              </div>

              {/* Strategy Multi-Selection */}
              <div className="lg:col-span-12 space-y-4">
                 <label className="text-[11px] font-black uppercase tracking-widest text-indigo-950 pl-1">Review Strategy Selection (Multi-Select)</label>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { id: 'REVIEW', label: 'Review' },
                      { id: 'RATING', label: 'Rating' },
                      { id: 'ONLY_ORDER', label: 'Only Order' },
                      { id: 'SUBMITTED', label: 'Review Submitted' }
                    ].map((strat) => {
                      const isSelected = formData.reviewType?.split(',').includes(strat.id);
                      return (
                        <button
                          key={strat.id}
                          type="button"
                          onClick={() => {
                            const current = formData.reviewType || '';
                            const parts = current ? current.split(',').filter(Boolean) : [];
                            let next: string;
                            if (isSelected) {
                              next = parts.filter(p => p !== strat.id).join(',');
                              // Reset stock when unselected
                              if (strat.id === 'REVIEW') setFormData(prev => ({ ...prev, reviewSlots: 0, reviewType: next }));
                              else if (strat.id === 'RATING') setFormData(prev => ({ ...prev, ratingSlots: 0, reviewType: next }));
                              else if (strat.id === 'ONLY_ORDER') setFormData(prev => ({ ...prev, onlyOrderSlots: 0, reviewType: next }));
                              else if (strat.id === 'SUBMITTED') setFormData(prev => ({ ...prev, submittedSlots: 0, reviewType: next }));
                            } else {
                              next = [...parts, strat.id].join(',');
                              setFormData(prev => ({ ...prev, reviewType: next }));
                            }
                          }}
                          className={`h-16 rounded-2xl border-2 transition-all flex items-center justify-between px-6 group ${
                            isSelected
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20 scale-[1.02]" 
                              : "bg-white border-slate-100 text-slate-500 hover:border-indigo-200"
                          }`}
                        >
                          <span className="text-[10px] font-black uppercase tracking-widest">{strat.label}</span>
                          <div className={`h-6 w-6 rounded-lg flex items-center justify-center transition-all ${isSelected ? "bg-white/20" : "bg-slate-50"}`}>
                             {isSelected ? (
                               <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                             ) : (
                               <div className="h-2 w-2 rounded-full bg-slate-200 group-hover:bg-indigo-400 transition-colors" />
                             )}
                          </div>
                        </button>
                      );
                    })}
                 </div>
              </div>

              {/* Conditional Granular Stock Entry */}
              <AnimatePresence>
                 {formData.reviewType && formData.reviewType.length > 0 && (
                   <motion.div 
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: 'auto' }}
                     exit={{ opacity: 0, height: 0 }}
                     className="lg:col-span-12 overflow-hidden"
                   >
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                         {formData.reviewType.includes('REVIEW') && (
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 pl-1">Review Stock</label>
                              <input 
                                type="number"
                                placeholder="0"
                                value={formData.reviewSlots || ""}
                                onChange={(e) => setFormData({...formData, reviewSlots: e.target.value === "" ? 0 : parseInt(e.target.value) || 0})}
                                className="w-full h-[54px] px-5 rounded-xl bg-white border border-slate-200 font-bold text-sm outline-none focus:border-indigo-500 transition-all"
                              />
                           </div>
                         )}
                         {formData.reviewType.includes('RATING') && (
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 pl-1">Rating Stock</label>
                              <input 
                                type="number"
                                placeholder="0"
                                value={formData.ratingSlots || ""}
                                onChange={(e) => setFormData({...formData, ratingSlots: e.target.value === "" ? 0 : parseInt(e.target.value) || 0})}
                                className="w-full h-[54px] px-5 rounded-xl bg-white border border-slate-200 font-bold text-sm outline-none focus:border-indigo-500 transition-all"
                              />
                           </div>
                         )}
                         {formData.reviewType.includes('ONLY_ORDER') && (
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 pl-1">Only Order</label>
                              <input 
                                type="number"
                                placeholder="0"
                                value={formData.onlyOrderSlots || ""}
                                onChange={(e) => setFormData({...formData, onlyOrderSlots: e.target.value === "" ? 0 : parseInt(e.target.value) || 0})}
                                className="w-full h-[54px] px-5 rounded-xl bg-white border border-slate-200 font-bold text-sm outline-none focus:border-indigo-500 transition-all"
                              />
                           </div>
                         )}
                         {formData.reviewType.includes('SUBMITTED') && (
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 pl-1">Review Submitted Stock</label>
                              <input 
                                type="number"
                                placeholder="0"
                                value={formData.submittedSlots || ""}
                                onChange={(e) => setFormData({...formData, submittedSlots: e.target.value === "" ? 0 : parseInt(e.target.value) || 0})}
                                className="w-full h-[54px] px-5 rounded-xl bg-white border border-slate-200 font-bold text-sm outline-none focus:border-indigo-500 transition-all"
                              />
                           </div>
                         )}
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-indigo-400 pl-1">Sum Capacity</label>
                            <div className="w-full h-[54px] px-5 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-indigo-600/20">
                               {(formData.reviewSlots || 0) + (formData.ratingSlots || 0) + (formData.onlyOrderSlots || 0) + (formData.submittedSlots || 0)}
                            </div>
                         </div>
                      </div>
                   </motion.div>
                 )}
              </AnimatePresence>

             <div className="lg:col-span-6 space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-indigo-950 pl-1">Marketplace</label>
                <CustomDropdown
                  options={marketplaces.length > 0 ? marketplaces.map(m => m.name) : ["Flipkart", "Amazon", "Meesho", "Snapdeal", "Myntra", "Shopsy", "Nykaa", "Blinkit", "Other"]}
                  value={formData.marketplace}
                  onChange={(val) => setFormData({...formData, marketplace: val})}
                  className="h-[60px] border-slate-200 bg-white focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-50"
                />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
             <div className="lg:col-span-12 space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-indigo-950 pl-1">Product Media (Image Upload Only)</label>
                <div className="relative group">
                   <input 
                     type="file" 
                     accept="image/*"
                     onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                   />
                   <div className={`h-[60px] border-2 border-dashed rounded-xl flex items-center justify-center gap-3 transition-all ${imageFile ? "bg-emerald-50 border-emerald-500/30 text-emerald-600" : "bg-slate-50 border-slate-200 text-slate-400 group-hover:border-indigo-400 group-hover:bg-indigo-50/30 group-hover:text-indigo-600"}`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span className="text-[10px] font-black uppercase tracking-widest">
                         {imageFile ? imageFile.name : "Click to Upload Product Image"}
                      </span>
                   </div>
                </div>
             </div>
             <div className="lg:col-span-12 space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-indigo-950 pl-1">Direct Purchase Link</label>
                <input 
                  type="url"
                  placeholder="e.g. https://www.flipkart.com/..."
                  value={formData.productLink}
                  onChange={(e) => setFormData({...formData, productLink: e.target.value})}
                  className="w-full h-[60px] px-6 rounded-xl bg-white border border-slate-200 font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-indigo-950 pl-1">Deal Type</label>
                <CustomDropdown 
                   options={["Original", "Empty Box", "Exchange"]} 
                   value={formData.dealType} 
                   onChange={(v) => setFormData({...formData, dealType: v})} 
                   className="h-[60px] border-slate-200 bg-white" 
                />
              </div>
              <div className="md:col-span-2">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-indigo-950 pl-1">User Remarks (Visibility: User Only)</label>
                  <textarea 
                    placeholder="Notes for the customer/user..."
                    value={formData.userRemarks}
                    onChange={(e) => setFormData({...formData, userRemarks: e.target.value})}
                    className="w-full h-24 px-6 py-4 rounded-xl bg-white border border-slate-200 font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all placeholder:text-slate-400 resize-none"
                  />
                </div>
              </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-950 to-slate-950 text-white rounded-[32px] p-8 md:p-10 space-y-8 overflow-hidden relative border-2 border-indigo-500/20 shadow-2xl">
             <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/20 blur-[100px] rounded-full" />
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="h-2 w-12 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-indigo-50 text-left">Payout Adjustment</h3>
                </div>
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20">
                   (+) Positive = Commission | (-) Negative = Less Amount
                </p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                <div className="space-y-3">
                   <label className={`text-[10px] font-black uppercase tracking-widest pl-1 ${
                     formData.originalCommission === "N/A" || formData.originalCommission === "" || isNaN(Number(formData.originalCommission)) 
                       ? "text-slate-400" 
                       : Number(formData.originalCommission) >= 0 
                         ? "text-blue-400" 
                         : "text-rose-400"
                   }`}>
                     Brand Commission (₹{
                       formData.originalCommission === "N/A" || formData.originalCommission === "" || isNaN(Number(formData.originalCommission)) 
                         ? "N/A" 
                         : Number(formData.originalCommission) >= 0 
                           ? "+" 
                           : "-"
                     })
                   </label>
                   <div className="relative">
                      <span className={`absolute left-6 top-1/2 -translate-y-1/2 font-black text-xl ${
                        formData.originalCommission === "N/A" || formData.originalCommission === "" || isNaN(Number(formData.originalCommission)) 
                          ? "text-slate-500/50" 
                          : Number(formData.originalCommission) >= 0 
                            ? "text-blue-500/50" 
                            : "text-rose-500/50"
                      }`}>₹</span>
                      <input 
                        type="text" 
                        placeholder="Admin Baseline..." 
                        value={formData.originalCommission} 
                        onChange={(e) => setFormData({...formData, originalCommission: e.target.value})} 
                        className={`w-full h-[70px] pl-12 pr-6 rounded-2xl border-2 font-black text-xl outline-none transition-all placeholder:text-white/20 shadow-inner ${
                          formData.originalCommission === "N/A" || formData.originalCommission === "" || isNaN(Number(formData.originalCommission)) 
                            ? "bg-slate-500/10 border-slate-500/20 focus:bg-slate-500/20 focus:border-slate-400 text-slate-50"
                            : Number(formData.originalCommission) >= 0 
                              ? "bg-blue-500/10 border-blue-500/20 focus:bg-blue-500/20 focus:border-blue-400 text-blue-50" 
                              : "bg-rose-500/10 border-rose-500/20 focus:bg-rose-500/20 focus:border-rose-400 text-rose-50"
                        }`} 
                      />
                   </div>
                </div>

                <div className="space-y-3">
                   <label className={`text-[10px] font-black uppercase tracking-widest pl-1 flex items-center gap-2 ${
                     formData.juhiCommission === "N/A" || formData.juhiCommission === "" || isNaN(Number(formData.juhiCommission)) 
                       ? "text-slate-400" 
                       : Number(formData.juhiCommission) >= 0 
                         ? "text-emerald-400" 
                         : "text-rose-400"
                   }`}>
                     Juhi's Rate {juhiAmId ? `(${juhiAmId})` : ''} (₹{
                       formData.juhiCommission === "N/A" || formData.juhiCommission === "" || isNaN(Number(formData.juhiCommission)) 
                         ? "N/A" 
                         : Number(formData.juhiCommission) >= 0 
                           ? "+" 
                           : "-"
                     })
                     <span className="bg-indigo-500/30 text-white text-[7px] px-2 py-0.5 rounded-full border border-indigo-400/30">ENCRYPTED TIER</span>
                   </label>
                   <div className="relative">
                      <span className={`absolute left-6 top-1/2 -translate-y-1/2 font-black text-xl ${
                        formData.juhiCommission === "N/A" || formData.juhiCommission === "" || isNaN(Number(formData.juhiCommission)) 
                          ? "text-slate-500/50" 
                          : Number(formData.juhiCommission) >= 0 
                            ? "text-emerald-500/50" 
                            : "text-rose-500/50"
                      }`}>₹</span>
                      <input 
                        type="text" 
                        placeholder="e.g. 300 or -100" 
                        value={formData.juhiCommission} 
                        onChange={(e) => setFormData({...formData, juhiCommission: e.target.value})} 
                        className={`w-full h-[70px] pl-12 pr-6 rounded-2xl border-2 font-black text-xl outline-none transition-all placeholder:text-white/20 shadow-inner ${
                          formData.juhiCommission === "N/A" || formData.juhiCommission === "" || isNaN(Number(formData.juhiCommission)) 
                            ? "bg-slate-500/10 border-slate-500/20 focus:bg-slate-500/20 focus:border-slate-400 text-slate-50"
                            : Number(formData.juhiCommission) >= 0 
                              ? "bg-emerald-500/10 border-emerald-500/20 focus:bg-emerald-500/20 focus:border-emerald-400 text-emerald-50" 
                              : "bg-rose-500/10 border-rose-500/20 focus:bg-rose-500/20 focus:border-rose-400 text-rose-50"
                        }`} 
                      />
                   </div>
                </div>
             </div>
          </div>

          <div className="pt-6">
             <button type="submit" disabled={loading} className="w-full h-[84px] bg-indigo-600 text-white font-black text-sm uppercase tracking-[0.4em] rounded-[28px] hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-indigo-600/40 flex items-center justify-center gap-4 disabled:opacity-50 border-t border-white/20">
               {loading ? (
                 <span className="flex items-center gap-2">
                   <svg className="animate-spin h-5 w-5 text-indigo-200" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                   PROCESSING DEAL...
                 </span>
               ) : (
                 <>
                   <svg className="w-6 h-6 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                   DEPLOY NEW DEAL
                 </>
               )}
             </button>
          </div>
        </form>
      </div>



        {/* High-Tech Deployment Popup */}
        <AnimatePresence>
           {(deploymentStatus === "deploying" || deploymentStatus === "success") && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6">
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.8, y: 20 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.8, y: 20 }}
                   className="w-full max-w-lg bg-white rounded-[40px] shadow-2xl p-10 overflow-hidden relative text-center border border-white/50"
                 >
                    {/* Animated Background Gradients */}
                    <div className={`absolute -top-24 -right-24 w-64 h-64 blur-[80px] rounded-full pointer-events-none transition-all duration-1000 ${deploymentStatus === "deploying" ? "bg-indigo-500/20 animate-pulse" : "bg-emerald-500/20"}`} />
                    <div className={`absolute -bottom-24 -left-24 w-64 h-64 blur-[80px] rounded-full pointer-events-none transition-all duration-1000 ${deploymentStatus === "deploying" ? "bg-blue-500/20 animate-pulse" : "bg-emerald-500/20"}`} />
                    
                    <div className="relative z-10 space-y-6">
                       {/* Product Image Preview */}
                       {(formData.productImage || imageFile) && (
                         <motion.div 
                           initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                           className="w-32 h-32 mx-auto rounded-3xl overflow-hidden border-4 border-slate-50 shadow-inner"
                         >
                            <img src={imageFile ? URL.createObjectURL(imageFile) : formData.productImage} className="w-full h-full object-cover" alt="Preview" />
                         </motion.div>
                       )}

                       <div className="space-y-1">
                          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{createdCode || previewCode}</h3>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{formData.brandName} - {formData.productDetails || "Preparing Manifest"}</p>
                       </div>

                       <div className="h-px w-full bg-slate-100 my-6" />

                       {deploymentStatus === "deploying" ? (
                          <div className="space-y-6 py-4">
                             {/* 3D Scanning/Deploying Animation */}
                             <div className="flex justify-center">
                                <div className="relative w-20 h-20 flex items-center justify-center">
                                   <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
                                   <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent border-b-transparent animate-[spin_1.5s_linear_infinite]" />
                                   <div className="absolute inset-2 border-4 border-blue-400/50 rounded-full border-l-transparent border-r-transparent animate-[spin_2s_linear_infinite_reverse]" />
                                   <svg className="w-8 h-8 text-indigo-600 animate-pulse drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                   </svg>
                                </div>
                             </div>
                             <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em]">
                                Deploying Deal...
                             </motion.p>
                          </div>
                       ) : (
                          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                             {/* Success State */}
                             <div className="flex justify-center">
                                <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", bounce: 0.5 }} className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                                   <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                </motion.div>
                             </div>
                             <p className="text-[12px] font-black text-emerald-600 uppercase tracking-[0.3em] bg-emerald-50 inline-block px-4 py-1.5 rounded-full border border-emerald-100">
                                Deal Added!
                             </p>
                             
                             <div className="bg-slate-50 rounded-2xl p-6 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-indigo-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Generated Product Code</p>
                                <p className="text-3xl font-black text-indigo-900 uppercase tracking-tighter select-all relative z-10">{createdCode}</p>
                             </div>

                             <button 
                               onClick={() => { setDeploymentStatus("idle"); setCreatedCode(null); onCreated(); }} 
                               className="w-full h-14 bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-900/20"
                             >
                               Confirm & View Ledger
                             </button>
                          </motion.div>
                       )}
                    </div>
                 </motion.div>
              </div>
           )}
        </AnimatePresence>
    </div>
  );
};
