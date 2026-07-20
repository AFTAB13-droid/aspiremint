"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import formatDate from "@/utils/formatDate";
import { formatTimeAgo } from "@/utils/formatTimeAgo";
import { IBrand } from "@/modules/brand/brand.model";
import { IMarketplace } from "@/modules/brand/marketplace.model";
import { Skeleton } from "@/components/ui/Skeleton";

interface ProductCode {
  code: string;
  stock: number;
  stockReview?: number;
  stockRating?: number;
  stockOnly?: number;
  stockSubmitted?: number;
}

interface Brand {
  _id: string;
  name: string;
  productCodes: ProductCode[];
  exchangeProducts: { name: string; image: string }[];
  isActive: boolean;
}

interface BrandManagerProps {
  onRefresh?: () => void;
}

export const BrandManager: React.FC<BrandManagerProps> = ({ onRefresh }) => {
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [marketplaces, setMarketplaces] = useState<IMarketplace[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newMarketplaceName, setNewMarketplaceName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingMarketplaceId, setDeletingMarketplaceId] = useState<string | null>(null);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  
  const [newProductCode, setNewProductCode] = useState("");
  const [newStockReview, setNewStockReview] = useState<string | number>("");
  const [newStockRating, setNewStockRating] = useState<string | number>("");
  const [newStockOnly, setNewStockOnly] = useState<string | number>("");
  const [newStockSubmitted, setNewStockSubmitted] = useState<string | number>("");
  const [mappingSearch, setMappingSearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  
  const [newExchangeProduct, setNewExchangeProduct] = useState("");
  const [newExchangeProductImage, setNewExchangeProductImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchBrands();
    fetchMarketplaces();
    const interval = setInterval(() => { fetchBrands(); fetchMarketplaces(); }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sync editing brand with fresh polling data
  useEffect(() => {
    if (editingBrand) {
      const updated = brands.find(b => b._id?.toString() === editingBrand._id?.toString());
      if (updated) setEditingBrand(updated as any);
    }
  }, [brands]);

  const fetchBrands = async () => {
    try {
      const res = await fetch("/api/brands");
      const json = await res.json();
      if (json.success) setBrands(json.data);
    } catch (err) {
      toast.error("Failed to load brands");
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketplaces = async () => {
    try {
      const res = await fetch("/api/marketplaces");
      const json = await res.json();
      if (json.success) setMarketplaces(json.data);
    } catch (err) {
      toast.error("Failed to load Marketplaces");
    }
  };

  const calculateBrandStock = (brand: Brand) => {
    return (brand.productCodes || []).reduce((sum, pc) => sum + (pc.stock || 0), 0);
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBrandName.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Brand Registered");
        setNewBrandName("");
        setAddModalOpen(false);
        fetchBrands();
        if (onRefresh) onRefresh();
      } else {
        toast.error(json.message);
      }
    } catch (err) {
      toast.error("Registration failed");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateMarketplace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMarketplaceName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/marketplaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newMarketplaceName.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Marketplace Synced");
        setNewMarketplaceName("");
        fetchMarketplaces();
      } else {
        toast.error(json.message);
      }
    } catch (err) {
      toast.error("Sync failed");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteMarketplace = async () => {
    if (!deletingMarketplaceId) return;
    try {
      const res = await fetch(`/api/marketplaces?id=${deletingMarketplaceId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Marketplace Purged");
        fetchMarketplaces();
      } else {
        toast.error(json.message);
      }
    } catch (err) {
      toast.error("Removal failed");
    } finally {
      setDeletingMarketplaceId(null);
    }
  };

  const handleUpdateProductCodes = async (brandId: string, codes: ProductCode[]) => {
    try {
      const res = await fetch(`/api/brands/${brandId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productCodes: codes }),
      });
      const json = await res.json();
      if (json.success) {
        setBrands(brands.map(b => b._id?.toString() === brandId ? json.data : b));
        if (editingBrand?._id?.toString() === brandId) setEditingBrand(json.data);
        toast.success("Inventory Synchronized");
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      toast.error("Failed to sync inventory");
    }
  };

  const addCode = (brandId: string) => {
    if (!newProductCode) return toast.error("Code is required");
    
    const sReview = typeof newStockReview === "string" ? parseInt(newStockReview) || 0 : newStockReview;
    const sRating = typeof newStockRating === "string" ? parseInt(newStockRating) || 0 : newStockRating;
    const sOnly = typeof newStockOnly === "string" ? parseInt(newStockOnly) || 0 : newStockOnly;
    const sSub = typeof newStockSubmitted === "string" ? parseInt(newStockSubmitted) || 0 : newStockSubmitted;
    
    const stockSum = sReview + sRating + sOnly + sSub;
    if (stockSum < 0) return toast.error("Stock cannot be negative");
    
    const exists = (editingBrand?.productCodes || []).some(pc => pc.code === newProductCode);
    if (exists) return toast.error("Code already exists in this brand");

    const codes = [...(editingBrand?.productCodes || []), { 
      code: newProductCode, 
      stock: stockSum,
      stockReview: sReview,
      stockRating: sRating,
      stockOnly: sOnly,
      stockSubmitted: sSub
    } as any];
    handleUpdateProductCodes(brandId, codes);
    setNewProductCode("");
    setNewStockReview("");
    setNewStockRating("");
    setNewStockOnly("");
    setNewStockSubmitted("");
  };

  const removeCode = (brandId: string, code: string) => {
    const codes = (editingBrand?.productCodes || []).filter(pc => pc.code !== code);
    handleUpdateProductCodes(brandId, codes);
  };

  const updateGranularStock = (brandId: string, code: string, type: 'Review' | 'Rating' | 'Only' | 'Submitted', delta: number) => {
    const codes = (editingBrand?.productCodes || []).map(pc => {
      if (pc.code === code) {
        const fieldMap = {
          'Review': 'stockReview',
          'Rating': 'stockRating',
          'Only': 'stockOnly',
          'Submitted': 'stockSubmitted'
        };
        const field = fieldMap[type] as keyof ProductCode;
        const currentVal = (pc[field] as number) || 0;
        const newVal = Math.max(0, currentVal + delta);
        
        const updatedPc = { ...pc, [field]: newVal };
        updatedPc.stock = (updatedPc.stockReview || 0) + (updatedPc.stockRating || 0) + (updatedPc.stockOnly || 0) + (updatedPc.stockSubmitted || 0);
        return updatedPc;
      }
      return pc;
    });
    handleUpdateProductCodes(brandId, codes as any);
  };

  const handleUpdateExchangeProducts = async (brandId: string, products: { name: string; image: string }[]) => {
    try {
      const res = await fetch(`/api/brands/${brandId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exchangeProducts: products }),
      });
      const json = await res.json();
      if (json.success) {
        setBrands(prev => prev.map(b => b._id?.toString() === brandId ? json.data : b));
        if (editingBrand?._id?.toString() === brandId) setEditingBrand(json.data);
        toast.success("Exchange Catalog Updated");
        if (onRefresh) onRefresh();
      } else {
        toast.error(json.message || "Update Rejected");
      }
    } catch (err) {
      toast.error("Network Error: Failed to sync products");
    }
  };

  const handleExchangeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const loadingId = toast.loading("Uploading Product Visual...");
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: uploadData });
      const json = await res.json();
      if (json.success) {
        setNewExchangeProductImage(json.url);
        toast.success("Visual Ready", { id: loadingId });
      } else {
        toast.error("Upload Failed", { id: loadingId });
      }
    } catch (err) {
      toast.error("Network Error", { id: loadingId });
    } finally {
      setUploadingImage(false);
    }
  };

  const addExchangeProduct = (brandId: string) => {
    if (!newExchangeProduct) return toast.error("Product name required");
    const products = [...(editingBrand?.exchangeProducts || []), { name: newExchangeProduct, image: newExchangeProductImage || "" }];
    handleUpdateExchangeProducts(brandId, products);
    setNewExchangeProduct("");
    setNewExchangeProductImage("");
  };

  const removeExchangeProduct = (brandId: string, productName: string) => {
    const products = (editingBrand?.exchangeProducts || []).filter(p => p.name !== productName);
    handleUpdateExchangeProducts(brandId, products);
  };

  const toggleBrandStatus = async (brand: Brand) => {
    try {
      const res = await fetch(`/api/brands/${brand._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !brand.isActive }),
      });
      const json = await res.json();
      if (json.success) {
        setBrands(brands.map(b => b._id?.toString() === brand._id ? json.data : b));
        toast.success(`Brand ${!brand.isActive ? "Enabled" : "Disabled"}`);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const deleteBrand = async (id: string) => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/brands/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Brand removed");
        fetchBrands();
      }
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-10 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
           <Skeleton className="h-8 w-48" />
           <Skeleton className="h-12 w-32 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-4 space-y-3">
              <Skeleton className="h-4 w-24 ml-2" />
              {[1,2,3,4].map(i => (
                <Skeleton key={i} className="h-20 w-full rounded-[28px]" />
              ))}
           </div>
           <div className="lg:col-span-8">
              <Skeleton className="h-full min-h-[400px] w-full rounded-[40px]" />
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Brand Inventory Master</h2>
         <button 
           onClick={() => setAddModalOpen(true)}
           className="px-6 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
         >
           + New Brand
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* Left Column: List & Settings */}
         <div className="lg:col-span-4 space-y-8">
            <div className="space-y-4">
               <div className="flex flex-col gap-3">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Registry Overview</h3>
                 <div className="relative group">
                    <input 
                      type="text"
                      placeholder="Search brands..."
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-bold outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm pl-12 placeholder:text-slate-400 text-slate-900"
                    />
                    <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 </div>
               </div>

               <div className="max-h-[600px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                  <AnimatePresence>
                  {brands.filter(b => b.name.toLowerCase().includes(brandSearch.toLowerCase())).map((brand, idx) => {
                      const b = brand as any;
                      const totalStock = calculateBrandStock(b);
                      const isLow = totalStock > 0 && totalStock < 10;
                      const isOut = totalStock === 0;

                      return (
                        <motion.div 
                          key={b._id?.toString()}
                          layout
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2, delay: Math.min(idx * 0.05, 0.2) }}
                          onClick={() => setEditingBrand(b)}
                          className={`p-5 rounded-[28px] border cursor-pointer transition-all ${editingBrand?._id?.toString() === b._id?.toString() ? "bg-gradient-to-br from-indigo-600 to-indigo-800 border-indigo-700 shadow-xl shadow-indigo-600/30 text-white transform scale-[1.02]" : "bg-white border-slate-100/60 hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-md text-slate-900"}`}
                        >
                           <div className="flex items-center justify-between">
                              <div>
                                 <p className={`text-sm font-black uppercase tracking-tight ${editingBrand?._id?.toString() === b._id?.toString() ? "text-white" : b.isActive ? "text-slate-900" : "text-slate-400 line-through"}`}>{b.name}</p>
                                 <div className="flex items-center gap-2 mt-2.5">
                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${editingBrand?._id?.toString() === b._id?.toString() ? "bg-white/20 border-white/20 text-white" : isOut ? "bg-rose-50 border-rose-100 text-rose-600" : isLow ? "bg-orange-50 border-orange-100 text-orange-600" : "bg-emerald-50 border-emerald-100 text-emerald-600"}`}>
                                      {isOut ? "Sold Out" : isLow ? "Low Stock" : "In Stock"}
                                    </span>
                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${editingBrand?._id?.toString() === b._id?.toString() ? "text-indigo-200" : "text-slate-400"}`}>{totalStock} Units Total</span>
                                 </div>
                              </div>
                              <div className={`h-3 w-3 rounded-full flex-shrink-0 ${b.isActive ? (editingBrand?._id?.toString() === b._id?.toString() ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" : "bg-emerald-500 shadow-sm shadow-emerald-500/50") : "bg-slate-300"}`} />
                           </div>
                        </motion.div>
                      );
                  })}
                  </AnimatePresence>
                  
                  {brands.filter(b => b.name.toLowerCase().includes(brandSearch.toLowerCase())).length === 0 && (
                     <div className="text-center py-10 bg-slate-50/50 rounded-[28px] border border-dashed border-slate-200">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No brands found</p>
                     </div>
                  )}
               </div>
            </div>

            {/* Marketplace Registry */}
            <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/40 border border-white">
               <div className="flex items-center justify-between mb-8">
                  <div>
                     <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Marketplace Hub</h3>
                     <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Global Platform Registry</p>
                  </div>
                  <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100">
                     <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  </div>
               </div>

               <form onSubmit={handleCreateMarketplace} className="flex gap-3 mb-8">
                  <input 
                    type="text" value={newMarketplaceName} onChange={(e) => setNewMarketplaceName(e.target.value)}
                    placeholder="New Platform..."
                    className="flex-1 h-12 px-6 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-xs outline-none focus:bg-white focus:border-indigo-500 transition-all"
                  />
                  <button 
                    type="submit" disabled={creating}
                    className="h-12 px-6 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                  >
                    {creating ? "..." : "Add"}
                  </button>
               </form>

               <div className="flex flex-wrap gap-2">
                  {marketplaces.map((m) => (
                     <div key={m._id?.toString()} className="group flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl transition-all hover:border-indigo-200 hover:bg-white hover:shadow-sm">
                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{m.name}</span>
                        <button 
                           onClick={() => setDeletingMarketplaceId(m._id?.toString() || null)}
                           className="opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                        >
                           <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                     </div>
                  ))}
                  {marketplaces.length === 0 && (
                     <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center w-full py-4 italic">No marketplaces registered</p>
                  )}
               </div>
            </div>
         </div>

         {/* Product Code Management */}
         <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
               {editingBrand ? (
                  <motion.div 
                    key={editingBrand._id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="bg-white border border-slate-100/60 rounded-[40px] p-8 shadow-sm"
                  >
                     <div className="flex items-center justify-between mb-8">
                        <div>
                           <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{editingBrand.name}</h2>
                           <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Registry ID: {editingBrand._id.slice(-8)}</span>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => toggleBrandStatus(editingBrand)} className={`px-4 py-2 text-[9px] font-black uppercase rounded-xl transition-all border ${editingBrand.isActive ? "bg-white text-slate-600 border-slate-200 hover:bg-slate-50" : "bg-emerald-500 text-white border-emerald-600"}`}>
                              {editingBrand.isActive ? "Pause Registry" : "Resume Registry"}
                           </button>
                           <button onClick={() => deleteBrand(editingBrand._id)} className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 text-[9px] font-black uppercase rounded-xl hover:bg-red-100">
                              Purge
                           </button>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="bg-slate-50/50 border border-slate-100 rounded-[30px] p-6">
                           <label className="mb-4 block text-[10px] font-black uppercase tracking-widest text-indigo-600 pl-1">Inject New Product Inventory</label>
                           <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                              <div className="sm:col-span-12">
                                  <label className="mb-1.5 block text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Product Code</label>
                                  <input 
                                    type="text" value={newProductCode} onChange={(e) => setNewProductCode(e.target.value)}
                                    placeholder="E.g. #PX-900"
                                    className="block w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-100/50 transition-all uppercase"
                                  />
                              </div>
                              <div className="sm:col-span-3">
                                  <label className="mb-1.5 block text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Review</label>
                                  <input 
                                    type="number" value={newStockReview} 
                                    onChange={(e) => setNewStockReview(e.target.value === "" ? "" : parseInt(e.target.value))}
                                    placeholder="0"
                                    className="block w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-100/50 transition-all"
                                  />
                              </div>
                              <div className="sm:col-span-3">
                                  <label className="mb-1.5 block text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Rating</label>
                                  <input 
                                    type="number" value={newStockRating} 
                                    onChange={(e) => setNewStockRating(e.target.value === "" ? "" : parseInt(e.target.value))}
                                    placeholder="0"
                                    className="block w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-100/50 transition-all"
                                  />
                              </div>
                              <div className="sm:col-span-3">
                                  <label className="mb-1.5 block text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Order</label>
                                  <input 
                                    type="number" value={newStockOnly} 
                                    onChange={(e) => setNewStockOnly(e.target.value === "" ? "" : parseInt(e.target.value))}
                                    placeholder="0"
                                    className="block w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-100/50 transition-all"
                                  />
                              </div>
                              <div className="sm:col-span-3">
                                  <label className="mb-1.5 block text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Review Submitted</label>
                                  <input 
                                    type="number" value={newStockSubmitted} 
                                    onChange={(e) => setNewStockSubmitted(e.target.value === "" ? "" : parseInt(e.target.value))}
                                    placeholder="0"
                                    className="block w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-100/50 transition-all"
                                  />
                              </div>
                              <div className="sm:col-span-12 flex flex-col justify-end">
                                  <label className="mb-1.5 block text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em] text-center">Total Master</label>
                                  <button onClick={() => addCode(editingBrand._id)} className="w-full h-[54px] bg-slate-900 text-white font-black text-[10px] uppercase rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
                                     <span className="text-sm">{(parseInt(newStockReview as any) || 0) + (parseInt(newStockRating as any) || 0) + (parseInt(newStockOnly as any) || 0) + (parseInt(newStockSubmitted as any) || 0)}</span>
                                     <span className="opacity-40">ADD</span>
                                  </button>
                              </div>
                           </div>
                         </div>

                         <div className="pt-6 border-t border-slate-50">
                            <div className="flex items-center justify-between mb-4">
                               <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1">Live Mappings & Stock Levels</label>
                               <div className="relative w-48 group">
                                  <input 
                                    type="text" value={mappingSearch} onChange={(e) => setMappingSearch(e.target.value)}
                                    placeholder="Search codes..."
                                    className="w-full bg-slate-100/50 border border-slate-100 rounded-xl px-4 py-2 text-[10px] font-bold outline-none focus:border-indigo-300 transition-all pr-8"
                                  />
                                  <svg className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                               </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar pb-4">
                               {editingBrand.productCodes
                                 .filter(pc => pc.code.toLowerCase().includes(mappingSearch.toLowerCase()))
                                 .map(pc => (
                                 <div key={pc.code} className="group p-4 bg-white border border-slate-100 rounded-[28px] hover:border-indigo-200 transition-all shadow-sm space-y-3">
                                    <div className="flex items-center justify-between">
                                       <div className="flex items-center gap-2.5">
                                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center bg-indigo-50 border border-indigo-100 shadow-sm shadow-indigo-100/10`}>
                                             <svg className="w-4.5 h-4.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                                          </div>
                                          <div>
                                             <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight block truncate max-w-[100px]">{pc.code}</span>
                                             <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block">Total: {pc.stock}</span>
                                          </div>
                                       </div>
                                       <button onClick={() => removeCode(editingBrand._id, pc.code)} className="h-8 w-8 flex items-center justify-center bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all">
                                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                       </button>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2">
                                       {[
                                         { label: 'R', key: 'Review', val: pc.stockReview || 0 },
                                         { label: 'RT', key: 'Rating', val: pc.stockRating || 0 },
                                         { label: 'O', key: 'Only', val: pc.stockOnly || 0 },
                                         { label: 'RS', key: 'Submitted', val: pc.stockSubmitted || 0 }
                                       ].map((t) => (
                                         <div key={t.label} className="bg-slate-50 border border-slate-100 rounded-xl p-2 flex flex-col items-center gap-1.5 relative">
                                            <span className={`text-[7px] font-black uppercase text-slate-400 tracking-widest`}>{t.label}</span>
                                            <div className="flex items-center gap-2">
                                               <button 
                                                 onClick={() => updateGranularStock(editingBrand._id, pc.code, t.key as any, -1)}
                                                 className="h-5 w-5 rounded-md bg-white border border-slate-200 text-slate-400 hover:text-rose-500 flex items-center justify-center text-[10px] font-black transition-all"
                                               >
                                                  -
                                               </button>
                                               <span className="text-[10px] font-black text-slate-900 min-w-[8px] text-center">{t.val}</span>
                                               <button 
                                                 onClick={() => updateGranularStock(editingBrand._id, pc.code, t.key as any, 1)}
                                                 className="h-5 w-5 rounded-md bg-white border border-slate-200 text-slate-400 hover:text-emerald-500 flex items-center justify-center text-[10px] font-black transition-all"
                                               >
                                                  +
                                               </button>
                                            </div>
                                         </div>
                                       ))}
                                    </div>
                                 </div>
                               ))}
                            </div>

                            <div className="pt-10 border-t border-slate-50 mt-10">
                               <label className="mb-2 block text-[12px] font-black uppercase tracking-widest text-indigo-600 pl-1">Establish Exchange Catalog</label>
                               
                               <div className="bg-slate-50/50 border border-slate-100 rounded-[32px] p-6 mb-8 space-y-6">
                                  <div className="flex flex-col sm:flex-row gap-4">
                                     <div className="flex-1">
                                        <label className="mb-2 block text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1">Catalog Item Name</label>
                                        <input 
                                          type="text" value={newExchangeProduct} onChange={(e) => setNewExchangeProduct(e.target.value)}
                                          placeholder="E.g. Liquid / V6 Engine"
                                          className="block w-full rounded-2xl border border-slate-100 bg-white px-5 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-100/50 transition-all"
                                        />
                                     </div>
                                     <div className="w-full sm:w-48">
                                        <label className="mb-2 block text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1 text-center">Product Thumbnail</label>
                                        <div className="relative h-14 group">
                                           {!newExchangeProductImage ? (
                                              <>
                                                 <input 
                                                   type="file" accept="image/*" onChange={handleExchangeImageUpload} disabled={uploadingImage}
                                                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                 />
                                                 <div className="flex items-center justify-center h-full rounded-2xl border-2 border-dashed border-slate-200 group-hover:border-indigo-300 transition-all bg-white">
                                                    <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                 </div>
                                              </>
                                           ) : (
                                              <div className="relative h-full rounded-2xl overflow-hidden border border-emerald-100">
                                                 <img src={newExchangeProductImage} alt="Preview" className="w-full h-full object-cover" />
                                                 <button onClick={() => setNewExchangeProductImage("")} className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 text-white text-[8px] font-black uppercase transition-all">Reset</button>
                                              </div>
                                           )}
                                        </div>
                                     </div>
                                  </div>
                                  <button onClick={() => addExchangeProduct(editingBrand._id)} className="w-full py-4 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">Update Catalog</button>
                               </div>
                               
                               <label className="mb-4 block text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1">Live Exchange Inventory</label>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                     <AnimatePresence>
                                        {(editingBrand.exchangeProducts || []).map((product) => (
                                           <motion.div 
                                             key={product.name}
                                             layout
                                             initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                                             className="group p-3 bg-white border border-slate-100 rounded-2xl flex items-center gap-3 hover:border-indigo-200 hover:shadow-sm transition-all"
                                           >
                                              <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center">
                                                 {product.image ? (
                                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                 ) : (
                                                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">No Img</span>
                                                 )}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                 <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight truncate">{product.name}</p>
                                                 <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">Active Asset</p>
                                              </div>
                                              <button 
                                                onClick={() => removeExchangeProduct(editingBrand._id, product.name)}
                                                className="h-8 w-8 rounded-xl bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                              >
                                                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                              </button>
                                           </motion.div>
                                        ))}
                                     </AnimatePresence>
                                  </div>
                            </div>
                         </div>
                      </div>
                   </motion.div>
                ) : (
                   <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-10 bg-slate-50/30 border-2 border-dashed border-slate-100 rounded-[40px]">
                      <div className="h-20 w-20 rounded-full bg-white shadow-xl flex items-center justify-center mb-6">
                         <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      </div>
                      <p className="text-sm font-black text-slate-300 uppercase tracking-[0.2em]">Select a Brand to Manage Live Inventory</p>
                   </div>
                )}
             </AnimatePresence>
          </div>
       </div>

       {/* Add Brand Modal */}
       <AnimatePresence>
          {isAddModalOpen && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAddModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-white rounded-[40px] p-8 shadow-2xl overflow-hidden">
                   <div className="absolute top-0 right-0 -mr-10 -mt-10 h-40 w-40 rounded-full bg-indigo-50 blur-3xl opacity-50" />
                   <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">New Registry</h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Establish a new brand identity</p>
                   
                   <div className="space-y-6">
                      <div>
                         <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Brand Identity</label>
                         <input 
                            type="text" value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)}
                            placeholder="Enter brand name..."
                            className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100/50 transition-all"
                         />
                      </div>
                      <button onClick={handleCreateBrand} className="w-full py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all">Secure Registry</button>
                   </div>
                </motion.div>
             </div>
          )}
       </AnimatePresence>

       {/* Marketplace Deletion Confirmation Modal */}
       <AnimatePresence>
          {deletingMarketplaceId && (
             <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                <motion.div 
                   initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                   onClick={() => setDeletingMarketplaceId(null)}
                   className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                />
                <motion.div 
                   initial={{ opacity: 0, scale: 0.95, y: 20 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.95, y: 20 }}
                   className="relative w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl overflow-hidden border border-slate-100"
                >
                   <div className="absolute top-0 right-0 h-32 w-32 bg-rose-500/5 blur-[50px] rounded-full -mr-16 -mt-16" />
                   
                   <div className="relative z-10 text-center">
                      <div className="h-20 w-20 bg-rose-50 text-rose-500 rounded-[32px] flex items-center justify-center mx-auto mb-8 border border-rose-100 shadow-inner">
                         <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </div>

                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Platform Deletion</h3>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-10">
                         This will surgically remove this <span className="text-rose-500">Marketplace</span> from the global registry. New deals will no longer be able to select it.
                      </p>

                      <div className="flex flex-col gap-3">
                         <button 
                            onClick={handleDeleteMarketplace}
                            className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/30 active:scale-95 transition-all"
                         >
                            Confirm Deletion
                         </button>
                         <button 
                            onClick={() => setDeletingMarketplaceId(null)}
                            className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                         >
                            Cancel Operation
                         </button>
                      </div>
                   </div>
                </motion.div>
             </div>
          )}
       </AnimatePresence>
    </div>
  );
};
