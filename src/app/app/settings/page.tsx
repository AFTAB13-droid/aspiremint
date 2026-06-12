"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Lock, Activity, Shield, User, CreditCard, ChevronRight, 
  MapPin, Mail, Phone, Globe, Smartphone, Monitor, Info,
  CheckCircle2, AlertCircle, RefreshCw, LogOut, Key
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { UserBadge } from "@/components/ui/UserBadge";

function getDeviceInfo(deviceString: string) {
  if (!deviceString) return { name: "Legacy Device", isMobile: false };
  
  const ua = deviceString.toLowerCase();
  const isMobile = /mobile|iphone|ipad|ipod|android|webos|blackberry|iemobile|opera mini/i.test(ua);
  
  if (isMobile) {
    if (ua.includes("iphone")) {
      return { name: "Apple iPhone", isMobile: true };
    }
    if (ua.includes("ipad")) {
      return { name: "Apple iPad", isMobile: true };
    }
    if (ua.includes("samsung") || ua.includes("sm-") || ua.includes("galaxy")) {
      const match = deviceString.match(/sm-[a-z0-9]+/i);
      const model = match ? ` (${match[0].toUpperCase()})` : "";
      return { name: `Samsung Galaxy${model}`, isMobile: true };
    }
    if (ua.includes("pixel")) {
      const match = deviceString.match(/pixel\s*\d+[a-z]?/i);
      const model = match ? ` ${match[0]}` : " Pixel";
      const cleanModel = model.replace(/\b\w/g, c => c.toUpperCase());
      return { name: `Google${cleanModel}`, isMobile: true };
    }
    if (ua.includes("oneplus")) {
      const match = deviceString.match(/oneplus\s*[a-z0-9]+/i);
      const model = match ? ` ${match[0].replace(/oneplus/i, '').trim()}` : "";
      return { name: `OnePlus${model || ' Mobile'}`, isMobile: true };
    }
    if (ua.includes("xiaomi") || ua.includes("redmi") || ua.includes("mi ")) {
      return { name: "Xiaomi Redmi", isMobile: true };
    }
    if (ua.includes("oppo")) {
      return { name: "OPPO Mobile", isMobile: true };
    }
    if (ua.includes("vivo")) {
      return { name: "Vivo Mobile", isMobile: true };
    }
    if (ua.includes("huawei")) {
      return { name: "Huawei Mobile", isMobile: true };
    }
    if (ua.includes("android")) {
      const match = deviceString.match(/\(([^)]+)\)/);
      if (match && match[1]) {
        const tokens = match[1].split(";");
        for (let token of tokens) {
          token = token.trim();
          if (token.includes("Build/")) {
            token = token.split("Build/")[0].trim();
          }
          if (
            token.length > 3 &&
            !/android/i.test(token) &&
            !/linux/i.test(token) &&
            !/wv/i.test(token) &&
            !/mobile/i.test(token) &&
            !/^[0-9.]+$/.test(token)
          ) {
            return { name: token, isMobile: true };
          }
        }
      }
      return { name: "Android Device", isMobile: true };
    }
    return { name: "Mobile Device", isMobile: true };
  }
  
  if (deviceString === "Web Browser") {
    return { name: "Web Browser", isMobile: false };
  }
  
  if (ua.includes("macintosh") || ua.includes("mac os x")) {
    return { name: "macOS Device", isMobile: false };
  }
  if (ua.includes("windows")) {
    return { name: "Windows PC", isMobile: false };
  }
  if (ua.includes("linux")) {
    return { name: "Linux PC", isMobile: false };
  }
  
  return { name: deviceString, isMobile: false };
}

