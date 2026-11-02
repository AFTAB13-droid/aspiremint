"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Smartphone,
  QrCode,
  KeyRound,
  Send,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Info,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";

interface WhatsAppStatusData {
  status: "DISCONNECTED" | "INITIALIZING" | "WAITING_FOR_QR" | "WAITING_FOR_PAIRING" | "CONNECTED";
  qrCodeDataUrl: string | null;
  pairingCode: string | null;
  connectedNumber: string | null;
  connectedName: string | null;
  lastConnectedAt: string | null;
  lastError: string | null;
}

export default function AdminWhatsAppPage() {
  const [data, setData] = useState<WhatsAppStatusData>({
    status: "DISCONNECTED",
    qrCodeDataUrl: null,
    pairingCode: null,
    connectedNumber: null,
    connectedName: null,
    lastConnectedAt: null,
    lastError: null,
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"PAIRING_CODE" | "QR_CODE">("PAIRING_CODE");

  // Pairing code form
  const [pairingPhone, setPairingPhone] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  // Test message form
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState(
    "🎉 *AspireMint Test Notification*\n\nHi! This is a test message from AspireMint WhatsApp Gateway. Your automated notifications are working perfectly!"
  );
  const [sendingTest, setSendingTest] = useState(false);
  const [lastSentResult, setLastSentResult] = useState<{ success: boolean; text: string } | null>(null);

  // Poll status
  const fetchStatus = useCallback(async (showToast = false) => {
    try {
      const res = await fetch("/api/admin/whatsapp");
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        if (json.data.pairingCode) {
          setGeneratedCode(json.data.pairingCode);
        }
        if (showToast) toast.success("WhatsApp status refreshed");
      }
    } catch (err) {
      console.error("Failed to fetch WhatsApp status:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Poll every 5s while waiting for pairing or QR scan
    const interval = setInterval(() => {
      fetchStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleRefreshQR = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh_qr" }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        toast.success("New QR code generated");
      } else {
        toast.error(json.message || "Failed to generate QR");
      }
    } catch {
      toast.error("Failed to connect to server");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestPairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairingPhone.trim()) {
      toast.error("Please enter a phone number");
      return;
    }

    setActionLoading(true);
    setGeneratedCode(null);
    try {
      const res = await fetch("/api/admin/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pair",
          phoneNumber: pairingPhone.trim(),
        }),
      });
      const json = await res.json();
      if (json.success && json.code) {
        setGeneratedCode(json.code);
        toast.success("Pairing code generated!");
      } else {
        toast.error(json.error || json.message || "Failed to generate pairing code");
      }
    } catch {
      toast.error("Failed to connect to server");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to unlink and log out this WhatsApp number?")) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("WhatsApp unlinked successfully");
        setGeneratedCode(null);
        await fetchStatus();
      } else {
        toast.error(json.message || "Failed to disconnect");
      }
    } catch {
      toast.error("Network error while unlinking");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCodeCopied(true);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim() || !testMessage.trim()) {
      toast.error("Please fill recipient phone and message text");
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
        toast.success("Message dispatched successfully!");
        setLastSentResult({
          success: true,
          text: `Message delivered! WhatsApp Message ID: ${json.messageId || "OK"}`,
        });
      } else {
        toast.error(json.error || "Failed to send message");
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

  const isConnected = data.status === "CONNECTED";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  WhatsApp Gateway
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Instant, automated WhatsApp order & refund notifications powered by Baileys
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchStatus(true)}
              disabled={loading || actionLoading}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* System Safeguard Notice */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3 text-sm text-emerald-900 dark:text-emerald-200">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold text-emerald-800 dark:text-emerald-300">
              Zero-Downtime Guarantee for AspireMint:
            </strong>{" "}
            The WhatsApp service is fully isolated with an asynchronous fault-tolerant wrapper. Even if the connected
            phone disconnects, runs out of battery, or is unlinked, all AspireMint order updates, refund settlements,
            and email dispatches continue operating with <strong>100% normal success</strong> without any interruption.
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
                    : data.status === "WAITING_FOR_PAIRING" || data.status === "WAITING_FOR_QR"
                    ? "bg-amber-500 animate-pulse"
                    : "bg-red-500"
                }`}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">
                    {isConnected
                      ? "Connected & Live"
                      : data.status === "WAITING_FOR_PAIRING"
                      ? "Waiting for Phone to Enter Pairing Code"
                      : data.status === "WAITING_FOR_QR"
                      ? "Ready for QR Scan"
                      : data.status === "INITIALIZING"
                      ? "Initializing WhatsApp Session..."
                      : "Disconnected"}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      isConnected
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                        : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {data.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {isConnected && data.connectedNumber
                    ? `Active Number: ${data.connectedNumber} ${
                        data.connectedName ? `(${data.connectedName})` : ""
                      }`
                    : "Connect any WhatsApp account by scanning the QR code or using an 8-digit Pairing Code."}
                </p>
              </div>
            </div>

            {isConnected && (
              <button
                onClick={handleDisconnect}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                Unlink & Disconnect
              </button>
            )}
          </div>

          {data.lastError && !isConnected && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{data.lastError}</span>
            </div>
          )}
        </div>

        {/* Pairing / Connection Section (When not connected) */}
        {!isConnected && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="border-b border-slate-200 dark:border-slate-800 p-4 sm:px-6 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-base">Connect WhatsApp Account</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Choose your preferred remote pairing method below
                </p>
              </div>

              {/* Tab Selector */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
                <button
                  onClick={() => setActiveTab("PAIRING_CODE")}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                    activeTab === "PAIRING_CODE"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  8-Digit Pairing Code (Remote)
                </button>
                <button
                  onClick={() => {
                    setActiveTab("QR_CODE");
                    if (!data.qrCodeDataUrl) handleRefreshQR();
                  }}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                    activeTab === "QR_CODE"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Scan QR Code
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === "PAIRING_CODE" ? (
                /* Tab 1: Pairing Code Form */
                <div className="max-w-xl mx-auto space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-4 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-3">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <strong>Best for remote clients:</strong> The client doesn't need to be in front of your screen
                      or scan anything! Just enter their phone number below, generate the 8-digit code, and send it to
                      them on WhatsApp or SMS.
                    </div>
                  </div>

                  <form onSubmit={handleRequestPairingCode} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Client Phone Number (with Country Code)
                      </label>
                      <div className="relative">
                        <Smartphone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="e.g. 919876543210 or 9876543210"
                          value={pairingPhone}
                          onChange={(e) => setPairingPhone(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        10-digit Indian numbers will automatically be prefixed with 91.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading || !pairingPhone.trim()}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <KeyRound className="w-4 h-4" />
                      {actionLoading ? "Requesting 8-Digit Code..." : "Generate 8-Digit Pairing Code"}
                    </button>
                  </form>

                  {/* Generated Code Display */}
                  <AnimatePresence>
                    {generatedCode && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/40 rounded-2xl p-6 text-center space-y-4"
                      >
                        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                          Pairing Code for WhatsApp (Valid for 2 Minutes)
                        </span>

                        <div className="flex items-center justify-center gap-3">
                          <span className="font-mono text-3xl sm:text-4xl font-bold tracking-widest text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-6 py-3 rounded-xl border border-emerald-300 dark:border-emerald-800 shadow-inner">
                            {generatedCode}
                          </span>
                          <button
                            onClick={() => handleCopyCode(generatedCode)}
                            className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
                            title="Copy code"
                          >
                            {codeCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                          </button>
                        </div>

                        {/* Instructions */}
                        <div className="text-left text-xs text-slate-600 dark:text-slate-300 space-y-2 bg-white/70 dark:bg-slate-900/70 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            Send these 4 steps to your client:
                          </p>
                          <ol className="list-decimal pl-4 space-y-1">
                            <li>
                              Open WhatsApp on your iPhone/Android &gt; <strong>Settings</strong>
                            </li>
                            <li>
                              Tap <strong>Linked Devices</strong> &gt; <strong>Link a Device</strong>
                            </li>
                            <li>
                              Tap <strong>"Link with phone number instead"</strong> at the bottom
                            </li>
                            <li>
                              Enter the 8-digit code:{" "}
                              <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                                {generatedCode}
                              </strong>
                            </li>
                          </ol>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* Tab 2: QR Code Scan */
                <div className="max-w-md mx-auto text-center space-y-4">
                  <div className="p-4 bg-white rounded-2xl inline-block border-2 border-slate-200 dark:border-slate-700 shadow-md">
                    {data.qrCodeDataUrl ? (
                      <img
                        src={data.qrCodeDataUrl}
                        alt="WhatsApp QR Code"
                        className="w-64 h-64 mx-auto rounded-lg"
                      />
                    ) : (
                      <div className="w-64 h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
                        <RefreshCw className="w-8 h-8 animate-spin" />
                        <span className="text-xs">Generating fresh QR code...</span>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                    <p>Open WhatsApp &gt; Settings &gt; Linked Devices &gt; Link a Device &gt; Scan this QR</p>
                  </div>

                  <button
                    onClick={handleRefreshQR}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? "animate-spin" : ""}`} />
                    Regenerate QR Code
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Live Test Message Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Live WhatsApp Message Tester
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Send a live test message to any phone number to verify instant delivery
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
                Recipient Phone Number (with Country Code)
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. 9876543210 or 919876543210"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Message Content (WhatsApp Markdown supported: *bold*, _italics_)
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
                    ⚠️ WhatsApp must be connected before sending messages.
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Gateway is connected and ready to dispatch.
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={sendingTest || !testPhone.trim() || !testMessage.trim()}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {sendingTest ? "Sending via WhatsApp..." : "Send Test Message"}
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
