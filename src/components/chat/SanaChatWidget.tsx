"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  MessageCircle, X, Send, Volume2, VolumeX, Mic, MicOff,
  Sparkles, Package, Gift, Wallet, ArrowRight, RefreshCw,
  ExternalLink, CheckCircle2, Clock, AlertCircle, ShoppingBag,
  Square, ChevronDown, Share2, Copy, Check, PartyPopper,
  HelpCircle, PlayCircle, Search
} from "lucide-react";
import { SoundFX } from "@/utils/soundEffects";
import { SanaSpeechEngine } from "@/utils/sanaSpeech";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  speechText?: string;
  cards?: any[];
  timestamp: string;
}

// 🪙 Falling Golden Coin & Confetti Particles
function CelebrationRain() {
  const particles = Array.from({ length: 32 });
  const symbols = ["🪙", "💰", "✨", "🎉", "🪅", "💸", "🌟", "🪙", "✨"];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[99999]">
      {particles.map((_, i) => {
        const symbol = symbols[i % symbols.length];
        const left = Math.random() * 92 + 4; // 4% to 96%
        const delay = Math.random() * 1.5;
        const duration = 2.2 + Math.random() * 1.8;
        const size = 16 + Math.random() * 14;

        return (
          <motion.div
            key={i}
            initial={{ y: -40, x: `${left}%`, opacity: 0, rotate: 0 }}
            animate={{
              y: ["0%", "110%"],
              opacity: [0, 1, 1, 0],
              rotate: [0, Math.random() > 0.5 ? 360 : -360],
              x: [`${left}%`, `${left + (Math.random() * 10 - 5)}%`],
            }}
            transition={{
              duration,
              delay,
              ease: "easeOut",
              repeat: 1,
            }}
            style={{ fontSize: `${size}px` }}
            className="absolute top-0 select-none drop-shadow-md"
          >
            {symbol}
          </motion.div>
        );
      })}
    </div>
  );
}

