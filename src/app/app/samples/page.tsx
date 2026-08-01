"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface HelpSection {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  content: React.ReactNode;
}

const MarketplaceImageSelector = ({ type, setPreviewImage }: { type: 'ORDER' | 'RETURN', setPreviewImage: any }) => {
  const [marketplace, setMarketplace] = React.useState<string>("Amazon");
  const marketplaces = ['Amazon', 'Flipkart', 'Meesho', 'Blinkit', 'Zepto', 'Myntra'].filter(
    mp => !(type === 'RETURN' && mp === 'Blinkit')
  );
  
  const getImageUrl = (mp: string) => {
    const map: Record<string, string> = {
      'amazon_order': '.png',
      'amazon_return': '.png',
      'flipkart_order': '.png',
      'flipkart_return': '.png',
      'meesho_order': '.jpg',
      'meesho_return': '.jpg',
      'blinkit_order': '.jpg',
      'myntra_order': '.jpg',
      'myntra_return': '.jpg'
    };
    const key = `${mp.toLowerCase()}_${type.toLowerCase()}`;
    const ext = map[key] || '.png';
    return `/samples/${key}_ss${ext}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex overflow-x-auto gap-2 pb-3 -mx-2 px-2 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style dangerouslySetInnerHTML={{ __html: `::-webkit-scrollbar { display: none; }` }} />
        {marketplaces.map(mp => (
          <button 
            key={mp} 
            onClick={() => setMarketplace(mp)}
            className={`flex-shrink-0 px-5 py-2.5 rounded-full text-[10px] md:rounded-xl md:text-[11px] font-black uppercase tracking-widest transition-all ${marketplace === mp ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 md:scale-105' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            {mp}
          </button>
        ))}
      </div>
      
      {marketplace && (
        <div className="space-y-3">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{marketplace} {type === 'ORDER' ? 'Order' : 'Return Period'} Snapshot</p>
           <div 
             onClick={() => setPreviewImage(getImageUrl(marketplace))}
             className="relative w-full rounded-3xl md:rounded-[32px] overflow-hidden shadow-xl shadow-slate-200/50 group cursor-zoom-in h-[350px] md:h-[400px] bg-slate-900 border border-slate-800 flex items-start justify-center p-2 transform-gpu transition-all duration-500 md:hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(79,70,229,0.3)] active:scale-[0.98]"
           >
              <div className="w-full h-full overflow-hidden rounded-[24px] relative bg-slate-800">
                <img 
                  src={getImageUrl(marketplace)} 
                  alt={`${marketplace} Sample`} 
                  className="w-full h-auto min-h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-700"
                  onError={(e: any) => e.target.src = `https://placehold.co/800x450/f8fafc/cbd5e1?text=${marketplace}+Sample+Coming+Soon`}
                />
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent pointer-events-none" />
              </div>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-2.5 bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-[0_10px_30px_rgba(79,70,229,0.5)] group-hover:scale-110 transition-transform">
                🚀 Scroll Full Image
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default function HelpPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const sections: HelpSection[] = [
    {
      id: "order-guide",
      title: "Order Form",
      desc: "How to register your purchase correctly.",
      color: "bg-blue-600",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      content: (
        <div className="space-y-8">
           <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100">
              <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest mb-4">Registering Your Purchase</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 {[
                   { field: "Brand Name", desc: "Choose the manufacturer of your product from the list." },
                   { field: "Order ID", desc: "The unique ID from Amazon/Flipkart (e.g. #402-9921-123)." },
                   { field: "Amount", desc: "The exact final price you paid after all discounts." },
                   { field: "Product Code", desc: "The short code provided by the brand for tracking." }
                 ].map((f) => (
                   <div key={f.field} className="space-y-1">
                      <p className="text-[10px] font-black text-slate-900 uppercase">{f.field}</p>
                      <p className="text-[9px] text-slate-500 font-medium leading-tight">{f.desc}</p>
                   </div>
                 ))}
              </div>
           </div>

           <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Example: Direct Order Snapshot</p>
              <div 
                onClick={() => setPreviewImage("/samples/order_form.png")}
                className="relative rounded-[32px] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/50 group cursor-zoom-in"
              >
                 <div className="aspect-video bg-slate-50 flex items-center justify-center p-0 flex-col">
                    <img 
                      src="/samples/order_form.png" 
                      alt="Order Sample" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e: any) => e.target.src = "https://placehold.co/800x450/f8fafc/cbd5e1?text=Order+Sample+Coming+Soon"}
                    />
                 </div>
                 <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors" />
                 <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg">
                    ✅ Click to view full image
                 </div>
              </div>
           </div>
        </div>
      )
    },
    {
      id: "refund-guide",
      title: "Refund Form",
      desc: "Proof snapshots and return windows.",
      color: "bg-indigo-600",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      content: (
        <div className="space-y-8">
           <div className="p-6 rounded-3xl bg-indigo-50 border border-indigo-100">
              <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-4">Mastering Proofs</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 {[
                   { field: "Live Review URL", desc: "The direct link to your live review on the marketplace." },
                   { field: "Review Screenshot", desc: "Snapshot showing your profile name, rating, and review text." },
                   { field: "Return Window", desc: "Proof that the return/refund period has officially closed." },
                   { field: "UPI ID", desc: "Your correct destination ID (vpa) for the refund disbursement." }
                 ].map((f) => (
                   <div key={f.field} className="space-y-1">
                      <p className="text-[10px] font-black text-slate-900 uppercase">{f.field}</p>
                      <p className="text-[9px] text-slate-500 font-medium leading-tight">{f.desc}</p>
                   </div>
                 ))}
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">✅ Rating & Review</p>
                 <div 
                   onClick={() => setPreviewImage("/samples/rating_review_screenshot.png")}
                   className="aspect-square bg-slate-50 border border-slate-100 rounded-[32px] overflow-hidden flex flex-col items-center justify-center text-center shadow-lg shadow-slate-200/50 group cursor-zoom-in relative"
                 >
                    <img 
                      src="/samples/rating_review_screenshot.png" 
                      alt="Review Sample" 
                      className="w-full h-full object-cover md:object-contain group-hover:scale-110 transition-all duration-700"
                      onError={(e: any) => e.target.src = "https://placehold.co/600x600/f8fafc/cbd5e1?text=Review+Snapshot"}
                    />
                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
                       <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-2xl text-[10px] font-black uppercase text-slate-900 shadow-2xl scale-50 group-hover:scale-100 transition-transform">View Full</div>
                    </div>
                 </div>
              </div>
              <div className="space-y-3">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">✅ Return Period Over</p>
                 <div 
                   onClick={() => setPreviewImage("/samples/return_period.png")}
                   className="aspect-square bg-slate-50 border border-slate-100 rounded-[32px] overflow-hidden flex flex-col items-center justify-center text-center shadow-lg shadow-slate-200/50 group cursor-zoom-in relative"
                 >
                    <img 
                      src="/samples/return_period.png" 
                      alt="Return Sample" 
                      className="w-full h-full object-cover md:object-contain group-hover:scale-110 transition-all duration-700"
                      onError={(e: any) => e.target.src = "https://placehold.co/600x600/f8fafc/cbd5e1?text=Return+Window"}
                    />
                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
                       <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-2xl text-[10px] font-black uppercase text-slate-900 shadow-2xl scale-50 group-hover:scale-100 transition-transform">View Full</div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )
    },
    {
      id: "amazon-guidelines",
      title: "Amazon Guidelines",
      desc: "Account safety & review best practices.",
      color: "bg-amber-500",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      content: (
        <div className="space-y-8">
           {/* Hero Card */}
           <div className="relative overflow-hidden p-6 md:p-8 rounded-[32px] bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white shadow-xl shadow-orange-500/20">
              <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 space-y-3">
                 <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/20 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-amber-100 border border-white/15">
                    ⭐ TeamToufik Official Guidelines ⭐
                 </div>
                 <h3 className="text-xl md:text-3xl font-black uppercase tracking-tight leading-tight">
                    Amazon Buyer Guidelines: Account Safety & Best Practices
                 </h3>
                 <p className="text-xs md:text-sm text-amber-100 font-medium leading-relaxed max-w-2xl">
                    The following guidelines are designed to protect your Amazon account and ensure that your product reviews and ratings remain visible. Adhere to these best practices to maintain a healthy account status.
                 </p>
              </div>
           </div>

           {/* Section 1: Account Safety & Shopping Habits */}
           <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                 <span className="text-lg">🛡️</span>
                 <h4 className="text-sm font-black uppercase tracking-wider text-slate-900">Account & Shopping Profile</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {[
                   { title: "Account Verification", badge: "Mandatory", badgeColor: "bg-rose-100 text-rose-700", desc: "Ensure your Amazon account is fully verified. This includes adding a valid email address and mobile number, and completing all necessary security verification steps." },
                   { title: "Preferred Platform", badge: "Recommended", badgeColor: "bg-blue-100 text-blue-700", desc: "For optimal security, we recommend placing orders and submitting reviews through a web browser (such as Chrome, Edge, or Safari) rather than the mobile application." },
                   { title: "Natural Shopping Habits", badge: "Account Health", badgeColor: "bg-emerald-100 text-emerald-700", desc: "Continue to use your account for regular personal or household purchases. This consistent, varied shopping activity helps maintain a natural customer profile." }
                 ].map((item, idx) => (
                   <div key={idx} className="p-5 rounded-[28px] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                         <div className="flex items-center justify-between gap-2">
                            <h5 className="text-xs font-black text-slate-900 uppercase tracking-tight">{item.title}</h5>
                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${item.badgeColor}`}>{item.badge}</span>
                         </div>
                         <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           {/* Section 2: Reviewing & Rating Best Practices */}
           <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                 <span className="text-lg">⭐</span>
                 <h4 className="text-sm font-black uppercase tracking-wider text-slate-900">Reviewing & Rating Ethics</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {[
                   { title: "Timing Your Submission", badge: "Wait 4 to 5 Days", badgeColor: "bg-amber-100 text-amber-700", desc: "Wait approximately 4 to 5 days after product delivery before posting your rating or review. Do not review immediately upon delivery." },
                   { title: "Authenticity in Writing", badge: "No AI / ChatGPT", badgeColor: "bg-rose-100 text-rose-700", desc: "Please write your reviews in your own words. Avoid using ChatGPT or other AI tools, as automated content is frequently flagged and removed by Amazon." },
                   { title: "Enhance Reviews with Media", badge: "Photos Helpful", badgeColor: "bg-indigo-100 text-indigo-700", desc: "Whenever possible, include original photos with your feedback. Reviews accompanied by media are generally viewed as more helpful and authentic." },
                   { title: "Diversify Rating Scores", badge: "Organic Profile", badgeColor: "bg-emerald-100 text-emerald-700", desc: "On your independent purchases, provide a range of honest ratings (from 1 to 4 stars) where appropriate to keep your reviewer history balanced." },
                   { title: "Avoid High-Frequency Reviewing", badge: "Pacing", badgeColor: "bg-purple-100 text-purple-700", desc: "Distribute your reviewing activity over time. Posting multiple reviews within a short period can trigger automated spam flags by Amazon." }
                 ].map((item, idx) => (
                   <div key={idx} className="p-5 rounded-[28px] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                         <div className="flex items-center justify-between gap-2">
                            <h5 className="text-xs font-black text-slate-900 uppercase tracking-tight">{item.title}</h5>
                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${item.badgeColor}`}>{item.badge}</span>
                         </div>
                         <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           {/* Section 3: Data Submission & Privacy Protocols */}
           <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                 <span className="text-lg">🔒</span>
                 <h4 className="text-sm font-black uppercase tracking-wider text-slate-900">Submission & Privacy Protocols</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {[
                   { title: "Official Submission Form", badge: "Strict Rule", badgeColor: "bg-rose-100 text-rose-700", desc: "Please upload all order and rating documentation directly through our official submission form. Don’t share on WhatsApp unless we ask." },
                   { title: "Optimized Documentation", badge: "Pro Tip", badgeColor: "bg-blue-100 text-blue-700", desc: "If possible, use a separate device to take a photograph of your rating screen. This can further enhance the perceived authenticity of the documentation." },
                   { title: "No Review Link Sharing", badge: "Critical Safety", badgeColor: "bg-red-100 text-red-700", desc: "Don’t share review links with anyone on WhatsApp or any other messaging platform. Sharing direct URLs can cause reviews to be flagged." }
                 ].map((item, idx) => (
                   <div key={idx} className="p-5 rounded-[28px] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                         <div className="flex items-center justify-between gap-2">
                            <h5 className="text-xs font-black text-slate-900 uppercase tracking-tight">{item.title}</h5>
                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${item.badgeColor}`}>{item.badge}</span>
                         </div>
                         <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           {/* Visual Sample Reference Gallery */}
           <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                 <span className="text-lg">📸</span>
                 <h4 className="text-sm font-black uppercase tracking-wider text-slate-900">Sample Verification Documentation (Click to Zoom)</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="p-5 rounded-[28px] bg-white border border-slate-100 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">✅ Sample Review Proof</span>
                       <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600">Verified Format</span>
                    </div>
                    <div 
                      onClick={() => setPreviewImage("/samples/rating_review_screenshot.png")}
                      className="aspect-video bg-slate-50 border border-slate-100 rounded-[20px] overflow-hidden flex items-center justify-center cursor-zoom-in relative group shadow-inner"
                    >
                       <img 
                         src="/samples/rating_review_screenshot.png" 
                         alt="Sample Review Screenshot" 
                         className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                         onError={(e: any) => e.target.src = "https://placehold.co/600x400/f8fafc/cbd5e1?text=Review+Sample"}
                       />
                       <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <div className="bg-white/95 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase text-slate-900 shadow-lg scale-90 group-hover:scale-100 transition-transform">🔍 Zoom Photo</div>
                       </div>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Ensure your reviewer profile name, star rating, and review text are clearly visible in the snapshot.</p>
                 </div>

                 <div className="p-5 rounded-[28px] bg-white border border-slate-100 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">✅ Return Window Closed Proof</span>
                       <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-md bg-blue-50 text-blue-600">Verified Format</span>
                    </div>
                    <div 
                      onClick={() => setPreviewImage("/samples/return_period.png")}
                      className="aspect-video bg-slate-50 border border-slate-100 rounded-[20px] overflow-hidden flex items-center justify-center cursor-zoom-in relative group shadow-inner"
                    >
                       <img 
                         src="/samples/return_period.png" 
                         alt="Sample Return Window Screenshot" 
                         className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                         onError={(e: any) => e.target.src = "https://placehold.co/600x400/f8fafc/cbd5e1?text=Return+Window+Sample"}
                       />
                       <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <div className="bg-white/95 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase text-slate-900 shadow-lg scale-90 group-hover:scale-100 transition-transform">🔍 Zoom Photo</div>
                       </div>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Wait until the official return/replacement window expires before submitting your refund claim.</p>
                 </div>
              </div>
           </div>

           {/* Footer Banner */}
           <div className="p-6 md:p-8 rounded-[32px] bg-slate-900 text-white border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                 <div className="h-12 w-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl font-black shrink-0 border border-amber-500/30">
                    🛡️
                 </div>
                 <div>
                    <h4 className="text-sm md:text-base font-black text-white uppercase tracking-wide">The Importance of These Standards</h4>
                    <p className="text-[10px] text-amber-400 font-black uppercase tracking-widest">Account Integrity & Longevity</p>
                 </div>
              </div>
              <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed">
                 Amazon monitors engagement patterns to ensure the integrity of its platform. Adhering to these guidelines helps your account maintain the profile of a standard customer, which protects your reviewing privileges and ensures smooth transaction processing.
              </p>
              <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-400 font-medium">
                 <span>These procedures are implemented for your security and to ensure the longevity of your account.</span>
                 <span className="font-black text-amber-400 uppercase tracking-widest whitespace-nowrap bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 text-center">Thank you — TeamToufik</span>
              </div>
           </div>
        </div>
      )
    },
    {
      id: "status-glossary",
      title: "Statuses",
      desc: "Meanings of tracking status labels.",
      color: "bg-emerald-600",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      content: (
        <div className="space-y-4">
           {[
             { status: "Refund Form Pending", color: "bg-amber-100 text-amber-700", desc: "Deal registered. Now it's time to submit your proofs." },
             { status: "Under Verification", color: "bg-blue-100 text-blue-700", desc: "Our audit team is verifying your review and delivery details." },
             { status: "Refund Authorized", color: "bg-indigo-100 text-indigo-700", desc: "Audit passed! Your payment is being processed by a mediator." },
             { status: "Completed / Refunded", color: "bg-emerald-100 text-emerald-700", desc: "Settlement cleared! Check your UPI wallet for the refund." },
             { status: "Refund Rejected", color: "bg-rose-100 text-rose-700", desc: "Issue found. Please re-check the guidelines or contact support." }
           ].map((s) => (
             <div key={s.status} className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-50 shadow-sm">
                <div className={`h-fit px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${s.color} whitespace-nowrap`}>
                  {s.status}
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{s.desc}</p>
             </div>
           ))}
        </div>
      )
    },
    {
      id: "quick-start",
      title: "Flow Guide",
      desc: "Step-by-step app lifecycle.",
      color: "bg-rose-600",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            {[
              { step: "1", title: "Select & Buy", desc: "Pick a brand deal and purchase from the official store." },
              { step: "2", title: "Register Order", desc: "Use the 'New Order' form to log your purchase ID." },
              { step: "3", title: "Apply Refund", desc: "Once return window closes, submit your proof snapshots." },
              { step: "4", title: "Direct Payout", desc: "Verified mediators transfer funds to your UPI instantly." }
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4 p-5 rounded-[32px] bg-slate-50 border border-slate-100">
                <div className="h-10 w-10 shrink-0 rounded-2xl bg-white flex items-center justify-center text-sm font-black text-slate-900 shadow-sm border border-slate-100">
                  {s.step}
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-wide">{s.title}</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: "user-badges",
      title: "Trust Badges",
      desc: "Unlock tiers by completing orders.",
      color: "bg-emerald-500",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      content: (
        <div className="space-y-8">
           <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100">
              <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest mb-4">Badge Progression System</h3>
              <p className="text-[10px] text-slate-500 font-medium mb-6 leading-relaxed">
                Build your reputation on AspireMint. As you complete more orders, you unlock exclusive tiers that grant you priority access and premium status.
              </p>
              <div className="space-y-3">
                 {[
                   { level: "Bronze", orders: "20+", perks: "Standard Trust Badge", icon: "🥉" },
                   { level: "Silver", orders: "40+", perks: "Priority Support & Profile Flare", icon: "🥈" },
                   { level: "Gold", orders: "70+", perks: "Early Access & Priority Fulfillment", icon: "🏆" },
                   { level: "Platinum", orders: "100+", perks: "Exclusive Community & Swag", icon: "✨" },
                   { level: "Premium", orders: "150+", perks: "Dedicated Manager & VIP Status", icon: "💎" }
                 ].map((b) => (
                   <div key={b.level} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-50 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{b.icon}</span>
                        <div>
                          <p className="text-[10px] font-black text-slate-900 uppercase">{b.level}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{b.orders} Orders</p>
                        </div>
                      </div>
                      <p className="text-[9px] text-emerald-600 font-black uppercase text-right leading-tight max-w-[150px]">
                        {b.perks}
                      </p>
                   </div>
                 ))}
              </div>
           </div>

           <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800">
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-2">How it works?</h3>
              <ul className="space-y-2">
                 {[
                   "Only COMPLETED orders count towards your badges.",
                   "Cancelled or Rejected orders are excluded from progression.",
                   "Badges are updated instantly after your order is settled.",
                   "Check your status premium badge in the dashboard header."
                 ].map((text, i) => (
                   <li key={i} className="flex gap-3 text-[10px] text-slate-400 font-medium leading-relaxed">
                      <span className="text-emerald-500 font-black">0{i+1}</span>
                      {text}
                   </li>
                 ))}
              </ul>
           </div>
        </div>
      )
    },
    {
      id: "order-ss",
      title: "Order SS",
      desc: "Marketplace specific order screenshot samples.",
      color: "bg-blue-500",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      content: (
         <div className="space-y-8">
            <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100">
               <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest mb-2">Order Screenshots</h3>
               <p className="text-[10px] font-medium text-slate-500 leading-relaxed">View how an order screenshot should look for each marketplace.</p>
            </div>
            <MarketplaceImageSelector type="ORDER" setPreviewImage={setPreviewImage} />
         </div>
      )
    },
    {
      id: "return-period-ss",
      title: "Return Period SS",
      desc: "Marketplace specific return period over screenshot samples.",
      color: "bg-indigo-500",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      content: (
         <div className="space-y-8">
            <div className="p-6 rounded-3xl bg-indigo-50 border border-indigo-100">
               <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-2">Return Period Over Screenshots</h3>
               <p className="text-[10px] font-medium text-slate-500 leading-relaxed">View how a return period closed screenshot should look for each marketplace.</p>
            </div>
            <MarketplaceImageSelector type="RETURN" setPreviewImage={setPreviewImage} />
         </div>
      )
    },
    {
      id: "invoice-ss",
      title: "Invoice SS",
      desc: "Invoice screenshot samples (Blinkit Only).",
      color: "bg-emerald-500",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      content: (
         <div className="space-y-8">
            <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100">
               <div className="flex items-center gap-3 mb-2">
                 <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest">Blinkit Invoice Screenshots</h3>
                 <span className="px-2 py-1 bg-emerald-600 text-white text-[8px] font-black uppercase rounded">Blinkit Only</span>
               </div>
               <p className="text-[10px] font-medium text-slate-500 leading-relaxed">Invoice screenshots are strictly required for Blinkit orders only. Other marketplaces do not require invoice screenshots.</p>
            </div>
            <div className="space-y-3">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Blinkit Invoice Snapshot</p>
               <div 
                 onClick={() => setPreviewImage("/samples/blinkit_invoice_ss.jpg")}
                 className="relative w-full rounded-3xl md:rounded-[32px] overflow-hidden shadow-xl shadow-slate-200/50 group cursor-zoom-in h-[350px] md:h-[400px] bg-slate-900 border border-slate-800 flex items-start justify-center p-2 transform-gpu transition-all duration-500 md:hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(79,70,229,0.3)] active:scale-[0.98]"
               >
                  <div className="w-full h-full overflow-hidden rounded-[24px] relative bg-slate-800">
                    <img 
                      src="/samples/blinkit_invoice_ss.jpg" 
                      alt="Blinkit Invoice Sample" 
                      className="w-full h-auto min-h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-700"
                      onError={(e: any) => e.target.src = "https://placehold.co/800x450/f8fafc/cbd5e1?text=Blinkit+Invoice+Coming+Soon"}
                    />
                    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent pointer-events-none" />
                  </div>
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-2.5 bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-[0_10px_30px_rgba(79,70,229,0.5)] group-hover:scale-110 transition-transform">
                    🚀 Scroll Full Image
                  </div>
               </div>
            </div>
         </div>
      )
    }
  ];

  const currentSection = activeSection ? sections.find(s => s.id === activeSection) : sections[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32 md:bg-transparent">
      
      {/* IMAGE PREVIEW LIGHTBOX */}
      <AnimatePresence>
        {previewImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 cursor-zoom-out"
          >
             <button className="absolute top-8 right-8 h-12 w-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all z-[110]">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
             <div 
                className="w-full max-w-2xl max-h-[85vh] overflow-y-auto overflow-x-hidden rounded-[32px] shadow-[0_30px_100px_rgba(0,0,0,0.8)] border border-white/10 scroll-smooth bg-black relative flex justify-start flex-col"
                onClick={(e) => e.stopPropagation()}
             >
                <motion.img 
                   initial={{ scale: 0.9, y: 20 }}
                   animate={{ scale: 1, y: 0 }}
                   src={previewImage} 
                   className="w-full h-auto object-contain min-h-[50vh]"
                />
             </div>
             <p className="mt-8 text-white/50 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Swipe/Scroll to see full length</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MOBILE STICKY HEADER --- */}
      <div className="sticky top-0 z-50 md:hidden bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between">
         <button onClick={() => activeSection ? setActiveSection(null) : router.back()} className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-900 active:scale-90 transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
         </button>
         <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">{activeSection ? currentSection?.title : "Reference Center"}</h2>
         <div className="w-10" />
      </div>

      <div className="mx-auto max-w-6xl px-4 md:px-0 mt-8 md:mt-12">
        
        {/* --- MOBILE HUB VIEW --- */}
        <div className="md:hidden">
           <AnimatePresence mode="wait">
              {!activeSection ? (
                 <motion.div 
                    key="hub"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="grid grid-cols-2 gap-4 pb-10"
                 >
                    {sections.map((s) => (
                       <button
                          key={s.id}
                          onClick={() => setActiveSection(s.id)}
                          className="flex flex-col items-start p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm active:scale-95 transition-all text-left"
                       >
                          <div className={`h-12 w-12 rounded-2xl ${s.color} text-white flex items-center justify-center mb-4 shadow-lg shadow-slate-200`}>
                             {s.icon}
                          </div>
                          <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{s.title}</p>
                          <p className="text-[9px] text-slate-400 font-medium mt-1 leading-tight">{s.desc}</p>
                       </button>
                    ))}
                    <div onClick={() => router.push('/app/support')} className="col-span-2 p-8 rounded-[40px] bg-slate-900 text-white flex items-center justify-between mt-4 shadow-2xl cursor-pointer hover:scale-[1.02] transition-transform">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Need personal aid?</p>
                          <p className="text-lg font-black text-white uppercase tracking-tight">Support</p>
                       </div>
                       <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                       </div>
                    </div>
                 </motion.div>
              ) : (
                 <motion.div
                    key="content"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="pb-20"
                 >
                    <div className="bg-white rounded-[40px] p-6 shadow-sm border border-slate-50 min-h-[500px]">
                       {currentSection?.content}
                    </div>
                 </motion.div>
              )}
           </AnimatePresence>
        </div>

        {/* --- DESKTOP VIEW --- */}
        <div className="hidden md:grid grid-cols-4 gap-12 items-start">
           
           {/* Sidebar */}
           <div className="space-y-8 sticky top-32">
              <div className="px-2">
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Reference Center</h2>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">AspireMint Foundry</p>
              </div>
              <div className="flex flex-col gap-2">
                 {sections.map((s) => (
                   <button
                     key={s.id}
                     onClick={() => setActiveSection(s.id === activeSection ? null : s.id)}
                     className={`group w-full flex items-center gap-4 p-4 rounded-[24px] text-[10px] font-black uppercase tracking-[0.1em] transition-all ${activeSection === s.id ? "bg-white text-blue-600 shadow-2xl shadow-slate-200 border border-slate-100" : "text-slate-400 hover:text-slate-600 hover:bg-white/50"}`}
                   >
                     <div className={`h-10 w-10 rounded-[18px] flex items-center justify-center transition-all ${activeSection === s.id ? "bg-blue-600 text-white shadow-xl shadow-blue-200" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"}`}>
                       {s.icon}
                     </div>
                     {s.title}
                   </button>
                 ))}
              </div>
              
              <div className="p-6 rounded-[32px] bg-slate-900 text-white shadow-xl relative overflow-hidden group border border-slate-800">
                 <div className="relative z-10 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Contact</p>
                    <p className="text-sm font-black text-white uppercase tracking-tight">Direct Support Center</p>
                    <button onClick={() => router.push('/app/support')} className="w-full py-3 bg-blue-600 rounded-xl text-[9px] font-black tracking-widest uppercase hover:bg-blue-700 transition-all">Chat Now</button>
                 </div>
              </div>
           </div>

           {/* Content */}
           <div className="col-span-3">
              <AnimatePresence mode="wait">
                 <motion.div
                   key={activeSection || 'default'}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="rounded-[64px] bg-white p-12 md:p-16 shadow-2xl shadow-slate-200/50 border border-white min-h-[600px]"
                 >
                    {!activeSection ? (
                       <div className="flex flex-col items-center justify-center h-full text-center space-y-6 pt-20">
                          <div className="h-20 w-20 rounded-[32px] bg-slate-50 flex items-center justify-center text-slate-200 shadow-inner">
                             <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.831 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                          </div>
                          <div>
                             <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Master the Protocol</h2>
                             <p className="text-sm font-medium text-slate-400 mt-2">Select a modular guide to optimize your refund rate.</p>
                          </div>
                       </div>
                    ) : (
                       <>
                          <div className="flex items-center gap-6 mb-12">
                             <div className={`h-12 w-12 rounded-2xl ${currentSection?.color} text-white flex items-center justify-center shadow-lg`}>
                                {currentSection?.icon}
                             </div>
                             <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter whitespace-nowrap">
                               {currentSection?.title}
                             </h2>
                             <span className="h-px flex-1 bg-slate-100" />
                          </div>
                          {currentSection?.content}
                       </>
                    )}
                 </motion.div>
              </AnimatePresence>
           </div>
        </div>

      </div>
    </div>
  );
}
