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
  QrCode,
  LogOut,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

interface WhatsAppStatus {
  configured: boolean;
  status: "CONNECTED" | "NOT_CONFIGURED" | "AUTH_ERROR" | "NOT_AUTHORIZED";
  provider?: "GREEN_API" | "AISENSY" | "META_CLOUD";
  phoneNumberId?: string;
  displayPhoneNumber?: string;
  verifiedName?: string;
  qualityRating?: string;
  qrCode?: string;
  automatedAlertsEnabled?: boolean;
  error?: string;
}

export default function AdminWhatsAppPage() {
  const [data, setData] = useState<WhatsAppStatus>({
    configured: false,
    status: "NOT_CONFIGURED",
    error: "Checking WhatsApp configuration...",
  });

  const [loading, setLoading] = useState(true);
  const [unlinking, setUnlinking] = useState(false);
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
      setLoading(true);
      const res = await fetch("/api/admin/whatsapp");
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        if (showToast) {
          if (json.data.status === "CONNECTED") {
            toast.success(
              json.data.provider === "GREEN_API"
                ? "Green-API WhatsApp Gateway connected & authorized!"
                : json.data.provider === "AISENSY"
                ? "AiSensy WhatsApp Gateway connected!"
                : "Meta Cloud API connected & verified!"
            );
          } else if (json.data.status === "NOT_AUTHORIZED") {
            toast("Scan the QR code to link your WhatsApp number", { icon: "📱" });
          } else {
            toast.error(json.data.error || "WhatsApp requires configuration");
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

  const handleUnlink = async () => {
    if (!confirm("Are you sure you want to unlink this WhatsApp number? You can link a new number immediately by scanning a new QR code.")) {
      return;
    }
    setUnlinking(true);
    try {
      const res = await fetch("/api/admin/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Device unlinked! You can now scan with a new number.");
        fetchStatus(false);
      } else {
        toast.error(json.message || "Failed to unlink device");
      }
    } catch (err: any) {
      toast.error(err.message || "Network error unlinking device");
    } finally {
      setUnlinking(false);
    }
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
          data.provider === "GREEN_API"
            ? "Dispatched via Green-API Cloud Gateway!"
            : data.provider === "AISENSY"
            ? "Dispatched via AiSensy WhatsApp!"
            : "Dispatched via Meta Cloud API!"
        );
        setLastSentResult({
          success: true,
          text: `Delivered! Message ID: ${json.messageId || "SENT"}`,
        });
      } else {
        toast.error(json.error || "Failed to send WhatsApp message");
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

  const loadSampleTemplate = (type: "REFUND_PAID" | "REFUND_APPROVED" | "REFUND_REJECTED" | "ORDER_CREATED" | "QUICK_PING") => {
    if (type === "REFUND_PAID") {
      setTestMessage(
        `🎉 *AspireMint - Refund Paid Successfully!*

Hello *Rahul Sharma*,
Great news! Your refund of *₹499.00* for Order *#OD8392019482* (boAt Rockerz) has been paid by *Amit Kumar (Mediator)*.

📋 *Payment Details:*
• *Refund Amount:* ₹499.00
• *Paid By:* Amit Kumar
• *Transaction ID (UTR):* UPI/602910395819
• *Date:* ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}

The amount has been transferred to your registered payment method.
👉 *View Order & Details:* https://deals.aspiremint.in/app/orders/sample-id

_Thank you for choosing AspireMint! Reply to this message if you have any questions._`
      );
    } else if (type === "REFUND_APPROVED") {
      setTestMessage(
        `✅ *AspireMint - Refund Approved!*

Hello *Rahul Sharma*,
Your refund claim for Order *#OD8392019482* (boAt Rockerz) has been *approved* for *₹499.00*.

Your payout is now queued for payment. You will receive another message with the UTR reference once payment is disbursed.
👉 *Check Status:* https://deals.aspiremint.in/app/orders/sample-id

_Thank you for choosing AspireMint!_`
      );
    } else if (type === "REFUND_REJECTED") {
      setTestMessage(
        `⚠️ *AspireMint - Refund Update*

Hello *Rahul Sharma*,
Regarding your refund claim for Order *#OD8392019482*:
The review could not be approved due to: *Review screenshot is missing order ID details*.

👉 *Resubmit Details:* https://deals.aspiremint.in/app/orders/sample-id
If you have any questions, reply to this message directly.`
      );
    } else if (type === "ORDER_CREATED") {
      setTestMessage(
        `📦 *AspireMint - Order Logged Successfully!*

Hello *Rahul Sharma*,
Your order *#OD8392019482* for *boAt* has been successfully registered in our system.
• *Order Amount:* ₹499.00

Once you receive the product and complete your review, fill out the refund form to claim your cashback.
👉 *Track Order:* https://deals.aspiremint.in/app/orders/sample-id`
      );
    } else {
      setTestMessage(
        `⚡ *AspireMint WhatsApp Integration Test*

Hello! This is a real-time test notification sent directly from the AspireMint Admin panel via Green-API Cloud Gateway.

Zero Meta restrictions • 100% Vercel Serverless • Automated alerts are operational!`
      );
    }
  };

  const isConnected = data.configured && data.status === "CONNECTED";
  const isNotAuthorized = data.status === "NOT_AUTHORIZED";

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
                  WhatsApp Notification Gateway
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Non-Meta Cloud Gateway
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                100% Vercel Serverless • Automated Order & Refund Alerts • Zero Meta Verification Hurdles
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
              Check Status
            </button>
          </div>
        </div>

        {/* Zero-Meta Serverless Guarantee Card */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3 text-sm text-emerald-900 dark:text-emerald-200">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold text-emerald-800 dark:text-emerald-300">
              100% Serverless & Zero Meta Account Dependencies:
            </strong>{" "}
            AspireMint routes transactional messages through a dedicated 24/7 cloud instance. Vercel performs standard sub-second REST API calls without running heavy local sockets or losing session tokens. No template rejections, no Facebook portfolio bans, and zero downtime.
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
                    : isNotAuthorized
                    ? "bg-amber-500 animate-ping"
                    : "bg-red-500"
                }`}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">
                    {isConnected
                      ? "Green-API Gateway Connected & Active"
                      : isNotAuthorized
                      ? "Action Required: Link WhatsApp Number"
                      : "Configuration Error"}
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
                    ? `Linked Number: ${data.displayPhoneNumber || "Active"} • Instance: 710722791790 • Mode: Non-Meta REST API`
                    : isNotAuthorized
                    ? "Instance is registered. Scan the QR code below using your phone to authorize message dispatching."
                    : data.error || "Verify environment variables in Vercel."}
                </p>
              </div>
            </div>

            {isConnected ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-3 py-1.5 rounded-xl text-xs text-emerald-700 dark:text-emerald-300">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Meta Restrictions: <strong>BYPASSED</strong></span>
                </div>
                <button
                  onClick={handleUnlink}
                  disabled={unlinking}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg transition"
                  title="Unlink this number if you want to switch to a different SIM"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {unlinking ? "Unlinking..." : "Unlink / Change Number"}
                </button>
              </div>
            ) : null}
          </div>

          {data.error && !isConnected && (
            <div className="mt-4 p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Status Note:</strong> {data.error}
              </div>
            </div>
          )}
        </div>

        {/* QR Code Scanner Card (Displayed when Instance is Not Authorized) */}
        {isNotAuthorized && (
          <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/60 border-2 border-emerald-500/40 rounded-2xl p-6 sm:p-8 shadow-md">
            <div className="max-w-xl mx-auto text-center space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                <QrCode className="w-4 h-4" />
                Step 1: Link Your WhatsApp Number
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Scan QR Code with WhatsApp
              </h2>

              <p className="text-sm text-slate-600 dark:text-slate-300">
                Open WhatsApp on your phone &gt; tap <strong>Settings (or ⋮ menu)</strong> &gt; <strong>Linked Devices</strong> &gt; <strong>Link a Device</strong> and point your camera at this QR code.
              </p>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-inner inline-block mx-auto">
                {data.qrCode ? (
                  <img
                    src={`data:image/png;base64,${data.qrCode}`}
                    alt="Scan WhatsApp QR Code"
                    className="w-64 h-64 mx-auto object-contain"
                  />
                ) : (
                  <div className="w-64 h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                    <RefreshCw className="w-8 h-8 animate-spin mb-2" />
                    Generating QR code...
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => fetchStatus(true)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition shadow-sm flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  I Have Scanned It (Refresh Status)
                </button>
                <a
                  href="https://console.green-api.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1 font-medium underline"
                >
                  Open Green-API Console
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Safeguard Notice for Developer Test Account */}
        <div className={`p-4 rounded-xl border flex items-start gap-3 text-sm leading-relaxed ${
          data.automatedAlertsEnabled
            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
            : "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200"
        }`}>
          <Info className={`w-5 h-5 shrink-0 mt-0.5 ${data.automatedAlertsEnabled ? "text-emerald-600" : "text-amber-600"}`} />
          <div>
            <div className="flex items-center gap-2 font-semibold mb-0.5">
              <span>{data.automatedAlertsEnabled ? "Automated Buyer Alerts: ACTIVE" : "🧪 Test Mode Active: Automated Buyer Alerts are PAUSED"}</span>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                data.automatedAlertsEnabled
                  ? "bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200"
                  : "bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200"
              }`}>
                {data.automatedAlertsEnabled ? "LIVE" : "TESTING ONLY"}
              </span>
            </div>
            <p className="text-xs opacity-90">
              {data.automatedAlertsEnabled
                ? "All order creations, refund approvals, and payout alerts are automatically sent to real buyer WhatsApp numbers."
                : "Automated order and refund messages to real buyers are currently suppressed to protect your Green-API Developer test limit. You can freely use the Live Tester below to test sending to your own number."}
            </p>
          </div>
        </div>

        {/* Live Test Message Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Live WhatsApp Message Tester
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Send a live test notification to ANY phone number to verify real-time WhatsApp delivery
              </p>
            </div>

            {/* Quick Sample Selector */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-slate-400 self-center mr-1">Templates:</span>
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
                onClick={() => loadSampleTemplate("REFUND_REJECTED")}
                className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg transition"
              >
                Refund Rejected
              </button>
              <button
                type="button"
                onClick={() => loadSampleTemplate("ORDER_CREATED")}
                className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg transition"
              >
                Order Logged
              </button>
              <button
                type="button"
                onClick={() => loadSampleTemplate("QUICK_PING")}
                className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg transition"
              >
                Quick Ping
              </button>
            </div>
          </div>

          <form onSubmit={handleSendTestMessage} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Recipient Phone Number (e.g. 7990175749 or 917990175749)
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. 7990175749 (10-digit Indian numbers auto-prefix with 91)"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Message Content (Supports full Markdown, *bold*, bullet points, emojis, links)
              </label>
              <textarea
                rows={8}
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full p-3.5 font-mono text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none resize-y"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-500">
                {isNotAuthorized ? (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    ⚠️ Link your WhatsApp number above before sending.
                  </span>
                ) : isConnected ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Green-API Gateway is connected and ready to dispatch.
                  </span>
                ) : (
                  <span className="text-red-500 font-medium">
                    ⚠️ Check your instance configuration in .env.local
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={sendingTest || !testPhone.trim() || !testMessage.trim()}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {sendingTest ? "Dispatching via Green-API..." : "Send Test Message"}
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
