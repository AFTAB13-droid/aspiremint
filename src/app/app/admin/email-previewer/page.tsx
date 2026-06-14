"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, Edit3, Eye, Laptop, Smartphone, Copy, Check, Sparkles, 
  RefreshCw, Trash2, ArrowRight, Settings, Info, CheckCircle2, AlertTriangle, ShieldCheck
} from "lucide-react";
import toast from "react-hot-toast";

type TemplateType = "WELCOME" | "ORDER_CONFIRM" | "REFUND_APPROVED" | "ORDER_SUBMITTED" | "REFUND_REJECTED" | "QUERY_RESOLVED" | "SECURITY_ALERT" | "OTP_VERIFY" | "PAYMENT_OTP";

interface EmailTemplate {
  id: TemplateType;
  name: string;
  subject: string;
  preheader: string;
  description: string;
  defaultVariables: Record<string, string>;
  getHtml: (vars: Record<string, string>) => string;
}


const renderSimpleEmail = (title: string, headerBg: string, headerColor: string, bodyContent: string) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0;">
    <div style="background-color: ${headerBg}; padding: 20px; text-align: center; color: ${headerColor}; font-size: 22px; font-weight: bold;">
      ${title}
    </div>
    <div style="padding: 20px; font-size: 14px; color: #333; line-height: 1.5;">
      ${bodyContent}
      <br><br>
      Thanks,<br>
      <b>AspireMint Admin</b><br><br>
      <div style="text-align: center; font-size: 12px; color: #888;">Developed by Team AspireMint 😎</div>
    </div>
  </div>
