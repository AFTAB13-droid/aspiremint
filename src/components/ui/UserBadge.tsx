import React from 'react';

export type BadgeTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Premium';

interface UserBadgeProps {
  ordersCount: number;
  className?: string;
  showIcon?: boolean;
  showProgression?: boolean;
  showInfoIcon?: boolean;
  align?: 'left' | 'right' | 'center';
}

export const getBadgeDetails = (ordersCount: number): { tier: BadgeTier; label: string; colors: string; textClass: string; icon: string; nextTierAt: number | null; nextTierLabel: string | null } => {
  if (ordersCount >= 150) return { tier: 'Premium', label: 'Premium', colors: 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200', textClass: 'text-emerald-700 font-black', icon: '💎', nextTierAt: null, nextTierLabel: null };
  if (ordersCount >= 100) return { tier: 'Platinum', label: 'Platinum', colors: 'bg-gradient-to-r from-slate-100 to-blue-50 border-blue-200', textClass: 'text-blue-700 font-black', icon: '✨', nextTierAt: 150, nextTierLabel: 'Premium' };
  if (ordersCount >= 70) return { tier: 'Gold', label: 'Gold', colors: 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300', textClass: 'text-yellow-700 font-black', icon: '🏆', nextTierAt: 100, nextTierLabel: 'Platinum' };
  if (ordersCount >= 40) return { tier: 'Silver', label: 'Silver', colors: 'bg-gradient-to-r from-gray-50 to-slate-100 border-gray-300', textClass: 'text-slate-700 font-black', icon: '🥈', nextTierAt: 70, nextTierLabel: 'Gold' };
  if (ordersCount >= 20) return { tier: 'Bronze', label: 'Bronze', colors: 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200', textClass: 'text-orange-800 font-black', icon: '🥉', nextTierAt: 40, nextTierLabel: 'Silver' };
  return { tier: 'Bronze', label: 'None', colors: '', textClass: '', icon: '', nextTierAt: 20, nextTierLabel: 'Bronze' };
};

import Link from 'next/link';

export const UserBadge: React.FC<UserBadgeProps> = ({ 
  ordersCount, 
  className = "", 
  showIcon = true, 
  showProgression = false,
  showInfoIcon = true,
  align = 'left'
}) => {
  const { label, colors, textClass, icon, nextTierAt, nextTierLabel } = getBadgeDetails(ordersCount);
  
  const diff = nextTierAt ? nextTierAt - ordersCount : null;
  const isNear = diff !== null && diff <= 5;

  return (
    <div className={`flex flex-col ${align === 'right' ? 'items-end text-right' : align === 'center' ? 'items-center text-center' : 'items-start text-left'} gap-1 ${className}`}>
      <div className="flex items-center gap-1.5">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border shadow-sm ${colors || 'bg-slate-50 border-slate-200'}`}>
          {(showIcon && icon) && <span className="text-[12px] leading-none">{icon}</span>}
          <span className={`text-[10px] uppercase tracking-widest ${textClass || 'text-slate-500 font-bold'}`}>
            {label}
          </span>
        </div>

        {/* Info Icon near Badge - Hide if disabled */}
        {showInfoIcon && (
          <Link href="/dashboard/samples">
            <button className="h-4 w-4 rounded-full bg-slate-100/80 text-slate-400 flex items-center justify-center text-[8px] font-black hover:bg-white hover:text-indigo-600 transition-all border border-slate-200/50 shadow-inner">
              i
            </button>
          </Link>
        )}
      </div>

      {/* Progression Alert - Refined for "Perfection" design */}
      {(showProgression && isNear) && (
        <p className="text-[7.5px] font-black text-orange-600/80 uppercase tracking-[0.12em] mt-0.5 flex items-center gap-0.5 opacity-90">
          Next: {nextTierLabel} ({diff} {diff === 1 ? 'Order' : 'Orders'} left)
        </p>
      )}
    </div>
  );
};
