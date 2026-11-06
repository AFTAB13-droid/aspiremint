"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
import { 
  Gift, Share2, Copy, Check, Users, Sparkles, ShieldCheck, 
  Wallet, ArrowRight, ChevronRight, AlertCircle, ShoppingBag, 
  ExternalLink, QrCode, RefreshCw, Trophy
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
    toast.success("Invite link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    SoundFX.playCoinChime();
    toast.success(`Referral code ${referralCode} copied!`);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    SoundFX.playCoinChime();
    const text = encodeURIComponent(
      `🎁 Hey! Join AspireMint to get 100% cashback refunds on top Amazon & Flipkart deals!\n\nUse my exclusive invite code *${referralCode}* or tap this link to register:\n${inviteUrl}\n\nComplete your first Amazon order to start earning!`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-500">Loading your referral rewards...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-6">
      {/* HERO BANNER CARD */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-10 shadow-2xl border border-indigo-500/20"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Earn Up to ₹90 Per Friend</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Share AspireMint.<br className="hidden sm:inline" /> Earn Real Wallet Cash.
            </h1>
            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
              Give your friends 100% cashback deals. Get <strong className="text-white font-bold">₹50</strong> on their first Amazon deal + <strong className="text-white font-bold">₹10</strong> for each of their next 4 orders!
            </p>
          </div>

          {/* QUICK WALLET BALANCE PREVIEW */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col items-center text-center shrink-0 min-w-[200px]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">Wallet Available</span>
            <span className="text-3xl font-black text-white mt-1">₹{data?.wallet?.availableBalance || 0}</span>
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium mt-1">
              <span>Pending: ₹{data?.wallet?.pendingBalance || 0}</span>
            </div>
            <Link
              href="/app/wallet"
              onClick={() => SoundFX.playCoinChime()}
              className="mt-3.5 w-full py-2 px-4 rounded-xl bg-white text-indigo-900 font-black text-xs hover:bg-slate-100 transition shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Wallet className="w-3.5 h-3.5" />
              View Passbook
            </Link>
          </div>
        </div>

        {/* SHARE BAR */}
        <div className="relative z-10 mt-8 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center justify-between bg-black/40 border border-white/15 rounded-2xl p-2.5 px-4">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Your Referral Code</span>
              <span className="text-base font-black tracking-wider text-amber-400">{referralCode}</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 transition text-white"
              title="Copy Referral Code"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition"
            >
              <Share2 className="w-4 h-4" />
              Share on WhatsApp
            </button>
            <button
              onClick={handleCopy}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition"
              title="Copy Link"
            >
              <Copy className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowQrModal(true)}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition"
              title="Show QR Code"
            >
              <QrCode className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* REWARD BREAKDOWN EXPLAINER */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
            1
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Friend Joins</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Your friend signs up using your invite code or link. They are permanently linked to your profile.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-2 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
            2
          </div>
          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-950/80 px-2 py-0.5 rounded-full">
            Amazon Anchor
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">First Amazon Deal = ₹50</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            When your friend verifies their 1st Amazon order, you instantly unlock your <strong className="text-emerald-600 dark:text-emerald-400">₹50 Base Reward</strong>.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
            3
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Next 4 Deals = ₹40</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Earn <strong className="text-emerald-600 dark:text-emerald-400">₹10</strong> on each of their next 4 verified orders on any platform. Total up to ₹90 per friend!
          </p>
        </div>
      </div>

      {/* FRIENDS INVITED TRACKER */}
      <div className="p-6 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Friends You Invited ({data?.friends?.length || 0})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track the deal progress and rewards earned from your referrals
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Total Earned: ₹{data?.stats?.totalEarned || 0}
            </span>
          </div>
        </div>

        {data?.friends?.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <Gift className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">No Friends Invited Yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Share your link on WhatsApp with friends, family, or online groups to earn up to ₹90 for every buyer!
            </p>
            <button
              onClick={handleWhatsAppShare}
              className="mt-5 py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition active:scale-95"
            >
              Invite Your First Friend
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {data?.friends?.map((friend) => {
              const progressPct = Math.round((friend.totalEarned / friend.maxPotential) * 100);
              return (
                <div
                  key={friend._id}
                  className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                      {friend.refereeName?.charAt(0) || "U"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{friend.refereeName}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {friend.refereeMintId}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          friend.hasAmazonOrder
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}>
                          {friend.hasAmazonOrder ? "Amazon Verified ✅" : "Awaiting Amazon Order ⏳"}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Follow-ons: {friend.followOnCount}/4
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-200 dark:border-slate-700 pt-2 sm:pt-0">
                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        ₹{friend.totalEarned} / ₹{friend.maxPotential}
                      </span>
                      <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QR CODE MODAL */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl max-w-sm w-full border border-slate-100 dark:border-slate-800 shadow-2xl text-center space-y-4"
            >
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Scan to Join AspireMint</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Let your friend scan this QR code with their mobile camera to sign up with your code.
              </p>
              
              <div className="p-4 bg-white rounded-2xl border inline-block shadow-inner">
                {/* Embedded QR Image via Google Charts API */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(inviteUrl)}`}
                  alt="Referral QR Code"
                  className="w-44 h-44 mx-auto"
                />
              </div>

              <div className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                Code: {referralCode}
              </div>

              <button
                onClick={() => setShowQrModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs"
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