</body>
</html>
  `.trim();
};

const renderTable = (rows: { label: string; value: string }[]) => {
  const trs = rows.map(r => `
    <tr>
      <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold; width: 35%;">${r.label}</td>
      <td style="padding: 10px; border: 1px solid #e0e0e0;">${r.value}</td>
    </tr>
  `).join("");
  return `<table style="width: 100%; border-collapse: collapse; border: 1px solid #e0e0e0; margin: 15px 0;">${trs}</table>`;
};

const TEMPLATES: Record<TemplateType, EmailTemplate> = {
  WELCOME: {
    id: "WELCOME",
    name: "User Welcome Onboarding",
    subject: "Welcome to AspireMint - Your Onboarding Journey Begins!",
    preheader: "Get ready to unlock premium verified reviews and brand sponsorships.",
    description: "Sent to new buyers, mediators, and operators upon account creation.",
    defaultVariables: {
      recipientName: "Aarav Sharma",
      userRole: "Buyer Specialist",
      dashboardUrl: "https://aspiremint.com/app",
      supportEmail: "support@aspiremint.com"
    },
    getHtml: (vars) => {
      const details = [
        { label: "Role", value: vars.userRole },
        { label: "Dashboard URL", value: vars.dashboardUrl },
        { label: "Support", value: vars.supportEmail }
      ];
      return renderSimpleEmail("Welcome", "#6f42c1", "#ffffff", `
        Hi <b>${vars.recipientName}</b>,<br><br>
        Welcome to AspireMint! Your account has been successfully created.
        ${renderTable(details)}
        We are excited to have you on board.
      `);
    }
  },
  ORDER_CONFIRM: {
    id: "ORDER_CONFIRM",
    name: "Refund Settlement Verified",
    subject: "Refund Settlement Verified: ₹{{refundAmount}} Approved",
    preheader: "Your product review campaign step has been logged and accepted.",
    description: "Sent to the Buyer once a Mediator confirms their review submission screenshot.",
    defaultVariables: {
      recipientName: "Rohan Das",
      orderId: "AM-2026-99281",
      brandName: "Samsung India",
      productName: "Galaxy Tab S9 FE (Graphite)",
      refundAmount: "34,999.00",
      mediatorName: "Priya Patel",
      settlementDateTime: "May 23, 2026 at 01:50 PM"
    },
    getHtml: (vars) => {
      const details = [
        { label: "Order ID", value: vars.orderId },
        { label: "Brand", value: vars.brandName },
        { label: "Product Name", value: vars.productName },
        { label: "Refund Amount", value: `₹${vars.refundAmount}` },
        { label: "Mediator", value: vars.mediatorName },
        { label: "Settlement Time", value: vars.settlementDateTime }
      ];
      return renderSimpleEmail("Refund Settlement Verified", "#28a745", "#ffffff", `
        Hi <b>${vars.recipientName}</b>,<br><br>
        Your refund has been processed. Log in to the portal for detailed information.
        ${renderTable(details)}
        The amount will be processed soon.
      `);
    }
  },
  REFUND_APPROVED: {
    id: "REFUND_APPROVED",
    name: "Refund Approved",
    subject: "🎉 Great News! Your Refund for Order #{{orderId}} is Approved",
    preheader: "Your refund claim has been verified and authorized. Processing will begin shortly.",
    description: "Sent automatically to the Buyer when an Admin or SubAdmin approves their refund request.",
    defaultVariables: {
      recipientName: "Rohan Das",
      orderId: "AM-2026-99281",
      brandName: "Samsung India",
      productName: "Galaxy Tab S9 FE (Graphite)",
      productCode: "SM-X510",
      refundAmount: "34,999.00",
      approvedByName: "Admin Command",
      approvedDateTime: "May 23, 2026 at 02:45 PM"
    },
    getHtml: (vars) => {
      const details = [
        { label: "Order ID", value: vars.orderId },
        { label: "Brand", value: vars.brandName },
        { label: "Product", value: `${vars.productName} (${vars.productCode})` },
        { label: "Approved Amount", value: `₹${vars.refundAmount}` },
        { label: "Approved By", value: vars.approvedByName }
      ];
      return renderSimpleEmail("Refund Approved", "#28a745", "#ffffff", `
        Hi <b>${vars.recipientName}</b>,<br><br>
        Your refund claim has been approved. Details are as below:
        ${renderTable(details)}
        Payment will be processed soon.
      `);
    }
  },
  ORDER_SUBMITTED: {
    id: "ORDER_SUBMITTED",
    name: "Order Submission Logged",
    subject: "Order Logged: #{{orderId}} - Pending Verification",
    preheader: "Your order details have been securely logged in our system.",
    description: "Sent to Buyer right after they fill the deal application form.",
    defaultVariables: {
      recipientName: "Rohan Das",
      orderId: "AM-2026-10492",
      brandName: "Sony Electronics",
      productName: "WH-1000XM5 Headphones",
      productCode: "SNY-XM5-BLK",
      orderAmount: "29,990.00",
      submissionDateTime: "May 22, 2026 at 11:30 AM"
    },
    getHtml: (vars) => {
      const details = [
        { label: "Brand", value: vars.brandName },
        { label: "Code", value: vars.productCode },
        { label: "Order ID", value: vars.orderId },
        { label: "Profile", value: vars.productName },
        { label: "Order Amount", value: `₹${vars.orderAmount}` },
        { label: "Mediator", value: "System Auto" }
      ];
      return renderSimpleEmail("Order Received", "#ffc107", "#000000", `
        Hi <b>${vars.recipientName}</b>,<br><br>
        Your order has been received successfully. Details are as below:
        ${renderTable(details)}
        Thanks for participating in the campaign.
      `);
    }
  },
  REFUND_REJECTED: {
    id: "REFUND_REJECTED",
    name: "Refund Submission Rejected",
    subject: "Action Required: Your Refund #{{orderId}} was Rejected",
    preheader: "We encountered an issue verifying your refund submission.",
    description: "Sent when Admin or Mediator declines the screenshot proof submitted.",
    defaultVariables: {
      recipientName: "Rohan Das",
      orderId: "AM-2026-88129",
      brandName: "LG Electronics",
      productName: "Ultragear 27-inch Monitor",
      productCode: "LG-27GN800",
      expectedAmount: "22,500.00",
      declineReason: "Mismatched review screenshot. Uploaded image does not contain the specified Amazon profile identifier or order completion ID matching campaign details.",
      declinedDateTime: "May 23, 2026 at 04:15 PM"
    },
    getHtml: (vars) => {
      const details = [
        { label: "Order ID", value: vars.orderId },
        { label: "Reason", value: vars.declineReason },
        { label: "Mediator", value: "System Specialist" }
      ];
      return renderSimpleEmail("Review Rejected", "#dc3545", "#ffffff", `
        Hi <b>${vars.recipientName}</b>,<br><br>
        Your below order has been rejected.
        ${renderTable(details)}
        Please log in to the portal and fill in the details correctly before resubmitting.
      `);
    }
  },
  QUERY_RESOLVED: {
    id: "QUERY_RESOLVED",
    name: "Support Query Resolved",
    subject: "Support Ticket Resolved: #{{ticketId}}",
    preheader: "Your recent support inquiry has been marked as resolved by our team.",
    description: "Sent when an admin or operator closes an open support ticket.",
    defaultVariables: {
      recipientName: "Rohan Das",
      ticketId: "TCK-992-110",
      querySubject: "Payment Delay on LG Monitor Order",
      resolutionMessage: "The payment gateway sync issue was cleared. Your NEFT transfer of ₹22,500 has been initiated. Expect credit within 6 hours.",
      resolvedByName: "Juhi Support Desk",
      resolvedDateTime: "May 23, 2026 at 05:20 PM"
    },
    getHtml: (vars) => {
      const details = [
        { label: "Ticket ID", value: vars.ticketId },
        { label: "Subject", value: vars.querySubject },
        { label: "Resolution", value: vars.resolutionMessage },
        { label: "Resolved By", value: vars.resolvedByName }
      ];
      return renderSimpleEmail("Query Resolved", "#28a745", "#ffffff", `
        Hi <b>${vars.recipientName}</b>,<br><br>
        Your support ticket has been resolved. Details are as below:
        ${renderTable(details)}
        If you have further issues, feel free to reply to this email.
      `);
    }
  },
  SECURITY_ALERT: {
    id: "SECURITY_ALERT",
    name: "Security Login Alert",
    subject: "Security Alert: New Login from unrecognized device",
    preheader: "A new sign-in was detected on your AspireMint account.",
    description: "Sent when a user logs in from a new IP or unrecognized browser.",
    defaultVariables: {
      recipientName: "Rohan Das",
      ipAddress: "103.21.44.112",
      deviceInfo: "Chrome on Windows 11",
      locationInfo: "Mumbai, Maharashtra, India",
      timeOfLogin: "May 24, 2026 at 09:12 AM"
    },
    getHtml: (vars) => {
      const details = [
        { label: "IP Address", value: vars.ipAddress },
        { label: "Device Info", value: vars.deviceInfo },
        { label: "Location", value: vars.locationInfo },
        { label: "Time", value: vars.timeOfLogin }
      ];
      return renderSimpleEmail("Security Alert", "#dc3545", "#ffffff", `
        Hi <b>${vars.recipientName}</b>,<br><br>
        We detected a new login to your account. Details are as below:
        ${renderTable(details)}
        If this was you, you can ignore this email.
      `);
    }
  },
  OTP_VERIFY: {
    id: "OTP_VERIFY",
    name: "Identity Verification OTP",
    subject: "[AspireMint] Security OTP: {{otpCode}}",
    preheader: "Your single-use passcode for identity verification.",
    description: "Sent during MFA scenarios like password reset, important profile changes, or secure logins.",
    defaultVariables: {
      recipientName: "Rohan Das",
      otpCode: "849-211",
      actionType: "Password Reset",
      ipAddress: "103.21.44.112"
    },
    getHtml: (vars) => {
      const details = [
        { label: "Security Code", value: vars.otpCode },
        { label: "Action", value: vars.actionType },
        { label: "Valid For", value: "10 Minutes" }
      ];
      return renderSimpleEmail("Identity Verification", "#4f46e5", "#ffffff", `
        Hi <b>${vars.recipientName}</b>,<br><br>
        Please use the following single-use code to authenticate.
        ${renderTable(details)}
        If you did not request this, please ignore this email.
      `);
    }
  },
  PAYMENT_OTP: {
    id: "PAYMENT_OTP",
    name: "Disbursement Execution OTP",
    subject: "URGENT: Payout Execution OTP for {{orderCount}} Orders (₹{{totalAmount}})",
    preheader: "Authorization required to release escrow funds to buyers.",
    description: "Sent specifically to Admins/Mediators to authorize bulk CSV payouts or individual high-value disbursements.",
    defaultVariables: {
      adminName: "AspireMint Ops",
      otpCode: "552-901",
      orderCount: "42",
      totalAmount: "1,45,200.00",
      batchId: "BAT-990-AM",
      timeOfRequest: "May 24, 2026 at 10:45 AM"
    },
    getHtml: (vars) => {
      const details = [
        { label: "Security Code", value: vars.otpCode },
        { label: "Total Amount", value: `₹${vars.totalAmount}` },
        { label: "Order Count", value: vars.orderCount },
        { label: "Batch ID", value: vars.batchId }
      ];
      return renderSimpleEmail("Disbursement Execution", "#17a2b8", "#ffffff", `
        Hi <b>${vars.adminName}</b>,<br><br>
        Authorization required to release escrow funds.
        ${renderTable(details)}
        If you did not request this, please contact support immediately.
      `);
    }
  }
};

export default function EmailPreviewerPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("WELCOME");
  const [variables, setVariables] = useState<Record<string, string>>(
    TEMPLATES.WELCOME.defaultVariables
  );
  
  const [previewDevice, setPreviewDevice] = useState<"DESKTOP" | "MOBILE">("DESKTOP");
  const [activeTab, setActiveTab] = useState<"PREVIEW" | "HTML">("PREVIEW");
  const [isCopied, setIsCopied] = useState(false);

  const activeTemplate = TEMPLATES[selectedTemplate];

  const handleTemplateChange = (id: TemplateType) => {
    setSelectedTemplate(id);
    setVariables(TEMPLATES[id].defaultVariables);
    setIsCopied(false);
  };

  const handleVariableChange = (key: string, val: string) => {
    setVariables(prev => ({ ...prev, [key]: val }));
    setIsCopied(false);
  };

  const compiledHtml = useMemo(() => {
    return activeTemplate.getHtml(variables);
  }, [activeTemplate, variables]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(compiledHtml);
    setIsCopied(true);
    toast.success("📋 Email HTML Template Copied to Clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="p-4 lg:p-8 bg-slate-50 min-h-screen pb-20">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md uppercase tracking-[0.25em]">Admin Support Tools</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight italic flex items-center gap-3">
              <Mail className="w-8 h-8 text-indigo-600" /> Transactional Email Live Previewer
            </h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
              ✨ Temporary Workspace: Real-time transactional email designer, custom variable editors, and mobile/desktop HTML renderer.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-indigo-900 text-indigo-100 px-5 py-3 rounded-2xl shadow-md border border-indigo-800">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Temporary Admin clearance Page</span>
          </div>
        </div>

        {/* Workspace Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Template list & Variable Editors */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Template Selector Box */}
            <div className="bg-white rounded-[40px] p-6 lg:p-8 shadow-xl border border-slate-100 space-y-6">
              <div>
                <h3 className="text-md font-black text-slate-900 uppercase tracking-tight italic">Email Template Catalog</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Select standard email layout to audit</p>
              </div>

              <div className="space-y-3">
                {Object.values(TEMPLATES).map(tmpl => (
                  <button
                    key={tmpl.id}
                    onClick={() => handleTemplateChange(tmpl.id)}
                    className={`w-full p-4 rounded-2xl border transition-all text-left flex items-start gap-4 ${
                      selectedTemplate === tmpl.id 
                        ? "bg-indigo-50 border-indigo-100 text-indigo-900 shadow-sm" 
                        : "bg-slate-50 border-slate-100 hover:bg-white hover:border-slate-200 text-slate-600"
                    }`}
                  >
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedTemplate === tmpl.id 
                        ? "bg-indigo-600 text-white" 
                        : "bg-slate-200/60 text-slate-400"
                    }`}>
                      <Mail size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-wide truncate">{tmpl.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 mt-1 leading-snug">{tmpl.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Parameter Customizer Box */}
            <div className="bg-white rounded-[40px] p-6 lg:p-8 shadow-xl border border-slate-100 space-y-6">
              <div>
                <h3 className="text-md font-black text-slate-900 uppercase tracking-tight italic flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-600 animate-pulse" /> Content Variables Editor
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Change content strings to preview dynamic variables</p>
              </div>

              <div className="space-y-4">
                {Object.keys(activeTemplate.defaultVariables).map(key => (
                  <div key={key} className="space-y-1.5 pl-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none block">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <input
                      type="text"
                      value={variables[key] || ""}
                      onChange={(e) => handleVariableChange(key, e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500 shadow-inner"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <button
                  onClick={() => setVariables(activeTemplate.defaultVariables)}
                  className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw size={10} /> Reset Default Values
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: Dynamic Live Frame viewport */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Viewport Frame Box */}
            <div className="bg-slate-900 text-white rounded-[44px] p-6 lg:p-8 shadow-2xl relative overflow-hidden flex flex-col h-[700px] justify-between">
              
              {/* Top Control Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5 relative z-10 shrink-0">
                
                {/* Mode Selectors */}
                <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5">
                  <button
                    onClick={() => setActiveTab("PREVIEW")}
                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors ${
                      activeTab === "PREVIEW" 
                        ? "bg-indigo-600 text-white shadow" 
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Live Preview Frame
                  </button>
                  <button
                    onClick={() => setActiveTab("HTML")}
                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors ${
                      activeTab === "HTML" 
                        ? "bg-indigo-600 text-white shadow" 
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Raw HTML Source
                  </button>
                </div>

                {/* Device Sizers (Only in PREVIEW tab) */}
                {activeTab === "PREVIEW" && (
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5 self-start">
                    <button
                      onClick={() => setPreviewDevice("DESKTOP")}
                      className={`h-8 w-12 flex items-center justify-center rounded-lg transition-colors ${
                        previewDevice === "DESKTOP" 
                          ? "bg-indigo-600 text-white" 
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                      title="Desktop View"
                    >
                      <Laptop size={14} />
                    </button>
                    <button
                      onClick={() => setPreviewDevice("MOBILE")}
                      className={`h-8 w-12 flex items-center justify-center rounded-lg transition-colors ${
                        previewDevice === "MOBILE" 
                          ? "bg-indigo-600 text-white" 
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                      title="Mobile View"
                    >
                      <Smartphone size={14} />
                    </button>
                  </div>
                )}

              </div>

              {/* Viewport Canvas Body */}
              <div className="flex-1 my-6 overflow-hidden relative flex justify-center items-center">
                <AnimatePresence mode="wait">
                  
                  {activeTab === "PREVIEW" ? (
                    <motion.div
                      key={`preview-${previewDevice}`}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.3 }}
                      className={`h-full w-full bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center p-4 border border-white/5 shadow-inner transition-all duration-500`}
                    >
                      
                      {/* Interactive responsive frame container */}
                      <div 
                        className={`h-full bg-white rounded-xl overflow-hidden shadow-2xl transition-all duration-500 ${
                          previewDevice === "DESKTOP" 
                            ? "w-full max-w-full" 
                            : "w-[340px]"
                        }`}
                      >
                        
                        {/* Chrome bar header */}
                        <div className="h-8 bg-slate-100 border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-slate-300" />
                            <span className="h-2 w-2 rounded-full bg-slate-300" />
                            <span className="h-2 w-2 rounded-full bg-slate-300" />
                          </div>
                          <span className="text-[7px] font-black uppercase text-slate-400 font-mono tracking-widest truncate max-w-[200px]">
                            {activeTemplate.subject}
                          </span>
                          <div className="w-10" />
                        </div>

                        {/* Interactive iframe dynamic rendering */}
                        <iframe
                          title="Email Live Frame"
                          srcDoc={compiledHtml}
                          className="w-full h-[calc(100%-32px)] border-none bg-slate-50"
                        />

                      </div>

                    </motion.div>
                  ) : (
                    <motion.div
                      key="source-html"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full w-full bg-slate-950 rounded-2xl p-6 border border-white/5 overflow-y-auto custom-scrollbar font-mono text-[9px] text-indigo-200/90 whitespace-pre-wrap select-all leading-normal"
                    >
                      {compiledHtml}
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Bottom Footer Actions */}
              <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Compiled HTML Size: {Math.round(compiledHtml.length / 1024 * 100) / 100} KB
                  </span>
                </div>
                
                <button
                  onClick={handleCopyCode}
                  className="px-6 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 self-end active:scale-95 transition-all"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4" /> Copied HTML Code
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copy Raw HTML Code
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
