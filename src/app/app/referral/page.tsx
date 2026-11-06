"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
import { 
  Gift, Share2, Copy, Check, Users, Sparkles, ShieldCheck, 
  Wallet, ArrowRight, ChevronRight, AlertCircle, ShoppingBag, 
  ExternalLink, QrCode, RefreshCw, Trophy, CheckCircle2
} from "lucide-react";
import { SoundFX } from "@/utils/soundEffects";

interface ReferralFriend {
  _id: string;
  refereeName: string;
  refereeMintId: string;
  joinedAt: string;
  status: string;
  hasAmazonOrder: boolean;
  baseRewardEarned: boolean;
  followOnCount: number;
  totalEarned: number;
  maxPotential: number;
  orders: any[];
}

export default function ReferralPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    referralCode: string;
    aspireMintId: string;
    wallet: any;
    stats: any;
    friends: ReferralFriend[];
  } | null>(null);

  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const fetchReferralHub = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/referral");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      toast.error("Failed to load referral details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchReferralHub();
    }
  }, [session]);

  const referralCode = data?.referralCode || (session?.user as any)?.referralId || (session?.user as any)?.aspireMintId || "";
  const inviteUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/signup?ref=${referralCode}` 
    : `https://aspiremint.com/signup?ref=${referralCode}`;

  const handleCopy = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    SoundFX.playCoinChime();
    toast.success("Invite link copied!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    SoundFX.playCoinChime();
    toast.success(`Code ${referralCode} copied!`);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    SoundFX.playCoinChime();
    const text = encodeURIComponent(
      `🎁 Hey! Join AspireMint to get 100% cashback refunds on top Amazon & Flipkart deals!\n\nUse my invite code *${referralCode}* or tap here to sign up:\n${inviteUrl}\n\nComplete your first Amazon order to start earning!`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-7 h-7 text-indigo-600 animate-spin mb-2" />
        <p className="text-xs font-semibold text-slate-500">Loading referral rewards...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto pb-20 space-y-3 sm:space-y-5">
      {/* FULL-WIDTH NATIVE APP HERO HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-b-[32px] sm:rounded-[32px] p-5 sm:p-7 shadow-xl relative overflow-hidden border-b sm:border border-indigo-500/20"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />

        {/* TOP ROW: REWARDS PILL & WALLET SHORTCUT */}
        <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-[10px] font-black uppercase tracking-wider text-indigo-300">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Refer & Earn</span>
          </div>

          <Link
            href="/app/wallet"
            onClick={() => SoundFX.playCoinChime()}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-bold text-white transition active:scale-95"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Wallet: ₹{data?.wallet?.availableBalance || 0}</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </Link>
        </div>

        {/* HERO CONTENT */}
        <div className="relative z-10 my-3.5 space-y-1">
          <h1 className="text-xl sm:text-3xl font-black tracking-tight leading-tight">
            Invite Friends • Earn Up to ₹90
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
            Get <strong className="text-white font-bold">₹50</strong> on their first Amazon deal + <strong className="text-white font-bold">₹10</strong> each for their next 4 orders!
          </p>
        </div>

        {/* COMPACT SHARING ACTION BAR */}
        <div className="relative z-10 mt-3 pt-3 border-t border-white/10 space-y-2.5">
          <button
            onClick={handleWhatsAppShare}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition"
          >
            <Share2 className="w-4 h-4" />
            <span>Share on WhatsApp (Instant)</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyCode}
              className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-mono font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
              <span>Code: {referralCode}</span>
            </button>

            <button
              onClick={() => setShowQrModal(true)}
              className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 transition"
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-300" />
              <span>Show QR Code</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* COMPACT 3-STEP HORIZONTAL STRIP (LESS SCROLLABLE) */}
      <div className="px-3.5 sm:px-0">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs">
          <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 text-center">
            <div className="px-1.5 space-y-0.5">
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 block">STEP 1</span>
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Friend Joins</p>
              <p className="text-[9px] text-slate-400 leading-tight">via your link</p>
            </div>
            <div className="px-1.5 space-y-0.5">
              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 block">STEP 2</span>
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Amazon Deal</p>
              <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 leading-tight">You Get ₹50</p>
            </div>
            <div className="px-1.5 space-y-0.5">
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 block">STEP 3</span>
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Next 4 Deals</p>
              <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 leading-tight">+₹10 each (₹40)</p>
            </div>
          </div>
        </div>
      </div>

      {/* COMPACT FRIENDS LIST (FULL WIDTH CONTAINER) */}
      <div className="px-3.5 sm:px-0">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-[28px] p-4 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                Invited Friends ({data?.friends?.length || 0})
              </h2>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Total: ₹{data?.stats?.totalEarned || 0}
            </span>
          </div>

          {data?.friends?.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <Gift className="w-8 h-8 text-indigo-400 mb-1.5" />
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">No referrals yet</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs">
                Share your invite code with friends to start earning ₹90 for every verified buyer.
              </p>
              <button
                onClick={handleWhatsAppShare}
                className="mt-3 py-2 px-4 rounded-xl bg-indigo-600 text-white font-bold text-[11px] shadow-xs active:scale-95"
              >
                Share on WhatsApp
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.friends?.map((friend) => {
                const progressPct = Math.round((friend.totalEarned / friend.maxPotential) * 100);
                return (
                  <div
                    key={friend._id}
                    className="py-2.5 flex items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {friend.refereeName?.charAt(0) || "U"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {friend.refereeName}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">
                            {friend.refereeMintId}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] mt-0.5">
                          <span className={`px-1.5 py-0.2 rounded font-bold text-[9px] ${
                            friend.hasAmazonOrder
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          }`}>
                            {friend.hasAmazonOrder ? "Amazon ✅" : "Awaiting Amazon ⏳"}
                          </span>
                          <span className="text-slate-400 text-[10px]">
                            {friend.followOnCount}/4 orders
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        ₹{friend.totalEarned} / ₹{friend.maxPotential}
                      </span>
                      <div className="w-16 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                        <div 
                          className="h-full bg-emerald-500 rounded-full" 
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* QR CODE MODAL */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl max-w-xs w-full border border-slate-100 dark:border-slate-800 shadow-2xl text-center space-y-3"
            >
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Scan to Join AspireMint</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Scan with mobile camera to register with code:
              </p>
              
              <div className="p-3 bg-white rounded-xl border inline-block shadow-xs">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(inviteUrl)}`}
                  alt="Referral QR Code"
                  className="w-36 h-36 mx-auto"
                />
              </div>

              <div className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400">
                {referralCode}
              </div>

              <button
                onClick={() => setShowQrModal(false)}
                className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
