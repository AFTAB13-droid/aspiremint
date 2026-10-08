import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { getUserAvatar } from "@/data/avatars";

interface UserDossierModalProps {
  user: any;
  onClose: () => void;
  onUpdate?: (updatedUser: any) => void;
}

export function UserDossierModal({ user, onClose, onUpdate }: UserDossierModalProps) {
  const { data: session } = useSession();
  const loggedInRole = (session?.user as any)?.role || "USER";
  const isSubAdmin = loggedInRole === "SUBADMIN";

  const maskEmail = (email: string) => {
    if (!email) return "N/A";
    const [local, domain] = email.split("@");
    if (!domain) return "****";
    return `${local.slice(0, 3)}***@${domain}`;
  };

  const maskName = (name: string) => {
    if (!name) return "N/A";
    const parts = name.split(" ");
    return parts.map(p => p.length > 2 ? `${p[0]}***${p.slice(-1)}` : `${p[0]}*`).join(" ");
  };

  const maskUpiId = (upi: string) => {
    if (!upi) return "N/A";
    const parts = upi.split("@");
    if (parts.length < 2) return "****";
    const username = parts[0];
    const maskedUser = username.length > 2 ? `${username.slice(0, 2)}***` : `${username[0]}***`;
    return `${maskedUser}@${parts[1]}`;
  };

  const maskAccNumber = (acc: string) => {
    if (!acc) return "N/A";
    if (acc.length <= 4) return `•••• ${acc}`;
    return `•••• ${acc.slice(-4)}`;
  };

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const [role, setRole] = useState(user.role || 'USER');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmTerminate, setShowConfirmTerminate] = useState(false);
  
  const [exData, setExData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`/api/users/${user._id}`);
        const data = await res.json();
        if (data.success) {
          setExData(data.data);
        }
      } catch (err) {
        console.error("Dossier load error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetrics();
  }, [user._id]);

  const handleUpdateRole = async () => {
    if (role === user.role) return toast.error("Role is already " + role);
    setIsUpdating(true);
    const loadingId = toast.loading("Updating System Clearance...");
    try {
      const res = await fetch(`/api/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Security Clearance Updated", { id: loadingId });
        if (onUpdate) onUpdate(data.data);
      } else {
        throw new Error(data.message || "Failed to update role");
      }
    } catch (err: any) {
      toast.error(err.message, { id: loadingId });
    } finally {
      setIsUpdating(false);
    }
  };

  const executeTermination = async () => {
     setIsDeleting(true);
     const loadingId = toast.loading("Revoking Identity Access...");
     try {
       const res = await fetch(`/api/users/${user._id}`, {
         method: "DELETE",
       });
       const data = await res.json();
       if (data.success) {
         toast.success("Access Revoked Successfully", { id: loadingId });
         onClose();
         window.location.reload(); 
       } else {
         throw new Error(data.message || "Termination failed");
       }
     } catch (err: any) {
       toast.error(err.message, { id: loadingId });
       setIsDeleting(false);
       setShowConfirmTerminate(false);
     }
  };

  const isInactiveDanger = exData && exData.daysInactive > 250;
  const isTerminated = exData?.isTerminated;

  // Calculate Security Health Score (0-100)
  const securityScore = useMemo(() => {
     if (!exData) return 0;
     let score = 30; // Base score
     if (exData.isVerified.email) score += 40;
     if (exData.isVerified.mobile) score += 30;
     if (isTerminated) return 0;
     return score;
  }, [exData, isTerminated]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md shadow-2xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0" />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 100 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 100 }}
        className="relative w-full max-w-xl bg-white rounded-[44px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-white/20"
      >
        {/* Header Mesh Gradient Section */}
        <div className={`p-8 md:p-10 text-white relative shrink-0 overflow-hidden`}>
           {/* Dynamic Backgrounds */}
           <div className={`absolute inset-0 transition-colors duration-700 ${
              isTerminated ? 'bg-slate-900' :
              user.role === 'ADMIN' ? 'bg-indigo-600' : 
              user.role === 'MEDIATOR' ? 'bg-purple-600' : 'bg-blue-600'
           }`} />
           
           <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-white/10 blur-[80px] rounded-full -mr-32 -mt-32 pointer-events-none" />
           <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-black/10 blur-[60px] rounded-full -ml-20 -mb-20 pointer-events-none" />

           <div className="flex items-center gap-8 relative z-10">
              <div className={`h-24 w-24 rounded-[32px] bg-white/20 backdrop-blur-xl flex items-center justify-center text-4xl font-black shadow-inner border border-white/30 relative shrink-0 transition-all overflow-hidden p-1 ${isInactiveDanger ? 'ring-4 ring-rose-500 animate-pulse' : ''} ${isTerminated ? 'grayscale' : ''}`}>
                 <img 
                   src={getUserAvatar(user.avatar || user.profileImage, user.name)} 
                   alt={user.name} 
                   className="w-full h-full object-cover rounded-[24px]"
                 />
                 {isTerminated && (
                    <div className="absolute -bottom-2 -right-2 bg-rose-600 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full border-2 border-slate-900 shadow-xl">TERMINATED</div>
                 )}
              </div>
              <div className="overflow-hidden">
                 <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 leading-none">Security Dossier</span>
                    {isTerminated && <span className="h-1.5 w-1.5 bg-rose-500 rounded-full animate-ping" />}
                 </div>
                 <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-none mb-2 truncate drop-shadow-sm">{user.name}</h2>
                 <p className="text-sm font-bold opacity-80 truncate">{isSubAdmin ? maskEmail(user.email) : user.email}</p>
              </div>
           </div>
        </div>

        <div className="p-6 md:p-8 pt-6 space-y-8 overflow-y-auto custom-scrollbar flex-1 relative">
          
          {isSubAdmin ? (
             <div className="w-full py-4 text-center bg-slate-50 rounded-2xl border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                🔒 Contact channels secured for SubAdmin
             </div>
          ) : (
             <div className="flex gap-2">
                <button 
                   onClick={() => {
                      const phone = user.mobile?.replace(/\D/g, '');
                      if (phone) window.open(`https://wa.me/${phone}`, '_blank');
                      else toast.error("Mobile number unavailable");
                   }} 
                   className="flex-1 py-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center gap-2 hover:bg-white hover:shadow-sm transition-all group"
                >
                   <svg className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-emerald-600 transition-colors">WhatsApp Msg</span>
                </button>
                <button 
                   onClick={() => {
                      if (user.email) {
                         const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${user.email}`;
                         window.open(gmailUrl, '_blank');
                         navigator.clipboard.writeText(user.email);
                         toast.success("Drafting in Gmail (Email Copied)");
                      } else {
                         toast.error("Email unknown");
                      }
                   }}
                   className="flex-1 py-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center gap-2 hover:bg-white hover:shadow-sm transition-all group"
                >
                   <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z" /></svg>
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-600 transition-colors">Mail User</span>
                </button>
             </div>
          )}

          {/* Security Pulse Grid */}
          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-slate-50 border border-slate-100 rounded-[28px] shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-5">
                   <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Platform Health</p>
                <div className="flex items-center gap-3">
                   <div className="h-2 flex-1 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${securityScore}%` }} className={`h-full ${securityScore > 80 ? 'bg-emerald-500' : securityScore > 50 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                   </div>
                   <span className="text-[11px] font-black text-slate-900">{securityScore}%</span>
                </div>
             </div>
             <div className="grid grid-cols-1 gap-2">
                <div className={`px-4 h-10 rounded-2xl text-[8px] font-black uppercase tracking-widest border flex items-center gap-2 ${exData?.isVerified.email ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                   <div className={`h-1.5 w-1.5 rounded-full ${exData?.isVerified.email ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                   Email {exData?.isVerified.email ? 'Verified' : 'Pending'}
                </div>
                <div className={`px-4 h-10 rounded-2xl text-[8px] font-black uppercase tracking-widest border flex items-center gap-2 ${exData?.isVerified.mobile ? 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                   <div className={`h-1.5 w-1.5 rounded-full ${exData?.isVerified.mobile ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-slate-300'}`} />
                   Mobile Linked
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
             <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl shadow-sm">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">System ID</p>
                <p className="text-xs font-black text-slate-900 tracking-tight font-mono">{user.aspireMintId || user._id.substring(0, 12)}</p>
             </div>
             <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl shadow-sm">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Mobile Number</p>
                <p className="text-xs font-black text-slate-900 tracking-tight font-mono">{isSubAdmin ? (user.mobile ? `+91 ${user.mobile.slice(0, 3)}*****${user.mobile.slice(-2)}` : 'Not Linked') : (user.mobile || 'Not Linked')}</p>
             </div>
             <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl shadow-sm col-span-2 md:col-span-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Date Joined</p>
                <p className="text-xs font-black text-slate-900 tracking-tight font-mono">{new Date(user.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}</p>
             </div>
          </div>

          {/* Activity Metrics Dashboard */}
          {!isLoading && exData && (exData.role === 'USER' || exData.role === 'MEDIATOR') && (
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Activity Pulse</h3>
                  <div className="h-px flex-1 bg-slate-100 ml-4" />
               </div>
               <div className="grid grid-cols-3 gap-3">
                  {exData.role === 'USER' && (
                     <>
                        {[
                           { val: exData.metrics.activeOrders, lab: 'Active', col: 'text-blue-600', bg: 'bg-blue-50/50', bdr: 'border-blue-100' },
                           { val: exData.metrics.completedOrders, lab: 'Done', col: 'text-emerald-600', bg: 'bg-emerald-50/50', bdr: 'border-emerald-100' },
                           { val: exData.metrics.disputesRaised, lab: 'Disputes', col: 'text-rose-600', bg: 'bg-rose-50/50', bdr: 'border-rose-100' }
                        ].map((m, i) => (
                           <motion.div key={i} whileHover={{ y: -2 }} className={`p-4 ${m.bg} border ${m.bdr} rounded-[24px] text-center shadow-sm`}>
                              <p className={`text-2xl font-black ${m.col} leading-none mb-1`}>{m.val || 0}</p>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{m.lab}</p>
                           </motion.div>
                        ))}
                        
                        <div className="col-span-3 mt-2 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-[24px] flex items-center justify-between shadow-sm">
                           <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              </div>
                              <div>
                                 <p className="text-[9px] font-black text-amber-600/70 uppercase tracking-widest">Legacy External Refunds</p>
                                 <p className="text-[11px] font-bold text-slate-600 mt-0.5 leading-tight">
                                    {exData.previousRefundFetched ? 
                                       (exData.previousRefundAmount > 0 ? `Verified in Array` : `No Legacy Refunds Found`) 
                                       : `Data Not Synced / Unavailable`}
                                 </p>
                              </div>
                           </div>
                           {exData.previousRefundFetched && exData.previousRefundAmount > 0 && (
                              <div className="text-right">
                                 <p className="text-xl font-black text-amber-600">₹{exData.previousRefundAmount.toLocaleString()}</p>
                                 <p className="text-[8px] font-black uppercase text-amber-500 tracking-widest">Total Value</p>
                              </div>
                           )}
                        </div>
                     </>
                  )}
                  {exData.role === 'MEDIATOR' && (
                     <>
                        {[
                           { val: exData.metrics.activeCases, lab: 'Active', col: 'text-indigo-600', bg: 'bg-indigo-50/50', bdr: 'border-indigo-100' },
                           { val: exData.metrics.handledMediations, lab: 'Handled', col: 'text-emerald-600', bg: 'bg-emerald-50/50', bdr: 'border-emerald-100' },
                           { val: exData.metrics.avgResolutionTime, lab: 'Avg Time', col: 'text-amber-600', bg: 'bg-amber-50/50', bdr: 'border-amber-100' }
                        ].map((m, i) => (
                           <motion.div key={i} whileHover={{ y: -2 }} className={`p-4 ${m.bg} border ${m.bdr} rounded-[24px] text-center shadow-sm`}>
                              <p className={`text-xl font-black ${m.col} leading-none mb-1 truncate`}>{m.val || 0}</p>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{m.lab}</p>
                           </motion.div>
                        ))}
                     </>
                  )}
               </div>
            </div>
          )}

          {/* Payment & Banking Credentials */}
          {(() => {
            const paymentData = exData?.paymentDetails || user.paymentDetails || {};
            const hasUpi = Boolean(paymentData.upiId);
            const hasBank = Boolean(
              paymentData.accountNumber ||
              paymentData.bankName ||
              paymentData.accountHolder ||
              paymentData.ifscCode ||
              paymentData.branchName ||
              paymentData.bankDetails
            );
            const hasPaymentData = hasUpi || hasBank;

            return (
              <div className="space-y-4 bg-slate-900/5 p-6 rounded-[36px] border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 blur-2xl rounded-full -mr-16 -mt-16 pointer-events-none" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-1.5 bg-emerald-600 rounded-full" />
                    <div>
                      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 leading-none">Payment & Banking Profile</h3>
                      <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Settlement Destination Profile</p>
                    </div>
                  </div>
                  {hasPaymentData ? (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Linked
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-full text-[8px] font-black uppercase tracking-widest">
                      Unlinked
                    </span>
                  )}
                </div>

                {hasPaymentData ? (
                  <div className="space-y-3 pt-2">
                    {/* UPI ID */}
                    {paymentData.upiId && (
                      <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">UPI Identification (VPA)</span>
                          <span className="text-sm font-black text-indigo-600 font-mono tracking-tight truncate block">
                            {isSubAdmin ? maskUpiId(paymentData.upiId) : paymentData.upiId}
                          </span>
                        </div>
                        {!isSubAdmin && (
                          <button
                            onClick={() => handleCopy(paymentData.upiId, "UPI ID")}
                            className="h-9 w-9 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 flex items-center justify-center border border-slate-100 transition-all active:scale-95 shrink-0"
                            title="Copy UPI ID"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Bank Account Details */}
                    {hasBank && (
                      <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                          <div>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Bank Name</span>
                            <span className="text-xs font-black text-slate-900 uppercase tracking-tight">
                              {paymentData.bankName || "Unspecified Bank"}
                            </span>
                          </div>
                          {paymentData.branchName && (
                            <div className="text-right">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Branch</span>
                              <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">
                                {paymentData.branchName}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100/60">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Account Holder</span>
                            <span className="text-xs font-black text-slate-900 uppercase truncate block">
                              {isSubAdmin ? maskName(paymentData.accountHolder || "") : (paymentData.accountHolder || "N/A")}
                            </span>
                          </div>

                          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100/60 flex items-center justify-between">
                            <div className="min-w-0">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Account Number</span>
                              <span className="text-xs font-black text-slate-900 font-mono tracking-tight truncate block">
                                {isSubAdmin ? maskAccNumber(paymentData.accountNumber || "") : (paymentData.accountNumber || "N/A")}
                              </span>
                            </div>
                            {!isSubAdmin && paymentData.accountNumber && (
                              <button
                                onClick={() => handleCopy(paymentData.accountNumber, "Account Number")}
                                className="h-7 w-7 rounded-lg bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center border border-slate-200/50 transition-all shrink-0 ml-2"
                                title="Copy Account Number"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            )}
                          </div>

                          {paymentData.ifscCode && (
                            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100/60 flex items-center justify-between sm:col-span-2">
                              <div className="min-w-0">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">IFSC Code</span>
                                <span className="text-xs font-black text-slate-900 font-mono uppercase tracking-wider block">
                                  {paymentData.ifscCode}
                                </span>
                              </div>
                              <button
                                onClick={() => handleCopy(paymentData.ifscCode, "IFSC Code")}
                                className="h-7 w-7 rounded-lg bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center border border-slate-200/50 transition-all shrink-0 ml-2"
                                title="Copy IFSC Code"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          )}

                          {paymentData.bankDetails && !paymentData.accountNumber && (
                            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100/60 sm:col-span-2">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Bank Notes / Details</span>
                              <span className="text-xs font-medium text-slate-700 block whitespace-pre-wrap">
                                {paymentData.bankDetails}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 bg-white rounded-2xl border border-slate-100 text-center shadow-sm">
                    <div className="h-10 w-10 mx-auto mb-2 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-tight text-slate-900">No Payment Details Configured</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">User has not registered UPI ID or Bank account credentials yet</p>
                  </div>
                )}
              </div>
            );
          })()}

          <div className="space-y-6 bg-slate-900/5 p-6 rounded-[36px] border border-slate-100 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-2xl rounded-full -mr-16 -mt-16 pointer-events-none" />
             <div className="flex items-center gap-3">
                <div className="h-8 w-1.5 bg-slate-900 rounded-full" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 leading-none">Access Control</h3>
             </div>
             {isSubAdmin ? (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Security Level Clearance</p>
                   <span className="inline-block px-6 py-2 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-full text-xs font-black uppercase tracking-wider">{user.role}</span>
                </div>
             ) : (
                <>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {['USER', 'MEDIATOR', 'ADMIN'].map(r => (
                         <div 
                           key={r}
                           onClick={() => !isTerminated && setRole(r)}
                           className={`border-2 rounded-2xl p-4 text-center transition-all ${isTerminated ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'} ${role === r ? 'border-indigo-600 bg-white shadow-md scale-[1.02]' : 'border-transparent bg-slate-100/50 hover:bg-white hover:border-slate-200'}`}
                         >
                            <div className={`h-4 w-4 rounded-full mx-auto mb-2 border-2 transition-all ${role === r ? 'border-indigo-600 bg-indigo-600 shadow-inner' : 'border-slate-300 bg-white'}`} />
                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${role === r ? 'text-indigo-600' : 'text-slate-400'}`}>{r}</p>
                         </div>
                      ))}
                   </div>
                   
                   <button 
                      onClick={handleUpdateRole}
                      disabled={isUpdating || role === user.role || isTerminated}
                      className="w-full h-14 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-slate-900/10 hover:bg-black active:scale-95 transition-all disabled:opacity-30 disabled:active:scale-100"
                   >
                      Commit Security Update
                   </button>
                </>
             )}
          </div>

          {/* Danger Zone */}
           <div className={`space-y-4 pt-4 border-t border-slate-100 ${isTerminated ? 'opacity-50' : ''}`}>
             <div className="flex justify-between items-center px-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Security Guard</p>
                {isInactiveDanger && !isTerminated && (
                   <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 animate-pulse">
                      Inactive for {exData.daysInactive} days
                   </span>
                )}
             </div>
             <button 
                onClick={() => !isTerminated && setShowConfirmTerminate(true)}
                disabled={isDeleting || isTerminated}
                className={`w-full h-14 border text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all shadow-sm ${
                   isTerminated ? 'bg-slate-50 text-slate-400 border-slate-200' :
                   isInactiveDanger ? 'bg-rose-600 text-white border-rose-700 shadow-xl shadow-rose-600/20 hover:bg-rose-700 animate-pulse' : 
                   'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white'
                }`}
             >
                {isTerminated ? 'Access Permanently Revoked' : 'Revoke Platform Access'}
             </button>
          </div>
        </div>

        <div className="p-8 pt-0 mt-auto shrink-0 bg-white relative z-10 border-t border-slate-50">
           <button 
              onClick={onClose}
              className="w-full h-14 bg-slate-50 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all font-mono shadow-sm border border-slate-200 active:scale-95"
           >
              Exit
           </button>
        </div>

        {/* Custom Confirmation Overlay */}
        <AnimatePresence>
           {showConfirmTerminate && (
              <motion.div 
                 initial={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                 animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                 exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                 className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-xl flex flex-col justify-end p-8"
              >
                 <div className="text-center mb-10">
                    <div className="mx-auto w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mb-6 border border-rose-500/30">
                       <svg className="w-10 h-10 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-3">Revoke Access?</h3>
                    <p className="text-xs font-bold text-slate-400 leading-relaxed max-w-[280px] mx-auto uppercase tracking-widest">Access will be permanently terminated. Financial records and history will be preserved as ghosts.</p>
                 </div>
                 <div className="space-y-2">
                    <button 
                       onClick={executeTermination}
                       disabled={isDeleting}
                       className="w-full h-16 bg-rose-600 text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-[24px] hover:bg-rose-700 shadow-2xl shadow-rose-600/40 active:scale-95 transition-all outline-none"
                    >
                       Confirm Revocation
                    </button>
                    <button 
                       onClick={() => setShowConfirmTerminate(false)}
                       disabled={isDeleting}
                       className="w-full h-16 bg-white/10 text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-[24px] hover:bg-white/20 active:scale-95 transition-all outline-none"
                    >
                       Cancel Action
                    </button>
                 </div>
              </motion.div>
           )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

