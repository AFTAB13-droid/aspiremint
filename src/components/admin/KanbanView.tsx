"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface KanbanViewProps {
  orders: any[];
}

export function KanbanView({ orders }: KanbanViewProps) {
  // Group orders by brandName
  const brandGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    orders.forEach((order) => {
      const brand = order.brandName || "Other";
      if (!groups[brand]) groups[brand] = [];
      groups[brand].push(order);
    });
    return groups;
  }, [orders]);

  const getStatusColor = (status: string) => {
    switch(status) {
       case 'REFUND_FORM_PENDING': return 'bg-orange-500';
       case 'REFUND_FORM_SUBMITTED': return 'bg-blue-500';
       case 'APPROVED': return 'bg-blue-500';
       case 'ACTIVE_ESCROW': return 'bg-purple-500';
       case 'COMPLETED': return 'bg-emerald-500';
       default: return 'bg-slate-400';
    }
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-10 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
      {Object.entries(brandGroups).map(([brand, brandOrders]) => (
        <div key={brand} className="min-w-[300px] max-w-[300px] flex flex-col gap-4">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                 <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                 {brand}
                 <span className="text-[10px] text-slate-400 font-bold ml-1">({brandOrders.length})</span>
              </h3>
           </div>
           
           <div className="flex flex-col gap-3">
              {brandOrders.map((order) => (
                <Link key={order._id} href={`/app/orders/${order._id}`}>
                   <motion.div 
                     whileHover={{ y: -2 }}
                     className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
                   >
                      <div className="flex items-center justify-between mb-4">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100">
                            {order.aspireOrderId}
                         </span>
                         <div className={`h-2 w-2 rounded-full ${getStatusColor(order.status)}`} />
                      </div>
                      
                      <p className="text-[11px] font-bold text-slate-600 line-clamp-1 uppercase tracking-tight mb-3">
                         {order.productCode || "Generic Listing"}
                      </p>
                      
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                         <p className="text-sm font-black text-slate-900">₹{order.amount.toLocaleString()}</p>
                         <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{order.userOrderId || "N/A"}</p>
                      </div>

                      <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                            {order.status === 'REFUND_FORM_PENDING' ? 'Action Required' : 'Monitored'}
                         </span>
                      </div>
                   </motion.div>
                </Link>
              ))}
           </div>
        </div>
      ))}
    </div>
  );
}
