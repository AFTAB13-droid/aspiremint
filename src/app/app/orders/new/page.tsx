"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { CustomDropdown } from "@/components/ui/CustomDropdown";

export default function NewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitPhase, setSubmitPhase] = useState<number>(0);
  const submissionPhases = ["Verifying Details...", "Confirming Slot...", "Registering Deal...", "Finalizing Order..."];
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [idExists, setIdExists] = useState(false);
  const [checkingId, setCheckingId] = useState(false);

  const [brands, setBrands] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [mediators, setMediators] = useState<any[]>([]);
  const [activeDeals, setActiveDeals] = useState<any[]>([]);
  const [selectedDealDetails, setSelectedDealDetails] = useState<any>(null);

  const [formData, setFormData] = useState({
    brandName: "",
    productCode: "",
    userOrderId: "",
    reviewName: "",
    amount: "",
    reviewType: "REVIEW",
    dealType: "Empty Box",
    exchangeProduct: "",
    lessAmount: "",
    mediatorId: "",
    screenshot: "",
    aspireMintId: "",
    buyerEmail: "",
    upiId: "",
  });

  useEffect(() => {
    const initPage = async () => {
      try {
        const cacheRaw = localStorage.getItem("new_order_cache");
        let initialData: any = {};
        if (cacheRaw) {
          try { initialData = JSON.parse(cacheRaw); } catch(e) {}
        }

        // Prefill from URL (overrides cache)
        const pBrand = searchParams.get("brand");
        const pProduct = searchParams.get("product");
        const pDealType = searchParams.get("dealType");
        const pAmount = searchParams.get("amount");
        const pLess = searchParams.get("less");

        if (pBrand) initialData.brandName = decodeURIComponent(pBrand);
        if (pProduct) {
          initialData.productCode = pProduct;
          // Reset mediator and commission if coming from a new deal link
          initialData.mediatorId = "";
          initialData.lessAmount = "";
        }
        if (pDealType) initialData.dealType = pDealType;
        if (pAmount) initialData.amount = pAmount;

        setFormData(prev => ({ ...prev, ...initialData }));
        if (initialData.screenshot) setUploadPreview(initialData.screenshot);

        const [configRes, brandsRes, profileRes, mediatorsRes, activeDealsRes] = await Promise.all([
          fetch("/api/admin/config?key=order_form_settings"),
          fetch("/api/brands"),
          fetch("/api/user/profile"),
          fetch("/api/mediators"),
          fetch("/api/deals/active")
        ]);

        const [configJson, brandsJson, profileJson, mediatorsJson, activeDealsJson] = await Promise.all([
          configRes.json(),
          brandsRes.json(),
          profileRes.json(),
          mediatorsRes.json(),
          activeDealsRes.json()
        ]);

        if (configJson.success) setConfig(configJson.data);
        if (brandsJson.success) {
          if (activeDealsJson.success) {
             const availableDeals = activeDealsJson.data.filter((deal: any) => (deal.remainingSlots || 0) > 0);
             setActiveDeals(availableDeals);
             const activeBrandNames = new Set(availableDeals.map((deal: any) => deal.brandName));
             const filteredBrands = brandsJson.data.filter((b: any) => activeBrandNames.has(b.name));
             setBrands(filteredBrands);
          } else {
             setBrands(brandsJson.data);
          }
        }
        if (mediatorsJson.success) {
           const sorted = mediatorsJson.data.sort((a: any, b: any) => {
             if (a.name.toLowerCase().includes("juhi")) return -1;
             if (b.name.toLowerCase().includes("juhi")) return 1;
             return 0;
           });
           setMediators(sorted);
        }
        if (profileJson.success) {
          setUserProfile(profileJson.data);
          setFormData(prev => ({
            ...prev,
            aspireMintId: profileJson.data.aspireMintId || "",
            buyerEmail: profileJson.data.email || "",
            upiId: profileJson.data.paymentDetails?.upiId || "",
            ...initialData // Re-apply URL params just in case profile values overrode them
          }));
        }
      } catch (err) {
        toast.error("Initialization sequence failed");
      } finally {
        setLoading(false);
      }
    };
    initPage();
  }, [searchParams]);

  // Auto-save form data to local storage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem("new_order_cache", JSON.stringify(formData));
    }
  }, [formData, loading]);

  const selectedBrandData = useMemo(() => {
    return brands.find(b => b.name === formData.brandName);
  }, [brands, formData.brandName]);

  const availableProducts = useMemo(() => {
    if (!selectedBrandData?.productCodes) return [];
    // Hide products where stock is exactly 0 AND ensure the product is in the active deals list
    return selectedBrandData.productCodes.filter((pc: any) => {
       const hasStock = pc.stock === undefined || pc.stock > 0;
       const isActiveDeal = activeDeals.some(
          (deal) => deal.brandName === formData.brandName && deal.productCode === pc.code
       );
       return hasStock && (activeDeals.length === 0 || isActiveDeal); // If activeDeals is empty (failed to load), just fallback to stock
    });
  }, [selectedBrandData, activeDeals, formData.brandName]);

  const selectedProductData = useMemo(() => {
    return availableProducts.find((pc: any) => pc.code === formData.productCode);
  }, [availableProducts, formData.productCode]);

  const filteredMediators = useMemo(() => {
    if (!selectedDealDetails) return mediators;
    
    const assignedIds = selectedDealDetails.assignedMediators?.map((m: any) => m.mediatorId?._id?.toString() || m.mediatorId?.toString()) || [];
    const juhiObj = mediators.find(m => m.name.toLowerCase().includes("juhi"));
    
    if (juhiObj && assignedIds.length === 1 && assignedIds[0] === juhiObj._id?.toString()) {
       return mediators.filter(m => m._id === juhiObj._id);
    }
    
    return mediators;
  }, [mediators, selectedDealDetails]);

  // Auto-switch protocol if current is out of stock
  useEffect(() => {
    if (selectedProductData) {
      const stockMap: any = {
        REVIEW: selectedProductData.stockReview || 0,
        RATING: selectedProductData.stockRating || 0,
        ORDER: selectedProductData.stockOnly || 0,
        SUBMITTED: selectedProductData.stockSubmitted || 0
      };
      
      if (stockMap[formData.reviewType] <= 0) {
        const available = Object.keys(stockMap).find(k => stockMap[k] > 0);
        if (available) setFormData(prev => ({ ...prev, reviewType: available }));
      }
    }
  }, [selectedProductData, formData.reviewType]);

  // Fetch full deal details when product code changes
  useEffect(() => {
    const fetchDealDetails = async () => {
      if (!formData.productCode) {
        setSelectedDealDetails(null);
        return;
      }
      try {
        const res = await fetch(`/api/deals/active?productCode=${formData.productCode}`);
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          const deal = json.data[0];
          if (!deal.isActive) {
            toast.error("Operational Notice: This deal has been archived by administration.");
            setFormData(prev => ({ ...prev, productCode: "" }));
            setSelectedDealDetails(null);
            return;
          }
          setSelectedDealDetails(deal);
        }
      } catch (err) {
        console.error("Failed to fetch deal details:", err);
      }
    };
    fetchDealDetails();
  }, [formData.productCode]);
  
  // Real-time Order ID validation
  useEffect(() => {
    const checkId = async () => {
      if (!formData.userOrderId || formData.userOrderId.length < 4) {
        setIdExists(false);
        return;
      }
      
      setCheckingId(true);
      try {
        const res = await fetch(`/api/orders/check?orderId=${encodeURIComponent(formData.userOrderId)}`);
        const json = await res.json();
        if (json.success) {
          setIdExists(json.exists);
        }
      } catch (err) {
        console.error("ID validation failed");
      } finally {
        setCheckingId(false);
      }
    };

    const timeout = setTimeout(checkId, 600);
    return () => clearTimeout(timeout);
  }, [formData.userOrderId]);

  const calculatedPayout = useMemo(() => {
      const amt = Number(formData.amount);
      const less = Number(formData.lessAmount) || 0;
      // Unified Logic: Payout = Amount + (CommissionValue)
      return amt + less;
  }, [formData.amount, formData.lessAmount]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
        const newState = { ...prev, [name]: value };
        // Reset product code if brand changes
        if (name === "brandName") newState.productCode = "";
        return newState;
    });
  };

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 2000;
          if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } }
          else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => { if (blob) resolve(blob); else reject(new Error('Compression failed')); }, 'image/jpeg', 0.85);
        };
        img.onerror = () => reject(new Error('Image failed'));
      };
      reader.onerror = () => reject(new Error('Read failed'));
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optimistic UI: Set preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setUploadPreview(reader.result as string);
    reader.readAsDataURL(file);

    setIsUploading(true);
    const loadingId = toast.loading("Media is uploading...");
    
    try {
      const compressedBlob = await compressImage(file);
      const signRes = await fetch("/api/upload/sign");
      const signData = await signRes.json();
      
      if (!signData.success) throw new Error(signData.message);

      const uploadData = new FormData();
      uploadData.append("file", compressedBlob);
      uploadData.append("api_key", signData.api_key);
      uploadData.append("timestamp", signData.timestamp.toString());
      uploadData.append("signature", signData.signature);
      uploadData.append("folder", signData.folder);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloud_name}/image/upload`, {
        method: "POST",
        body: uploadData,
      });
      const json = await res.json();

      if (json.secure_url) {
        setFormData(prev => ({ ...prev, screenshot: json.secure_url }));
        toast.success("Media uploaded", { id: loadingId });
      } else {
        throw new Error(json.error?.message || "Upload failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Upload failed", { id: loadingId });
      setUploadPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isUploading) return toast.error("Asset upload in progress");
    if (idExists) return toast.error("Please provide a unique Order ID");
    if (checkingId) return toast.error("Verifying Order ID...");
    if (!formData.mediatorId) return toast.error("Please select a Mediator Specialist");
    
    setShowSubmitModal(true);
    setSubmitPhase(0);
    
    const phaseInterval = setInterval(() => {
      setSubmitPhase(p => (p < 3 ? p + 1 : p));
    }, 700);

    try {
      // --- FINAL INTEGRITY CHECK (PROACTIVE) ---
      const statusRes = await fetch(`/api/deals/active?productCode=${formData.productCode}`);
      const statusJson = await statusRes.json();
      if (!statusJson.success || statusJson.data.length === 0) {
          clearInterval(phaseInterval);
          setShowSubmitModal(false);
          toast.error("Registry Error: This deal has been removed from the platform.");
          return;
      }
      if (!statusJson.data[0].isActive) {
          clearInterval(phaseInterval);
          setShowSubmitModal(false);
          toast.error("Operational Notice: This deal was archived just now. Initialization aborted.");
          return;
      }
      // -----------------------------------------
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      clearInterval(phaseInterval);

      if (json.success) {
        setSubmitPhase(4); // 4 = Success State
        localStorage.removeItem("new_order_cache");
        setTimeout(() => {
          router.push("/app/orders");
        }, 2000);
      } else {
        setShowSubmitModal(false);
        toast.error(json.message || "Initialization failed");
      }
    } catch (err) {
      clearInterval(phaseInterval);
      setShowSubmitModal(false);
      toast.error("Network synchronization failed");
    }
  };

  if (loading || !config) {
    return (
      <div className="mx-auto max-w-4xl pb-20 px-4 md:px-0 mt-6 md:mt-0">
        <div className="flex flex-col gap-10">
           <Skeleton className="h-12 w-64 rounded-2xl" />
           <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="md:col-span-2 space-y-6">
                 <Skeleton className="h-20 w-full rounded-3xl" />
                 <Skeleton className="h-20 w-full rounded-3xl" />
                 <Skeleton className="h-40 w-full rounded-3xl" />
              </div>
              <Skeleton className="h-96 w-full rounded-[40px]" />
           </div>
        </div>
      </div>
    );
  }

  const isFieldRequired = (fieldName: string) => config[fieldName]?.required;
  const isFieldEnabled = (fieldName: string) => config[fieldName]?.enabled;

  return (
    <div className="min-h-screen bg-[#F8FAFC] md:bg-transparent pb-24 md:pb-20">
      
      {/* MOBILE HEADER */}
      <div className="sticky top-0 z-50 md:hidden bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 py-4 flex items-center justify-between relative z-50">
           <button type="button" onClick={() => router.back()} className="relative z-10 h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:scale-90 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
           </button>
           
           <div className="text-center absolute left-1/2 -translate-x-1/2 w-full pointer-events-none">
              <h2 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 leading-tight">Identity</h2>
              <p className="text-xs font-black text-slate-900 tracking-tight">Order Form</p>
           </div>

           <button type="button" onClick={() => router.push('/app/samples')} className="relative z-10 h-9 px-3 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center gap-1.5 justify-center text-[9px] font-black uppercase tracking-widest active:scale-90 transition-all shadow-sm">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Help
           </button>
      </div>

      <div className="mx-auto max-w-6xl px-4 md:px-6 pt-6 md:pt-10">
        
        <div className="hidden md:flex items-center justify-between mb-8">
           <div>
              <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight leading-none">Order Form</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Configure transaction registry data</p>
           </div>
           <button type="button" onClick={() => router.push('/app/samples')} className="h-11 px-6 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-sm hover:shadow-md">
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             Need Help?
           </button>
        </div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
            
            {/* Left Column: Form Content */}
            <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-[40px] bg-white p-6 md:p-10 shadow-xl shadow-slate-200/30 border border-white space-y-8">
                  
                  {/* Section 1: Brand & Product */}
                  <div className="space-y-6">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                        {isFieldEnabled('brandName') && (
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                 {config.brandName.label} {isFieldRequired('brandName') && "*"}
                              </label>
                              <div className="relative group">
                              <CustomDropdown
                                 options={brands.map(b => b.name)}
                                 value={formData.brandName}
                                 onChange={(val) => handleInputChange({ target: { name: 'brandName', value: val } } as any)}
                                 placeholder="Choose Registry..."
                                 searchable
                                 className="w-full h-16 [&>button]:rounded-[24px]"
                              />
                              </div>
                           </div>
                        )}

                        {isFieldEnabled('productCode') && (
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                 {config.productCode.label} {isFieldRequired('productCode') && "*"}
                              </label>
                              <div className="relative group">
                              <CustomDropdown
                                 options={availableProducts.map((pc: any) => pc.code) || []}
                                 value={formData.productCode}
                                 onChange={(val) => handleInputChange({ target: { name: 'productCode', value: val } } as any)}
                                 placeholder="Select Reference..."
                                 searchable
                                 className="w-full h-16 [&>button]:rounded-[24px]"
                              />
                              </div>
                              <AnimatePresence>
                                 {selectedProductData?.stock !== undefined && selectedProductData.stock < 5 && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2 mt-2 px-2">
                                       <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                                       <span className="text-[9px] font-black uppercase tracking-widest text-rose-500">
                                          High Demand: Only {selectedProductData.stock} slots left
                                       </span>
                                    </motion.div>
                                 )}
                              </AnimatePresence>
                           </div>
                        )}

                        {/* Moved Mediator Selection here */}
                        <div className="space-y-2 col-span-full">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mediator Allocation (*)</label>
                            <div className="relative group">
                               <CustomDropdown
                                  options={filteredMediators.map(m => m.systemDisplayName || m.name)}
                                  value={
                                     (() => {
                                        const found = filteredMediators.find(m => m._id === formData.mediatorId);
                                        return found ? (found.systemDisplayName || found.name) : "";
                                     })()
                                  }
                                  onChange={(val) => {
                                     if(val === "") {
                                        handleInputChange({ target: { name: 'mediatorId', value: "" } } as any);
                                        return;
                                     }
                                     const mediator = filteredMediators.find(m => (m.systemDisplayName || m.name) === val);
                                     if (mediator) {
                                        handleInputChange({ target: { name: 'mediatorId', value: mediator._id } } as any);
                                        
                                        // Auto-fill logic for Juhi
                                        if (mediator.name.toLowerCase().includes("juhi") && (selectedDealDetails?.juhiCommission || 0) !== 0) {
                                           setFormData(prev => ({ ...prev, lessAmount: selectedDealDetails.juhiCommission.toString() }));
                                           toast.success(`Allocated Juhi's standard commission: ₹${selectedDealDetails.juhiCommission}`, { icon: "💰" });
                                        } else {
                                           // Reset for non-Juhi mediators or if Juhi has no pre-set commission
                                           setFormData(prev => ({ ...prev, lessAmount: "" }));
                                           if (mediator.name.toLowerCase().includes("juhi")) {
                                              toast("Juhi's commission not pre-configured. Enter manually.", { icon: "✍️" });
                                           } else {
                                              toast(`Add commission manually for ${mediator.systemDisplayName || mediator.name}`, { icon: "✍️" });
                                           }
                                        }
                                     }
                                  }}
                                  placeholder="SELECT MEDIATOR SPECIALIST *"
                                  searchable
                                  className="w-full h-16 [&>button]:rounded-[24px] border-2 border-slate-100"
                                  renderOption={(option) => {
                                     const isJuhi = option.toLowerCase().includes("juhi");
                                     if (isJuhi) {
                                        return (
                                           <div className="flex items-center w-full">
                                              <span className="text-black font-black animate-pulse flex items-center gap-2">
                                                <span>⭐</span>
                                                {option}
                                              </span>
                                           </div>
                                        );
                                     }
                                     return option;
                                  }}
                               />
                            </div>
                         </div>
                     </div>
                  </div>

                  {/* Section 2: Order Reference */}
                  <div className="space-y-6">
                     <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                        <div className="h-4 w-1 bg-emerald-500 rounded-full" /> Identity Linking
                     </h3>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        {isFieldEnabled('userOrderId') && (
                           <div className="space-y-2 col-span-full sm:col-span-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                 {config.userOrderId.label} {isFieldRequired('userOrderId') && "*"}
                              </label>
                              <input 
                                 name="userOrderId" type="text" required={isFieldRequired('userOrderId')} value={formData.userOrderId} onChange={handleInputChange}
                                 placeholder={config.userOrderId.placeholder}
                                 className={`w-full h-16 rounded-[24px] bg-slate-50 border px-6 font-bold text-slate-800 outline-none transition-all ${
                                    idExists ? "border-rose-400 bg-rose-50/30 ring-4 ring-rose-500/10" : 
                                    checkingId ? "border-blue-200" : "border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600"
                                 }`}
                              />
                              <AnimatePresence>
                                 {idExists && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2 px-4 flex items-center gap-2">
                                       <svg className="w-3.5 h-3.5 text-rose-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                       <span className="text-[10px] font-black uppercase tracking-tight text-rose-500">Warning: Pls double check your order id, its already existing in our registry.</span>
                                    </motion.div>
                                 )}
                              </AnimatePresence>
                           </div>
                        )}

                        {isFieldEnabled('reviewName') && (
                           <div className="space-y-2 col-span-full sm:col-span-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                 Reviewer Name {isFieldRequired('reviewName') && "*"}
                              </label>
                              <input 
                                 name="reviewName" type="text" required={isFieldRequired('reviewName')} value={formData.reviewName} onChange={handleInputChange}
                                 placeholder={config.reviewName.placeholder}
                                 className="w-full h-16 rounded-[24px] bg-slate-50 border border-slate-100 px-6 font-bold text-slate-800 outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                              />
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Section 3: Financial Artifacts */}
                  <div className="space-y-8">
                     <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                        <div className="h-4 w-1 bg-purple-600 rounded-full" /> Financial Parameters
                     </h3>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Order Amount (*)</label>
                           <div className="relative">
                              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black">₹</span>
                              <input 
                                 name="amount" type="number" step="0.01" required value={formData.amount} onChange={handleInputChange}
                                 placeholder="0.00"
                                 className="w-full h-16 rounded-[24px] bg-slate-50 border border-slate-100 pl-10 pr-6 font-black text-xl text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                              />
                           </div>
                           <div className="min-h-[12px] flex items-center">
                              <AnimatePresence mode="wait">
                                 {Number(formData.amount) === 0 && formData.amount !== "" && (
                                    <motion.div 
                                       key="full-refund-amt"
                                       initial={{ opacity: 0, y: -5 }} 
                                       animate={{ opacity: 1, y: 0 }} 
                                       exit={{ opacity: 0, y: -5 }}
                                       className="flex items-center gap-1.5 ml-1"
                                    >
                                       <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                       <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Full Refund Deal</span>
                                    </motion.div>
                                 )}
                              </AnimatePresence>
                           </div>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Deal Type (*)</label>
                           <div className="relative group">
                              <CustomDropdown
                                 options={["Empty Box", "Original", "Exchange"]}
                                 value={formData.dealType}
                                 onChange={(val) => handleInputChange({ target: { name: 'dealType', value: val } } as any)}
                                 placeholder="Empty Box"
                                 className="w-full h-16 [&>button]:rounded-[24px]"
                              />
                           </div>
                        </div>

                        <AnimatePresence>
                           {formData.dealType === 'Exchange' && (
                              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-2 col-span-1 sm:col-span-2">
                                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                                    <svg className="w-3 h-3 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                    Target Exchange Product (*)
                                 </label>
                                 <div className="relative group">
                                    <CustomDropdown
                                       options={selectedBrandData?.exchangeProducts?.map((ep: any) => ep.name) || []}
                                       value={formData.exchangeProduct}
                                       onChange={(val) => handleInputChange({ target: { name: 'exchangeProduct', value: val } } as any)}
                                       placeholder="Select Registry Media..."
                                       searchable
                                       mobileModal={true}
                                       className="w-full h-16 [&>button]:rounded-[24px]"
                                       renderOption={(productName) => {
                                          const ep = selectedBrandData?.exchangeProducts?.find((p: any) => p.name === productName);
                                          return (
                                             <div className="flex items-center gap-4 py-1">
                                                {ep?.image ? (
                                                   <img src={ep.image} alt={productName} className="w-14 h-14 rounded-[12px] object-cover flex-shrink-0 shadow-sm border border-slate-100" />
                                                ) : (
                                                   <div className="w-14 h-14 rounded-[12px] bg-slate-100 flex items-center justify-center text-slate-300 flex-shrink-0 shadow-sm border border-slate-200">
                                                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                   </div>
                                                )}
                                                <span className="truncate text-xs">{productName}</span>
                                             </div>
                                          )
                                       }}
                                       renderValue={(productName) => {
                                          const ep = selectedBrandData?.exchangeProducts?.find((p: any) => p.name === productName);
                                          return (
                                             <div className="flex items-center gap-3">
                                                {ep?.image ? (
                                                   <img src={ep.image} alt={productName} className="w-10 h-10 rounded-[10px] object-cover flex-shrink-0 shadow-sm border border-slate-100" />
                                                ) : (
                                                   <div className="w-10 h-10 rounded-[10px] bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0 border border-slate-200">
                                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                   </div>
                                                )}
                                                <span className="truncate font-black">{productName}</span>
                                             </div>
                                          )
                                       }}
                                    />
                                    {(!selectedBrandData?.exchangeProducts || selectedBrandData.exchangeProducts.length === 0) && (
                                       <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-2 px-2 blur-none">
                                          NO VALID EXCHANGE ITEMS REGISTERED FOR {selectedBrandData?.name || "THIS BRAND"}
                                       </p>
                                    )}
                                 </div>
                              </motion.div>
                           )}
                        </AnimatePresence>

                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                              Adjustment Type
                           </label>
                           
                           <div className="flex bg-slate-50 p-1.5 rounded-[20px] border border-slate-100">
                              <button 
                                 type="button"
                                 onClick={() => {
                                    const val = Math.abs(Number(formData.lessAmount) || 0);
                                    setFormData(p => ({ ...p, lessAmount: val === 0 ? "" : val.toString() }));
                                 }}
                                 className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${Number(formData.lessAmount) >= 0 && formData.lessAmount !== "-" ? "bg-white text-emerald-600 shadow-md border border-emerald-50" : "text-slate-400 hover:text-slate-600"}`}
                              >
                                 Commission (+)
                              </button>
                              <button 
                                 type="button"
                                 onClick={() => {
                                    const val = Math.abs(Number(formData.lessAmount) || 0);
                                    setFormData(p => ({ ...p, lessAmount: val === 0 ? "-" : `-${val}` }));
                                 }}
                                 className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${Number(formData.lessAmount) < 0 || formData.lessAmount === "-" ? "bg-white text-rose-600 shadow-md border border-rose-50" : "text-slate-400 hover:text-slate-600"}`}
                              >
                                 Less (-)
                              </button>
                           </div>

                           <div className="relative">
                              <span className={`absolute left-5 top-1/2 -translate-y-1/2 font-black transition-colors duration-500 ${Number(formData.lessAmount) >= 0 && formData.lessAmount !== "-" ? 'text-emerald-400' : 'text-rose-400'}`}>
                                 {Number(formData.lessAmount) >= 0 && formData.lessAmount !== "-" ? "₹" : "- ₹"}
                              </span>
                              <input 
                                 name="lessAmount" 
                                 type="number" 
                                 step="0.01" 
                                 min="0"
                                 value={formData.lessAmount === "-" || formData.lessAmount === "" ? "" : Math.abs(Number(formData.lessAmount))} 
                                 onChange={(e) => {
                                    const val = e.target.value;
                                    const isLess = Number(formData.lessAmount) < 0 || formData.lessAmount === "-";
                                    if (val === "") {
                                       setFormData(p => ({ ...p, lessAmount: isLess ? "-" : "" }));
                                    } else {
                                       setFormData(p => ({ ...p, lessAmount: isLess ? `-${val}` : val }));
                                    }
                                 }}
                                 placeholder="0.00"
                                 className={`w-full h-16 rounded-[24px] bg-slate-50 border px-6 pl-12 font-black text-lg outline-none focus:bg-white focus:ring-4 transition-all duration-500 ${Number(formData.lessAmount) >= 0 && formData.lessAmount !== "-" ? 'text-emerald-600 border-emerald-100 focus:ring-emerald-600/10 focus:border-emerald-600' : 'text-rose-600 border-rose-100 focus:ring-rose-600/10 focus:border-rose-600'}`}
                              />
                           </div>
                           <div className="min-h-[16px] flex items-center">
                              <AnimatePresence mode="wait">
                                 {Number(formData.lessAmount) === 0 && formData.lessAmount !== "" && formData.lessAmount !== "-" ? (
                                    <motion.div 
                                       key="full-refund-adj"
                                       initial={{ opacity: 0, y: -5 }} 
                                       animate={{ opacity: 1, y: 0 }} 
                                       exit={{ opacity: 0, y: -5 }}
                                       className="flex items-center gap-1.5 ml-1"
                                    >
                                       <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                       <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Full Refund Deal (No Adjustment)</span>
                                    </motion.div>
                                 ) : (
                                    <motion.p 
                                       key="note-adj"
                                       initial={{ opacity: 0 }} 
                                       animate={{ opacity: 1 }} 
                                       exit={{ opacity: 0 }}
                                       className="text-[8px] font-black uppercase tracking-wider text-slate-400 ml-1 leading-tight"
                                    >
                                       {Number(formData.lessAmount) >= 0 && formData.lessAmount !== "-" 
                                          ? "Amount will be added to user payout." 
                                          : "Amount will be deducted from user payout."}
                                    </motion.p>
                                 )}
                              </AnimatePresence>
                           </div>
                        </div>

                        <div className="space-y-2 col-span-full">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Review Protocol (*)</label>
                           <div className="grid grid-cols-2 md:flex p-1.5 bg-slate-50 rounded-[20px] border border-slate-100 gap-1.5 md:gap-0">
                              {["REVIEW", "RATING", "ORDER", "SUBMITTED"].map(type => {
                                 const stockMap: any = {
                                    REVIEW: selectedProductData?.stockReview || 0,
                                    RATING: selectedProductData?.stockRating || 0,
                                    ORDER: selectedProductData?.stockOnly || 0,
                                    SUBMITTED: selectedProductData?.stockSubmitted || 0
                                 };
                                 const isOut = stockMap[type] <= 0;
                                 
                                 return (
                                   <button 
                                      key={type} type="button" 
                                      disabled={isOut}
                                      onClick={() => setFormData(p => ({...p, reviewType: type}))}
                                      className={`flex-1 py-4 md:py-3.5 rounded-xl text-[10px] md:text-[10px] font-black uppercase tracking-widest transition-all ${formData.reviewType === type ? "bg-white text-blue-600 shadow-md border border-blue-50" : isOut ? "opacity-20 cursor-not-allowed grayscale" : "text-slate-400 hover:text-slate-600"}`}
                                   >
                                      {type === "SUBMITTED" ? "REVIEW SUBMITTED" : type}
                                      {isOut && <span className="block text-[6px] opacity-60">Out</span>}
                                   </button>
                                 );
                              })}
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Section 4: Capture Logic (File Upload) */}
                  <div className="space-y-6 pt-4">
                     <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                        <div className="h-4 w-1 bg-amber-500 rounded-full" /> Order Screenshot
                     </h3>
                     
                     <div className="relative group">
                        {!uploadPreview ? (
                           <label className={`relative flex flex-col items-center justify-center h-64 md:h-80 rounded-[40px] border-4 border-dashed transition-all cursor-pointer overflow-hidden ${isUploading ? 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed' : 'bg-slate-50 border-slate-200 hover:border-blue-400 group-hover:bg-blue-50/30'}`}>
                              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" disabled={isUploading} onChange={handleFileUpload} />
                              <div className="text-center p-10">
                                 <div className="h-16 w-16 bg-white rounded-3xl shadow-lg border border-slate-100 flex items-center justify-center mx-auto mb-6 text-slate-400 group-hover:text-blue-500 transition-colors">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                 </div>
                                 <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2">Upload SS</h4>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">upload order screen shot</p>
                              </div>
                           </label>
                        ) : (
                           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative h-64 md:h-80 rounded-[40px] overflow-hidden border-2 border-white shadow-2xl group ring-8 ring-slate-50">
                              <img src={uploadPreview} className="w-full h-full object-cover" alt="Media Preview" />
                              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4 transition-all backdrop-blur-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 md:pointer-events-none md:group-hover:pointer-events-auto">
                                 {isUploading ? (
                                    <div className="flex flex-col items-center gap-4">
                                       <div className="h-10 w-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                       <span className="text-[10px] font-black text-white uppercase tracking-widest animate-pulse">Uploading...</span>
                                    </div>
                                 ) : (
                                    <>
                                       <button type="button" onClick={() => window.open(formData.screenshot, '_blank')} className="px-8 py-3 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-90 transition-all">Review Image</button>
                                       <button type="button" onClick={() => { setUploadPreview(null); setFormData(p => ({...p, screenshot: ""})) }} className="px-8 py-3 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-90 transition-all">Remove Image</button>
                                    </>
                                 )}
                              </div>
                           </motion.div>
                        )}
                     </div>
                  </div>
                </motion.div>

                {/* LARGE SUBMIT BUTTON - DESKTOP ONLY */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.1 }}
                  className="hidden md:block"
                >
                  <button 
                    type="submit" 
                    onClick={(e) => handleSubmit(e)}
                    disabled={submitting || isUploading || idExists || checkingId || !formData.brandName || !formData.productCode || formData.amount === "" || !formData.screenshot}
                    className="w-full h-20 md:h-24 rounded-[32px] bg-blue-600 text-white shadow-2xl shadow-blue-600/30 hover:bg-blue-700 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-40 disabled:grayscale disabled:pointer-events-none group relative overflow-hidden"
                  >
                     <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-white/10 to-blue-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                     <div className="relative z-10 flex flex-col items-center justify-center gap-1">
                        <div className="flex items-center gap-3">
                           <span className="text-sm md:text-lg font-black uppercase tracking-[0.3em]">{submitting ? "SUBMITTING DEAL..." : "SUBMIT DEAL"}</span>
                           <svg className={`w-5 h-5 md:w-6 md:h-6 transition-transform ${submitting ? 'animate-spin' : 'group-hover:translate-x-2'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={submitting ? "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" : "M14 5l7 7-7 7"} />
                           </svg>
                        </div>
                        {!submitting && !isUploading && (
                           <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest opacity-60">Authentication & Validation Required</p>
                        )}
                     </div>
                  </button>
                  <p className="text-center mt-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] leading-relaxed">
                     By submitting, you agree to the <span className="text-blue-500">Registry Protocols</span> and <span className="text-blue-500">Settlement Terms</span>.
                  </p>
                </motion.div>
            </div>

            {/* Right Column: Summarization & Profile */}
            <div className="space-y-8 order-1 lg:order-2">
               {/* User Context Horizontal Tile */}
               <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-[16px] bg-blue-50 border border-blue-100 flex items-center justify-center text-lg font-black text-blue-600">
                        {userProfile?.name?.charAt(0) || "U"}
                     </div>
                     <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{userProfile?.name || "Initializing..."}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{formData.aspireMintId}</span>
                     </div>
                  </div>
                  {formData.upiId && (
                     <div className="md:text-right hidden sm:block">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Primary UPI</span>
                        <span className="text-xs font-black text-slate-900 font-mono tracking-tight">{formData.upiId}</span>
                     </div>
                  )}
               </div>

                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="hidden md:block rounded-[40px] bg-slate-900 p-8 md:p-10 text-white shadow-2xl relative overflow-hidden ring-1 ring-white/10">
                   <div className="absolute top-0 right-0 h-48 w-48 bg-blue-600/10 blur-[80px] rounded-full -mr-24 -mt-24" />
                   
                   <div className="relative z-10 space-y-8">
                      <div className="space-y-6">
                         <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Summary</h4>
                         <div className="space-y-5">
                            <div className="flex justify-between items-end">
                               <span className="text-[10px] font-black text-slate-500 uppercase">Registered Brand</span>
                               <span className="text-xs font-black text-white uppercase tracking-tighter">{formData.brandName || "NULL"}</span>
                            </div>
                            <div className="flex justify-between items-end">
                               <span className="text-[10px] font-black text-slate-500 uppercase">Product Ref.</span>
                               <span className="text-xs font-black text-blue-400 uppercase tracking-tighter">{formData.productCode || "PENDING"}</span>
                            </div>
                            <div className="flex justify-between items-end">
                               <span className="text-[10px] font-black text-slate-500 uppercase">Order Amount</span>
                               <span className="text-xs font-black text-white">₹{(Number(formData.amount) || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-end">
                               <span className="text-[10px] font-black text-slate-500 uppercase">{(Number(formData.lessAmount) || 0) >= 0 ? 'Commission' : 'Less Amount'}</span>
                               <span className={`text-xs font-black ${(Number(formData.lessAmount) || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {(Number(formData.lessAmount) || 0) >= 0 ? '+' : ''} ₹{(Number(formData.lessAmount) || 0).toLocaleString()}
                               </span>
                            </div>
                            <div className="flex justify-between items-end pt-4 border-t border-white/10">
                               <div className="flex flex-col">
                                  <span className="text-[10px] font-black text-slate-400 uppercase">Expected Refund</span>
                                  {(Number(formData.lessAmount) === 0 && formData.lessAmount !== "") && (
                                     <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">Full Refund Deal</span>
                                  )}
                               </div>
                               <span className="text-2xl font-black text-emerald-400">₹{calculatedPayout.toLocaleString()}</span>
                            </div>
                         </div>
                      </div>

                      <div className="pt-8 border-t border-white/5 flex flex-col gap-4">
                         <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Ready for Settlement initialization</span>
                         </div>
                         <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center italic">Review your details carefully before submitting below.</p>
                         </div>
                      </div>
                   </div>
                </motion.div>


            </div>
        </form>

        {/* MOBILE STICKY BOTTOM BAR */}
        <div className="fixed bottom-0 left-0 right-0 z-[60] md:hidden bg-white/80 backdrop-blur-2xl border-t border-slate-100 px-6 py-4 pb-8">
           <div className="flex items-center justify-between gap-6">
              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Expected Refund</span>
                 <span className="text-xl font-black text-slate-900">₹{calculatedPayout.toLocaleString()}</span>
              </div>
              <button 
                onClick={(e: any) => handleSubmit(e)}
                disabled={submitting || isUploading || idExists || checkingId || !formData.brandName || !formData.productCode || formData.amount === "" || !formData.screenshot}
                className="flex-[2] h-14 rounded-2xl bg-blue-600 text-[11px] font-black text-white uppercase tracking-[0.3em] shadow-xl shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50"
              >
                 {submitting ? "SUBMITTING DEAL..." : isUploading ? "UPLOADING..." : "Submit Deal"}
              </button>
           </div>
        </div>

      </div>

      {/* DYNAMIC PROGRESS & SUCCESS MODAL */}
      <AnimatePresence>
         {showSubmitModal && (
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
            >
               <motion.div 
                  initial={{ scale: 0.95, y: 20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  className="bg-white rounded-[40px] p-8 md:p-12 max-w-sm w-full text-center shadow-2xl relative overflow-hidden"
               >
                  {submitPhase < 4 ? (
                     <div className="flex flex-col items-center justify-center space-y-8">
                        <div className="relative">
                           <div className="h-20 w-20 rounded-full border-4 border-slate-100 flex items-center justify-center">
                              <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                           </div>
                           <div className="absolute inset-0 bg-blue-600/10 blur-xl rounded-full animate-pulse" />
                        </div>
                        
                        <div className="space-y-4 w-full">
                           {submissionPhases.map((phase, idx) => (
                              <div key={idx} className={`flex items-center gap-3 transition-all duration-500 ${submitPhase === idx ? 'opacity-100 scale-105' : submitPhase > idx ? 'opacity-40' : 'opacity-20'}`}>
                                 <div className={`h-4 w-4 rounded-full flex-shrink-0 flex items-center justify-center transition-colors duration-500 ${submitPhase > idx ? 'bg-emerald-500' : submitPhase === idx ? 'bg-blue-600 animate-pulse' : 'bg-slate-200'}`}>
                                    {submitPhase > idx && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                 </div>
                                 <span className={`text-[10px] font-black uppercase tracking-widest text-left ${submitPhase === idx ? 'text-blue-600' : 'text-slate-500'}`}>{phase}</span>
                              </div>
                           ))}
                        </div>
                     </div>
                  ) : (
                     <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center"
                     >
                        <div className="relative mb-6">
                           <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", damping: 12, stiffness: 200 }}
                              className="h-20 w-20 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto shadow-2xl shadow-emerald-500/30"
                           >
                              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                 <motion.path 
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" 
                                 />
                              </svg>
                           </motion.div>
                           <motion.div 
                              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="absolute inset-0 bg-emerald-500 rounded-full blur-2xl -z-10"
                           />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Order Confirmed</h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                           Redirecting to your dashboard...
                        </p>
                     </motion.div>
                  )}
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

    </div>
  );
}