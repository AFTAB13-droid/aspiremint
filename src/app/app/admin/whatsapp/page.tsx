"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Smartphone,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Info,
  ExternalLink,
  KeyRound,
  FileCode2,
} from "lucide-react";
import toast from "react-hot-toast";

interface MetaWhatsAppStatus {
  configured: boolean;
  status: "CONNECTED" | "NOT_CONFIGURED" | "AUTH_ERROR";
  provider?: "AISENSY" | "META_CLOUD";
  phoneNumberId?: string;
  displayPhoneNumber?: string;
  verifiedName?: string;
  qualityRating?: string;
  error?: string;
}

export default function AdminWhatsAppPage() {
  const [data, setData] = useState<MetaWhatsAppStatus>({
    configured: false,
    status: "NOT_CONFIGURED",
    error: "Checking configuration...",
  });

  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Test message form
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState(
    "🎉 AspireMint Alert: Your test notification is active and working successfully! Automated order and refund alerts are live."
  );
  const [sendingTest, setSendingTest] = useState(false);
  const [lastSentResult, setLastSentResult] = useState<{ success: boolean; text: string } | null>(null);

  const fetchStatus = useCallback(async (showToast = false) => {
    try {
      const res = await fetch("/api/admin/whatsapp");
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        if (showToast) {
          if (json.data.configured) {
            toast.success(
              json.data.provider === "AISENSY"
                ? "AiSensy WhatsApp Gateway connected!"
                : "Meta Cloud API is connected and verified!"
            );
          } else {
            toast.error(json.data.error || "WhatsApp credentials need configuration");
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch WhatsApp status:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    toast.success(`Copied "${keyName}" to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim() || !testMessage.trim()) {
      toast.error("Please enter recipient phone and message text");
      return;
    }

    setSendingTest(true);
    setLastSentResult(null);
    try {
      const res = await fetch("/api/admin/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-test",
          toPhone: testPhone.trim(),
          message: testMessage.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(
          data.provider === "AISENSY"
            ? "Message dispatched via AiSensy WhatsApp!"
            : "Message dispatched via Meta Cloud API!"
        );
        setLastSentResult({
          success: true,
          text: `Delivered! ${data.provider === "AISENSY" ? "AiSensy ID" : "Meta WAMID"}: ${json.messageId || "SENT"}`,
        });
      } else {
        toast.error(json.error || "Failed to send WhatsApp notification");
        setLastSentResult({
          success: false,
          text: json.error || "Failed to send message",
        });
      }
    } catch (err: any) {
      toast.error("Network error sending test message");
      setLastSentResult({
        success: false,
        text: err.message || "Network error",
      });
    } finally {
      setSendingTest(false);
    }
  };

  const loadSampleTemplate = (type: "REFUND_PAID" | "REFUND_APPROVED" | "ORDER_CREATED") => {
    if (type === "REFUND_PAID") {
      setTestMessage(
        `🎉 *AspireMint - Refund Paid Successfully!*

Hi *Rahul Sharma*,
Great news! Your refund of *₹499.00* for Order *#OD8392019482* (boAt Rockerz) has been successfully paid by *Amit Kumar (Mediator)*.

📋 *Payment Details:*
• *Refund Amount:* ₹499.00
• *Paid By:* Amit Kumar
• *Transaction ID (UTR):* UPI/602910395819
• *Date:* ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}

The amount has been transferred to your registered payment method.
👉 *View Order & Details:* https://deals.aspiremint.in/app/orders/sample-id

_Thank you for choosing AspireMint!_`
      );
    } else if (type === "REFUND_APPROVED") {
      setTestMessage(
        `✅ *AspireMint - Refund Approved!*

Hi *Rahul Sharma*,
Your refund claim for Order *#OD8392019482* (boAt Rockerz) has been *approved* for *₹499.00*.

Your payout is now queued for payment. You will receive another message with the transaction reference once payment is disbursed.
👉 *Check Status:* https://deals.aspiremint.in/app/orders/sample-id`
      );
    } else {
      setTestMessage(
        `📦 *AspireMint - Order Logged Successfully!*

Hi *Rahul Sharma*,
Your order *#OD8392019482* for *boAt* has been successfully registered in our campaign system.
• *Order Amount:* ₹499.00

Once you receive the product and complete your review, fill out the refund form to claim your cashback refund.
👉 *Track Order:* https://deals.aspiremint.in/app/orders/sample-id`
      );
    }
  };

  const isConnected = data.configured && data.status === "CONNECTED";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Meta WhatsApp Cloud API
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                  Official Meta SLA
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                100% Vercel-native, ban-free, zero-downtime automated order & refund notifications
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchStatus(true)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Verify Credentials
            </button>
          </div>
        </div>

        {/* Vercel & Zero-Ban Guarantee Card */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3 text-sm text-emerald-900 dark:text-emerald-200">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold text-emerald-800 dark:text-emerald-300">
              100% Serverless & 0% Ban Risk:
            </strong>{" "}
            Unlike fragile WhatsApp Web bots that get disconnected or banned on Vercel, the <strong>Meta WhatsApp Cloud API</strong> is directly connected to Meta’s enterprise servers. Messages are dispatched in <strong>&lt;0.2 seconds</strong> over HTTP, with zero server overhead and 99.99% uptime.
          </div>
        </div>

        {/* Live Status Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-4 h-4 rounded-full ${
                  isConnected
                    ? "bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"
                    : "bg-amber-500"
                }`}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">
                    {isConnected
                      ? data.provider === "AISENSY"
                        ? "AiSensy Official Partner Connected"
                        : "Meta Cloud API Connected & Verified"
                      : "Configuration Required"}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      isConnected
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                    }`}
                  >
                    {data.status}
                  </span>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {isConnected
                    ? `Verified Sender: ${data.verifiedName || "AspireMint"} • Display: ${data.displayPhoneNumber || "+91 92399 48621"} • Provider: ${data.provider || "Official"}`
                    : "Set your WhatsApp credentials (AISENSY_API_KEY or Meta Cloud) in Vercel to activate automated alerts."}
                </p>
              </div>
            </div>

            {isConnected && (
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-3 py-1.5 rounded-xl text-xs text-emerald-700 dark:text-emerald-300">
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span>Meta Quality: <strong>{data.qualityRating || "GREEN"}</strong></span>
              </div>
            )}
          </div>

          {data.error && !isConnected && (
            <div className="mt-4 p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Status Message:</strong> {data.error}
              </div>
            </div>
          )}
        </div>

        {/* Step-by-Step Meta Setup Guide (When not connected or for reference) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              How to Get Your Meta WhatsApp Credentials (4 Steps)
            </h2>
            <a
              href="https://developers.facebook.com/apps/"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
            >
              Meta Developer Portal
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">1</span>
                Create Free Meta App
              </div>
              <p>
                Visit <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">developers.facebook.com</a> &gt; <strong>Create App</strong> &gt; Select <strong>"Other"</strong> &gt; Type <strong>"Business"</strong> &gt; Add <strong>WhatsApp</strong> product.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">2</span>
                Copy Phone Number ID & Token
              </div>
              <p>
                Under <strong>WhatsApp &gt; API Setup</strong>, you will see a <strong>Phone Number ID</strong> (e.g. <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">1048192847291</code>) and an <strong>Access Token</strong>.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">3</span>
                Add Credentials to Vercel
              </div>
              <p>
                In your <strong>Vercel Dashboard &gt; Project &gt; Settings &gt; Environment Variables</strong>, add:
              </p>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-2 py-1 rounded border">
                  <span>WHATSAPP_PHONE_NUMBER_ID</span>
                  <button onClick={() => handleCopy("WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_PHONE_NUMBER_ID")} className="text-blue-500 hover:text-blue-700">
                    {copiedKey === "WHATSAPP_PHONE_NUMBER_ID" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-2 py-1 rounded border">
                  <span>WHATSAPP_ACCESS_TOKEN</span>
                  <button onClick={() => handleCopy("WHATSAPP_ACCESS_TOKEN", "WHATSAPP_ACCESS_TOKEN")} className="text-blue-500 hover:text-blue-700">
                    {copiedKey === "WHATSAPP_ACCESS_TOKEN" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">4</span>
                Permanent System User Token (Optional)
              </div>
              <p>
                To avoid 24-hr token expiry: in <strong>Business Settings &gt; System Users</strong>, create a system user with <strong>whatsapp_business_messaging</strong> permission to generate a permanent token.
              </p>
            </div>
          </div>
        </div>

        {/* Live Test Message Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Live Meta WhatsApp Message Tester
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Send a live test notification to any phone number to verify instant Meta Cloud API delivery
              </p>
            </div>

            {/* Quick Sample Selector */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-slate-400 self-center mr-1">Sample Templates:</span>
              <button
                type="button"
                onClick={() => loadSampleTemplate("REFUND_PAID")}
                className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg transition"
              >
                Refund Paid
              </button>
              <button
                type="button"
                onClick={() => loadSampleTemplate("REFUND_APPROVED")}
                className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg transition"
              >
                Refund Approved
              </button>
              <button
                type="button"
                onClick={() => loadSampleTemplate("ORDER_CREATED")}
                className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg transition"
              >
                Order Logged
              </button>
            </div>
          </div>

          <form onSubmit={handleSendTestMessage} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Recipient Phone Number (e.g. 9876543210 or 919876543210)
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. 9876543210 (10-digit Indian numbers auto-prefix with 91)"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Message Content
              </label>
              <textarea
                rows={7}
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full p-3.5 font-mono text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none resize-y"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-500">
                {!isConnected ? (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    ⚠️ Configure WHATSAPP_PHONE_NUMBER_ID & WHATSAPP_ACCESS_TOKEN in Vercel first.
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Meta Cloud API is connected and ready to dispatch.
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={sendingTest || !testPhone.trim() || !testMessage.trim()}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {sendingTest ? "Dispatching via Meta API..." : "Send Test Message"}
              </button>
            </div>
          </form>

          {/* Result Alert */}
          {lastSentResult && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${
                lastSentResult.success
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                  : "bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200"
              }`}
            >
              {lastSentResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
              )}
              <div className="leading-relaxed">
                <strong>{lastSentResult.success ? "Success:" : "Failed:"}</strong> {lastSentResult.text}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