// Helper to render markdown links as real clickable anchors and clean bold styling without raw asterisks
function renderFormattedContent(content: string) {
  if (!content) return null;

  return content.split("\n").map((line, lIdx) => {
    let cleanLine = line;
    let isBullet = false;

    // Detect bullet points like "- " or "* "
    if (cleanLine.startsWith("- ") || cleanLine.startsWith("* ")) {
      cleanLine = cleanLine.substring(2);
      isBullet = true;
    }

    // Pattern matches:
    // 1. Markdown link: [text](url) -> match[2] = text, match[3] = url
    // 2. Bold text: **text** -> match[4] = text inside **
    // 3. Plain URL: http://... or https://... -> match[5] = url
    const masterRegex = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|(https?:\/\/[^\s)]+))/g;

    const tokens: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let keyIdx = 0;

    while ((match = masterRegex.exec(cleanLine)) !== null) {
      // Normal text before match
      if (match.index > lastIndex) {
        tokens.push(cleanLine.substring(lastIndex, match.index));
      }

      if (match[2] && match[3]) {
        // [text](url) Markdown Link
        tokens.push(
          <a
            key={`md-link-${lIdx}-${keyIdx++}`}
            href={match[3]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-600 dark:text-pink-400 font-bold underline inline-flex items-center gap-0.5 hover:text-pink-700"
          >
            {match[2]}
            <ExternalLink className="w-2.5 h-2.5 inline" />
          </a>
        );
      } else if (match[4]) {
        // **text** Markdown Bold (Renders clean bold text with NO raw asterisks!)
        tokens.push(
          <strong key={`bold-${lIdx}-${keyIdx++}`} className="font-bold text-slate-900 dark:text-white">
            {match[4]}
          </strong>
        );
      } else if (match[5]) {
        // Plain URL
        const url = match[5];
        tokens.push(
          <a
            key={`url-${lIdx}-${keyIdx++}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 dark:text-indigo-400 font-bold underline inline-flex items-center gap-0.5 hover:text-indigo-700 break-all"
          >
            {url.includes("youtube")
              ? "Watch Guide Video 🎥"
              : url.includes("review-finder")
              ? "Flipkart Review Finder 🔍"
              : "Open Link"}
            <ExternalLink className="w-2.5 h-2.5 inline" />
          </a>
        );
      }

      lastIndex = masterRegex.lastIndex;
    }

    // Remaining text after last match
    if (lastIndex < cleanLine.length) {
      tokens.push(cleanLine.substring(lastIndex));
    }

    return (
      <p key={lIdx} className={`${lIdx > 0 ? "mt-1.5" : ""} ${isBullet ? "flex items-start gap-1.5 pl-1" : ""}`}>
        {isBullet && <span className="text-pink-500 font-black shrink-0 mt-0.5">•</span>}
        <span>{tokens.length > 0 ? tokens : cleanLine}</span>
      </p>
    );
  });
}

export default function SanaChatWidget() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isOrdersPage = pathname?.includes("/orders") || false;
  const isReviewFinderPage = pathname?.includes("/review-finder") || false;
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [copiedPitchId, setCopiedPitchId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [quickSuggestions, setQuickSuggestions] = useState<string[]>([
    "📦 Where is my refund?",
    "📚 Complete refund process guide",
    "📲 Create WhatsApp invite message",
    "🎁 Show 100% cashback deals",
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionControllerRef = useRef<{ stop: () => void } | null>(null);

  const userName = session?.user?.name ? session.user.name.split(" ")[0] : "Shopper";

  // Initial Welcome Message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome-1",
          role: "assistant",
          content: `Namaste ${userName}! 🌸 I'm **Sana**, your personal AspireMint shopping companion.\n\nI can help you track your **refunds & orders**, claim **100% cashback deals**, or check your **wallet balance & referral rewards**! How can I assist you today?`,
          speechText: `Namaste ${userName}! I'm Sana, your personal shopping companion. How can I assist you with your orders, refunds, or deals today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [userName]);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  // Stop speech when closing widget
  useEffect(() => {
    if (!isOpen) {
      SanaSpeechEngine.stop();
      setIsSpeaking(false);
      setShowCelebration(false);
      if (recognitionControllerRef.current) {
        recognitionControllerRef.current.stop();
        setIsListening(false);
      }
    }
  }, [isOpen]);

  const triggerCelebration = () => {
    setShowCelebration(true);
    SoundFX.playCashRegister();
    setTimeout(() => {
      setShowCelebration(false);
    }, 5500);
  };

  const handleSpeakText = (text: string) => {
    if (!isVoiceEnabled) return;
    setIsSpeaking(true);
    SanaSpeechEngine.speak(
      text,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  };

  const handleStopSpeaking = () => {
    SanaSpeechEngine.stop();
    setIsSpeaking(false);
  };

  const handleToggleVoice = () => {
    if (isVoiceEnabled) {
      handleStopSpeaking();
      setIsVoiceEnabled(false);
      toast("Sana's voice muted", { icon: "🔇" });
    } else {
      setIsVoiceEnabled(true);
      toast("Sana's voice enabled! 🌸", { icon: "🔊" });
      handleSpeakText("Voice enabled! I'm ready to speak with you.");
    }
  };

  // Voice Input (Microphone Dictation)
  const handleToggleVoiceDictation = () => {
    if (isListening) {
      if (recognitionControllerRef.current) {
        recognitionControllerRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    if (!SanaSpeechEngine.isRecognitionSupported()) {
      toast.error("Microphone dictation is not supported in this browser.");
      return;
    }

    handleStopSpeaking();
    setIsListening(true);
    SoundFX.playCoinChime();
    toast("Listening... Speak in Hindi or English", { icon: "🎙️" });

    const controller = SanaSpeechEngine.startListening(
      (transcript) => {
        setIsListening(false);
        if (transcript.trim()) {
          setInputMessage(transcript);
          handleSendMessage(transcript);
        }
      },
      (err) => {
        setIsListening(false);
        toast.error("Could not capture speech. Please type your message.");
      },
      () => {
        setIsListening(false);
      }
    );

    recognitionControllerRef.current = controller;
  };

  // Copy WhatsApp Pitch
  const handleCopyPitch = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPitchId(id);
    SoundFX.playCoinChime();
    toast.success("WhatsApp pitch copied!");
    setTimeout(() => setCopiedPitchId(null), 2500);
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    SoundFX.playCoinChime();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const json = await res.json();

      if (json.success && json.data) {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: json.data.reply,
          speechText: json.data.speechText,
          cards: json.data.cards,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, aiMsg]);
        if (json.data.quickSuggestions?.length) {
          setQuickSuggestions(json.data.quickSuggestions);
        }

        // Trigger Golden Coin Rain Celebration if order is refunded/completed
        if (json.data.celebrate) {
          triggerCelebration();
        }

        // Speak response if voice is enabled
        if (isVoiceEnabled && json.data.speechText) {
          handleSpeakText(json.data.speechText);
        }
      } else {
        const errorMsg: ChatMessage = {
          id: `ai-err-${Date.now()}`,
          role: "assistant",
          content: "I'm having a slight connection hiccup. Please try asking again!",
          speechText: "I had a connection hiccup. Please ask again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err) {
      toast.error("Network error while connecting to Sana");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 🌸 FLOATING SANA TRIGGER BUTTON (SHIFTS VERTICALLY ON ORDERS & REVIEW-FINDER PAGES TO AVOID FAB COLLISIONS) */}
      <div
        className={`fixed z-[9990] transition-all duration-300 ${
          isReviewFinderPage
            ? "bottom-24 right-5 sm:bottom-24 sm:right-6"
            : isOrdersPage
            ? "bottom-24 right-5 sm:bottom-5 sm:right-5"
            : "bottom-5 right-5"
        }`}
      >
        <motion.button
          onClick={() => {
            SoundFX.playCoinChime();
            setIsOpen((prev) => !prev);
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative group flex items-center gap-2.5 p-2.5 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-pink-600 via-rose-500 to-indigo-600 text-white shadow-xl shadow-pink-500/25 border-2 border-white/30 backdrop-blur-md cursor-pointer transition-all"
        >
          {/* Ambient Glowing Wave while speaking */}
          {isSpeaking && (
            <span className="absolute inset-0 rounded-full bg-pink-400 animate-ping opacity-30 pointer-events-none" />
          )}

          {/* SANA AVATAR ICON */}
          <div className="relative w-9 h-9 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border border-white/40 shadow-inner">
            <span className="text-xl">🌸</span>
            {/* Live Green Online Dot */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white" />
          </div>

          {/* Text Pill (Desktop & Tablet) */}
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-black tracking-tight leading-tight flex items-center gap-1.5">
              <span>Sana AI</span>
              {isSpeaking ? (
                <span className="text-[10px] text-pink-200 animate-pulse font-bold">Speaking...</span>
              ) : (
                <Sparkles className="w-3 h-3 text-amber-300" />
              )}
            </span>
            <span className="text-[10px] text-pink-100 font-medium">Order & Cashback Help</span>
          </div>
        </motion.button>
      </div>

      {/* 🌸 CHATBOT WINDOW (BOTTOM SHEET ON MOBILE, FLOATING CARD ON DESKTOP) */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-[9999] flex flex-col justify-end sm:block pointer-events-auto">
            {/* Mobile Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs sm:hidden"
            />

            {/* Chat Box Container */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full sm:w-[430px] h-[88dvh] sm:h-[650px] bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden"
            >
              {/* 🪙 GOLDEN COIN RAIN & CONFETTI CELEBRATION OVERLAY */}
              {showCelebration && <CelebrationRain />}

              {/* TOP HEADER */}
              <div className="p-3.5 sm:p-4 bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-700 text-white flex items-center justify-between shrink-0 shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-10 h-10 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-2xl shadow-inner">
                    🌸
                    {isSpeaking && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-300 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-400" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-sm flex items-center gap-1.5 leading-tight">
                      <span>Sana</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-bold">AI</span>
                    </h3>
                    <p className="text-[11px] text-pink-100 font-medium">
                      {isSpeaking ? "🔊 Speaking aloud..." : "Speaks Hindi, Hinglish & English"}
                    </p>
                  </div>
                </div>

                {/* HEADER CONTROLS */}
                <div className="flex items-center gap-1">
                  {/* Test Party Celebration Button */}
                  <button
                    onClick={triggerCelebration}
                    title="Celebration Effect"
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
                  >
                    <PartyPopper className="w-3.5 h-3.5 text-amber-300" />
                  </button>

                  {/* Stop Speech Button */}
                  {isSpeaking && (
                    <button
                      onClick={handleStopSpeaking}
                      title="Stop Voice"
                      className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition active:scale-95"
                    >
                      <Square className="w-3.5 h-3.5 fill-white" />
                    </button>
                  )}

                  {/* Toggle Voice Audio Button */}
                  <button
                    onClick={handleToggleVoice}
                    title={isVoiceEnabled ? "Mute Voice" : "Enable Voice"}
                    className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition active:scale-95"
                  >
                    {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-pink-200" />}
                  </button>

                  {/* Close / Minimize */}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition active:scale-95 ml-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* CELEBRATION BANNER (DURING REFUND EVENT) */}
              <AnimatePresence>
                {showCelebration && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 text-slate-950 font-black text-xs py-2 px-4 flex items-center justify-between shadow-inner"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="text-base animate-bounce">🪙</span>
                      <span>Refund Disbursed! Golden Coin Celebration!</span>
                    </span>
                    <span className="text-[10px] uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-full text-white">
                      Verified ✅
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* MESSAGES SCROLL CONTAINER */}
              <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-950/40">
                
                {/* 🌟 4 PROMINENT CENTER-TOP QUICK ACTION CARDS */}
                {messages.length <= 1 && (
                  <div className="pt-1 pb-2 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
                      Quick Assistance & Guides
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Card 1: Track Refund */}
                      <button
                        onClick={() => {
                          setInputMessage("Where is my refund?");
                          handleSendMessage("Where is my refund?");
                        }}
                        className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-left hover:border-pink-300 dark:hover:border-pink-700 shadow-xs transition group cursor-pointer active:scale-95"
                      >
                        <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                          <Package className="w-4 h-4" />
                        </div>
                        <p className="font-bold text-xs text-slate-900 dark:text-white leading-tight">Track My Refund</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Live status & SLA</p>
                      </button>

                      {/* Card 2: 100% Deals */}
                      <button
                        onClick={() => {
                          setInputMessage("Show 100% cashback deals");
                          handleSendMessage("Show 100% cashback deals");
                        }}
                        className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-left hover:border-pink-300 dark:hover:border-pink-700 shadow-xs transition group cursor-pointer active:scale-95"
                      >
                        <div className="w-7 h-7 rounded-xl bg-pink-50 dark:bg-pink-950/50 text-pink-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                          <Gift className="w-4 h-4" />
                        </div>
                        <p className="font-bold text-xs text-slate-900 dark:text-white leading-tight">100% Deals</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Claim live slots</p>
                      </button>

                      {/* Card 3: WhatsApp Invites */}
                      <button
                        onClick={() => {
                          setInputMessage("Create WhatsApp invite message");
                          handleSendMessage("Create WhatsApp invite message");
                        }}
                        className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-left hover:border-pink-300 dark:hover:border-pink-700 shadow-xs transition group cursor-pointer active:scale-95"
                      >
                        <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                          <Share2 className="w-4 h-4" />
                        </div>
                        <p className="font-bold text-xs text-slate-900 dark:text-white leading-tight">WhatsApp Pitch</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Earn ₹90/friend</p>
                      </button>

                      {/* Card 4: Official Process FAQ */}
                      <button
                        onClick={() => {
                          setInputMessage("What is the complete process from ordering to receiving a refund?");
                          handleSendMessage("What is the complete process from ordering to receiving a refund?");
                        }}
                        className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-left hover:border-pink-300 dark:hover:border-pink-700 shadow-xs transition group cursor-pointer active:scale-95"
                      >
                        <div className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                          <HelpCircle className="w-4 h-4" />
                        </div>
                        <p className="font-bold text-xs text-slate-900 dark:text-white leading-tight">Order-to-Refund</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Step-by-step FAQ</p>
                      </button>
                    </div>
                  </div>
                )}

                {messages.map((msg) => {
                  const isUser = msg.role === "user";
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {/* SANA AVATAR ON LEFT */}
                      {!isUser && (
                        <div className="w-7 h-7 rounded-full bg-pink-100 dark:bg-pink-950/60 border border-pink-200 dark:border-pink-800 flex items-center justify-center text-sm shrink-0 self-end mb-1">
                          🌸
                        </div>
                      )}

                      <div className={`max-w-[85%] space-y-2 ${isUser ? "items-end" : "items-start"}`}>
                        {/* TEXT BUBBLE WITH CLICKABLE LINKS */}
                        <div
                          className={`p-3 sm:p-3.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-xs ${
                            isUser
                              ? "bg-indigo-600 text-white rounded-br-xs font-medium"
                              : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-800 rounded-bl-xs"
                          }`}
                        >
                          <div className="whitespace-pre-line font-normal">
                            {renderFormattedContent(msg.content)}
                          </div>

                          {/* REPLAY VOICE BUTTON (FOR SANA) */}
                          {!isUser && (
                            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                              <span className="font-mono">{msg.timestamp}</span>
                              <button
                                onClick={() => handleSpeakText(msg.speechText || msg.content)}
                                className="flex items-center gap-1 text-pink-600 dark:text-pink-400 hover:text-pink-700 font-bold py-0.5 px-2 rounded-md hover:bg-pink-50 dark:hover:bg-pink-950/40 transition active:scale-95"
                              >
                                <Volume2 className="w-3 h-3" />
                                <span>Speak</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 🌟 GENERATIVE UI CARDS (MINI APPS INSIDE CHAT) */}
                        {msg.cards && msg.cards.length > 0 && (
                          <div className="space-y-2.5 w-full pt-1">
                            {msg.cards.map((card, idx) => (
                              <div key={idx}>
                                
                                {/* 📦 ORDER STATUS CARD */}
                                {card.type === "ORDER_STATUS" && (
                                  <div className={`border rounded-2xl p-3 shadow-md space-y-2 ${
                                    card.data.isRefunded 
                                      ? "bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 border-emerald-300 dark:border-emerald-700" 
                                      : "bg-white dark:bg-slate-900 border-indigo-100 dark:border-indigo-900/40"
                                  }`}>
                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                      <div className="flex items-center gap-1.5">
                                        <Package className={`w-4 h-4 ${card.data.isRefunded ? "text-emerald-600" : "text-indigo-600"}`} />
                                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                                          {card.data.aspireOrderId}
                                        </span>
                                      </div>
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                          card.data.statusColor === "emerald"
                                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                            : card.data.statusColor === "blue"
                                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                        }`}
                                      >
                                        {card.data.statusLabel}
                                      </span>
                                    </div>

                                    <div className="text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
                                      <p className="font-bold text-slate-900 dark:text-white truncate">
                                        {card.data.brandName} • {card.data.productCode}
                                      </p>
                                      <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500 pt-1">
                                        <div>
                                          <span className="block text-slate-400">Form Submitted:</span>
                                          <span className="font-bold text-slate-700 dark:text-slate-300">
                                            {card.data.formSubmittedAt}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="block text-slate-400">Expected Refund:</span>
                                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                            {card.data.expectedRefundDate}
                                          </span>
                                        </div>
                                      </div>

                                      {card.data.payoutUtr && (
                                        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[10px] font-mono text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                                          <span>UTR: {card.data.payoutUtr}</span>
                                          <span className="font-bold">Paid ✅</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Action Links */}
                                    <div className="pt-1 flex gap-2">
                                      <Link
                                        href={card.data.actionUrl}
                                        onClick={() => setIsOpen(false)}
                                        className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-center text-[10px] font-bold text-slate-700 dark:text-slate-200"
                                      >
                                        View Order
                                      </Link>
                                      {!card.data.isFormSubmitted && (
                                        <Link
                                          href={card.data.fillFormUrl}
                                          onClick={() => setIsOpen(false)}
                                          className="flex-1 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-center text-[10px] font-bold text-white shadow-xs"
                                        >
                                          Fill Refund Form
                                        </Link>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* 📲 1-TAP WHATSAPP VIRAL PITCH CARDS */}
                                {card.type === "WHATSAPP_PITCH_LIST" && (
                                  <div className="space-y-2.5">
                                    <div className="flex items-center justify-between px-1">
                                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                        <Share2 className="w-3.5 h-3.5" />
                                        <span>Viral WhatsApp Pitches</span>
                                      </span>
                                      <span className="text-[9px] font-mono text-slate-400">1-TAP SHARE</span>
                                    </div>

                                    {card.data.map((pitch: any) => (
                                      <div
                                        key={pitch.id}
                                        className="bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-3 shadow-sm space-y-2"
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                                            {pitch.title}
                                          </span>
                                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                                            High Conversion
                                          </span>
                                        </div>

                                        <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 whitespace-pre-line leading-relaxed font-normal">
                                          {pitch.text}
                                        </p>

                                        <div className="grid grid-cols-2 gap-2 pt-0.5">
                                          <button
                                            onClick={() => handleCopyPitch(pitch.id, pitch.text)}
                                            className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-[10px] flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                                          >
                                            {copiedPitchId === pitch.id ? (
                                              <>
                                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>Copied!</span>
                                              </>
                                            ) : (
                                              <>
                                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                                <span>Copy Pitch</span>
                                              </>
                                            )}
                                          </button>

                                          <a
                                            href={pitch.whatsappUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => {
                                              SoundFX.playCoinChime();
                                              triggerCelebration();
                                            }}
                                            className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-[10px] flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/30 transition cursor-pointer"
                                          >
                                            <Share2 className="w-3.5 h-3.5" />
                                            <span>WhatsApp (1-Tap)</span>
                                          </a>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* 🎁 DEAL LIST CARDS */}
                                {card.type === "DEAL_LIST" && (
                                  <div className="space-y-2">
                                    {card.data.map((d: any) => (
                                      <div
                                        key={d.dealId}
                                        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-2.5 shadow-xs flex items-center justify-between gap-2"
                                      >
                                        <div className="min-w-0">
                                          <span className="px-1.5 py-0.2 rounded font-black text-[9px] bg-emerald-100 text-emerald-800 uppercase">
                                            100% Refund
                                          </span>
                                          <p className="font-bold text-xs text-slate-900 dark:text-white truncate mt-0.5">
                                            {d.brandName} - {d.productCode}
                                          </p>
                                          <span className="text-[10px] text-slate-400">
                                            {d.marketplace} • {d.remainingSlots} slots left
                                          </span>
                                        </div>
                                        <Link
                                          href="/app/activedeals"
                                          onClick={() => setIsOpen(false)}
                                          className="py-1 px-2.5 rounded-lg bg-indigo-600 text-white font-bold text-[10px] shrink-0"
                                        >
                                          Claim
                                        </Link>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* 👛 WALLET SUMMARY CARD */}
                                {card.type === "WALLET_SUMMARY" && (
                                  <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-3.5 shadow-md space-y-2.5 border border-indigo-500/20">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-indigo-300 uppercase">My Wallet</span>
                                      <span className="text-[10px] font-mono text-slate-300">{card.data.walletId}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-center">
                                      <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                                        <span className="text-[9px] text-slate-400 uppercase block">Available</span>
                                        <span className="text-base font-black text-emerald-400">₹{card.data.availableBalance}</span>
                                      </div>
                                      <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                                        <span className="text-[9px] text-slate-400 uppercase block">Pending</span>
                                        <span className="text-base font-black text-amber-400">₹{card.data.pendingBalance}</span>
                                      </div>
                                    </div>
                                    <Link
                                      href="/app/wallet"
                                      onClick={() => setIsOpen(false)}
                                      className="w-full py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] flex items-center justify-center gap-1"
                                    >
                                      <span>Open Digital Wallet</span>
                                      <ArrowRight className="w-3 h-3" />
                                    </Link>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {/* LOADING SANA TYPING INDICATOR */}
                {loading && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                    <div className="w-7 h-7 rounded-full bg-pink-100 dark:bg-pink-950/60 flex items-center justify-center text-sm animate-pulse">
                      🌸
                    </div>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">Sana is thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* QUICK SUGGESTION CHIPS (BOTTOM BAR) */}
              <div className="px-3 py-1.5 bg-slate-100/70 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                {quickSuggestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInputMessage(sug);
                      handleSendMessage(sug);
                    }}
                    className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-pink-950/30 text-slate-600 dark:text-slate-300 hover:text-pink-600 border border-slate-200 dark:border-slate-700 text-[10px] font-bold transition active:scale-95 shrink-0"
                  >
                    {sug}
                  </button>
                ))}
              </div>

              {/* BOTTOM INPUT BAR */}
              <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  {/* MICROPHONE VOICE DICTATION BUTTON */}
                  <button
                    type="button"
                    onClick={handleToggleVoiceDictation}
                    title={isListening ? "Listening... click to stop" : "Speak your message"}
                    className={`p-2.5 rounded-xl transition cursor-pointer active:scale-95 shrink-0 ${
                      isListening
                        ? "bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/40"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-pink-600"
                    }`}
                  >
                    {isListening ? <Mic className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                  </button>

                  {/* TEXT INPUT */}
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask Sana anything (e.g. order AM-1042)..."
                    className="flex-1 py-2 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs font-medium outline-hidden focus:ring-2 focus:ring-pink-500/30 border border-transparent focus:border-pink-500 transition"
                  />

                  {/* SEND BUTTON */}
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || loading}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 disabled:opacity-40 text-white transition active:scale-95 shadow-md shadow-pink-500/20 shrink-0 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
