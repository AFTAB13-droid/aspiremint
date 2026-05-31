import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CustomDropdown } from "@/components/ui/CustomDropdown";

interface BrandOrderStatsProps {
  orders: any[];
  allBrands: any[];
}

export function BrandOrderStats({ orders, allBrands }: BrandOrderStatsProps) {
  const [brandFilter, setBrandFilter] = useState("All Brands");
  const [statusFilter, setStatusFilter] = useState("All Stages");
  const [dateFilter, setDateFilter] = useState("");

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderBrand = order.brandName || "Other";
      const matchBrand = brandFilter === "All Brands" || orderBrand === brandFilter;
      
      let matchDate = true;
      if (dateFilter) {
        const orderDate = new Date(order.createdAt).toDateString();
        const selectedDate = new Date(dateFilter).toDateString();
        matchDate = orderDate === selectedDate;
      }

      let matchStatus = true;
      if (statusFilter === "Refund Pending") {
        matchStatus = order.status === "REFUND_FORM_PENDING";
      } else if (statusFilter === "Under Verification") {
        matchStatus = ["REFUND_FORM_SUBMITTED", "PENDING_APPROVAL"].includes(order.status);
      } else if (statusFilter === "Approved") {
        matchStatus = order.status === "APPROVED";
      }

      return matchBrand && matchDate && matchStatus;
    });
  }, [orders, brandFilter, dateFilter, statusFilter]);

  const brandStats = useMemo(() => {
    const stats: Record<string, { 
      total: number; 
      completed: number; 
      ongoing: number; 
      rfPending: number;
      verification: number;
      approved: number;
    }> = {};

    // Initialize with all brands from the registry to ensure they appear in the table
    allBrands.forEach(b => {
      stats[b.name] = { total: 0, completed: 0, ongoing: 0, rfPending: 0, verification: 0, approved: 0 };
    });

    // Special case for orders that might have a brand not in the registry or "Other"
    // Special case for orders that might have a brand not in the registry or "Other"
    filteredOrders.forEach((order) => {
      const brand = order.brandName || "Other";
      if (!stats[brand]) {
        stats[brand] = { total: 0, completed: 0, ongoing: 0, rfPending: 0, verification: 0, approved: 0 };
      }
      
      stats[brand].total++;
      
      const isCompleted = ["COMPLETED", "REFUNDED", "PAST"].includes(order.status);
      const isCancelled = ["REJECTED", "CANCELLED", "REFUND_REJECTED"].includes(order.status);
      
      if (isCompleted) {
        stats[brand].completed++;
      } else if (!isCancelled) {
        stats[brand].ongoing++;
      }

      if (order.status === "REFUND_FORM_PENDING") stats[brand].rfPending++;
      if (["REFUND_FORM_SUBMITTED", "PENDING_APPROVAL"].includes(order.status)) stats[brand].verification++;
      if (order.status === "APPROVED") stats[brand].approved++;
    });

    // Merge Registry Stock Info
    const mergedStats = Object.entries(stats).map(([name, data]) => {
      const registryBrand = allBrands.find(b => b.name === name);
      const totalStock = registryBrand?.productCodes ? 
        registryBrand.productCodes.reduce((sum: number, pc: any) => sum + (pc.stock || 0), 0) : 0;
      
      return {
        brand: name,
        ...data,
        totalStock
      };
    });
    
    // Filter by brandFilter if specific brand selected
    let entries = mergedStats;
    if (brandFilter !== "All Brands") {
       entries = entries.filter(e => e.brand === brandFilter);
    }

    return entries.sort((a, b) => b.total - a.total);
  }, [filteredOrders, allBrands, brandFilter]);

  const brandsList = useMemo(() => {
    const uniqueBrands = new Set<string>();
    allBrands.forEach(b => uniqueBrands.add(b.name));
    orders.forEach(o => { if (!o.brandName) uniqueBrands.add("Other"); });
    return ["All Brands", ...Array.from(uniqueBrands).sort()];
  }, [orders, allBrands]);

  const statusOptions = ["All Stages", "Refund Pending", "Under Verification", "Approved"];

  return (
    <div className="space-y-6">
      {/* Searchable Filters Bar */}
      <div className="flex flex-wrap items-center gap-6 bg-white/50 backdrop-blur-md p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="flex flex-col gap-1.5 min-w-[240px]">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Find Brand</span>
          <CustomDropdown 
            options={brandsList} 
            value={brandFilter} 
            onChange={setBrandFilter}
            placeholder="Search Brand Name..."
            searchable={true}
          />
        </div>

        <div className="flex flex-col gap-1.5 min-w-[200px]">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Order Status</span>
          <CustomDropdown 
            options={statusOptions} 
            value={statusFilter} 
            onChange={setStatusFilter}
            placeholder="Select Status"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Select Date</span>
          <div className="relative group">
            <input 
              type="date" 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-12 bg-white border border-slate-100 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest outline-none hover:border-indigo-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
            />
            {dateFilter && (
              <button 
                onClick={() => setDateFilter("")}
                className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 transition-colors"
                title="Clear Date"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        </div>
        
        {/* Reset Button */}
        <button 
          onClick={() => {
            setBrandFilter("All Brands");
            setStatusFilter("All Stages");
            setDateFilter("");
          }}
          className="h-12 px-6 rounded-xl border border-slate-100 bg-white shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 hover:border-red-100 transition-all ml-auto"
        >
          Reset Filters
        </button>
      </div>

      {/* Analytics Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-[40px] border border-slate-100 bg-white shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] border-b border-slate-100">Brand Name</th>
                <th className="px-8 py-5 text-[10px] font-black text-emerald-600/50 uppercase tracking-[0.25em] border-b border-slate-100 text-center">Completed</th>
                <th className="px-8 py-5 text-[10px] font-black text-orange-500/50 uppercase tracking-[0.25em] border-b border-slate-100 text-center">Ongoing</th>
                <th className="px-8 py-5 text-[10px] font-black text-indigo-600/50 uppercase tracking-[0.25em] border-b border-slate-100 text-center">Live Stock</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] border-b border-slate-100 text-right">Status Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {brandStats.map((data, idx) => {
                const brand = data.brand;
                const successRate = data.total > 0 ? (data.completed / data.total) * 100 : 0;
                
                const isOut = data.totalStock === 0;
                const isLow = data.totalStock > 0 && data.totalStock < 10;

                return (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    key={brand} 
                    className="group hover:bg-slate-50/80 transition-all duration-300"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white font-black text-sm uppercase shadow-lg shadow-slate-200 group-hover:bg-indigo-600 group-hover:shadow-indigo-200 transition-all duration-300">
                          {brand.charAt(0)}
                        </div>
                        <div>
                           <p className="text-[14px] font-black text-slate-900 tracking-tight uppercase group-hover:text-indigo-600 transition-colors">{brand}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{data.total} Total Trans.</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="inline-flex px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-[11px] font-black uppercase tracking-tight border border-emerald-100">
                          {data.completed}
                        </span>
                        <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${successRate}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="inline-flex px-3 py-1.5 rounded-xl bg-orange-50 text-orange-700 text-[11px] font-black uppercase tracking-tight border border-orange-100">
                        {data.ongoing}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <span className={`inline-flex px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-tight border shadow-sm ${
                         isOut ? "bg-red-50 text-red-600 border-red-100" :
                         isLow ? "bg-orange-50 text-orange-600 border-orange-100" :
                         "bg-indigo-50 text-indigo-700 border-indigo-100"
                       }`}>
                          {data.totalStock} units
                       </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-2 max-w-[140px] ml-auto">
                        <div className="flex items-center justify-between gap-8 group/line">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover/line:text-orange-500 transition-colors text-right">Pending</span>
                          <span className="text-[11px] font-black text-slate-900">{data.rfPending}</span>
                        </div>
                        <div className="flex items-center justify-between gap-8 group/line">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover/line:text-blue-500 transition-colors text-right">Verifying</span>
                          <span className="text-[11px] font-black text-slate-900">{data.verification}</span>
                        </div>
                        <div className="flex items-center justify-between gap-8 border-t border-slate-100 pt-1.5 mt-0.5 group/line">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover/line:text-emerald-500 transition-colors text-right">Safe</span>
                          <span className="text-[11px] font-black text-slate-900">{data.approved}</span>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {brandStats.length === 0 && (
          <div className="py-24 text-center space-y-4">
             <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
             <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">No statistical matches discovered</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
