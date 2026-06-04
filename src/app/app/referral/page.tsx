import React from 'react';

export default function ReferralPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Refer and Earn</h1>
      <p className="mt-4 text-slate-500">Share AspireMint with your friends and earn rewards for every successful deal they complete.</p>
      
      <div className="mt-12 p-8 rounded-[32px] border border-slate-100 bg-slate-50/50 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800">Referral Program Coming Soon</h2>
        <p className="mt-2 text-slate-400 max-w-md italic">We are currently refining our rewards engine. Check back soon for your unique referral link!</p>
      </div>
    </div>
  );
}
