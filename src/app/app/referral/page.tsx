"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
import { 
  Gift, Share2, Copy, Check, Users, Sparkles, ShieldCheck, 
  Wallet, ArrowRight, ChevronRight, AlertCircle, ShoppingBag, 
  ExternalLink, QrCode, RefreshCw, Trophy, CheckCircle2, Lock, Flame,
  TrendingUp, HelpCircle
} from "lucide-react";
import { SoundFX } from "@/utils/soundEffects";
import { getDiwaliTimeRemaining, DiwaliCountdownState } from "@/utils/diwaliLaunch";

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
  const [countdown, setCountdown] = useState<DiwaliCountdownState>(getDiwaliTimeRemaining());

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getDiwaliTimeRemaining());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  // -------------------------------------------------------------
  // DIWALI COUNTDOWN & FEATURE LOCK (BEFORE SUNDAY 10:00 AM IST)
  // -------------------------------------------------------------
  if (!countdown.isLive) {
    return (
      <div className="w-full max-w-7xl 2xl:max-w-[1550px] mx-auto pb-24 space-y-4 lg:space-y-6 px-0 md:px-4 lg:px-6">
        
        {/* DESKTOP-ONLY HEADER BAR */}
        <div className="hidden lg:flex items-center justify-between pb-1">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Gift className="w-7 h-7 text-amber-500" />
              <span>Refer & Earn • Festive Diwali Launch</span>
            </h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Live ticking countdown to the official unveiling of AspireMint&apos;s ₹90/friend cash reward hub.
            </p>
          </div>
          <Link
            href="/app/wallet"
            onClick={() => SoundFX.playCoinChime()}
            className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition"
          >
            <Wallet className="w-4 h-4 text-emerald-500" />
            <span>My Wallet (₹{data?.wallet?.availableBalance || 0})</span>
          </Link>
        </div>

        {/* GRAND DIWALI FESTIVE HERO CARD */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full rounded-b-[32px] sm:rounded-[32px] p-6 sm:p-9 text-white shadow-2xl relative overflow-hidden border-b sm:border border-amber-500/40 bg-gradient-to-br from-[#1E110A] via-[#2A1612] to-[#140A1C]"
        >
          {/* Ambient Glows & Sparkles */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-600/20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

          {/* Festive Dhanteras & Diwali Badge */}
          <div className="relative z-10 flex items-center justify-between pb-3 border-b border-amber-500/20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-[11px] font-black uppercase tracking-[0.2em] text-amber-300 shadow-sm">
              <span className="text-sm">🪔</span>
              <span>Happy Dhanteras & Diwali Special</span>
            </div>

            <span className="text-xs font-mono font-bold text-amber-200/80">
              Launch: Sunday 10:00 AM IST
            </span>
          </div>

          {/* DESKTOP 2-COLUMN HERO (STACKED ON MOBILE) */}
          <div className="relative z-10 my-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
            
            {/* LEFT SIDE: HEADLINE & COPY */}
            <div className="lg:col-span-7 space-y-3 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-amber-400">
                <Sparkles className="w-5 h-5 text-amber-300 animate-spin" style={{ animationDuration: "6s" }} />
                <span className="text-xs font-black uppercase tracking-widest text-amber-300">Grand Launch Coming Soon</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 bg-clip-text text-transparent">
                Refer Friends • Earn ₹90 Each
              </h1>

              <p className="text-xs sm:text-sm text-amber-100/90 font-medium leading-relaxed max-w-2xl">
                We are unveiling our biggest cash rewards program this <strong>Sunday, Nov 8 at 10:00 AM IST</strong>! 
                Invite your friends to claim 100% cashback deals and earn <strong>₹90 cash</strong> per friend directly into your UPI account.
              </p>

              {/* ACTION BUTTON (LOCKED WITH FESTIVE CHIME) */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    SoundFX.playCoinChime();
                    toast("🪔 Shubh Dhanteras! Feature unlocks this Sunday at 10:00 AM sharp ✨", { icon: "🪔" });
                  }}
                  className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/30 transition active:scale-98 cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-slate-950" />
                  <span>Unlocks Sunday 10:00 AM • Shubh Dhanteras! 🪔</span>
                </button>
              </div>
            </div>

            {/* RIGHT SIDE: LIVE TICKING 4-DIGIT COUNTDOWN CLOCK */}
            <div className="lg:col-span-5">
              <div className="p-4 sm:p-6 rounded-3xl bg-black/40 border border-amber-500/30 backdrop-blur-md shadow-2xl">
                <p className="text-center text-[11px] font-black uppercase tracking-widest text-amber-300/80 mb-3">
                  Time Remaining Until Live Launch
                </p>
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-amber-500/20 text-center">
                    <span className="text-2xl sm:text-4xl font-black text-amber-300 font-mono tracking-tight block">
                      {countdown.days}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-amber-200/70 block mt-1">
                      Days
                    </span>
                  </div>

                  <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-amber-500/20 text-center">
                    <span className="text-2xl sm:text-4xl font-black text-amber-300 font-mono tracking-tight block">
                      {String(countdown.hours).padStart(2, "0")}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-amber-200/70 block mt-1">
                      Hours
                    </span>
                  </div>

                  <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-amber-500/20 text-center">
                    <span className="text-2xl sm:text-4xl font-black text-amber-300 font-mono tracking-tight block">
                      {String(countdown.minutes).padStart(2, "0")}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-amber-200/70 block mt-1">
                      Mins
                    </span>
                  </div>

                  <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-amber-500/20 text-center">
                    <span className="text-2xl sm:text-4xl font-black text-amber-300 font-mono tracking-tight block">
                      {String(countdown.seconds).padStart(2, "0")}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-amber-200/70 block mt-1">
                      Secs
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* REWARDS FORMULA PREVIEW (LOCKED STATE) */}
          <div className="relative z-10 pt-4 border-t border-amber-500/20 grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-amber-500/20 text-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block mb-0.5">Amazon Anchor</span>
              <p className="text-lg font-black text-white">₹50 Reward</p>
              <span className="text-[10px] text-amber-100/70">On Friend&apos;s 1st Order</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-amber-500/20 text-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block mb-0.5">Next 4 Orders</span>
              <p className="text-lg font-black text-white">4 x ₹10 = ₹40</p>
              <span className="text-[10px] text-amber-100/70">Total ₹90 per friend</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-amber-500/20 text-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block mb-0.5">Wallet Payout</span>
              <p className="text-lg font-black text-white">Min ₹100 • Max ₹900</p>
              <span className="text-[10px] text-amber-100/70">Direct UPI Withdrawal</span>
            </div>
          </div>
        </motion.div>

        {/* 2-COLUMN DESKTOP INFO GRID */}
        <div className="px-3.5 sm:px-0 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8">
          
          {/* COLUMN 1: HOW IT WILL WORK */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Flame className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">How You Will Earn on Sunday</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1.5 border border-slate-100 dark:border-slate-700/50">
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 block">STEP 1</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Share Your Invite Link</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">1-tap WhatsApp share opens Sunday 10:00 AM.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1.5 border border-slate-100 dark:border-slate-700/50">
                <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 block">STEP 2</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Friends Complete Deals</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">Get ₹50 on Amazon order + ₹10 each for next 4 deals.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1.5 border border-slate-100 dark:border-slate-700/50">
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 block">STEP 3</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Instant UPI Withdrawal</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">Withdraw earnings directly to your GPay, PhonePe, or Paytm.</p>
              </div>
            </div>
          </div>

          {/* COLUMN 2: LAUNCH RULES & SAFETY GUARANTEE */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">Launch Rules & Safety</h3>
            </div>
            
            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2.5">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Amazon Anchor:</strong> First reward requires 1 completed & verified Amazon deal.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>7-Day Escrow Shield:</strong> Rewards are held 7 days to protect against cancellation or return.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Cap & Threshold:</strong> Min payout is ₹100, and your wallet can store up to ₹900 at a time!</span>
              </li>
            </ul>
          </div>

        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ACTIVE REFERRAL DASHBOARD (AUTOMATICALLY LIVE ON SUNDAY 10 AM)
  // -------------------------------------------------------------
  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1550px] mx-auto pb-20 space-y-4 lg:space-y-6 px-0 md:px-4 lg:px-6">
      
      {/* DESKTOP-ONLY HEADER BAR */}
      <div className="hidden lg:flex items-center justify-between pb-1">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Gift className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Refer & Earn Growth Hub</span>
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Invite fellow shoppers to 100% refund deals and earn ₹90 for each verified friend.
          </p>
        </div>

        <Link
          href="/app/wallet"
          onClick={() => SoundFX.playCoinChime()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-white font-bold text-xs transition"
        >
          <Wallet className="w-4 h-4 text-emerald-500" />
          <span>Wallet Balance: ₹{data?.wallet?.availableBalance || 0}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </Link>
      </div>

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

        {/* DESKTOP 2-COLUMN HERO (STACKED ON MOBILE) */}
        <div className="relative z-10 my-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* LEFT: TITLE & SHARING */}
          <div className="lg:col-span-8 space-y-2">
            <h1 className="text-xl sm:text-3xl font-black tracking-tight leading-tight">
              Invite Friends • Earn Up to ₹90 Cash
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-2xl">
              Get <strong className="text-white font-bold">₹50</strong> on their first Amazon deal + <strong className="text-white font-bold">₹10</strong> each for their next 4 orders! (Store up to ₹900 in your wallet)
            </p>

            {/* SHARING ACTION BUTTONS */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 max-w-xl">
              <button
                onClick={handleWhatsAppShare}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share on WhatsApp (Instant)</span>
              </button>

              <button
                onClick={handleCopyCode}
                className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-mono font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                <span>Code: {referralCode}</span>
              </button>

              <button
                onClick={() => setShowQrModal(true)}
                className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 transition cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-indigo-300" />
                <span>Show QR</span>
              </button>
            </div>
          </div>

          {/* RIGHT (DESKTOP ONLY): QUICK STATS CARD */}
          <div className="hidden lg:block lg:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-4 text-center space-y-2 backdrop-blur-xs">
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300 block">Your Referral Earnings</span>
            <div className="text-3xl font-black text-emerald-400">
              ₹{data?.stats?.totalEarned || 0}
            </div>
            <p className="text-[11px] text-slate-300">
              {data?.friends?.length || 0} Friends Invited • Min Payout ₹100
            </p>
          </div>

        </div>
      </motion.div>

      {/* 3-STEP HORIZONTAL STRIP (FULL WIDTH) */}
      <div className="px-3.5 sm:px-0">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 sm:p-5 shadow-xs">
          <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 text-center">
            <div className="px-2 space-y-1">
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 block">STEP 1</span>
              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">Friend Joins</p>
              <p className="text-[10px] text-slate-400 leading-tight">via your invite link</p>
            </div>
            <div className="px-2 space-y-1">
              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 block">STEP 2</span>
              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">Amazon Deal</p>
              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 leading-tight">You Get ₹50</p>
            </div>
            <div className="px-2 space-y-1">
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 block">STEP 3</span>
              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">Next 4 Deals</p>
              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 leading-tight">+₹10 each (₹40)</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2-COLUMN DESKTOP GRID: FRIENDS LIST ON LEFT, QR & SHARING WIDGET ON RIGHT */}
      <div className="px-3.5 sm:px-0 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-start">
        
        {/* LEFT COLUMN (WIDE ON DESKTOP): INVITED FRIENDS LIST */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-[28px] p-4 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Invited Friends ({data?.friends?.length || 0})
                </h2>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Total Earned: ₹{data?.stats?.totalEarned || 0}
              </span>
            </div>

            {data?.friends?.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Gift className="w-10 h-10 text-indigo-400 mb-2" />
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No referrals yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Share your invite code with friends to start earning ₹90 for every verified buyer!
                </p>
                <button
                  onClick={handleWhatsAppShare}
                  className="mt-4 py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs active:scale-95 transition cursor-pointer"
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
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-xl transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                          {friend.refereeName?.charAt(0) || "U"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                              {friend.refereeName}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {friend.refereeMintId}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] mt-1">
                            <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                              friend.hasAmazonOrder
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            }`}>
                              {friend.hasAmazonOrder ? "Amazon Verified ✅" : "Awaiting Amazon Order ⏳"}
                            </span>
                            <span className="text-slate-400">
                              {friend.followOnCount}/4 Follow-on Orders
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
                          ₹{friend.totalEarned} / ₹{friend.maxPotential}
                        </span>
                        <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mt-1.5">
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

        {/* RIGHT COLUMN (DESKTOP ONLY WIDGETS): QR SCANNER & LINK BOX */}
        <div className="hidden lg:block lg:col-span-4 space-y-4">
          
          {/* DESKTOP QR CODE CARD */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-xs text-center space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Your Personal QR Code</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Scan with your mobile camera to open your signup link directly:
            </p>
            
            <div className="p-3 bg-white rounded-2xl border inline-block shadow-xs">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(inviteUrl)}`}
                alt="Referral QR Code"
                className="w-40 h-40 mx-auto"
              />
            </div>

            <div className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400">
              Code: {referralCode}
            </div>
          </div>

          {/* DESKTOP DIRECT LINK BOX */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Shareable Invite Link</h4>
            <div className="flex items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="bg-transparent border-none text-[11px] font-mono text-slate-700 dark:text-slate-300 w-full outline-hidden"
              />
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] shrink-0"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* QR CODE MODAL (FOR MOBILE) */}
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
                className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
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