function formatDateTime(timestamp: any) {
  if (!timestamp) return "Unknown Time";
  const d = new Date(timestamp);
  return d.toLocaleDateString() + " • " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  
  const { data: session, update } = useSession();
  const role = (session?.user as any)?.role || "USER";
  const isAdm = role === "ADMIN";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(requestedTab || "profile");

  const [verifyingIFSC, setVerifyingIFSC] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    upiId: "",
    aspireMintId: "",
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    ifscCode: "",
    branchName: "",
    bankDetails: "",
    previousRefundFetched: false,
    previousRefundAmount: 0,
    securitySettings: {
      twoFactorEnabled: false,
      loginHistory: [],
    },
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [verifyingOldPassword, setVerifyingOldPassword] = useState(false);
  const [passwordStep, setPasswordStep] = useState(1); // 1: Old Password, 2: New Password
  const [totalCompletedOrders, setTotalCompletedOrders] = useState(0);
  const [showPaymentOtp, setShowPaymentOtp] = useState(false);
  const [paymentOtp, setPaymentOtp] = useState("");
  const [sendingPaymentOtp, setSendingPaymentOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [originalData, setOriginalData] = useState<any>(null);
  const [checkingRefund, setCheckingRefund] = useState(false);
  const [eligibleRefundAmount, setEligibleRefundAmount] = useState<number | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/user/profile");
        const json = await res.json();
        if (json.success && json.data) {
          const pd = json.data.paymentDetails || {};
          const fetchedData = {
            name: json.data.name || "",
            email: json.data.email || "",
            mobile: json.data.mobile || "",
            upiId: pd.upiId || "",
            aspireMintId: json.data.aspireMintId || "",
            bankName: pd.bankName || "",
            accountHolder: pd.accountHolder || "",
            accountNumber: pd.accountNumber || "",
            ifscCode: pd.ifscCode || "",
            branchName: pd.branchName || "",
            bankDetails: pd.bankDetails || "",
            previousRefundFetched: json.data.previousRefundFetched || false,
            previousRefundAmount: json.data.previousRefundAmount || 0,
            securitySettings: json.data.securitySettings || { twoFactorEnabled: false, loginHistory: [] },
          };
          setFormData(fetchedData);
          setOriginalData(fetchedData);
          setTotalCompletedOrders(json.data.totalCompletedOrders || 0);
        }
      } catch (err) {
        toast.error("Failed to load profile details");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleTabChange = (tabId: string) => {
    if (originalData) {
      setFormData(originalData);
    }
    setActiveTab(tabId);
    setShowPaymentOtp(false);
  };

  const handleCheckPreviousRefund = async () => {
    setCheckingRefund(true);
    try {
      const res = await fetch("/api/refunds/previous");
      const json = await res.json();
      if (json.success && json.eligible) {
        setEligibleRefundAmount(json.amount);
      } else if (json.success && !json.eligible && json.message === "Already fetched") {
        toast.error("You have already fetched your previous refund.");
      } else {
        toast.error("No previous refund record found for your mobile number.");
      }
    } catch (err) {
      toast.error("Error checking previous refund");
    } finally {
      setCheckingRefund(false);
    }
  };

  const handleFetchPreviousRefund = async () => {
    setCheckingRefund(true);
    try {
      const res = await fetch("/api/refunds/previous", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setFormData(prev => ({ ...prev, previousRefundFetched: true, previousRefundAmount: json.amount }));
        setEligibleRefundAmount(null);
        toast.success(`Successfully fetched ₹${json.amount} previous refund!`);
      } else {
        toast.error(json.message || "Failed to fetch previous refund");
      }
    } catch (err) {
      toast.error("Error fetching previous refund");
    } finally {
      setCheckingRefund(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const verifyIFSC = async () => {
    if (!formData.ifscCode || formData.ifscCode.length < 11) {
      toast.error("Please enter a valid 11-digit IFSC code");
      return;
    }

    setVerifyingIFSC(true);
    try {
      const res = await fetch(`https://ifsc.razorpay.com/${formData.ifscCode}`);
      if (!res.ok) throw new Error("Invalid IFSC Code");
      const data = await res.json();
      const resolvedBankName = data.BRANCH ? `${data.BANK} - ${data.BRANCH}` : data.BANK;
      setFormData({
        ...formData,
        bankName: resolvedBankName,
        branchName: data.BRANCH || "",
        bankDetails: resolvedBankName
      });
      toast.success("Bank Registry Authenticated");
    } catch (err) {
      toast.error("IFSC Verification Failed");
    } finally {
      setVerifyingIFSC(false);
    }
  };

  const handleSendPaymentOtp = async () => {
    setSendingPaymentOtp(true);
    try {
      const res = await fetch("/api/auth/otp/send-payment", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setShowPaymentOtp(true);
        setResendCountdown(30); // 30 seconds cooldown for OTP resend
        toast.success("Security Code Dispatched to Email");
      } else {
        toast.error(json.message);
      }
    } catch (err) {
      toast.error("Failed to transmit security code");
    } finally {
      setSendingPaymentOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === "payments" && !showPaymentOtp) {
      handleSendPaymentOtp();
      return;
    }

    setSaving(true);
    try {
      let payload: any = {};
      
      if (activeTab === "profile") {
        payload = {
          name: formData.name,
          mobile: formData.mobile,
        };
      } else if (activeTab === "payments") {
        payload = {
          upiId: formData.upiId,
          bankName: formData.bankName,
          accountHolder: formData.accountHolder,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
          branchName: formData.branchName,
          bankDetails: formData.bankDetails,
          otp: paymentOtp
        };
      }

      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      toast.success("Settings updated successfully!");
      setOriginalData((prev: any) => ({ ...prev, ...payload }));
      setShowPaymentOtp(false);
      setPaymentOtp("");
      
      if (session?.user?.name !== formData.name) {
        await update({ name: formData.name, isProfileComplete: true });
      }

    } catch (err: any) {
      toast.error(err.message || "Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordStep === 1) {
      if (!passwordData.oldPassword) return toast.error("Enter current password");
      setVerifyingOldPassword(true);
      try {
        const res = await fetch("/api/auth/verify-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: passwordData.oldPassword }),
        });
        const json = await res.json();
        if (json.success) {
          setPasswordStep(2);
        } else {
          toast.error(json.message || "Incorrect current password");
        }
      } catch (err) {
        toast.error("Verification failed");
      } finally {
        setVerifyingOldPassword(false);
      }
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    if (passwordData.newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      toast.success("Password updated successfully!");
      setIsPasswordModalOpen(false);
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordStep(1);
    } catch (err: any) {
      toast.error(err.message || "Could not update password");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "security", label: "Security", icon: Lock },
  ];

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12 animate-in fade-in duration-500">
         <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
               <Skeleton className="h-4 w-32" />
               <Skeleton className="h-10 w-64" />
               <Skeleton className="h-4 w-full max-w-sm" />
            </div>
            <Skeleton className="h-14 w-64 rounded-2xl" />
         </div>
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
               <Skeleton className="h-64 rounded-[32px]" />
               <Skeleton className="h-48 rounded-[32px]" />
            </div>
            <div className="lg:col-span-8">
               <Skeleton className="h-[600px] rounded-[40px]" />
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/20">
      {/* Desktop View - Unchanged */}
      <div className="hidden lg:block min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-4 pt-6 pb-20">
          {/* Desktop Tab Switcher - Now at the very top */}
          <div className="flex items-center justify-between mb-8 pb-8 border-b border-slate-50">
             <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${isAdm ? "bg-indigo-600 shadow-lg shadow-indigo-200" : "bg-blue-600 shadow-lg shadow-blue-200"}`}>
                   <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                   <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">System Settings</h2>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Secure Protocol Configuration</p>
                </div>
             </div>

             <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-[24px] border border-slate-100 shadow-inner">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    type="button"
                    className={`px-8 py-3.5 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2.5 ${
                      activeTab === tab.id 
                        ? `bg-white text-slate-900 shadow-xl shadow-slate-200/50 border border-slate-100` 
                        : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                    }`}
                  >
                    <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? (isAdm ? "text-indigo-600" : "text-blue-600") : ""}`} />
                    {tab.label}
                  </button>
                ))}
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Sidebar */}
            <div className="lg:col-span-4 space-y-8">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`rounded-[48px] p-10 shadow-2xl relative overflow-hidden group border ${
                    isAdm 
                      ? "bg-gradient-to-br from-indigo-950 via-slate-950 to-indigo-900 border-indigo-950 shadow-indigo-950/20" 
                      : "bg-gradient-to-br from-blue-950 via-slate-950 to-blue-900 border-blue-950 shadow-blue-950/20"
                  }`}
                >
                   <div className={`absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full blur-[100px] opacity-20 transition-transform group-hover:scale-125 ${isAdm ? "bg-indigo-500" : "bg-blue-500"}`} />
                   
                   <div className="relative z-10 flex flex-col items-center text-center">
                      <div className="mb-8 relative">
                         <div className={`absolute inset-0 blur-2xl opacity-20 rounded-full ${isAdm ? "bg-indigo-600" : "bg-blue-600"}`} />
                         <div className="relative">
                           <UserBadge ordersCount={totalCompletedOrders} align="center" />
                         </div>
                      </div>
                      <h2 className="text-3xl font-black text-white tracking-tighter mb-1 uppercase">{formData.name}</h2>
                      <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-10 ${isAdm ? "text-indigo-300/80" : "text-blue-300/80"}`}>{formData.aspireMintId}</p>
                      
                      <div className="w-full space-y-3 mb-10">
                         <div className="flex items-center justify-between p-5 bg-white/5 backdrop-blur-md rounded-[28px] border border-white/10">
                            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Protocol Rank</span>
                            <span className={`text-xs font-black uppercase tracking-tight ${isAdm ? "text-indigo-400" : "text-blue-400"}`}>{role}</span>
                         </div>
                         <div className="flex items-center justify-between p-5 bg-white/5 backdrop-blur-md rounded-[28px] border border-white/10">
                            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Core Impact</span>
                            <span className="text-xs font-black text-white uppercase tracking-tight">{totalCompletedOrders} Transactions</span>
                         </div>
                      </div>
                   </div>
                </motion.div>
            </div>

            {/* Main Form Area */}
            <div className="lg:col-span-8">
               <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`rounded-[56px] p-8 md:p-14 shadow-2xl border overflow-hidden relative ${
                      isAdm 
                        ? "bg-gradient-to-tr from-slate-50 via-indigo-50/25 to-white border-indigo-100 shadow-indigo-950/[0.03]" 
                        : "bg-gradient-to-tr from-slate-50 via-blue-50/25 to-white border-blue-100 shadow-blue-950/[0.03]"
                    }`}
                  >
                    <div className={`absolute top-0 right-0 h-96 w-96 blur-[120px] opacity-[0.03] pointer-events-none ${isAdm ? "bg-indigo-600" : "bg-blue-600"}`} />
                    
                    <form onSubmit={handleSubmit} className="space-y-12 relative z-10">
                     {/* TAB: PROFILE */}
                     {activeTab === "profile" && (
                       <div className="space-y-10">
                          <div className="flex items-center justify-between pb-6 border-b border-slate-50">
                             <div>
                                <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">Identity Registry</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manage your public and private credentials</p>
                             </div>
                             <User className={`w-8 h-8 opacity-20 ${isAdm ? "text-indigo-600" : "text-blue-600"}`} />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Registry Name</label>
                                <div className="relative group">
                                   <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors">
                                      <User className="w-5 h-5" />
                                   </div>
                                   <input 
                                     type="text" name="name" value={formData.name} onChange={handleChange}
                                     className="w-full h-16 pl-14 pr-6 bg-slate-50 border-none focus:bg-white rounded-[24px] shadow-inner font-bold text-sm outline-none transition-all focus:ring-8 focus:ring-slate-50"
                                   />
                                </div>
                             </div>

                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Direct Mail</label>
                                <div className="relative group opacity-60">
                                   <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">
                                      <Mail className="w-5 h-5" />
                                   </div>
                                   <input 
                                     disabled type="email" value={formData.email}
                                     className="w-full h-16 pl-14 pr-6 bg-slate-50 border-none rounded-[24px] shadow-inner font-bold text-sm outline-none cursor-not-allowed"
                                   />
                                   <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                      <Lock className="w-4 h-4 text-slate-300" />
                                   </div>
                                </div>
                             </div>

                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Secure Mobile</label>
                                <div className="relative group">
                                   <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors">
                                      <Smartphone className="w-5 h-5" />
                                   </div>
                                   <input 
                                     type="tel" name="mobile" value={formData.mobile} onChange={handleChange}
                                     className="w-full h-16 pl-14 pr-6 bg-slate-50 border-none focus:bg-white rounded-[24px] shadow-inner font-bold text-sm outline-none transition-all focus:ring-8 focus:ring-slate-50"
                                   />
                                </div>
                             </div>

                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">AspireMint ID</label>
                                <div className="relative group opacity-60">
                                   <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">
                                      <Globe className="w-5 h-5" />
                                   </div>
                                   <input 
                                     disabled type="text" value={formData.aspireMintId}
                                     className="w-full h-16 pl-14 pr-6 bg-slate-50 border-none rounded-[24px] shadow-inner font-bold text-sm outline-none cursor-not-allowed"
                                   />
                                </div>
                             </div>
                          </div>

                           <div className="mt-8 p-6 rounded-[32px] bg-indigo-50/50 border border-indigo-100/50 flex flex-col md:flex-row items-center justify-between gap-6">
                              <div>
                                 <h4 className="text-sm font-black text-indigo-900 uppercase tracking-tight">Legacy Refund Data</h4>
                                 <p className="text-[10px] font-bold text-indigo-600/70 uppercase tracking-widest mt-1">Check if you have any unclaimed old refunds linked to your mobile</p>
                              </div>
                              {formData.previousRefundFetched ? (
                                 <div className="px-6 py-3 bg-emerald-100 text-emerald-700 rounded-[20px] font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Fetched: ₹{formData.previousRefundAmount.toLocaleString()}
                                 </div>
                              ) : eligibleRefundAmount !== null ? (
                                 <div className="flex items-center gap-3">
                                    <div className="text-right">
                                       <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Eligible Amount</p>
                                       <p className="text-lg font-black text-indigo-700">₹{eligibleRefundAmount.toLocaleString()}</p>
                                    </div>
                                    <button 
                                      type="button" onClick={handleFetchPreviousRefund} disabled={checkingRefund}
                                      className="px-6 h-12 rounded-[20px] bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                                    >
                                       {checkingRefund ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Claim Now"}
                                    </button>
                                 </div>
                              ) : (
                                 <button 
                                   type="button" onClick={handleCheckPreviousRefund} disabled={checkingRefund}
                                   className="px-6 h-12 rounded-[20px] bg-white text-indigo-600 border border-indigo-200 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-sm disabled:opacity-50"
                                 >
                                    {checkingRefund ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : "Check Data"}
                                 </button>
                              )}
                           </div>
                        </div>
                     )}

                     {/* TAB: PAYMENTS */}
                     {activeTab === "payments" && (
                       <div className="space-y-10">
                          <div className="flex items-center justify-between pb-6 border-b border-slate-50">
                             <div>
                                <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">Vault & Settlement</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configure your financial delivery protocols</p>
                             </div>
                             <CreditCard className={`w-8 h-8 opacity-20 ${isAdm ? "text-indigo-600" : "text-blue-600"}`} />
                          </div>

                          <div className="space-y-8">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">UPI ID</label>
                                <div className="relative group">
                                   <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors">
                                      <Smartphone className="w-5 h-5" />
                                   </div>
                                   <input 
                                     type="text" name="upiId" value={formData.upiId} onChange={handleChange} placeholder="e.g. name@upi"
                                     className="w-full h-16 pl-14 pr-6 bg-slate-50 border-none focus:bg-white rounded-[24px] shadow-inner font-bold text-sm outline-none transition-all focus:ring-8 focus:ring-slate-50"
                                   />
                                </div>
                             </div>

                             <div className={`p-8 md:p-10 rounded-[40px] border grid grid-cols-1 md:grid-cols-2 gap-8 shadow-sm ${
                               isAdm 
                                 ? "bg-indigo-50/40 border-indigo-100/60" 
                                 : "bg-blue-50/40 border-blue-100/60"
                             }`}>
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Bank IFSC Code</label>
                                   <div className="flex gap-2">
                                      <div className="relative flex-1 group">
                                         <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">
                                            <Shield className="w-5 h-5" />
                                         </div>
                                         <input 
                                           type="text" name="ifscCode" value={formData.ifscCode} onChange={(e) => setFormData({...formData, ifscCode: e.target.value.toUpperCase()})}
                                           className="w-full h-16 pl-14 pr-6 bg-slate-50 border-none focus:bg-white rounded-[24px] shadow-inner font-bold text-sm outline-none transition-all focus:ring-8 focus:ring-slate-50 uppercase"
                                         />
                                      </div>
                                      <button 
                                        type="button" onClick={verifyIFSC} disabled={verifyingIFSC}
                                        className={`px-6 h-16 rounded-[24px] font-black text-[10px] uppercase tracking-widest transition-all ${
                                          isAdm ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-blue-600 text-white hover:bg-blue-700"
                                        } disabled:opacity-50`}
                                      >
                                         {verifyingIFSC ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Verify"}
                                      </button>
                                   </div>
                                </div>

                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Holder Name</label>
                                   <input 
                                     type="text" name="accountHolder" value={formData.accountHolder} onChange={handleChange}
                                     className="w-full h-16 px-6 bg-slate-50 border-none focus:bg-white rounded-[24px] shadow-inner font-bold text-sm outline-none transition-all focus:ring-8 focus:ring-slate-50"
                                   />
                                </div>

                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Number</label>
                                   <input 
                                     type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange}
                                     className="w-full h-16 px-6 bg-slate-50 border-none focus:bg-white rounded-[24px] shadow-inner font-bold text-sm outline-none transition-all focus:ring-8 focus:ring-slate-50"
                                   />
                                </div>

                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Bank Name</label>
                                   <input 
                                     disabled type="text" value={formData.bankName}
                                     className="w-full h-16 px-6 bg-slate-50 border-none rounded-[24px] shadow-inner font-bold text-sm outline-none opacity-60 cursor-not-allowed"
                                   />
                                </div>

                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Branch Name</label>
                                   <input 
                                     disabled type="text" value={formData.branchName || ""}
                                     className="w-full h-16 px-6 bg-slate-50 border-none rounded-[24px] shadow-inner font-bold text-sm outline-none opacity-60 cursor-not-allowed"
                                   />
                                </div>
                             </div>

                             {showPaymentOtp && (
                               <motion.div 
                                 initial={{ opacity: 0, y: 10 }} 
                                 animate={{ opacity: 1, y: 0 }} 
                                 className={`p-8 rounded-[40px] border space-y-4 shadow-sm ${
                                   isAdm 
                                     ? "bg-indigo-50 border-indigo-100" 
                                     : "bg-blue-50 border-blue-100"
                                 }`}
                               >
                                  <div className="flex justify-between items-center">
                                     <div className="flex items-center gap-3">
                                        <Shield className={`w-5 h-5 ${isAdm ? "text-indigo-600" : "text-blue-600"}`} />
                                        <h4 className={`text-sm font-black uppercase tracking-tight ${isAdm ? "text-indigo-900" : "text-blue-900"}`}>Payment Security Verification</h4>
                                     </div>
                                     <button
                                       type="button"
                                       disabled={sendingPaymentOtp || saving || resendCountdown > 0}
                                       onClick={handleSendPaymentOtp}
                                       className={`text-[10px] font-black uppercase tracking-widest hover:underline disabled:opacity-50 flex items-center gap-1 transition-all ${
                                         isAdm ? "text-indigo-600 hover:text-indigo-800" : "text-blue-600 hover:text-blue-800"
                                       }`}
                                     >
                                       {sendingPaymentOtp ? (
                                         "Resending..."
                                       ) : resendCountdown > 0 ? (
                                         `Resend in ${resendCountdown}s`
                                       ) : (
                                         "Resend Code"
                                       )}
                                     </button>
                                  </div>
                                  <p className={`text-[10px] font-bold uppercase tracking-widest leading-relaxed ${isAdm ? "text-indigo-600/60" : "text-blue-600/60"}`}>
                                     A 6-digit security code has been transmitted to your email. <br/> Please verify to authorize banking modifications.
                                  </p>
                                  <input 
                                    type="text" 
                                    maxLength={6}
                                    value={paymentOtp}
                                    onChange={(e) => setPaymentOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                    placeholder="ENTER 6-DIGIT CODE"
                                    className={`w-full h-16 px-6 bg-white border-2 rounded-[24px] shadow-sm font-black text-lg outline-none transition-all text-center tracking-[0.5em] ${
                                      isAdm 
                                        ? "border-indigo-200 focus:border-indigo-500 text-indigo-600" 
                                        : "border-blue-200 focus:border-blue-500 text-blue-600"
                                    }`}
                                  />
                               </motion.div>
                             )}
                          </div>
                       </div>
                     )}

                     {/* TAB: SECURITY */}
                     {activeTab === "security" && (
                       <div className="space-y-12">
                          <div className="flex items-center justify-between pb-8 border-b border-slate-50">
                             <div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Security Center</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manage authentication layers and access control</p>
                             </div>
                             <Shield className={`w-10 h-10 opacity-10 ${isAdm ? "text-indigo-600" : "text-blue-600"}`} />
                          </div>

                          <div className="space-y-10">
                             {/* Password Update Card - More Blue */}
                             <div className={`p-10 rounded-[40px] border flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm ${
                               isAdm 
                                 ? "bg-indigo-50 border-indigo-100/70" 
                                 : "bg-blue-50 border-blue-100/70"
                             }`}>
                                <div className="flex items-center gap-6">
                                   <div className={`h-16 w-16 rounded-[24px] flex items-center justify-center shadow-2xl ${isAdm ? "bg-indigo-600 text-white" : "bg-blue-600 text-white"}`}>
                                      <Key className="w-8 h-8" />
                                   </div>
                                   <div>
                                      <h4 className="text-lg font-black uppercase tracking-tight text-slate-900">Update Password</h4>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Update your primary security key</p>
                                   </div>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => setIsPasswordModalOpen(true)}
                                  className={`w-full md:w-auto px-12 py-5 rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-2xl transition-all active:scale-95 ${
                                    isAdm ? "bg-indigo-600 shadow-indigo-600/20 hover:bg-indigo-700" : "bg-blue-600 shadow-blue-600/20 hover:bg-blue-700"
                                  }`}
                                >
                                  Update Password
                                </button>
                             </div>

                             {/* Activity Log Section */}
                             <div className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Authorized Session History</h4>
                                   <div className="h-px flex-1 bg-slate-100 mx-6 hidden md:block" />
                                   <Activity className="w-5 h-5 text-slate-300" />
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                   {formData.securitySettings.loginHistory.length > 0 ? (
                                     [...formData.securitySettings.loginHistory].reverse().slice(0, 2).map((log: any, idx: number) => {
                                       const deviceInfo = getDeviceInfo(log.device);
                                       return (
                                         <div key={idx} className={`p-6 rounded-[32px] border flex items-center justify-between group transition-all ${
                                           isAdm 
                                             ? "bg-white/60 border-slate-100/70 hover:border-indigo-200 hover:bg-white hover:shadow-xl hover:shadow-indigo-900/5" 
                                             : "bg-white/60 border-slate-100/70 hover:border-blue-200 hover:bg-white hover:shadow-xl hover:shadow-blue-900/5"
                                         }`}>
                                            <div className="flex items-center gap-5">
                                               <div className="h-12 w-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                                                  {deviceInfo.isMobile ? <Smartphone className="w-6 h-6 text-slate-400 group-hover:text-blue-500" /> : <Monitor className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />}
                                               </div>
                                               <div>
                                                  <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{deviceInfo.name}</p>
                                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{log.ip} • <span className="text-blue-500">{log.location || 'Encrypted Location'}</span></p>
                                               </div>
                                            </div>
                                            <div className="text-right">
                                               <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{formatDateTime(log.timestamp)}</p>
                                               <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Authorized</p>
                                            </div>
                                         </div>
                                       );
                                     })
                                   ) : (
                                     <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-[48px] bg-slate-50/30">
                                        <Info className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">No verified history detected</p>
                                     </div>
                                   )}
                                </div>
                             </div>
                          </div>
                       </div>
                     )}

                     {/* Persistent Save Button - Bottom Fixed for Mobile */}
                     <div className="pt-8 border-t border-slate-50 flex items-center justify-between gap-6">
                        <div className="hidden md:flex items-center gap-3">
                           <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                              <Shield className="w-5 h-5" />
                           </div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                              Changes are encrypted and <br/> stored in your global vault.
                           </p>
                        </div>
                        
                        <button 
                          type="submit" disabled={saving || (activeTab === 'payments' && !showPaymentOtp && false) || activeTab === 'security'}
                          className={`flex-1 md:flex-none md:min-w-[240px] h-16 md:h-18 rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                            isAdm ? "bg-slate-900 shadow-slate-900/20" : "bg-blue-600 shadow-blue-600/20 hover:bg-blue-700"
                          } disabled:opacity-50 disabled:grayscale`}
                        >
                           {sendingPaymentOtp ? <RefreshCw className="w-5 h-5 animate-spin" /> : saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <>{showPaymentOtp ? "Verify & Save" : "Save Configuration"} <CheckCircle2 className="w-4 h-4" /></>}
                        </button>
                     </div>
                  </form>
                </motion.div>
             </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Completely Redesigned Premium Mobile View - Structured like a Native App */}
      <div className="lg:hidden min-h-screen bg-[#f8fafc] pb-24">
        {/* Sleek App Navigation Header */}
        <div className="bg-white/85 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 px-4 py-4 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${isAdm ? "bg-indigo-600 text-white animate-pulse" : "bg-blue-600 text-white"}`}>
                 <Shield className="w-4 h-4" />
              </div>
              <div>
                 <h1 className="text-sm font-black text-slate-900 uppercase tracking-tight">System Settings</h1>
                 <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">AspireMint Secure App</p>
              </div>
           </div>
           
           {/* Profile Rank Badge */}
           <div className="flex items-center">
             <span className={`text-[7.5px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
               isAdm ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : "bg-blue-50 text-blue-700 border border-blue-100"
             }`}>{role}</span>
           </div>
        </div>

        <div className="px-4 py-4 space-y-4">
           {/* Compact Profile Summary Row */}
           <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex items-center gap-3">
              <div className={`shrink-0 h-10 w-10 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center text-white font-black text-sm shadow-md border border-white`}>
                 {formData.name ? formData.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="min-w-0 flex-1">
                 <h2 className="text-xs font-black text-slate-900 truncate uppercase tracking-tight">{formData.name || "User Registry"}</h2>
                 <p className="text-[8.5px] font-bold text-slate-400 truncate uppercase mt-0.5">{formData.aspireMintId || "Unassigned Profile"}</p>
              </div>
              <div className="shrink-0 flex items-center scale-90 origin-right">
                 <UserBadge ordersCount={totalCompletedOrders} align="right" showInfoIcon={false} />
              </div>
           </div>

           {/* Mobile App Segmented Control Tabs */}
           <div className="bg-slate-100/80 p-1 rounded-2xl flex gap-1 border border-slate-200/50">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex-1 flex items-center justify-center py-2.5 rounded-xl transition-all duration-200 gap-1.5 ${
                    activeTab === tab.id 
                      ? `bg-white text-slate-900 shadow-md font-black` 
                      : 'text-slate-400 font-bold hover:text-slate-600'
                  }`}
                >
                  <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? (isAdm ? "text-indigo-600" : "text-blue-600") : ""}`} />
                  <span className="text-[8.5px] uppercase tracking-wider">{tab.label}</span>
                </button>
              ))}
           </div>

           {/* Content Box */}
           <form onSubmit={handleSubmit} className="space-y-4 pb-20">
              <AnimatePresence mode="wait">
                 <motion.div
                   key={activeTab}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   className="space-y-4"
                 >
                    {/* PROFILE VIEW */}
                    {activeTab === "profile" && (
                       <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3.5">
                          <div className="space-y-3">
                             <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Registry Name</label>
                                <div className="relative">
                                   <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300">
                                      <User className="w-4 h-4" />
                                   </div>
                                   <input 
                                     type="text" name="name" value={formData.name} onChange={handleChange}
                                     className="w-full h-11 pl-9 pr-4 bg-slate-50 focus:bg-white rounded-xl shadow-inner font-bold text-xs outline-none border border-transparent focus:border-slate-100 transition-all text-slate-800"
                                   />
                                </div>
                             </div>

                             <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Direct Mail</label>
                                <div className="relative opacity-60">
                                   <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300">
                                      <Mail className="w-4 h-4" />
                                   </div>
                                   <input 
                                     disabled type="email" value={formData.email}
                                     className="w-full h-11 pl-9 pr-10 bg-slate-100 rounded-xl shadow-inner font-bold text-xs outline-none cursor-not-allowed border border-transparent text-slate-800"
                                   />
                                   <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                                      <Lock className="w-3.5 h-3.5 text-slate-300" />
                                   </div>
                                </div>
                             </div>

                             <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Mobile</label>
                                <div className="relative">
                                   <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300">
                                      <Smartphone className="w-4 h-4" />
                                   </div>
                                   <input 
                                     type="tel" name="mobile" value={formData.mobile} onChange={handleChange}
                                     className="w-full h-11 pl-9 pr-4 bg-slate-50 focus:bg-white rounded-xl shadow-inner font-bold text-xs outline-none border border-transparent focus:border-slate-100 transition-all text-slate-800"
                                   />
                                </div>
                             </div>

                             <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">AspireMint ID</label>
                                <div className="relative opacity-60">
                                   <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300">
                                      <Globe className="w-4 h-4" />
                                   </div>
                                   <input 
                                     disabled type="text" value={formData.aspireMintId}
                                     className="w-full h-11 pl-9 pr-10 bg-slate-100 rounded-xl shadow-inner font-bold text-xs outline-none cursor-not-allowed border border-transparent text-slate-800"
                                   />
                                </div>
                             </div>
                          </div>
                       </div>
                    )}

                    {/* PAYMENTS VIEW */}
                    {activeTab === "payments" && (
                       <div className="space-y-4">
                          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                             <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">UPI ID</label>
                                <div className="relative">
                                   <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300">
                                      <Smartphone className="w-4 h-4" />
                                   </div>
                                   <input 
                                     type="text" name="upiId" value={formData.upiId} onChange={handleChange} placeholder="e.g. name@upi"
                                     className="w-full h-11 pl-9 pr-4 bg-slate-50 focus:bg-white rounded-xl shadow-inner font-bold text-xs outline-none border border-transparent focus:border-slate-100 transition-all text-slate-800"
                                   />
                                </div>
                             </div>
                          </div>

                          <div className={`p-4 rounded-2xl border space-y-3 shadow-sm ${
                            isAdm ? "bg-indigo-50/45 border-indigo-100/50" : "bg-blue-50/45 border-blue-100/50"
                          }`}>
                             <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Bank IFSC Code</label>
                                <div className="flex gap-2">
                                   <div className="relative flex-1">
                                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300">
                                         <Shield className="w-4 h-4" />
                                      </div>
                                      <input 
                                        type="text" name="ifscCode" value={formData.ifscCode} onChange={(e) => setFormData({...formData, ifscCode: e.target.value.toUpperCase()})}
                                        className="w-full h-11 pl-9 pr-4 bg-white border border-slate-200/50 focus:border-slate-300 rounded-xl shadow-sm font-bold text-xs outline-none uppercase text-slate-800"
                                      />
                                   </div>
                                   <button 
                                     type="button" onClick={verifyIFSC} disabled={verifyingIFSC}
                                     className={`px-4 h-11 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all ${
                                       isAdm ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-blue-600 text-white hover:bg-blue-700"
                                     } disabled:opacity-50`}
                                   >
                                      {verifyingIFSC ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Verify"}
                                   </button>
                                </div>
                             </div>

                             <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                   <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Holder Name</label>
                                   <input 
                                     type="text" name="accountHolder" value={formData.accountHolder} onChange={handleChange}
                                     className="w-full h-11 px-3 bg-white border border-slate-200/50 focus:border-slate-300 rounded-xl shadow-sm font-bold text-xs outline-none text-slate-800"
                                   />
                                </div>

                                <div className="space-y-1">
                                   <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Account No.</label>
                                   <input 
                                     type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange}
                                     className="w-full h-11 px-3 bg-white border border-slate-200/50 focus:border-slate-300 rounded-xl shadow-sm font-bold text-xs outline-none text-slate-800"
                                   />
                                </div>
                             </div>

                             <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                   <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Bank Name</label>
                                   <input 
                                     disabled type="text" value={formData.bankName}
                                     className="w-full h-11 px-3 bg-white/60 border border-slate-200/20 rounded-xl shadow-sm font-bold text-xs outline-none opacity-70 cursor-not-allowed text-slate-800"
                                   />
                                </div>
                                <div className="space-y-1">
                                   <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Branch Name</label>
                                   <input 
                                     disabled type="text" value={formData.branchName || ""}
                                     className="w-full h-11 px-3 bg-white/60 border border-slate-200/20 rounded-xl shadow-sm font-bold text-xs outline-none opacity-70 cursor-not-allowed text-slate-800"
                                   />
                                </div>
                             </div>
                          </div>

                          {showPaymentOtp && (
                            <motion.div 
                              initial={{ opacity: 0, y: 5 }} 
                              animate={{ opacity: 1, y: 0 }} 
                              className={`p-4 rounded-2xl border space-y-2 shadow-sm ${
                                isAdm ? "bg-indigo-50 border-indigo-100" : "bg-blue-50 border-blue-100"
                              }`}
                            >
                               <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                     <Shield className={`w-4 h-4 ${isAdm ? "text-indigo-600" : "text-blue-600"}`} />
                                     <h4 className={`text-[10px] font-black uppercase tracking-tight ${isAdm ? "text-indigo-900" : "text-blue-900"}`}>Security Verification</h4>
                                  </div>
                                  <button
                                    type="button"
                                    disabled={sendingPaymentOtp || saving || resendCountdown > 0}
                                    onClick={handleSendPaymentOtp}
                                    className={`text-[8px] font-black uppercase tracking-widest hover:underline disabled:opacity-50 flex items-center gap-1 transition-all ${
                                      isAdm ? "text-indigo-600 hover:text-indigo-800" : "text-blue-600 hover:text-blue-800"
                                    }`}
                                  >
                                    {sendingPaymentOtp ? (
                                      "Resending..."
                                    ) : resendCountdown > 0 ? (
                                      `Resend in ${resendCountdown}s`
                                    ) : (
                                      "Resend Code"
                                    )}
                                  </button>
                               </div>
                               <p className={`text-[8px] font-bold uppercase tracking-wider ${isAdm ? "text-indigo-600/60" : "text-blue-600/60"}`}>
                                  Enter the 6-digit code sent to your email.
                                </p>
                               <input 
                                 type="text" 
                                 maxLength={6}
                                 value={paymentOtp}
                                 onChange={(e) => setPaymentOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                 placeholder="CODE"
                                 className={`w-full h-11 px-4 bg-white border rounded-xl shadow-sm font-black text-sm outline-none text-center tracking-[0.2em] ${
                                   isAdm 
                                     ? "border-indigo-200 focus:border-indigo-500 text-indigo-600" 
                                     : "border-blue-200 focus:border-blue-500 text-blue-600"
                                 }`}
                               />
                            </motion.div>
                          )}
                       </div>
                    )}

                    {/* SECURITY VIEW */}
                    {activeTab === "security" && (
                       <div className="space-y-4">
                          <button 
                            type="button" 
                            onClick={() => setIsPasswordModalOpen(true)}
                            className="w-full bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between active:bg-slate-50 transition-all"
                          >
                            <div className="flex items-center gap-3">
                               <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-white ${isAdm ? "bg-indigo-600" : "bg-blue-600"}`}>
                                  <Key className="w-4 h-4" />
                               </div>
                               <div className="text-left">
                                  <h4 className="text-xs font-black uppercase tracking-tight text-slate-800">Update Password</h4>
                                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Change your primary security key</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </button>

                          <div className="space-y-3">
                             <div className="flex items-center gap-2 px-1">
                                <Activity className="w-3.5 h-3.5 text-slate-400" />
                                <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Recent Authorized Sessions</h4>
                             </div>

                             <div className="space-y-2">
                                {formData.securitySettings.loginHistory.length > 0 ? (
                                  [...formData.securitySettings.loginHistory].reverse().slice(0, 2).map((log: any, idx: number) => {
                                    const deviceInfo = getDeviceInfo(log.device);
                                    return (
                                      <div key={idx} className="p-3.5 rounded-2xl border border-slate-100 bg-white shadow-sm flex items-center justify-between">
                                         <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400">
                                               {deviceInfo.isMobile ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                                            </div>
                                            <div>
                                               <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{deviceInfo.name}</p>
                                               <p className="text-[8px] font-bold text-slate-400 mt-0.5">{log.ip} • <span className="text-blue-500">{log.location || 'Encrypted'}</span></p>
                                            </div>
                                         </div>
                                         <div className="text-right">
                                            <p className="text-[8px] font-black text-slate-800">{formatDateTime(log.timestamp)}</p>
                                            <span className="text-[6.5px] font-black text-emerald-500 uppercase tracking-wider block mt-0.5">Verified</span>
                                         </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="py-8 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                     <Info className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">No session history</p>
                                  </div>
                                )}
                             </div>
                          </div>
                       </div>
                    )}
                 </motion.div>
              </AnimatePresence>

              {/* Floating Bottom Glass Save Bar */}
              {activeTab !== 'security' && (
                <div className="fixed bottom-4 left-4 right-4 z-40 bg-white/85 backdrop-blur-md border border-slate-200/60 rounded-2xl p-3 shadow-xl flex items-center justify-between gap-4">
                   <div className="flex items-center gap-2">
                      <div className="h-7 w-7 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                         <Shield className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                         Secured <br/> Vault
                      </p>
                   </div>
                   
                   <button 
                     type="submit" disabled={saving || sendingPaymentOtp}
                     className={`flex-1 max-w-[180px] h-10 rounded-xl text-[9px] font-black uppercase tracking-wider text-white shadow-md active:scale-95 flex items-center justify-center gap-1.5 transition-all ${
                       isAdm ? "bg-slate-900" : "bg-blue-600 hover:bg-blue-700"
                     } disabled:opacity-50`}
                   >
                      {sendingPaymentOtp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <>{showPaymentOtp ? "Verify" : "Save Changes"} <CheckCircle2 className="w-3 h-3" /></>}
                   </button>
                </div>
              )}
           </form>
        </div>
      </div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => {
                setIsPasswordModalOpen(false);
                setPasswordStep(1);
                setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
              }} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              className="relative w-full max-w-md bg-white rounded-[40px] p-8 md:p-10 shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className={`absolute top-0 right-0 -mr-10 -mt-10 h-40 w-40 rounded-full blur-3xl opacity-20 ${isAdm ? "bg-indigo-600" : "bg-blue-600"}`} />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Update Key</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                      {passwordStep === 1 ? "Verify current identity" : "Define new master key"}
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-6">
                  {passwordStep === 1 ? (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <div>
                        <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Current Password</label>
                        <input 
                          type="password" 
                          required 
                          value={passwordData.oldPassword} 
                          onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                          className={`block w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 outline-none transition-all focus:bg-white focus:ring-4 ${isAdm ? "focus:ring-indigo-100 focus:border-indigo-500" : "focus:ring-blue-100 focus:border-blue-500"}`} 
                          placeholder="••••••••"
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={verifyingOldPassword}
                        className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${isAdm ? "bg-indigo-600 shadow-indigo-600/20 hover:bg-indigo-700" : "bg-blue-600 shadow-blue-600/20 hover:bg-blue-700"}`}
                      >
                        {verifyingOldPassword ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "Verify Identity"}
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <div>
                        <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">New Password</label>
                        <input 
                          type="password" 
                          required 
                          value={passwordData.newPassword} 
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className={`block w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 outline-none transition-all focus:bg-white focus:ring-4 ${isAdm ? "focus:ring-indigo-100 focus:border-indigo-500" : "focus:ring-blue-100 focus:border-blue-500"}`} 
                          placeholder="Min 6 characters"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Confirm New Password</label>
                        <input 
                          type="password" 
                          required 
                          value={passwordData.confirmPassword} 
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className={`block w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 outline-none transition-all focus:bg-white focus:ring-4 ${isAdm ? "focus:ring-indigo-100 focus:border-indigo-500" : "focus:ring-blue-100 focus:border-blue-500"}`} 
                          placeholder="Re-enter password"
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={saving}
                        className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${isAdm ? "bg-indigo-600 shadow-indigo-600/20 hover:bg-indigo-700" : "bg-blue-600 shadow-blue-600/20 hover:bg-blue-700"}`}
                      >
                        {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "Update Password"}
                      </button>
                    </motion.div>
                  )}
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
