"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/Skeleton";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { UserDossierModal } from "@/components/admin/UserDossierModal";
import { UserHistoryModal } from "@/components/admin/UserHistoryModal";
import { StaffCreationModal } from "@/components/admin/StaffCreationModal";
import { BroadcastModal } from "@/components/admin/BroadcastModal";
import { ShieldCheck, Megaphone } from "lucide-react";
import { getUserAvatar } from "@/data/avatars";

export default function AdminUserDirectory() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "USER";
  const isSubAdmin = userRole === "SUBADMIN";

  const maskEmail = (email: string) => {
    if (!email) return "N/A";
    const [local, domain] = email.split("@");
    if (!domain) return "****";
    return `${local.slice(0, 3)}***@${domain}`;
  };

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Server-side State
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [sortBy, setSortBy] = useState("Newest First");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ totalUsers: 0, totalMediators: 0, newThisMonth: 0 });

  const [isMobile, setIsMobile] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [historyUser, setHistoryUser] = useState<any>(null);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile && itemsPerPage === 3) setItemsPerPage(8);
  }, [isMobile]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
          role: roleFilter === "All Roles" ? "ALL" : roleFilter,
          search: search,
          sortBy: sortBy === "Newest First" ? "newest" : "oldest"
        });
        const res = await fetch(`/api/users?${params.toString()}`);
        const json = await res.json();
        if (json.success) {
          setUsers(json.data);
          setTotalPages(json.pagination.totalPages);
          setTotalCount(json.pagination.totalCount);
          setStats(json.stats);
        }
      } catch (err) {
        toast.error("Failed to load user directory");
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, itemsPerPage, roleFilter, search]);

  const handleUpdateUser = (updatedUser: any) => {
     setUsers(prev => prev.map(u => u._id === updatedUser._id ? updatedUser : u));
     if (selectedUser?._id === updatedUser._id) {
        setSelectedUser(updatedUser);
     }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex flex-col gap-10 pb-20 px-4 md:px-0">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 rounded-[32px]" />
            <Skeleton className="h-32 rounded-[32px]" />
            <Skeleton className="h-32 rounded-[32px]" />
         </div>
         <div className="overflow-hidden rounded-[40px] border border-slate-100 bg-white">
            {[1,2,3,4,5,6].map(i => (
               <div key={i} className="flex items-center justify-between p-8 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-4">
                     <Skeleton className="h-12 w-12 rounded-2xl" />
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                     </div>
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-32 rounded-xl" />
               </div>
            ))}
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 md:gap-10 pb-20 px-4 md:px-0 pt-6">
      {/* Analytics Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
         {[
            { label: "Total Platform Users", value: stats.totalUsers, suffix: "Users", icon: <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /> },
            { label: "Mediation Experts", value: stats.totalMediators, suffix: "Staff", icon: <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /> },
            { label: "Network Growth", value: stats.newThisMonth, suffix: "This Month", icon: <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /> }
         ].map((stat, idx) => (
            <motion.div 
               key={idx}
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: idx * 0.1 }}
               className="bg-gradient-to-br from-sky-400 to-indigo-600 p-6 md:p-8 rounded-[32px] shadow-xl shadow-indigo-200/50 relative overflow-hidden group border border-white/20"
            >
               <div className="absolute top-0 right-0 p-8 opacity-20 text-white group-hover:scale-110 group-hover:opacity-30 transition-all duration-700">
                  <svg className="w-24 h-24 -mt-10 -mr-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>{stat.icon}</svg>
               </div>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-2 relative z-10">{stat.label}</p>
               <div className="flex items-baseline gap-2 relative z-10">
                  <h3 className="text-4xl font-black text-white tracking-tighter leading-none">{stat.value}</h3>
                  <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">{stat.suffix}</span>
               </div>
            </motion.div>
          ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-[32px] p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex flex-col md:flex-row gap-4 items-center w-full">
           <div className="relative w-full md:flex-1 max-w-md">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                 type="text" 
                 placeholder="Search by name or email..." 
                 value={search}
                 onChange={(e) => {setSearch(e.target.value); setCurrentPage(1);}}
                 className="w-full pl-12 pr-6 h-12 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:bg-white focus:ring-indigo-100 transition-all font-bold text-sm text-slate-900 placeholder:text-slate-400"
              />
           </div>
           <div className="w-full md:w-auto grid grid-cols-2 md:flex gap-4">
              <div className="w-full md:w-40">
                 <CustomDropdown options={["All Roles", "USER", "MEDIATOR", "SUBADMIN"]} value={roleFilter} onChange={(v) => {setRoleFilter(v); setCurrentPage(1);}} placeholder="Role Filter" />
              </div>
              <div className="w-full md:w-48">
                 <CustomDropdown options={["Newest First", "Oldest First"]} value={sortBy} onChange={(v) => {setSortBy(v); setCurrentPage(1);}} placeholder="Sort Order" />
              </div>
           </div>
         </div>
         {!isSubAdmin && (
            <div className="flex gap-2 w-full md:w-auto">
              <button 
                onClick={() => setIsBroadcastModalOpen(true)}
                className="flex-1 md:flex-none px-6 h-12 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-sky-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Megaphone className="w-4 h-4" />
                Broadcast
              </button>
              <button 
                onClick={() => setIsStaffModalOpen(true)}
                className="flex-1 md:flex-none px-6 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Staff Creation
              </button>
            </div>
          )}
      </div>

      {/* Users List (Table Style for Desktop) */}
      <div className="hidden md:block rounded-[40px] border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#0E1526] shadow-xl shadow-slate-200/40 relative overflow-hidden">
         <div className="max-h-[580px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
               <thead className="sticky top-0 z-20">
                  <tr className="bg-slate-50 dark:bg-[#0B101D] border-b border-slate-100 dark:border-slate-800/80 shadow-sm">
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 w-24 text-center">Indx</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">User Identity</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Role</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Joined</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                  </tr>
               </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
               {users.map((user, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={user._id} 
                    className="group hover:bg-slate-50/50 dark:hover:bg-[#172138] transition-colors"
                  >
                     <td className="px-8 py-6 text-[11px] font-black text-center text-slate-400">
                        {idx + 1 + (currentPage - 1) * itemsPerPage}
                     </td>
                     <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                           <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-lg font-black text-white uppercase shadow-md overflow-hidden shrink-0 border border-slate-100 ${user.role === 'ADMIN' ? 'bg-indigo-600' : user.role === 'SUBADMIN' ? 'bg-sky-500' : user.role === 'MEDIATOR' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                              <img 
                                src={getUserAvatar(user.avatar || user.profileImage, user.name)} 
                                alt={user.name} 
                                className="w-full h-full object-cover" 
                              />
                           </div>
                           <div>
                              <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{user.name}</p>
                              <p className="text-xs font-bold text-slate-400 mt-0.5">{isSubAdmin ? maskEmail(user.email) : user.email}</p>
                           </div>
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                           user.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                           user.role === 'SUBADMIN' ? 'bg-sky-50 text-sky-600 border-sky-200' :
                           user.role === 'MEDIATOR' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-blue-50 text-blue-600 border-blue-200'
                        }`}>
                           {user.role}
                        </span>
                     </td>
                     <td className="px-8 py-6">
                        <p className="text-xs font-bold text-slate-900 uppercase tracking-tighter">{new Date(user.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                     </td>
                     <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button 
                              onClick={() => setHistoryUser(user)}
                              className="h-10 w-10 rounded-xl border border-indigo-100 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
                              title="Order History"
                           >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                           </button>
                           <button 
                              onClick={() => setSelectedUser(user)}
                              className="px-6 py-2.5 rounded-xl bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all inline-flex items-center justify-center gap-2"
                           >
                              Details
                           </button>
                        </div>
                     </td>
                  </motion.tr>
               ))}
            </tbody>
         </table>
       </div>
    </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
         {users.map((user, idx) => (
            <motion.div 
               key={user._id}
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               whileTap={{ scale: 0.98 }}
               transition={{ delay: idx * 0.05 }}
               onClick={() => setSelectedUser(user)}
               className="bg-white/80 backdrop-blur-xl rounded-[32px] border border-slate-100 p-6 shadow-xl shadow-slate-200/30 relative overflow-hidden group active:bg-slate-50 transition-colors cursor-pointer"
            >
               <div className={`absolute top-0 right-0 w-24 h-24 opacity-10 blur-2xl rounded-full -mr-10 -mt-10 ${user.role === 'ADMIN' ? 'bg-indigo-600' : user.role === 'MEDIATOR' ? 'bg-purple-600' : 'bg-blue-600'}`} />
               
               <div className="flex items-start justify-between mb-6 relative z-10">
                  <div className="flex items-center gap-4">
                     <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-lg font-black text-white uppercase shadow-md shrink-0 overflow-hidden border border-slate-100 ${user.role === 'ADMIN' ? 'bg-indigo-600' : user.role === 'MEDIATOR' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                        <img 
                          src={getUserAvatar(user.avatar || user.profileImage, user.name)} 
                          alt={user.name} 
                          className="w-full h-full object-cover" 
                        />
                     </div>
                     <div className="overflow-hidden">
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight truncate leading-tight">{user.name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 truncate">{isSubAdmin ? maskEmail(user.email) : user.email}</p>
                     </div>
                  </div>
               </div>

               <div className="flex flex-col text-right">
                  <div className="flex items-center justify-end mb-4">
                     <button 
                        onClick={(e) => { e.stopPropagation(); setHistoryUser(user); }}
                        className="h-9 w-9 rounded-xl border border-indigo-100 flex items-center justify-center text-indigo-600 bg-white"
                     >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                     </button>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50 relative z-10 gap-4">
                     <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border shrink-0 ${
                        user.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                        user.role === 'MEDIATOR' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-blue-50 text-blue-600 border-blue-200'
                     }`}>
                        {user.role}
                     </span>
                     
                     <div className="flex flex-col text-right">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Joined</span>
                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight leading-none">{new Date(user.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                     </div>
                  </div>
               </div>
            </motion.div>
         ))}
      </div>

      {users.length === 0 && (
         <div className="py-24 text-center">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <p className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">No registry matches found</p>
         </div>
      )}

      {/* Pagination */}
      {users.length > 0 && (
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-4 md:mt-8 pb-10">
          <div className="flex items-center gap-4 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm order-2 md:order-1 h-[42px] overflow-visible z-20">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Show Limit</span>
             <div className="w-[110px] scale-[0.85] origin-left">
                <CustomDropdown
                   options={['8 rows', '15 rows', '25 rows', '50 rows', '100 rows']}
                   value={`${itemsPerPage} rows`}
                   onChange={(val) => {
                      setItemsPerPage(parseInt(val));
                      setCurrentPage(1);
                   }}
                />
             </div>
          </div>

          <div className="flex items-center gap-4 order-1 md:order-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 disabled:opacity-30"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50/50 rounded-2xl border border-slate-100 overflow-x-auto max-w-[200px] md:max-w-none custom-scrollbar pb-1 md:pb-0">
               {(() => {
                  const rangeSize = 3;
                  let start = Math.max(1, currentPage - 1);
                  let end = Math.min(totalPages, start + rangeSize - 1);
                  if (end - start + 1 < rangeSize) {
                     start = Math.max(1, end - rangeSize + 1);
                  }
                  return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
               })().map(p => (
                 <button 
                  key={p} 
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 shrink-0 rounded-lg text-[10px] font-black transition-all ${currentPage === p ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-white'}`}
                 >
                   {p}
                 </button>
               ))}
            </div>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 disabled:opacity-30"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Dossier Modal */}
      <AnimatePresence>
        {selectedUser && (
          <UserDossierModal 
             user={selectedUser} 
             onClose={() => setSelectedUser(null)} 
             onUpdate={handleUpdateUser}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {historyUser && (
          <UserHistoryModal 
             user={historyUser} 
             onClose={() => setHistoryUser(null)} 
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isStaffModalOpen && (
          <StaffCreationModal 
             onClose={() => setIsStaffModalOpen(false)} 
             onSuccess={() => fetchUsers()} 
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isBroadcastModalOpen && (
           <BroadcastModal onClose={() => setIsBroadcastModalOpen(false)} />
        )}
      </AnimatePresence>
    </div>
   );
}
