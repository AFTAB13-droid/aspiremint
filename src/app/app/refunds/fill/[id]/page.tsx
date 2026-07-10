"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/Skeleton";

export default function FillRefundPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitPhase, setSubmitPhase] = useState<number>(0);
  const submissionPhases = ["Verifying Details...", "Requesting for Refund..."];
  
  const [formData, setFormData] = useState<any>({
    reviewLink: "",
    reviewScreenshot: "",
    returnPeriodScreenshot: "",
    deliveryScreenshot: "",
    upiId: "",
    accountHolderName: "",
    expectedPayout: 0,
    dealType: "",
    productCode: "",
  });

  // Deep Fetch & Initialization Logic
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${id}`);
        const json = await res.json();
        
        if (json.success) {
          const o = json.data;
          setOrder(o);
          
          const baseAmount = Number(o.amount) || 0;
          const lessAmount = Number(o.lessAmount) || 0;
          
          const calculatedPayout = baseAmount + lessAmount;

          const resP = await fetch('/api/user/profile');
          const jsonP = await resP.json();
          
          const profileUpi = jsonP.success ? jsonP.data.paymentDetails?.upiId : "";
          const profileHolder = jsonP.success ? (jsonP.data.paymentDetails?.accountHolder || jsonP.data.name) : "";

          const storageKey = `refund_form_${id}`;
          const saved = localStorage.getItem(storageKey);
          const isEditMode = o.status !== "REFUND_FORM_PENDING";
          
          if (saved && !isEditMode) {
             try {
                const parsed = JSON.parse(saved);
                 setFormData((prev: any) => {
                    const newState = { ...prev, ...parsed };
                    
                    // FORCED SYNC: Always prioritize the latest UPI and Holder Name from the order/profile
                    // to ensure "Global Sync" works even if a draft exists in localStorage.
                    newState.upiId = o.refundDetails?.upiId || profileUpi || newState.upiId || "";
                    newState.accountHolderName = o.refundDetails?.accountHolderName || profileHolder || newState.accountHolderName || "";

                    if (!newState.expectedPayout) {
                       newState.expectedPayout = o.refundDetails?.expectedPayout || calculatedPayout;
                    }
                    if (!newState.dealType) newState.dealType = o.refundDetails?.dealType || o.dealType || "Standard";
                    if (!newState.productCode) newState.productCode = o.refundDetails?.productCode || o.productCode || "";

                    // Sync proofs as fallback if not in draft
                    if (!newState.reviewLink) newState.reviewLink = o.refundProof?.reviewLink || "";
                    if (!newState.reviewScreenshot) newState.reviewScreenshot = o.refundProof?.reviewScreenshot || "";
                    if (!newState.returnPeriodScreenshot) newState.returnPeriodScreenshot = o.refundProof?.returnPeriodScreenshot || "";
                    if (!newState.deliveryScreenshot) newState.deliveryScreenshot = o.refundProof?.deliveryScreenshot || "";

                    return newState;
                 });
             } catch(e) { localStorage.removeItem(storageKey); }
          } else {
             setFormData({
                reviewLink: o.refundProof?.reviewLink || "",
                reviewScreenshot: o.refundProof?.reviewScreenshot || "",
                returnPeriodScreenshot: o.refundProof?.returnPeriodScreenshot || "",
                deliveryScreenshot: o.refundProof?.deliveryScreenshot || "",
                upiId: o.refundDetails?.upiId || profileUpi || "",
                accountHolderName: o.refundDetails?.accountHolderName || profileHolder || "",
                expectedPayout: o.refundDetails?.expectedPayout || calculatedPayout,
                dealType: o.refundDetails?.dealType || o.dealType || "Standard",
                productCode: o.refundDetails?.productCode || o.productCode || "",
             });
          }
        } else { toast.error("Identity Handshake Failure"); }
      } catch (err: any) { toast.error("Resource Acquisition Failed"); } finally { setLoading(false); }
    };
    if (id) fetchOrder();
  }, [id]);

  useEffect(() => {
    if (order && !loading) {
      localStorage.setItem(`refund_form_${id}`, JSON.stringify(formData));
    }
  }, [formData, order, loading, id]);

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

  const handleFileUpload = async (file: File, field: string) => {
    if (isUploading) return;
    setIsUploading(field);
    const loadingId = toast.loading(`Media is uploading...`);
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

      const res = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloud_name}/image/upload`, { method: "POST", body: uploadData });
      const json = await res.json();
      
      if (json.secure_url) {
        setFormData((prev: any) => ({ ...prev, [field]: json.secure_url }));
        toast.success(`Media uploaded`, { id: loadingId });
      } else { throw new Error(json.error?.message || "Upload Failed"); }
    } catch (err: any) {
      toast.error(err.message || "Upload Transmission Interrupted", { id: loadingId });
    } finally { setIsUploading(null); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return toast.error("Please wait for uploads to complete");

    // Strict Validation for Mandatory Fields based on Order's Review Type
    const rt = (order.reviewType || "").toUpperCase();
    const isReview = rt === "REVIEW";
    const isRating = rt === "RATING";
    const isSubmitted = rt === "SUBMITTED" || rt === "REVIEW SUBMITTED" || rt === "REVIEW_SUBMITTED";
    const isOnlyOrder = rt === "ORDER" || rt === "ONLY_ORDER" || rt === "ONLY-ORDER";

    if (isReview) {
       if (!formData.reviewLink || formData.reviewLink.trim() === '') {
          toast.error("Please provide the Live Review URL");
          return;
       }
    }

    if (isReview || isRating || isSubmitted) {
       if (!formData.reviewScreenshot) {
          const ssLabel = isSubmitted ? "Review Submitted Screenshot" : isReview ? "Review Snapshot" : "Rating Snapshot";
          toast.error(`Please upload the ${ssLabel}`);
          return;
       }
       if (!formData.returnPeriodScreenshot) {
          toast.error("Please upload the Return Period Over Screenshot");
          return;
       }
    }

    if (isOnlyOrder) {
       if (!formData.deliveryScreenshot) {
          toast.error("Please upload the Order Delivered Screenshot");
          return;
       }
    }

    if (!formData.upiId) {
       toast.error("UPI ID is missing. Please update in settings.");
       return;
    }

    setShowSubmitModal(true);
    setSubmitPhase(0);

    const phaseInterval = setInterval(() => {
      setSubmitPhase(p => p < 1 ? p + 1 : p);
    }, 700);

    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "UNDER_VERIFICATION",
          refundDetails: {
            upiId: formData.upiId,
            accountHolderName: formData.accountHolderName,
            expectedPayout: formData.expectedPayout,
            dealType: formData.dealType || order.dealType,
            productCode: formData.productCode || order.productCode,
            submittedAt: new Date()
          },
          refundProof: {
            reviewLink: formData.reviewLink || "",
            reviewScreenshot: formData.reviewScreenshot || "",
            returnPeriodScreenshot: formData.returnPeriodScreenshot || "",
            deliveryScreenshot: formData.deliveryScreenshot || "",
          }
        }),
      });

      const isOk = res.ok;
      const json = await res.json();
      clearInterval(phaseInterval);
      if (!isOk) {
        setShowSubmitModal(false);
        throw new Error(json.message);
      }

      setSubmitPhase(2); // Success state
      localStorage.removeItem(`refund_form_${id}`);
      
      // Auto-redirect after 3 seconds
      setTimeout(() => {
        window.location.href = '/app';
      }, 3500);
      
    } catch (err: any) { 
      clearInterval(phaseInterval);
      setShowSubmitModal(false);
      toast.error(`Transmission Failed: ${err.message}`); 
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl pb-20 px-4 md:px-0 mt-6 md:mt-0">
        <Skeleton className="h-10 w-48 mb-6 hidden md:block" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="md:col-span-2 space-y-8 order-2 md:order-1">
              <Skeleton className="h-[500px] w-full rounded-[40px]" />
           </div>
           <div className="space-y-6 order-1 md:order-2">
              <Skeleton className="h-80 w-full rounded-[40px]" />
           </div>
        </div>
      </div>
    );
  }

  if (!order) return <div className="text-center py-20">Order not found.</div>;

  const rt = (order.reviewType || "").toUpperCase();
  const isReviewDeal = rt === "REVIEW";
  const isRatingDeal = rt === "RATING";
  const isOnlyOrder = rt === "ORDER" || rt === "ONLY_ORDER" || rt === "ONLY-ORDER";
  const isSubmittedDeal = rt === "SUBMITTED" || rt === "REVIEW SUBMITTED" || rt === "REVIEW_SUBMITTED";
  const isEmptyBox = (order.dealType || "").toLowerCase().includes("empty box");

  const RenderProofInput = ({ label, field, sublabel }: { label: string, field: string, sublabel?: string }) => (
    <div className="space-y-3">
       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
       <div className="relative group">
          {!formData[field] ? (
             <label className={`relative flex flex-col items-center justify-center h-48 rounded-[32px] border-2 border-dashed transition-all cursor-pointer overflow-hidden ${isUploading ? 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed' : 'bg-slate-50 border-slate-200 hover:border-blue-400'}`}>
                <input type="file" accept="image/*" disabled={!!isUploading}
                   onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], field)}
                   className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                />
                {isUploading === field ? (
                   <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                   <div className="text-center p-6">
                      <svg className="w-8 h-8 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{sublabel || "Select Snapshot"}</span>
                   </div>
                )}
             </label>
          ) : (
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative h-48 rounded-[32px] overflow-hidden border-2 border-slate-100 group">
                <img src={formData[field]} className="w-full h-full object-cover p-1 rounded-[30px]" alt="Proof" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 md:pointer-events-none md:group-hover:pointer-events-auto">
                   <button type="button" onClick={() => window.open(formData[field], '_blank')} className="px-4 py-2 bg-white text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-90 transition-all">Verify</button>
                   <button type="button" onClick={() => setFormData((p: any) => ({...p, [field]: ""}))} className="px-4 py-2 bg-red-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-90 transition-all">Clear</button>
                </div>
             </motion.div>
          )}
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] md:bg-transparent pb-36 md:pb-20">
      
      {/* MOBILE STICKY HEADER */}
      <div className="sticky top-0 z-50 md:hidden bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 py-4 flex items-center justify-between">
         <button onClick={() => router.back()} className="h-10 w-10 rounded-full bg-slate-50 flex flex-shrink-0 items-center justify-center text-slate-600 active:scale-90 transition-all border border-slate-100">
            <svg className="w-4 h-4 ml-[-2px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
         </button>
         <div className="text-center px-2">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-tight">Apply Refund</h2>
            <p className="text-xs font-black text-slate-900 tracking-tight">{order.userOrderId}</p>
         </div>
         <button onClick={() => router.push('/app/samples')} className="h-10 px-3 md:px-4 md:w-auto w-10 rounded-full bg-blue-50 flex flex-shrink-0 items-center justify-center text-blue-600 active:scale-90 transition-all gap-2">
             <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             <span className="text-[10px] font-black uppercase tracking-widest hidden xs:block">Help</span>
         </button>
      </div>

      <div className="mx-auto max-w-4xl px-4 md:px-0 pt-6 md:pt-0">
        
        {/* DESKTOP HEADER */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="hidden md:flex mb-12 flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => router.back()} className="h-9 px-4 rounded-xl bg-white border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 hover:text-slate-900 transition-all shadow-sm active:scale-95">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                Back
              </button>
              <button 
                onClick={() => router.push('/app/samples')} 
                className="h-9 px-4 rounded-xl bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:bg-blue-100 transition-all shadow-sm active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Need Help
              </button>
            </div>
            <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tight leading-none">Apply Refund</h1>
            <div className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-3 flex items-center gap-2 font-mono">
               <div className="h-1 w-1 rounded-full bg-blue-500" />
               Order ID: <span className="text-blue-600 select-all">{order.userOrderId}</span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="md:col-span-2 order-2 md:order-1">
             <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="rounded-[32px] md:rounded-[40px] bg-white p-5 md:p-12 shadow-sm md:shadow-xl md:shadow-slate-200/50">
                <form onSubmit={handleSubmit} className="space-y-6 md:space-y-10">
                   
                   {/* Proof Section */}
                   <div className="space-y-8">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                         <div className="h-4 w-1 bg-blue-600 rounded-full" /> Proof Verification
                      </h3>

                       <div className="font-mono">
                          {(isReviewDeal) && ( // Removed isSubmittedDeal from here to hide link
                             <div className="space-y-3 font-mono">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                  Live Review URL <span className="text-red-500 font-bold">*</span>
                                </label>
                               <input 
                                 required type="url" value={formData.reviewLink}
                                 onChange={(e) => setFormData({...formData, reviewLink: e.target.value})}
                                 placeholder="PASTE AMAZON/FLIPKART LINK..."
                                 className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-5 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                               />
                             </div>
                          )}
                       </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                         {(isReviewDeal || isRatingDeal || isSubmittedDeal) && (
                            <RenderProofInput label={(isSubmittedDeal ? "Review Submitted SS" : isReviewDeal ? "Review Snapshot" : "Rating Snapshot") + " *"} field="reviewScreenshot" sublabel="Select Snapshot" />
                         )}
                         {(isReviewDeal || isRatingDeal || isSubmittedDeal) && (
                            <RenderProofInput label="Return Period Over SS *" field="returnPeriodScreenshot" sublabel="Window Evidence" />
                         )}
                         {isOnlyOrder && (
                            <div className="col-span-full">
                               <RenderProofInput label="Order Delivered Screenshot" field="deliveryScreenshot" sublabel="Upload snapshot from orders dashboard" />
                            </div>
                         )}
                      </div>
                   </div>

                   <button 
                     type="submit" disabled={submitting || !!isUploading}
                     className="hidden md:flex w-full rounded-[32px] bg-blue-600 py-6 text-xs font-black text-white uppercase tracking-[0.3em] shadow-2xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 items-center justify-center gap-4"
                   >
                     {submitting ? "Processing..." : isUploading ? "Uploading Asset..." : "Request Refund"}
                   </button>
                </form>
             </motion.div>
          </div>

          <div className="space-y-6 order-1 md:order-2">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[32px] md:rounded-[40px] bg-slate-900 p-8 text-white shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 h-32 w-32 bg-blue-600/20 blur-[80px] rounded-full -mr-16 -mt-16" />
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-8">Summary</h4>
                 <div className="space-y-8 relative z-10">
                    <div>
                       <p className="text-[8px] font-black uppercase text-slate-600 tracking-widest">Brand Product</p>
                       <p className="text-xl md:text-2xl font-black mt-1 uppercase text-blue-400">{order.brandName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-800">
                       <div>
                          <p className="text-[8px] font-black uppercase text-slate-600 tracking-widest">Order Amount</p>
                          <p className="text-sm font-black mt-1">₹{order.amount}</p>
                       </div>
                       <div>
                          <p className="text-[8px] font-black uppercase text-slate-600 tracking-widest">{(Number(order.lessAmount) || 0) >= 0 ? 'Commission' : 'Less Amount'}</p>
                          <p className={`text-sm font-black mt-1 ${(Number(order.lessAmount) || 0) >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                             {(Number(order.lessAmount) || 0) >= 0 ? "+" : ""} ₹{(Number(order.lessAmount) || 0).toLocaleString()}
                          </p>
                       </div>
                    </div>
                    <div className="pt-6 border-t border-slate-800 space-y-4">
                       <div className="flex items-center justify-between">
                          <div>
                             <p className="text-[7px] font-black uppercase text-slate-600 tracking-widest">Dealt Type</p>
                             <p className="text-[10px] font-black text-blue-300 uppercase mt-0.5">{formData.dealType}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[7px] font-black uppercase text-slate-600 tracking-widest">Product Code</p>
                             <p className="text-[10px] font-black text-slate-400 uppercase mt-0.5">{formData.productCode}</p>
                          </div>
                       </div>
                       <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-800 group relative">
                          <p className="text-[7px] font-black uppercase text-slate-500 tracking-widest mb-1.5 flex justify-between items-center">
                             UPI Destination
                             <button 
                               type="button"
                               onClick={() => router.push('/app/settings?tab=payment')}
                               className="text-blue-400 hover:text-blue-300 transition-colors"
                             >
                                Change in Settings
                             </button>
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] font-black text-white tracking-tight">
                              {formData.upiId || "Not Set"}
                            </span>
                            <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2-2V7a2 2 0 012-2h12a2 2 0 012 2v6" /></svg>
                          </div>
                       </div>
                    </div>
                    <div className="pt-6 border-t border-slate-800">
                       <p className="text-[8px] font-black uppercase text-slate-600 tracking-widest">Refund Amount</p>
                       <p className="text-4xl font-black mt-1 text-white">₹{(formData.expectedPayout || 0).toLocaleString()}</p>
                    </div>
                 </div>
             </motion.div>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/80 backdrop-blur-2xl border-t border-slate-100 px-6 py-4 pb-8">
         <div className="flex items-center justify-between gap-6">
            <div className="flex flex-col">
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Refund Amount</span>
               <span className="text-xl font-black text-slate-900">₹{formData.expectedPayout}</span>
            </div>
            <button 
              onClick={(e: any) => handleSubmit(e)}
              disabled={submitting || !!isUploading}
              className="flex-1 rounded-2xl bg-blue-600 py-4 text-[10px] font-black text-white uppercase tracking-widest shadow-xl shadow-blue-200 active:scale-95 transition-all disabled:opacity-50"
            >
               {submitting ? "..." : isUploading ? "UPLOADING..." : "Submit Refund"}
            </button>
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
                  {submitPhase < 2 ? (
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
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Refund Requested</h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                           Refund form submitted. Redirecting to your dashboard...
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
